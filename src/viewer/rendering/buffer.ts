export interface BufferItem {
  get id(): number
  destroy(): void
}

export class Buffer<T extends BufferItem> implements Iterable<T> {
  private buf = new Set<T>()
  private size = 0

  constructor(size: number) {
    this.size = size
  }

  reset() {
    while (this.buf.size) {
      this.destroyFirstView()
    }
  }

  push(view: T) {
    if (this.buf.has(view)) {
      this.buf.delete(view)
    }

    this.buf.add(view)

    if (this.buf.size > this.size) {
      this.destroyFirstView()
    }
  }

  resize(newSize: number, idsToKeep?: Set<number> | undefined) {
    this.size = newSize

    if (idsToKeep && idsToKeep.size) {
      const ii = this.buf.size
      let i = 1
      for (const view of this.buf) {
        if (idsToKeep.has(view.id)) {
          this.buf.delete(view)
          this.buf.add(view)
        }

        if (++i > ii) {
          break
        }
      }
    }

    while (this.buf.size > this.size) {
      this.destroyFirstView()
    }
  }

  has(view: T) {
    return this.buf.has(view)
  }

  [Symbol.iterator]() {
    return this.buf.keys()
  }

  private destroyFirstView() {
    const firstView = this.buf.keys().next().value
    if (!firstView) return

    firstView.destroy()
    this.buf.delete(firstView)
  }
}
