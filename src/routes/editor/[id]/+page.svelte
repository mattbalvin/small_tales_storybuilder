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

  function load({params}) {
    return {
      id: params.id
    };
  }
  
  function navigateToAuth() {
    window.location.hash = '#/auth'
  }

  function navigateToLanding() {
    window.location.hash = '#/'
  }

  // Reactive statement to handle authentication redirect
  $: if (!$authStore.loading && !$authStore.user) {
    window.location.hash = '#/auth'
  }

  // Reactive statement to load story when conditions are met
  $: if ($authStore.user && storyId && storyId !== 'undefined' && storyId.trim() !== '' && (!story || story.id !== storyId)) {
    loadStory(storyId)
  }

  async function loadStory(id: string) {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .eq('author_id', $authStore.user?.id) // Security check: only load stories owned by the user
        .single()

      if (error || !data) {
        console.error('Failed to load story:', error)
        window.location.hash = '#/dashboard'
        return
      }

      storiesService.setCurrentStory(data)
    } catch (err) {
      console.error('Error loading story:', err)
      window.location.hash = '#/dashboard'
    }
  }

  // Check for invalid story ID after component is mounted and ID is available
  $: if (storyId && (storyId === 'undefined' || storyId.trim() === '')) {
    console.error('Invalid story ID:', storyId)
    window.location.hash = '#/dashboard'
  }
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
{:else}
  <div class="h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p class="text-muted-foreground">Loading story...</p>
    </div>
  </div>
{/if}