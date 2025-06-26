<script lang="ts">
  import StoryPlayer from '$lib/components/player/StoryPlayer.svelte'

  // This component receives params from svelte-spa-router
  export let params = {}

  // Extract the id from params
  $: storyId = params.id
</script>

<svelte:head>
  <title>Play Story - Small Tales</title>
</svelte:head>

{#if storyId && storyId !== 'undefined' && storyId.trim() !== ''}
  <StoryPlayer {storyId} />
{:else}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-2xl font-bold mb-4">Invalid Story</h1>
      <p class="text-muted-foreground mb-6">No story ID provided</p>
      <a href="#/" class="text-primary hover:underline">Go Home</a>
    </div>
  </div>
{/if}