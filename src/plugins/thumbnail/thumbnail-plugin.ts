import { Plugin } from '../plugin'
import type { SidebarPlugin } from '../sidebar'
import { ThumbnailLayerBuilder } from './thumbnail-layer-builder'
import { ThumbnailSidebarItem } from './thumbnail-sidebar-item'

export class ThumbnailPlugin extends Plugin {
  protected layerBuilders = [ThumbnailLayerBuilder]
  private thumbnailSidebarItem = new ThumbnailSidebarItem()

  get sidebarManager() {
    return this.viewer.getLayerProperty<SidebarPlugin>('SidebarPlugin')?.sidebarManager
  }

  protected onLoad() {
    this.sidebarManager?.add(this.thumbnailSidebarItem)
  }

  protected destroy() {
    this.sidebarManager?.delete(this.thumbnailSidebarItem)
  }
}
