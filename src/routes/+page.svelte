<script lang="ts">
  import { onMount } from 'svelte'
  import { authStore } from '$lib/stores/auth'
  import LandingPage from '$lib/components/landing/LandingPage.svelte'

  onMount(() => {
    // Redirect authenticated users to dashboard
    const unsubscribe = authStore.subscribe(($authStore) => {
      if ($authStore.user && !$authStore.loading) {
        window.location.hash = '#/dashboard'
      }
    })

    return unsubscribe
  })
</script>

<svelte:head>
  <title>Small Tales - Interactive Story Builder</title>
</svelte:head>

<LandingPage />