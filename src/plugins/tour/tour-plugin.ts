import { TourGuideClient as TourClient } from '@sjmc11/tourguidejs'
import { Divider, ToolbarGroup, type ToolbarItem, type ToolbarItemType } from '@/toolbar'
import { createElement } from '@/utils'
import { name } from '../../../package.json'
import { Plugin } from '../plugin'
import { TourToolbarItem } from './tour-toolbar-item'

export type TourPluginParams = {
  storageKey: string
}

export class TourPlugin extends Plugin<TourPluginParams> {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['tour', TourToolbarItem],
    ])
  }

  private _tour?: TourClient

  get tour() {
    return this._tour
  }

  get storageKey() {
    return this.resolvedParams?.storageKey ?? `${name}-${this.name}`
  }

  protected init() {
    this.on('ToolbarInit', () => this.resolveToolbarItems())
    this.on('DocumentInitialized', () => this.buildTour(), { once: true })
  }

  protected disableTour() {
    localStorage.setItem(this.storageKey, 'disabled')
    this._tour?.exit()
  }

  protected resolveToolbarItems() {
    const setAttributes = (item: ToolbarItem) => {
      item.render().setAttribute('data-tg-title', item.translate('title'))
      item.render().setAttribute('data-tg-tour', item.translate('help'))
    }

    this.toolbar.items.forEach((item) => {
      if (item instanceof Divider || item instanceof TourToolbarItem) {
        return
      }

      if (item instanceof ToolbarGroup) {
        item.items.forEach(i => setAttributes(i))
      } else {
        setAttributes(item)
      }
    })
  }

  protected buildTour() {
    this._tour = new TourClient({
      debug: false,
      showStepDots: false,
      targetPadding: 0,
      completeOnFinish: false,
      steps: this.steps(),
      prevLabel: this.translate('prev'),
      nextLabel: this.translate('next'),
      finishLabel: this.translate('finish'),
      dialogMaxWidth: 380,
    })

    if (localStorage.getItem(this.storageKey) !== 'disabled') {
      this._tour?.start()
    }
  }

  protected steps() {
    return [this.firstStep(), this.lastStep()]
  }

  protected firstStep() {
    const button = createElement('button', { type: 'button', innerText: this.translate('dont-show-again') })
    button.addEventListener('click', () => this.disableTour())

    const container = createElement('div', `${this.name}-content`)
    container.appendChild(createElement('div', { innerHTML: this.translate('welcome.content') }))
    container.appendChild(button)

    return {
      title: this.translate('welcome.title'),
      content: container,
      order: 0,
    }
  }

  protected lastStep() {
    return {
      title: this.translate('thanks.title'),
      content: createElement('div', `${this.name}-content`, { innerHTML: this.translate('thanks.content') }),
      order: 999999,
    }
  }
}
