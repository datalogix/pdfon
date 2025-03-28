import { createFetch, type FetchOptions, type FetchRequest, type Resolveable, resolveValue } from '@/utils'
import { defineStorageDriver } from '../storage-driver'

export const httpStorageDriver = (options?: {
  defaults?: FetchOptions
  load?: Resolveable<{ request?: FetchRequest, options?: FetchOptions<'json'> } | string>
  save?: Resolveable<{ request?: FetchRequest, options?: FetchOptions } | string>
}, interval: number = 10000) => {
  const fetch = createFetch(options?.defaults)

  let saveDate = 0
  let saveController: AbortController

  return defineStorageDriver({
    async load(key) {
      const params = await resolveValue(options?.load, key)
      const request = typeof params === 'string' ? params : params?.request
      const opts = typeof params === 'string' ? {} : params?.options
      return await fetch(request ?? '/', { method: 'get', query: { key }, ...opts })
    },

    async save(key, serialized, data, force) {
      const now = Date.now()

      if (saveDate === 0) {
        saveDate = now
        return
      }

      if (!force && now - saveDate < interval) {
        return
      }

      saveDate = now
      saveController?.abort()
      saveController = new AbortController()

      const params = await resolveValue(options?.save, key)
      const request = typeof params === 'string' ? params : params?.request
      const opts = typeof params === 'string' ? {} : params?.options

      await fetch(request ?? '/', {
        method: 'post',
        body: { key, serialized, data },
        signal: saveController.signal,
        ...opts,
      })
    },
  })
}
