import { ofetch, type FetchRequest, type FetchOptions } from 'ofetch'
import { type Resolveable, resolveValue } from '@/utils'
import { defineStorageDriver } from '../storage-driver'

export const httpStorageDriver = (options?: {
  defaults?: FetchOptions
  load?: Resolveable<{ request?: FetchRequest, options?: FetchOptions<'json'> } | string>
  save?: Resolveable<{ request?: FetchRequest, options?: FetchOptions } | string>
}) => {
  const fetch = ofetch.create({
    headers: { 'Content-Type': 'application/json' },
    ...options?.defaults,
  })

  return defineStorageDriver({
    async load(key) {
      const params = await resolveValue(options?.load, key)
      const request = typeof params === 'string' ? params : params?.request
      const _options = typeof params === 'string' ? {} : params?.options

      return fetch<'json'>(request ?? '/', { method: 'get', query: { key }, ..._options })
    },

    async save(key, serialized, data) {
      const params = await resolveValue(options?.save, key)
      const request = typeof params === 'string' ? params : params?.request
      const _options = typeof params === 'string' ? {} : params?.options

      await fetch(request ?? '/', { method: 'post', body: { key, serialized, data }, ..._options })
    },
  })
}
