import { createElement } from '@/tools'
import { BaseTreeViewer } from './BaseTreeViewer'
import { IDownloadManager } from './viewer/types'
import { waitOnEventOrTimeout } from './viewer/utils'

export type Attachment = {
  content: Uint8Array
  filename: string
  description?: string
}

export type AttachmentViewerRenderParameters = {
  attachments?: Attachment[]
  keepRenderedCapability: boolean
}

export class AttachmentViewer extends BaseTreeViewer<AttachmentViewerRenderParameters> {
  private attachments?: Attachment[]
  private renderedCapability?: PromiseWithResolvers<void>
  private pendingDispatchEvent?: boolean

  constructor(public readonly options: {
    container: HTMLDivElement
    eventBus: any
    l10n: any
    downloadManager: IDownloadManager
  }) {
    super(options)

    this.options.eventBus.on('fileattachmentannotation', this.appendAttachment.bind(this))
  }

  reset(keepRenderedCapability: boolean = false) {
    super.reset()
    this.attachments = undefined

    if (!keepRenderedCapability) {
      this.renderedCapability = Promise.withResolvers()
    }

    this.pendingDispatchEvent = false
  }

  protected async dispatchEvent(attachmentsCount: number) {
    this.renderedCapability?.resolve()

    if (attachmentsCount === 0 && !this.pendingDispatchEvent) {
      this.pendingDispatchEvent = true

      await waitOnEventOrTimeout({
        target: this.options.eventBus,
        name: 'annotationlayerrendered',
        delay: 1000,
      })

      if (!this.pendingDispatchEvent) {
        return
      }
    }

    this.pendingDispatchEvent = false

    this.options.eventBus.dispatch('attachmentsloaded', {
      source: this,
      attachmentsCount,
    })
  }

  protected render({ attachments, keepRenderedCapability = false }: AttachmentViewerRenderParameters) {
    if (this.attachments) this.reset(keepRenderedCapability)

    this.attachments = attachments

    if (!attachments) {
      this.dispatchEvent(0)
      return
    }

    const fragment = document.createDocumentFragment()
    let attachmentsCount = 0

    for (const name in attachments) {
      const item = attachments[name]

      const div = createElement('div')
      div.className = 'treeItem'

      const element = createElement('a')
      this.bindLink(element, item)
      element.textContent = this.normalizeTextContent(item.filename)

      div.append(element)

      fragment.append(div)
      attachmentsCount++
    }

    this.finishRendering(fragment, attachmentsCount)
  }

  protected bindLink(element: HTMLAnchorElement, item: Attachment) {
    if (item.description) {
      element.title = item.description
    }

    element.addEventListener(
      'click',
      () => {
        this.options.downloadManager.openOrDownloadData(item.content, item.filename)
        return false
      },
      true,
    )
  }

  private appendAttachment(attachment: Attachment) {
    if (!this.renderedCapability) return

    const renderedPromise = this.renderedCapability.promise

    renderedPromise.then(() => {
      if (renderedPromise !== this.renderedCapability?.promise) {
        return
      }

      const attachments = this.attachments || Object.create(null)

      for (const name in attachments) {
        if (attachment.filename === name) {
          return
        }
      }

      attachments[attachment.filename] = attachment

      this.render({ attachments, keepRenderedCapability: true })
    })
  }
}
