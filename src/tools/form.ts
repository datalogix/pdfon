import { $fetch, type FetchOptions } from 'ofetch'
import { createElement } from '@/utils'

export type FormPrepareData = (formData: FormData) => Promise<void> | void
export type FormOnSubmit<T> = (formData: FormData) => Promise<T> | T
export type FormOnSuccess<T> = (data: T) => void
export type FormOnError = (e: unknown, formData: FormData) => void
export type FormField = HTMLElement | Field

export type FormOptions<T> = {
  fields?: FormField[]
  url?: string
  fetchOptions?: FetchOptions<'json', any>
  buttonElement?: HTMLButtonElement
  buttonText?: string
  prepareData?: FormPrepareData
  onSubmit?: FormOnSubmit<T>
  onSuccess?: FormOnSuccess<T>
  onError?: FormOnError
}

export class Form<T> {
  private _fields: FormField[] = []
  private _buttonSubmit: HTMLButtonElement
  private _loading: boolean = false
  private _prepareData?: FormPrepareData
  private _onSubmit?: FormOnSubmit<T>
  private _onSuccess?: FormOnSuccess<T>
  private _onError?: FormOnError

  constructor(readonly options?: FormOptions<T>) {
    this.addField(...(options?.fields ?? []))
    this.prepareData(options?.prepareData)
    this.onSubmit(options?.onSubmit)
    this.onSuccess(options?.onSuccess)
    this.onError(options?.onError)

    this._buttonSubmit = options?.buttonElement ?? createElement('button', {
      type: 'submit',
      innerText: options?.buttonText ?? 'Enviar',
    })
  }

  get isLoading() {
    return this._loading
  }

  get fields() {
    return this._fields
  }

  addField(...fields: FormField[]) {
    this._fields.push(...fields)
  }

  prepareData(fn?: FormPrepareData) {
    this._prepareData = fn
  }

  onSubmit(fn?: FormOnSubmit<T>) {
    this._onSubmit = fn
  }

  onSuccess(fn?: FormOnSuccess<T>) {
    this._onSuccess = fn
  }

  onError(fn?: FormOnError) {
    this._onError = fn
  }

  render() {
    const form = createElement('form', 'form')
    form.append(...this.fields.map(field => (field as any).container ? (field as Field).container : field))
    form.append(this._buttonSubmit)
    form.addEventListener('submit', (event: SubmitEvent) => this.submit(event))

    return form
  }

  protected startLoading() {
    this._loading = true
    this._buttonSubmit.disabled = true
    this._buttonSubmit.classList.add('loading')
  }

  protected finishLoading() {
    this._loading = false
    this._buttonSubmit.disabled = false
    this._buttonSubmit.classList.remove('loading')
  }

  protected async submit(event: SubmitEvent) {
    event.preventDefault()

    if (this.isLoading) {
      return
    }

    this.startLoading()

    const formData = new FormData(event.currentTarget as HTMLFormElement)

    try {
      let data

      if (this.options?.url) {
        await this._prepareData?.(formData)

        data = await $fetch<T>(this.options?.url, {
          method: 'post',
          body: formData,
          ...this.options?.fetchOptions ?? {},
        })
      } else {
        data = await this._onSubmit?.(formData)
      }

      this._onSuccess?.(data as T)
    } catch (e) {
      this._onError?.(e, formData)
    } finally {
      this.finishLoading()
    }
  }
}

export function createForm<T>(props?: FormOptions<T>) {
  return new Form(props)
}

export type Field = (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) & {
  container: HTMLDivElement
  label?: HTMLLabelElement
}

export type CreateFieldProps = {
  name: string
  field?: 'input' | 'select' | 'textarea'
  label?: string | boolean
  [key: string]: any
}

export function createField(props: CreateFieldProps): Field {
  const container = createElement('div', 'field')
  let label: HTMLLabelElement | undefined

  if (props.label || props.label === undefined) {
    label = container.appendChild(createElement('label', { innerText: props.label ?? props.name }))
  }

  const options = props.options
  const tag = props.field ?? (options ? 'select' : 'input')

  const fieldProps = { ...props }
  delete fieldProps.label
  delete fieldProps.options

  if (tag === 'input') {
    fieldProps.type = fieldProps.type ?? (fieldProps.accept ? 'file' : 'text')
  }

  const field = container.appendChild(createElement(tag, fieldProps))

  if (Array.isArray(options)) {
    options.forEach((option: { value: string, text: string }) => {
      field.appendChild(createElement('option', { value: option.value, innerText: option.text }))
    })
  }

  return new Proxy(field, {
    get(target, prop) {
      if (prop === 'container') return container
      if (prop === 'label') return label

      const value = Reflect.get(target, prop)
      return typeof value === 'function' ? value.bind(field) : value
    },
  }) as Field
}
