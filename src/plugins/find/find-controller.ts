import { Extension } from '@/core/extension'
import { scrollIntoView, serialize } from '@/utils'
import { getOriginalIndex, convertToRegExpString, isEntireWord, normalize } from './helpers'

export enum FindState {
  FOUND = 0,
  NOT_FOUND = 1,
  WRAPPED = 2,
  PENDING = 3,
}

type State = {
  highlightAll?: boolean
  type?: string
  query?: string | string[]
  findPrevious?: boolean
  matchDiacritics?: boolean
  entireWord?: boolean
  caseSensitive?: boolean
}

const FIND_TIMEOUT = 250 // ms
const MATCH_SCROLL_OFFSET_TOP = -50 // px
const MATCH_SCROLL_OFFSET_LEFT = -400 // px

export class FindController extends Extension {
  protected firstPageCapability?: PromiseWithResolvers<void>
  protected findTimeout?: NodeJS.Timeout
  protected extractTextPromises: Promise<void>[] = []
  protected pageContents: string[] = []
  protected pageDiffs: number[][][] = []
  protected hasDiacritics: boolean[] = []
  protected matchesCountTotal = 0
  protected pagesToSearch = 0
  protected pendingFindMatches = new Set()
  protected resumePageIndex?: number
  protected _highlightMatches = false
  protected scrollMatches = false
  protected dirtyMatch = false
  protected _pageMatches: number[][] = []
  protected _pageMatchesLength: number[][] = []
  protected visitedPagesCount = 0
  protected rawQuery?: string
  protected normalizedQuery?: string
  protected _state?: State

  protected _selected = {
    pageIndex: -1,
    matchIndex: -1,
  }

  protected offset: {
    pageIndex?: number
    matchIndex?: number
    wrapped?: boolean
  } = {}

  constructor(protected updateMatchesCountOnProgress = true) {
    super()
    this.reset()
  }

  get highlightMatches() {
    return this._highlightMatches
  }

  get pageMatches() {
    return this._pageMatches
  }

  get pageMatchesLength() {
    return this._pageMatchesLength
  }

  get selected() {
    return this._selected
  }

  get state() {
    return this._state
  }

  getVisiblePages() {
    return this.viewer.getVisiblePages()
  }

  reset() {
    this.firstPageCapability = Promise.withResolvers()
    clearTimeout(this.findTimeout)
    this.findTimeout = undefined
    this.extractTextPromises = []
    this.pageContents = []
    this.pageDiffs = []
    this.hasDiacritics = []
    this.matchesCountTotal = 0
    this.pagesToSearch = 0
    this.pendingFindMatches = new Set()
    this.resumePageIndex = undefined
    this.dirtyMatch = false
    this._highlightMatches = false
    this.scrollMatches = false
    this._pageMatches = []
    this._pageMatchesLength = []
    this.visitedPagesCount = 0
    this.rawQuery = undefined
    this.normalizedQuery = undefined
    this._state = undefined
    this._selected = {
      pageIndex: -1,
      matchIndex: -1,
    }
    this.offset = {
      pageIndex: undefined,
      matchIndex: undefined,
      wrapped: false,
    }
  }

  init() {
    this.firstPageCapability?.resolve()
  }

  find(state?: State) {
    if (!state) {
      return
    }

    const { type } = state

    if (this._state === undefined || this.shouldDirtyMatch(state)) {
      this.dirtyMatch = true
    }

    this._state = state

    if (type !== 'HighlightAllChange') {
      this.updateUIState(FindState.PENDING)
    }

    this.firstPageCapability?.promise.then(() => {
      // If the document was closed before searching began, or if the search
      // operation was relevant for a previously opened document, do nothing.
      if (!this.pdfDocument) {
        return
      }

      this.extractText()

      const findBarClosed = !this._highlightMatches
      const pendingTimeout = !!this.findTimeout

      if (this.findTimeout) {
        clearTimeout(this.findTimeout)
        this.findTimeout = undefined
      }

      if (!type) {
        // Trigger the find action with a small delay to avoid starting the
        // search when the user is still typing (saving resources).
        this.findTimeout = setTimeout(() => {
          this.nextMatch()
          this.findTimeout = undefined
        }, FIND_TIMEOUT)
        return
      }

      if (this.dirtyMatch) {
        // Immediately trigger searching for non-'find' operations, when the
        // current state needs to be reset and matches re-calculated.
        this.nextMatch()
        return
      }

      if (type === 'Again') {
        this.nextMatch()

        // When the find bar was previously closed, and `highlightAll` is set,
        // ensure that the matches on all active pages are highlighted again.
        if (findBarClosed && this._state?.highlightAll) {
          this.updateAllPages()
        }

        return
      }

      if (type === 'HighlightAllChange') {
        // If there was a pending search operation, synchronously trigger a new
        // search *first* to ensure that the correct matches are highlighted.
        if (pendingTimeout) {
          this.nextMatch()
        } else {
          this._highlightMatches = true
        }

        this.updateAllPages() // Update the highlighting on all active pages.
        return
      }

      this.nextMatch()
    })
  }

  close() {
    // Since searching is asynchronous, ensure that the removal of highlighted
    // matches (from the UI) is async too such that the 'UpdateTextLayerMatches'
    // events will always be dispatched in the expected order.
    this.firstPageCapability?.promise.then(() => {
      // Only update the UI if the document is open, and is the current one.
      if (!this.pdfDocument) {
        return
      }

      // Ensure that a pending, not yet started, search operation is aborted.
      if (this.findTimeout) {
        clearTimeout(this.findTimeout)
        this.findTimeout = undefined
      }

      // Abort any long running searches, to avoid a match being scrolled into
      // view *after* the find bar has been closed. In this case `this.offset`
      // will most likely differ from `this._selected`, hence we also ensure
      // that any new search operation will always start with a clean slate.
      if (this.resumePageIndex) {
        this.resumePageIndex = undefined
        this.dirtyMatch = true
      }

      // Avoid the UI being in a pending state when the find bar is re-opened.
      this.updateUIState(FindState.FOUND)

      this._highlightMatches = false
      this.updateAllPages() // Wipe out any previously highlighted matches.
    })
  }

  scrollMatchIntoView({
    element = undefined,
    selectedLeft = 0,
    pageIndex = 1,
    matchIndex = -1,
  }: {
    element?: HTMLElement
    selectedLeft: number
    pageIndex: number
    matchIndex: number
  }) {
    if (!this.scrollMatches || !element) {
      return
    }

    if (matchIndex === -1 || matchIndex !== this._selected.matchIndex) {
      return
    }

    if (pageIndex === -1 || pageIndex !== this._selected.pageIndex) {
      return
    }

    this.scrollMatches = false // Ensure that scrolling only happens once.

    scrollIntoView(element, {
      top: MATCH_SCROLL_OFFSET_TOP,
      left: selectedLeft + MATCH_SCROLL_OFFSET_LEFT,
    }, true)
  }

  protected get query() {
    const query = this._state?.query

    if (typeof query === 'string') {
      if (query !== this.rawQuery) {
        this.rawQuery = query as string
        this.normalizedQuery = normalize(query).normalized
      }

      return this.normalizedQuery
    }

    return (query || []).filter(q => !!q).map(q => normalize(q).normalized)
  }

  protected shouldDirtyMatch(state: State) {
    const newQuery = state.query
    const prevQuery = this._state?.query

    const newType = typeof newQuery
    const prevType = typeof prevQuery

    if (newType !== prevType) {
      return true
    }

    if (newType === 'string') {
      if (newQuery !== prevQuery) {
        return true
      }
    } else if (serialize(newQuery) !== serialize(prevQuery)) {
      return true
    }

    switch (state.type) {
      case 'Again': {
        const pageNumber = this._selected.pageIndex + 1

        return pageNumber >= 1
          && pageNumber <= this.pagesCount
          && pageNumber !== this.page
          && !this.getVisiblePages().ids.has(pageNumber)
      }

      case 'HighlightAllChange':
        return false
    }

    return true
  }

  protected calculateMatch(pageIndex: number) {
    const query = this.query

    if (!query || query?.length === 0) {
      return // Do nothing: the matches should be wiped out already.return
    }

    const pageContent = this.pageContents[pageIndex]
    const matcherResult = this.match(query, pageContent, pageIndex)

    const matches: number[] = (this._pageMatches[pageIndex] = [])
    const matchesLength: number[] = (this._pageMatchesLength[pageIndex] = [])
    const diffs = this.pageDiffs[pageIndex]

    matcherResult?.forEach(({ index, length }) => {
      const [matchPos, matchLen] = getOriginalIndex(diffs, index, length)
      if (matchLen) {
        matches.push(matchPos)
        matchesLength.push(matchLen)
      }
    })

    // When `highlightAll` is set, ensure that the matches on previously
    // rendered (and still active) pages are correctly highlighted.
    if (this._state?.highlightAll) {
      this.updatePage(pageIndex)
    }

    if (this.resumePageIndex === pageIndex) {
      this.resumePageIndex = undefined
      this.nextPageMatch()
    }

    // Update the match count.
    const pageMatchesCount = matches.length
    this.matchesCountTotal += pageMatchesCount
    if (this.updateMatchesCountOnProgress) {
      if (pageMatchesCount > 0) {
        this.dispatch('UpdateFindMatchesCount', { matchesCount: this.requestMatchesCount() })
      }
    } else if (++this.visitedPagesCount === this.pagesCount) {
      // For example, in GeckoView we want to have only the final update because
      // the Java side provides only one object to update the counts.
      this.dispatch('UpdateFindMatchesCount', { matchesCount: this.requestMatchesCount() })
    }
  }

  protected match(query: string | string[], pageContent: string, pageIndex: number) {
    const hasDiacritics = this.hasDiacritics[pageIndex]

    let isUnicode = false
    if (typeof query === 'string') {
      [isUnicode, query] = convertToRegExpString(query, this._state?.matchDiacritics, hasDiacritics)
    } else if (Array.isArray(query)) {
      // Words are sorted in reverse order to be sure that "foobar" is matched
      // before "foo" in case the query is "foobar foo".
      query = query
        .sort()
        .reverse()
        .map((q) => {
          const [isUnicodePart, queryPart] = convertToRegExpString(q, this._state?.matchDiacritics, hasDiacritics)
          isUnicode ||= isUnicodePart
          return `(${queryPart})`
        })
        .join('|')
    }

    if (!query) {
      // The query can be empty because some chars like diacritics could have
      // been stripped out.
      return undefined
    }

    const flags = `g${isUnicode ? 'u' : ''}${this._state?.caseSensitive ? '' : 'i'}`
    const newQuery = new RegExp(query, flags)
    const matches = []
    let match

    while ((match = newQuery.exec(pageContent)) !== null) {
      if (this._state?.entireWord
        && !isEntireWord(pageContent, match.index, match[0].length)
      ) {
        continue
      }

      matches.push({ index: match.index, length: match[0].length })
    }

    return matches
  }

  protected extractText() {
    // Perform text extraction once if this method is called multiple times.
    if (this.extractTextPromises.length > 0) {
      return
    }

    let deferred = Promise.resolve()
    const textOptions = { disableNormalization: true }

    for (let i = 0, ii = this.pagesCount; i < ii; i++) {
      const { promise, resolve } = Promise.withResolvers<void>()
      this.extractTextPromises[i] = promise

      deferred = deferred.then(() => {
        return this.pdfDocument?.getPage(i + 1)
          .then(pdfPage => pdfPage.getTextContent(textOptions))
          .then((textContent) => {
            const strBuf = []

            for (const textItem of textContent.items) {
              if ('str' in textItem) {
                strBuf.push(textItem.str)
              }

              if ('hasEOL' in textItem && textItem.hasEOL) {
                strBuf.push('\n')
              }
            }

            // Store the normalized page content (text items) as one string.
            const normalized = normalize(strBuf.join(''))
            this.pageContents[i] = normalized.normalized
            this.pageDiffs[i] = normalized.positions
            this.hasDiacritics[i] = normalized.hasDiacritics
            resolve()
          }, (reason) => {
            this.logger.error(`Unable to get text content for page ${i + 1}`, reason)
            this.pageContents[i] = ''
            this.pageDiffs[i] = []
            this.hasDiacritics[i] = false
            resolve()
          })
      })
    }
  }

  protected updatePage(index: number) {
    if (this.scrollMatches && this._selected.pageIndex === index) {
      // If the page is selected, scroll the page into view, which triggers
      // rendering the page, which adds the text layer. Once the text layer
      // is built, it will attempt to scroll the selected match into view.
      this.page = index + 1
    }

    this.dispatch('UpdateTextLayerMatches', { pageIndex: index })
  }

  protected updateAllPages() {
    this.dispatch('UpdateTextLayerMatches', { pageIndex: -1 })
  }

  protected nextMatch() {
    const previous = this._state?.findPrevious
    const currentPageIndex = this.page - 1
    const numPages = this.pagesCount

    this._highlightMatches = true

    if (this.dirtyMatch) {
      // Need to recalculate the matches, reset everything.
      this.dirtyMatch = false
      this._selected.pageIndex = this._selected.matchIndex = -1
      this.offset = {
        pageIndex: currentPageIndex,
        matchIndex: undefined,
        wrapped: false,
      }
      this.resumePageIndex = undefined
      this._pageMatches.length = 0
      this._pageMatchesLength.length = 0
      this.visitedPagesCount = 0
      this.matchesCountTotal = 0
      this.updateAllPages() // Wipe out any previously highlighted matches.

      for (let i = 0; i < numPages; i++) {
        // Start finding the matches as soon as the text is extracted.
        if (this.pendingFindMatches.has(i)) {
          continue
        }

        this.pendingFindMatches.add(i)
        this.extractTextPromises[i].then(() => {
          this.pendingFindMatches.delete(i)
          this.calculateMatch(i)
        })
      }
    }

    // If there's no query there's no point in searching.
    const query = this.query

    if (query?.length === 0) {
      this.updateUIState(FindState.FOUND)
      return
    }

    // If we're waiting on a page, we return since we can't do anything else.
    if (this.resumePageIndex) {
      return
    }

    const offset = this.offset
    // Keep track of how many pages we should maximally iterate through.
    this.pagesToSearch = numPages
    // If there's already a `matchIndex` that means we are iterating through a
    // page's matches.
    if (offset.matchIndex !== undefined) {
      const numPageMatches = this._pageMatches[offset.pageIndex!].length
      if (
        (!previous && offset.matchIndex + 1 < numPageMatches)
        || (previous && offset.matchIndex > 0)
      ) {
        // The simple case; we just have advance the matchIndex to select
        // the next match on the page.
        offset.matchIndex = previous ? offset.matchIndex - 1 : offset.matchIndex + 1
        this.updateMatch(/* found = */ true)
        return
      }
      // We went beyond the current page's matches, so we advance to
      // the next page.
      this.advanceOffsetPage(previous)
    }

    // Start searching through the page.
    this.nextPageMatch()
  }

  protected matchesReady(matches: number[]) {
    const offset = this.offset
    const numMatches = matches.length
    const previous = this._state?.findPrevious

    if (numMatches) {
      // There were matches for the page, so initialize `matchIndex`.
      offset.matchIndex = previous ? numMatches - 1 : 0
      this.updateMatch(/* found = */ true)
      return true
    }

    // No matches, so attempt to search the next page.
    this.advanceOffsetPage(previous)
    if (offset.wrapped) {
      offset.matchIndex = undefined
      if (this.pagesToSearch < 0) {
        // No point in wrapping again, there were no matches.
        this.updateMatch(/* found = */ false)
        // While matches were not found, searching for a page
        // with matches should nevertheless halt.
        return true
      }
    }
    // Matches were not found (and searching is not done).
    return false
  }

  protected nextPageMatch() {
    if (this.resumePageIndex !== undefined) {
      this.logger.error('There can only be one pending page.')
    }

    let matches
    do {
      const pageIndex = this.offset.pageIndex
      matches = this._pageMatches[pageIndex!]
      if (!matches) {
        // The matches don't exist yet for processing by `_matchesReady`,
        // so set a resume point for when they do exist.
        this.resumePageIndex = pageIndex
        break
      }
    } while (!this.matchesReady(matches))
  }

  protected advanceOffsetPage(previous?: boolean) {
    const offset = this.offset
    const numPages = this.pagesCount
    offset.pageIndex = previous ? offset.pageIndex! - 1 : offset.pageIndex! + 1
    offset.matchIndex = undefined

    this.pagesToSearch--

    if (offset.pageIndex >= numPages || offset.pageIndex < 0) {
      offset.pageIndex = previous ? numPages - 1 : 0
      offset.wrapped = true
    }
  }

  protected updateMatch(found?: boolean) {
    let state = FindState.NOT_FOUND
    const wrapped = this.offset.wrapped
    this.offset.wrapped = false

    if (found) {
      const previousPage = this._selected.pageIndex
      this._selected.pageIndex = this.offset.pageIndex!
      this._selected.matchIndex = this.offset.matchIndex!
      state = wrapped ? FindState.WRAPPED : FindState.FOUND

      // Update the currently selected page to wipe out any selected matches.
      if (previousPage !== -1 && previousPage !== this._selected.pageIndex) {
        this.updatePage(previousPage)
      }
    }

    this.updateUIState(state, this._state?.findPrevious)

    if (this._selected.pageIndex !== -1) {
      // Ensure that the match will be scrolled into view.
      this.scrollMatches = true

      this.updatePage(this._selected.pageIndex)
    }
  }

  protected requestMatchesCount() {
    const { pageIndex, matchIndex } = this._selected
    let current = 0
    let total = this.matchesCountTotal

    if (matchIndex !== -1) {
      for (let i = 0; i < pageIndex; i++) {
        current += this._pageMatches[i]?.length || 0
      }
      current += matchIndex + 1
    }
    // When searching starts, this method may be called before the `pageMatches`
    // have been counted (in `#calculateMatch`). Ensure that the UI won't show
    // temporarily broken state when the active find result doesn't make sense.
    if (current < 1 || current > total) {
      current = total = 0
    }
    return { current, total }
  }

  protected updateUIState(state: number, previous?: boolean) {
    if (
      !this.updateMatchesCountOnProgress
      && (this.visitedPagesCount !== this.pagesCount || state === FindState.PENDING)
    ) {
      // When this.updateMatchesCountOnProgress is false we only send an update
      // when everything is ready.
      return
    }

    this.dispatch('UpdateFindControlState', {
      state,
      previous,
      entireWord: this._state?.entireWord,
      matchesCount: this.requestMatchesCount(),
      rawQuery: this._state?.query,
    })
  }
}
