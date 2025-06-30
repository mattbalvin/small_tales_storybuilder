<script lang="ts">
  import { onMount } from 'svelte'
  import { storiesStore, storiesService } from '$lib/stores/stories'
  import { authStore } from '$lib/stores/auth'
  import Button from '$lib/components/ui/button.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { Play, Volume2, ArrowLeft, ArrowRight, Home, Settings, Pause, RotateCcw } from 'lucide-svelte'

  export let storyId: string

  $: story = $storiesStore.currentStory
  $: pages = $storiesStore.currentPages
  $: loading = $storiesStore.currentStoryLoading

  let currentPageIndex = 0
  let isPlaying = false
  let isAutoReading = false
  let orientation: 'landscape' | 'portrait' = 'landscape'
  let showSettings = false
  let audioElement: HTMLAudioElement | null = null
  let currentAudio: string | null = null
  let publicStoryError: string | null = null
  let isPublicStory = false

  // Story settings
  let volume = 0.7
  let autoRead = true
  let showText = true
  let readingSpeed = 1.0

  $: currentPage = pages[currentPageIndex]
  $: canGoNext = currentPageIndex < pages.length - 1
  $: canGoPrevious = currentPageIndex > 0

  onMount(async () => {
    if (storyId) {
      try {
        // First try to load story pages directly (public access)
        await loadPublicStory(storyId)
        
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

  async function loadPublicStory(storyId: string) {
    try {
      console.log('Loading public story pages for:', storyId)
      
      // Load story pages directly without authentication
      await storiesService.loadStoryPages(storyId)
      
      if (pages.length === 0) {
        throw new Error('Story not found or has no pages')
      }
      
      // Try to get basic story info if possible
      if (!story) {
        // Create a minimal story object for public viewing
        storiesService.setCurrentStory({
          id: storyId,
          title: 'Shared Story',
          description: '',
          cover_image: null,
          age_range: '3-8 years',
          orientation: 'landscape',
          status: 'published',
          settings: {
            volume: 0.7,
            autoRead: true,
            showText: true,
            readingSpeed: 1.0
          },
          author_id: '',
          created_at: '',
          updated_at: ''
        })
        isPublicStory = true
      }
      
      console.log('Successfully loaded public story with', pages.length, 'pages')
    } catch (error) {
      console.error('Failed to load public story:', error)
      throw error
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
    if (!currentPage?.content?.audioElements) return

    // Find narration audio for this page
    const narrationAudio = currentPage.content.audioElements.find(audio => 
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

  // Get display elements for current orientation
  $: displayElements = currentPage?.content?.elements?.map(element => {
    const layouts = element.layouts || {
      landscape: { x: 50, y: 50, width: 200, height: 100, zIndex: 0, hidden: false },
      portrait: { x: 30, y: 80, width: 250, height: 120, zIndex: 0, hidden: false }
    }
    
    const layoutData = layouts[orientation] || {}
    
    return {
      ...element,
      x: layoutData.x ?? 50,
      y: layoutData.y ?? 50,
      width: layoutData.width ?? 200,
      height: layoutData.height ?? 100,
      zIndex: layoutData.zIndex ?? 0,
      hidden: layoutData.hidden ?? false
    }
  }).filter(el => !el.hidden).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)) || []

  // Canvas dimensions
  $: canvasWidth = orientation === 'landscape' ? 1600 : 900
  $: canvasHeight = orientation === 'landscape' ? 900 : 1600
</script>

<div class="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col">
  <!-- Header -->
  <header class="bg-background/80 backdrop-blur-sm border-b p-4">
    <div class="container flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="sm" on:click={navigateHome}>
          <Home class="w-4 h-4 mr-2" />
          Home
        </Button>
        
        {#if story}
          <div>
            <h1 class="text-lg font-semibold">{story.title}</h1>
            {#if story.description}
              <p class="text-sm text-muted-foreground">{story.description}</p>
            {/if}
            {#if isPublicStory}
              <p class="text-xs text-muted-foreground">Shared Story</p>
            {/if}
          </div>
        {/if}
      </div>

      <div class="flex items-center gap-2">
        <!-- Orientation Toggle -->
        <Button variant="outline" size="sm" on:click={toggleOrientation}>
          {orientation === 'landscape' ? '16:9' : '9:16'}
        </Button>

        <!-- Settings -->
        <Button 
          variant="outline" 
          size="sm" 
          on:click={() => showSettings = !showSettings}
          class={showSettings ? 'bg-primary/10' : ''}
        >
          <Settings class="w-4 h-4" />
        </Button>

        <!-- Sign in prompt for public viewers -->
        {#if isPublicStory && !$authStore.user}
          <Button variant="outline" size="sm" on:click={() => window.location.hash = '#/auth'}>
            Sign In
          </Button>
        {/if}
      </div>
    </div>
  </header>

  <!-- Settings Panel -->
  {#if showSettings}
    <div class="bg-background border-b p-4">
      <div class="container">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label class="text-sm font-medium mb-2 block">Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              bind:value={volume}
              class="w-full"
            />
            <span class="text-xs text-muted-foreground">{Math.round(volume * 100)}%</span>
          </div>
          
          <div>
            <label class="text-sm font-medium mb-2 block">Reading Speed</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              bind:value={readingSpeed}
              class="w-full"
            />
            <span class="text-xs text-muted-foreground">{readingSpeed}x</span>
          </div>
          
          <div class="flex items-center gap-2">
            <input type="checkbox" bind:checked={autoRead} id="autoRead" />
            <label for="autoRead" class="text-sm font-medium">Auto-read</label>
          </div>
          
          <div class="flex items-center gap-2">
            <input type="checkbox" bind:checked={showText} id="showText" />
            <label for="showText" class="text-sm font-medium">Show text</label>
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
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p class="text-muted-foreground">Loading story...</p>
        </div>
      </div>
    {:else if publicStoryError}
      <!-- Story Not Available -->
      <div class="flex-1 flex items-center justify-center p-4">
        <Card class="w-full max-w-md p-8 text-center">
          <h2 class="text-xl font-semibold mb-2">Story Not Available</h2>
          <p class="text-muted-foreground mb-6">
            {publicStoryError}
          </p>
          <div class="space-y-3">
            <Button on:click={navigateHome}>
              <Home class="w-4 h-4 mr-2" />
              Go Home
            </Button>
            {#if !$authStore.user}
              <Button variant="outline" on:click={() => window.location.hash = '#/auth'}>
                Sign In
              </Button>
            {/if}
          </div>
        </Card>
      </div>
    {:else if !story && pages.length === 0}
      <!-- Story Not Found -->
      <div class="flex-1 flex items-center justify-center p-4">
        <Card class="w-full max-w-md p-8 text-center">
          <h2 class="text-xl font-semibold mb-2">Story Not Found</h2>
          <p class="text-muted-foreground mb-6">
            The story you're looking for doesn't exist or is not available.
          </p>
          <Button on:click={navigateHome}>
            <Home class="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </Card>
      </div>
    {:else if !isPlaying}
      <!-- Story Cover / Start Screen -->
      <div class="flex-1 flex items-center justify-center p-4">
        <Card class="w-full max-w-2xl p-8 text-center">
          <!-- Cover Image -->
          {#if story?.cover_image}
            <div class="w-48 h-48 mx-auto mb-6 rounded-lg overflow-hidden shadow-lg">
              <img 
                src={story.cover_image} 
                alt={story.title}
                class="w-full h-full object-cover"
              />
            </div>
          {:else}
            <div class="w-48 h-48 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
              <span class="text-4xl">📚</span>
            </div>
          {/if}

          <!-- Story Info -->
          <h1 class="text-3xl font-bold mb-2">{story?.title || 'Story'}</h1>
          {#if story?.description}
            <p class="text-muted-foreground mb-2">{story.description}</p>
          {/if}
          {#if story?.age_range}
            <p class="text-sm text-muted-foreground mb-6">Ages {story.age_range}</p>
          {/if}
          
          <p class="text-muted-foreground mb-8">{pages.length} pages</p>

          <!-- Public story notice -->
          {#if isPublicStory}
            <div class="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
              <p class="text-sm text-primary">
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
              variant="outline" 
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
    {:else}
      <!-- Story Player -->
      <div class="flex-1 flex flex-col">
        <!-- Story Canvas -->
        <div class="flex-1 flex items-center justify-center p-4">
          <div class="relative max-w-full max-h-full">
            <!-- Canvas Container -->
            <div 
              class="relative bg-white rounded-lg shadow-lg overflow-hidden"
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
              {#each displayElements as element (element.id)}
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
                      class="w-full h-full flex items-center justify-center text-center"
                      style="
                        font-size: {(element.properties?.fontSize || 16) * 0.8}px;
                        color: {element.properties?.color || '#000000'};
                        background-color: {element.properties?.backgroundColor && element.properties?.backgroundAlpha 
                          ? `rgba(${parseInt(element.properties.backgroundColor.slice(1, 3), 16)}, ${parseInt(element.properties.backgroundColor.slice(3, 5), 16)}, ${parseInt(element.properties.backgroundColor.slice(5, 7), 16)}, ${(element.properties.backgroundAlpha || 0) / 100})`
                          : 'transparent'};
                        padding: 8px;
                        border-radius: 4px;
                        line-height: 1.4;
                      "
                    >
                      {element.properties?.text || ''}
                    </div>
                  {:else if element.type === 'image'}
                    <img 
                      src={element.properties?.src} 
                      alt={element.properties?.alt || ''}
                      class="w-full h-full object-cover rounded"
                      style="opacity: {(element.properties?.opacity ?? 100) / 100};"
                    />
                  {/if}
                </div>
              {/each}

              <!-- Page Number -->
              <div class="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                {currentPageIndex + 1} / {pages.length}
              </div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="bg-background/80 backdrop-blur-sm border-t p-4">
          <div class="container">
            <div class="flex items-center justify-between">
              <!-- Previous Button -->
              <Button 
                variant="outline" 
                on:click={previousPage}
                disabled={!canGoPrevious}
              >
                <ArrowLeft class="w-4 h-4 mr-2" />
                Previous
              </Button>

              <!-- Center Controls -->
              <div class="flex items-center gap-2">
                <Button variant="outline" size="sm" on:click={restartStory}>
                  <RotateCcw class="w-4 h-4" />
                </Button>
                
                {#if isAutoReading}
                  <Button variant="outline" on:click={() => isAutoReading = false}>
                    <Pause class="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                {:else}
                  <Button on:click={() => { isAutoReading = true; playPageAudio(); }}>
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
              >
                Next
                <ArrowRight class="w-4 h-4 ml-2" />
              </Button>
            </div>

            <!-- Page Navigation -->
            {#if pages.length > 1}
              <div class="flex justify-center mt-4">
                <div class="flex gap-1 max-w-full overflow-x-auto">
                  {#each pages as page, index}
                    <button
                      class="w-5 h-5 rounded-full transition-colors {index === currentPageIndex ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground/20'}"
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
    height: 4px;
    background: hsl(var(--muted));
    border-radius: 2px;
    outline: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: hsl(var(--primary));
    border-radius: 50%;
    cursor: pointer;
  }

  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: hsl(var(--primary));
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
</style>