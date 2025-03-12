import { Dispatcher, type EventBus } from '@/bus'
import { AnnotationEditorType, type AnnotationEditor, type AnnotationEditorLayer, type PDFDocumentProxy } from '@/pdfjs'
import type { StorageService } from '../storage'

export class AnnotationEditorStorage extends Dispatcher {
  private annotationEditors: Map<string, AnnotationEditor> = new Map()
  private pdfDocument?: PDFDocumentProxy
  private storage?: StorageService

  constructor(readonly eventBus: EventBus) {
    super()

    this.init()
  }

  private init() {
    this.on('DocumentInit', ({ pdfDocument }) => {
      this.pdfDocument = pdfDocument
    })

    this.on('StorageLoaded', ({ source }) => {
      this.storage = source.storage
      this.load()
    })

    this.on('AnnotationEditorLayerBuilderRender', ({ source }) => {
      this.addEditors(source.annotationEditorLayer)
    })

    let i: NodeJS.Timeout

    this.on('SwitchAnnotationEditorMode', ({ mode }) => {
      clearInterval(i)

      if (mode === AnnotationEditorType.NONE) {
        this.save()
      } else {
        i = setInterval(() => this.save(), 1000)
      }
    })
  }

  load() {
    this.annotationEditors = this.storage?.get('annotation-editors', new Map()) ?? new Map()
  }

  save() {
    if (!this.pdfDocument) return

    this.storage?.set('annotation-editors', this.pdfDocument.annotationStorage.serializable.map)
  }

  getByPage(pageIndex: number) {
    const items: Map<string, Record<string, any>> = new Map()

    this.annotationEditors.entries().forEach(([key, object]) => {
      if (object.pageIndex === pageIndex) {
        items.set(key, object)
      }
    })

    return items
  }

  addEditors(layer: AnnotationEditorLayer) {
    this.getByPage(layer.pageIndex).forEach(async (annotation) => {
      // Fix annotation editor HIGHLIGHT
      if (annotation.annotationType === AnnotationEditorType.HIGHLIGHT && !annotation.quadPoints) {
        annotation.inkLists = annotation.outlines.points
      }

      const editor = await (layer.deserialize(annotation) as any as Promise<AnnotationEditor>)
      layer.addOrRebuild(editor)
      editor.disableEditing()
      editor.unselect()

      // Fix annotation editor FREETEXT
      if (annotation.annotationType === AnnotationEditorType.FREETEXT) {
        const [parentWidth, parentHeight] = editor.parentDimensions

        editor.setAt(
          ((editor.x - editor.width) * parentWidth) - (2 * editor.parentScale),
          ((editor.y - editor.height) * parentHeight) - (2 * editor.parentScale),
          0,
          0,
        )
      }
    })
  }

  destroy() {
    this.save()

    this.annotationEditors.clear()
    this.pdfDocument = undefined
    this.storage = undefined
  }
}
