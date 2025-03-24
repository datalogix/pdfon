import { Plugin, type ToolbarItemType } from '../plugin'
import { FullscreenToolbarItem } from './fullscreen-toolbar-item'

const FULLSCREEN_CLASS = 'fullscreen-container'

export type FullscreenPluginParams = {
  enabled?: boolean
}

export class FullscreenPlugin extends Plugin<FullscreenPluginParams> {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['fullscreen', FullscreenToolbarItem],
    ])
  }

  protected onLoad() {
    if (this.resolvedParams?.enabled) {
      this.enable()
    }
  }

  get enabled() {
    return this.rootContainer.classList.contains(FULLSCREEN_CLASS)
  }

  toggle() {
    if (this.enabled) {
      this.disable()
    } else {
      this.enable()
    }
  }

  enable() {
    this.rootContainer.classList.add(FULLSCREEN_CLASS)
  }

  disable() {
    this.rootContainer.classList.remove(FULLSCREEN_CLASS)
  }
}
