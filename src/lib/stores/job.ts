import { atom, map } from 'nanostores'
import { notifyIfHidden, requestPermission } from '../notifications'

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
}

export const files = atom<SplitFile[]>([])

export function setSpan(span: number): void {
  if (!Number.isFinite(span) || span < 1) return
  job.setKey('span', Math.floor(span))
}

export function resetJob(): void {
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

/** Scaffold stub — wires worker + transferables in a later task. */
export async function splitPdf(file: File): Promise<void> {
  if (job.get().status === 'running') return
  await requestPermission()
  files.set([])
  job.set({
    ...job.get(),
    status: 'error',
    stage: '',
    current: 0,
    total: 0,
    fileName: file.name,
    error: 'PDF split not implemented yet',
  })
  notifyIfHidden('PDF Factory', 'Split failed')
}
