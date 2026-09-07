<script lang="ts">
  import { files } from '../lib/stores/job'

  function download(name: string, bytes: ArrayBuffer): void {
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }
</script>

{#if $files.length > 0}
  <ul>
    {#each $files as file (file.name)}
      <li>
        <button type="button" onclick={() => download(file.name, file.bytes)}>
          Download {file.name}
        </button>
      </li>
    {/each}
  </ul>
{/if}

<style>
  ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
