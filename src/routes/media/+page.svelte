<script lang="ts">
  import { authStore, authService } from '$lib/stores/auth'
  import { onMount } from 'svelte'
  import MediaLibrary from '$lib/components/media/MediaLibrary.svelte'

  onMount(() => {
    if (!$authStore.user) {
      window.location.hash = '#/auth'
    }
  })
</script>

<svelte:head>
  <title>Media Library - Small Tales</title>
</svelte:head>

<div class="min-h-screen bg-background">
  <header class="border-b bg-card">
    <div class="container flex items-center justify-between py-4">
      <div class="flex items-center gap-4">
        <a href="#/" class="text-xl font-bold text-primary">Small Tales</a>
        <nav class="flex items-center gap-6">
          <a href="#/" class="text-sm font-medium text-muted-foreground hover:text-foreground">Dashboard</a>
          <a href="#/media" class="text-sm font-medium">Media Library</a>
          <a href="#/analytics" class="text-sm font-medium text-muted-foreground hover:text-foreground">Analytics</a>
        </nav>
      </div>
      
      <div class="flex items-center gap-4">
        <span class="text-sm text-muted-foreground">
          {$authStore.profile?.full_name || $authStore.user?.email}
        </span>
        <button 
          class="text-sm text-muted-foreground hover:text-foreground"
          on:click={() => authService.signOut()}
        >
          Sign Out
        </button>
      </div>
    </div>
  </header>

  <main>
    <MediaLibrary />
  </main>
</div>