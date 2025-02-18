import { name } from '../../../../package.json'
import { defineStorageDriver } from '../storage-driver'

export const localStorageDriver = (prefix?: string) => defineStorageDriver({
  load(key) {
    return localStorage.getItem(`${prefix ?? name}-${key}`) ?? '{}'
  },

  save(key, serialized) {
    localStorage.setItem(`${prefix ?? name}-${key}`, serialized)
  },
})
