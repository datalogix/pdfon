import { TextLayerMode } from '@/enums'
import { AbortException, TextLayer, normalizeUnicode } from '@/pdfjs'
import { createElement, removeNullCharacters } from '@/utils'
import { TextAccessibilityManager } from './text-accessibility-manager'
import { LayerBuilder } from './layer-builder'

export class TextLayerBuilder extends LayerBuilder {
  div: HTMLDivElement = createElement('div', 'textLayer', { tabIndex: 0 })
  readonly textAccessibilityManager = new TextAccessibilityManager()

  private renderingDone = false
  private _textLayer?: TextLayer
  private static textLayers: Map<HTMLElement, HTMLElement> = new Map()
  private static selectionChangeAbortController?: AbortController

  get textLayer() {
    return this._textLayer
  }

  get enablePermissions() {
    return this.options.textLayerMode === TextLayerMode.ENABLE_PERMISSIONS
  }

  canRegister() {
    return this.options.textLayerMode !== TextLayerMode.DISABLE && !this.pdfPage?.isPureXfa
  }

  stopOnException(ex: any) {
    return ex instanceof AbortException
  }

  async render(postponeDrawing?: boolean) {
    if (postponeDrawing) {
      this.hide()
      return
    }

    if (this.renderingDone && this._textLayer) {
      this._textLayer.update({
        viewport: this.viewport,
        onBefore: this.hide.bind(this),
      })

      this.updateLayerDimensions()
      this.show()
      return
    }

    this.cancel()

    this._textLayer = new TextLayer({
      textContentSource: this.pdfPage!.streamTextContent({
        includeMarkedContent: true,
        disableNormalization: true,
      }),
      container: this.div,
      viewport: this.viewport,
    })

    this.updateLayerDimensions()

    await this._textLayer.render()

    this.renderingDone = true
    const endOfContent = createElement('div', 'endOfContent')
    this.div.append(endOfContent)
    this.bindMouse(endOfContent)
    this.layersPage.add(this.div, 1)

    this.dispatch('render')

    this.textAccessibilityManager.setTextMapping(this._textLayer.textDivs)
    queueMicrotask(() => this.textAccessibilityManager.enable())
  }

  hide() {
    if (this.div.hidden || !this.renderingDone) return

    super.hide()
  }

  show() {
    if (!this.div.hidden || !this.renderingDone) return

    super.show()
  }

  cancel() {
    super.cancel()

    this._textLayer?.cancel()
    this._textLayer = undefined

    TextLayerBuilder.removeGlobalSelectionListener(this.div)
    this.textAccessibilityManager.disable()
  }

  private bindMouse(end: HTMLElement) {
    const div = this.div

    div.addEventListener('mousedown', () => {
      div.classList.add('selecting')
    })

    div.addEventListener('copy', (event: ClipboardEvent) => {
      if (!this.enablePermissions) {
        const selection = document.getSelection()
        event.clipboardData?.setData(
          'text/plain',
          removeNullCharacters(normalizeUnicode(selection?.toString())),
        )
      }

      event.preventDefault()
      event.stopPropagation()
    })

    TextLayerBuilder.textLayers.set(div, end)
    TextLayerBuilder.enableGlobalSelectionListener()
  }

  private static removeGlobalSelectionListener(textLayerDiv: HTMLElement) {
    this.textLayers.delete(textLayerDiv)

    if (this.textLayers.size === 0) {
      this.selectionChangeAbortController?.abort()
      this.selectionChangeAbortController = undefined
    }
  }

  private static enableGlobalSelectionListener() {
    if (this.selectionChangeAbortController) {
      return
    }

    this.selectionChangeAbortController = new AbortController()
    const { signal } = this.selectionChangeAbortController

    const reset = (end: HTMLElement, textLayer: HTMLElement) => {
      textLayer.append(end)
      end.style.width = ''
      end.style.height = ''
      textLayer.classList.remove('selecting')
    }

    let isPointerDown = false

    document.addEventListener(
      'pointerdown',
      () => {
        isPointerDown = true
      },
      { signal },
    )

    document.addEventListener(
      'pointerup',
      () => {
        isPointerDown = false
        this.textLayers.forEach(reset)
      },
      { signal },
    )

    window.addEventListener(
      'blur',
      () => {
        isPointerDown = false
        this.textLayers.forEach(reset)
      },
      { signal },
    )

    document.addEventListener(
      'keyup',
      () => {
        if (!isPointerDown) {
          this.textLayers.forEach(reset)
        }
      },
      { signal },
    )

    let isFirefox: boolean
    let prevRange: Range

    document.addEventListener(
      'selectionchange',
      () => {
        const selection = document.getSelection()

        if (!selection || selection.rangeCount === 0) {
          this.textLayers.forEach(reset)
          return
        }

        const activeTextLayers = new Set()

        for (let i = 0; i < selection.rangeCount; i++) {
          const range = selection.getRangeAt(i)

          for (const textLayerDiv of this.textLayers.keys()) {
            if (!activeTextLayers.has(textLayerDiv) && range.intersectsNode(textLayerDiv)) {
              activeTextLayers.add(textLayerDiv)
            }
          }
        }

        for (const [textLayerDiv, endDiv] of this.textLayers) {
          if (activeTextLayers.has(textLayerDiv)) {
            textLayerDiv.classList.add('selecting')
          } else {
            reset(endDiv, textLayerDiv)
          }
        }

        const elt = this.textLayers.values().next().value

        if (!elt) {
          return
        }

        isFirefox ??= getComputedStyle(elt).getPropertyValue('-moz-user-select') === 'none'

        if (isFirefox) {
          return
        }

        const range = selection.getRangeAt(0)
        const modifyStart = prevRange && (range.compareBoundaryPoints(
          Range.END_TO_END,
          prevRange,
        ) === 0 || range.compareBoundaryPoints(
          Range.START_TO_END,
          prevRange,
        ) === 0)

        let anchor = modifyStart
          ? range.startContainer
          : range.endContainer

        if (anchor.nodeType === Node.TEXT_NODE) {
          anchor = anchor.parentNode!
        }

        const parentTextLayer = anchor.parentElement?.closest('.textLayer') as HTMLElement
        const endDiv = this.textLayers.get(parentTextLayer)

        if (endDiv) {
          endDiv.style.width = parentTextLayer.style.width
          endDiv.style.height = parentTextLayer.style.height
          anchor.parentElement?.insertBefore(
            endDiv,
            modifyStart
              ? anchor
              : anchor.nextSibling,
          )
        }

        prevRange = range.cloneRange()
      },
      { signal },
    )
  }
}
