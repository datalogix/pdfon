import type { Translator } from '@/l10n'
import { createField, createForm, FormOptions } from '@/tools'
import { createElement } from '@/utils'
import type { Interaction } from '../interaction'
import type { InteractionTypes } from './interaction-type'

export function createInteractionForm(
  types: InteractionTypes,
  { translate }: Translator,
  formOptions?: FormOptions<Interaction>,
) {
  const type = createField({
    label: false,
    name: 'type',
    required: true,
    placeholder: translate('form.type.placeholder'),
    options: [
      ...types.entries().map(([key, interactionType]) => ({
        value: key,
        text: interactionType.option ?? translate(`form.${key}.option`),
      })),
    ],
  })

  const content = createElement('div')

  const title = createField({
    label: false,
    name: 'title',
    maxLength: 50,
    placeholder: translate('form.title.placeholder'),
  })

  type.addEventListener('change', async () => {
    content.innerHTML = ''

    const interactionType = types.get(type.value)

    if (!interactionType) {
      return
    }

    await interactionType.render(content)
  })

  return createForm({
    fields: [type, content, title],
    ...formOptions,
  })
}
