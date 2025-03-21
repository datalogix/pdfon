import { PDFDocumentProxy } from './viewer/pdfjs'
import { BaseTreeViewer } from './BaseTreeViewer'
import { OptionalContentConfig } from './viewer/types'
import { createElement } from '@/tools'

export type LayerViewerRenderParameters = {
  optionalContentConfig?: OptionalContentConfig
  pdfDocument?: PDFDocumentProxy
}

export class LayerViewer extends BaseTreeViewer<LayerViewerRenderParameters> {
  private optionalContentConfig?: OptionalContentConfig
  private optionalContentHash?: string
  private pdfDocument?: PDFDocumentProxy

  constructor(options: {
    container: HTMLDivElement
    eventBus: any
    l10n: any
  }) {
    super(options)

    this.options.eventBus.on('optionalcontentconfigchanged', (evt: any) => this.updateLayers(evt.promise))
    this.options.eventBus.on('resetlayers', () => this.updateLayers())
    this.options.eventBus.on('togglelayerstree', this.toggleAllTreeItems.bind(this))
  }

  reset() {
    super.reset()
    this.optionalContentConfig = undefined
    this.optionalContentHash = undefined
  }

  protected dispatchEvent(layersCount: number) {
    this.options.eventBus.dispatch('layersloaded', {
      source: this,
      layersCount,
    })
  }

  protected bindLink(element: HTMLAnchorElement, { groupId, input }: { groupId: any, input: HTMLInputElement }) {
    const setVisibility = () => {
      this.optionalContentConfig?.setVisibility(groupId, input.checked)
      this.optionalContentHash = this.optionalContentConfig?.getHash()

      this.options.eventBus.dispatch('optionalcontentconfig', {
        source: this,
        promise: Promise.resolve(this.optionalContentConfig),
      })
    }

    element.onclick = (evt) => {
      if (evt.target === input) {
        setVisibility()
        return true
      } else if (evt.target !== element) {
        return true
      }

      input.checked = !input.checked
      setVisibility()
      return false
    }
  }

  private async setNestedName(element: HTMLAnchorElement, { name = null }) {
    if (typeof name === 'string') {
      element.textContent = this.normalizeTextContent(name)
      return
    }

    element.setAttribute('data-l10n-id', 'pdfjs-additional-layers')
    element.style.fontStyle = 'italic'
    this.options.l10n.translateOnce(element)
  }

  protected addToggleButton(div: HTMLDivElement, { name = null }) {
    super.addToggleButton(div, /* hidden = */ name === null)
  }

  protected toggleAllTreeItems() {
    if (!this.optionalContentConfig) {
      return
    }

    super.toggleAllTreeItems()
  }

  render({ optionalContentConfig, pdfDocument }: LayerViewerRenderParameters) {
    if (this.optionalContentConfig) {
      this.reset()
    }

    this.optionalContentConfig = optionalContentConfig || undefined
    this.pdfDocument = pdfDocument || undefined

    const groups = optionalContentConfig?.getOrder()

    if (!groups) {
      this.dispatchEvent(/* layersCount = */ 0)
      return
    }

    this.optionalContentHash = optionalContentConfig?.getHash()

    const fragment = document.createDocumentFragment()
    const queue: { parent: DocumentFragment | HTMLElement, groups: any }[] = [{ parent: fragment, groups }]

    let layersCount = 0
    let hasAnyNesting = false

    while (queue.length > 0) {
      const levelData = queue.shift()

      for (const groupId of levelData?.groups) {
        const div = createElement('div')
        div.className = 'treeItem'

        const element = createElement('a')
        div.append(element)

        if (typeof groupId === 'object') {
          hasAnyNesting = true
          this.addToggleButton(div, groupId)
          this.setNestedName(element, groupId)

          const itemsDiv = createElement('div')
          itemsDiv.className = 'treeItems'
          div.append(itemsDiv)

          queue.push({ parent: itemsDiv, groups: groupId.order })
        } else {
          const group = optionalContentConfig?.getGroup(groupId)

          const input = createElement('input')
          this.bindLink(element, { groupId, input })
          input.type = 'checkbox'
          input.checked = group.visible

          const label = createElement('label')
          label.textContent = this.normalizeTextContent(group.name)

          label.append(input)
          element.append(label)
          layersCount++
        }

        levelData?.parent.append(div)
      }
    }

    this.finishRendering(fragment, layersCount, hasAnyNesting)
  }

  private async updateLayers(promise = null) {
    if (!this.optionalContentConfig) {
      return

    }
    const pdfDocument = this.pdfDocument
    const optionalContentConfig = await (promise || pdfDocument?.getOptionalContentConfig({ intent: 'display' }))

    if (pdfDocument !== this.pdfDocument) {
      return // The document was closed while the optional content resolved.
    }

    if (promise) {
      if (optionalContentConfig?.getHash() === this.optionalContentHash) {
        return // The optional content didn't change, hence no need to reset the UI.
      }
    } else {
      this.options.eventBus.dispatch('optionalcontentconfig', {
        source: this,
        promise: Promise.resolve(optionalContentConfig),
      })
    }

    // Reset the sidebarView to the new state.
    this.render({
      optionalContentConfig,
      pdfDocument: this.pdfDocument,
    })
  }
}
