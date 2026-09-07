<script lang="ts">
  import { job } from '../lib/stores/job'

  const pct = $derived(
    $job.total > 0 ? Math.round(($job.current / $job.total) * 100) : 0,
  )
</script>

{#if $job.status === 'running' || $job.status === 'done' || $job.status === 'error'}
  <div class="progress" aria-live="polite">
    {#if $job.status === 'error'}
      <p class="error">{$job.error ?? 'Something went wrong'}</p>
    {:else}
      <p>{$job.stage || $job.status}{#if $job.total > 0} — {$job.current}/{$job.total}{/if}</p>
      <progress max="100" value={pct}></progress>
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
