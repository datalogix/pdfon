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
  }

  onChooseFile(callback?: (file: File, blob: string) => void) {
    this._onChooseFile = callback
  }

  chooseFile() {
    this.fileInput?.click()
  }

  showDropzone() {
    if (this.dropzone) {
      this.dropzone.hidden = false
    }
  }

  hideDropzone() {
    if (this.dropzone) {
      this.dropzone.hidden = true
    }
  }

  reset() {
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
    dropzone.appendChild(createElement('span', { innerText: this.l10n.get('open.description') }))

    this.container.addEventListener('dragover', (e) => {
      if (!e.dataTransfer) return

      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        if (e.dataTransfer.items[i].type === 'application/pdf') {
          e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed === 'copy' ? 'copy' : 'move'
          dropzone.classList.add('open-dragover')
          e.preventDefault()
          e.stopPropagation()
          return
        }
      }
    })

    this.container.addEventListener('dragleave', (e) => {
      if (!this.container.contains(e.relatedTarget as HTMLDivElement)) {
        dropzone.classList.remove('open-dragover')
      }
    })

    this.container.addEventListener('drop', (e) => {
      if (e.dataTransfer?.files?.[0].type !== 'application/pdf') return
      dropzone.classList.remove('open-dragover')

      e.preventDefault()
      e.stopPropagation()

      this.select(e.dataTransfer.files[0])
    })
  }
}
