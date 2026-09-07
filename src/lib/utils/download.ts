import { zip } from 'fflate'

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

/** Pack files into a ZIP and download. PDFs use store (level 0) — already compressed. */
export function downloadZip(
  name: string,
  entries: readonly { name: string; bytes: ArrayBuffer }[],
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
