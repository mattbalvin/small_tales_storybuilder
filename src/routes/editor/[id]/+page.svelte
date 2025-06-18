<script lang="ts">
  import { onMount } from 'svelte'
  import { storiesStore, storiesService } from '$lib/stores/stories'
  import { authStore } from '$lib/stores/auth'
  import StoryEditor from '$lib/components/editor/StoryEditor.svelte'
  import { supabase } from '$lib/config/supabase'

  export let storyId: string

  $: story = $storiesStore.currentStory

  onMount(async () => {
    if (!$authStore.user) {
      window.location.hash = '#/auth'
      return
    }

    // Load the story if we don't have it
    if (!story || story.id !== storyId) {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single()

      if (error || !data) {
        window.location.hash = '#/'
        return
      }

      storiesService.setCurrentStory(data)
    }
  })
</script>

<svelte:head>
  <title>{story?.title || 'Loading...'} - Story Editor</title>
</svelte:head>

{#if story}
  <StoryEditor {storyId} />
{:else}
  <div class="h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p class="text-muted-foreground">Loading story...</p>
    </div>
  </div>
{/if}