import * as idb from 'idb-keyval'
import { makeKey } from './helper'

export async function fetchAndCache(request: RequestInfo | URL) {
  const cachedUrl = await getFromCache(request)

  if (cachedUrl !== request) {
    return cachedUrl
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      await saveInCache(request, response)
      return URL.createObjectURL(await response.blob())
    }
  } catch {
    //
  }

  return cachedUrl
}

export async function getFromCache(request: RequestInfo | URL) {
  if ('caches' in window) {
    const cache = await window.caches.open(makeKey())
    const response = await cache.match(request)

    if (response?.ok) {
      try {
        return URL.createObjectURL(await response.blob())
      } catch {
        //
      }
    }
  }

  const blob = await idb.get(makeKey(request.toString()))

  if (blob) {
    try {
      return URL.createObjectURL(blob)
    } catch {
      //
    }
  }

  return request
}

export async function saveInCache(request: RequestInfo | URL, response: Response) {
  if ('caches' in window) {
    const cache = await window.caches.open(makeKey())
    await cache.put(request, response)
  }

  const blob = await response.blob()
  await idb.set(makeKey(request.toString()), blob)
}
