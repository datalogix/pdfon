import * as plugins from '@/plugins'
import * as toolbar from '@/toolbar'

export const DEFAULT_PLUGINS: plugins.PluginType[] = [
  plugins.BookmarkPlugin,
  plugins.CopyPlugin,
  plugins.CursorPlugin,
  plugins.DownloadPlugin,
  plugins.FindPlugin,
  plugins.InteractionPlugin,
  plugins.LoadingPlugin,
  plugins.LibraryPlugin,
  plugins.NotifyPlugin,
  plugins.OpenPlugin,
  plugins.PresentationPlugin,
  plugins.PrintPlugin,
  plugins.ResizePlugin,
  plugins.ResolutionPlugin,
  plugins.ScriptingPlugin,
  plugins.StoragePlugin,
  plugins.ThumbnailPlugin,
  plugins.ZoomPlugin,
]

export const DEFAULT_TOOLBAR = [
  'sidebar find paginate',
  'zoom-out zoom-in zoom-select',
  'annotation menu',
]

export const DEFAULT_TOOLBAR_ITEMS = new Map<string, toolbar.ToolbarItemType>([
  // annotation
  ['annotation', toolbar.Annotation],

  // cursor
  ['cursor-hand', plugins.CursorHand],
  ['cursor-select', plugins.CursorSelect],

  // document
  ['open', plugins.OpenToolbarItem],
  ['download', plugins.DownloadToolbarItem],
  ['print', plugins.PrintToolbarItem],
  ['presentation', plugins.PresentationToolbarItem],

  // find
  ['find', plugins.FindToolbarItem],

  // information
  ['information', toolbar.Information],

  // library
  ['library', plugins.LibraryToolbarItem],

  // pagination
  ['current-page', toolbar.CurrentPage],
  ['first-page', toolbar.FirstPage],
  ['input-page', toolbar.InputPage],
  ['last-page', toolbar.LastPage],
  ['next-page', toolbar.NextPage],
  ['previous-page', toolbar.PreviousPage],
  ['paginate', toolbar.Paginate],

  // resource
  ['resource', toolbar.Resource],

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

  // ui
  ['menu', toolbar.Menu],
  ['sidebar', new toolbar.Sidebar(new Map<string, toolbar.SidebarItem>([
    ['thumbnail', new plugins.ThumbnailSidebarItem()],
    ['bookmark', new plugins.BookmarkSidebarItem()],
    ['interaction', new plugins.InteractionSidebarItem()],
  ]))],
])

export const DEFAULT_OPTIONS = {
  container: 'app',
  toolbarOptions: {
    toolbar: DEFAULT_TOOLBAR,
  },
}
