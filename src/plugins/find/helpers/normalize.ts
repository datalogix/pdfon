const CHARACTERS_TO_NORMALIZE = {
  '\u2010': '-', // Hyphen
  '\u2018': '\'', // Left single quotation mark
  '\u2019': '\'', // Right single quotation mark
  '\u201A': '\'', // Single low-9 quotation mark
  '\u201B': '\'', // Single high-reversed-9 quotation mark
  '\u201C': '"', // Left double quotation mark
  '\u201D': '"', // Right double quotation mark
  '\u201E': '"', // Double low-9 quotation mark
  '\u201F': '"', // Double high-reversed-9 quotation mark
  '\u00BC': '1/4', // Vulgar fraction one quarter
  '\u00BD': '1/2', // Vulgar fraction one half
  '\u00BE': '3/4', // Vulgar fraction three quarters
}

const SYLLABLES_LENGTHS = new Map<string, number>()
const NFKC_CHARS_TO_NORMALIZE = new Map()

let noSyllablesRegExp: RegExp | null = null
let withSyllablesRegExp: RegExp | null = null

export function normalize(text: string) {
  // The diacritics in the text or in the query can be composed or not.
  // So we use a decomposed text using NFD (and the same for the query)
  // in order to be sure that diacritics are in the same order.

  // Collect syllables length and positions.
  const syllablePositions: number[][] = []
  let m
  while ((m = /[\uAC00-\uD7AF\uFA6C\uFACF-\uFAD1\uFAD5-\uFAD7]+/g.exec(text)) !== null) {
    let { index } = m
    for (const char of m[0]) {
      let len = SYLLABLES_LENGTHS.get(char)
      if (!len) {
        len = char.normalize('NFD').length
        SYLLABLES_LENGTHS.set(char, len)
      }
      syllablePositions.push([len, index++])
    }
  }

  let normalizationRegex
  if (syllablePositions.length === 0 && noSyllablesRegExp) {
    normalizationRegex = noSyllablesRegExp
  } else if (syllablePositions.length > 0 && withSyllablesRegExp) {
    normalizationRegex = withSyllablesRegExp
  } else {
    // Compile the regular expression for text normalization once.
    const replace = Object.keys(CHARACTERS_TO_NORMALIZE).join('')
    const toNormalizeWithNFKC = getNormalizeWithNFKC()

    // 3040-309F: Hiragana
    // 30A0-30FF: Katakana
    const CJK = '(?:\\p{Ideographic}|[\u3040-\u30FF])'
    const HKDiacritics = '(?:\u3099|\u309A)'
    const regexp = `([${replace}])|([${toNormalizeWithNFKC}])|(${HKDiacritics}\\n)|(\\p{M}+(?:-\\n)?)|(\\S-\\n)|(${CJK}\\n)|(\\n)`

    if (syllablePositions.length === 0) {
      // Most of the syllables belong to Hangul so there are no need
      // to search for them in a non-Hangul document.
      // We use the \0 in order to have the same number of groups.
      normalizationRegex = noSyllablesRegExp = new RegExp(
        regexp + '|(\\u0000)',
        'gum',
      )
    } else {
      normalizationRegex = withSyllablesRegExp = new RegExp(
        regexp + `|([\\u1100-\\u1112\\ud7a4-\\ud7af\\ud84a\\ud84c\\ud850\\ud854\\ud857\\ud85f])`,
        'gum',
      )
    }
  }

  // The goal of this function is to normalize the string and
  // be able to get from an index in the new string the
  // corresponding index in the old string.
  // For example if we have: abCd12ef456gh where C is replaced by ccc
  // and numbers replaced by nothing (it's the case for diacritics), then
  // we'll obtain the normalized string: abcccdefgh.
  // So here the reverse map is: [0,1,2,2,2,3,6,7,11,12].

  // The goal is to obtain the array: [[0, 0], [3, -1], [4, -2],
  // [6, 0], [8, 3]].
  // which can be used like this:
  //  - let say that i is the index in new string and j the index
  //    the old string.
  //  - if i is in [0; 3[ then j = i + 0
  //  - if i is in [3; 4[ then j = i - 1
  //  - if i is in [4; 6[ then j = i - 2
  //  ...
  // Thanks to a binary search it's easy to know where is i and what's the
  // shift.
  // Let say that the last entry in the array is [x, s] and we have a
  // substitution at index y (old string) which will replace o chars by n chars.
  // Firstly, if o === n, then no need to add a new entry: the shift is
  // the same.
  // Secondly, if o < n, then we push the n - o elements:
  // [y - (s - 1), s - 1], [y - (s - 2), s - 2], ...
  // Thirdly, if o > n, then we push the element: [y - (s - n), o + s - n]

  // Collect diacritics length and positions.
  const rawDiacriticsPositions: number[][] = []
  while ((m = /\p{M}+/gu.exec(text)) !== null) {
    rawDiacriticsPositions.push([m[0].length, m.index])
  }

  let normalized = text.normalize('NFD')
  const positions = [[0, 0]]
  let rawDiacriticsIndex = 0
  let syllableIndex = 0
  let shift = 0
  let shiftOrigin = 0
  let eol = 0
  let hasDiacritics = false

  normalized = normalized.replace(normalizationRegex, (_match, p1, p2, p3, p4, p5, p6, p7, p8, i) => {
    i -= shiftOrigin
    if (p1) {
      // Maybe fractions or quotations mark...
      const replacement = CHARACTERS_TO_NORMALIZE[p1 as keyof typeof CHARACTERS_TO_NORMALIZE]
      const jj = replacement.length
      for (let j = 1; j < jj; j++) {
        positions.push([i - shift + j, shift - j])
      }
      shift -= jj - 1
      return replacement
    }

    if (p2) {
      // Use the NFKC representation to normalize the char.
      let replacement = NFKC_CHARS_TO_NORMALIZE.get(p2)
      if (!replacement) {
        replacement = p2.normalize('NFKC')
        NFKC_CHARS_TO_NORMALIZE.set(p2, replacement)
      }
      const jj = replacement.length
      for (let j = 1; j < jj; j++) {
        positions.push([i - shift + j, shift - j])
      }
      shift -= jj - 1
      return replacement
    }

    if (p3) {
      // We've a Katakana-Hiragana diacritic followed by a \n so don't replace
      // the \n by a whitespace.
      hasDiacritics = true

      // Diacritic.
      if (i + eol === rawDiacriticsPositions[rawDiacriticsIndex]?.[1]) {
        ++rawDiacriticsIndex
      } else {
        // i is the position of the first diacritic
        // so (i - 1) is the position for the letter before.
        positions.push([i - 1 - shift + 1, shift - 1])
        shift -= 1
        shiftOrigin += 1
      }

      // End-of-line.
      positions.push([i - shift + 1, shift])
      shiftOrigin += 1
      eol += 1

      return p3.charAt(0)
    }

    if (p4) {
      const hasTrailingDashEOL = p4.endsWith('\n')
      const len = hasTrailingDashEOL ? p4.length - 2 : p4.length

      // Diacritics.
      hasDiacritics = true
      let jj = len
      if (i + eol === rawDiacriticsPositions[rawDiacriticsIndex]?.[1]) {
        jj -= rawDiacriticsPositions[rawDiacriticsIndex][0]
        ++rawDiacriticsIndex
      }

      for (let j = 1; j <= jj; j++) {
        // i is the position of the first diacritic
        // so (i - 1) is the position for the letter before.
        positions.push([i - 1 - shift + j, shift - j])
      }
      shift -= jj
      shiftOrigin += jj

      if (hasTrailingDashEOL) {
        // Diacritics are followed by a -\n.
        // See comments in `if (p5)` block.
        i += len - 1
        positions.push([i - shift + 1, 1 + shift])
        shift += 1
        shiftOrigin += 1
        eol += 1
        return p4.slice(0, len)
      }

      return p4
    }

    if (p5) {
      // "X-\n" is removed because an hyphen at the end of a line
      // with not a space before is likely here to mark a break
      // in a word.
      // If X is encoded with UTF-32 then it can have a length greater than 1.
      // The \n isn't in the original text so here y = i, n = X.len - 2 and
      // o = X.len - 1.
      const len = p5.length - 2
      positions.push([i - shift + len, 1 + shift])
      shift += 1
      shiftOrigin += 1
      eol += 1
      return p5.slice(0, -2)
    }

    if (p6) {
      // An ideographic at the end of a line doesn't imply adding an extra
      // white space.
      // A CJK can be encoded in UTF-32, hence their length isn't always 1.
      const len = p6.length - 1
      positions.push([i - shift + len, shift])
      shiftOrigin += 1
      eol += 1
      return p6.slice(0, -1)
    }

    if (p7) {
      // eol is replaced by space: "foo\nbar" is likely equivalent to
      // "foo bar".
      positions.push([i - shift + 1, shift - 1])
      shift -= 1
      shiftOrigin += 1
      eol += 1
      return ' '
    }

    // p8
    if (i + eol === syllablePositions[syllableIndex]?.[1]) {
      // A syllable (1 char) is replaced with several chars (n) so
      // newCharsLen = n - 1.
      const newCharLen = syllablePositions[syllableIndex][0] - 1
      ++syllableIndex
      for (let j = 1; j <= newCharLen; j++) {
        positions.push([i - (shift - j), shift - j])
      }
      shift -= newCharLen
      shiftOrigin += newCharLen
    }
    return p8
  })

  positions.push([normalized.length, shift])

  return {
    normalized,
    positions,
    hasDiacritics,
  }
}

let NormalizeWithNFKC
function getNormalizeWithNFKC() {
  NormalizeWithNFKC ||= ' ¨ª¯²-µ¸-º¼-¾Ĳ-ĳĿ-ŀŉſǄ-ǌǱ-ǳʰ-ʸ˘-˝ˠ-ˤʹͺ;΄-΅·ϐ-ϖϰ-ϲϴ-ϵϹևٵ-ٸक़-य़ড়-ঢ়য়ਲ਼ਸ਼ਖ਼-ਜ਼ਫ਼ଡ଼-ଢ଼ำຳໜ-ໝ༌གྷཌྷདྷབྷཛྷཀྵჼᴬ-ᴮᴰ-ᴺᴼ-ᵍᵏ-ᵪᵸᶛ-ᶿẚ-ẛάέήίόύώΆ᾽-῁ΈΉ῍-῏ΐΊ῝-῟ΰΎ῭-`ΌΏ´-῾ - ‑‗․-… ″-‴‶-‷‼‾⁇-⁉⁗ ⁰-ⁱ⁴-₎ₐ-ₜ₨℀-℃℅-ℇ℉-ℓℕ-№ℙ-ℝ℠-™ℤΩℨK-ℭℯ-ℱℳ-ℹ℻-⅀ⅅ-ⅉ⅐-ⅿ↉∬-∭∯-∰〈-〉①-⓪⨌⩴-⩶⫝̸ⱼ-ⱽⵯ⺟⻳⼀-⿕　〶〸-〺゛-゜ゟヿㄱ-ㆎ㆒-㆟㈀-㈞㈠-㉇㉐-㉾㊀-㏿ꚜ-ꚝꝰꟲ-ꟴꟸ-ꟹꭜ-ꭟꭩ豈-嗀塚晴凞-羽蘒諸逸-都飯-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-זּטּ-לּמּנּ-סּףּ-פּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-﷼︐-︙︰-﹄﹇-﹒﹔-﹦﹨-﹫ﹰ-ﹲﹴﹶ-ﻼ！-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ￠-￦'

  const ranges = []
  const range = []
  const diacriticsRegex = /^\p{M}$/u
  // Some chars must be replaced by their NFKC counterpart during a search.
  for (let i = 0; i < 65536; i++) {
    const c = String.fromCharCode(i)
    if (c.normalize('NFKC') !== c && !diacriticsRegex.test(c)) {
      if (range.length !== 2) {
        range[0] = range[1] = i
        continue
      }
      if (range[1] + 1 !== i) {
        if (range[0] === range[1]) {
          ranges.push(String.fromCharCode(range[0]))
        } else {
          ranges.push(
            `${String.fromCharCode(range[0])}-${String.fromCharCode(
              range[1],
            )}`,
          )
        }
        range[0] = range[1] = i
      } else {
        range[1] = i
      }
    }
  }

  if (ranges.join('') !== NormalizeWithNFKC) {
    throw new Error(
      'getNormalizeWithNFKC - update the `NormalizeWithNFKC` string.',
    )
  }

  return NormalizeWithNFKC
}
