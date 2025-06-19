<script lang="ts">
  import { createEventDispatcher } from 'svelte'
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
  let dragOffset = { x: 0, y: 0 }
  let isResizing = false
  let resizeHandle = ''

  // Make elements reactive to page changes
  $: elements = page.content?.elements || []

  $: aspectRatio = orientation === 'landscape' ? '16/9' : '9/16'
  $: safetyZoneClass = showSafetyZones 
    ? (orientation === 'landscape' ? 'safety-zone-16-9' : 'safety-zone-9-16')
    : ''

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

  // Mouse event handlers for dragging
  function handleMouseDown(event: MouseEvent, elementId: string) {
    if (readonly) return
    
    event.preventDefault()
    event.stopPropagation()
    
    const element = elements.find(el => el.id === elementId)
    if (!element) return

    selectedElementId = elementId
    
    // Check if clicking on a resize handle
    const target = event.target as HTMLElement
    const resizeHandleEl = target.closest('.resize-handle')
    
    if (resizeHandleEl) {
      isResizing = true
      resizeHandle = resizeHandleEl.getAttribute('data-handle') || ''
    } else {
      isDragging = true
      dragOffset = {
        x: event.clientX - element.x,
        y: event.clientY - element.y
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(event: MouseEvent) {
    if (!selectedElementId) return

    const element = elements.find(el => el.id === selectedElementId)
    if (!element) return

    if (isDragging) {
      const newX = Math.max(0, event.clientX - dragOffset.x)
      const newY = Math.max(0, event.clientY - dragOffset.y)
      
      updateElement(selectedElementId, {
        x: newX,
        y: newY
      })
    } else if (isResizing) {
      const rect = event.currentTarget?.getBoundingClientRect?.() || { left: 0, top: 0 }
      const relativeX = event.clientX - rect.left
      const relativeY = event.clientY - rect.top
      
      let newWidth = element.width
      let newHeight = element.height
      let newX = element.x
      let newY = element.y

      switch (resizeHandle) {
        case 'se': // bottom-right
          newWidth = Math.max(50, relativeX - element.x)
          newHeight = Math.max(30, relativeY - element.y)
          break
        case 'sw': // bottom-left
          newWidth = Math.max(50, element.width + (element.x - relativeX))
          newHeight = Math.max(30, relativeY - element.y)
          newX = Math.min(element.x, relativeX)
          break
        case 'ne': // top-right
          newWidth = Math.max(50, relativeX - element.x)
          newHeight = Math.max(30, element.height + (element.y - relativeY))
          newY = Math.min(element.y, relativeY)
          break
        case 'nw': // top-left
          newWidth = Math.max(50, element.width + (element.x - relativeX))
          newHeight = Math.max(30, element.height + (element.y - relativeY))
          newX = Math.min(element.x, relativeX)
          newY = Math.min(element.y, relativeY)
          break
      }

      updateElement(selectedElementId, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      })
    }
  }

  function handleMouseUp() {
    isDragging = false
    isResizing = false
    resizeHandle = ''
    
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  function handleCanvasClick(event: MouseEvent) {
    if (readonly) return
    
    // Only deselect if clicking on the canvas itself, not on an element
    const target = event.target as HTMLElement
    if (target.classList.contains('canvas-area')) {
      selectedElementId = null
    }
  }
</script>

<div class="h-full flex">
  <!-- Canvas -->
  <div class="flex-1 flex items-center justify-center p-8">
    <div 
      class={cn(
        "relative bg-white border-2 border-gray-300 rounded-lg shadow-lg canvas-area",
        safetyZoneClass,
        orientation === 'landscape' && 'aspect-[16/9]',
        orientation === 'portrait' && 'aspect-[9/16]',
        readonly && 'border-muted'
      )}
      style="width: {orientation === 'landscape' ? '800px' : '450px'}; max-width: 100%; max-height: 100%;"
      on:click={handleCanvasClick}
    >
      {#each elements as element (element.id)}
        <div
          class="absolute select-none group"
          class:border-2={selectedElementId === element.id && !readonly}
          class:border-primary={selectedElementId === element.id && !readonly}
          class:border-transparent={selectedElementId !== element.id || readonly}
          class:cursor-move={!readonly && selectedElementId === element.id}
          class:cursor-pointer={!readonly && selectedElementId !== element.id}
          class:cursor-default={readonly}
          style="left: {element.x}px; top: {element.y}px; width: {element.width}px; height: {element.height}px;"
          on:mousedown={(e) => !readonly && handleMouseDown(e, element.id)}
          on:click|stopPropagation={() => !readonly && selectElement(element.id)}
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

          <!-- Resize handles (only show when selected and not readonly) -->
          {#if selectedElementId === element.id && !readonly}
            <div class="resize-handle absolute -top-1 -left-1 w-3 h-3 bg-primary border border-white rounded-full cursor-nw-resize" data-handle="nw"></div>
            <div class="resize-handle absolute -top-1 -right-1 w-3 h-3 bg-primary border border-white rounded-full cursor-ne-resize" data-handle="ne"></div>
            <div class="resize-handle absolute -bottom-1 -left-1 w-3 h-3 bg-primary border border-white rounded-full cursor-sw-resize" data-handle="sw"></div>
            <div class="resize-handle absolute -bottom-1 -right-1 w-3 h-3 bg-primary border border-white rounded-full cursor-se-resize" data-handle="se"></div>
          {/if}
        </div>
      {/each}

      <!-- Drop zone when empty -->
      {#if elements.length === 0}
        <div class="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
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
      on:update={(e) => selectedElementId && updateElement(selectedElementId, e.detail)}
      on:delete={() => selectedElementId && deleteElement(selectedElementId)}
    />
  {/if}
</div>

<style>
  .resize-handle {
    z-index: 10;
  }
  
  .resize-handle:hover {
    transform: scale(1.2);
  }
</style>