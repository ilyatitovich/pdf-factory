import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerSrc

const wasmUrl = `${import.meta.env.BASE_URL}pdfjs-wasm/`

export const THUMB_WIDTH = 160
export const FULL_WIDTH = 960
const THUMB_LIMIT = 48
const FULL_LIMIT = 12

/** Insertion-order LRU per size bucket: key = original ArrayBuffer (identity). */
const thumbs = new Map<ArrayBuffer, string>()
const full = new Map<ArrayBuffer, string>()

// ponytail: serial queue — bump concurrency if scroll feels laggy
let tail: Promise<unknown> = Promise.resolve()

function bucket(width: number): { cache: Map<ArrayBuffer, string>; limit: number } {
  return width > THUMB_WIDTH
    ? { cache: full, limit: FULL_LIMIT }
    : { cache: thumbs, limit: THUMB_LIMIT }
}

function touch(cache: Map<ArrayBuffer, string>, bytes: ArrayBuffer, url: string): void {
  cache.delete(bytes)
  cache.set(bytes, url)
}

function put(
  cache: Map<ArrayBuffer, string>,
  limit: number,
  bytes: ArrayBuffer,
  url: string,
): void {
  touch(cache, bytes, url)
  while (cache.size > limit) {
    const oldest = cache.keys().next().value
    if (oldest === undefined) break
    const evicted = cache.get(oldest)
    cache.delete(oldest)
    if (evicted) URL.revokeObjectURL(evicted)
  }
}

function canvasToObjectUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create thumbnail blob'))
        return
      }
      resolve(URL.createObjectURL(blob))
    }, 'image/png')
  })
}

async function render(bytes: ArrayBuffer, width: number): Promise<string> {
  const { cache, limit } = bucket(width)
  const hit = cache.get(bytes)
  if (hit) {
    touch(cache, bytes, hit)
    return hit
  }

  // pdf.js may transfer `data` to its worker — keep the store's buffer intact
  const loadingTask = getDocument({ data: bytes.slice(0), wasmUrl })
  try {
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    const base = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: width / base.width })

    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)

    await page.render({ canvas, viewport }).promise
    const url = await canvasToObjectUrl(canvas)
    put(cache, limit, bytes, url)
    return url
  } finally {
    await loadingTask.destroy()
  }
}

/** Rasterize the first page; returns a blob URL (cached, LRU). */
export function renderFirstPage(
  bytes: ArrayBuffer,
  width: number = THUMB_WIDTH,
): Promise<string> {
  const job = tail.then(() => render(bytes, width))
  tail = job.then(
    () => {},
    () => {},
  )
  return job
}

export function renderFullPage(bytes: ArrayBuffer): Promise<string> {
  return renderFirstPage(bytes, FULL_WIDTH)
}

/** Sync cache peek — avoid remount flash when virtualized back into view. */
export function getCachedPreview(
  bytes: ArrayBuffer,
  width: number = THUMB_WIDTH,
): string | undefined {
  const { cache } = bucket(width)
  const hit = cache.get(bytes)
  if (hit) touch(cache, bytes, hit)
  return hit
}

export function clearPreviewCache(): void {
  for (const url of thumbs.values()) URL.revokeObjectURL(url)
  for (const url of full.values()) URL.revokeObjectURL(url)
  thumbs.clear()
  full.clear()
}
