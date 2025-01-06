export class Scripting {
  private ready: Promise<{
    create: (data: object) => void
    dispatchEvent: (event: object) => void
    nukeSandbox: () => void
  }>

  constructor(sandboxBundleSrc?: string) {
    sandboxBundleSrc ??= new URL(
      'pdfjs-dist/build/pdf.sandbox.mjs',
      import.meta.url,
    ).toString()

    this.ready = new Promise((resolve, reject) => {
      import(/* @vite-ignore */sandboxBundleSrc).then((pdfjsSandbox) => {
        resolve(pdfjsSandbox.QuickJSSandbox())
      }).catch(reject)
    })
  }

  async createSandbox(data: object) {
    const sandbox = await this.ready
    sandbox.create(data)
  }

  async dispatchEventInSandbox(event: object) {
    const sandbox = await this.ready
    setTimeout(() => sandbox.dispatchEvent(event), 0)
  }

  async destroySandbox() {
    const sandbox = await this.ready
    sandbox.nukeSandbox()
  }
}
