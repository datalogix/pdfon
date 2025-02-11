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

  get tourGuide() {
    return this._tourGuide
  }

  protected init() {
    this.on('ToolbarInit', () => this.resolveToolbarItems())
    this.on('DocumentInitialized', () => this.buildTourGuide(), { once: true })
  }

  protected disableTourGuide() {
    localStorage.setItem(this.resolvedParams?.storageKey ?? `${name}-tour-guide`, 'disabled')
    this._tourGuide?.exit()
  }

  protected resolveToolbarItems() {
    const setAttributes = (item: ToolbarItem) => {
      item.render().setAttribute('data-tg-title', item.translate('title'))
      item.render().setAttribute('data-tg-tour', item.translate('help'))
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
      steps: [this.firstStep(), this.lastStep()],
      prevLabel: this.translate('prev'),
      nextLabel: this.translate('next'),
      finishLabel: this.translate('finish'),
      dialogMaxWidth: 380,
    })

    if (localStorage.getItem(this.resolvedParams?.storageKey ?? `${name}-tour-guide`) !== 'disabled') {
      this._tourGuide?.start()
    }
  }

  protected firstStep() {
    const button = createElement('button', { type: 'button', innerText: this.translate('dont-show-again') })
    button.addEventListener('click', () => this.disableTourGuide())

    const container = createElement('div', 'tour-guide-content')
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
      content: createElement('div', 'tour-guide-content', { innerHTML: this.translate('thanks.content') }),
      order: 999999,
    }
  }
}
