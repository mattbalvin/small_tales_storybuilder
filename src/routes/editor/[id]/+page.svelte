<script lang="ts">
  import { onMount } from 'svelte'
  import { storiesStore, storiesService } from '$lib/stores/stories'
  import { authStore } from '$lib/stores/auth'
  import StoryEditor from '$lib/components/editor/StoryEditor.svelte'
  import { supabase } from '$lib/config/supabase'
  import Button from '$lib/components/ui/button.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { LogIn, FileEdit as Edit } from 'lucide-svelte'

  export let id: string

  $: storyId = id
  $: story = $storiesStore.currentStory

  function navigateToAuth() {
    window.location.hash = '#/auth'
  }

  function navigateToLanding() {
    window.location.hash = '#/'
  }

  onMount(async () => {
    // Check if storyId is valid before proceeding
    if (!storyId || storyId === 'undefined' || storyId.trim() === '') {
      console.error('Invalid story ID:', storyId)
      window.location.hash = '#/dashboard'
      return
    }

    // Redirect to auth if not authenticated
    const unsubscribe = authStore.subscribe(async ($authStore) => {
      if (!$authStore.loading && !$authStore.user) {
        window.location.hash = '#/auth'
        return
      }

      // Load the story if we have a user and don't have the story
      if ($authStore.user && (!story || story.id !== storyId)) {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('id', storyId)
          .single()

        if (error || !data) {
          console.error('Failed to load story:', error)
          window.location.hash = '#/dashboard'
          return
        }

        storiesService.setCurrentStory(data)
      }
    })

    return unsubscribe
  })
</script>

<svelte:head>
  <title>{story?.title || 'Loading...'} - Story Editor</title>
</svelte:head>

{#if $authStore.loading}
  <div class="h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p class="text-muted-foreground">Loading...</p>
    </div>
  </div>
{:else if !$authStore.user}
  <!-- Not authenticated - redirect handled in onMount -->
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
{:else}
  <div class="h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p class="text-muted-foreground">Loading story...</p>
    </div>
  </div>
{/if}