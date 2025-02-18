import { name } from '../../../../package.json'
import { defineStorageDriver } from '../storage-driver'

export const sessionStorageDriver = (prefix?: string) => defineStorageDriver({
  load(key) {
    return sessionStorage.getItem(`${prefix ?? name}-${key}`) ?? '{}'
  },

  save(key, serialized) {
    sessionStorage.setItem(`${prefix ?? name}-${key}`, serialized)
  },
})
