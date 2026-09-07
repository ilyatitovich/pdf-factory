/// <reference lib="webworker" />

import type { MainToWorker, WorkerToMain } from './protocol'

interface GoRuntime {
  importObject: WebAssembly.Imports
  run(instance: WebAssembly.Instance): Promise<void>
}

interface PdfSpan {
  from: number
  thru: number
  bytes: Uint8Array
}

type PdfSplit = (
  data: Uint8Array,
  span: number,
  onProgress: (current: number, total: number, part?: PdfSpan) => void,
) => void

function postFile(jobId: string, span: PdfSpan): void {
  const bytes = span.bytes.buffer.slice(
    span.bytes.byteOffset,
    span.bytes.byteOffset + span.bytes.byteLength,
  ) as ArrayBuffer
  const name =
    span.from === span.thru
      ? `page-${span.from}.pdf`
      : `pages-${span.from}-${span.thru}.pdf`
  post({ type: 'file', jobId, name, bytes }, [bytes])
}

function post(msg: WorkerToMain, transfer: Transferable[] = []): void {
  self.postMessage(msg, transfer)
}

async function loadWasm(): Promise<PdfSplit> {
  const source = await (await fetch('/wasm_exec.js')).text()
  // ponytail: wasm_exec is a classic IIFE; eval is the module-worker load path (no importScripts)
  ;(0, eval)(source)

  const Go = (globalThis as unknown as { Go: new () => GoRuntime }).Go
  const go = new Go()
  const result = await WebAssembly.instantiateStreaming(fetch('/pdf.wasm'), go.importObject)
  // run() awaits exit forever; sync portion of main sets pdfSplit before parking
  void go.run(result.instance)

  const pdfSplit = (globalThis as unknown as { pdfSplit?: PdfSplit }).pdfSplit
  if (typeof pdfSplit !== 'function') {
    throw new Error('pdfSplit was not exported from wasm')
  }
  return pdfSplit
}

let initError: Error | null = null
let pdfSplit: PdfSplit | null = null

const wasmReady = loadWasm().then(
  (fn) => {
    pdfSplit = fn
    post({ type: 'ready' })
  },
  (err: unknown) => {
    initError = err instanceof Error ? err : new Error(String(err))
    post({ type: 'ready' })
  },
)

self.onmessage = async (event: MessageEvent<MainToWorker>) => {
  const msg = event.data
  if (msg.type !== 'split') return

  try {
    await wasmReady
    if (initError || !pdfSplit) {
      throw initError ?? new Error('WASM failed to initialize')
    }

    post({
      type: 'progress',
      jobId: msg.jobId,
      current: 0,
      total: 0,
      stage: 'parsing',
    })

    pdfSplit(new Uint8Array(msg.pdf), msg.span, (current, total, part) => {
      if (part) postFile(msg.jobId, part)
      post({
        type: 'progress',
        jobId: msg.jobId,
        current,
        total,
        stage: 'splitting',
      })
    })

    post({ type: 'done', jobId: msg.jobId })
  } catch (err) {
    post({
      type: 'error',
      jobId: msg.jobId,
      message: err instanceof Error ? err.message : String(err),
    })
  }
}
