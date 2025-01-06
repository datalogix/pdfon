import { SidebarItem } from '@/toolbar'
import { ProgressBar } from '@/tools'
import { createElement } from '@/utils'
import type { InteractionPlugin } from './interaction-plugin'

export class InteractionSidebarItem extends SidebarItem {
  get interactionService() {
    return this.viewer.getLayerProperty<InteractionPlugin>('InteractionPlugin')?.interactionService
  }

  build() {
    const container = createElement('div', 'interaction-sidebar')
    this.on('interactionloaded', () => this.renderList(container))
    this.renderList(container)
    return container
  }

  protected renderList(container: HTMLElement) {
    container.innerHTML = ''

    const progressBar = new ProgressBar(
      this.interactionService?.all().length,
      this.interactionService?.completed.length ?? 0,
    )

    this.on('interactionupdated', () => {
      progressBar.value = this.interactionService?.completed.length ?? 0
    })

    const summary = createElement('div', 'interaction-summary')
    summary.appendChild(createElement('span', 'interaction-summary-title', { innerText: this.l10n.get('interaction.title') }))
    summary.appendChild(createElement('span', 'interaction-summary-value', {
      innerText: this.l10n.get('interaction.progress', {
        value: progressBar.value,
        total: progressBar.total,
      }),
    }))

    const filter = createElement('label', 'interaction-filter')
    const input = createElement('input', [], { type: 'checkbox' })
    const span = createElement('span', [], { innerText: this.l10n.get('interaction.filter') })

    filter.appendChild(input)
    filter.appendChild(span)

    const header = createElement('header')
    header.appendChild(summary)
    header.appendChild(progressBar.render())
    header.appendChild(filter)

    container.appendChild(header)

    const list = createElement('div', 'interaction-group')

    this.interactionService?.allGroup().forEach((interactions) => {
      const ul = createElement('ul', 'interaction-list')

      interactions.forEach((interaction) => {
        const button = createElement('button', [
          'interaction',
          `interaction-${interaction.type}`,
          `interaction-${interaction.completed ? 'completed' : 'uncompleted'}`,
        ], { type: 'button' })

        const content = createElement('span', 'interaction-content')
        const header = createElement('span', 'interaction-header')
        header.appendChild(createElement('i', 'interaction-icon'))
        header.appendChild(createElement('span', 'interaction-page', { innerText: this.l10n.get('interaction.page', { page: interaction.page }) }))

        content.appendChild(header)
        if (interaction.title) content.appendChild(createElement('span', 'interaction-title', { innerText: interaction.title }))

        button.appendChild(content)
        button.appendChild(createElement('span', 'interaction-animation'))
        button.addEventListener('click', () => this.dispatch('interactionselect', { interaction }))

        this.on(`interactionupdated${interaction.id}`, () => {
          button.classList.remove('interaction-uncompleted')
          button.classList.add('interaction-completed')
        })

        const li = createElement('li')
        li.appendChild(button)
        ul.appendChild(li)
      })

      list.appendChild(ul)
    })

    container.appendChild(list)
  }
}
