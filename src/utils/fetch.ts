import { ofetch, $fetch, type $Fetch, type FetchRequest, type FetchOptions } from 'ofetch'

export type {
  $Fetch,
  FetchRequest,
  FetchOptions,
}

export {
  $fetch,
}

export function createFetch(defaults?: FetchOptions) {
  return ofetch.create({
    headers: { Accept: 'application/json' },
    ...defaults,
  })
}
