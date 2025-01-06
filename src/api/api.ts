import { ofetch, type $Fetch } from 'ofetch'

const LIVRON_HOSTNAME = 'livron.test'
const LIVRON_API = `http://${LIVRON_HOSTNAME}/api`

export type User = {
  external_id: number | string
  name: string
  email: string
}

export class Api {
  private $fetch: $Fetch
  private user?: User

  constructor(bookId: string, apiKey?: string) {
    this.$fetch = createFetch(bookId, apiKey)
  }

  setUser(user: User) {
    this.user = user
  }

  load() {
    return this.$fetch('/')
  }

  stats(type: string, data?: object) {
    return this.$fetch('/stats', {
      method: 'post',
      body: {
        ...data,
        ...{
          type,
          user: this.user,
        },
      },
    })
  }
}

const createFetch = (bookId: string, apiKey?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (!apiKey && window.location.hostname !== LIVRON_HOSTNAME) {
    throw new Error('The API_KEY is required.')
  }

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }

  return ofetch.create({
    baseURL: `${LIVRON_API}/books/${bookId}`,
    headers,
  })
}
