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

  protected init(): Promise<void> | void {
    this.findController = new FindController(this.viewer, this.params?.updateMatchesCountOnProgress)

    this.on('onepagerendered', () => this.findController?.init())
    this.on('find', params => this.findController?.find(params))
    this.on('findbarclose', () => this.findController?.close())
    this.on('pagesdestroy', () => this.destroy())

    this.on('textlayerbuildershow', ({ source }) => this.getFindHighlighter(source)?.enable())
    this.on('textlayerbuilderhide', ({ source }) => this.getFindHighlighter(source)?.disable())
    this.on('textlayerbuildercancel', ({ source }) => this.getFindHighlighter(source)?.disable())
    this.on('textlayerbuilderrender', ({ source }) => {
      const findHighlighter = this.getFindHighlighter(source)
      findHighlighter?.setTextMapping(source.textLayer.textDivs, source.textLayer.textContentItemsStr)
      queueMicrotask(() => findHighlighter?.enable())
    })

    this.on('xfalayerbuildercancel', ({ source }) => this.getFindHighlighter(source)?.disable())
    this.on('xfalayerbuilderrender', ({ source, textDivs, items }) => {
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
