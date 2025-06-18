<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { dndzone } from 'svelte-dnd-action'
  import { cn } from '$lib/utils'
  import ElementToolbar from './ElementToolbar.svelte'
  import TextElement from './elements/TextElement.svelte'
  import ImageElement from './elements/ImageElement.svelte'
  import AudioElement from './elements/AudioElement.svelte'
  import type { Database } from '$lib/types/database'

  type StoryPage = Database['public']['Tables']['story_pages']['Row']

  export let page: StoryPage
  export let orientation: 'landscape' | 'portrait' = 'landscape'
  export let showSafetyZones = true

  const dispatch = createEventDispatcher()

  let selectedElementId: string | null = null
  let elements = page.content?.elements || []
  let isDragging = false

  $: aspectRatio = orientation === 'landscape' ? '16/9' : '9/16'
  $: safetyZoneClass = showSafetyZones 
    ? (orientation === 'landscape' ? 'safety-zone-16-9' : 'safety-zone-9-16')
    : ''

  function handleDrop(event: CustomEvent) {
    elements = event.detail.items
    updatePageContent()
  }

  function updatePageContent() {
    dispatch('update', {
      content: {
        ...page.content,
        elements
      }
    })
  }

  function addElement(type: 'text' | 'image' | 'audio') {
    const newElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 50,
      y: 50,
      width: type === 'text' ? 300 : 200,
      height: type === 'text' ? 100 : 150,
      properties: type === 'text' 
        ? { text: 'New text element', fontSize: 16, color: '#000000' }
        : type === 'image'
        ? { src: '', alt: '' }
        : { src: '', autoplay: false }
    }

    elements = [...elements, newElement]
    selectedElementId = newElement.id
    updatePageContent()
  }

  function selectElement(id: string) {
    selectedElementId = id
  }

  function updateElement(id: string, updates: any) {
    elements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    )
    updatePageContent()
  }

  function deleteElement(id: string) {
    elements = elements.filter(el => el.id !== id)
    if (selectedElementId === id) {
      selectedElementId = null
    }
    updatePageContent()
  }
</script>

<div class="h-full flex">
  <!-- Canvas -->
  <div class="flex-1 flex items-center justify-center p-8">
    <div 
      class={cn(
        "relative bg-white border-2 border-gray-300 rounded-lg shadow-lg",
        safetyZoneClass,
        orientation === 'landscape' && 'aspect-[16/9]',
        orientation === 'portrait' && 'aspect-[9/16]'
      )}
      style="width: {orientation === 'landscape' ? '800px' : '450px'}; max-width: 100%; max-height: 100%;"
      use:dndzone={{ items: elements, dragDisabled: false }}
      on:consider={handleDrop}
      on:finalize={handleDrop}
    >
      {#each elements as element (element.id)}
        <div
          class="absolute cursor-pointer border-2 transition-colors"
          class:border-primary={selectedElementId === element.id}
          class:border-transparent={selectedElementId !== element.id}
          style="left: {element.x}px; top: {element.y}px; width: {element.width}px; height: {element.height}px;"
          on:click={() => selectElement(element.id)}
        >
          {#if element.type === 'text'}
            <TextElement 
              {element} 
              on:update={(e) => updateElement(element.id, e.detail)} 
            />
          {:else if element.type === 'image'}
            <ImageElement 
              {element} 
              on:update={(e) => updateElement(element.id, e.detail)} 
            />
          {:else if element.type === 'audio'}
            <AudioElement 
              {element} 
              on:update={(e) => updateElement(element.id, e.detail)} 
            />
          {/if}
        </div>
      {/each}

      <!-- Drop zone when empty -->
      {#if elements.length === 0}
        <div class="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <div class="text-center">
            <p class="text-lg font-medium mb-2">Empty page</p>
            <p class="text-sm">Add elements using the toolbar</p>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Element Toolbar -->
  <ElementToolbar 
    {selectedElementId}
    selectedElement={elements.find(el => el.id === selectedElementId)}
    on:add={(e) => addElement(e.detail.type)}
    on:update={(e) => updateElement(selectedElementId, e.detail)}
    on:delete={() => selectedElementId && deleteElement(selectedElementId)}
  />
</div>