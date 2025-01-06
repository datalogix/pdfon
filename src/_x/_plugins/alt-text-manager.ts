

import { OverlayManager } from './OverlayManager'
import { DOMSVGFactory, shadow, type AnnotationEditor, type AnnotationEditorUIManager} from '@/pdfjs'
import type { EventBus } from '@/eventbus'

export class AltTextManager {
  private boundUpdateUIState = this.updateUIState.bind(this)
  private boundSetPosition = this.setPosition.bind(this)
  private boundOnClick = this.onClick.bind(this)
  private currentEditor?: AnnotationEditor
  private hasUsedPointer: boolean = false
  private uiManager?: AnnotationEditorUIManager
  private previousAltText?: string
  private svgElement?: SVGElement
  private rectElement?: SVGElement
  private telemetryData?: {
    action: string
    alt_text_description?: boolean
    alt_text_edit?: boolean
    alt_text_decorative?: boolean
    alt_text_keyboard?: boolean
  }

  constructor(
    public readonly options: {
      dialog: HTMLDialogElement
      optionDescription: HTMLInputElement
      optionDecorative: HTMLInputElement
      textarea: HTMLTextAreaElement
      cancelButton: HTMLButtonElement
      saveButton: HTMLButtonElement
    },
    public readonly container: HTMLElement,
    public readonly overlayManager: OverlayManager,
    public readonly eventBus: EventBus,
  ) {
    options.dialog.addEventListener('close', this.close.bind(this))
    options.dialog.addEventListener('contextmenu', (event) => {
      if (event.target !== this.options.textarea) {
        event.preventDefault()
      }
    })
    options.cancelButton.addEventListener('click', this.finish.bind(this))
    options.saveButton.addEventListener('click', this.save.bind(this))
    options.optionDescription.addEventListener('change', this.boundUpdateUIState)
    options.optionDecorative.addEventListener('change', this.boundUpdateUIState)
    this.overlayManager.register(options.dialog)
  }

  get _elements() {
    return shadow(this, '_elements', [
      this.options.optionDescription,
      this.options.optionDecorative,
      this.options.textarea,
      this.options.saveButton,
      this.options.cancelButton,
    ])
  }

  createSVGElement() {
    if (this.svgElement) return

    const svgFactory = new DOMSVGFactory()

    // @ts-ignore
    const svg = (this.svgElement = svgFactory.createElement('svg') as SVGElement)
    svg.setAttribute('width', '0')
    svg.setAttribute('height', '0')

    // @ts-ignore
    const defs = svgFactory.createElement('defs') as SVGDefsElement
    svg.append(defs)

    // @ts-ignore
    const mask = svgFactory.createElement('mask') as SVGMaskElement
    defs.append(mask)
    mask.setAttribute('id', 'alttext-manager-mask')
    mask.setAttribute('maskContentUnits', 'objectBoundingBox')

    // @ts-ignore
    let rect = svgFactory.createElement('rect') as SVGRectElement
    mask.append(rect)
    rect.setAttribute('fill', 'white')
    rect.setAttribute('width', '1')
    rect.setAttribute('height', '1')
    rect.setAttribute('x', '0')
    rect.setAttribute('y', '0')

    // @ts-ignore
    rect = this.rectElement = svgFactory.createElement('rect') as SVGRectElement
    mask.append(rect)
    rect.setAttribute('fill', 'black')
    this.options.dialog.append(svg)
  }

  async editAltText(uiManager: AnnotationEditorUIManager, editor?: AnnotationEditor) {
    if (this.currentEditor || !editor) {
      return
    }

    this.createSVGElement()
    this.hasUsedPointer = false

    for (const element of this._elements) {
      element.addEventListener('click', this.boundOnClick)
    }

    const { altText, decorative } = editor.altTextData

    if (decorative === true) {
      this.options.optionDecorative.checked = true
      this.options.optionDescription.checked = false
    }
    else {
      this.options.optionDecorative.checked = false
      this.options.optionDescription.checked = true
    }

    this.previousAltText = this.options.textarea.value = altText?.trim() || ''
    this.updateUIState()

    this.currentEditor = editor
    this.uiManager = uiManager
    this.uiManager.removeEditListeners()
    this.eventBus.on('resize', this.boundSetPosition)

    try {
      await this.overlayManager.open(this.options.dialog)
      this.setPosition()
    }
    catch (ex) {
      this.close()
      throw ex
    }
  }

  private setPosition() {
    if (!this.currentEditor) return

    const {
      x: containerX,
      y: containerY,
      width: containerW,
      height: containerH,
    } = this.container.getBoundingClientRect()

    const { innerWidth: windowW, innerHeight: windowH } = window
    const { width: dialogW, height: dialogH } = this.options.dialog.getBoundingClientRect()
    const { x, y, width, height } = this.currentEditor.getClientDimensions()

    const MARGIN = 10
    const isLTR = this.uiManager?.direction === 'ltr'
    const xs = Math.max(x, containerX)
    const xe = Math.min(x + width, containerX + containerW)
    const ys = Math.max(y, containerY)
    const ye = Math.min(y + height, containerY + containerH)

    this.rectElement?.setAttribute('width', `${(xe - xs) / windowW}`)
    this.rectElement?.setAttribute('height', `${(ye - ys) / windowH}`)
    this.rectElement?.setAttribute('x', `${xs / windowW}`)
    this.rectElement?.setAttribute('y', `${ys / windowH}`)

    let left: number | null = null
    let top: number | null = Math.max(y, 0)
    top += Math.min(windowH - (top + dialogH), 0)

    if (isLTR) {
      if (x + width + MARGIN + dialogW < windowW) {
        left = x + width + MARGIN
      }
      else if (x > dialogW + MARGIN) {
        left = x - dialogW - MARGIN
      }
    }
    else if (x > dialogW + MARGIN) {
      left = x - dialogW - MARGIN
    }
    else if (x + width + MARGIN + dialogW < windowW) {
      left = x + width + MARGIN
    }

    if (left === null) {
      top = null
      left = Math.max(x, 0)
      left += Math.min(windowW - (left + dialogW), 0)

      if (y > dialogH + MARGIN) {
        top = y - dialogH - MARGIN
      }
      else if (y + height + MARGIN + dialogH < windowH) {
        top = y + height + MARGIN
      }
    }

    if (top !== null) {
      this.options.dialog.classList.add('positioned')

      if (isLTR) {
        this.options.dialog.style.left = `${left}px`
      }
      else {
        this.options.dialog.style.right = `${windowW - left - dialogW}px`
      }

      this.options.dialog.style.top = `${top}px`
    }
    else {
      this.options.dialog.classList.remove('positioned')
      this.options.dialog.style.left = ''
      this.options.dialog.style.top = ''
    }
  }

  private finish() {
    if (this.overlayManager.active === this.options.dialog) {
      this.overlayManager.close(this.options.dialog)
    }
  }

  private close() {
    this.currentEditor?._reportTelemetry(this.telemetryData || {
      action: 'alt_text_cancel',
      alt_text_keyboard: !this.hasUsedPointer,
    })

    this.telemetryData = undefined

    this.removeOnClickListeners()
    this.uiManager?.addEditListeners()
    this.eventBus.off('resize', this.boundSetPosition)
    this.currentEditor?.altTextFinish()
    this.currentEditor = undefined
    this.uiManager = undefined
  }

  private updateUIState() {
    this.options.textarea.disabled = this.options.optionDecorative.checked
  }

  private save() {
    const altText = this.options.textarea.value.trim()
    const decorative = this.options.optionDecorative.checked

    if (this.currentEditor) {
      this.currentEditor.altTextData = {
        altText,
        decorative,
      }
    }

    this.telemetryData = {
      action: 'alt_text_save',
      alt_text_description: !!altText,
      alt_text_edit: !!this.previousAltText && this.previousAltText !== altText,
      alt_text_decorative: decorative,
      alt_text_keyboard: !this.hasUsedPointer,
    }

    this.finish()
  }

  private onClick(evt: MouseEvent) {
    if (evt.detail === 0) return

    this.hasUsedPointer = true
    this.removeOnClickListeners()
  }

  private removeOnClickListeners() {
    for (const element of this._elements) {
      element.removeEventListener('click', this.boundOnClick)
    }
  }

  destroy() {
    this.uiManager = undefined
    this.finish()
    this.svgElement?.remove()
    this.svgElement = this.rectElement = undefined
  }
}
