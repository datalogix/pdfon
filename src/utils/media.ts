import { createElement } from './dom'

const mediaExtensions = {
  video: ['.webm', '.mp4'],
  audio: ['.mp3'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
} as const

export function getMediaType(filename: string): keyof typeof mediaExtensions | null {
  return Object.entries(mediaExtensions)
    .flatMap(
      ([type, extensions]) => extensions.some(ext => filename.toLowerCase().endsWith(ext)) ? type : [],
    )[0] as keyof typeof mediaExtensions || null
}

export function createMediaElement(src: string): HTMLImageElement | HTMLAudioElement | HTMLVideoElement | null {
  const type = getMediaType(src)

  if (!type) {
    return null
  }

  return createElement(type === 'image' ? 'img' : type, {
    src,
    ...(type !== 'image' && {
      controlsList: 'nodownload',
      controls: true,
      autoplay: true,
      preload: 'auto',
    }),
  })
}

export function isValidURL(str: string) {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

export function parseContent(content: string): HTMLImageElement | HTMLAudioElement | HTMLVideoElement | HTMLIFrameElement | HTMLDivElement {
  const media = createMediaElement(content)

  if (media) {
    return media
  }

  if (isValidURL(content)) {
    return createElement('iframe', {
      src: content,
      width: '100%',
      height: '100%',
      frameborder: 0,
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      allowfullscreen: 'true',
    })
  }

  return createElement('div', { innerHTML: content })
}
