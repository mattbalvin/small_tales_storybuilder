<script lang="ts">
  import Router from 'svelte-spa-router'
  import { authStore, authService } from '$lib/stores/auth'
  import { onMount } from 'svelte'

  // Import routes
  import LandingPage from './lib/components/landing/LandingPage.svelte'
  import Dashboard from './routes/dashboard/+page.svelte'
  import Auth from './routes/auth/+page.svelte'
  import StoryEditor from './routes/editor/[id]/+page.svelte'
  import MediaLibrary from './routes/media/+page.svelte'
  import StoryPlay from './routes/play/[id]/+page.svelte'
  import Privacy from './routes/privacy/+page.svelte'
  import About from './routes/about/+page.svelte'
  import Terms from './routes/terms/+page.svelte'
  import Pricing from './routes/pricing/+page.svelte'
  import Account from './routes/account/+page.svelte'
  //import Analytics from './routes/analytics/+page.svelte'

  const routes = {
    '/': LandingPage,
    '/dashboard': Dashboard,
    '/auth': Auth,
    '/editor/:id': StoryEditor,
    '/media': MediaLibrary,
    '/play/:id': StoryPlay,
    '/privacy': Privacy,
    '/about': About,
    '/terms': Terms,
    '/pricing': Pricing,
    '/account': Account,
    //'/analytics': Analytics
  }

  onMount(() => {
    authService.initialize()
  })
</script>

<main>
  <Router {routes} />
</main>