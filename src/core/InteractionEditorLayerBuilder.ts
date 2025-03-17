import { Interaction } from '@/plugins'
import { Modal } from '@/tools'
import { createElement, dragElement } from '@/utils'
import { LayerBuilder } from '@/viewer'
import { $fetch } from 'ofetch'

export class InteractionEditorLayerBuilder extends LayerBuilder {
  protected build() {
    const div = this.create('interaction-editor-layer', 1)

    div.addEventListener('click', (e) => {
      const form = createNewInteraction({
        page: this.id,
        x: e.offsetX,
        y: e.offsetY,
      }, {
        onSuccess: (interaction: Interaction) => {
          const button = createElement('button', [
            'interaction',
            `interaction-${interaction.type}`,
          ], { type: 'button' })

          button.style.left = `${interaction.x}px`
          button.style.top = `${interaction.y}px`
          button.addEventListener('click', e => e.stopPropagation())

          dragElement(button, {
            onStop: () => {
              // salve position
            },
          })

          div.appendChild(button)
          Modal.close()
        },
      })

      Modal.open(form, {
        title: 'Nova interação',
        backdrop: 'blur',
      })
    })
  }
}

const createNewInteraction = (params: {
  page: number
  x: number
  y: number
}, options?: {
  onSuccess?: (interaction: Interaction) => void
}) => {
  let loading = false
  const form = createElement('form')
  const select = createElement('select', {
    name: 'type',
    required: true,
  })

  select.appendChild(createElement('option', { value: '', innerText: 'Selecione...' }))
  select.appendChild(createElement('option', { value: 'image', innerText: 'Imagem' }))
  select.appendChild(createElement('option', { value: 'audio', innerText: 'Áudio' }))
  select.appendChild(createElement('option', { value: 'video', innerText: 'Vídeo' }))
  select.appendChild(createElement('option', { value: 'link', innerText: 'URL externa' }))
  select.appendChild(createElement('option', { value: 'iframe', innerText: 'Iframe' }))
  select.appendChild(createElement('option', { value: 'text', innerText: 'Texto' }))

  const content = createElement('div')
  const submit = createElement('button', {
    type: 'submit',
    innerText: 'Enviar',
  })

  form.append(select, content, submit)

  form.addEventListener('submit', async (event) => {
    event.preventDefault()

    if (loading) {
      return
    }

    loading = true

    const formData = new FormData(form)
    formData.append('page', params.page.toString())
    formData.append('x', params.x.toString())
    formData.append('y', params.y.toString())

    try {
      const data = await $fetch<Interaction>('api/SampleData', {
        method: 'post',
        body: formData,
      })

      options?.onSuccess?.(data)
    } catch (e) {
      console.log(e)
    } finally {
      loading = false
    }
  })

  return form
}
