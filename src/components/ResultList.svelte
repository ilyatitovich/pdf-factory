<script lang="ts">
  import { files } from '../lib/stores/job'
  import { downloadFile } from '../lib/utils/download'
</script>

{#if $files.length > 0}
  <ul>
    {#each $files as file (file.name)}
      <li>
        <button type="button" onclick={() => downloadFile(file.name, file.bytes)}>
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
