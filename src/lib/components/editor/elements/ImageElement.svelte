<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { mediaService } from '$lib/stores/media'
  import { authStore } from '$lib/stores/auth'

  export let element: any

  const dispatch = createEventDispatcher()

  $: src = element.properties?.src
  $: alt = element.properties?.alt || 'Image element'
  $: opacity = element.properties?.opacity !== undefined ? element.properties.opacity / 100 : 1

  $: imageStyle = `
    opacity: ${opacity};
    transition: opacity 0.2s ease;
  `

  // Track the last processed URL to avoid infinite loops
  let lastProcessedUrl = ''
  let isProcessing = false

  // Auto-import external URLs to media library
  async function handleSrcChange(newSrc: string) {
    if (!newSrc || !$authStore.user || isProcessing || newSrc === lastProcessedUrl) {
      return
    }

    try {
      // Check if it's an external URL that needs importing
      const urlObj = new URL(newSrc)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return // Not a web URL
      }

      // Check if URL is from our Supabase storage
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (newSrc.includes(supabaseUrl)) {
        return // Already from our storage
      }

      console.log('Processing external image URL for import:', newSrc)
      isProcessing = true
      lastProcessedUrl = newSrc

      // Process the URL through media service (will import if external)
      const processedUrl = await mediaService.processUrlForElement(newSrc, $authStore.user.id, 'image')
      
      // If the URL was changed (imported), update the element
      if (processedUrl !== newSrc) {
        console.log('Image imported successfully, updating element with new URL:', processedUrl)
        dispatch('update', {
          properties: {
            ...element.properties,
            src: processedUrl
          }
        })
      }
    } catch (error) {
      console.error('Failed to process image URL:', error)
      // Show user-friendly error message
      alert(`Failed to import image: ${error.message}`)
    } finally {
      isProcessing = false
    }
  }

  // Watch for src changes and auto-import if needed
  $: if (src && $authStore.user && src !== lastProcessedUrl && !isProcessing) {
    handleSrcChange(src)
  }
</script>

<div class="w-full h-full flex items-center justify-center bg-gray-100 rounded border-2 border-dashed border-gray-300">
  {#if src}
    <img 
      {src} 
      {alt} 
      class="w-full h-full object-cover rounded"
      style={imageStyle}
      on:error={() => {
        console.error('Image failed to load:', src)
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
  
  {#if isProcessing}
    <div class="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
      <div class="text-white text-center">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
        <p class="text-xs">Importing image...</p>
      </div>
    </div>
  {/if}
</div>