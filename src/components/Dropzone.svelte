<script lang="ts">
  import { job, splitPdf } from '../lib/stores/job'
  import { isPdf } from '../lib/utils/pdf'

  let isDragging = $state(false)

  function onFiles(fileList: FileList | null): void {
    if ($job.status === 'running') return
    const file = fileList?.[0]
    if (!file || !isPdf(file)) return
    void splitPdf(file)
  }
</script>

<div
  class="dropzone"
  class:dragging={isDragging}
  class:disabled={$job.status === 'running'}
  role="button"
  tabindex="0"
  aria-disabled={$job.status === 'running'}
  ondragover={e => {
    e.preventDefault()
    if ($job.status === 'running') return
    isDragging = true
  }}
  ondragleave={() => {
    isDragging = false
  }}
  ondrop={e => {
    e.preventDefault()
    isDragging = false
    onFiles(e.dataTransfer?.files ?? null)
  }}
  onclick={() => {
    if ($job.status === 'running') return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,application/pdf'
    input.onchange = () => onFiles(input.files)
    input.click()
  }}
  onkeydown={e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      ;(e.currentTarget as HTMLElement).click()
    }
  }}
>
  {#if $job.status === 'running'}
    Splitting{$job.fileName ? ` ${$job.fileName}` : ''}…
  {:else}
    Drop a PDF here, or click to choose
  {/if}
</div>

<style>
  .dropzone {
    border: 2px dashed #888;
    border-radius: 0.5rem;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
  }
  .dropzone.dragging {
    border-color: #222;
    background: #eee;
  }
  .dropzone.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
