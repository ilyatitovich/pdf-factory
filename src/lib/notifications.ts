export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in globalThis)) return 'denied'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  return Notification.requestPermission()
}

export function notifyIfHidden(title: string, body?: string): void {
  if (!('Notification' in globalThis)) return
  if (Notification.permission !== 'granted') return
  if (!document.hidden) return
  const n = new Notification(title, { body })
  n.onclick = () => {
    window.focus()
    n.close()
  }
}
