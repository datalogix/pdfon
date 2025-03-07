import { get, set } from 'idb-keyval'
import { makeKey } from '@/utils'
import { defineStorageDriver } from '../storage-driver'

export const indexedDBDriver = (prefix?: string) => defineStorageDriver({
  async load(key) {
    return await get(makeKey(key, prefix))
  },

  async save(key, serialized) {
    await set(makeKey(key, prefix), serialized)
  },
})
