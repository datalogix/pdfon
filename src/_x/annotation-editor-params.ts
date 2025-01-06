import { AnnotationEditorParamsType } from './pdfjs'

export class AnnotationEditorParams {
    constructor(options: any, public readonly eventBus: any) {
        this.bindListeners(options)
    }

    private bindListeners({
        editorFreeTextFontSize
        editorFreeTextColor
        editorInkColor
        editorInkThickness
        editorInkOpacity
        editorStampAddImage
        editorFreeHighlightThickness
        editorHighlightShowAll
    }) {
        const dispatchEvent = (typeStr: string, value ?: any) => {
            this.eventBus.dispatch('switchannotationeditorparams', {
                source: this,
                type: AnnotationEditorParamsType[typeStr as keyof typeof AnnotationEditorParamsType],
                value,
            })
        }

        editorFreeTextFontSize.addEventListener('input', () => dispatchEvent('FREETEXT_SIZE', this.valueAsNumber))
        editorFreeTextColor.addEventListener('input', () => dispatchEvent('FREETEXT_COLOR', this.value))
        editorInkColor.addEventListener('input', () => dispatchEvent('INK_COLOR', this.value))
        editorInkThickness.addEventListener('input', () => dispatchEvent('INK_THICKNESS', this.valueAsNumber))
        editorInkOpacity.addEventListener('input', () => dispatchEvent('INK_OPACITY', this.valueAsNumber))
        editorStampAddImage.addEventListener('click', () => dispatchEvent('CREATE'))
        editorFreeHighlightThickness.addEventListener('input', () => dispatchEvent('HIGHLIGHT_THICKNESS', this.valueAsNumber))

        editorHighlightShowAll.addEventListener('click', () => {
            const checked = this.getAttribute('aria-pressed') === 'true'
            this.setAttribute('aria-pressed', !checked)
            dispatchEvent('HIGHLIGHT_SHOW_ALL', !checked)
        })

        this.eventBus.on('annotationeditorparamschanged', (evt: { details: any }) => {
            for (const [type, value] of evt.details) {
                switch (type) {
                    case AnnotationEditorParamsType.FREETEXT_SIZE:
                        editorFreeTextFontSize.value = value
                        break

                    case AnnotationEditorParamsType.FREETEXT_COLOR:
                        editorFreeTextColor.value = value
                        break

                    case AnnotationEditorParamsType.INK_COLOR:
                        editorInkColor.value = value
                        break

                    case AnnotationEditorParamsType.INK_THICKNESS:
                        editorInkThickness.value = value
                        break

                    case AnnotationEditorParamsType.INK_OPACITY:
                        editorInkOpacity.value = value
                        break

                    case AnnotationEditorParamsType.HIGHLIGHT_THICKNESS:
                        editorFreeHighlightThickness.value = value
                        break

                    case AnnotationEditorParamsType.HIGHLIGHT_FREE:
                        editorFreeHighlightThickness.disabled = !value
                        break

                    case AnnotationEditorParamsType.HIGHLIGHT_SHOW_ALL:
                        editorHighlightShowAll.setAttribute('aria-pressed', value)
                        break
                }
            }
        })
    }
}
