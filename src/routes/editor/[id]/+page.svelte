<script lang="ts">
  import { onMount } from 'svelte'
  import { storiesStore, storiesService } from '$lib/stores/stories'
  import { authStore } from '$lib/stores/auth'
  import StoryEditor from '$lib/components/editor/StoryEditor.svelte'
  import Button from '$lib/components/ui/button.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { LogIn, FileEdit as Edit, AlertCircle } from 'lucide-svelte'

  // This component receives params from svelte-spa-router
  export let params = {}

  // Extract the id from params
  $: storyId = params.id
  $: story = $storiesStore.currentStory
  $: currentStoryLoading = $storiesStore.currentStoryLoading
  $: currentCollaborators = $storiesStore.currentCollaborators

  let loadError: string | null = null

  function navigateToAuth() {
    window.location.hash = '#/auth'
  }

  function navigateToLanding() {
    window.location.hash = '#/'
  }

  function navigateToDashboard() {
    window.location.hash = '#/dashboard'
  }

  // Reactive statement to handle authentication redirect
  $: if (!$authStore.loading && !$authStore.user) {
    console.log('User not authenticated, redirecting to auth')
    window.location.hash = '#/auth'
  }

  // Reactive statement to load story when conditions are met
  // This ensures collaborator data is always loaded, even for newly created stories
  $: if ($authStore.user && 
        storyId && 
        storyId !== 'undefined' && 
        storyId.trim() !== '' && 
        !currentStoryLoading &&
        ((!story || story.id !== storyId) || 
         (story && story.id === storyId && currentCollaborators.length === 0))) {
    console.log('Loading story:', storyId, 'for user:', $authStore.user.id)
    console.log('Reason: story mismatch or missing collaborators')
    loadStory(storyId)
  }

  async function loadStory(id: string) {
    try {
      loadError = null
      console.log('Attempting to load story with ID:', id)
      console.log('Current user:', $authStore.user?.id)
      await storiesService.loadSingleStory(id, $authStore.user!.id)
      console.log('Story loaded successfully')
    } catch (err: any) {
      console.error('Error loading story:', err)
      loadError = err.message || 'Failed to load story'
      // Don't automatically redirect on error, let user see the error message
    }
  }

  // Check for invalid story ID after component is mounted and ID is available
  $: if (storyId && (storyId === 'undefined' || storyId.trim() === '')) {
    console.error('Invalid story ID:', storyId)
    loadError = 'Invalid story ID provided'
  }

  // Debug logging
  $: console.log('Editor component state:', {
    storyId,
    hasStory: !!story,
    storyTitle: story?.title,
    authLoading: $authStore.loading,
    hasUser: !!$authStore.user,
    userId: $authStore.user?.id,
    currentStoryLoading,
    collaboratorsCount: currentCollaborators.length,
    loadError
  })
</script>

<svelte:head>
  <title>{story?.title || 'Loading...'} - Story Editor</title>
</svelte:head>

{#if $authStore.loading || currentStoryLoading}
  <div class="h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p class="text-muted-foreground">
        {$authStore.loading ? 'Loading user...' : 'Loading story...'}
      </p>
      <p class="text-xs text-muted-foreground mt-2">
        Story ID: {storyId || 'Not provided'}
      </p>
    </div>
  </div>
{:else if !$authStore.user}
  <!-- Not authenticated - redirect handled by reactive statement -->
  <div class="h-screen flex items-center justify-center p-4">
    <Card class="w-full max-w-md p-8 text-center">
      <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Edit class="w-8 h-8 text-primary" />
      </div>
      <h1 class="text-2xl font-bold mb-3">Authentication Required</h1>
      <p class="text-muted-foreground mb-6">
        Please sign in to access the story editor.
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
{:else if story}
  <StoryEditor {storyId} />
{:else if loadError}
  <!-- Show specific error message -->
  <div class="h-screen flex items-center justify-center p-4">
    <Card class="w-full max-w-md p-8 text-center">
      <div class="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertCircle class="w-8 h-8 text-destructive" />
      </div>
      <h1 class="text-2xl font-bold mb-3">Error Loading Story</h1>
      <p class="text-muted-foreground mb-6">
        {loadError}
      </p>
      <div class="text-xs text-muted-foreground mb-4">
        Story ID: {storyId || 'Not provided'}<br>
        User ID: {$authStore.user?.id || 'Not available'}
      </div>
      <div class="space-y-3">
        <Button class="w-full" on:click={() => loadStory(storyId)}>
          Try Again
        </Button>
        <Button variant="outline" class="w-full" on:click={navigateToDashboard}>
          Back to Dashboard
        </Button>
        <Button variant="outline" class="w-full" on:click={navigateToLanding}>
          Back to Home
        </Button>
      </div>
    </Card>
  </div>
{:else}
  <!-- Story not found or failed to load -->
  <div class="h-screen flex items-center justify-center p-4">
    <Card class="w-full max-w-md p-8 text-center">
      <div class="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Edit class="w-8 h-8 text-destructive" />
      </div>
      <h1 class="text-2xl font-bold mb-3">Story Not Found</h1>
      <p class="text-muted-foreground mb-6">
        The story you're looking for doesn't exist or you don't have permission to access it.
      </p>
      <div class="text-xs text-muted-foreground mb-4">
        Story ID: {storyId || 'Not provided'}<br>
        User ID: {$authStore.user?.id || 'Not available'}
      </div>
      <div class="space-y-3">
        <Button class="w-full" on:click={navigateToDashboard}>
          Back to Dashboard
        </Button>
        <Button variant="outline" class="w-full" on:click={navigateToLanding}>
          Back to Home
        </Button>
      </div>
    </Card>
  </div>
{/if}