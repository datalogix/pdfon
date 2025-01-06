import { Dispatcher } from '@/bus'
import type { OptionalContentConfig, RenderTask } from '@/pdfjs'
import { LayerBuilder, type LayerBuilderType } from '../layers'
import type { Page, PageUpdate } from './'

export class LayersPage extends Dispatcher {
  private layers = new Map<number, (Element | null)>()
  private builders: LayerBuilder[] = []

  constructor(
    private readonly page: Page,
    private readonly items: LayerBuilderType[] = [],
  ) {
    super()
  }

  get container() {
    return this.page.div
  }

  get eventBus() {
    return this.page.eventBus
  }

  private resolve(): LayerBuilder[] {
    return this.items.map((item) => {
      if (typeof item === 'function') {
        return new item()
      }

      if (item && item.constructor) {
        /* @ts-expect-error: constructor */
        return new item.constructor(item.params)
      }

      return item
    }).filter(item => !this.builders.find(builder => builder.constructor.name === item.constructor.name))
  }

  async init() {
    const items = this.resolve()

    for (const item of items) {
      item.setPage(this.page)

      await item.init()

      if (item.canRegister()) {
        this.builders.push(item)
      }
    }

    this.builders = this.builders.sort((a, b) => b.priority - a.priority)
  }

  async render(postpone?: boolean) {
    for (const builder of this.builders) {
      const key = builder.name.replace('builder', '')
      let error = null

      try {
        await builder.render(postpone)
      } catch (ex) {
        if (builder.stopOnException(ex)) {
          continue
        }

        error = ex
      } finally {
        this.dispatch(`${key.toLowerCase()}rendered`, { error })
      }
    }
  }

  reset(keep?: boolean) {
    for (let i = this.container.childNodes.length - 1; i >= 0; i--) {
      const node = this.container.childNodes[i]

      if (this.builders.some(builder => node === (keep && builder.div))) {
        continue
      }

      node.remove()

      const index = [...this.layers].find(([, value]) => node === value)?.[0]

      if (index !== undefined) {
        this.layers.set(index, null)
      }
    }

    this.builders
      .filter(builder => builder.canKeep(keep))
      .forEach(builder => builder.hide())
  }

  process(params: PageUpdate) {
    this.builders.forEach(builder => builder.process(params))
  }

  update(params: PageUpdate) {
    this.builders.forEach(builder => builder.update(params))
  }

  updateOptionalContentConfig(optionalContentConfig: OptionalContentConfig) {
    this.builders.forEach(builder => builder.updateOptionalContentConfig(optionalContentConfig))
  }

  find<T>(item: LayerBuilderType) {
    const name = item instanceof LayerBuilder ? item.constructor.name : item.name

    return this.builders.find(builder => builder.constructor.name === name) as T | undefined
  }

  cancel(keep?: boolean) {
    this.builders = this.builders.filter((builder) => {
      if (builder.canCancel(keep)) {
        builder.cancel()
        return false
      }

      return true
    }).sort((a, b) => b.priority - a.priority)
  }

  finish(renderTask: RenderTask) {
    this.builders.forEach(builder => builder.finish(renderTask))
  }

  add(div: HTMLElement, position: number) {
    const oldDiv = this.layers.get(position)

    this.layers.set(position, div)

    if (oldDiv) {
      oldDiv.replaceWith(div)
      return
    }

    for (let i = position - 1; i >= 0; i--) {
      const layer = this.layers.get(i)

      if (layer) {
        layer.after(div)
        return
      }
    }

    this.container.prepend(div)
  }
}
