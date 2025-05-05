import { name, version } from '../../package.json'

export {
  name,
  version,
}

export function makeKey(key?: string, prefix?: string) {
  return [name, prefix, key].filter(value => !!value).join('-')
}

export function expose(obj: any, exposer: any, exclude?: string[]) {
  const prototype = Object.getPrototypeOf(exposer)
  const descriptors = Object.getOwnPropertyDescriptors(prototype)

  for (const key in descriptors) {
    if (exclude?.includes(key)) {
      continue
    }

    const descriptor = descriptors[key]

    if (descriptor.get || descriptor.set) {
      Object.defineProperty(obj, key, {
        ...descriptor,
        get: descriptor?.get ? () => exposer[key] : undefined,
        set: descriptor?.set ? (val) => { exposer[key] = val } : undefined,
      })
    } else if (typeof exposer[key] === 'function') {
      obj[key] = exposer[key].bind(exposer)
    }
  }
}
