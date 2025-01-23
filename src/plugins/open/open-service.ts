import { stopEvent } from '@/pdfjs'
import { IL10n } from '@/l10n'
import { createElement } from '@/utils'

export class OpenService {
  protected fileInput?: HTMLInputElement
  protected dropzone?: HTMLDivElement
  protected _onChooseFile?: (file: File, blob: string) => void

  constructor(
    readonly container: HTMLDivElement,
    readonly l10n: IL10n,
  ) {
    this.setupFileInput()
    this.setupDropzone()
    this.hideDropzone()
  }

  onChooseFile(callback?: (file: File, blob: string) => void) {
    this._onChooseFile = callback
  }

  chooseFile() {
    this.fileInput?.click()
  }

  showDropzone() {
    if (!this.dropzone) return

    this.dropzone.hidden = false
    this.dropzone.classList.remove('hidden')
  }

  hideDropzone() {
    if (!this.dropzone) return

    this.dropzone.hidden = true
    this.dropzone.classList.add('hidden')
  }

  destroy() {
    this.fileInput?.remove()
    this.fileInput = undefined
    this.dropzone?.remove()
    this.dropzone = undefined
  }

  protected select(file: File) {
    if (!this._onChooseFile) return

    this._onChooseFile(file, URL.createObjectURL(file))
  }

  protected setupFileInput() {
    const fileInput = this.fileInput = createElement('input', {
      type: 'file',
      id: 'open-file',
      hidden: true,
    })

    fileInput.addEventListener('change', (e) => {
      const { files } = e.target as HTMLInputElement

      if (!files || files.length === 0) {
        return
      }

      this.select(files[0])
      fileInput.value = ''
    })

    this.container.appendChild(fileInput)
  }

  protected setupDropzone() {
    const dropzone = this.dropzone = this.container.appendChild(createElement('div', 'open-dropzone'))
    const span = createElement('span', { innerText: this.l10n.get('open.description') })
    span.addEventListener('click', () => this.fileInput?.click())
    dropzone.appendChild(span)

    this.container.addEventListener('dragover', (event) => {
      if (!event.dataTransfer) return

      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        if (event.dataTransfer.items[i].type === 'application/pdf') {
          event.dataTransfer.dropEffect = event.dataTransfer.effectAllowed === 'copy' ? 'copy' : 'move'
          dropzone.classList.add('open-dragover')
          stopEvent(event)
          return
        }
      }
    })

    this.container.addEventListener('dragleave', (e) => {
      if (!this.container.contains(e.relatedTarget as HTMLDivElement)) {
        dropzone.classList.remove('open-dragover')
      }
    })

    this.container.addEventListener('drop', (event) => {
      if (event.dataTransfer?.files?.[0].type !== 'application/pdf') return
      dropzone.classList.remove('open-dragover')
      stopEvent(event)
      this.select(event.dataTransfer.files[0])
    })
  }
}
