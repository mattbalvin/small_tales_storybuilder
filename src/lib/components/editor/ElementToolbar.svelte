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
    Trash2, 
    Eye, 
    EyeOff, 
    Copy, 
    ArrowUp, 
    ArrowDown,
    Palette,
    Move,
    RotateCcw,
    Bold,
    Italic,
    Wand2
  } from 'lucide-svelte'

  export let selectedElementId: string | null
  export let selectedElement: any = null
  export let elements: any[] = []
  export let audioElements: any[] = []
  export let triggers: string[] = []
  export let orientation: 'landscape' | 'portrait'

  const dispatch = createEventDispatcher()

  let showMediaSelector = false
  let mediaSelectorType: 'image' | 'audio' | 'video' | 'all' = 'all'
  let showAudioGeneration = false
  let audioGenerationText = ''

  // Text formatting state
  let isBoldActive = false
  let isItalicActive = false

  function addElement(type: 'text' | 'image' | 'audio') {
    dispatch('add', { type })
  }

  function updateElement(updates: any) {
    dispatch('update', updates)
  }

  function deleteElement() {
    dispatch('delete')
  }

  function selectElement(elementId: string) {
    dispatch('select', { elementId })
  }

  function toggleVisibility(elementId: string) {
    dispatch('toggle-visibility', { elementId })
  }

  function moveBack(elementId: string) {
    dispatch('move-back', { elementId })
  }

  function moveForward(elementId: string) {
    dispatch('move-forward', { elementId })
  }

  function duplicateElement(elementId: string) {
    dispatch('duplicate', { elementId })
  }

  function deleteElementById(elementId: string) {
    dispatch('delete-element', { elementId })
  }

  function reorderElements(fromIndex: number, toIndex: number) {
    dispatch('reorder', { fromIndex, toIndex })
  }

  function copyToOtherOrientation(elementId: string) {
    dispatch('copy-to-other-orientation', { elementId })
  }

  function openMediaSelector(type: 'image' | 'audio' | 'video' | 'all') {
    mediaSelectorType = type
    showMediaSelector = true
  }

  function handleMediaSelect(event: CustomEvent) {
    const { url, filename, type, alt } = event.detail
    
    if (selectedElement) {
      if (selectedElement.type === 'image') {
        updateElement({
          properties: {
            ...selectedElement.properties,
            src: url,
            alt: alt || filename
          }
        })
      } else if (selectedElement.type === 'audio') {
        updateAudioElement(selectedElement.id, { src: url })
      }
    }
    
    showMediaSelector = false
  }

  function updateAudioElement(id: string, updates: any) {
    dispatch('audio-update', { id, updates })
  }

  function deleteAudioElement(id: string) {
    dispatch('audio-delete', { id })
  }

  function duplicateAudioElement(id: string) {
    dispatch('audio-duplicate', { id })
  }

  function openAudioGeneration(initialText = '') {
    audioGenerationText = initialText
    showAudioGeneration = true
  }

  function handleAudioGenerated(event: CustomEvent) {
    const { url, filename } = event.detail
    
    if (selectedElement && selectedElement.type === 'audio') {
      updateAudioElement(selectedElement.id, { src: url })
    }
    
    showAudioGeneration = false
  }

  // Text formatting functions
  function toggleBold() {
    if (selectedElement && selectedElement.type === 'text') {
      document.execCommand('bold', false)
      checkFormattingState()
    }
  }

  function toggleItalic() {
    if (selectedElement && selectedElement.type === 'text') {
      document.execCommand('italic', false)
      checkFormattingState()
    }
  }

  function checkFormattingState() {
    isBoldActive = document.queryCommandState('bold')
    isItalicActive = document.queryCommandState('italic')
  }

  // Check formatting state when element selection changes
  $: if (selectedElement && selectedElement.type === 'text') {
    setTimeout(checkFormattingState, 100)
  }

  // Sort elements by z-index for layer management
  $: sortedElements = [...elements].sort((a, b) => {
    const aZ = a.zIndex || 0
    const bZ = b.zIndex || 0
    return bZ - aZ // Highest z-index first (top layer)
  })
</script>

<div class="w-full h-full flex flex-col bg-card border-l">
  <!-- Add Elements Section -->
  <div class="p-4 border-b">
    <h3 class="text-sm font-medium mb-3">Add Elements</h3>
    <div class="grid grid-cols-3 gap-2">
      <Button variant="outline" size="sm" on:click={() => addElement('text')} class="flex flex-col gap-1 h-auto py-2">
        <Type class="w-4 h-4" />
        <span class="text-xs">Text</span>
      </Button>
      <Button variant="outline" size="sm" on:click={() => addElement('image')} class="flex flex-col gap-1 h-auto py-2">
        <Image class="w-4 h-4" />
        <span class="text-xs">Image</span>
      </Button>
      <Button variant="outline" size="sm" on:click={() => addElement('audio')} class="flex flex-col gap-1 h-auto py-2">
        <Volume2 class="w-4 h-4" />
        <span class="text-xs">Audio</span>
      </Button>
    </div>
  </div>

  <!-- Element Properties -->
  {#if selectedElement}
    <div class="p-4 border-b">
      <h3 class="text-sm font-medium mb-3">
        {selectedElement.type === 'text' ? 'Text' : 
         selectedElement.type === 'image' ? 'Image' : 'Audio'} Properties
      </h3>

      {#if selectedElement.type === 'text'}
        <!-- Text Properties -->
        <div class="space-y-3">
          <!-- Text Formatting Toolbar -->
          <div class="flex items-center gap-1 p-1 bg-muted rounded">
            <Button 
              variant={isBoldActive ? "default" : "ghost"} 
              size="sm" 
              class="h-8 w-8 p-0"
              on:click={toggleBold}
              title="Bold (Ctrl+B)"
            >
              <Bold class="w-3 h-3" />
            </Button>
            <Button 
              variant={isItalicActive ? "default" : "ghost"} 
              size="sm" 
              class="h-8 w-8 p-0"
              on:click={toggleItalic}
              title="Italic (Ctrl+I)"
            >
              <Italic class="w-3 h-3" />
            </Button>
          </div>

          <!-- Font Size -->
          <div>
            <label class="text-xs font-medium mb-1 block">Font Size</label>
            <Input
              type="number"
              min="8"
              max="200"
              value={selectedElement.properties?.fontSize || 16}
              on:input={(e) => updateElement({
                properties: {
                  ...selectedElement.properties,
                  fontSize: parseInt(e.target.value) || 16
                }
              })}
              class="h-8"
            />
          </div>

          <!-- Text Color -->
          <div>
            <label class="text-xs font-medium mb-1 block">Text Color</label>
            <div class="flex gap-2">
              <input
                type="color"
                value={selectedElement.properties?.color || '#000000'}
                on:input={(e) => updateElement({
                  properties: {
                    ...selectedElement.properties,
                    color: e.target.value
                  }
                })}
                class="w-8 h-8 rounded border"
              />
              <Input
                type="text"
                value={selectedElement.properties?.color || '#000000'}
                on:input={(e) => updateElement({
                  properties: {
                    ...selectedElement.properties,
                    color: e.target.value
                  }
                })}
                class="flex-1 h-8"
                placeholder="#000000"
              />
            </div>
          </div>

          <!-- Background Color -->
          <div>
            <label class="text-xs font-medium mb-1 block">Background Color</label>
            <div class="flex gap-2">
              <input
                type="color"
                value={selectedElement.properties?.backgroundColor || '#ffffff'}
                on:input={(e) => updateElement({
                  properties: {
                    ...selectedElement.properties,
                    backgroundColor: e.target.value
                  }
                })}
                class="w-8 h-8 rounded border"
              />
              <Input
                type="range"
                min="0"
                max="100"
                value={selectedElement.properties?.backgroundAlpha || 0}
                on:input={(e) => updateElement({
                  properties: {
                    ...selectedElement.properties,
                    backgroundAlpha: parseInt(e.target.value)
                  }
                })}
                class="flex-1 h-8"
                title="Background Opacity"
              />
              <span class="text-xs text-muted-foreground w-8 text-center leading-8">
                {selectedElement.properties?.backgroundAlpha || 0}%
              </span>
            </div>
          </div>
        </div>

      {:else if selectedElement.type === 'image'}
        <!-- Image Properties -->
        <div class="space-y-3">
          <!-- Image Source -->
          <div>
            <label class="text-xs font-medium mb-1 block">Image URL</label>
            <div class="flex gap-2">
              <Input
                type="text"
                value={selectedElement.properties?.src || ''}
                on:input={(e) => updateElement({
                  properties: {
                    ...selectedElement.properties,
                    src: e.target.value
                  }
                })}
                placeholder="Enter image URL or select from library"
                class="flex-1 h-8"
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
              value={selectedElement.properties?.alt || ''}
              on:input={(e) => updateElement({
                properties: {
                  ...selectedElement.properties,
                  alt: e.target.value
                }
              })}
              placeholder="Describe the image"
              class="h-8"
            />
          </div>

          <!-- Opacity -->
          <div>
            <label class="text-xs font-medium mb-1 block">Opacity</label>
            <div class="flex gap-2 items-center">
              <Input
                type="range"
                min="0"
                max="100"
                value={selectedElement.properties?.opacity || 100}
                on:input={(e) => updateElement({
                  properties: {
                    ...selectedElement.properties,
                    opacity: parseInt(e.target.value)
                  }
                })}
                class="flex-1 h-8"
              />
              <span class="text-xs text-muted-foreground w-8 text-center">
                {selectedElement.properties?.opacity || 100}%
              </span>
            </div>
          </div>
        </div>
      {/if}

      <!-- Position and Size (for visual elements) -->
      {#if selectedElement.type !== 'audio'}
        <div class="mt-4 pt-3 border-t">
          <h4 class="text-xs font-medium mb-2">Position & Size ({orientation})</h4>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label class="block mb-1">X</label>
              <Input
                type="number"
                value={Math.round(selectedElement.x || 0)}
                on:input={(e) => updateElement({ x: parseInt(e.target.value) || 0 })}
                class="h-7"
              />
            </div>
            <div>
              <label class="block mb-1">Y</label>
              <Input
                type="number"
                value={Math.round(selectedElement.y || 0)}
                on:input={(e) => updateElement({ y: parseInt(e.target.value) || 0 })}
                class="h-7"
              />
            </div>
            <div>
              <label class="block mb-1">Width</label>
              <Input
                type="number"
                min="10"
                value={Math.round(selectedElement.width || 0)}
                on:input={(e) => updateElement({ width: parseInt(e.target.value) || 10 })}
                class="h-7"
              />
            </div>
            <div>
              <label class="block mb-1">Height</label>
              <Input
                type="number"
                min="10"
                value={Math.round(selectedElement.height || 0)}
                on:input={(e) => updateElement({ height: parseInt(e.target.value) || 10 })}
                class="h-7"
              />
            </div>
          </div>
        </div>
      {/if}

      <!-- Element Actions -->
      <div class="mt-4 pt-3 border-t">
        <div class="flex flex-wrap gap-1">
          <Button variant="outline" size="sm" on:click={() => toggleVisibility(selectedElement.id)} title="Toggle visibility">
            {#if selectedElement.hidden}
              <EyeOff class="w-3 h-3" />
            {:else}
              <Eye class="w-3 h-3" />
            {/if}
          </Button>
          <Button variant="outline" size="sm" on:click={() => moveBack(selectedElement.id)} title="Move back">
            <ArrowDown class="w-3 h-3" />
          </Button>
          <Button variant="outline" size="sm" on:click={() => moveForward(selectedElement.id)} title="Move forward">
            <ArrowUp class="w-3 h-3" />
          </Button>
          <Button variant="outline" size="sm" on:click={() => duplicateElement(selectedElement.id)} title="Duplicate">
            <Copy class="w-3 h-3" />
          </Button>
          <Button variant="outline" size="sm" on:click={() => copyToOtherOrientation(selectedElement.id)} title="Copy to {orientation === 'landscape' ? 'portrait' : 'landscape'}">
            <RotateCcw class="w-3 h-3" />
          </Button>
          <Button variant="destructive" size="sm" on:click={() => deleteElementById(selectedElement.id)} title="Delete">
            <Trash2 class="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Elements List -->
  <div class="flex-1 overflow-y-auto">
    <div class="p-4">
      <h3 class="text-sm font-medium mb-3">Visual Elements ({orientation})</h3>
      {#if sortedElements.length === 0}
        <p class="text-xs text-muted-foreground">No elements on this page</p>
      {:else}
        <div class="space-y-1">
          {#each sortedElements as element, index (element.id)}
            <button
              class="w-full p-2 text-left rounded border text-xs hover:bg-muted transition-colors {selectedElementId === element.id ? 'bg-primary/10 border-primary' : 'border-border'}"
              on:click={() => selectElement(element.id)}
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  {#if element.type === 'text'}
                    <Type class="w-3 h-3" />
                  {:else if element.type === 'image'}
                    <Image class="w-3 h-3" />
                  {/if}
                  <span class="font-medium">
                    {element.type === 'text' ? 'Text' : 'Image'} {sortedElements.length - index}
                  </span>
                  {#if element.hidden}
                    <EyeOff class="w-3 h-3 text-muted-foreground" />
                  {/if}
                </div>
                <span class="text-muted-foreground">z:{element.zIndex || 0}</span>
              </div>
              {#if element.type === 'text' && element.properties?.text}
                <div class="text-muted-foreground mt-1 truncate">
                  {element.properties.text.replace(/<[^>]*>/g, '').substring(0, 30)}...
                </div>
              {:else if element.type === 'image' && element.properties?.alt}
                <div class="text-muted-foreground mt-1 truncate">
                  {element.properties.alt}
                </div>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Audio Elements -->
    {#if audioElements.length > 0}
      <div class="p-4 border-t">
        <h3 class="text-sm font-medium mb-3">Audio Elements</h3>
        <div class="space-y-2">
          {#each audioElements as audioElement, index}
            <Card class="p-3">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <Volume2 class="w-4 h-4" />
                  <span class="text-sm font-medium">Audio {index + 1}</span>
                </div>
                <div class="flex gap-1">
                  <Button variant="outline" size="sm" on:click={() => duplicateAudioElement(audioElement.id)}>
                    <Copy class="w-3 h-3" />
                  </Button>
                  <Button variant="destructive" size="sm" on:click={() => deleteAudioElement(audioElement.id)}>
                    <Trash2 class="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <!-- Audio Source -->
              <div class="space-y-2">
                <div>
                  <label class="text-xs font-medium mb-1 block">Audio Source</label>
                  <div class="flex gap-1">
                    <Input
                      type="text"
                      value={audioElement.properties?.src || ''}
                      on:input={(e) => updateAudioElement(audioElement.id, { src: e.target.value })}
                      placeholder="Audio URL"
                      class="flex-1 h-7 text-xs"
                    />
                    <Button variant="outline" size="sm" on:click={() => openMediaSelector('audio')}>
                      <Volume2 class="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" on:click={() => openAudioGeneration()}>
                      <Wand2 class="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <!-- Volume -->
                <div>
                  <label class="text-xs font-medium mb-1 block">Volume</label>
                  <div class="flex gap-2 items-center">
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={audioElement.properties?.volume || 100}
                      on:input={(e) => updateAudioElement(audioElement.id, { volume: parseInt(e.target.value) })}
                      class="flex-1 h-6"
                    />
                    <span class="text-xs text-muted-foreground w-8 text-center">
                      {audioElement.properties?.volume || 100}%
                    </span>
                  </div>
                </div>

                <!-- Audio Type -->
                <div>
                  <label class="text-xs font-medium mb-1 block">Audio Type</label>
                  <div class="flex gap-2">
                    <label class="flex items-center gap-1 text-xs">
                      <input
                        type="radio"
                        name="audioType-{audioElement.id}"
                        checked={audioElement.properties?.isIdleLoop === true}
                        on:change={() => updateAudioElement(audioElement.id, { isIdleLoop: true })}
                      />
                      Idle Loop
                    </label>
                    <label class="flex items-center gap-1 text-xs">
                      <input
                        type="radio"
                        name="audioType-{audioElement.id}"
                        checked={audioElement.properties?.isIdleLoop === false}
                        on:change={() => updateAudioElement(audioElement.id, { isIdleLoop: false })}
                      />
                      Action Audio
                    </label>
                  </div>
                </div>

                <!-- Conditional Settings -->
                {#if audioElement.properties?.isIdleLoop === true}
                  <!-- Action Volume for Idle Loop -->
                  <div>
                    <label class="text-xs font-medium mb-1 block">Action Volume</label>
                    <div class="flex gap-2 items-center">
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={audioElement.properties?.actionVolume || 50}
                        on:input={(e) => updateAudioElement(audioElement.id, { actionVolume: parseInt(e.target.value) })}
                        class="flex-1 h-6"
                      />
                      <span class="text-xs text-muted-foreground w-8 text-center">
                        {audioElement.properties?.actionVolume || 50}%
                      </span>
                    </div>
                  </div>
                {:else if audioElement.properties?.isIdleLoop === false}
                  <!-- Playback Mode for Action Audio -->
                  <div>
                    <label class="text-xs font-medium mb-1 block">Playback Mode</label>
                    <select
                      value={audioElement.properties?.playbackMode || 'random'}
                      on:change={(e) => updateAudioElement(audioElement.id, { playbackMode: e.target.value })}
                      class="w-full h-7 text-xs rounded border border-input bg-background px-2"
                    >
                      <option value="random">Random</option>
                      <option value="trigger">Trigger</option>
                    </select>
                  </div>

                  {#if audioElement.properties?.playbackMode === 'random'}
                    <!-- Random Delay Settings -->
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="text-xs font-medium mb-1 block">Min Delay (s)</label>
                        <Input
                          type="number"
                          min="0"
                          value={audioElement.properties?.minDelay || 1}
                          on:input={(e) => updateAudioElement(audioElement.id, { minDelay: parseInt(e.target.value) || 1 })}
                          class="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <label class="text-xs font-medium mb-1 block">Max Delay (s)</label>
                        <Input
                          type="number"
                          min="0"
                          value={audioElement.properties?.maxDelay || 5}
                          on:input={(e) => updateAudioElement(audioElement.id, { maxDelay: parseInt(e.target.value) || 5 })}
                          class="h-7 text-xs"
                        />
                      </div>
                    </div>
                  {:else if audioElement.properties?.playbackMode === 'trigger'}
                    <!-- Trigger Name -->
                    <div>
                      <label class="text-xs font-medium mb-1 block">Trigger Name</label>
                      <select
                        value={audioElement.properties?.triggerName || ''}
                        on:change={(e) => updateAudioElement(audioElement.id, { triggerName: e.target.value })}
                        class="w-full h-7 text-xs rounded border border-input bg-background px-2"
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
{#if showAudioGeneration}
  <AudioGenerationModal
    bind:show={showAudioGeneration}
    initialText={audioGenerationText}
    on:audio-generated={handleAudioGenerated}
  />
{/if}