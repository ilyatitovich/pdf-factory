<script lang="ts">
  import { get } from 'svelte/store'
  import { createWindowVirtualizer } from '@tanstack/svelte-virtual'
  import { files, type SplitFile } from '../lib/stores/job'
  import { getCachedPreview, renderFirstPage } from '../lib/pdfPreview'
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

  const cols = $derived(Math.max(1, Math.floor(clientWidth / CELL_W)))
  const list = $derived($files)

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
</script>

{#if list.length > 0}
  <div class="list" bind:this={listEl} bind:clientWidth>
    <div class="inner" style:height="{$virtualizer.getTotalSize()}px">
      {#each $virtualizer.getVirtualItems() as item (item.key)}
        {@const file = list[item.index]}
        {#if file}
          <button
            type="button"
            class="card"
            style:width="{CELL_W}px"
            style:height="{item.size}px"
            style:transform="translateX({item.lane * (CELL_W + GAP)}px) translateY({item.start - scrollMargin}px)"
            onclick={() => {
              openIndex = item.index
            }}
          >
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
  .list {
    margin-block-start: 1rem;
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
