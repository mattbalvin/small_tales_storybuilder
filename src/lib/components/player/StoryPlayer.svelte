<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { storiesStore, storiesService } from '$lib/stores/stories'
  import { authStore } from '$lib/stores/auth'
  import Button from '$lib/components/ui/button.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { Play, Volume2, ArrowLeft, ArrowRight, Home, Settings, Pause, RotateCcw } from 'lucide-svelte'
  import { NarrationPlayer } from '$lib/services/narrationGeneration'

  export let storyId: string
  export let isPreviewMode: boolean = false
  export let initialPageIndex: number = 0

  $: story = $storiesStore.currentStory
  $: pages = $storiesStore.currentPages
  $: loading = $storiesStore.currentStoryLoading
  $: publicStoryError = null
  $: isPublicStory = false

  let currentPageIndex = initialPageIndex
  let isPlaying = isPreviewMode // Auto-start in preview mode
  let isAutoReading = false // Don't auto-advance in preview mode
  let orientation: 'landscape' | 'portrait' = 'landscape'
  let showSettings = false
  let audioElement: HTMLAudioElement | null = null
  let currentAudio: string | null = null

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

  function detectOrientation() {
    // Default to landscape if no story or pages available
    if (!story || !pages || pages.length === 0) {
      orientation = 'landscape'
      return
    }

    // Use story's orientation setting if available
    if (story.orientation) {
      orientation = story.orientation
      return
    }

    // Analyze first page content to determine best orientation
    const firstPage = pages[0]
    if (firstPage?.content) {
      // Check if page has both landscape and portrait layouts
      if (firstPage.content.landscape && firstPage.content.portrait) {
        // Default to landscape if both are available
        orientation = 'landscape'
      } else if (firstPage.content.landscape) {
        orientation = 'landscape'
      } else if (firstPage.content.portrait) {
        orientation = 'portrait'
      } else {
        // Fallback to landscape
        orientation = 'landscape'
      }
    } else {
      // Default fallback
      orientation = 'landscape'
    }
  }

  function stopAudio() {
    if (audioElement) {
      audioElement.pause()
      audioElement = null
    }
    if (currentNarrationPlayer) {
      currentNarrationPlayer.stop()
      currentNarrationPlayer = null
    }
    currentAudio = null
    highlightedWordIndex = -1
    activeNarrationElementId = null
    currentWord = null
  }

  function startAutoReading() {
    if (currentPage && autoRead) {
      isAutoReading = true
      // Implementation for auto-reading would go here
    }
  }

  onMount(async () => {
    if (isPreviewMode) {
      // In preview mode, we already have the story loaded
      // Just set the current page index
      currentPageIndex = initialPageIndex
      
      // Auto-start playback in preview mode
      if (autoRead) {
        setTimeout(() => {
          startAutoReading()
        }, 500) // Small delay to ensure everything is ready
      }
    } else if (storyId) {
      try {
        // First try to load story data for public access
        await storiesService.loadPublicStoryData(storyId)
        
        // Load story pages
        await storiesService.loadStoryPages(storyId)
        
        // If user is authenticated, try to load full story details for better experience
        if ($authStore.user) {
          try {
            await storiesService.loadSingleStory(storyId, $authStore.user.id)
          } catch (error) {
            console.log('Could not load authenticated story details, continuing with public access')
          }
        }

        // Load story settings if available
        if (story?.settings) {
          volume = story.settings.volume || 0.7
          autoRead = story.settings.autoRead || true
          showText = story.settings.showText || true
          readingSpeed = story.settings.readingSpeed || 1.0
        }

        // Detect best orientation based on first page content
        detectOrientation()
      } catch (error) {
        console.error('Failed to load story:', error)
        publicStoryError = 'This story is not available or has been made private.'
      }
    }
  })

  onDestroy(() => {
    // Clean up any audio or narration players
    stopAudio()
  })

  // ... rest of the code ...

</script>

<div class="min-h-screen bg-gradient-to-br from-soft-buttercream via-soft-buttercream to-periwinkle-blue/10 flex flex-col">
  <!-- ... rest of the template ... -->
</div>

<style>
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
    width: 18px;
    height: 18px;
    background: hsl(var(--golden-apricot));
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: hsl(var(--golden-apricot));
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  input[type="checkbox"] {
    accent-color: hsl(var(--golden-apricot));
  }
  
  .word-highlight {
    background-color: hsl(var(--golden-apricot) / 0.3);
    color: inherit;
    font-weight: bold;
    transform: scale(1.05);
    display: inline-block;
    border-radius: 4px;
    padding: 0 2px;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 0 5px hsl(var(--golden-apricot) / 0.5);
  }
</style>