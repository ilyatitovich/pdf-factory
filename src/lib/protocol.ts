export type MainToWorker = {
  type: 'split'
  jobId: string
  pdf: ArrayBuffer
  span: number
}

export type WorkerToMain =
  | { type: 'ready' }
  | { type: 'progress'; jobId: string; current: number; total: number; stage: string }
  | { type: 'file'; jobId: string; name: string; bytes: ArrayBuffer; from: number; thru: number }
  | { type: 'done'; jobId: string }
  | { type: 'error'; jobId: string; message: string }
