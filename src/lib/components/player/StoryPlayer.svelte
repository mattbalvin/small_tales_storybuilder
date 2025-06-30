<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { storiesStore, storiesService } from '$lib/stores/stories'
  import { authStore } from '$lib/stores/auth'
  import Button from '$lib/components/ui/button.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { Play, Volume2, ArrowLeft, ArrowRight, Home, Settings, Pause, RotateCcw, AlertCircle } from 'lucide-svelte'
  import { NarrationPlayer } from '$lib/services/narrationGeneration'

  export let storyId: string
  export let isPreviewMode: boolean = false
  export let initialPageIndex: number = 0

  $: story = $storiesStore.currentStory
  $: pages = $storiesStore.currentPages
  $: loading = $storiesStore.currentStoryLoading
  $: error = $storiesStore.error
  $: publicStoryError = null
  $: isPublicStory = false

  let currentPageIndex = initialPageIndex
  let isPlaying = isPreviewMode // Auto-start in preview mode
  let isAutoReading = false // Don't auto-advance in preview mode
  let orientation: 'landscape' | 'portrait' = 'landscape'
  let showSettings = false
  let audioElement: HTMLAudioElement | null = null
  let currentAudio: string | null = null
  let retryCount = 0
  let maxRetries = 3

  // Narration playback state
  let currentNarrationPlayer: NarrationPlayer | null = null
  let highlightedWordIndex: number = -1
  let activeNarrationElementId: string | null = null
  let currentWord: string | null = null

  // Story settings
  let volume = 0.7
  let autoRead = true
  let showText = true
  let readingSpeed = 1.0

  $: currentPage = pages[currentPageIndex]
  $: canGoNext = currentPageIndex < pages.length - 1
  $: canGoPrevious = currentPageIndex > 0

  // Get visual elements from the page content (text and image only)
  $: visualElements = (currentPage?.content?.elements || []).filter(el => el.type !== 'audio')

  // Get audio elements from the page content
  $: audioElements = currentPage?.content?.audioElements || []

  // Create display elements with layout-specific properties for current orientation
  $: displayElements = visualElements.map(element => {
    // Ensure layouts object exists with both orientations
    const layouts = element.layouts || { 
      landscape: { x: 50, y: 50, width: 200, height: 100, zIndex: 0, hidden: false },
      portrait: { x: 30, y: 80, width: 250, height: 120, zIndex: 0, hidden: false }
    }
    
    const layoutData = layouts[orientation] || {}
    
    return {
      ...element,
      // Use layout-specific properties with proper defaults
      x: layoutData.x ?? (orientation === 'landscape' ? 50 : 30),
      y: layoutData.y ?? (orientation === 'landscape' ? 50 : 80),
      width: layoutData.width ?? (orientation === 'landscape' ? 200 : 250),
      height: layoutData.height ?? (orientation === 'landscape' ? 100 : 120),
      zIndex: layoutData.zIndex ?? 0,
      hidden: layoutData.hidden ?? false
    }
  }).filter(el => !el.hidden).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)) || []

  // Canvas dimensions (logical size)
  $: canvasWidth = orientation === 'landscape' ? 1600 : 900
  $: canvasHeight = orientation === 'landscape' ? 900 : 1600

  // Sort elements by z-index for rendering (lower z-index renders first, higher z-index on top)
  $: sortedElements = [...displayElements].sort((a, b) => {
    const aZ = a.zIndex || 0
    const bZ = b.zIndex || 0
    return aZ - bZ
  })

  onMount(async () => {
    try {
      console.log('StoryPlayer mounted with storyId:', storyId)
      
      if (storyId) {
        // Try to load the story with authenticated user first
        if ($authStore.user) {
          try {
            await storiesService.loadSingleStory(storyId, $authStore.user.id)
            await storiesService.loadStoryPages(storyId)
            console.log('Story loaded as authenticated user')
          } catch (error) {
            console.log('Failed to load as authenticated user, trying public access')
            // If that fails, try to load as public story
            await loadPublicStory()
          }
        } else {
          // No authenticated user, try to load as public story
          await loadPublicStory()
        }
      }
      
      // Initialize audio player if in preview mode
      if (isPreviewMode && isPlaying) {
        startPlayback()
      }
    } catch (err) {
      console.error('Error in StoryPlayer onMount:', err)
      if (err instanceof Error) {
        publicStoryError = err.message
      } else {
        publicStoryError = 'Failed to load story'
      }
    }
  })

  onDestroy(() => {
    // Clean up any audio or narration players
    if (audioElement) {
      audioElement.pause()
      audioElement = null
    }
    
    if (currentNarrationPlayer) {
      currentNarrationPlayer.destroy()
      currentNarrationPlayer = null
    }
  })

  async function loadPublicStory() {
    try {
      isPublicStory = true
      await storiesService.loadPublicStoryData(storyId)
      await storiesService.loadStoryPages(storyId)
      console.log('Story loaded as public story')
    } catch (error) {
      console.error('Failed to load public story:', error)
      throw error
    }
  }

  function startPlayback() {
    isPlaying = true
    
    // Start narration for the current page
    playPageNarration()
  }

  function stopPlayback() {
    isPlaying = false
    
    // Stop any active narration
    if (currentNarrationPlayer) {
      currentNarrationPlayer.stop()
      currentNarrationPlayer = null
      activeNarrationElementId = null
      currentWord = null
    }
    
    // Stop any background audio
    if (audioElement) {
      audioElement.pause()
      audioElement = null
      currentAudio = null
    }
  }

  function togglePlayback() {
    if (isPlaying) {
      stopPlayback()
    } else {
      startPlayback()
    }
  }

  function goToNextPage() {
    if (canGoNext) {
      stopPlayback()
      currentPageIndex++
      if (isPlaying) {
        startPlayback()
      }
    }
  }

  function goToPreviousPage() {
    if (canGoPrevious) {
      stopPlayback()
      currentPageIndex--
      if (isPlaying) {
        startPlayback()
      }
    }
  }

  function toggleOrientation() {
    orientation = orientation === 'landscape' ? 'portrait' : 'landscape'
  }

  function toggleSettings() {
    showSettings = !showSettings
  }

  function exitPlayer() {
    // Navigate back to dashboard or editor
    if (isPreviewMode) {
      // Just close the preview modal
      window.history.back()
    } else {
      window.location.hash = '#/dashboard'
    }
  }

  function playPageNarration() {
    // Find text elements with narration data, sorted by narrationSequence
    const narratedElements = sortedElements
      .filter(el => el.type === 'text' && el.properties?.narrationData && el.properties?.inMainNarration)
      .sort((a, b) => (a.properties?.narrationSequence || 0) - (b.properties?.narrationSequence || 0))
    
    if (narratedElements.length > 0) {
      playElementNarration(narratedElements[0])
    }
  }

  function playElementNarration(element: any) {
    if (!element || element.type !== 'text' || !element.properties?.narrationData) return
    
    // Stop any currently playing narration
    if (currentNarrationPlayer) {
      currentNarrationPlayer.destroy()
      currentNarrationPlayer = null
      activeNarrationElementId = null
      currentWord = null
    }
    
    // Create a new narration player
    try {
      const narrationData = element.properties.narrationData
      currentNarrationPlayer = new NarrationPlayer(narrationData)
      
      // Set up event handlers
      currentNarrationPlayer.onWordHighlight = (word, index) => {
        highlightedWordIndex = index
        if (word && typeof word === 'object' && word.word) {
          currentWord = word.word
        } else if (typeof word === 'string') {
          currentWord = word
        } else {
          console.warn('Invalid word data received:', word)
          currentWord = null
        }
      }
      
      currentNarrationPlayer.onPlaybackEnd = () => {
        // When narration ends, find the next element to narrate
        activeNarrationElementId = null
        currentNarrationPlayer = null
        currentWord = null
        
        if (isAutoReading) {
          // Find the next element to narrate
          const narratedElements = sortedElements
            .filter(el => el.type === 'text' && el.properties?.narrationData && el.properties?.inMainNarration)
            .sort((a, b) => (a.properties?.narrationSequence || 0) - (b.properties?.narrationSequence || 0))
          
          const currentIndex = narratedElements.findIndex(el => el.id === element.id)
          if (currentIndex >= 0 && currentIndex < narratedElements.length - 1) {
            // Play the next narrated element
            setTimeout(() => {
              playElementNarration(narratedElements[currentIndex + 1])
            }, 1000) // 1 second delay between narrations
          } else if (canGoNext) {
            // Move to next page
            setTimeout(() => {
              goToNextPage()
            }, 2000) // 2 second delay before next page
          }
        }
      }
      
      // Start playback
      currentNarrationPlayer.playFull()
      activeNarrationElementId = element.id
    } catch (error) {
      console.error('Failed to play narration:', error)
      currentNarrationPlayer = null
      activeNarrationElementId = null
      currentWord = null
    }
  }

  function getHighlightStyle(elementId: string, text: string): string {
    if (activeNarrationElementId !== elementId || !currentWord) return ''
    
    const highlightColor = sortedElements.find(el => el.id === elementId)?.properties?.narrationHighlightColor || '#F0B464'
    const useGlow = sortedElements.find(el => el.id === elementId)?.properties?.narrationHighlightGlow !== false
    
    const glowStyle = useGlow ? `text-shadow: 0 0 10px ${highlightColor}80;` : ''
    
    return `color: ${highlightColor}; ${glowStyle} font-weight: bold;`
  }

  function renderTextWithHighlight(elementId: string, text: string): string {
    if (activeNarrationElementId !== elementId || !currentWord) return text
    
    // Simple word highlighting (could be improved with more sophisticated word matching)
    return text.replace(new RegExp(`\\b${currentWord}\\b`, 'gi'), 
      match => `<span style="${getHighlightStyle(elementId, match)}">${match}</span>`)
  }
</script>

<div class="h-screen flex flex-col bg-soft-buttercream">
  <!-- Header with controls -->
  <header class="p-4 border-b border-periwinkle-blue/20 bg-white/80 backdrop-blur-sm">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" on:click={exitPlayer}>
          <Home class="w-4 h-4 mr-2" />
          {isPreviewMode ? 'Close Preview' : 'Exit'}
        </Button>
        
        <h1 class="text-lg font-semibold text-coral-sunset hidden md:block">
          {story?.title || 'Story Player'}
        </h1>
      </div>
      
      <div class="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          on:click={goToPreviousPage} 
          disabled={!canGoPrevious}
          class={!canGoPrevious ? 'opacity-50' : ''}
        >
          <ArrowLeft class="w-4 h-4" />
        </Button>
        
        <span class="text-sm">
          Page {currentPageIndex + 1} of {pages.length}
        </span>
        
        <Button 
          variant="outline" 
          size="sm" 
          on:click={goToNextPage} 
          disabled={!canGoNext}
          class={!canGoNext ? 'opacity-50' : ''}
        >
          <ArrowRight class="w-4 h-4" />
        </Button>
      </div>
      
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" on:click={togglePlayback}>
          {#if isPlaying}
            <Pause class="w-4 h-4 mr-2" />
            Pause
          {:else}
            <Play class="w-4 h-4 mr-2" />
            Play
          {/if}
        </Button>
        
        <Button variant="outline" size="sm" on:click={toggleOrientation} title="Switch orientation">
          {orientation === 'landscape' ? '16:9' : '9:16'}
        </Button>
        
        <Button variant="outline" size="sm" on:click={toggleSettings}>
          <Settings class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </header>

  <!-- Main content area -->
  <main class="flex-1 overflow-hidden flex items-center justify-center p-4 bg-soft-buttercream">
    {#if loading}
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-sunset"></div>
      </div>
    {:else if error || publicStoryError}
      <Card class="p-8 max-w-md text-center">
        <div class="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle class="w-8 h-8 text-destructive" />
        </div>
        <h2 class="text-xl font-bold mb-3 text-coral-sunset">Error Loading Story</h2>
        <p class="text-dusty-teal mb-6">
          {error || publicStoryError}
        </p>
        <Button variant="outline" on:click={exitPlayer}>
          <Home class="w-4 h-4 mr-2" />
          Return Home
        </Button>
      </Card>
    {:else if !currentPage}
      <Card class="p-8 max-w-md text-center">
        <div class="w-16 h-16 bg-periwinkle-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle class="w-8 h-8 text-periwinkle-blue" />
        </div>
        <h2 class="text-xl font-bold mb-3 text-coral-sunset">No Pages Found</h2>
        <p class="text-dusty-teal mb-6">
          This story doesn't have any pages yet.
        </p>
        <Button variant="outline" on:click={exitPlayer}>
          <Home class="w-4 h-4 mr-2" />
          Return Home
        </Button>
      </Card>
    {:else}
      <!-- Story canvas with proper aspect ratio -->
      <div 
        class="relative max-w-full max-h-full bg-white rounded-2xl shadow-xl overflow-hidden"
        style="aspect-ratio: {orientation === 'landscape' ? '16/9' : '9/16'}; width: 100%; height: 100%; max-width: {orientation === 'landscape' ? '90vh * 16/9' : '90vh * 9/16'}; max-height: 90vh;"
      >
        <!-- Render elements -->
        {#each sortedElements as element (element.id)}
          <div
            class="absolute"
            style="
              left: {element.x / canvasWidth * 100}%; 
              top: {element.y / canvasHeight * 100}%; 
              width: {element.width / canvasWidth * 100}%; 
              height: {element.height / canvasHeight * 100}%;
              z-index: {element.zIndex || 0};
            "
          >
            {#if element.type === 'text'}
              <div 
                class="w-full h-full overflow-hidden"
                style="
                  font-size: {element.properties?.fontSize || 16}px;
                  color: {element.properties?.color || '#000000'};
                  background-color: {element.properties?.backgroundColor ? 
                    `${element.properties.backgroundColor}${element.properties.backgroundAlpha ? 
                      Math.round(element.properties.backgroundAlpha * 2.55).toString(16).padStart(2, '0') : 
                      'FF'}` : 
                    'transparent'};
                  line-height: {element.properties?.lineHeight || 1.3};
                  padding: 12px;
                  border-radius: 8px;
                  white-space: pre-wrap;
                  word-wrap: break-word;
                  overflow-wrap: break-word;
                "
              >
                {#if showText}
                  {@html renderTextWithHighlight(element.id, element.properties?.text || '')}
                {/if}
              </div>
            {:else if element.type === 'image'}
              <div class="w-full h-full overflow-hidden">
                <img 
                  src={element.properties?.src} 
                  alt={element.properties?.alt || ''} 
                  class="w-full h-full object-cover"
                  style="
                    opacity: {(element.properties?.opacity || 100) / 100};
                    transform: scale({(element.properties?.scale || 100) / 100});
                    transition: opacity 0.2s ease, transform 0.2s ease;
                    transform-origin: center center;
                    border-radius: 8px;
                  "
                />
              </div>
            {/if}
          </div>
        {/each}
        
        <!-- Page number indicator -->
        <div class="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-dusty-teal">
          {currentPageIndex + 1} / {pages.length}
        </div>
      </div>
    {/if}
  </main>

  <!-- Settings panel (if shown) -->
  {#if showSettings}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card class="w-full max-w-md p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-coral-sunset">Story Settings</h2>
          <Button variant="ghost" size="sm" on:click={toggleSettings}>
            <span class="sr-only">Close</span>
            &times;
          </Button>
        </div>
        
        <div class="space-y-4">
          <!-- Volume control -->
          <div>
            <label class="text-sm font-medium mb-2 block text-dusty-teal">Volume: {Math.round(volume * 100)}%</label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              bind:value={volume}
              class="w-full"
            />
          </div>
          
          <!-- Auto-read toggle -->
          <div class="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="autoRead" 
              bind:checked={autoRead}
              class="rounded accent-golden-apricot w-4 h-4"
            />
            <label for="autoRead" class="text-sm font-medium text-dusty-teal">Auto-read pages</label>
          </div>
          
          <!-- Show text toggle -->
          <div class="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="showText" 
              bind:checked={showText}
              class="rounded accent-golden-apricot w-4 h-4"
            />
            <label for="showText" class="text-sm font-medium text-dusty-teal">Show text</label>
          </div>
          
          <!-- Reading speed -->
          <div>
            <label class="text-sm font-medium mb-2 block text-dusty-teal">Reading Speed: {readingSpeed}x</label>
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.1" 
              bind:value={readingSpeed}
              class="w-full"
            />
          </div>
        </div>
        
        <div class="mt-6 pt-6 border-t border-periwinkle-blue/20">
          <Button variant="outline" class="w-full" on:click={toggleSettings}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  {/if}
</div>

<style>
  /* Custom range input styling */
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    background: hsl(var(--periwinkle-blue) / 0.3);
    border-radius: 3px;
    outline: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: hsl(var(--golden-apricot));
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: hsl(var(--golden-apricot));
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  input[type="checkbox"] {
    accent-color: hsl(var(--golden-apricot));
  }