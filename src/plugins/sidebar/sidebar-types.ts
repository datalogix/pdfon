export enum SidebarTypes {
  THUMBNAIL = 'thumbnail',
  OUTLINE = 'outline',
  ATTACHMENT = 'attachment',
  LAYER = 'layer',
}

export type SidebarType = string | SidebarTypes

export function apiPageModeToSidebar(mode: string) {
  switch (mode) {
    case 'UseThumbs':
      return SidebarTypes.THUMBNAIL
    case 'UseOutlines':
      return SidebarTypes.OUTLINE
    case 'UseAttachments':
      return SidebarTypes.ATTACHMENT
    case 'UseOC':
      return SidebarTypes.LAYER
  }
}
