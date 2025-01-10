export function removeNullCharacters(str: string, replaceInvisible?: boolean) {
  const invisibleCharsRegExp = /[\x00-\x1F]/g

  if (!invisibleCharsRegExp.test(str)) {
    return str
  }

  if (replaceInvisible) {
    return str.replaceAll(invisibleCharsRegExp, m => m === '\x00' ? '' : ' ')
  }

  return str.replaceAll('\x00', '')
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  const formattedHours = String(hours).padStart(2, '0')
  const formattedMinutes = String(minutes).padStart(2, '0')
  const formattedSeconds = String(remainingSeconds).padStart(2, '0')

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
}
