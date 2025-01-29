import { AnnotationEditorType } from '@/pdfjs'
import { PresentationModeState } from '@/enums'
import { Plugin, type ToolbarItemType } from '../plugin'
import { HandTool } from './hand-tool'
import { CursorHand } from './cursor-hand'
import { CursorInitializer } from './cursor-initializer'
import { CursorSelect } from './cursor-select'

export enum CursorTool {
  SELECT = 0,
  HAND = 1,
}

export type CursorPluginParams = {
  cursorToolOnLoad?: CursorTool
}

export class CursorPlugin extends Plugin<CursorPluginParams> {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['cursor-hand', CursorHand],
      ['cursor-select', CursorSelect],
    ])
  }

  private active?: CursorTool
  private prevActive?: CursorTool
  private handTool?: HandTool

  protected async getInitializers() {
    return [
      new CursorInitializer(await this.params?.cursorToolOnLoad),
    ]
  }

  protected init() {
    this.handTool = new HandTool(this.viewerContainer)

    this.on('switchcursortool', (evt: { reset: boolean, tool: CursorTool }) => {
      if (!evt.reset) {
        if (this.prevActive) {
          return
        }

        this.switchTool(evt.tool)
        return
      }

      if (this.prevActive) {
        annotationEditorMode = AnnotationEditorType.NONE
        presentationModeState = PresentationModeState.NORMAL

        enableActive()
      }
    })

    let annotationEditorMode = AnnotationEditorType.NONE
    let presentationModeState = PresentationModeState.NORMAL

    const disableActive = () => {
      this.prevActive = this.active
      this.switchTool(CursorTool.SELECT, true)
    }

    const enableActive = () => {
      if (
        this.prevActive
        && annotationEditorMode === AnnotationEditorType.NONE
        && presentationModeState === PresentationModeState.NORMAL
      ) {
        this.switchTool(this.prevActive)
        this.prevActive = undefined
      }
    }

    this.on('annotationeditormodechanged', ({ mode }) => {
      annotationEditorMode = mode

      if (mode === AnnotationEditorType.NONE) {
        enableActive()
      } else {
        disableActive()
      }
    })

    this.on('presentationmodechanged', ({ state }) => {
      presentationModeState = state

      if (state === PresentationModeState.NORMAL) {
        enableActive()
      } else if (state === PresentationModeState.FULLSCREEN) {
        disableActive()
      }
    })
  }

  protected destroy() {
    this.handTool?.deactivate()
    this.handTool = undefined
  }

  get activeTool() {
    return this.active
  }

  switchTool(tool: CursorTool, disabled?: boolean) {
    if (tool === this.active) {
      if (this.prevActive) {
        // Ensure that the `disabled`-attribute of the buttons will be updated.
        this.dispatch('cursortoolchanged', {
          source: this,
          tool,
          disabled,
        })
      }
      return // The requested tool is already active.
    }

    const disableActiveTool = () => {
      switch (this.active) {
        case CursorTool.SELECT:
          break
        case CursorTool.HAND:
          this.handTool?.deactivate()
          break
      }
    }

    switch (tool) {
      case CursorTool.SELECT:
        disableActiveTool()
        break
      case CursorTool.HAND:
        disableActiveTool()
        this.handTool?.activate()
        break
      default:
        this.logger.error(`switchTool: '${tool}' is an unsupported value.`)
        return
    }

    this.active = tool
    this.dispatch('cursortoolchanged', { tool, disabled })
  }
}
