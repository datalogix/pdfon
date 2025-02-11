import type { LayerBuilder } from '@/viewer'
import { Plugin, type ToolbarItemType } from '../plugin'
import { FindController } from './find-controller'
import { FindHighlighter } from './find-highlighter'
import { FindToolbarItem } from './find-toolbar-item'

export type FindPluginParams = {
  updateMatchesCountOnProgress?: boolean
}

export class FindPlugin extends Plugin<FindPluginParams> {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['find', FindToolbarItem],
    ])
  }

  private findController?: FindController
  private findHighlighters = new Map<number, FindHighlighter>()

  protected init() {
    this.findController = new FindController(
      this.viewer,
      this.resolvedParams?.updateMatchesCountOnProgress,
    )

    this.on('OnePageRendered', () => this.findController?.init())
    this.on('Find', params => this.findController?.find(params))
    this.on('FindBarClose', () => this.findController?.close())
    this.on('PagesDestroy', () => this.destroy())

    this.on('TextLayerBuilderShow', ({ source }) => this.getFindHighlighter(source)?.enable())
    this.on('TextLayerBuilderHide', ({ source }) => this.getFindHighlighter(source)?.disable())
    this.on('TextLayerBuilderCancel', ({ source }) => this.getFindHighlighter(source)?.disable())
    this.on('TextLayerBuilderRender', ({ source }) => {
      const findHighlighter = this.getFindHighlighter(source)
      findHighlighter?.setTextMapping(source.textLayer.textDivs, source.textLayer.textContentItemsStr)
      queueMicrotask(() => findHighlighter?.enable())
    })

    this.on('XfaLayerBuilderCancel', ({ source }) => this.getFindHighlighter(source)?.disable())
    this.on('XfaLayerBuilderRender', ({ source, textDivs, items }) => {
      const findHighlighter = this.getFindHighlighter(source)
      findHighlighter?.setTextMapping(textDivs, items)
      queueMicrotask(() => findHighlighter?.enable())
    })
  }

  protected destroy() {
    this.findHighlighters.forEach(findHighlighter => findHighlighter.disable())
    this.findHighlighters.clear()
    this.findController?.reset()
  }

  protected getFindHighlighter(layerBuilder: LayerBuilder) {
    if (this.findHighlighters.has(layerBuilder.id)) {
      return this.findHighlighters.get(layerBuilder.id)
    }

    const findHighlighter = new FindHighlighter(layerBuilder.id - 1, this.findController)
    this.findHighlighters.set(layerBuilder.id, findHighlighter)
    return findHighlighter
  }
}
