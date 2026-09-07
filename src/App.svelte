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
