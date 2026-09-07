export type BodyScrollLockSnapshot = {
  previous: BodyScrollStyleSnapshot
  scrollY: number
}

type BodyScrollStyleSnapshot = {
  left: string
  overflow: string
  position: string
  right: string
  top: string
  width: string
}

export function lockBodyScroll(
  body: HTMLElement,
  scrollY: number
): BodyScrollLockSnapshot {
  const previous: BodyScrollStyleSnapshot = {
    left: body.style.left,
    overflow: body.style.overflow,
    position: body.style.position,
    right: body.style.right,
    top: body.style.top,
    width: body.style.width
  }

  body.style.overflow = 'hidden'
  body.style.position = 'fixed'
  body.style.top = `-${scrollY}px`
  body.style.left = '0'
  body.style.right = '0'
  body.style.width = '100%'

  return { previous, scrollY }
}

export function unlockBodyScroll(
  body: HTMLElement,
  snapshot: BodyScrollLockSnapshot,
  scrollTo: (x: number, y: number) => void
): void {
  body.style.overflow = snapshot.previous.overflow
  body.style.position = snapshot.previous.position
  body.style.top = snapshot.previous.top
  body.style.left = snapshot.previous.left
  body.style.right = snapshot.previous.right
  body.style.width = snapshot.previous.width
  scrollTo(0, snapshot.scrollY)
}
