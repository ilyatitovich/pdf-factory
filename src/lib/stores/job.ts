import { atom, map } from 'nanostores'
import { notifyIfHidden, requestPermission } from '../notifications'
import { clearPreviewCache } from '../pdfPreview'
import type { MainToWorker, WorkerToMain } from '../protocol'

type JobStatus = 'idle' | 'running' | 'done' | 'error'

export const job = map({
  status: 'idle' as JobStatus,
  stage: '',
  current: 0,
  total: 0,
  fileName: '',
  span: 1,
  error: null as string | null,
})

export interface SplitFile {
  name: string
  bytes: ArrayBuffer
  from: number
  thru: number
}

export const files = atom<SplitFile[]>([])

export function setSpan(span: number): void {
  if (!Number.isFinite(span) || span < 1) return
  job.setKey('span', Math.floor(span))
}

export function resetJob(): void {
  clearPreviewCache()
  files.set([])
  job.set({
    status: 'idle',
    stage: '',
    current: 0,
    total: 0,
    fileName: '',
    span: job.get().span,
    error: null,
  })
}

let worker: Worker | null = null
let whenReady: Promise<void> | null = null
let activeJobId: string | null = null
let settleActive: (() => void) | null = null

function handleWorkerMessage(msg: WorkerToMain): void {
  if (msg.type === 'ready') return
  if (msg.jobId !== activeJobId) return

  switch (msg.type) {
    case 'progress':
      job.setKey('stage', msg.stage)
      job.setKey('current', msg.current)
      job.setKey('total', msg.total)
      break
    case 'file':
      files.set([
        ...files.get(),
        { name: msg.name, bytes: msg.bytes, from: msg.from, thru: msg.thru },
      ])
      break
    case 'done':
      job.setKey('status', 'done')
      job.setKey('stage', 'done')
      notifyIfHidden('PDF Factory', `Finished splitting ${job.get().fileName}`)
      activeJobId = null
      settleActive?.()
      settleActive = null
      break
    case 'error':
      job.setKey('status', 'error')
      job.setKey('error', msg.message)
      notifyIfHidden('PDF Factory', msg.message)
      activeJobId = null
      settleActive?.()
      settleActive = null
      break
  }
}

function ensureWorker(): { worker: Worker; ready: Promise<void> } {
  if (worker && whenReady) return { worker, ready: whenReady }

  const next = new Worker(new URL('../worker.ts', import.meta.url), { type: 'module' })
  whenReady = new Promise<void>((resolve, reject) => {
    const onReady = (event: MessageEvent<WorkerToMain>) => {
      if (event.data.type !== 'ready') return
      next.removeEventListener('message', onReady)
      resolve()
    }
    next.addEventListener('message', onReady)
    next.addEventListener('error', () => reject(new Error('PDF worker failed to start')))
  })
  next.addEventListener('message', (event: MessageEvent<WorkerToMain>) => {
    handleWorkerMessage(event.data)
  })
  worker = next
  return { worker: next, ready: whenReady }
}

export async function splitPdf(file: File): Promise<void> {
  if (job.get().status === 'running') return

  await requestPermission()
  files.set([])

  const jobId = crypto.randomUUID()
  activeJobId = jobId
  job.set({
    ...job.get(),
    status: 'running',
    stage: 'loading-wasm',
    current: 0,
    total: 0,
    fileName: file.name,
    error: null,
  })

  try {
    const { worker: w, ready } = ensureWorker()
    await ready

    const pdf = await file.arrayBuffer()
    const msg: MainToWorker = {
      type: 'split',
      jobId,
      pdf,
      span: job.get().span,
    }

    await new Promise<void>((resolve) => {
      settleActive = resolve
      w.postMessage(msg, [msg.pdf])
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    job.setKey('status', 'error')
    job.setKey('error', message)
    notifyIfHidden('PDF Factory', message)
    activeJobId = null
    settleActive = null
  }
}
