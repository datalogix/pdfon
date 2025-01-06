import { BaseTreeViewer } from './BaseTreeViewer'
import type { Attachment } from './AttachmentViewer'
import type { EventBus, PDFDocumentProxy, IDownloadManager, IL10n, IPDFLinkService } from './viewer/types'
import { SidebarView } from './viewer/enums'
import { createElement } from '@/tools'

type Outline = {
  count: number
  items: Outline[]

  url?: string
  newWindow?: boolean
  action?: string
  attachment?: Attachment
  dest?: any
  setOCGState?: Object

  bold?: boolean
  italic?: boolean

  title: string
}

type PDFOutlineViewerRenderParameters = {
  outline?: Outline[]
  pdfDocument: PDFDocumentProxy
}

export class PDFOutlineViewer extends BaseTreeViewer<PDFOutlineViewerRenderParameters> {
  private outline?: Outline[]
  private pdfDocument?: PDFDocumentProxy
  private currentPageNumber: number = 1
  private isPagesLoaded?: boolean
  private currentOutlineItemCapability?: PromiseWithResolvers<boolean>
  private pageNumberToDestHashCapability?: PromiseWithResolvers<Map<number, string> | null>
  private sidebarView?: SidebarView

  constructor(public readonly options: {
    container: HTMLDivElement
    eventBus: EventBus
    l10n: IL10n
    linkService: IPDFLinkService
    downloadManager: IDownloadManager
  }) {
    super(options)

    this.options.eventBus.on('toggleoutlinetree', this.toggleAllTreeItems.bind(this))
    this.options.eventBus.on('currentoutlineitem', this.currentOutlineItem.bind(this))

    this.options.eventBus.on('pagechanging', (evt: { pageNumber: number }) => {
      this.currentPageNumber = evt.pageNumber
    })

    this.options.eventBus.on('pagesloaded', (evt: { pagesCount: number }) => {
      this.isPagesLoaded = !!evt.pagesCount
      this.currentOutlineItemCapability?.resolve(this.isPagesLoaded)
    })

    this.options.eventBus.on('sidebarviewchanged', (evt: { view: SidebarView }) => {
      this.sidebarView = evt.view
    })
  }

  reset() {
    super.reset()
    this.outline = undefined
    this.currentPageNumber = 1
    this.isPagesLoaded = undefined
    this.currentOutlineItemCapability?.resolve(false)
    this.currentOutlineItemCapability = undefined
  }

  protected dispatchEvent(outlineCount: number) {
    this.currentOutlineItemCapability = Promise.withResolvers()

    if (
      outlineCount === 0
      || this.pdfDocument?.loadingParams.disableAutoFetch
    ) {
      this.currentOutlineItemCapability.resolve(false)
    }
    else if (this.isPagesLoaded !== undefined) {
      this.currentOutlineItemCapability.resolve(this.isPagesLoaded)
    }

    this.options.eventBus.dispatch('outlineloaded', {
      source: this,
      outlineCount,
      currentOutlineItemPromise: this.currentOutlineItemCapability.promise,
    })
  }

  protected addToggleButton(div: HTMLDivElement, { count, items }: Outline) {
    let hidden = false

    if (count < 0) {
      let totalCount = items.length

      if (totalCount > 0) {
        const queue = [...items]

        while (queue.length > 0) {
          const { count: nestedCount, items: nestedItems } = queue.shift()!

          if (nestedCount > 0 && nestedItems.length > 0) {
            totalCount += nestedItems.length
            queue.push(...nestedItems)
          }
        }
      }

      if (Math.abs(count) === totalCount) {
        hidden = true
      }
    }

    super.addToggleButton(div, hidden)
  }

  protected toggleAllTreeItems() {
    if (!this.outline) return

    super.toggleAllTreeItems()
  }

  protected render({ outline, pdfDocument }: PDFOutlineViewerRenderParameters) {
    if (this.outline) this.reset()

    this.outline = outline
    this.pdfDocument = pdfDocument

    if (!outline) {
      this.dispatchEvent(0)
      return
    }

    const fragment = document.createDocumentFragment()
    const queue: { parent: DocumentFragment | HTMLDivElement, items: Outline[] }[] = [
      { parent: fragment, items: outline },
    ]

    let outlineCount = 0
    let hasAnyNesting = false

    while (queue.length > 0) {
      const levelData = queue.shift()!

      for (const item of levelData.items) {
        const div = createElement('div')
        div.className = 'treeItem'

        const element = createElement('a')
        this.bindLink(element, item)
        this.setStyles(element, item)

        element.textContent = this.normalizeTextContent(item.title)
        div.append(element)

        if (item.items.length > 0) {
          hasAnyNesting = true
          this.addToggleButton(div, item)

          const itemsDiv = createElement('div')
          itemsDiv.className = 'treeItems'
          div.append(itemsDiv)

          queue.push({ parent: itemsDiv, items: item.items })
        }

        levelData.parent.append(div)
        outlineCount++
      }
    }

    this.finishRendering(fragment, outlineCount, hasAnyNesting)
  }

  private async currentOutlineItem() {
    if (!this.isPagesLoaded) {
      throw new Error('currentOutlineItem: All pages have not been loaded.')
    }

    if (!this.outline || !this.pdfDocument) {
      return
    }

    const pageNumberToDestHash = await this.getPageNumberToDestHash(this.pdfDocument)

    if (!pageNumberToDestHash) {
      return
    }

    this.updateCurrentTreeItem()

    if (this.sidebarView !== SidebarView.OUTLINE) {
      return
    }

    for (let i = this.currentPageNumber; i > 0; i--) {
      const destHash = pageNumberToDestHash.get(i)
      if (!destHash) continue

      const linkElement = this.options.container.querySelector(`a[href="${destHash}"]`)
      if (!linkElement) continue

      this.scrollToCurrentTreeItem(linkElement.parentNode as HTMLElement)
      break
    }
  }

  private setStyles(element: HTMLAnchorElement, item: Outline) {
    if (item.bold) {
      element.style.fontWeight = 'bold'
    }

    if (item.italic) {
      element.style.fontStyle = 'italic'
    }
  }

  private bindLink(element: HTMLAnchorElement, item: Outline) {
    if (item.url) {
      this.options.linkService.addLinkAttributes(element, item.url, item.newWindow)
      return
    }

    if (item.action) {
      element.href = this.options.linkService.getAnchorUrl('')
      element.addEventListener(
        'click',
        () => {
          this.options.linkService.executeNamedAction(item.action!)
          return false
        },
        true,
      )
      return
    }

    if (item.attachment) {
      element.href = this.options.linkService.getAnchorUrl('')
      element.addEventListener(
        'click',
        () => {
          this.options.downloadManager.openOrDownloadData(
            item.attachment!.content,
            item.attachment!.filename,
          )
          return false
        },
        true,
      )
      return
    }

    if (item.setOCGState) {
      element.href = this.options.linkService.getAnchorUrl('')
      element.addEventListener(
        'click',
        () => {
          this.options.linkService.executeSetOCGState(item.setOCGState!)
          return false
        },
        true,
      )
      return
    }

    element.href = this.options.linkService.getDestinationHash(item.dest)
    element.addEventListener(
      'click',
      (event: MouseEvent) => {
        this.updateCurrentTreeItem((event.target as HTMLElement).parentNode as HTMLElement)

        if (item.dest) {
          this.options.linkService.goToDestination(item.dest)
        }

        return false
      },
      true,
    )
  }

  private async getPageNumberToDestHash(pdfDocument: PDFDocumentProxy) {
    if (this.pageNumberToDestHashCapability) {
      return this.pageNumberToDestHashCapability.promise
    }

    this.pageNumberToDestHashCapability = Promise.withResolvers()

    const pageNumberToDestHash = new Map()
    const pageNumberNesting = new Map()

    const queue = [{ nesting: 0, items: this.outline || [] }]

    while (queue.length > 0) {
      const levelData = queue.shift()
      const currentNesting = levelData?.nesting!

      for (const { dest, items } of levelData!.items) {
        let explicitDest: any[] | null = null
        let pageNumber: number | null = null

        if (typeof dest === 'string') {
          explicitDest = await pdfDocument.getDestination(dest)

          if (pdfDocument !== this.pdfDocument) {
            return null
          }
        }
        else {
          explicitDest = dest
        }

        if (Array.isArray(explicitDest)) {
          const [destRef] = explicitDest

          if (destRef && typeof destRef === 'object') {
            pageNumber = pdfDocument.cachedPageNumber(destRef)
          }
          else if (Number.isInteger(destRef)) {
            pageNumber = destRef + 1
          }

          if (
            Number.isInteger(pageNumber)
            && (!pageNumberToDestHash.has(pageNumber)
            || currentNesting > pageNumberNesting.get(pageNumber))
          ) {
            const destHash = this.options.linkService.getDestinationHash(dest)
            pageNumberToDestHash.set(pageNumber, destHash)
            pageNumberNesting.set(pageNumber, currentNesting)
          }
        }

        if (items.length > 0) {
          queue.push({ nesting: currentNesting + 1, items })
        }
      }
    }

    this.pageNumberToDestHashCapability.resolve(pageNumberToDestHash.size > 0 ? pageNumberToDestHash : null)

    return this.pageNumberToDestHashCapability.promise
  }
}
