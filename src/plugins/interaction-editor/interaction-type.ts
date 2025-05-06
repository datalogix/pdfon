import { createField, type Field, type CreateFieldProps } from '@/tools'

export type InteractionTypes = Map<string, InteractionTypeField>
export type InteractionTypeFieldProps = Partial<CreateFieldProps & { option?: string }>

export class InteractionTypeField {
  readonly option?: string
  readonly field: Field

  constructor(props?: InteractionTypeFieldProps) {
    this.option = props?.option

    delete props?.option

    this.field = createField({
      label: false,
      name: 'content',
      required: true,
      ...props,
    })
  }

  async render(container: HTMLElement) {
    container.appendChild(this.field.container)
    this.field.focus()
  }
}
