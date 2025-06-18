<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let element: any

  const dispatch = createEventDispatcher()

  $: src = element.properties?.src
  $: autoplay = element.properties?.autoplay || false
</script>

<div class="w-full h-full flex items-center justify-center bg-blue-50 rounded border-2 border-dashed border-blue-300">
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
    <div class="text-center text-blue-600">
      <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
      <p class="text-sm">No audio selected</p>
    </div>
  {/if}
</div>