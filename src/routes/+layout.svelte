<script lang="ts">
  import '../app.css'
  import { onMount } from 'svelte'
  import { authService, authStore } from '$lib/stores/auth'

  onMount(() => {
    authService.initialize()
  })

  $: isAuthPage = typeof window !== 'undefined' && window.location.hash.startsWith('#/auth')
</script>

<div class="min-h-screen bg-background">
  {#if !isAuthPage && !$authStore.loading && !$authStore.user}
    <!-- Redirect to auth if not authenticated -->
    <script>
      window.location.hash = '#/auth'
    </script>
  {:else}
    <slot />
  {/if}
</div>