// These diacritics aren't considered as combining diacritics
// when searching in a document:
//   https://searchfox.org/mozilla-central/source/intl/unicharutil/util/is_combining_diacritic.py.
// The combining class definitions can be found:
//   https://www.unicode.org/reports/tr44/#Canonical_Combining_Class_Values

// Category 0 corresponds to [^\p{Mn}].
const DIACRITICS_EXCEPTION = new Set([
  // UNICODE_COMBINING_CLASS_KANA_VOICING
  // https://www.compart.com/fr/unicode/combining/8
  0x3099, 0x309a,
  // UNICODE_COMBINING_CLASS_VIRAMA (under 0xFFFF)
  // https://www.compart.com/fr/unicode/combining/9
  0x094d, 0x09cd, 0x0a4d, 0x0acd, 0x0b4d, 0x0bcd, 0x0c4d, 0x0ccd, 0x0d3b,
  0x0d3c, 0x0d4d, 0x0dca, 0x0e3a, 0x0eba, 0x0f84, 0x1039, 0x103a, 0x1714,
  0x1734, 0x17d2, 0x1a60, 0x1b44, 0x1baa, 0x1bab, 0x1bf2, 0x1bf3, 0x2d7f,
  0xa806, 0xa82c, 0xa8c4, 0xa953, 0xa9c0, 0xaaf6, 0xabed,
  // 91
  // https://www.compart.com/fr/unicode/combining/91
  0x0c56,
  // 129
  // https://www.compart.com/fr/unicode/combining/129
  0x0f71,
  // 130
  // https://www.compart.com/fr/unicode/combining/130
  0x0f72, 0x0f7a, 0x0f7b, 0x0f7c, 0x0f7d, 0x0f80,
  // 132
  // https://www.compart.com/fr/unicode/combining/132
  0x0f74,
])

enum CharacterType {
  SPACE = 0,
  ALPHA_LETTER = 1,
  PUNCT = 2,
  HAN_LETTER = 3,
  KATAKANA_LETTER = 4,
  HIRAGANA_LETTER = 5,
  HALFWIDTH_KATAKANA_LETTER = 6,
  THAI_LETTER = 7,
}

export function getCharacterType(charCode: number) {
  const isAlphabeticalScript = (charCode: number) => charCode < 0x2e80
  const isAscii = (charCode: number) => (charCode & 0xff80) === 0
  const isAsciiAlpha = (charCode: number) => ((charCode >= /* a = */ 0x61 && charCode <= /* z = */ 0x7a) || (charCode >= /* A = */ 0x41 && charCode <= /* Z = */ 0x5a))
  const isAsciiDigit = (charCode: number) => charCode >= /* 0 = */ 0x30 && charCode <= /* 9 = */ 0x39
  const isAsciiSpace = (charCode: number) => (charCode === /* SPACE = */ 0x20 || charCode === /* TAB = */ 0x09 || charCode === /* CR = */ 0x0d || charCode === /* LF = */ 0x0a)
  const isHan = (charCode: number) => ((charCode >= 0x3400 && charCode <= 0x9fff) || (charCode >= 0xf900 && charCode <= 0xfaff))
  const isKatakana = (charCode: number) => charCode >= 0x30a0 && charCode <= 0x30ff
  const isHiragana = (charCode: number) => charCode >= 0x3040 && charCode <= 0x309f
  const isHalfwidthKatakana = (charCode: number) => charCode >= 0xff60 && charCode <= 0xff9f
  const isThai = (charCode: number) => (charCode & 0xff80) === 0x0e00

  if (isAlphabeticalScript(charCode)) {
    if (isAscii(charCode)) {
      if (isAsciiSpace(charCode)) {
        return CharacterType.SPACE
      }

      if (
        isAsciiAlpha(charCode)
        || isAsciiDigit(charCode)
        || charCode === /* UNDERSCORE = */ 0x5f
      ) {
        return CharacterType.ALPHA_LETTER
      }

      return CharacterType.PUNCT
    }

    if (isThai(charCode)) {
      return CharacterType.THAI_LETTER
    }

    if (charCode === /* NBSP = */ 0xa0) {
      return CharacterType.SPACE
    }

    return CharacterType.ALPHA_LETTER
  }

  if (isHan(charCode)) {
    return CharacterType.HAN_LETTER
  }

  if (isKatakana(charCode)) {
    return CharacterType.KATAKANA_LETTER
  }

  if (isHiragana(charCode)) {
    return CharacterType.HIRAGANA_LETTER
  }

  if (isHalfwidthKatakana(charCode)) {
    return CharacterType.HALFWIDTH_KATAKANA_LETTER
  }

  return CharacterType.ALPHA_LETTER
}

let DIACRITICS_EXCEPTION_STR // Lazily initialized, see below.

export function convertToRegExpString(query: string, matchDiacritics?: boolean, hasDiacritics?: boolean): [boolean, string] {
  let isUnicode = false

  query = query.replaceAll(
    /([.*+?^${}()|[\]\\])|(\p{P})|(\s+)|(\p{M})|(\p{L})/gu,
    (
      _match,
      p1 /* to escape */,
      p2 /* punctuation */,
      p3 /* whitespaces */,
      p4 /* diacritics */,
      p5, /* letters */
    ) => {
      if (p1) {
        // Escape characters like *+?... to not interfer with regexp syntax.
        return `[ ]*\\${p1}[ ]*`
      }
      if (p2) {
        // Allow whitespaces around punctuation signs.
        return `[ ]*${p2}[ ]*`
      }
      if (p3) {
        // Replace spaces by \s+ to be sure to match any spaces.
        return '[ ]+'
      }
      if (matchDiacritics) {
        return p4 || p5
      }

      if (p4) {
        // Diacritics are removed with few exceptions.
        return DIACRITICS_EXCEPTION.has(p4.charCodeAt(0)) ? p4 : ''
      }

      // A letter has been matched and it can be followed by any diacritics
      // in normalized text.
      if (hasDiacritics) {
        isUnicode = true
        return `${p5}\\p{M}*`
      }
      return p5
    })

  const trailingSpaces = '[ ]*'

  if (query.endsWith(trailingSpaces)) {
    // The [ ]* has been added in order to help to match "foo . bar" but
    // it doesn't make sense to match some whitespaces after the dot
    // when it's the last character.
    query = query.slice(0, query.length - trailingSpaces.length)
  }

  if (matchDiacritics) {
    // aX must not match aXY.
    if (hasDiacritics) {
      DIACRITICS_EXCEPTION_STR ||= String.fromCharCode(...DIACRITICS_EXCEPTION)
      isUnicode = true
      query = `${query}(?=[${DIACRITICS_EXCEPTION_STR}]|[^\\p{M}]|$)`
    }
  }

  return [isUnicode, query]
}

export function isEntireWord(content: string, startIndex: number, length: number) {
  let match = content.slice(0, startIndex).match(/([^\p{M}])\p{M}*$/u)

  if (match) {
    const first = content.charCodeAt(startIndex)
    const limit = match[1].charCodeAt(0)

    if (getCharacterType(first) === getCharacterType(limit)) {
      return false
    }
  }

  match = content.slice(startIndex + length).match(/^\p{M}*([^\p{M}])/u)

  if (match) {
    const last = content.charCodeAt(startIndex + length - 1)
    const limit = match[1].charCodeAt(0)

    if (getCharacterType(last) === getCharacterType(limit)) {
      return false
    }
  }

  return true
}
