import { createField, type Field, type CreateFieldProps } from '@/tools'

export type InteractionTypes = Map<string, InteractionTypeField>
export type InteractionTypeFieldProps = Partial<CreateFieldProps & { option?: string }>

let trixLoaded: boolean = false

export class InteractionTypeField {
  readonly option?: string
  readonly field: Field

  constructor(props?: InteractionTypeFieldProps) {
    this.option = props?.option

    delete props?.option

    this.field = createField({
      ...props,
      label: false,
      name: 'content',
      required: true,
    })
  }

  async render(container: HTMLElement) {
    container.appendChild(this.field.container)
    this.field.focus()
  }
}

export class InteractionTypeFieldTrix extends InteractionTypeField {
  constructor() {
    super({
      id: `trix-editor-${crypto.randomUUID()}`,
      type: 'hidden',
    })
  }

  async render(container: HTMLElement) {
    if (!trixLoaded) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await import('trix')

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await import('trix/dist/trix.css')

      trixLoaded = true
    }

    const editor = document.createElement('trix-editor')
    editor.classList.add('trix-content')
    editor.setAttribute('input', this.field.id)

    container.append(editor, this.field.container)
    this.field.focus()
  }
}
