<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { mediaService } from '$lib/stores/media'
  import { authStore } from '$lib/stores/auth'

  export let element: any

  const dispatch = createEventDispatcher()

  $: src = element.properties?.src
  $: autoplay = element.properties?.autoplay || false

  // Auto-import external URLs to media library
  async function handleSrcChange(newSrc: string) {
    if (!newSrc || !$authStore.user) return

    try {
      // Process the URL through media service (will import if external)
      const processedUrl = await mediaService.processUrlForElement(newSrc, $authStore.user.id, 'audio')
      
      // If the URL was changed (imported), update the element
      if (processedUrl !== newSrc) {
        dispatch('update', {
          properties: {
            ...element.properties,
            src: processedUrl
          }
        })
      }
    } catch (error) {
      console.error('Failed to process audio URL:', error)
    }
  }

  // Watch for src changes and auto-import if needed
  $: if (src && $authStore.user) {
    handleSrcChange(src)
  }
</script>

<div class="w-full h-full flex items-center justify-center bg-periwinkle-blue/10 rounded-xl border-2 border-dashed border-periwinkle-blue/30">
  {#if src}
    <audio 
      controls 
      {autoplay}
      class="w-full"
      on:error={() => {
        dispatch('update', {
          properties: {
            ...element.properties,
            src: ''
          }
        })
      }}
    >
      <source {src} />
      Your browser does not support the audio element.
    </audio>
  {:else}
    <div class="text-center text-periwinkle-blue">
      <svg class="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
      <p class="text-sm">No audio selected</p>
    </div>
  {/if}
</div>