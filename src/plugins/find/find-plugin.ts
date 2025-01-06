import type { LayerBuilder } from '@/viewer'
import { Plugin, type ToolbarItemType } from '../plugin'
import { FindController } from './find-controller'
import { FindHighlighter } from './find-highlighter'
import { FindToolbarItem } from './find-toolbar-item'

export class FindPlugin extends Plugin {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['find', FindToolbarItem],
    ])
  }

  private findController?: FindController
  private findHighlighters = new Map<number, FindHighlighter>()

  constructor(readonly updateMatchesCountOnProgress = true) {
    super()
  }

  protected init(): Promise<void> | void {
    this.findController = new FindController(this.viewer, this.updateMatchesCountOnProgress)

    this.on('onepagerendered', () => this.findController?.init())
    this.on('find', params => this.findController?.find(params))
    this.on('findbarclose', () => this.findController?.close())
    this.on('pagesdestroy', () => this.findController?.reset())

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
      findHighlighter?.enable()
    })
  }

  protected destroy() {
    this.findController?.reset()
    this.findController = undefined
    this.findHighlighters.clear()
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
