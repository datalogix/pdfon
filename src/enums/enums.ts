export enum TextLayerMode {
  DISABLE = 0,
  ENABLE = 1,
  ENABLE_PERMISSIONS = 2,
}

export enum PresentationModeState {
  UNKNOWN = 0,
  NORMAL = 1,
  CHANGING = 2,
  FULLSCREEN = 3,
}

export enum ScrollMode {
  UNKNOWN = -1,
  VERTICAL = 0,
  HORIZONTAL = 1,
  WRAPPED = 2,
  PAGE = 3,
}

export enum SpreadMode {
  UNKNOWN = -1,
  NONE = 0,
  ODD = 1,
  EVEN = 2,
}

export enum RenderingStates {
  ERROR = -1,
  INITIAL = 0,
  RUNNING = 1,
  PAUSED = 2,
  FINISHED = 3,
}

export enum SidebarTypes {
  THUMBNAIL = 'thumbnail',
  OUTLINE = 'outline',
  ATTACHMENT = 'attachment',
  LAYER = 'layer',
}

export type SidebarType = string | SidebarTypes
