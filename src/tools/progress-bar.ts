import { createElement } from '@/utils'

export class ProgressBar {
  protected container = createElement('div', 'progress-bar')
  protected bar = this.container.appendChild(createElement('div', 'bar'))
  protected span = this.container.appendChild(createElement('span', 'percentage'))
  private _total
  private _value
  onEnd?: () => void

  constructor(total: number = 0, value = 0, container?: HTMLElement) {
    this._total = total
    this._value = value
    this.update()
    container?.appendChild(this.render())
  }

  get total() {
    return this._total
  }

  set total(n) {
    this._total = n
    this.update()
  }

  get value() {
    return this._value
  }

  set value(n) {
    this._value = n
    this.update()
  }

  get percentage() {
    return this._value > 0 ? this._value * 100 / this._total : 0
  }

  get percentageForHumans() {
    return new Intl.NumberFormat('pt-BR', { style: 'percent' }).format(this._value > 0 ? this._value / this._total : 0)
  }

  private update() {
    this.container.classList.remove('completed')

    if (this.percentage > 50) this.container.classList.add('half')
    if (this.percentage === 100) this.container.classList.add('completed')

    this.span.innerText = this.percentageForHumans
    this.container.dataset.percentage = this.span.innerText.replace('%', '').trim()

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.bar.offsetHeight
    this.bar.style.width = `${this.percentage}%`

    const onTransitionEnd = () => {
      if (this.percentage === 100 && this.onEnd) {
        setTimeout(this.onEnd, 300)
      }

      this.bar.removeEventListener('transitionend', onTransitionEnd)
    }

    this.bar.addEventListener('transitionend', onTransitionEnd)
    if (this.percentage === 100 && this.onEnd) this.onEnd()
  }

  render() {
    return this.container
  }
}
