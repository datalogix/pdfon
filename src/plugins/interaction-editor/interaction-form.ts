import { createField, createForm, FormOptions } from '@/tools'
import { createElement } from '@/utils'
import type { Interaction } from '../interaction'

export function createInteractionForm(options?: FormOptions<Interaction>) {
  const type = createField({
    label: false,
    name: 'type',
    required: true,
    options: [
      { value: '', text: 'Selecione...' },
      { value: 'image', text: 'Imagem' },
      { value: 'audio', text: 'Áudio' },
      { value: 'video', text: 'Vídeo' },
      { value: 'link', text: 'URL externa' },
      { value: 'iframe', text: 'Iframe' },
      { value: 'text', text: 'Texto' },
    ],
  })

  const content = createElement('div')

  const title = createField({
    label: false,
    name: 'title',
    maxLength: 50,
    placeholder: '(Opcional) Digite o título...',
  })

  type.addEventListener('change', () => {
    content.innerHTML = ''

    if (!type.value) return

    let contentField

    switch (type.value) {
      case 'text':
        contentField = createField({
          label: false,
          field: 'textarea',
          name: 'content',
          placeholder: 'Digite o texto...',
          rows: 4,
          required: true,
        })
        break
      case 'link':
      case 'iframe':
        contentField = createField({
          label: false,
          name: 'content',
          placeholder: 'Digite o endereço...',
          type: 'url',
          required: true,
        })
        break

      default: {
        const accepts = {
          image: '.gif,.png,.jpg,.jpeg',
          audio: '.mp3',
          video: '.mp4,.webm',
        }

        contentField = createField({
          label: false,
          name: 'content',
          accept: accepts[type.value as keyof typeof accepts],
          placeholder: 'Selecione o arquivo',
          required: true,
        })
        break
      }
    }

    content.appendChild(contentField.container)
    contentField.focus()
  })

  return createForm({
    fields: [type, content, title],
    ...options,
  })
}
