<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import MediaSelector from './MediaSelector.svelte'
  import AudioGenerationModal from './AudioGenerationModal.svelte'
  import { 
    Type, 
    Image, 
    Volume2, 
    Plus, 
    Trash2, 
    Eye, 
    EyeOff, 
    ArrowUp, 
    ArrowDown,
    GripVertical,
    Palette,
    Settings,
    Wand2
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

  // Reactive statements for element properties
  $: textProperties = selectedElement?.type === 'text' ? selectedElement.properties : null
  $: imageProperties = selectedElement?.type === 'image' ? selectedElement.properties : null

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

  function moveElementBack(elementId: string) {
    dispatch('move-back', { elementId })
  }

  function moveElementForward(elementId: string) {
    dispatch('move-forward', { elementId })
  }

  function deleteElement(elementId: string) {
    dispatch('delete-element', { elementId })
  }

  function selectElement(elementId: string) {
    dispatch('select', { elementId })
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
    }
    
    showAudioGeneration = false
  }

  // Audio element management
  function updateAudioElement(audioId: string, property: string, value: any) {
    dispatch('audio-update', {
      id: audioId,
      updates: { [property]: value }
    })
  }

  function deleteAudioElement(audioId: string) {
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
    event.preventDefault()
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
</script>

<div class="w-full h-full flex flex-col bg-card border-l">
  <!-- Header -->
  <div class="p-4 border-b">
    <h2 class="text-lg font-semibold">Elements</h2>
    <p class="text-sm text-muted-foreground">Add and manage page elements</p>
  </div>

  <!-- Add Elements -->
  <div class="p-4 border-b">
    <div class="grid grid-cols-3 gap-2">
      <Button variant="outline" size="sm" on:click={() => addElement('text')} class="flex flex-col gap-1 h-auto py-3">
        <Type class="w-4 h-4" />
        <span class="text-xs">Text</span>
      </Button>
      <Button variant="outline" size="sm" on:click={() => addElement('image')} class="flex flex-col gap-1 h-auto py-3">
        <Image class="w-4 h-4" />
        <span class="text-xs">Image</span>
      </Button>
      <Button variant="outline" size="sm" on:click={() => addElement('audio')} class="flex flex-col gap-1 h-auto py-3">
        <Volume2 class="w-4 h-4" />
        <span class="text-xs">Audio</span>
      </Button>
    </div>
  </div>

  <!-- Element Properties -->
  <div class="flex-1 overflow-y-auto">
    {#if selectedElement}
      <div class="p-4 border-b">
        <h3 class="text-sm font-medium mb-3">
          {selectedElement.type === 'text' ? 'Text' : 
           selectedElement.type === 'image' ? 'Image' : 'Audio'} Properties
        </h3>

        <!-- Text Properties -->
        {#if textProperties}
          <div class="space-y-3">
            <!-- Text Content -->
            <div>
              <label class="text-xs font-medium mb-1 block">Text</label>
              <textarea
                class="w-full px-2 py-1 text-xs border rounded resize-none"
                rows="3"
                value={textProperties.text || ''}
                on:input={(e) => e.target && updateElementProperty('text', e.target.value)}
                placeholder="Enter text..."
              ></textarea>
            </div>

            <!-- Font Size -->
            <div>
              <label class="text-xs font-medium mb-1 block">Font Size</label>
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
              <label class="text-xs font-medium mb-1 block">Line Height</label>
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
              <label class="text-xs font-medium mb-1 block">Text Color</label>
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
              <label class="text-xs font-medium mb-1 block">Background</label>
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
            <!-- Image Source -->
            <div>
              <label class="text-xs font-medium mb-1 block">Image Source</label>
              <div class="flex gap-2">
                <Input
                  type="text"
                  value={imageProperties.src || ''}
                  on:input={(e) => e.target && updateElementProperty('src', e.target.value)}
                  class="flex-1 text-xs h-8"
                  placeholder="Image URL or select from library"
                />
                <Button variant="outline" size="sm" on:click={() => openMediaSelector('image')}>
                  <Image class="w-3 h-3" />
                </Button>
              </div>
            </div>

            <!-- Alt Text -->
            <div>
              <label class="text-xs font-medium mb-1 block">Alt Text</label>
              <Input
                type="text"
                value={imageProperties.alt || ''}
                on:input={(e) => e.target && updateElementProperty('alt', e.target.value)}
                class="text-xs h-8"
                placeholder="Describe the image"
              />
            </div>

            <!-- Opacity -->
            <div>
              <label class="text-xs font-medium mb-1 block">Opacity: {imageProperties.opacity || 100}%</label>
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
              <label class="text-xs font-medium mb-1 block">Scale: {imageProperties.scale || 100}%</label>
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

        <!-- Audio Properties -->
        {#if selectedElement?.type === 'audio'}
          <div class="space-y-3">
            <!-- Audio Source -->
            <div>
              <label class="text-xs font-medium mb-1 block">Audio Source</label>
              <div class="flex gap-2">
                <Input
                  type="text"
                  value={selectedElement.properties?.src || ''}
                  on:input={(e) => e.target && updateElementProperty('src', e.target.value)}
                  class="flex-1 text-xs h-8"
                  placeholder="Audio URL or select from library"
                />
                <Button variant="outline" size="sm" on:click={() => openMediaSelector('audio')}>
                  <Volume2 class="w-3 h-3" />
                </Button>
                <Button variant="outline" size="sm" on:click={openAudioGeneration}>
                  <Wand2 class="w-3 h-3" />
                </Button>
              </div>
            </div>

            <!-- Volume -->
            <div>
              <label class="text-xs font-medium mb-1 block">Volume: {selectedElement.properties?.volume || 100}%</label>
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
                class="rounded"
              />
              <label class="text-xs font-medium">Autoplay</label>
            </div>
          </div>
        {/if}

        <!-- Position and Size (for visual elements only) -->
        {#if selectedElement?.type !== 'audio'}
          <div class="mt-4 pt-4 border-t">
            <h4 class="text-xs font-medium mb-3">Position & Size ({orientation})</h4>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">X</label>
                <Input
                  type="number"
                  value={selectedElement.x || 0}
                  on:input={(e) => e.target && updateElementLayout('x', parseInt(e.target.value))}
                  class="text-xs h-8"
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">Y</label>
                <Input
                  type="number"
                  value={selectedElement.y || 0}
                  on:input={(e) => e.target && updateElementLayout('y', parseInt(e.target.value))}
                  class="text-xs h-8"
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">Width</label>
                <Input
                  type="number"
                  min="10"
                  value={selectedElement.width || 100}
                  on:input={(e) => e.target && updateElementLayout('width', parseInt(e.target.value))}
                  class="text-xs h-8"
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground mb-1 block">Height</label>
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
        <div class="mt-4 pt-4 border-t">
          <div class="flex gap-2">
            <Button variant="destructive" size="sm" on:click={deleteSelectedElement} class="flex-1">
              <Trash2 class="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Elements List -->
    <div class="p-4">
      <h3 class="text-sm font-medium mb-3">Visual Elements ({orientation})</h3>
      
      {#if sortedElements.length === 0}
        <p class="text-xs text-muted-foreground text-center py-4">
          No elements on this page
        </p>
      {:else}
        <div class="space-y-2">
          {#each sortedElements as element, index (element.id)}
            <div
              class="flex items-center gap-2 p-2 rounded border {selectedElementId === element.id ? 'bg-primary/10 border-primary' : 'bg-muted/30'}"
              draggable="true"
              on:dragstart={(e) => handleDragStart(e, index)}
              on:dragover={handleDragOver}
              on:drop={(e) => handleDrop(e, index)}
            >
              <GripVertical class="w-3 h-3 text-muted-foreground cursor-grab" />
              
              <button
                class="flex-1 flex items-center gap-2 text-left"
                on:click={() => selectElement(element.id)}
              >
                {#if element.type === 'text'}
                  <Type class="w-3 h-3" />
                  <span class="text-xs truncate">
                    {element.properties?.text || 'Text Element'}
                  </span>
                {:else if element.type === 'image'}
                  <Image class="w-3 h-3" />
                  <span class="text-xs truncate">Image</span>
                {/if}
              </button>

              <div class="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-6 w-6 p-0"
                  on:click={() => toggleElementVisibility(element.id)}
                  title={element.hidden ? 'Show element' : 'Hide element'}
                >
                  {#if element.hidden}
                    <EyeOff class="w-3 h-3" />
                  {:else}
                    <Eye class="w-3 h-3" />
                  {/if}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  class="h-6 w-6 p-0"
                  on:click={() => moveElementBack(element.id)}
                  title="Move back"
                >
                  <ArrowDown class="w-3 h-3" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  class="h-6 w-6 p-0"
                  on:click={() => moveElementForward(element.id)}
                  title="Move forward"
                >
                  <ArrowUp class="w-3 h-3" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  class="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  on:click={() => deleteElement(element.id)}
                  title="Delete element"
                >
                  <Trash2 class="w-3 h-3" />
                </Button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Audio Elements -->
    {#if audioElements.length > 0}
      <div class="p-4 border-t">
        <h3 class="text-sm font-medium mb-3">Audio Elements</h3>
        <div class="space-y-2">
          {#each audioElements as audioElement (audioElement.id)}
            <Card class="p-3">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <Volume2 class="w-3 h-3" />
                  <span class="text-xs font-medium">Audio Element</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  on:click={() => deleteAudioElement(audioElement.id)}
                >
                  <Trash2 class="w-3 h-3" />
                </Button>
              </div>

              <!-- Audio Source -->
              <div class="mb-2">
                <label class="text-xs text-muted-foreground mb-1 block">Source</label>
                <div class="flex gap-1">
                  <Input
                    type="text"
                    value={audioElement.properties?.src || ''}
                    on:input={(e) => e.target && updateAudioElement(audioElement.id, 'src', e.target.value)}
                    class="flex-1 text-xs h-7"
                    placeholder="Audio URL"
                  />
                  <Button variant="outline" size="sm" class="h-7 w-7 p-0" on:click={() => openMediaSelector('audio')}>
                    <Volume2 class="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <!-- Volume -->
              <div class="mb-2">
                <label class="text-xs text-muted-foreground mb-1 block">
                  Volume: {audioElement.properties?.volume || 100}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={audioElement.properties?.volume || 100}
                  on:input={(e) => e.target && updateAudioElement(audioElement.id, 'volume', parseInt(e.target.value))}
                  class="w-full h-1"
                />
              </div>

              <!-- Audio Type -->
              <div class="mb-2">
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={audioElement.properties?.isIdleLoop || false}
                    on:change={(e) => e.target && updateAudioElement(audioElement.id, 'isIdleLoop', e.target.checked)}
                    class="rounded"
                  />
                  <label class="text-xs">Idle Loop</label>
                </div>
              </div>

              <!-- Conditional properties based on audio type -->
              {#if audioElement.properties?.isIdleLoop}
                <!-- Action Volume for idle loops -->
                <div>
                  <label class="text-xs text-muted-foreground mb-1 block">
                    Action Volume: {audioElement.properties?.actionVolume || 50}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audioElement.properties?.actionVolume || 50}
                    on:input={(e) => e.target && updateAudioElement(audioElement.id, 'actionVolume', parseInt(e.target.value))}
                    class="w-full h-1"
                  />
                </div>
              {:else}
                <!-- Playback Mode for non-idle audio -->
                <div class="mb-2">
                  <label class="text-xs text-muted-foreground mb-1 block">Playback Mode</label>
                  <select
                    value={audioElement.properties?.playbackMode || 'random'}
                    on:change={(e) => e.target && updateAudioElement(audioElement.id, 'playbackMode', e.target.value)}
                    class="w-full text-xs h-7 border rounded px-2"
                  >
                    <option value="random">Random</option>
                    <option value="trigger">Trigger</option>
                  </select>
                </div>

                {#if audioElement.properties?.playbackMode === 'random'}
                  <!-- Random delay settings -->
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="text-xs text-muted-foreground mb-1 block">Min Delay (s)</label>
                      <Input
                        type="number"
                        min="0"
                        value={audioElement.properties?.minDelay || 1}
                        on:input={(e) => e.target && updateAudioElement(audioElement.id, 'minDelay', parseInt(e.target.value))}
                        class="text-xs h-7"
                      />
                    </div>
                    <div>
                      <label class="text-xs text-muted-foreground mb-1 block">Max Delay (s)</label>
                      <Input
                        type="number"
                        min="0"
                        value={audioElement.properties?.maxDelay || 5}
                        on:input={(e) => e.target && updateAudioElement(audioElement.id, 'maxDelay', parseInt(e.target.value))}
                        class="text-xs h-7"
                      />
                    </div>
                  </div>
                {:else if audioElement.properties?.playbackMode === 'trigger'}
                  <!-- Trigger name -->
                  <div>
                    <label class="text-xs text-muted-foreground mb-1 block">Trigger Name</label>
                    <select
                      value={audioElement.properties?.triggerName || ''}
                      on:change={(e) => e.target && updateAudioElement(audioElement.id, 'triggerName', e.target.value)}
                      class="w-full text-xs h-7 border rounded px-2"
                    >
                      <option value="">Select trigger...</option>
                      {#each triggers as trigger}
                        <option value={trigger}>{trigger}</option>
                      {/each}
                    </select>
                  </div>
                {/if}
              {/if}
            </Card>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Media Selector Modal -->
{#if showMediaSelector}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="w-full max-w-4xl h-[80vh] bg-background rounded-lg overflow-hidden">
      <MediaSelector
        type={mediaSelectorType}
        selectedUrl={selectedElement?.properties?.src || ''}
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

<style>
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: hsl(var(--muted));
    border-radius: 2px;
    outline: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    background: hsl(var(--primary));
    border-radius: 50%;
    cursor: pointer;
  }

  input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: hsl(var(--primary));
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
</style>