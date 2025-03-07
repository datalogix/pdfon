export type StorageDriver = {
  load: (key: string) => Promise<string | null | undefined> | string | null | undefined
  save: (key: string, serialized: string, data?: any, force?: boolean) => Promise<void> | void
}

export function defineStorageDriver(driver: StorageDriver) {
  return driver
}
