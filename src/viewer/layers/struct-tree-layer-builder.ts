import type { StructTreeNode, StructTreeContent } from '@/pdfjs'
import { createElement, removeNullCharacters } from '@/utils'
import { LayerBuilder } from './layer-builder'
import { TextLayerBuilder } from './text-layer-builder'

export class StructTreeLayerBuilder extends LayerBuilder {
  private promise?: Promise<StructTreeNode>
  private treeDom?: HTMLElement
  private treePromise?: Promise<HTMLElement | undefined>
  private elementAttributes: Map<string, Map<string, string>> = new Map()
  private elementsToAddToTextLayer?: Map<string, HTMLElement>

  finish() {
    this.promise = this.pdfPage?.getStructTree()
  }

  get rawDims() {
    return this.viewport.rawDims as {
      pageHeight: number
      pageX: number
      pageY: number
    }
  }

  canRegister() {
    return this.hasLayer(TextLayerBuilder)
  }

  canKeep(_keep = true) {
    return true
  }

  protected async build() {
    this.treeDom = await this.resolveTreeDom()

    if (this.treeDom) {
      this.addElementsToTextLayer()

      if (this.canvas && this.treeDom.parentNode !== this.canvas) {
        this.canvas.append(this.treeDom)
      }
    }

    this.show()
  }

  private async resolveTreeDom() {
    if (this.treePromise) {
      return this.treePromise
    }

    const { promise, resolve, reject } = Promise.withResolvers<HTMLElement | undefined>()
    this.treePromise = promise

    try {
      this.treeDom = this.walk(await this.promise)
    } catch (ex) {
      reject(ex)
    }

    this.promise = undefined
    this.treeDom?.classList.add('structTree')
    resolve(this.treeDom)

    return promise
  }

  async getAriaAttributes(annotationId: string) {
    try {
      await this.render()
      return this.elementAttributes.get(annotationId)
    } catch {
      // If the structTree cannot be fetched, parsed, and/or rendered,
      // ensure that e.g. the AnnotationLayer won't break completely.
    }
    return null
  }

  hide() {
    if (!this.treeDom || this.treeDom.hidden) return

    this.treeDom.hidden = true
    this.dispatch('hide')
  }

  show() {
    if (!this.treeDom?.hidden) return

    this.treeDom.hidden = false
    this.dispatch('show')
  }

  private setAttributes(structElement: StructTreeNode | StructTreeContent, htmlElement: HTMLElement) {
    const alt = 'alt' in structElement ? structElement.alt as string : undefined
    const id = 'id' in structElement ? structElement.id as string : undefined
    const lang = 'lang' in structElement ? structElement.lang as string : undefined

    if (alt !== undefined) {
      // Don't add the label in the struct tree layer but on the annotation
      // in the annotation layer.
      let added = false
      const label = removeNullCharacters(alt)

      if ('children' in structElement) {
        for (const child of structElement.children) {
          if ('type' in child && child.type === 'annotation') {
            let attrs = this.elementAttributes.get(child.id)
            if (!attrs) {
              attrs = new Map()
              this.elementAttributes.set(child.id, attrs)
            }
            attrs.set('aria-label', label)
            added = true
          }
        }
      }

      if (!added) {
        htmlElement.setAttribute('aria-label', label)
      }
    }

    if (id !== undefined) {
      htmlElement.setAttribute('aria-owns', id)
    }

    if (lang !== undefined) {
      htmlElement.setAttribute('lang', removeNullCharacters(lang, true))
    }
  }

  private addImageInTextLayer(node: StructTreeNode, element: HTMLElement) {
    const child = node.children?.[0] as StructTreeContent

    if (!('alt' in node)
      || !('bbox' in node)
      || !this.rawDims
      || !node.alt
      || !node.bbox
      || child?.type !== 'content'
      || !child?.id
    ) {
      return false
    }

    const alt = node.alt as string
    const bbox = node.bbox as number[]

    // We cannot add the created element to the text layer immediately, as the
    // text layer might not be ready yet. Instead, we store the element and add
    // it later in `addElementsToTextLayer`.

    element.setAttribute('aria-owns', child.id)
    const img = document.createElement('span');
    (this.elementsToAddToTextLayer ||= new Map()).set(child.id, img)
    img.setAttribute('role', 'img')
    img.setAttribute('aria-label', removeNullCharacters(alt))

    const { pageHeight, pageX, pageY } = this.rawDims
    const calc = 'calc(var(--scale-factor)*'
    const { style } = img
    style.width = `${calc}${bbox[2] - bbox[0]}px)`
    style.height = `${calc}${bbox[3] - bbox[1]}px)`
    style.left = `${calc}${bbox[0] - pageX}px)`
    style.top = `${calc}${pageHeight - bbox[3] + pageY}px)`

    return true
  }

  addElementsToTextLayer() {
    if (!this.elementsToAddToTextLayer) {
      return
    }

    for (const [id, img] of this.elementsToAddToTextLayer) {
      document.getElementById(id)?.append(img)
    }

    this.elementsToAddToTextLayer?.clear()
    this.elementsToAddToTextLayer = undefined
  }

  private walk(node?: StructTreeNode | StructTreeContent) {
    if (!node) return

    const element = createElement('span')

    if ('role' in node) {
      const match = node.role.match(HEADING_PATTERN)
      const role = PDF_ROLE_TO_HTML_ROLE[node.role as keyof typeof PDF_ROLE_TO_HTML_ROLE]

      if (match) {
        element.setAttribute('role', 'heading')
        element.setAttribute('aria-level', match[1])
      } else if (role) {
        element.setAttribute('role', role)
      }

      if (role === 'Figure' && this.addImageInTextLayer(node, element)) {
        return element
      }
    }

    this.setAttributes(node, element)

    if ('children' in node) {
      if (node.children.length === 1 && 'id' in node.children[0]) {
        this.setAttributes(node.children[0], element)
      } else {
        for (const kid of node.children) {
          const tree = this.walk(kid)
          if (tree) element.append(tree)
        }
      }
    }

    return element
  }
}

const HEADING_PATTERN = /^H(\d+)$/
const PDF_ROLE_TO_HTML_ROLE = {
  // Document level structure types
  Document: null, // There's a "document" role, but it doesn't make sense here.
  DocumentFragment: null,
  // Grouping level structure types
  Part: 'group',
  Sect: 'group', // XXX: There's a "section" role, but it's abstract.
  Div: 'group',
  Aside: 'note',
  NonStruct: 'none',
  // Block level structure types
  P: null,
  // H<n>,
  H: 'heading',
  Title: null,
  FENote: 'note',
  // Sub-block level structure type
  Sub: 'group',
  // General inline level structure types
  Lbl: null,
  Span: null,
  Em: null,
  Strong: null,
  Link: 'link',
  Annot: 'note',
  Form: 'form',
  // Ruby and Warichu structure types
  Ruby: null,
  RB: null,
  RT: null,
  RP: null,
  Warichu: null,
  WT: null,
  WP: null,
  // List standard structure types
  L: 'list',
  LI: 'listitem',
  LBody: null,
  // Table standard structure types
  Table: 'table',
  TR: 'row',
  TH: 'columnheader',
  TD: 'cell',
  THead: 'columnheader',
  TBody: null,
  TFoot: null,
  // Standard structure type Caption
  Caption: null,
  // Standard structure type Figure
  Figure: 'figure',
  // Standard structure type Formula
  Formula: null,
  // standard structure type Artifact
  Artifact: null,
}
