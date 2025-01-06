import { Plugin } from '../plugin'

export class HistoryPlugin extends Plugin {

}
import * as pdfjs from '@/pdfjs'
import * as constants from '@/config'
import { Manager } from './'
import { capitalize } from '@/utils'

export class DocumentManager extends Manager {
  private _pdfDocument?: pdfjs.PDFDocumentProxy
  private _loadingTask?: pdfjs.PDFDocumentLoadingTask
  private _filesize?: number

  get filesize() {
    return this._filesize
  }

  init() {
    this.on('pagerendered', ({ error }) => {
      if (error) {
        this.documentError('error.rendering', error)
      }
    })
  }

  reset() {
    this._pdfDocument = undefined
  }

  async openDocument(document?: pdfjs.DocumentType) {
    this.dispatch('documentload', { document })

    const loadingTask = this._loadingTask = pdfjs.getDocument(document)

    loadingTask.onProgress = ({ loaded, total }: { loaded: number, total: number }) => {
      this.dispatch('documentprogress', { loaded, total })
    }

    try {
      this.loadDocument(await loadingTask.promise)
    } catch (reason: any) {
      if (loadingTask !== this._loadingTask) {
        return
      }

      let key = 'error.loading'

      if (reason instanceof pdfjs.InvalidPDFException) {
        key = 'error.invalid-file'
      } else if (reason instanceof pdfjs.MissingPDFException) {
        key = 'error.missing-file'
      } else if (reason instanceof pdfjs.UnexpectedResponseException) {
        key = 'error.unexpected-response'
      }

      this.documentError(key, reason)

      throw reason
    }
  }

  loadDocument(pdfDocument: pdfjs.PDFDocumentProxy) {
    this.setDocument(pdfDocument)
    this.dispatch('documentinit')

    pdfDocument.getDownloadInfo().then(({ length }) => {
      this._filesize = length
      this.pagesManager.firstPagePromise?.then(() => {
        this.dispatch('documentloaded')
      })
    })

    // Since the `setInitialView` call below depends on this being resolved,
    // fetch it early to avoid delaying initial rendering of the PDF document.
    const pageLayoutPromise = pdfDocument.getPageLayout().catch(() => {
      /* Avoid breaking initial rendering; ignoring errors. */
    })
    const pageModePromise = pdfDocument.getPageMode().catch(() => {
      /* Avoid breaking initial rendering; ignoring errors. */
    })
    const openActionPromise = pdfDocument.getOpenAction().catch(() => {
      /* Avoid breaking initial rendering; ignoring errors. */
    })

    /*
    const storedPromise = (this.store = new ViewHistory(
      pdfDocument.fingerprints[0]
    ))
      .getMultiple({
        page: null,
        zoom: DEFAULT_SCALE_VALUE,
        scrollLeft: "0",
        scrollTop: "0",
        rotation: null,
        sidebarView: SidebarView.UNKNOWN,
        scrollMode: ScrollMode.UNKNOWN,
        spreadMode: SpreadMode.UNKNOWN,
      })
      .catch(() => {
        Unable to read from storage; ignoring errors.
      });
    */

    this.pagesManager.firstPagePromise?.then(() => {
      // this.loadingBar?.setWidth(this.appConfig.viewerContainer);
      // this._initializeAnnotationStorageCallbacks(pdfDocument);

      Promise.all([
        new Promise(resolve => window.requestAnimationFrame(resolve)),
        // storedPromise,
        pageLayoutPromise,
        pageModePromise,
        openActionPromise,
      ])
        .then(async ([timeStamp, /* stored, */ pageLayout, pageMode, openAction]) => {
          console.log(timeStamp, /* stored, */ pageLayout, pageMode, openAction)
          // const viewOnLoad = AppOptions.get("viewOnLoad");

          /*
          this._initializePdfHistory({
            fingerprint: pdfDocument.fingerprints[0],
            viewOnLoad,
            initialDest: openAction?.dest,
          });

          const initialBookmark = this.initialBookmark;

          // Initialize the default values, from user preferences.
          const zoom = AppOptions.get("defaultZoomValue");
          let hash = zoom ? `zoom=${zoom}` : null;
          */

          /*
          let rotation = null;
          let sidebarView = AppOptions.get("sidebarViewOnLoad");
          let scrollMode = AppOptions.get("scrollModeOnLoad");
          let spreadMode = AppOptions.get("spreadModeOnLoad");
          */

          /*
          if (stored?.page && viewOnLoad !== ViewOnLoad.INITIAL) {
            hash =
              `page=${stored.page}&zoom=${zoom || stored.zoom},` +
              `${stored.scrollLeft},${stored.scrollTop}`;

            rotation = parseInt(stored.rotation, 10);
            // Always let user preference take precedence over the view history.
            if (sidebarView === SidebarView.UNKNOWN) {
              sidebarView = stored.sidebarView | 0;
            }
            if (scrollMode === ScrollMode.UNKNOWN) {
              scrollMode = stored.scrollMode | 0;
            }
            if (spreadMode === SpreadMode.UNKNOWN) {
              spreadMode = stored.spreadMode | 0;
            }
          }
          */
          // Always let the user preference/view history take precedence.
          /*
          if (pageMode && sidebarView === SidebarView.UNKNOWN) {
            sidebarView = apiPageModeToSidebarView(pageMode);
          }
          */
          /*
          if (
            pageLayout &&
            scrollMode === ScrollMode.UNKNOWN &&
            spreadMode === SpreadMode.UNKNOWN
          ) {
            const modes = apiPageLayoutToViewerModes(pageLayout);
            // TODO: Try to improve page-switching when using the mouse-wheel
            // and/or arrow-keys before allowing the document to control this.
            // scrollMode = modes.scrollMode;
            spreadMode = modes.spreadMode;
          }
          */
          /*
          this.setInitialView(hash, {
            rotation,
            sidebarView,
            scrollMode,
            spreadMode,
          });
          */

          // this.eventBus.dispatch("documentinit", { source: this });

          // Make all navigation keys work on document load,
          // unless the viewer is embedded in a web page.
          /*
          if (!this.isViewerEmbedded) {
            pdfViewer.focus();
          }
          */

          // For documents with different page sizes, once all pages are
          // resolved, ensure that the correct location becomes visible on load.
          // (To reduce the risk, in very large and/or slow loading documents,
          //  that the location changes *after* the user has started interacting
          //  with the viewer, wait for either `pagesPromise` or a timeout.)
          await Promise.race([
            this.pagesManager.pagesPromise,
            new Promise((resolve) => {
              setTimeout(resolve, constants.FORCE_PAGES_LOADED_TIMEOUT)
            }),
          ])

          /*
          if (!initialBookmark && !hash) {
            return;
          }

          if (pdfViewer.hasEqualPageSizes) {
            return;
          }

          this.initialBookmark = initialBookmark;

          // eslint-disable-next-line no-self-assign
          pdfViewer.currentScaleValue = pdfViewer.currentScaleValue;
          // Re-apply the initial document location.
          this.setInitialView(hash);
          */
        })
        .catch(() => {
          // Ensure that the document is always completely initialized,
          // even if there are any errors thrown above.
          // this.setInitialView();
        })
        .then(() => {
          // At this point, rendering of the initial page(s) should always have
          // started (and may even have completed).
          // To prevent any future issues, e.g. the document being completely
          // blank on load, always trigger rendering here.
          this.viewer.update()
        })
    })

    this.pagesManager.pagesPromise?.then(
      () => {
        // this._initializeAutoPrint(pdfDocument, openActionPromise);
      },
      (reason) => {
        this.documentError('error.loading-error', reason)
      },
    )
    /*
    onePageRendered.then(data => {
      this.externalServices.reportTelemetry({
        type: "pageInfo",
        timestamp: data.timestamp,
      });

      if (this.pdfOutlineViewer) {
        pdfDocument.getOutline().then(outline => {
          if (pdfDocument !== this.pdfDocument) {
            return; // The document was closed while the outline resolved.
          }
          this.pdfOutlineViewer.render({ outline, pdfDocument });
        });
      }
      if (this.pdfAttachmentViewer) {
        pdfDocument.getAttachments().then(attachments => {
          if (pdfDocument !== this.pdfDocument) {
            return; // The document was closed while the attachments resolved.
          }
          this.pdfAttachmentViewer.render({ attachments });
        });
      }
      if (this.pdfLayerViewer) {
        // Ensure that the layers accurately reflects the current state in the
        // viewer itself, rather than the default state provided by the API.
        pdfViewer.optionalContentConfigPromise.then(optionalContentConfig => {
          if (pdfDocument !== this.pdfDocument) {
            return; // The document was closed while the layers resolved.
          }
          this.pdfLayerViewer.render({ optionalContentConfig, pdfDocument });
        });
      }
    });

    */

    // this._initializeMetadata(pdfDocument)

    /*
    this.on('documentinit', () => {
      this.focus()

      this.pdfDocument?.getMetadata().then(({ info }) => {
        if ('Language' in info) {
          this.viewerContainer.lang = String(info.Language)
        }
      })
    })
    */
  }

  getDocument() {
    return this._pdfDocument
  }

  setDocument(pdfDocument?: pdfjs.PDFDocumentProxy) {
    if (this.pdfDocument) {
      this.dispatch('documentdestroy')
      this.viewer.reset()
    }

    this._pdfDocument = pdfDocument

    if (!this.pdfDocument) {
      this.dispatch('documentempty')
      return
    }

    this.pagesManager.setupPages(this.pdfDocument)
  }

  private documentError(key = 'error.loading', info = {}) {
    const { l10n } = this.viewer
    const error = l10n.get(key)

    const pdfVersion = pdfjs.version ?? '?'
    const pdfBuild = pdfjs.build ?? '?'

    const messages = [
      `PDF.js v${pdfVersion} (build: ${pdfBuild})`,
    ]

    if (info instanceof Error) {
      messages.push(`Name: ${info.name}`)
      messages.push(`Message: ${info.message}`)
      if (info.stack) messages.push(`Stack: ${info.stack}`)
    } else {
      messages.push(...Object.entries(info).map(([prop, value]) => `${capitalize(prop)}: ${value ?? 'N/A'}`))
    }

    console.error(`${error}\n\n${messages.join('\n')}`)
    this.dispatch('documenterror', { error, info })
  }
}
