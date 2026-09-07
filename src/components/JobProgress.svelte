<script lang="ts">
  import { job } from '../lib/stores/job'

  const labels: Record<string, string> = {
    'loading-wasm': 'Loading',
    parsing: 'Parsing PDF',
    splitting: 'Splitting',
    done: 'Done',
  }

  const label = $derived(labels[$job.stage] ?? ($job.stage || $job.status))
  const isIndeterminate = $derived($job.status === 'running' && $job.total === 0)
</script>

{#if $job.status === 'running' || $job.status === 'done' || $job.status === 'error'}
  <div class="progress" aria-live="polite">
    {#if $job.status === 'error'}
      <p class="error">{$job.error ?? 'Something went wrong'}</p>
    {:else}
      <p>
        {label}
        {#if $job.total > 0}
          — {$job.current}/{$job.total}
        {/if}
      </p>
      {#if isIndeterminate}
        <progress></progress>
      {:else}
        <progress max={$job.total || 1} value={$job.current}></progress>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .progress {
    margin-block: 1rem;
  }
  progress {
    width: 100%;
  }
  .error {
    color: #a00;
  }
</style>
