import { TextLayerMode } from '@/enums'
import { createElement, removeNullCharacters } from '@/utils'
import { Plugin } from '../plugin'

export class CopyPlugin extends Plugin {
  private getAllTextInProgress = false
  private hiddenCopyElement?: HTMLDivElement
  private interruptCopyCondition = false
  private onCopyListener = this.onCopy.bind(this)
  private textLayerMode?: TextLayerMode

  protected init() {
    this.on('firstpageloaded', ({ textLayerMode }) => {
      this.textLayerMode = textLayerMode
      if (this.textLayerMode === TextLayerMode.DISABLE) return

      this.hiddenCopyElement = createElement('div', { id: 'hiddenCopyElement' })
      this.viewerContainer.before(this.hiddenCopyElement)

      document.addEventListener('copy', this.onCopyListener, { signal: this.viewer.pagesManager.signal })
    })

    this.on('pagesdestroy', () => this.destroy())
  }

  protected destroy() {
    this.hiddenCopyElement?.remove()
    this.hiddenCopyElement = undefined
    document.removeEventListener('copy', this.onCopyListener)
  }

  private onCopy(event: ClipboardEvent) {
    const selection = document.getSelection()

    if (!selection) {
      return
    }

    if (!(selection.anchorNode
      && selection.focusNode
      && this.hiddenCopyElement
      && selection.containsNode(this.hiddenCopyElement))
    ) {
      return
    }

    if (this.getAllTextInProgress || this.textLayerMode === TextLayerMode.ENABLE_PERMISSIONS) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    this.getAllTextInProgress = true
    this.viewerContainer.classList.add('copy-all')

    const abortController = new AbortController()

    window.addEventListener(
      'keydown',
      ev => (this.interruptCopyCondition = ev.key === 'Escape'),
      { signal: abortController.signal },
    )

    this.getAllText().then(async (text) => {
      if (text !== null) {
        await navigator.clipboard.writeText(text)
      }
    }).catch((reason) => {
      this.logger.warn('Something goes wrong when extracting the text', reason)
    }).finally(() => {
      this.getAllTextInProgress = false
      this.interruptCopyCondition = false
      this.viewerContainer.classList.remove('copy-all')
      abortController.abort()
    })

    event.preventDefault()
    event.stopPropagation()
  }

  private async getAllText() {
    const pdfDocument = this.viewer.getDocument()

    if (!pdfDocument) return null

    const texts = []
    const buffer = []
    for (let pageNum = 1, pagesCount = pdfDocument.numPages; pageNum <= pagesCount; ++pageNum) {
      if (this.interruptCopyCondition) {
        return null
      }

      buffer.length = 0

      const page = await pdfDocument.getPage(pageNum)
      const { items } = await page.getTextContent()

      for (const item of items) {
        if ('str' in item && item.str) {
          buffer.push(item.str)
        }

        if ('hasEOL' in item && item.hasEOL) {
          buffer.push('\n')
        }
      }

      texts.push(removeNullCharacters(buffer.join('')))
    }

    return texts.join('\n')
  }
}
