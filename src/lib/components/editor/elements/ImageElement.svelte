<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let element: any

  const dispatch = createEventDispatcher()

  $: src = element.properties?.src
  $: alt = element.properties?.alt || 'Image element'
</script>

<div class="w-full h-full flex items-center justify-center bg-gray-100 rounded border-2 border-dashed border-gray-300">
  {#if src}
    <img 
      {src} 
      {alt} 
      class="w-full h-full object-cover rounded"
      on:error={() => {
        dispatch('update', {
          properties: {
            ...element.properties,
            src: ''
          }
        })
      }}
    />
  {:else}
    <div class="text-center text-gray-500">
      <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="text-sm">No image selected</p>
    </div>
  {/if}
</div>