import { ProgressBar } from '@/tools'
import { createElement } from '@/utils'
import { SidebarItem } from '../sidebar'
import type { InteractionPlugin } from './interaction-plugin'
import { createInteractionButton } from './interaction'

export class InteractionSidebarItem extends SidebarItem {
  private renderAbortController?: AbortController

  get interactionPlugin() {
    return this.viewer.getLayerProperty<InteractionPlugin>('InteractionPlugin')!
  }

  get interactionManager() {
    return this.interactionPlugin.interactionManager
  }

  get order() {
    return 2
  }

  build() {
    const container = createElement('div', 'interaction-sidebar')
    this.on(['Interactions', 'InteractionDestroy'], () => this.renderList(container))
    this.renderList(container)
    return container
  }

  protected renderList(container: HTMLElement) {
    container.innerHTML = ''

    if (this.renderAbortController) {
      this.renderAbortController.abort()
    }

    this.renderAbortController = new AbortController()

    const progressBar = new ProgressBar(
      this.interactionManager?.length,
      this.interactionManager?.completed.length ?? 0,
    )

    this.on('InteractionUpdated', () => {
      progressBar.value = this.interactionManager?.completed.length ?? 0
      summaryValue.innerText = this.interactionPlugin.translate('progress', {
        value: progressBar.value,
        total: progressBar.total,
      })
    }, { signal: this.renderAbortController.signal })

    const summary = createElement('div', 'interaction-summary')
    const summaryValue = createElement('span', 'interaction-summary-value', {
      innerText: this.interactionPlugin.translate('progress', {
        value: progressBar.value,
        total: progressBar.total,
      }),
    })

    summary.appendChild(createElement('span', 'interaction-summary-title', {
      innerText: this.interactionPlugin.translate('title'),
    }))
    summary.appendChild(summaryValue)

    const filter = createElement('label', 'interaction-filter')
    const input = createElement('input', [], { type: 'checkbox' })
    const span = createElement('span', [], { innerText: this.interactionPlugin.translate('filter') })

    filter.appendChild(input)
    filter.appendChild(span)

    const header = createElement('header')
    header.appendChild(summary)
    header.appendChild(progressBar.render())
    header.appendChild(filter)

    container.appendChild(header)

    const list = createElement('div', 'interaction-group')

    this.interactionManager?.getGroupedByPage().forEach((interactions) => {
      const ul = createElement('ul', 'interaction-list')

      interactions.forEach((interaction) => {
        const button = createInteractionButton(interaction, false)
        const content = createElement('span', 'interaction-content')
        const header = createElement('span', 'interaction-header')
        header.appendChild(createElement('i', 'interaction-icon'))
        header.appendChild(createElement('span', 'interaction-page', {
          innerText: this.interactionPlugin.translate('page', { page: interaction.page }),
        }))

        content.appendChild(header)
        if (interaction.title) content.appendChild(createElement('span', 'interaction-title', { innerText: interaction.title }))

        button.appendChild(content)
        button.appendChild(createElement('span', 'interaction-animation'))
        button.addEventListener('click', () => this.interactionManager?.select(interaction))

        this.on(`InteractionUpdated${interaction.id}`, () => {
          button.classList.remove('interaction-uncompleted')
          button.classList.add('interaction-completed')
        }, { signal: this.renderAbortController?.signal })

        const li = createElement('li')
        li.appendChild(button)
        ul.appendChild(li)
      })

      list.appendChild(ul)
    })

    container.appendChild(list)
  }
}
