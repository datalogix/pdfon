export function serialize(value: any) {
  return JSON.stringify(value, stringifyReplacer)
}

export function deserialize(text: string | null, defaultValue?: any) {
  if (!text) {
    return defaultValue
  }

  try {
    return JSON.parse(text, parseReviver)
  } catch (error) {
    console.error('Failed to deserialize:', error)
    return defaultValue
  }
}

type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array

type TypedArrayConstructor<T = TypedArray> = {
  new (...args: any[]): T
  from(array: Iterable<number> | ArrayLike<bigint>): T
}

const TYPES_TO_SERIALIZE: Record<string, TypedArrayConstructor> = {
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  BigInt64Array,
  BigUint64Array,
}

function getSerializedType(value: any): string | null {
  return Object.keys(TYPES_TO_SERIALIZE).find(type => value instanceof TYPES_TO_SERIALIZE[type]) ?? null
}

function stringifyReplacer(_key: string, value: any) {
  if (value === null || typeof value !== 'object') return value

  if (value instanceof Map) {
    return { _meta: { type: 'Map' }, value: Array.from(value.entries()) }
  }

  if (value instanceof Set) {
    return { _meta: { type: 'Set' }, value: Array.from(value) }
  }

  if ('_meta' in value) {
    return { ...value, _meta: { type: 'escaped-meta', value: value._meta } }
  }

  const typeName = getSerializedType(value)

  if (typeName) {
    return { _meta: { type: typeName }, value: Array.from(value) }
  }

  return value
}

function parseReviver(_key: string, value: any) {
  if (value === null || typeof value !== 'object' || !value._meta) return value

  const { type } = value._meta

  if (type === 'Map') return new Map(value.value)
  if (type === 'Set') return new Set(value.value)
  if (type === 'escaped-meta') return { ...value, _meta: value._meta.value }

  const TypedArrayClass = TYPES_TO_SERIALIZE[type]

  if (TypedArrayClass && typeof TypedArrayClass.from === 'function') {
    return TypedArrayClass.from(value.value)
  }

  console.warn('Unexpected meta:', type)
  return value
}
