<script lang="ts">
  import { get } from 'svelte/store'
  import { createWindowVirtualizer } from '@tanstack/svelte-virtual'
  import { files, job, type SplitFile } from '../lib/stores/job'
  import { getCachedPreview, renderFirstPage } from '../lib/pdfPreview'
  import { downloadZip } from '../lib/utils/download'
  import PageLightbox from './PageLightbox.svelte'

  const CELL_W = 160
  const THUMB_H = Math.round(CELL_W * 1.414)
  const CAPTION_H = 36
  const GAP = 12
  const CARD_H = THUMB_H + CAPTION_H

  let listEl = $state<HTMLDivElement | undefined>()
  let clientWidth = $state(0)
  let scrollMargin = $state(0)
  let openIndex = $state<number | null>(null)
  let zipping = $state(false)
  let selectMode = $state(false)
  let selected = $state(new Set<string>())

  const cols = $derived(Math.max(1, Math.floor(clientWidth / CELL_W)))
  const list = $derived($files)
  const selectedCount = $derived(selected.size)
  const selectedFiles = $derived(list.filter((f) => selected.has(f.name)))

  const virtualizer = createWindowVirtualizer({
    count: 0,
    estimateSize: () => CARD_H,
    overscan: 3,
    lanes: 1,
    gap: GAP,
    scrollMargin: 0,
  })

  $effect(() => {
    const el = listEl
    if (!el) return
    const measure = () => {
      scrollMargin = el.getBoundingClientRect().top + window.scrollY
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  })

  $effect(() => {
    get(virtualizer).setOptions({
      count: list.length,
      lanes: cols,
      scrollMargin,
      getItemKey: (index) => list[index]?.name ?? index,
    })
  })

  $effect(() => {
    if (openIndex === null) return
    if (list.length === 0) {
      openIndex = null
      return
    }
    if (openIndex >= list.length) openIndex = list.length - 1
  })

  $effect(() => {
    if (list.length === 0) {
      selected = new Set()
      selectMode = false
    }
  })

  function caption(file: SplitFile): string {
    return file.from === file.thru
      ? `page ${file.from}`
      : `pages ${file.from}–${file.thru}`
  }

  function preview(node: HTMLImageElement, bytes: ArrayBuffer) {
    const cached = getCachedPreview(bytes)
    if (cached) {
      node.src = cached
      node.hidden = false
      return {}
    }

    let cancelled = false
    void renderFirstPage(bytes).then((url) => {
      if (cancelled) return
      node.src = url
      node.hidden = false
    })
    return {
      destroy() {
        cancelled = true
      },
    }
  }

  function toggleSelected(name: string): void {
    const next = new Set(selected)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    selected = next
  }

  function selectAll(): void {
    selected = new Set(list.map((f) => f.name))
  }

  function exitSelectMode(): void {
    selectMode = false
    selected = new Set()
  }

  function zipName(): string {
    const base = $job.fileName.replace(/\.pdf$/i, '') || 'pages'
    return `${base}.zip`
  }

  async function downloadAll(): Promise<void> {
    if (zipping || list.length === 0) return
    zipping = true
    try {
      await downloadZip(zipName(), list)
    } finally {
      zipping = false
    }
  }

  async function downloadSelected(): Promise<void> {
    if (zipping || selectedFiles.length === 0) return
    zipping = true
    try {
      await downloadZip(zipName(), selectedFiles)
    } finally {
      zipping = false
    }
  }

  function onCardClick(index: number, name: string): void {
    if (selectMode) toggleSelected(name)
    else openIndex = index
  }
</script>

{#if list.length > 0}
  <div class="toolbar">
    {#if selectMode}
      <button type="button" class="tool" onclick={exitSelectMode}>Done</button>
      <button type="button" class="tool" onclick={selectAll}>Select all</button>
      <button
        type="button"
        class="tool"
        disabled={zipping || selectedCount === 0}
        onclick={downloadSelected}
      >
        {zipping ? 'Preparing ZIP…' : `Download selected (${selectedCount}) as ZIP`}
      </button>
    {:else}
      <button
        type="button"
        class="tool"
        onclick={() => {
          selectMode = true
        }}
      >
        Select
      </button>
      <button type="button" class="tool" disabled={zipping} onclick={downloadAll}>
        {zipping ? 'Preparing ZIP…' : `Download all (${list.length}) as ZIP`}
      </button>
    {/if}
  </div>
  <div class="list" bind:this={listEl} bind:clientWidth>
    <div class="inner" style:height="{$virtualizer.getTotalSize()}px">
      {#each $virtualizer.getVirtualItems() as item (item.key)}
        {@const file = list[item.index]}
        {#if file}
          <button
            type="button"
            class="card"
            class:selected={selectMode && selected.has(file.name)}
            class:select-mode={selectMode}
            style:width="{CELL_W}px"
            style:height="{item.size}px"
            style:transform="translateX({item.lane * (CELL_W + GAP)}px) translateY({item.start - scrollMargin}px)"
            aria-pressed={selectMode ? selected.has(file.name) : undefined}
            onclick={() => onCardClick(item.index, file.name)}
          >
            {#if selectMode}
              <span class="check" aria-hidden="true">{selected.has(file.name) ? '✓' : ''}</span>
            {/if}
            <div class="thumb" style:height="{THUMB_H}px">
              <img alt="" hidden use:preview={file.bytes} width={CELL_W} height={THUMB_H} />
            </div>
            <span class="caption">{caption(file)}</span>
          </button>
        {/if}
      {/each}
    </div>
  </div>
{/if}

{#if openIndex !== null && list.length > 0}
  <PageLightbox
    files={list}
    index={openIndex}
    onClose={() => {
      openIndex = null
    }}
    onNavigate={(i) => {
      openIndex = i
    }}
  />
{/if}

<style>
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-block-start: 1rem;
  }

  .tool {
    padding: 0.45rem 0.85rem;
    border: 1px solid #888;
    border-radius: 0.35rem;
    background: #fff;
    font: inherit;
    cursor: pointer;
  }

  .tool:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .list {
    margin-block-start: 0.75rem;
  }

  .inner {
    position: relative;
    width: 100%;
  }

  .card {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: start;
    font: inherit;
    color: inherit;
  }

  .card:focus-visible {
    outline: 2px solid #222;
    outline-offset: 2px;
  }

  .card.select-mode .thumb {
    outline: 2px solid #bbb;
    outline-offset: -2px;
  }

  .card.selected .thumb {
    outline-color: #222;
  }

  .check {
    position: absolute;
    z-index: 1;
    top: 0.35rem;
    left: 0.35rem;
    display: grid;
    place-items: center;
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid #222;
    border-radius: 0.2rem;
    background: #fff;
    font-size: 0.75rem;
    line-height: 1;
  }

  .card.selected .check {
    background: #222;
    color: #fff;
  }

  .thumb {
    background: #ddd;
    aspect-ratio: 1 / 1.414;
  }

  .thumb img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #fff;
  }

  .caption {
    font-size: 0.85rem;
    line-height: 1.2;
    height: 2.25rem;
    overflow: hidden;
  }
</style>
