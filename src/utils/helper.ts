import { name as packageName, version as packageVersion } from '../../package.json'

export {
  packageName,
  packageVersion,
}

export function makeKey(key?: string, prefix?: string) {
  return [packageName, prefix, key].filter(value => !!value).join('-')
}

export function generateName(obj: any, suffix?: string) {
  const name = String(typeof obj === 'function' ? obj.name : typeof obj === 'string' ? obj : obj.constructor.name)
  const result = suffix && name.endsWith(suffix)
    ? name.slice(0, -suffix.length)
    : name

  return result.toLowerCase()
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
