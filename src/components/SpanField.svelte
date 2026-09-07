<script lang="ts">
  import { job, setSpan } from '../lib/stores/job'
</script>

<label>
  Pages per file
  <input
    type="number"
    min="1"
    step="1"
    value={$job.span}
    disabled={$job.status === 'running'}
    oninput={(e) => setSpan(Number(e.currentTarget.value))}
  />
</label>

<style>
  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-block: 1rem;
  }
  input {
    max-width: 8rem;
  }
</style>
