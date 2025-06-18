<script lang="ts">
  import Router from 'svelte-spa-router'
  import { authStore, authService } from '$lib/stores/auth'
  import { onMount } from 'svelte'

  // Import routes
  import LandingPage from './lib/components/landing/LandingPage.svelte'
  import Dashboard from './routes/+page.svelte'
  import Auth from './routes/auth/+page.svelte'
  import StoryEditor from './routes/editor/[id]/+page.svelte'
  import MediaLibrary from './routes/media/+page.svelte'

  const routes = {
    '/': LandingPage,
    '/dashboard': Dashboard,
    '/auth': Auth,
    '/editor/:id': StoryEditor,
    '/media': MediaLibrary
  }

  onMount(() => {
    authService.initialize()
  })

  // Handle authentication state changes for routing
  $: if ($authStore.user && !$authStore.loading) {
    // If user is authenticated and we're on landing page or auth page, redirect to dashboard
    const currentHash = window.location.hash
    if (currentHash === '#/' || currentHash === '#/auth' || currentHash === '') {
      window.location.hash = '#/dashboard'
    }
  }
</script>

<main>
  <Router {routes} />
</main>