<script lang="ts">
  import { onMount } from 'svelte'
  import { authStore, authService } from '$lib/stores/auth'
  import { storiesService } from '$lib/stores/stories'
  import StoriesList from '$lib/components/dashboard/StoriesList.svelte'
  import UserCreditsDisplay from '$lib/components/auth/UserCreditsDisplay.svelte'
  import Button from '$lib/components/ui/button.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { LogIn, BookOpen, Zap, User } from 'lucide-svelte'

  function handleEditStory(event: CustomEvent) {
    console.log(event.detail.storyId)
    const storyId = event.detail.storyId
    console.log(storyId)
    window.location.hash = `#/editor/${storyId}`
  }

  function handlePreviewStory(event: CustomEvent) {
    const storyId = event.detail.storyId
    window.location.hash = `#/preview/${storyId}`
  }

  function navigateToAuth() {
    window.location.hash = '#/auth'
  }

  function navigateToLanding() {
    window.location.hash = '#/'
  }

  function navigateToAccount() {
    window.location.hash = '#/account'
  }

  onMount(() => {
    // Redirect to auth if not authenticated
    const unsubscribe = authStore.subscribe(($authStore) => {
      if (!$authStore.loading && !$authStore.user) {
        window.location.hash = '#/auth'
      }
    })

    // Set current story to null when returning to dashboard
    if ($authStore.user) {
      storiesService.setCurrentStory(null)
    }

    return unsubscribe
  })
</script>

<svelte:head>
  <title>Dashboard - Small Tales Story Builder</title>
</svelte:head>

<div class="min-h-screen bg-white">
  <header class="border-b border-periwinkle-blue/20 bg-soft-buttercream">
    <div class="container flex items-center justify-between py-4">
      <div class="flex items-center gap-4">
        <button on:click={navigateToLanding} class="text-xl font-bold text-coral-sunset hover:opacity-80">
          Small Tales
        </button>
        {#if $authStore.user}
          <nav class="flex items-center gap-6">
            <a href="#/dashboard" class="text-sm font-medium">Dashboard</a>
            <a href="#/media" class="text-sm font-medium text-muted-foreground hover:text-foreground">Media Library</a>
            <a href="#/account" class="text-sm font-medium text-muted-foreground hover:text-foreground">Account</a>
          </nav>
        {/if}
      </div>
      
      <div class="flex items-center gap-4">
        {#if $authStore.user}
          <div class="flex items-center gap-4">
            <UserCreditsDisplay compact={true} />
            
            <Button 
              variant="outline" 
              size="sm" 
              on:click={navigateToAccount}
              class="accent-element"
            >
              <User class="w-4 h-4 mr-2" />
              {$authStore.profile?.full_name || $authStore.user.email.split('@')[0] || 'Account'}
            </Button>
            
            <button 
              class="text-sm text-muted-foreground hover:text-foreground"
              on:click={() => {
                authService.signOut()
                window.location.hash = '#/'
              }}
            >
              Sign Out
            </button>
          </div>
        {:else}
          <Button variant="outline" on:click={navigateToAuth}>
            <LogIn class="w-4 h-4 mr-2" />
            Sign In
          </Button>
        {/if}
      </div>
    </div>
  </header>

  <main>
    {#if $authStore.loading}
      <!-- Loading state -->
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p class="text-muted-foreground">Loading...</p>
        </div>
      </div>
    {:else if !$authStore.user}
      <!-- Not authenticated - redirect handled in onMount -->
      <div class="flex items-center justify-center min-h-[60vh] p-4">
        <Card class="w-full max-w-md p-8 text-center">
          <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen class="w-8 h-8 text-primary" />
          </div>
          <h1 class="text-2xl font-bold mb-3">Authentication Required</h1>
          <p class="text-muted-foreground mb-6">
            Please sign in to access your dashboard and manage your stories.
          </p>
          <div class="space-y-3">
            <Button class="w-full" on:click={navigateToAuth}>
              <LogIn class="w-4 h-4 mr-2" />
              Sign In
            </Button>
            <Button variant="outline" class="w-full" on:click={navigateToLanding}>
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    {:else}
      <!-- Authenticated - show dashboard -->
      <div class="container py-6">
        <StoriesList 
          on:edit-story={handleEditStory}
          on:preview-story={handlePreviewStory}
        />
      </div>
    {/if}
  </main>
</div>