import { ToolbarActionToggle } from '@/toolbar'
import { createElement } from '@/utils'
import { FindState } from './find-controller'
import type { FindPlugin } from './find-plugin'

const MATCHES_COUNT_LIMIT = 1000

export class FindToolbarItem extends ToolbarActionToggle {
  protected bar?: HTMLDivElement
  protected findField?: HTMLInputElement
  protected findHighlightAll?: HTMLInputElement
  protected findCaseSensitive?: HTMLInputElement
  protected findMatchDiacritics?: HTMLInputElement
  protected findEntireWord?: HTMLInputElement
  protected findMsg?: HTMLSpanElement
  protected findResultsCount?: HTMLSpanElement
  protected findPreviousButton?: HTMLButtonElement
  protected findNextButton?: HTMLButtonElement

  get findPlugin() {
    return this.viewer.getLayerProperty<FindPlugin>('findPlugin')!
  }

  init() {
    this.bar = createElement('div', 'find-bar')
    this.findField = this.bar.appendChild(createElement('input', {
      type: 'text',
      title: this.findPlugin.translate('field.title'),
      placeholder: this.findPlugin.translate('field.placeholder'),
    }))
    this.findPreviousButton = createElement('button', 'find-previous', {
      type: 'button',
      title: this.findPlugin.translate('previous.title'),
      innerHtml: `<span>${this.findPlugin.translate('previous.label')}</span>`,
    })
    this.findNextButton = createElement('button', 'find-next', {
      type: 'button',
      title: this.findPlugin.translate('next.title'),
      innerHtml: `<span>${this.findPlugin.translate('next.label')}</span>`,
    })
    this.findHighlightAll = createElement('input', { type: 'checkbox' })
    this.findCaseSensitive = createElement('input', { type: 'checkbox' })
    this.findMatchDiacritics = createElement('input', { type: 'checkbox' })
    this.findEntireWord = createElement('input', { type: 'checkbox' })
    this.findMsg = createElement('span', 'find-msg')
    this.findResultsCount = createElement('span', 'find-results')

    const checkedInputs = new Map([
      [this.findHighlightAll, 'HighlightAllChange'],
      [this.findCaseSensitive, 'CaseSensitivityChange'],
      [this.findMatchDiacritics, 'DiacriticMatchingChange'],
      [this.findEntireWord, 'EntireWordChange'],
    ])

    this.bar.addEventListener('keydown', ({ key, shiftKey, target }) => {
      if (key == 'Enter') {
        if (target === this.findField) {
          this.dispatchEvent('Again', shiftKey)
        } else if (target instanceof HTMLInputElement && checkedInputs.has(target)) {
          target.checked = !target.checked
          this.dispatchEvent(checkedInputs.get(target))
        }
      }

      if (key == 'Escape') {
        this.close()
      }
    })

    this.findField.addEventListener('input', () => this.dispatchEvent(), { signal: this.signal })
    this.findPreviousButton.addEventListener('click', () => this.dispatchEvent('Again', true), { signal: this.signal })
    this.findNextButton.addEventListener('click', () => this.dispatchEvent('Again', false), { signal: this.signal })

    for (const [elem, evtName] of checkedInputs) {
      elem.addEventListener('click', () => this.dispatchEvent(evtName), { signal: this.signal })
    }

    const labelHighlightAll = createElement('label', 'find-checkbox')
    labelHighlightAll.append(this.findHighlightAll, createElement('span', {
      innerText: this.findPlugin.translate('highlight-all'),
    }))

    const labelCaseSensitive = createElement('label', 'find-checkbox')
    labelCaseSensitive.append(this.findCaseSensitive, createElement('span', {
      innerText: this.findPlugin.translate('case-sensitive'),
    }))

    const labelEntireWord = createElement('label', 'find-checkbox')
    labelEntireWord.append(this.findEntireWord, createElement('span', {
      innerText: this.findPlugin.translate('entire-word'),
    }))

    const labelMatchDiacritics = createElement('label', 'find-checkbox')
    labelMatchDiacritics.append(this.findMatchDiacritics, createElement('span', {
      innerText: this.findPlugin.translate('match-diacritics'),
    }))

    const findField = createElement('div', 'find-field')
    findField.append(this.findField)

    const findFieldContainer = createElement('div', 'find-field-container')
    findFieldContainer.append(findField, this.findPreviousButton, this.findNextButton)

    const findOptionsContainer = createElement('div', 'find-options-container')
    findOptionsContainer.append(labelHighlightAll, labelCaseSensitive, labelEntireWord, labelMatchDiacritics)

    const findMessageContainer = createElement('div', 'find-message-container')
    findMessageContainer.append(this.findResultsCount, this.findMsg)

    this.bar.append(findFieldContainer, findOptionsContainer, findMessageContainer)
    this.container.append(this.bar)

    this.on('UpdateFindMatchesCount', ({ matchesCount }) => this.updateResultsCount(matchesCount))
    this.on('UpdateFindControlState', ({ state, previous, matchesCount }) => this.updateUIState(state, previous, matchesCount))
    this.on('DocumentDestroy', () => this.reset())
  }

  destroy() {
    this.reset()

    this.bar?.remove()
    this.bar = undefined
  }

  reset() {
    this.updateUIState()
  }

  dispatchEvent(type = '', findPrevious?: boolean) {
    this.dispatch('Find', {
      type,
      query: this.findField?.value,
      caseSensitive: this.findCaseSensitive?.checked,
      entireWord: this.findEntireWord?.checked,
      highlightAll: this.findHighlightAll?.checked,
      findPrevious,
      matchDiacritics: this.findMatchDiacritics?.checked,
    })
  }

  updateUIState(state?: FindState, previous?: boolean, matchesCount = {}) {
    if (!this.findField || !this.findMsg) return

    let message = ''
    let status = ''

    switch (state) {
      case FindState.FOUND:
        break
      case FindState.PENDING:
        status = 'pending'
        break
      case FindState.NOT_FOUND:
        message = this.findPlugin.translate('not-found')
        status = 'not-found'
        break
      case FindState.WRAPPED:
        message = this.findPlugin.translate(previous ? 'reached.top' : 'reached.bottom')
        break
    }

    this.findField.setAttribute('data-status', status)
    this.findField.setAttribute('aria-invalid', state === FindState.NOT_FOUND ? 'true' : 'false')
    this.findMsg.setAttribute('data-status', status)
    this.findMsg.textContent = message

    this.updateResultsCount(matchesCount)
  }

  updateResultsCount({ current = 0, total = 0 } = {}) {
    if (!this.findResultsCount) return

    if (total <= 0) {
      this.findResultsCount.textContent = ''
      return
    }

    const limit = MATCHES_COUNT_LIMIT

    this.findResultsCount.textContent = total > limit
      ? this.findPlugin.translate('match.count-limit', { count: limit })
      : this.findPlugin.translate('match.count', { current, count: total })
  }

  open() {
    if (!this.bar) return

    this.opened = true

    this.bar.classList.add('find-bar-open')
    this.bar.hidden = false

    this.findField?.select()
    this.findField?.focus()
  }

  close() {
    if (!this.bar) return

    this.opened = false

    this.bar.classList.remove('find-bar-open')
    this.bar.hidden = true

    this.dispatch('FindBarClose')
  }
}
