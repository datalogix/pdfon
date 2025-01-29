export type Resolveable<T> = T | Promise<T> | (() => T | Promise<T>)
export type ResolvedParams<T> = { [K in keyof T]: Resolveable<T[K]> }

type ResolvedProperty<T> = T extends Resolveable<infer U> ? Promise<U> : T

export async function resolveValue<T>(value: Resolveable<T>, ...params: any[]) {
  return typeof value === 'function'
    ? Promise.resolve((value as (...args: any[]) => T)(...params))
    : Promise.resolve(value)
}

export function createResolvedObject<T>(obj: ResolvedParams<T>, ...params: any[]) {
  return new Proxy(obj, {
    get(target, prop: string | symbol) {
      const value = target[prop as keyof T]
      return resolveValue(value, ...params)
    },
  }) as {
    [K in keyof T]: ResolvedProperty<T[K]>;
  }
}

export async function resolveObject<T>(obj: { [K in keyof T]: ResolvedProperty<T[K]> }) {
  const resolvedObj = {} as { [K in keyof T]: Awaited<ResolvedProperty<T[K]>> }

  for (const key of Object.keys(obj) as (keyof T)[]) {
    resolvedObj[key] = await obj[key]
  }

  return resolvedObj
}
