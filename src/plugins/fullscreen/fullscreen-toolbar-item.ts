import { ToolbarAction } from '@/toolbar'
import type { FullscreenPlugin } from './fullscreen-plugin'

export class FullscreenToolbarItem extends ToolbarAction {
  get fullscreenPlugin() {
    return this.viewer.getLayerProperty<FullscreenPlugin>('FullscreenPlugin')!
  }

  get enabled() {
    return true
  }

  get activated() {
    return this.fullscreenPlugin.enabled
  }

  protected init() {
    this.toggle()
  }

  protected execute() {
    this.fullscreenPlugin.toggle()
  }
}
