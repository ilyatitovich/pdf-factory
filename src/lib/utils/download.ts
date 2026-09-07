export function downloadFile(name: string, bytes: ArrayBuffer): void {
  const url = URL.createObjectURL(
    new Blob([bytes], { type: 'application/pdf' })
  )
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
