export type StorageDriver = {
  load: (key: string) => Promise<string> | string
  save: (key: string, serialized: string, data: any) => Promise<void> | void
}

export function defineStorageDriver(driver: StorageDriver) {
  return driver
}
