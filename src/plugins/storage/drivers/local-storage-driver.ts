import { makeKey } from '@/utils'
import { defineStorageDriver } from '../storage-driver'

export const localStorageDriver = (prefix?: string) => defineStorageDriver({
  load(key) {
    return localStorage.getItem(makeKey(key, prefix))
  },

  save(key, serialized) {
    localStorage.setItem(makeKey(key, prefix), serialized)
  },
})
