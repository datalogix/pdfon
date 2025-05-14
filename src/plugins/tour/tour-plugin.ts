import { TourGuideClient as TourClient } from '@sjmc11/tourguidejs'
import { Divider, ToolbarGroup, type ToolbarItem, type ToolbarItemType } from '@/toolbar'
import { createElement } from '@/utils'
import { Plugin } from '../plugin'
import { localStorageDriver } from '../storage'
import { TourToolbarItem } from './tour-toolbar-item'

export class TourPlugin extends Plugin {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['tour', TourToolbarItem],
    ])
  }

  private _tour?: TourClient
  private storage = localStorageDriver()

  get tour() {
    return this._tour
  }

  protected init() {
    this.on('ToolbarInit', () => this.resolveToolbarItems())
    this.on('DocumentInitialized', async () => await this.buildTour(), { once: true })
  }

  protected async disableTour() {
    this._tour?.exit()

    await this.storage.save(this.name, 'disabled')
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

  protected async buildTour() {
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
      activeStepInteraction: false,
    })

    const enabled = await this.storage.load(this.name) !== 'disabled'

    if (enabled) {
      this._tour?.start()
    }
  }

  protected steps() {
    return [this.firstStep(), this.lastStep()]
  }

  protected firstStep() {
    const button = createElement('button', { type: 'button', innerText: this.translate('dont-show-again') })
    button.addEventListener('click', async () => await this.disableTour())

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
