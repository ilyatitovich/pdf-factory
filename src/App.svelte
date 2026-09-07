<script lang="ts">
  import Dropzone from './components/Dropzone.svelte'
  import SpanField from './components/SpanField.svelte'
  import JobProgress from './components/JobProgress.svelte'
  import ResultList from './components/ResultList.svelte'
</script>

<main>
  <h1>PDF Factory</h1>
  <p>Split a PDF in the browser. Files never leave your device.</p>
  <Dropzone />
  <SpanField />
  <JobProgress />
  <ResultList />
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  h1 {
    font-size: 1.75rem;
  }

  p {
    color: #555;
    margin-block-end: 0.5rem;
  }
</style>
