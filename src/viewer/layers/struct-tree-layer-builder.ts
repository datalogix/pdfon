import type { StructTreeNode, StructTreeContent } from '@/pdfjs'
import { createElement, removeNullCharacters } from '@/utils'
import { LayerBuilder } from './layer-builder'
import { TextLayerBuilder } from './text-layer-builder'

export class StructTreeLayerBuilder extends LayerBuilder {
  private _treeDom?: HTMLElement

  get treeDom() {
    return this._treeDom
  }

  canRegister() {
    return this.hasLayer(TextLayerBuilder)
  }

  canKeep(_keep = true) {
    return true
  }

  protected async build() {
    if (!this._treeDom) {
      const structTree = await this.pdfPage?.getStructTree()
      const treeDom = walk(structTree)
      treeDom?.classList.add('structTree')
      this._treeDom = treeDom
    }

    if (this._treeDom) {
      this.canvas?.append(this._treeDom)
    }

    this.show()
  }

  hide() {
    if (!this._treeDom || this._treeDom.hidden) return

    this._treeDom.hidden = true
    this.dispatch('hide')
  }

  show() {
    if (!this._treeDom?.hidden) return

    this._treeDom.hidden = false
    this.dispatch('show')
  }
}

const HEADING_PATTERN = /^H(\d+)$/
const PDF_ROLE_TO_HTML_ROLE = {
  Document: null,
  DocumentFragment: null,
  Part: 'group',
  Sect: 'group',
  Div: 'group',
  Aside: 'note',
  NonStruct: 'none',
  P: null,
  H: 'heading',
  Title: null,
  FENote: 'note',
  Sub: 'group',
  Lbl: null,
  Span: null,
  Em: null,
  Strong: null,
  Link: 'link',
  Annot: 'note',
  Form: 'form',
  Ruby: null,
  RB: null,
  RT: null,
  RP: null,
  Warichu: null,
  WT: null,
  WP: null,
  L: 'list',
  LI: 'listitem',
  LBody: null,
  Table: 'table',
  TR: 'row',
  TH: 'columnheader',
  TD: 'cell',
  THead: 'columnheader',
  TBody: null,
  TFoot: null,
  Caption: null,
  Figure: 'figure',
  Formula: null,
  Artifact: null,
}

function walk(node?: StructTreeNode | StructTreeContent) {
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
  }

  setAttributes(node, element)

  if ('children' in node) {
    if (node.children.length === 1 && 'id' in node.children[0]) {
      setAttributes(node.children[0], element)
    } else {
      for (const kid of node.children) {
        const tree = walk(kid)
        if (tree) element.append(tree)
      }
    }
  }

  return element
}

function setAttributes(structElement: StructTreeNode | StructTreeContent, htmlElement: HTMLElement) {
  const alt = 'alt' in structElement ? structElement.alt as string : undefined
  const id = 'id' in structElement ? structElement.id as string : undefined
  const lang = 'lang' in structElement ? structElement.lang as string : undefined

  if (alt !== undefined) {
    htmlElement.setAttribute('aria-label', removeNullCharacters(alt))
  }

  if (id !== undefined) {
    htmlElement.setAttribute('aria-owns', id)
  }

  if (lang !== undefined) {
    htmlElement.setAttribute('lang', removeNullCharacters(lang, true))
  }
}
