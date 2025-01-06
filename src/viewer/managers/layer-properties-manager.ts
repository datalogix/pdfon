import { Manager } from './'

export class LayerPropertiesManager extends Manager {
  private properties = new Map<string, any>()

  getLayerProperty<T>(key: string): T | undefined {
    return this.properties.get(key.toLowerCase().replace('plugin', '')) as T | undefined
  }

  addLayerProperty<T>(key: string, value: T) {
    this.properties.set(key.toLowerCase(), value)
  }

  removeLayerProperty(key: string) {
    this.properties.delete(key.toLowerCase())
  }
}
