import { IPDFLinkService } from './pdfjs'
import { isValidRotation, parseQueryString, waitOnEventOrTimeout } from './utils'
import type { EventBus } from '@/eventbus'

const HASH_CHANGE_TIMEOUT = 1000
const POSITION_UPDATED_THRESHOLD = 50
const UPDATE_VIEWAREA_TIMEOUT = 1000

export class PDFHistory {
  private eventAbortController?: AbortController
  private destination?: {
    dest?: any[]
    hash?: string
    page?: number
    first?: number
    temporary?: boolean
  }

  private _popStateInProgress: boolean = false
  private blockHashChange: number = 0
  private uid: number = 0
  private maxUid: number = 0
  private currentHash: string = getCurrentHash()
  private updateViewareaTimeout?: number
  private position?: {
    hash: string
    page: number
    first: number
    rotation: number
    temporary?: boolean
  }

  private numPositionUpdates: number = 0
  private isPagesLoaded: boolean = false
  private fingerprint: string = ''
  private updateUrl: boolean = false
  private initialized: boolean = false
  private _initialBookmark?: string
  private _initialRotation?: string

  constructor(public readonly options: {
    linkService: IPDFLinkService
    eventBus: EventBus
  }) {
    this.reset()

    this.options.eventBus.on('pagesinit', () => {
      this.isPagesLoaded = false
      this.options.eventBus.on(
        'pagesloaded',
        (event: { pagesCount: number }) => { this.isPagesLoaded = !!event.pagesCount },
        { once: true },
      )
    })
  }

  initialize({ fingerprint, resetHistory = false, updateUrl = false }) {
    if (!fingerprint || typeof fingerprint !== 'string') {
      console.error('PDFHistory.initialize: The \'fingerprint\' must be a non-empty string.')
      return
    }

    if (this.initialized) {
      this.reset()
    }

    const reInitialized = this.fingerprint !== '' && this.fingerprint !== fingerprint
    const state = window.history.state

    this.fingerprint = fingerprint
    this.updateUrl = updateUrl === true
    this.initialized = true
    this._popStateInProgress = false
    this.blockHashChange = 0
    this.currentHash = getCurrentHash()
    this.numPositionUpdates = 0
    this.uid = this.maxUid = 0
    this.destination = undefined
    this.position = undefined

    this.bindEvents()

    if (!this.isValidState(state, true) || resetHistory) {
      const { hash, page, rotation } = this.parseCurrentHash(true)

      if (!hash || reInitialized || resetHistory) {
        this.pushOrReplaceState(null, true)
        return
      }

      this.pushOrReplaceState({
        hash,
        page,
        rotation,
      }, true)

      return
    }

    const destination = state.destination
    this.updateInternalState(destination, state.uid, true)

    if (destination.rotation !== undefined) {
      this._initialRotation = destination.rotation
    }

    if (destination.dest) {
      this._initialBookmark = JSON.stringify(destination.dest)
      this.destination.page = undefined
    }
    else if (destination.hash) {
      this._initialBookmark = destination.hash
    }
    else if (destination.page) {
      this._initialBookmark = `page=${destination.page}`
    }
  }

  reset() {
    if (this.initialized) {
      this.pageHide()
      this.initialized = false
      this.unbindEvents()
    }

    if (this.updateViewareaTimeout) {
      clearTimeout(this.updateViewareaTimeout)
      this.updateViewareaTimeout = undefined
    }

    this._initialBookmark = undefined
    this._initialRotation = undefined
  }

  push({ namedDest = null, explicitDest, pageNumber }) {
    if (!this.initialized) {
      return
    }

    if (namedDest && typeof namedDest !== 'string') {
      console.error('PDFHistory.push: ' + `'${namedDest}' is not a valid namedDest parameter.`)
      return
    }
    else if (!Array.isArray(explicitDest)) {
      console.error('PDFHistory.push: ' + `'${explicitDest}' is not a valid explicitDest parameter.`)
      return
    }
    else if (!this.isValidPage(pageNumber)) {
      if (pageNumber !== null || this.destination) {
        console.error('PDFHistory.push: ' + `'${pageNumber}' is not a valid pageNumber parameter.`)
        return
      }
    }

    const hash = namedDest || JSON.stringify(explicitDest)

    if (!hash) {
      return
    }

    let forceReplace = false

    if (this.destination && (isDestHashesEqual(this.destination.hash, hash) || isDestArraysEqual(this.destination.dest, explicitDest))) {
      if (this.destination.page) {
        return
      }

      forceReplace = true
    }

    if (this._popStateInProgress && !forceReplace) {
      return
    }

    this.pushOrReplaceState({
      dest: explicitDest,
      hash,
      page: pageNumber,
      rotation: this.options.linkService.rotation,
    }, forceReplace)

    if (!this._popStateInProgress) {
      this._popStateInProgress = true

      Promise.resolve().then(() => {
        this._popStateInProgress = false
      })
    }
  }

  pushPage(pageNumber: number) {
    if (!this.initialized) {
      return
    }

    if (!this.isValidPage(pageNumber)) {
      console.error(`PDFHistory.pushPage: '${pageNumber}' is not a valid page number.`)
      return
    }

    if (this.destination?.page === pageNumber) {
      return
    }

    if (this._popStateInProgress) {
      return
    }

    this.pushOrReplaceState({
      dest: null,
      hash: `page=${pageNumber}`,
      page: pageNumber,
      rotation: this.options.linkService.rotation,
    })

    if (!this._popStateInProgress) {
      this._popStateInProgress = true

      Promise.resolve().then(() => {
        this._popStateInProgress = false
      })
    }
  }

  pushCurrentPosition() {
    if (!this.initialized || this._popStateInProgress) {
      return
    }

    this.tryPushCurrentPosition()
  }

  back() {
    if (!this.initialized || this._popStateInProgress) {
      return
    }

    const state = window.history.state

    if (this.isValidState(state) && state.uid > 0) {
      window.history.back()
    }
  }

  forward() {
    if (!this.initialized || this._popStateInProgress) {
      return
    }

    const state = window.history.state

    if (this.isValidState(state) && state.uid < this.maxUid) {
      window.history.forward()
    }
  }

  get popStateInProgress() {
    return this.initialized && (this._popStateInProgress || this.blockHashChange > 0)
  }

  get initialBookmark() {
    return this.initialized ? this._initialBookmark : null
  }

  get initialRotation() {
    return this.initialized ? this._initialRotation : null
  }

  private pushOrReplaceState(destination, forceReplace: boolean = false) {
    const shouldReplace = forceReplace || !this.destination
    const newState = {
      fingerprint: this.fingerprint,
      uid: shouldReplace ? this.uid : this.uid + 1,
      destination,
    }

    this.updateInternalState(destination, newState.uid)

    let newUrl
    if (this.updateUrl && destination?.hash) {
      const baseUrl = document.location.href.split('#', 1)[0]

      if (!baseUrl.startsWith('file://')) {
        newUrl = `${baseUrl}#${destination.hash}`
      }
    }

    if (shouldReplace) {
      window.history.replaceState(newState, '', newUrl)
    }
    else {
      window.history.pushState(newState, '', newUrl)
    }
  }

  private tryPushCurrentPosition(temporary: boolean = false) {
    if (!this.position) {
      return
    }

    let position = this.position

    if (temporary) {
      position = Object.assign(Object.create(null), this.position)
      position.temporary = true
    }

    if (!this.destination) {
      this.pushOrReplaceState(position)
      return
    }

    if (this.destination.temporary) {
      this.pushOrReplaceState(position, true)
      return
    }

    if (this.destination.hash === position.hash) {
      return
    }

    if (!this.destination.page && (POSITION_UPDATED_THRESHOLD <= 0 || this.numPositionUpdates <= POSITION_UPDATED_THRESHOLD)) {
      return
    }

    let forceReplace = false

    if (this.destination.page && this.destination.page >= position.first && this.destination.page <= position.page) {
      if (this.destination.dest !== undefined || !this.destination.first) {
        return
      }

      forceReplace = true
    }

    this.pushOrReplaceState(position, forceReplace)
  }

  private isValidPage(val: number) {
    return Number.isInteger(val) && val > 0 && val <= this.options.linkService.pagesCount
  }

  private isValidState(state, checkReload: boolean = false) {
    if (!state) {
      return false
    }

    if (state.fingerprint !== this.fingerprint) {
      if (checkReload) {
        if (typeof state.fingerprint !== 'string' || state.fingerprint.length !== this.fingerprint.length) {
          return false
        }

        const [perfEntry] = performance.getEntriesByType('navigation')

        if (perfEntry?.type !== 'reload') {
          return false
        }
      }
      else {
        return false
      }
    }

    if (!Number.isInteger(state.uid) || state.uid < 0) {
      return false
    }

    if (state.destination === null || typeof state.destination !== 'object') {
      return false
    }

    return true
  }

  private updateInternalState(destination, uid, removeTemporary: boolean = false) {
    if (this.updateViewareaTimeout) {
      clearTimeout(this.updateViewareaTimeout)
      this.updateViewareaTimeout = undefined
    }

    if (removeTemporary && destination?.temporary) {
      delete destination.temporary
    }

    this.destination = destination
    this.uid = uid
    this.maxUid = Math.max(this.maxUid, uid)
    this.numPositionUpdates = 0
  }

  private parseCurrentHash(checkNameddest: boolean = false) {
    const hash = decodeURI(getCurrentHash()).substring(1)
    const params = parseQueryString(hash)
    const nameddest = params.get('nameddest') || ''

    let page: number | null = params.get('page') | 0

    if (!this.isValidPage(page) || checkNameddest && nameddest.length > 0) {
      page = null
    }

    return {
      hash,
      page,
      rotation: this.options.linkService.rotation,
    }
  }

  private updateViewarea({ location }) {
    if (this.updateViewareaTimeout) {
      clearTimeout(this.updateViewareaTimeout)
      this.updateViewareaTimeout = undefined
    }

    this.position = {
      hash: location.pdfOpenParams.substring(1),
      page: this.options.linkService.page,
      first: location.pageNumber,
      rotation: location.rotation,
    }

    if (this._popStateInProgress) {
      return
    }

    if (POSITION_UPDATED_THRESHOLD > 0 && this.isPagesLoaded && this.destination && !this.destination.page) {
      this.numPositionUpdates++
    }

    if (UPDATE_VIEWAREA_TIMEOUT > 0) {
      this.updateViewareaTimeout = setTimeout(() => {
        if (!this._popStateInProgress) {
          this.tryPushCurrentPosition(true)
        }
        this.updateViewareaTimeout = undefined
      }, UPDATE_VIEWAREA_TIMEOUT)
    }
  }

  private popState({ state }) {
    const newHash = getCurrentHash()
    const hashChanged = this.currentHash !== newHash

    this.currentHash = newHash

    if (!state) {
      this.uid++

      this.pushOrReplaceState(this.parseCurrentHash(), true)

      return
    }

    if (!this.isValidState(state)) {
      return
    }

    this._popStateInProgress = true

    if (hashChanged) {
      this.blockHashChange++

      waitOnEventOrTimeout({
        target: window,
        name: 'hashchange',
        delay: HASH_CHANGE_TIMEOUT,
      }).then(() => {
        this.blockHashChange--
      })
    }

    const destination = state.destination

    this.updateInternalState(destination, state.uid, true)

    if (isValidRotation(destination.rotation)) {
      this.options.linkService.rotation = destination.rotation
    }

    if (destination.dest) {
      this.options.linkService.goToDestination(destination.dest)
    }
    else if (destination.hash) {
      this.options.linkService.setHash(destination.hash)
    }
    else if (destination.page) {
      this.options.linkService.page = destination.page
    }

    Promise.resolve().then(() => {
      this._popStateInProgress = false
    })
  }

  private pageHide() {
    if (!this.destination || this.destination.temporary) {
      this.tryPushCurrentPosition()
    }
  }

  private bindEvents() {
    if (this.eventAbortController) {
      return
    }

    this.eventAbortController = new AbortController()

    this.options.eventBus.on(
      'updateviewarea',
      this.updateViewarea.bind(this),
      { signal: this.eventAbortController.signal },
    )

    window.addEventListener(
      'popstate',
      this.popState.bind(this),
      { signal: this.eventAbortController.signal },
    )

    window.addEventListener(
      'pagehide',
      this.pageHide.bind(this),
      { signal: this.eventAbortController.signal },
    )
  }

  private unbindEvents() {
    this.eventAbortController?.abort()
    this.eventAbortController = undefined
  }
}

function getCurrentHash() {
  return document.location.hash
}

function isDestHashesEqual(destHash, pushHash) {
  if (typeof destHash !== 'string' || typeof pushHash !== 'string') {
    return false
  }
  if (destHash === pushHash) {
    return true
  }
  const nameddest = parseQueryString(destHash).get('nameddest')
  if (nameddest === pushHash) {
    return true
  }
  return false
}

function isDestArraysEqual(firstDest, secondDest) {
  function isEntryEqual(first, second) {
    if (typeof first !== typeof second) {
      return false
    }
    if (Array.isArray(first) || Array.isArray(second)) {
      return false
    }
    if (first !== null && typeof first === 'object' && second !== null) {
      if (Object.keys(first).length !== Object.keys(second).length) {
        return false
      }
      for (const key in first) {
        if (!isEntryEqual(first[key], second[key])) {
          return false
        }
      }
      return true
    }
    return first === second || (Number.isNaN(first) && Number.isNaN(second))
  }

  if (!(Array.isArray(firstDest) && Array.isArray(secondDest))) {
    return false
  }
  if (firstDest.length !== secondDest.length) {
    return false
  }
  for (let i = 0, ii = firstDest.length; i < ii; i++) {
    if (!isEntryEqual(firstDest[i], secondDest[i])) {
      return false
    }
  }
  return true
}
