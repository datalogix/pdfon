import * as plugins from '@/plugins'
import * as toolbar from '@/toolbar'

export const DEFAULT_PLUGINS: plugins.PluginType[] = [
  plugins.AnnotationEditorPlugin,
  plugins.BookmarkPlugin,
  plugins.CopyPlugin,
  plugins.CursorPlugin,
  plugins.DownloadPlugin,
  plugins.FindPlugin,
  plugins.InformationPlugin,
  plugins.InteractionPlugin,
  plugins.LoadingPlugin,
  plugins.LibraryPlugin,
  plugins.NotifyPlugin,
  plugins.OpenPlugin,
  plugins.PresentationPlugin,
  plugins.PrintPlugin,
  plugins.ResizePlugin,
  plugins.ResolutionPlugin,
  plugins.ResourcePlugin,
  plugins.ScriptingPlugin,
  plugins.SidebarPlugin,
  plugins.StatsPlugin,
  plugins.StoragePlugin,
  plugins.ThumbnailPlugin,
  plugins.WatermarkPlugin,
  plugins.ZoomPlugin,
]

export const DEFAULT_TOOLBAR = [
  'sidebar divider find divider paginate',
  'zoom-out zoom-in zoom-select',
  'annotation-editor-group divider menu',
]

export const DEFAULT_TOOLBAR_ITEMS = new Map<string, toolbar.ToolbarItemType>([
  ['divider', toolbar.Divider],

  // pagination
  ['current-page', toolbar.CurrentPage],
  ['first-page', toolbar.FirstPage],
  ['input-page', toolbar.InputPage],
  ['last-page', toolbar.LastPage],
  ['next-page', toolbar.NextPage],
  ['previous-page', toolbar.PreviousPage],
  ['paginate', toolbar.Paginate],

  // rotate
  ['rotate-cw', toolbar.RotateCw],
  ['rotate-ccw', toolbar.RotateCcw],

  // scroll
  ['scroll-group', toolbar.ScrollGroup],
  ['scroll-horizontal', toolbar.ScrollHorizontal],
  ['scroll-page', toolbar.ScrollPage],
  ['scroll-vertical', toolbar.ScrollVertical],
  ['scroll-wrapped', toolbar.ScrollWrapped],

  // spread
  ['spread-even', toolbar.SpreadEven],
  ['spread-group', toolbar.SpreadGroup],
  ['spread-none', toolbar.SpreadNone],
  ['spread-odd', toolbar.SpreadOdd],

  // zoom
  ['zoom-in', toolbar.ZoomIn],
  ['zoom-out', toolbar.ZoomOut],
  ['zoom-select', toolbar.ZoomSelect],

  // menu
  ['menu', toolbar.Menu],
])

export const DEFAULT_OPTIONS = {
  toolbarOptions: {
    toolbar: DEFAULT_TOOLBAR,
  },
}
