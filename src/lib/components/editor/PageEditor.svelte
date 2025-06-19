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
  export let readonly = false

  const dispatch = createEventDispatcher()

  let selectedElementId: string | null = null
  let isDragging = false

  // Make elements reactive to page changes
  $: elements = page.content?.elements || []

  $: aspectRatio = orientation === 'landscape' ? '16/9' : '9/16'
  $: safetyZoneClass = showSafetyZones 
    ? (orientation === 'landscape' ? 'safety-zone-16-9' : 'safety-zone-9-16')
    : ''

  function handleDrop(event: CustomEvent) {
    if (readonly) return
    
    // Dispatch the new elements array to parent
    dispatch('update', {
      content: {
        ...page.content,
        elements: event.detail.items
      }
    })
  }

  function addElement(type: 'text' | 'image' | 'audio') {
    if (readonly) return
    
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

    const newElements = [...elements, newElement]
    selectedElementId = newElement.id
    
    dispatch('update', {
      content: {
        ...page.content,
        elements: newElements
      }
    })
  }

  function selectElement(id: string) {
    if (readonly) return
    selectedElementId = id
  }

  function updateElement(id: string, updates: any) {
    if (readonly) return
    
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    )
    
    dispatch('update', {
      content: {
        ...page.content,
        elements: newElements
      }
    })
  }

  function deleteElement(id: string) {
    if (readonly) return
    
    const newElements = elements.filter(el => el.id !== id)
    if (selectedElementId === id) {
      selectedElementId = null
    }
    
    dispatch('update', {
      content: {
        ...page.content,
        elements: newElements
      }
    })
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
        orientation === 'portrait' && 'aspect-[9/16]',
        readonly && 'border-muted'
      )}
      style="width: {orientation === 'landscape' ? '800px' : '450px'}; max-width: 100%; max-height: 100%;"
      use:dndzone={{ items: elements, dragDisabled: readonly }}
      on:consider={handleDrop}
      on:finalize={handleDrop}
    >
      {#each elements as element (element.id)}
        <div
          class="absolute cursor-pointer border-2 transition-colors"
          class:border-primary={selectedElementId === element.id && !readonly}
          class:border-transparent={selectedElementId !== element.id || readonly}
          class:cursor-default={readonly}
          style="left: {element.x}px; top: {element.y}px; width: {element.width}px; height: {element.height}px;"
          on:click={() => !readonly && selectElement(element.id)}
        >
          {#if element.type === 'text'}
            <TextElement 
              {element} 
              {readonly}
              on:update={(e) => !readonly && updateElement(element.id, e.detail)} 
            />
          {:else if element.type === 'image'}
            <ImageElement 
              {element} 
              on:update={(e) => !readonly && updateElement(element.id, e.detail)} 
            />
          {:else if element.type === 'audio'}
            <AudioElement 
              {element} 
              on:update={(e) => !readonly && updateElement(element.id, e.detail)} 
            />
          {/if}
        </div>
      {/each}

      <!-- Drop zone when empty -->
      {#if elements.length === 0}
        <div class="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <div class="text-center">
            <p class="text-lg font-medium mb-2">Empty page</p>
            <p class="text-sm">
              {readonly ? 'This page has no content' : 'Add elements using the toolbar'}
            </p>
          </div>
        </div>
      {/if}

      <!-- Readonly overlay -->
      {#if readonly}
        <div class="absolute top-2 right-2 px-2 py-1 bg-muted/80 rounded text-xs text-muted-foreground">
          Read-only
        </div>
      {/if}
    </div>
  </div>

  <!-- Element Toolbar (only show if not readonly) -->
  {#if !readonly}
    <ElementToolbar 
      {selectedElementId}
      selectedElement={elements.find(el => el.id === selectedElementId)}
      on:add={(e) => addElement(e.detail.type)}
      on:update={(e) => updateElement(selectedElementId, e.detail)}
      on:delete={() => selectedElementId && deleteElement(selectedElementId)}
    />
  {/if}
</div>