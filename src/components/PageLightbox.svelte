<script lang="ts">
  import type { SplitFile } from '../lib/stores/job'
  import { lockBodyScroll, unlockBodyScroll } from '../lib/utils/bodyScrollLock'
  import {
    FULL_WIDTH,
    getCachedPreview,
    renderFullPage
  } from '../lib/pdfPreview'
  import { downloadFile } from '../lib/utils/download'

  interface Props {
    files: readonly SplitFile[]
    index: number
    onClose: () => void
    onNavigate: (index: number) => void
  }

  let { files, index, onClose, onNavigate }: Props = $props()

  const file = $derived(files[index])
  const total = $derived(files.length)
  const canPrev = $derived(index > 0)
  const canNext = $derived(index < total - 1)

  let src = $state('')

  $effect(() => {
    const snapshot = lockBodyScroll(document.body, window.scrollY)
    return () => {
      unlockBodyScroll(document.body, snapshot, window.scrollTo.bind(window))
    }
  })

  $effect(() => {
    const bytes = file?.bytes
    if (!bytes) {
      src = ''
      return
    }

    let cancelled = false
    // Full-size only — thumb fallback caused small→large blink on prev/next
    src = getCachedPreview(bytes, FULL_WIDTH) ?? ''

    void renderFullPage(bytes).then(url => {
      if (!cancelled) src = url
    })

    const prevBytes = files[index - 1]?.bytes
    const nextBytes = files[index + 1]?.bytes
    if (prevBytes && !getCachedPreview(prevBytes, FULL_WIDTH))
      void renderFullPage(prevBytes)
    if (nextBytes && !getCachedPreview(nextBytes, FULL_WIDTH))
      void renderFullPage(nextBytes)

    return () => {
      cancelled = true
    }
  })

  function prev(): void {
    if (canPrev) onNavigate(index - 1)
  }

  function next(): void {
    if (canNext) onNavigate(index + 1)
  }

  function download(): void {
    if (!file) return
    downloadFile(file.name, file.bytes)
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowLeft') prev()
    else if (e.key === 'ArrowRight') next()
  }

  function onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget) onClose()
  }
</script>

<svelte:window onkeydown={onKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="lightbox"
  role="dialog"
  aria-modal="true"
  aria-label="Page preview"
  tabindex="-1"
  onclick={onBackdrop}
>
  <button type="button" class="close" onclick={onClose}>Close</button>
  <button type="button" class="download" onclick={download}>Download</button>

  <button
    type="button"
    class="nav prev"
    disabled={!canPrev}
    aria-label="Previous"
    onclick={prev}
  >
    ‹
  </button>

  <div class="stage">
    {#if src}
      <img {src} alt="" />
    {:else}
      <div class="placeholder"></div>
    {/if}
  </div>

  <button
    type="button"
    class="nav next"
    disabled={!canNext}
    aria-label="Next"
    onclick={next}
  >
    ›
  </button>

  <p class="counter">{index + 1} / {total}</p>
</div>

<style>
  .lightbox {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-rows: 1fr auto;
    align-items: center;
    gap: 0.75rem;
    padding: 3.5rem 1rem 1.25rem;
    background: rgb(0 0 0 / 0.88);
    color: #f5f5f5;
  }

  .close,
  .download {
    position: absolute;
    top: 1rem;
    padding: 0.45rem 0.85rem;
    border: 1px solid #ccc;
    border-radius: 0.35rem;
    background: #222;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .close {
    left: 1rem;
  }

  .download {
    right: 1rem;
  }

  .close:hover,
  .download:hover {
    background: #333;
  }

  .nav {
    width: 2.75rem;
    height: 2.75rem;
    border: 1px solid #666;
    border-radius: 999px;
    background: #222;
    color: inherit;
    font-size: 1.75rem;
    line-height: 1;
    cursor: pointer;
  }

  .nav:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .prev {
    grid-column: 1;
    grid-row: 1;
  }

  .next {
    grid-column: 3;
    grid-row: 1;
  }

  .stage {
    grid-column: 2;
    grid-row: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
    max-height: calc(100vh - 6rem);
  }

  .stage img,
  .placeholder {
    max-width: 100%;
    max-height: calc(100vh - 6rem);
    object-fit: contain;
    background: #111;
  }

  .placeholder {
    width: min(60vw, 24rem);
    aspect-ratio: 1 / 1.414;
  }

  .counter {
    grid-column: 1 / -1;
    grid-row: 2;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
</style>
