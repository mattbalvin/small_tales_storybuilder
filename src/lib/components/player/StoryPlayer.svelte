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

  async function loadStoryWithRetry() {
    try {
      retryCount = 0
      
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
        return
      }

      if (!storyId) {
        throw new Error('No story ID provided')
      }

      console.log('Loading story with ID:', storyId)
      
      // Clear any previous errors
      storiesService.clearError()
      
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
      
      console.log('Story loaded successfully')
    } catch (error) {
      console.error('Failed to load story:', error)
      
      if (retryCount < maxRetries && error.message?.includes('Failed to fetch')) {
        retryCount++
        console.log(`Retrying story load (attempt ${retryCount}/${maxRetries})...`)
        setTimeout(() => loadStoryWithRetry(), 2000 * retryCount) // Exponential backoff
      } else {
        publicStoryError = error.message || 'This story is not available or has been made private.'
      }
    }
  }

  function detectOrientation() {
    if (pages.length === 0) return

    // Simple heuristic: if story has more landscape-oriented content, use landscape
    const firstPage = pages[0]
    if (firstPage?.content?.elements) {
      const elements = firstPage.content.elements
      const landscapeElements = elements.filter(el => 
        el.layouts?.landscape && 
        (el.layouts.landscape.width > el.layouts.landscape.height)
      )
      const portraitElements = elements.filter(el => 
        el.layouts?.portrait && 
        (el.layouts.portrait.height > el.layouts.portrait.width)
      )
      
      orientation = landscapeElements.length >= portraitElements.length ? 'landscape' : 'portrait'
    }
  }

  function startReading() {
    isPlaying = true
    currentPageIndex = 0
    
    if (autoRead) {
      startAutoReading()
    }
  }

  function startAutoReading() {
    isAutoReading = true
    playPageAudio()
  }

  function stopReading() {
    isPlaying = false
    isAutoReading = false
    stopAudio()
  }

  function nextPage() {
    if (canGoNext) {
      currentPageIndex++
      if (isAutoReading) {
        playPageAudio()
      }
    } else if (isPlaying) {
      // Story finished
      stopReading()
    }
  }

  function previousPage() {
    if (canGoPrevious) {
      currentPageIndex--
      if (isAutoReading) {
        playPageAudio()
      }
    }
  }

  function goToPage(index: number) {
    if (index >= 0 && index < pages.length) {
      currentPageIndex = index
      if (isAutoReading) {
        playPageAudio()
      }
    }
  }

  function playPageAudio() {
    // Stop any currently playing narration
    stopAudio()
    
    if (!currentPage?.content?.elements) return

    // Find text elements with narration data
    const textElements = currentPage.content.elements.filter(el => 
      el.type === 'text' && 
      el.properties?.narrationData
    ).sort((a, b) => 
      (a.properties?.narrationSequence || 0) - (b.properties?.narrationSequence || 0)
    )

    if (textElements.length > 0) {
      // Play the first narration
      playElementNarration(textElements[0])
    } else {
      // No narration, check for audio elements
      const narrationAudio = currentPage.content.audioElements?.find(audio => 
        audio.properties?.src && !audio.properties?.isIdleLoop
      )

      if (narrationAudio?.properties?.src) {
        playAudio(narrationAudio.properties.src)
      } else {
        // No audio, auto-advance after reading time
        const readingTime = estimateReadingTime()
        setTimeout(() => {
          if (isAutoReading) {
            nextPage()
          }
        }, readingTime)
      }
    }
  }

  function playElementNarration(element: any) {
    if (!element || element.type !== 'text' || !element.properties?.narrationData) return

    try {
      // Clean up any existing narration player
      if (currentNarrationPlayer) {
        currentNarrationPlayer.destroy()
        currentNarrationPlayer = null
      }

      // Create a new narration player
      const narrationData = element.properties.narrationData
      currentNarrationPlayer = new NarrationPlayer(narrationData)
      activeNarrationElementId = element.id
      
      // Set up event handlers
      currentNarrationPlayer.onWordHighlight = (word, index) => {
        highlightedWordIndex = index
        if (word && typeof word === 'object' && word.word) {
          currentWord = word.word
        } else if (typeof word === 'string') {
          currentWord = word
        } else {
          currentWord = null
        }
      }
      
      currentNarrationPlayer.onPlaybackEnd = () => {
        // When narration ends, move to next narration or page
        activeNarrationElementId = null
        currentNarrationPlayer = null
        currentWord = null
        highlightedWordIndex = -1
        
        // Find the next narration element
        const textElements = currentPage.content.elements.filter(el => 
          el.type === 'text' && 
          el.properties?.narrationData
        ).sort((a, b) => 
          (a.properties?.narrationSequence || 0) - (b.properties?.narrationSequence || 0)
        )
        
        const currentIndex = textElements.findIndex(el => el.id === element.id)
        if (currentIndex >= 0 && currentIndex < textElements.length - 1) {
          // Play the next narration
          playElementNarration(textElements[currentIndex + 1])
        } else if (isAutoReading) {
          // Move to next page
          nextPage()
        }
      }
      
      // Start playback
      currentNarrationPlayer.playFull()
    } catch (error) {
      console.error('Failed to play narration:', error)
      // If narration fails, move to next page after a delay
      if (isAutoReading) {
        setTimeout(() => nextPage(), 2000)
      }
    }
  }

  function playAudio(src: string) {
    stopAudio()
    
    currentAudio = src
    audioElement = new Audio(src)
    audioElement.volume = volume
    audioElement.playbackRate = readingSpeed
    
    audioElement.addEventListener('ended', () => {
      if (isAutoReading) {
        nextPage()
      }
    })
    
    audioElement.addEventListener('error', () => {
      console.error('Failed to play audio:', src)
      // Auto-advance after estimated reading time if audio fails
      const readingTime = estimateReadingTime()
      setTimeout(() => {
        if (isAutoReading) {
          nextPage()
        }
      }, readingTime)
    })
    
    audioElement.play().catch(error => {
      console.error('Audio play failed:', error)
    })
  }

  function stopAudio() {
    if (audioElement) {
      audioElement.pause()
      audioElement = null
    }
    if (currentNarrationPlayer) {
      currentNarrationPlayer.destroy()
      currentNarrationPlayer = null
      activeNarrationElementId = null
      currentWord = null
      highlightedWordIndex = -1
    }
    currentAudio = null
  }

  function estimateReadingTime(): number {
    if (!currentPage?.content?.elements) return 3000

    // Count words in text elements
    let wordCount = 0
    const elements = currentPage.content.elements.filter(el => el.type === 'text')
    
    elements.forEach(element => {
      const text = element.properties?.text || ''
      wordCount += text.split(/\s+/).filter(word => word.length > 0).length
    })

    // Average reading speed: 200 words per minute for children
    // Add minimum time of 2 seconds, maximum of 10 seconds
    const baseTime = Math.max(2000, Math.min(10000, (wordCount / 200) * 60 * 1000))
    return baseTime / readingSpeed
  }

  function toggleOrientation() {
    orientation = orientation === 'landscape' ? 'portrait' : 'landscape'
  }

  function restartStory() {
    currentPageIndex = 0
    if (isPlaying && autoRead) {
      playPageAudio()
    }
  }

  function navigateHome() {
    window.location.hash = '#/'
  }

  function handleRetry() {
    retryCount = 0
    publicStoryError = null
    storiesService.clearError()
    loadStoryWithRetry()
  }

  // Function to render text with word highlighting for narration
  function renderTextWithHighlighting(text: string, narrationData: any, elementId: string) {
    if (!text || !narrationData) return text
    
    // If this element is not the active narration element, just return the text
    if (activeNarrationElementId !== elementId) return text
    
    // Split text into words, preserving spaces and punctuation
    const words = []
    let currentWord = ''
    let currentPunctuation = ''
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      
      if (/\s/.test(char)) {
        // If we have a word, push it
        if (currentWord) {
          words.push({
            type: 'word',
            text: currentWord + currentPunctuation
          })
          currentWord = ''
          currentPunctuation = ''
        }
        
        // Push the whitespace
        words.push({
          type: 'space',
          text: char
        })
      } else if (/[.,;:!?()[\]"'`~@#$%^&*+=<>{}|\\\/\-—–]/.test(char)) {
        // Punctuation - keep with the current word
        currentPunctuation += char
      } else {
        // Regular character - add to current word
        currentWord += char
      }
    }
    
    // Add the last word if there is one
    if (currentWord) {
      words.push({
        type: 'word',
        text: currentWord + currentPunctuation
      })
    }
    
    // Now create the highlighted text
    return words.map((item, index) => {
      if (item.type === 'space') {
        return `<span class="text-space">${item.text}</span>`
      } else {
        // For words, extract just the alphanumeric part for matching
        const wordText = item.text
        const alphaNumericWithApostrophe = wordText.replace(/[^a-zA-Z0-9']/g, '').toLowerCase()
        
        // Check if this word is currently highlighted
        const isHighlighted = currentWord && 
                             alphaNumericWithApostrophe === currentWord.toLowerCase().replace(/[^a-zA-Z0-9']/g, '')
        
        // Get highlight color from element properties or use default
        const highlightColor = narrationData.element?.properties?.narrationHighlightColor || '#F0B464'
        const useGlowEffect = narrationData.element?.properties?.narrationHighlightGlow !== false
        
        // Create highlight style
        const highlightStyle = isHighlighted 
          ? `background-color: ${highlightColor}; 
             color: #000; 
             ${useGlowEffect ? `text-shadow: 0 0 5px ${highlightColor}80;` : ''}
             display: inline;
             padding: 0;
             margin: 0;
             border-radius: 2px;`
          : ''
        
        return `<span 
                  class="${isHighlighted ? 'word-highlight' : 'interactive-word'}" 
                  style="${highlightStyle}"
                  data-word="${alphaNumericWithApostrophe}"
                >${wordText}</span>`
      }
    }).join('')
  }

  onMount(() => {
    loadStoryWithRetry()
  })

  onDestroy(() => {
    // Clean up any audio or narration players
    stopAudio()
  })
</script>

<div class="min-h-screen bg-gradient-to-br from-soft-buttercream via-soft-buttercream to-periwinkle-blue/10 flex flex-col">
  <!-- Header -->
  {#if !isPreviewMode}
    <header class="bg-soft-buttercream/90 backdrop-blur-sm border-b border-periwinkle-blue/20 p-4 shadow-sm">
      <div class="container flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="sm" on:click={navigateHome}>
            <Home class="w-4 h-4 mr-2" />
            Home
          </Button>
          
          {#if story}
            <div>
              <h1 class="text-xl font-bold text-coral-sunset">{story.title}</h1>
              {#if story.description}
                <p class="text-sm text-dusty-teal">{story.description}</p>
              {/if}
              {#if isPublicStory}
                <p class="text-xs text-periwinkle-blue">Shared Story</p>
              {/if}
            </div>
          {/if}
        </div>

        <div class="flex items-center gap-3">
          <!-- Orientation Toggle -->
          <Button variant="outline" size="sm" on:click={toggleOrientation} class="accent-element">
            {orientation === 'landscape' ? '16:9' : '9:16'}
          </Button>

          <!-- Settings -->
          <Button 
            variant="outline" 
            size="sm" 
            on:click={() => showSettings = !showSettings}
            class={showSettings ? 'bg-periwinkle-blue/10 border-periwinkle-blue' : 'accent-element'}
          >
            <Settings class="w-4 h-4" />
          </Button>

          <!-- Sign in prompt for public viewers -->
          {#if isPublicStory && !$authStore.user}
            <Button variant="secondary" size="sm" on:click={() => window.location.hash = '#/auth'}>
              Sign In
            </Button>
          {/if}
        </div>
      </div>
    </header>
  {/if}

  <!-- Settings Panel -->
  {#if showSettings}
    <div class="bg-soft-buttercream border-b border-periwinkle-blue/20 p-4 shadow-inner">
      <div class="container">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label class="text-sm font-medium mb-2 block text-dusty-teal">Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              bind:value={volume}
              class="w-full"
            />
            <span class="text-xs text-periwinkle-blue">{Math.round(volume * 100)}%</span>
          </div>
          
          <div>
            <label class="text-sm font-medium mb-2 block text-dusty-teal">Reading Speed</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              bind:value={readingSpeed}
              class="w-full"
            />
            <span class="text-xs text-periwinkle-blue">{readingSpeed}x</span>
          </div>
          
          <div class="flex items-center gap-2">
            <input type="checkbox" bind:checked={autoRead} id="autoRead" class="w-5 h-5 rounded-md accent-golden-apricot" />
            <label for="autoRead" class="text-sm font-medium text-dusty-teal">Auto-read</label>
          </div>
          
          <div class="flex items-center gap-2">
            <input type="checkbox" bind:checked={showText} id="showText" class="w-5 h-5 rounded-md accent-golden-apricot" />
            <label for="showText" class="text-sm font-medium text-dusty-teal">Show text</label>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Main Content -->
  <main class="flex-1 flex flex-col">
    {#if loading}
      <!-- Loading State -->
      <div class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-coral-sunset mx-auto mb-4"></div>
          <p class="text-dusty-teal">Loading story...</p>
        </div>
      </div>
    {:else if error || publicStoryError}
      <!-- Story Not Available -->
      <div class="flex-1 flex items-center justify-center p-4">
        <Card class="w-full max-w-md p-8 text-center">
          <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 class="text-xl font-semibold mb-3 text-coral-sunset">Unable to Load Story</h2>
          <p class="text-dusty-teal mb-6">
            {error || publicStoryError}
          </p>
          
          {#if (error && error.includes('connect')) || (error && error.includes('fetch')) || (publicStoryError && publicStoryError.includes('fetch'))}
            <div class="text-sm text-muted-foreground mb-4 bg-periwinkle-blue/10 p-4 rounded-lg">
              <p class="font-medium mb-2">This might be due to:</p>
              <ul class="list-disc list-inside space-y-1">
                <li>Network connectivity issues</li>
                <li>Server temporarily unavailable</li>
                <li>Firewall or ad-blocker interference</li>
              </ul>
            </div>
          {/if}
          
          <div class="space-y-2">
            <Button on:click={handleRetry} class="w-full">
              <RotateCcw class="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" on:click={() => window.location.href = '/'} class="w-full">
              <Home class="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
          
          {#if retryCount > 0}
            <p class="text-sm text-muted-foreground mt-2">
              Retry attempt: {retryCount}/{maxRetries}
            </p>
          {/if}
        </Card>
      </div>
    {:else if !story || pages.length === 0}
      <!-- Story Not Found -->
      <div class="flex-1 flex items-center justify-center p-4">
        <Card class="w-full max-w-md p-8 text-center">
          <h2 class="text-xl font-semibold mb-3 text-coral-sunset">Story Not Found</h2>
          <p class="text-dusty-teal mb-6">
            The story you're looking for doesn't exist or is not available.
          </p>
          <Button on:click={navigateHome}>
            <Home class="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </Card>
      </div>
    {:else if !isPlaying && !isPreviewMode}
      <!-- Story Cover / Start Screen -->
      <div class="flex-1 flex items-center justify-center p-4">
        <Card class="w-full max-w-2xl p-8 text-center">
          <!-- Cover Image -->
          {#if story?.cover_image}
            <div class="w-56 h-56 mx-auto mb-6 rounded-2xl overflow-hidden shadow-xl">
              <img 
                src={story.cover_image} 
                alt={story.title}
                class="w-full h-full object-cover"
              />
            </div>
          {:else}
            <div class="w-56 h-56 mx-auto mb-6 bg-gradient-to-br from-coral-sunset/20 to-dusty-teal/20 rounded-2xl flex items-center justify-center shadow-xl">
              <span class="text-5xl">📚</span>
            </div>
          {/if}

          <!-- Story Info -->
          <h1 class="text-3xl font-bold mb-3 text-coral-sunset">{story?.title || 'Story'}</h1>
          {#if story?.description}
            <p class="text-dusty-teal mb-3">{story.description}</p>
          {/if}
          {#if story?.age_range}
            <p class="text-sm text-periwinkle-blue mb-6">Ages {story.age_range}</p>
          {/if}
          
          <p class="text-dusty-teal mb-8">{pages.length} pages</p>

          <!-- Public story notice -->
          {#if isPublicStory}
            <div class="bg-periwinkle-blue/10 border border-periwinkle-blue/20 rounded-xl p-4 mb-6">
              <p class="text-sm text-periwinkle-blue">
                📖 This is a shared story. 
                {#if !$authStore.user}
                  <a href="#/auth" class="underline hover:no-underline">Sign in</a> to create your own stories!
                {/if}
              </p>
            </div>
          {/if}

          <!-- Play Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" on:click={startReading} class="text-lg px-8 py-6">
              <Play class="w-5 h-5 mr-2" />
              Play Story
            </Button>
            
            <Button 
              variant="secondary" 
              size="lg" 
              on:click={() => { autoRead = true; startReading(); }}
              class="text-lg px-8 py-6"
            >
              <Volume2 class="w-5 h-5 mr-2" />
              Read to Me
            </Button>
          </div>
        </Card>
      </div>
    {:else if currentPage}
      <!-- Story Player -->
      <div class="flex-1 flex flex-col">
        <!-- Story Canvas -->
        <div class="flex-1 flex items-center justify-center p-4">
          <div class="relative max-w-full max-h-full">
            <!-- Canvas Container -->
            <div 
              class="relative bg-white rounded-2xl shadow-xl overflow-hidden"
              style="
                width: {Math.min(canvasWidth * 0.8, window.innerWidth - 100)}px;
                height: {Math.min(canvasHeight * 0.8, window.innerHeight - 200)}px;
                aspect-ratio: {orientation === 'landscape' ? '16/9' : '9/16'};
              "
            >
              <!-- Page Background -->
              {#if currentPage?.content?.background}
                <div 
                  class="absolute inset-0 bg-cover bg-center"
                  style="background-image: url({currentPage.content.background})"
                ></div>
              {/if}

              <!-- Page Elements -->
              {#each sortedElements as element (element.id)}
                <div
                  class="absolute"
                  style="
                    left: {(element.x / canvasWidth) * 100}%;
                    top: {(element.y / canvasHeight) * 100}%;
                    width: {(element.width / canvasWidth) * 100}%;
                    height: {(element.height / canvasHeight) * 100}%;
                    z-index: {element.zIndex || 0};
                  "
                >
                  {#if element.type === 'text' && showText}
                    <div
                      class="w-full h-full text-player"
                      style="
                        font-size: {(element.properties?.fontSize || 16) * 0.8}px;
                        color: {element.properties?.color || '#000000'};
                        background-color: {element.properties?.backgroundColor && element.properties?.backgroundAlpha 
                          ? `rgba(${parseInt(element.properties.backgroundColor.slice(1, 3), 16)}, ${parseInt(element.properties.backgroundColor.slice(3, 5), 16)}, ${parseInt(element.properties.backgroundColor.slice(5, 7), 16)}, ${(element.properties.backgroundAlpha || 0) / 100})`
                          : 'transparent'};
                        padding: 8px;
                        border-radius: 8px;
                        line-height: {element.properties?.lineHeight || 1.3};
                        overflow-wrap: break-word;
                        word-break: normal;
                        white-space: pre-wrap;
                      "
                    >
                      {#if element.properties?.narrationData && activeNarrationElementId === element.id}
                        {@html renderTextWithHighlighting(element.properties.text, { element }, element.id)}
                      {:else}
                        {element.properties?.text || ''}
                      {/if}
                    </div>
                  {:else if element.type === 'image'}
                    <img 
                      src={element.properties?.src} 
                      alt={element.properties?.alt || ''}
                      class="w-full h-full object-cover rounded-lg"
                      style="opacity: {(element.properties?.opacity ?? 100) / 100};"
                    />
                  {/if}
                </div>
              {/each}

              <!-- Page Number -->
              <div class="absolute bottom-4 right-4 bg-periwinkle-blue/70 text-white px-3 py-1 rounded-full text-sm">
                {currentPageIndex + 1} / {pages.length}
              </div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="bg-soft-buttercream/90 backdrop-blur-sm border-t border-periwinkle-blue/20 p-4 shadow-lg">
          <div class="container">
            <div class="flex items-center justify-between">
              <!-- Previous Button -->
              <Button 
                variant="outline" 
                on:click={previousPage}
                disabled={!canGoPrevious}
                class="accent-element"
              >
                <ArrowLeft class="w-4 h-4 mr-2" />
                Previous
              </Button>

              <!-- Center Controls -->
              <div class="flex items-center gap-3">
                <Button variant="outline" size="sm" on:click={restartStory} class="accent-element">
                  <RotateCcw class="w-4 h-4" />
                </Button>
                
                {#if isAutoReading}
                  <Button variant="outline" on:click={() => isAutoReading = false} class="accent-element">
                    <Pause class="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                {:else}
                  <Button variant="secondary" on:click={() => { isAutoReading = true; playPageAudio(); }}>
                    <Play class="w-4 h-4 mr-2" />
                    Continue
                  </Button>
                {/if}
                
                <Button variant="destructive" on:click={stopReading}>
                  Stop
                </Button>
              </div>

              <!-- Next Button -->
              <Button 
                variant="outline" 
                on:click={nextPage}
                disabled={!canGoNext}
                class="accent-element"
              >
                Next
                <ArrowRight class="w-4 h-4 ml-2" />
              </Button>
            </div>

            <!-- Page Navigation -->
            {#if pages.length > 1}
              <div class="flex justify-center mt-6">
                <div class="flex gap-2 max-w-full overflow-x-auto">
                  {#each pages as page, index}
                    <button
                      class="w-5 h-5 rounded-full transition-colors {index === currentPageIndex ? 'bg-coral-sunset' : 'bg-periwinkle-blue/30 hover:bg-periwinkle-blue/50'}"
                      on:click={() => goToPage(index)}
                      title="Go to page {index + 1}"
                    ></button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </main>
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
  
  /* Text player styles */
  .text-player {
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  .word-highlight {
    display: inline;
    font-weight: bold;
    transform: scale(1.05);
    border-radius: 2px;
    padding: 0;
    margin: 0;
    transition: all 0.2s ease-in-out;
  }
  
  .interactive-word {
    display: inline;
    cursor: pointer;
    border-radius: 2px;
    padding: 0;
    margin: 0;
    transition: all 0.15s ease-in-out;
  }
  
  .interactive-word:hover {
    background-color: hsl(var(--golden-apricot) / 0.2);
  }
  
  .interactive-word:active {
    opacity: 0.8;
  }
  
  .text-space {
    display: inline;
    white-space: pre-wrap;
    margin: 0;
    padding: 0;
  }
</style>