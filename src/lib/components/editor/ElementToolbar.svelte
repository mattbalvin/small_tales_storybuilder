<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import MediaSelector from './MediaSelector.svelte'
  import AudioGenerationModal from './AudioGenerationModal.svelte'
  import NarrationGenerationModal from './NarrationGenerationModal.svelte'
  import { NarrationPlayer } from '$lib/services/narrationGeneration'
  import { 
    Type, 
    Image, 
    Volume2, 
    Plus, 
    Trash2, 
    Eye, 
    EyeOff, 
    GripVertical,
    Palette,
    Settings,
    Wand2,
    Play,
    Pause
  } from 'lucide-svelte'

  const dispatch = createEventDispatcher()

  export let selectedElementId: string | null
  export let selectedElement: any
  export let elements: any[]
  export let audioElements: any[]
  export let triggers: string[]
  export let orientation: 'landscape' | 'portrait'

  let showMediaSelector = false
  let mediaSelectorType: 'image' | 'audio' | 'video' | 'all' = 'all'
  let showAudioGeneration = false
  let audioGenerationText = ''
  let showNarrationGeneration = false
  let narrationGenerationText = ''

  // Track selected audio element
  let selectedAudioElementId: string | null = null
  $: selectedAudioElement = selectedAudioElementId ? audioElements.find(el => el.id === selectedAudioElementId) : null

  // Narration playback state
  let activeNarrationPlayer: NarrationPlayer | null = null
  let playingNarrationElementId: string | null = null
  let currentWord: string | null = null

  // Reactive statements for element properties
  $: textProperties = selectedElement?.type === 'text' ? selectedElement.properties : null
  $: imageProperties = selectedElement?.type === 'image' ? selectedElement.properties : null

  // Clean up narration player when component is destroyed
  onDestroy(() => {
    if (activeNarrationPlayer) {
      activeNarrationPlayer.destroy()
      activeNarrationPlayer = null
      playingNarrationElementId = null
    }
  })

  // Clean up narration player when selected element changes
  $: if (selectedElementId && activeNarrationPlayer && playingNarrationElementId && selectedElementId !== playingNarrationElementId) {
    activeNarrationPlayer.destroy()
    activeNarrationPlayer = null
    playingNarrationElementId = null
    currentWord = null
  }

  function addElement(type: 'text' | 'image' | 'audio') {
    dispatch('add', { type })
  }

  function updateElementProperty(property: string, value: any) {
    if (!selectedElement) return
    
    dispatch('update', {
      properties: {
        ...selectedElement.properties,
        [property]: value
      }
    })
  }

  function updateElementLayout(property: string, value: any) {
    if (!selectedElement) return
    
    dispatch('update', {
      [property]: value
    })
  }

  function deleteSelectedElement() {
    if (selectedElementId) {
      dispatch('delete')
    }
  }

  function toggleElementVisibility(elementId: string) {
    dispatch('toggle-visibility', { elementId })
  }

  function deleteElement(elementId: string) {
    dispatch('delete-element', { elementId })
  }

  function selectElement(elementId: string) {
    selectedElementId = elementId
    selectedAudioElementId = null // Clear audio selection
    dispatch('select', { elementId })
  }

  function selectAudioElement(audioElementId: string) {
    selectedAudioElementId = audioElementId
    selectedElementId = null // Clear visual element selection
  }

  function openMediaSelector(type: 'image' | 'audio' | 'video' | 'all') {
    mediaSelectorType = type
    showMediaSelector = true
  }

  function handleMediaSelect(event: CustomEvent) {
    const { url, filename, type, alt } = event.detail
    
    if (selectedElement?.type === 'image') {
      updateElementProperty('src', url)
      if (alt) updateElementProperty('alt', alt)
    } else if (selectedElement?.type === 'audio') {
      updateElementProperty('src', url)
    } else if (selectedAudioElement) {
      updateAudioElement(selectedAudioElement.id, 'src', url)
    }
    
    showMediaSelector = false
  }

  function openAudioGeneration() {
    // Extract text from all text elements on the page for context
    const textElements = elements.filter(el => el.type === 'text')
    audioGenerationText = textElements
      .map(el => el.properties?.text || '')
      .filter(text => text.trim().length > 0)
      .join(' ')
    
    showAudioGeneration = true
  }

  function handleAudioGenerated(event: CustomEvent) {
    const { url, filename } = event.detail
    
    if (selectedElement?.type === 'audio') {
      updateElementProperty('src', url)
    } else if (selectedAudioElement) {
      updateAudioElement(selectedAudioElement.id, 'src', url)
    }
    
    showAudioGeneration = false
  }

  function openNarrationGeneration() {
    if (selectedElement?.type === 'text') {
      narrationGenerationText = selectedElement.properties?.text || ''
      showNarrationGeneration = true
    }
  }

  function handleNarrationGenerated(event: CustomEvent) {
    const { narration, filename } = event.detail
    
    if (selectedElement?.type === 'text') {
      // Store the narration reference in the text element
      updateElementProperty('narrationId', narration.id)
      updateElementProperty('narrationData', narration)
    }
    
    showNarrationGeneration = false
  }

  // Audio element management
  function updateAudioElement(audioId: string, property: string, value: any) {
    dispatch('audio-update', {
      id: audioId,
      updates: { [property]: value }
    })
  }

  function deleteAudioElement(audioId: string) {
    if (selectedAudioElementId === audioId) {
      selectedAudioElementId = null
    }
    dispatch('audio-delete', { id: audioId })
  }

  // Drag and drop for element reordering
  let draggedElementIndex: number | null = null

  function handleDragStart(event: DragEvent, index: number) {
    draggedElementIndex = index
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
    }
  }

  function handleDragOver(event: DragEvent) {
    // Always call preventDefault to allow the drop
    event.preventDefault()
    
    // Set dropEffect to 'move' to show the correct cursor
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
  }

  function handleDrop(event: DragEvent, targetIndex: number) {
    event.preventDefault()
    
    if (draggedElementIndex !== null && draggedElementIndex !== targetIndex) {
      dispatch('reorder', {
        fromIndex: draggedElementIndex,
        toIndex: targetIndex
      })
    }
    
    draggedElementIndex = null
  }

  // Sort elements by z-index for display
  $: sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))

  // Helper function to get display text for elements
  function getElementDisplayText(element: any): string {
    if (element.type === 'text') {
      const text = element.properties?.text || 'Text Element'
      // Truncate long text to prevent overflow
      const displayText = text.length > 20 ? text.substring(0, 20) + '...' : text
      // Add indicator if narration is available
      return element.properties?.narrationData ? `${displayText} 🔊` : displayText
    } else if (element.type === 'image') {
      return 'Image'
    }
    return 'Element'
  }

  // Toggle narration playback for a text element
  function toggleNarrationPlayback(element: any) {
    if (!element || element.type !== 'text' || !element.properties?.narrationData) return

    // If we're already playing this element's narration, stop it
    if (playingNarrationElementId === element.id && activeNarrationPlayer) {
      activeNarrationPlayer.destroy()
      activeNarrationPlayer = null
      playingNarrationElementId = null
      currentWord = null
      return
    }

    // Stop any currently playing narration
    if (activeNarrationPlayer) {
      activeNarrationPlayer.destroy()
      activeNarrationPlayer = null
      playingNarrationElementId = null
      currentWord = null
    }

    // Create a new narration player
    try {
      const narrationData = element.properties.narrationData
      activeNarrationPlayer = new NarrationPlayer(narrationData)
      
      // Set up event handlers
      activeNarrationPlayer.onWordHighlight = (word, index) => {
        if (word && typeof word === 'object' && word.word) {
          currentWord = word.word
        } else if (typeof word === 'string') {
          currentWord = word
        } else {
          console.warn('Invalid word data received:', word)
          currentWord = null
        }
      }
      
      activeNarrationPlayer.onPlaybackEnd = () => {
        playingNarrationElementId = null
        activeNarrationPlayer = null
        currentWord = null
      }
      
      // Start playback
      activeNarrationPlayer.playFull()
      playingNarrationElementId = element.id
    } catch (error) {
      console.error('Failed to play narration:', error)
      activeNarrationPlayer = null
      playingNarrationElementId = null
      currentWord = null
    }
  }
</script>

<div class="w-full h-full flex flex-col bg-soft-buttercream border-l border-periwinkle-blue/20">
  <!-- Header -->
  <div class="p-4 border-b border-periwinkle-blue/20">
    <h2 class="text-lg font-semibold text-coral-sunset">Elements</h2>
    <p class="text-sm text-dusty-teal">Add and manage page elements</p>
  </div>

  <!-- Add Elements -->
  <div class="p-4 border-b border-periwinkle-blue/20">
    <div class="grid grid-cols-3 gap-3">
      <Button variant="secondary" size="sm" on:click={() => addElement('text')} class="flex flex-col gap-1 h-auto py-3">
        <Type class="w-5 h-5" />
        <span class="text-xs">Text</span>
      </Button>
      <Button variant="secondary" size="sm" on:click={() => addElement('image')} class="flex flex-col gap-1 h-auto py-3">
        <Image class="w-5 h-5" />
        <span class="text-xs">Image</span>
      </Button>
      <Button variant="secondary" size="sm" on:click={() => addElement('audio')} class="flex flex-col gap-1 h-auto py-3">
        <Volume2 class="w-5 h-5" />
        <span class="text-xs">Audio</span>
      </Button>
    </div>
  </div>

  <!-- Element Lists and Properties -->
  <div class="flex-1 overflow-y-auto">
    <!-- Visual Elements List -->
    <div class="p-4 border-b border-periwinkle-blue/20">
      <h3 class="text-sm font-medium mb-3 text-dusty-teal">Visual Elements ({orientation})</h3>
      
      {#if sortedElements.length === 0}
        <p class="text-sm text-periwinkle-blue text-center py-4">
          No visual elements on this page
        </p>
      {:else}
        <div class="space-y-2">
          {#each sortedElements as element, index (element.id)}
            <div
              class="flex items-center gap-2 p-3 rounded-lg border {selectedElementId === element.id ? 'bg-golden-apricot/10 border-golden-apricot' : 'bg-periwinkle-blue/5 border-periwinkle-blue/20'}"
              draggable="true"
              on:dragstart={(e) => handleDragStart(e, index)}
              on:dragover={handleDragOver}
              on:drop={(e) => handleDrop(e, index)}
            >
              <GripVertical class="w-5 h-5 text-dusty-teal cursor-grab flex-shrink-0" />
              
              <button
                class="flex-1 flex items-center gap-2 text-left min-w-0"
                on:click={() => selectElement(element.id)}
              >
                {#if element.type === 'text'}
                  <Type class="w-4 h-4 flex-shrink-0 text-coral-sunset" />
                {:else if element.type === 'image'}
                  <Image class="w-4 h-4 flex-shrink-0 text-coral-sunset" />
                {/if}
                <span class="text-sm truncate min-w-0 {selectedElementId === element.id ? 'text-golden-apricot font-medium' : 'text-dusty-teal'}">
                  {getElementDisplayText(element)}
                </span>
              </button>

              <div class="flex items-center gap-1 flex-shrink-0">
                <!-- Play narration button for text elements with narration -->
                {#if element.type === 'text' && element.properties?.narrationData}
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 w-8 p-0"
                    on:click={() => toggleNarrationPlayback(element)}
                    title={playingNarrationElementId === element.id ? 'Stop narration' : 'Play narration'}
                  >
                    {#if playingNarrationElementId === element.id}
                      <Pause class="w-4 h-4 text-golden-apricot" />
                    {:else}
                      <Play class="w-4 h-4 text-golden-apricot" />
                    {/if}
                  </Button>
                {/if}

                <Button
                  variant="ghost"
                  size="sm"
                  class="h-8 w-8 p-0"
                  on:click={() => toggleElementVisibility(element.id)}
                  title={element.hidden ? 'Show element' : 'Hide element'}
                >
                  {#if element.hidden}
                    <EyeOff class="w-4 h-4 text-periwinkle-blue" />
                  {:else}
                    <Eye class="w-4 h-4 text-periwinkle-blue" />
                  {/if}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  class="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  on:click={() => deleteElement(element.id)}
                  title="Delete element"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Audio Elements List -->
    <div class="p-4 border-b border-periwinkle-blue/20">
      <h3 class="text-sm font-medium mb-3 text-dusty-teal">Audio Elements</h3>
      
      {#if audioElements.length === 0}
        <p class="text-sm text-periwinkle-blue text-center py-4">
          No audio elements on this page
        </p>
      {:else}
        <div class="space-y-2">
          {#each audioElements as audioElement (audioElement.id)}
            <div class="flex items-center gap-2 p-3 rounded-lg border {selectedAudioElementId === audioElement.id ? 'bg-golden-apricot/10 border-golden-apricot' : 'bg-periwinkle-blue/5 border-periwinkle-blue/20'}">
              <button
                class="flex-1 flex items-center gap-2 text-left min-w-0"
                on:click={() => selectAudioElement(audioElement.id)}
              >
                <Volume2 class="w-4 h-4 flex-shrink-0 text-coral-sunset" />
                <span class="text-sm truncate min-w-0 {selectedAudioElementId === audioElement.id ? 'text-golden-apricot font-medium' : 'text-dusty-teal'}">
                  {audioElement.properties?.src ? 'Audio Element' : 'No audio source'}
                </span>
              </button>
              <Button
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-destructive hover:text-destructive flex-shrink-0"
                on:click={() => deleteAudioElement(audioElement.id)}
                title="Delete audio element"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Currently Playing Narration Info -->
    {#if playingNarrationElementId && currentWord}
      <div class="p-4 border-b border-periwinkle-blue/20 bg-golden-apricot/10">
        <h3 class="text-sm font-medium mb-2 text-golden-apricot">Currently Playing</h3>
        <div class="flex items-center justify-between">
          <div class="text-sm text-dusty-teal">
            Current word: <span class="font-medium text-coral-sunset">{currentWord}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            class="h-8 w-8 p-0"
            on:click={() => {
              if (activeNarrationPlayer) {
                activeNarrationPlayer.stop();
                activeNarrationPlayer = null;
                playingNarrationElementId = null;
                currentWord = null;
              }
            }}
          >
            <Pause class="w-4 h-4 text-golden-apricot" />
          </Button>
        </div>
      </div>
    {/if}

    <!-- Element Properties (shown when any element is selected) -->
    {#if selectedElement || selectedAudioElement}
      <div class="p-4 border-b border-periwinkle-blue/20">
        <h3 class="text-sm font-medium mb-3 text-coral-sunset">
          {selectedElement?.type === 'text' ? 'Text' : 
           selectedElement?.type === 'image' ? 'Image' : 
           selectedElement?.type === 'audio' ? 'Audio' :
           selectedAudioElement ? 'Audio Element' : ''} Properties
        </h3>

        <!-- Text Properties -->
        {#if textProperties}
          <div class="space-y-3">
            <!-- Text Content -->
            <div>
              <label class="text-xs font-medium mb-1 block text-dusty-teal">Text</label>
              <textarea
                class="w-full px-3 py-2 text-sm border border-golden-apricot/30 rounded-lg resize-none bg-white focus:border-golden-apricot focus:ring-1 focus:ring-golden-apricot"
                rows="3"
                value={textProperties.text || ''}
                on:input={(e) => e.target && updateElementProperty('text', e.target.value)}
                placeholder="Enter text..."
              ></textarea>
            </div>

            <!-- Narration Settings -->
            <div class="space-y-2 p-3 bg-periwinkle-blue/5 rounded-lg border border-periwinkle-blue/20">
              <h4 class="text-xs font-medium text-periwinkle-blue">Narration</h4>
              
              <!-- In Main Narration Checkbox -->
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="inMainNarration"
                  checked={textProperties.inMainNarration || false}
                  on:change={(e) => e.target && updateElementProperty('inMainNarration', e.target.checked)}
                  class="rounded accent-golden-apricot w-4 h-4"
                />
                <label for="inMainNarration" class="text-xs font-medium text-dusty-teal">In main narration</label>
              </div>

              <!-- Sequence Number -->
              {#if textProperties.inMainNarration}
                <div>
                  <label class="text-xs font-medium mb-1 block text-dusty-teal">Sequence</label>
                  <Input
                    type="number"
                    min="1"
                    value={textProperties.narrationSequence || 1}
                    on:input={(e) => e.target && updateElementProperty('narrationSequence', parseInt(e.target.value))}
                    class="text-xs h-8"
                    placeholder="1"
                  />
                </div>
              {/if}

              <!-- Narration Highlight Color -->
              <div>
                <label class="text-xs font-medium mb-1 block text-dusty-teal">Highlight Color</label>
                <div class="flex gap-2">
                  <Input
                    type="color"
                    value={textProperties.narrationHighlightColor || '#F0B464'}
                    on:input={(e) => e.target && updateElementProperty('narrationHighlightColor', e.target.value)}
                    class="w-12 h-8 p-1"
                  />
                  <Input
                    type="text"
                    value={textProperties.narrationHighlightColor || '#F0B464'}
                    on:input={(e) => e.target && updateElementProperty('narrationHighlightColor', e.target.value)}
                    class="flex-1 text-xs h-8"
                    placeholder="#F0B464"
                  />
                </div>
              </div>

              <!-- Highlight Glow Effect -->
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="narrationHighlightGlow"
                  checked={textProperties.narrationHighlightGlow !== false}
                  on:change={(e) => e.target && updateElementProperty('narrationHighlightGlow', e.target.checked)}
                  class="rounded accent-golden-apricot w-4 h-4"
                />
                <label for="narrationHighlightGlow" class="text-xs font-medium text-dusty-teal">Enable glow effect</label>
              </div>

              <!-- Generate Narration Button -->
              <div class="flex gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  on:click={openNarrationGeneration}
                  class="flex-1"
                  disabled={!textProperties.text?.trim()}
                >
                  <Wand2 class="w-3 h-3 mr-1" />
                  Generate Narration
                </Button>
                
                {#if textProperties.narrationData}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    on:click={() => updateElementProperty('narrationData', null)}
                    title="Remove narration"
                    class="text-destructive hover:text-destructive"
                  >
                    <Trash2 class="w-3 h-3" />
                  </Button>
                {/if}
              </div>

              <!-- Narration Status -->
              {#if textProperties.narrationData}
                <div class="text-xs text-periwinkle-blue">
                  ✓ Narration generated ({Math.round(textProperties.narrationData.fullAudio.duration / 1000)}s)
                </div>
                
                <!-- Play/Pause Narration Button -->
                <Button 
                  variant="outline" 
                  size="sm" 
                  on:click={() => toggleNarrationPlayback(selectedElement)}
                  class="w-full accent-element"
                >
                  {#if playingNarrationElementId === selectedElement.id}
                    <Pause class="w-3 h-3 mr-1" />
                    Stop Narration
                  {:else}
                    <Play class="w-3 h-3 mr-1" />
                    Play Narration
                  {/if}
                </Button>
                
                <!-- Current Word Display -->
                {#if playingNarrationElementId === selectedElement.id && currentWord}
                  <div class="text-xs bg-golden-apricot/10 p-2 rounded text-center">
                    <span class="text-dusty-teal">Current word:</span>
                    <span class="font-medium text-golden-apricot ml-1">{currentWord}</span>
                  </div>
                {/if}
              {/if}
            </div>

            <!-- Font Size -->
            <div>
              <label class="text-xs font-medium mb-1 block text-dusty-teal">Font Size</label>
              <Input
                type="number"
                min="8"
                max="72"
                value={textProperties.fontSize || 16}
                on:input={(e) => e.target && updateElementProperty('fontSize', parseInt(e.target.value))}
                class="text-xs h-8"
              />
            </div>

            <!-- Line Height -->
            <div>
              <label class="text-xs font-medium mb-1 block text-dusty-teal">Line Height</label>
              <Input
                type="number"
                min="0.5"
                max="3"
                step="0.1"
                value={textProperties.lineHeight || 1.3}
                on:input={(e) => e.target && updateElementProperty('lineHeight', parseFloat(e.target.value))}
                class="text-xs h-8"
              />
            </div>

            <!-- Text Color -->
            <div>
              <label class="text-xs font-medium mb-1 block text-dusty-teal">Text Color</label>
              <div class="flex gap-2">
                <Input
                  type="color"
                  value={textProperties.color || '#000000'}
                  on:input={(e) => e.target && updateElementProperty('color', e.target.value)}
                  class="w-12 h-8 p-1"
                />
                <Input
                  type="text"
                  value={textProperties.color || '#000000'}
                  on:input={(e) => e.target && updateElementProperty('color', e.target.value)}
                  class="flex-1 text-xs h-8"
                  placeholder="#000000"
                />
              </div>
            </div>

            <!-- Background Color -->
            <div>
              <label class="text-xs font-medium mb-1 block text-dusty-teal">Background</label>
              <div class="space-y-2">
                <div class="flex gap-2">
                  <Input
                    type="color"
                    value={textProperties.backgroundColor || '#ffffff'}
                    on:input={(e) => e.target && updateElementProperty('backgroundColor', e.target.value)}
                    class="w-12 h-8 p-1"
                  />
                  <Input
                    type="text"
                    value={textProperties.backgroundColor || '#ffffff'}
                    on:input={(e) => e.target && updateElementProperty('backgroundColor', e.target.value)}
                    class="flex-1 text-xs h-8"
                    placeholder="#ffffff"
                  />
                </div>
                <div>
                  <label class="text-xs text-muted-foreground mb-1 block">Opacity: {textProperties.backgroundAlpha || 0}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={textProperties.backgroundAlpha || 0}
                    on:input={(e) => e.target && updateElementProperty('backgroundAlpha', parseInt(e.target.value))}
                    class="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Image Properties -->
        {#if imageProperties}
          <div class="space-y-3">
            <!-- Select Image Button -->
            <div>
              <label class="text-xs font-medium mb-2 block text-dusty-teal">Image</label>
              <Button 
                variant="secondary" 
                size="sm" 
                on:click={() => openMediaSelector('image')}
                class="w-full justify-start"
              >
                <Image class="w-4 h-4 mr-2" />
                {imageProperties.src ? 'Change Image' : 'Select Image'}
              </Button>
              {#if imageProperties.src}
                <p class="text-xs text-periwinkle-blue mt-1 truncate">
                  Current: {imageProperties.src.split('/').pop() || 'Image selected'}
                </p>
              {/if}
            </div>

            <!-- Opacity -->
            <div>
              <label class="text-xs font-medium mb-1 block text-dusty-teal">Opacity: {imageProperties.opacity || 100}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={imageProperties.opacity || 100}
                on:input={(e) => e.target && updateElementProperty('opacity', parseInt(e.target.value))}
                class="w-full"
              />
            </div>

            <!-- Scale -->
            <div>
              <label class="text-xs font-medium mb-1 block text-dusty-teal">Scale: {imageProperties.scale || 100}%</label>
              <input
                type="range"
                min="10"
                max="200"
                value={imageProperties.scale || 100}
                on:input={(e) => e.target && updateElementProperty('scale', parseInt(e.target.value))}
                class="w-full"
              />
            </div>
          </div>
        {/if}

        <!-- Audio Properties (for visual audio elements) -->
        {#if selectedElement?.type === 'audio'}
          <div class="space-y-3">
            <!-- Audio Source -->
            <div>
              <label class="text-xs font-medium mb-1 block text-dusty-teal">Audio Source</label>
              <div class="flex gap-2">
                <Input
                  type="text"
                  value={selectedElement.properties?.src || ''}
                  on:input={(e) => e.target && updateElementProperty('src', e.target.value)}
                  class="flex-1 text-xs h-8"
                  placeholder="Audio URL or select from library"
                />
                <Button variant="secondary" size="sm" on:click={() => openMediaSelector('audio')}>
                  <Volume2 class="w-3 h-3" />
                </Button>
                <Button variant="secondary" size="sm" on:click={openAudioGeneration}>
                  <Wand2 class="w-3 h-3" />
                </Button>
              </div>
            </div>

            <!-- Volume -->
            <div>
              <label class="text-xs font-medium mb-1 block text-dusty-teal">Volume: {selectedElement.properties?.volume || 100}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedElement.properties?.volume || 100}
                on:input={(e) => e.target && updateElementProperty('volume', parseInt(e.target.value))}
                class="w-full"
              />
            </div>

            <!-- Autoplay -->
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedElement.properties?.autoplay || false}
                on:change={(e) => e.target && updateElementProperty('autoplay', e.target.checked)}
                class="rounded accent-golden-apricot w-4 h-4"
              />
              <label class="text-xs font-medium text-dusty-teal">Autoplay</label>
            </div>
          </div>
        {/if}

        <!-- Audio Element Properties (for page-level audio elements) -->
        {#if selectedAudioElement}
          <div class="space-y-3">
            <!-- Audio Source -->
            <div>
              <label class="text-xs font-medium mb-1 block text-dusty-teal">Audio Source</label>
              <div class="flex gap-2">
                <Input
                  type="text"
                  value={selectedAudioElement.properties?.src || ''}
                  on:input={(e) => e.target && updateAudioElement(selectedAudioElement.id, 'src', e.target.value)}
                  class="flex-1 text-xs h-8"
                  placeholder="Audio URL or select from library"
                />
                <Button variant="secondary" size="sm" on:click={() => openMediaSelector('audio')}>
                  <Volume2 class="w-3 h-3" />
                </Button>
                <Button variant="secondary" size="sm" on:click={openAudioGeneration}>
                  <Wand2 class="w-3 h-3" />
                </Button>
              </div>
            </div>

            <!-- Volume -->
            <div>
              <label class="text-xs font-medium mb-1 block text-dusty-teal">Volume: {selectedAudioElement.properties?.volume || 100}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedAudioElement.properties?.volume || 100}
                on:input={(e) => e.target && updateAudioElement(selectedAudioElement.id, 'volume', parseInt(e.target.value))}
                class="w-full"
              />
            </div>

            <!-- Audio Type -->
            <div>
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedAudioElement.properties?.isIdleLoop || false}
                  on:change={(e) => e.target && updateAudioElement(selectedAudioElement.id, 'isIdleLoop', e.target.checked)}
                  class="rounded accent-golden-apricot w-4 h-4"
                />
                <label class="text-xs font-medium text-dusty-teal">Idle Loop</label>
              </div>
            </div>

            <!-- Conditional properties based on audio type -->
            {#if selectedAudioElement.properties?.isIdleLoop}
              <!-- Action Volume for idle loops -->
              <div>
                <label class="text-xs font-medium mb-1 block text-dusty-teal">Action Volume: {selectedAudioElement.properties?.actionVolume || 50}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedAudioElement.properties?.actionVolume || 50}
                  on:input={(e) => e.target && updateAudioElement(selectedAudioElement.id, 'actionVolume', parseInt(e.target.value))}
                  class="w-full"
                />
              </div>
            {:else}
              <!-- Playback Mode for non-idle audio -->
              <div>
                <label class="text-xs font-medium mb-1 block text-dusty-teal">Playback Mode</label>
                <select
                  value={selectedAudioElement.properties?.playbackMode || 'random'}
                  on:change={(e) => e.target && updateAudioElement(selectedAudioElement.id, 'playbackMode', e.target.value)}
                  class="w-full text-sm h-9 border border-golden-apricot/30 rounded-lg px-3 bg-white"
                >
                  <option value="random">Random</option>
                  <option value="trigger">Trigger</option>
                </select>
              </div>

              {#if selectedAudioElement.properties?.playbackMode === 'random'}
                <!-- Random delay settings -->
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="text-xs font-medium mb-1 block text-dusty-teal">Min Delay (s)</label>
                    <Input
                      type="number"
                      min="0"
                      value={selectedAudioElement.properties?.minDelay || 1}
                      on:input={(e) => e.target && updateAudioElement(selectedAudioElement.id, 'minDelay', parseInt(e.target.value))}
                      class="text-xs h-8"
                    />
                  </div>
                  <div>
                    <label class="text-xs font-medium mb-1 block text-dusty-teal">Max Delay (s)</label>
                    <Input
                      type="number"
                      min="0"
                      value={selectedAudioElement.properties?.maxDelay || 5}
                      on:input={(e) => e.target && updateAudioElement(selectedAudioElement.id, 'maxDelay', parseInt(e.target.value))}
                      class="text-xs h-8"
                    />
                  </div>
                </div>
              {:else if selectedAudioElement.properties?.playbackMode === 'trigger'}
                <!-- Trigger name -->
                <div>
                  <label class="text-xs font-medium mb-1 block text-dusty-teal">Trigger Name</label>
                  <select
                    value={selectedAudioElement.properties?.triggerName || ''}
                    on:change={(e) => e.target && updateAudioElement(selectedAudioElement.id, 'triggerName', e.target.value)}
                    class="w-full text-sm h-9 border border-golden-apricot/30 rounded-lg px-3 bg-white"
                  >
                    <option value="">Select trigger...</option>
                    {#each triggers as trigger}
                      <option value={trigger}>{trigger}</option>
                    {/each}
                  </select>
                </div>
              {/if}
            {/if}
          </div>
        {/if}

        <!-- Position and Size (for visual elements only) -->
        {#if selectedElement && selectedElement.type !== 'audio'}
          <div class="mt-4 pt-4 border-t border-periwinkle-blue/20">
            <h4 class="text-xs font-medium mb-3 text-coral-sunset">Position & Size ({orientation})</h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-dusty-teal mb-1 block">X</label>
                <Input
                  type="number"
                  value={selectedElement.x || 0}
                  on:input={(e) => e.target && updateElementLayout('x', parseInt(e.target.value))}
                  class="text-xs h-8"
                />
              </div>
              <div>
                <label class="text-xs text-dusty-teal mb-1 block">Y</label>
                <Input
                  type="number"
                  value={selectedElement.y || 0}
                  on:input={(e) => e.target && updateElementLayout('y', parseInt(e.target.value))}
                  class="text-xs h-8"
                />
              </div>
              <div>
                <label class="text-xs text-dusty-teal mb-1 block">Width</label>
                <Input
                  type="number"
                  min="10"
                  value={selectedElement.width || 100}
                  on:input={(e) => e.target && updateElementLayout('width', parseInt(e.target.value))}
                  class="text-xs h-8"
                />
              </div>
              <div>
                <label class="text-xs text-dusty-teal mb-1 block">Height</label>
                <Input
                  type="number"
                  min="10"
                  value={selectedElement.height || 100}
                  on:input={(e) => e.target && updateElementLayout('height', parseInt(e.target.value))}
                  class="text-xs h-8"
                />
              </div>
            </div>
          </div>
        {/if}

        <!-- Actions -->
        <div class="mt-4 pt-4 border-t border-periwinkle-blue/20">
          <div class="flex gap-2">
            {#if selectedElement}
              <Button variant="destructive" size="sm" on:click={deleteSelectedElement} class="flex-1">
                <Trash2 class="w-3 h-3 mr-1" />
                Delete
              </Button>
            {:else if selectedAudioElement}
              <Button variant="destructive" size="sm" on:click={() => deleteAudioElement(selectedAudioElement.id)} class="flex-1">
                <Trash2 class="w-3 h-3 mr-1" />
                Delete
              </Button>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Media Selector Modal -->
{#if showMediaSelector}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="w-full max-w-4xl h-[80vh] bg-soft-buttercream rounded-2xl overflow-hidden shadow-xl">
      <MediaSelector
        type={mediaSelectorType}
        selectedUrl={(selectedElement?.properties?.src || selectedAudioElement?.properties?.src) || ''}
        on:select={handleMediaSelect}
        on:close={() => showMediaSelector = false}
      />
    </div>
  </div>
{/if}

<!-- Audio Generation Modal -->
<AudioGenerationModal
  bind:show={showAudioGeneration}
  initialText={audioGenerationText}
  on:audio-generated={handleAudioGenerated}
/>

<!-- Narration Generation Modal -->
<NarrationGenerationModal
  bind:show={showNarrationGeneration}
  initialText={narrationGenerationText}
  on:narration-generated={handleNarrationGenerated}
/>

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
</style>