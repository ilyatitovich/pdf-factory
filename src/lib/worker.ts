/// Web Worker entry: load wasm_exec + pdf.wasm once; handle split messages.
/// Implemented in a later task.

import type { MainToWorker, WorkerToMain } from './protocol'

postMessage({ type: 'ready' } satisfies WorkerToMain)

onmessage = (event: MessageEvent<MainToWorker>) => {
  const msg = event.data
  if (msg.type !== 'split') return
  const error: WorkerToMain = {
    type: 'error',
    jobId: msg.jobId,
    message: 'WASM worker not implemented yet',
  }
  postMessage(error)
}
