import { makeKey } from '@/utils'
import { defineStorageDriver } from '../storage-driver'

export const sessionStorageDriver = (prefix?: string) => defineStorageDriver({
  load(key) {
    return sessionStorage.getItem(makeKey(key, prefix))
  },

  save(key, serialized) {
    sessionStorage.setItem(makeKey(key, prefix), serialized)
  },
})
