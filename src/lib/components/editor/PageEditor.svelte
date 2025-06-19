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
  let resizeStartData = { x: 0, y: 0, width: 0, height: 0, mouseX: 0, mouseY: 0 }
  let canvasElement: HTMLElement

  // Use local elements state that gets updated immediately
  let elements = page.content?.elements || []

  // Watch for page changes and update local elements
  $: if (page.content?.elements) {
    elements = [...page.content.elements]
    console.log('Page content changed, updating elements:', elements)
  }

  // Reactive statement to get selected element
  $: selectedElement = selectedElementId ? elements.find(el => el.id === selectedElementId) : null

  $: aspectRatio = orientation === 'landscape' ? '16/9' : '9/16'
  $: safetyZoneClass = showSafetyZones 
    ? (orientation === 'landscape' ? 'safety-zone-16-9' : 'safety-zone-9-16')
    : ''

  function updatePageContent() {
    const newContent = {
      ...page.content,
      elements: [...elements]
    }
    
    console.log('Updating page content with elements:', elements)
    
    // Update the page object immediately for local reactivity
    page = {
      ...page,
      content: newContent
    }
    
    // Dispatch the update to save to database
    dispatch('update', {
      content: newContent
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

    elements = [...elements, newElement]
    selectedElementId = newElement.id
    updatePageContent()
  }

  function selectElement(id: string) {
    if (readonly) return
    selectedElementId = id
    console.log('Selected element:', id, 'Element data:', elements.find(el => el.id === id))
  }

  function updateElement(id: string, updates: any) {
    if (readonly) return
    
    console.log('updateElement called:', { id, updates })
    console.log('Current elements before update:', elements)
    
    // Update the elements array
    const newElements = elements.map(el => {
      if (el.id === id) {
        const updatedElement = { ...el, ...updates }
        console.log('Updating element from:', el, 'to:', updatedElement)
        return updatedElement
      }
      return el
    })
    
    elements = newElements
    console.log('Elements after update:', elements)
    
    // Force reactivity by triggering the page content update
    updatePageContent()
    
    // Force a re-render by updating the selected element reference
    if (selectedElementId === id) {
      // This will trigger the reactive statement for selectedElement
      selectedElementId = selectedElementId
    }
  }

  function deleteElement(id: string) {
    if (readonly) return
    
    elements = elements.filter(el => el.id !== id)
    if (selectedElementId === id) {
      selectedElementId = null
    }
    updatePageContent()
  }

  function getCanvasRect() {
    if (!canvasElement) return { left: 0, top: 0, width: 800, height: 450 }
    return canvasElement.getBoundingClientRect()
  }

  // Mouse event handlers for dragging and resizing
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
    
    const canvasRect = getCanvasRect()
    
    if (resizeHandleEl) {
      isResizing = true
      resizeHandle = resizeHandleEl.getAttribute('data-handle') || ''
      
      // Store initial resize data
      resizeStartData = {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        mouseX: event.clientX,
        mouseY: event.clientY
      }
    } else {
      isDragging = true
      
      // Calculate offset relative to canvas
      const elementRect = (event.currentTarget as HTMLElement).getBoundingClientRect()
      dragOffset = {
        x: event.clientX - elementRect.left,
        y: event.clientY - elementRect.top
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(event: MouseEvent) {
    if (!selectedElementId) return

    const element = elements.find(el => el.id === selectedElementId)
    if (!element) return

    const canvasRect = getCanvasRect()

    if (isDragging) {
      // Calculate new position relative to canvas
      const newX = Math.max(0, Math.min(
        event.clientX - canvasRect.left - dragOffset.x,
        canvasRect.width - element.width
      ))
      const newY = Math.max(0, Math.min(
        event.clientY - canvasRect.top - dragOffset.y,
        canvasRect.height - element.height
      ))
      
      updateElement(selectedElementId, {
        x: Math.round(newX),
        y: Math.round(newY)
      })
    } else if (isResizing) {
      // Calculate mouse movement delta
      const deltaX = event.clientX - resizeStartData.mouseX
      const deltaY = event.clientY - resizeStartData.mouseY
      
      let newWidth = resizeStartData.width
      let newHeight = resizeStartData.height
      let newX = resizeStartData.x
      let newY = resizeStartData.y

      // Apply resize based on handle
      switch (resizeHandle) {
        case 'se': // bottom-right
          newWidth = Math.max(50, resizeStartData.width + deltaX)
          newHeight = Math.max(30, resizeStartData.height + deltaY)
          break
        case 'sw': // bottom-left
          newWidth = Math.max(50, resizeStartData.width - deltaX)
          newHeight = Math.max(30, resizeStartData.height + deltaY)
          newX = Math.max(0, resizeStartData.x + deltaX)
          // Adjust X if width hit minimum
          if (newWidth === 50) {
            newX = resizeStartData.x + resizeStartData.width - 50
          }
          break
        case 'ne': // top-right
          newWidth = Math.max(50, resizeStartData.width + deltaX)
          newHeight = Math.max(30, resizeStartData.height - deltaY)
          newY = Math.max(0, resizeStartData.y + deltaY)
          // Adjust Y if height hit minimum
          if (newHeight === 30) {
            newY = resizeStartData.y + resizeStartData.height - 30
          }
          break
        case 'nw': // top-left
          newWidth = Math.max(50, resizeStartData.width - deltaX)
          newHeight = Math.max(30, resizeStartData.height - deltaY)
          newX = Math.max(0, resizeStartData.x + deltaX)
          newY = Math.max(0, resizeStartData.y + deltaY)
          // Adjust positions if dimensions hit minimum
          if (newWidth === 50) {
            newX = resizeStartData.x + resizeStartData.width - 50
          }
          if (newHeight === 30) {
            newY = resizeStartData.y + resizeStartData.height - 30
          }
          break
      }

      // Ensure element stays within canvas bounds
      newX = Math.max(0, Math.min(newX, canvasRect.width - newWidth))
      newY = Math.max(0, Math.min(newY, canvasRect.height - newHeight))
      newWidth = Math.min(newWidth, canvasRect.width - newX)
      newHeight = Math.min(newHeight, canvasRect.height - newY)

      updateElement(selectedElementId, {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newWidth),
        height: Math.round(newHeight)
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
    if (target === canvasElement || target.classList.contains('canvas-area')) {
      selectedElementId = null
    }
  }

  // Handle updates from ElementToolbar
  function handleElementUpdate(event: CustomEvent) {
    if (selectedElementId) {
      console.log('Handling element update from toolbar:', event.detail)
      updateElement(selectedElementId, event.detail)
    }
  }
</script>

<div class="h-full flex">
  <!-- Canvas -->
  <div class="flex-1 flex items-center justify-center p-8">
    <div 
      bind:this={canvasElement}
      class={cn(
        "relative bg-white border-2 border-gray-300 rounded-lg shadow-lg canvas-area overflow-hidden",
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
          class:cursor-move={!readonly && selectedElementId === element.id && !isResizing}
          class:cursor-pointer={!readonly && selectedElementId !== element.id}
          class:cursor-default={readonly}
          style="left: {element.x}px; top: {element.y}px; width: {element.width}px; height: {element.height}px; z-index: {selectedElementId === element.id ? 10 : 1};"
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
            <div 
              class="resize-handle absolute w-3 h-3 bg-primary border border-white rounded-full cursor-nw-resize hover:scale-125 transition-transform" 
              style="left: -6px; top: -6px; z-index: 20;"
              data-handle="nw"
            ></div>
            <div 
              class="resize-handle absolute w-3 h-3 bg-primary border border-white rounded-full cursor-ne-resize hover:scale-125 transition-transform" 
              style="right: -6px; top: -6px; z-index: 20;"
              data-handle="ne"
            ></div>
            <div 
              class="resize-handle absolute w-3 h-3 bg-primary border border-white rounded-full cursor-sw-resize hover:scale-125 transition-transform" 
              style="left: -6px; bottom: -6px; z-index: 20;"
              data-handle="sw"
            ></div>
            <div 
              class="resize-handle absolute w-3 h-3 bg-primary border border-white rounded-full cursor-se-resize hover:scale-125 transition-transform" 
              style="right: -6px; bottom: -6px; z-index: 20;"
              data-handle="se"
            ></div>
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
      selectedElement={selectedElement}
      on:add={(e) => addElement(e.detail.type)}
      on:update={handleElementUpdate}
      on:delete={() => selectedElementId && deleteElement(selectedElementId)}
    />
  {/if}
</div>