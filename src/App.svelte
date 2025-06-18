<script lang="ts">
  import Router from 'svelte-spa-router'
  import { authStore, authService } from '$lib/stores/auth'
  import { onMount } from 'svelte'

  // Import routes
  import Dashboard from './routes/+page.svelte'
  import Auth from './routes/auth/+page.svelte'
  import StoryEditor from './routes/editor/[id]/+page.svelte'
  import MediaLibrary from './routes/media/+page.svelte'

  const routes = {
    '/': Dashboard,
    '/auth': Auth,
    '/editor/:id': StoryEditor,
    '/media': MediaLibrary
  }

  onMount(() => {
    authService.initialize()
  })
</script>

<main>
  <Router {routes} />
</main>