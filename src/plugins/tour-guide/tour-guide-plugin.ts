import { TourGuideClient } from '@sjmc11/tourguidejs'
import { Divider, ToolbarGroup, type ToolbarItem, type ToolbarItemType } from '@/toolbar'
import { createElement } from '@/utils'
import { name } from '../../../package.json'
import { Plugin } from '../plugin'
import { TourGuideToolbarItem } from './tour-guide-toolbar-item'

export type TourGuidePluginParams = {
  storageKey: string
}

export class TourGuidePlugin extends Plugin<TourGuidePluginParams> {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['tour-guide', TourGuideToolbarItem],
    ])
  }

  private _tourGuide?: TourGuideClient
  private storageKey?: string

  get tourGuide() {
    return this._tourGuide
  }

  protected init() {
    this.on('toolbarinit', () => this.resolveToolbarItems())
    this.on('documentinitialized', () => this.buildTourGuide(), { once: true })
  }

  protected onLoad(params?: TourGuidePluginParams) {
    this.storageKey = params?.storageKey ?? `${name}-tour-guide`
  }

  protected disableTourGuide() {
    localStorage.setItem(this.storageKey!, 'disabled')
    this._tourGuide?.exit()
  }

  protected resolveToolbarItems() {
    const setAttributes = (item: ToolbarItem) => {
      item.render().setAttribute('data-tg-title', this.l10n.get(`toolbar.${item.name}.title`))
      item.render().setAttribute('data-tg-tour', this.l10n.get(`toolbar.${item.name}.help`))
    }

    this.toolbar.items.forEach((item) => {
      if (item instanceof Divider || item instanceof TourGuideToolbarItem) {
        return
      }

      if (item instanceof ToolbarGroup) {
        item.items.forEach(i => setAttributes(i))
      } else {
        setAttributes(item)
      }
    })
  }

  protected buildTourGuide() {
    this._tourGuide = new TourGuideClient({
      debug: false,
      showStepDots: false,
      targetPadding: 0,
      completeOnFinish: false,
      dialogZ: 999999,
      steps: [this.firstStep(), this.lastStep()],
      prevLabel: this.l10n.get('tour-guide.prev'),
      nextLabel: this.l10n.get('tour-guide.next'),
      dialogMaxWidth: 380,
    })

    if (localStorage.getItem(this.storageKey!) !== 'disabled') {
      this._tourGuide?.start()
    }
  }

  protected firstStep() {
    const button = createElement('button', { type: 'button', innerText: this.l10n.get('tour-guide.dont-show-again') })
    button.addEventListener('click', () => this.disableTourGuide())

    const container = createElement('div', 'tour-guide-content')
    container.appendChild(createElement('div', { innerHTML: this.l10n.get('tour-guide.welcome.content') }))
    container.appendChild(button)

    return {
      title: this.l10n.get('tour-guide.welcome.title'),
      content: container,
      order: 0,
    }
  }

  protected lastStep() {
    return {
      title: this.l10n.get('tour-guide.thanks.title'),
      content: createElement('div', 'tour-guide-content', { innerHTML: this.l10n.get('tour-guide.thanks.content') }),
      order: 999999,
    }
  }
}
