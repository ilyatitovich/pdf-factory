import { zip } from 'fflate'
import { PDFDocument } from 'pdf-lib'

function triggerDownload(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadFile(name: string, bytes: ArrayBuffer): void {
  triggerDownload(name, new Blob([bytes], { type: 'application/pdf' }))
}

export async function mergePdfFiles(
  entries: readonly { name: string; bytes: ArrayBuffer }[]
): Promise<ArrayBuffer> {
  if (entries.length === 0) {
    throw new Error('No PDF files selected to merge.')
  }

  const merged = await PDFDocument.create()

  for (const entry of entries) {
    const pdf = await PDFDocument.load(entry.bytes)
    const pages = await merged.copyPages(pdf, pdf.getPageIndices())
    for (const page of pages) {
      merged.addPage(page)
    }
  }

  return merged.save().then(bytes => {
    const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
    const buffer = view.buffer.slice(
      view.byteOffset,
      view.byteOffset + view.byteLength
    )
    return buffer as ArrayBuffer
  })
}

export async function downloadMergedPdf(
  name: string,
  entries: readonly { name: string; bytes: ArrayBuffer }[]
): Promise<void> {
  const merged = await mergePdfFiles(entries)
  triggerDownload(name, new Blob([merged], { type: 'application/pdf' }))
}

/** Pack files into a ZIP and download. PDFs use store (level 0) — already compressed. */
export function downloadZip(
  name: string,
  entries: readonly { name: string; bytes: ArrayBuffer }[]
): Promise<void> {
  const data: Record<string, Uint8Array> = {}
  for (const entry of entries) {
    data[entry.name] = new Uint8Array(entry.bytes)
  }

  return new Promise((resolve, reject) => {
    zip(data, { level: 0 }, (err, out) => {
      if (err) {
        reject(err)
        return
      }
      triggerDownload(name, new Blob([out], { type: 'application/zip' }))
      resolve()
    })
  })
}
