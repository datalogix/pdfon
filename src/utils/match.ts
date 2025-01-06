export function approximateFraction(x: number) {
  if (Math.floor(x) === x) {
    return [x, 1]
  }

  const xInverse = 1 / x
  const limit = 8

  if (xInverse > limit) {
    return [1, limit]
  } else if (Math.floor(xInverse) === xInverse) {
    return [1, xInverse]
  }

  const x_ = x > 1 ? xInverse : x
  let a = 0,
    b = 1,
    c = 1,
    d = 1

  while (true) {
    const p = a + c,
      q = b + d
    if (q > limit) {
      break
    }
    if (x_ <= p / q) {
      c = p
      d = q
    } else {
      a = p
      b = q
    }
  }

  let result
  if (x_ - a / b < c / d - x_) {
    result = x_ === x ? [a, b] : [b, a]
  } else {
    result = x_ === x ? [c, d] : [d, c]
  }

  return result
}

export function floorToDivide(value: number, divisor: number) {
  return value - (value % divisor)
}
