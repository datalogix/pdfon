import { createValidAbsoluteUrl, isPdfFile, IDownloadManager } from '@/pdfjs'
import { createElement } from '@/utils'

export class DownloadManager implements IDownloadManager {
  private openBlobUrls = new WeakMap()

  downloadData(data: Uint8Array, filename: string, contentType: string) {
    this.execute(URL.createObjectURL(new Blob([data], { type: contentType })), filename)
  }

  openOrDownloadData(data: Uint8Array, filename: string, dest?: string) {
    const isPdfData = isPdfFile(filename)
    const contentType = isPdfData ? 'application/pdf' : ''

    if (isPdfData) {
      let blobUrl = this.openBlobUrls.get(data)

      if (!blobUrl) {
        blobUrl = URL.createObjectURL(new Blob([data], { type: contentType }))
        this.openBlobUrls.set(data, blobUrl)
      }

      let viewerUrl = '?file=' + encodeURIComponent(blobUrl + '#' + filename)

      if (dest) {
        viewerUrl += `#${encodeURIComponent(dest)}`
      }

      try {
        window.open(viewerUrl)
        return true
      } catch (ex) {
        console.error(`openOrDownloadData: ${ex}`)
        // Release the `blobUrl`, since opening it failed, and fallback to
        // downloading the PDF file.
        URL.revokeObjectURL(blobUrl)
        this.openBlobUrls.delete(data)
      }
    }

    this.downloadData(data, filename, contentType)
    return false
  }

  download(data: Uint8Array | undefined, url: string, filename: string) {
    let blobUrl: string

    if (data) {
      blobUrl = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
    } else {
      if (!createValidAbsoluteUrl(url, 'http://example.com')) {
        console.error(`download - not a valid URL: ${url}`)
        return
      }

      blobUrl = url + '#action=download'
    }

    this.execute(blobUrl, filename)
  }

  private execute(href: string, filename: string) {
    const a = createElement('a')

    if (!a.click) {
      throw new Error('DownloadManager: "a.click()" is not supported.')
    }

    a.href = href
    a.target = '_parent'

    // Use a.download if available. This increases the likelihood that
    // the file is downloaded instead of opened by another PDF plugin.
    if ('download' in a) {
      a.download = filename
    }

    (document.body || document.documentElement).append(a)
    a.click()
    a.remove()
  }
}
