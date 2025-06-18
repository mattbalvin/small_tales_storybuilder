<script lang="ts">
  import { authStore, authService } from '$lib/stores/auth'
  import { storiesService } from '$lib/stores/stories'
  import StoriesList from '$lib/components/dashboard/StoriesList.svelte'

  function handleEditStory(event: CustomEvent) {
    window.location.hash = `#/editor/${event.detail.storyId}`
  }

  function handlePreviewStory(event: CustomEvent) {
    window.location.hash = `#/preview/${event.detail.storyId}`
  }

  $: if ($authStore.user) {
    // Set current story to null when returning to dashboard
    storiesService.setCurrentStory(null)
  }
</script>

<svelte:head>
  <title>Small Tales Story Builder</title>
</svelte:head>

<div class="min-h-screen bg-background">
  <header class="border-b bg-card">
    <div class="container flex items-center justify-between py-4">
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-bold text-primary">Small Tales</h1>
        <nav class="flex items-center gap-6">
          <a href="#/" class="text-sm font-medium">Dashboard</a>
          <a href="#/media" class="text-sm font-medium text-muted-foreground hover:text-foreground">Media Library</a>
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
    <StoriesList 
      on:edit-story={handleEditStory}
      on:preview-story={handlePreviewStory}
    />
  </main>
</div>