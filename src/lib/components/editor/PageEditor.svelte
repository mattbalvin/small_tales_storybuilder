<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte'
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
  let viewportElement: HTMLElement

  // Zoom and pan state
  let zoomLevel = 1
  let panX = 0
  let panY = 0
  let isPanning = false
  let panStartX = 0
  let panStartY = 0
  let panStartPanX = 0
  let panStartPanY = 0

  // Cursor state
  let showZoomCursor = false
  let showPanCursor = false
  let isAltPressed = false
  let isCtrlPressed = false

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

  // Canvas dimensions (logical size)
  $: canvasWidth = orientation === 'landscape' ? 1600 : 900
  $: canvasHeight = orientation === 'landscape' ? 900 : 1600

  // Cursor styles based on key states
  $: cursorStyle = isCtrlPressed ? 'zoom-in' : isAltPressed ? 'move' : 'default'

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
    if (readonly || isPanning) return
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
    if (!canvasElement) return { left: 0, top: 0, width: canvasWidth, height: canvasHeight }
    return canvasElement.getBoundingClientRect()
  }

  // Fixed zoom function that only affects canvas content within viewport
  function handleZoom(delta: number, clientX?: number, clientY?: number) {
    if (readonly) return

    const zoomFactor = 1.1
    const oldZoom = zoomLevel
    const newZoom = delta > 0 
      ? Math.min(zoomLevel * zoomFactor, 5) 
      : Math.max(zoomLevel / zoomFactor, 0.1)

    if (clientX !== undefined && clientY !== undefined && viewportElement && canvasElement) {
      // Get viewport and canvas rectangles
      const viewportRect = viewportElement.getBoundingClientRect()
      const canvasRect = canvasElement.getBoundingClientRect()
      
      // Calculate mouse position relative to viewport
      const mouseX = clientX - viewportRect.left
      const mouseY = clientY - viewportRect.top
      
      // Calculate mouse position relative to canvas (accounting for current pan and zoom)
      const canvasMouseX = (mouseX - panX) / oldZoom
      const canvasMouseY = (mouseY - panY) / oldZoom
      
      // Update zoom level
      zoomLevel = newZoom
      
      // Calculate new pan to keep the same canvas point under the mouse
      panX = mouseX - canvasMouseX * newZoom
      panY = mouseY - canvasMouseY * newZoom
      
      // Constrain pan to keep canvas visible within viewport
      constrainPan()
    } else {
      // Zoom without specific point (center zoom)
      const viewportRect = viewportElement?.getBoundingClientRect()
      if (viewportRect) {
        const centerX = viewportRect.width / 2
        const centerY = viewportRect.height / 2
        
        const canvasPointX = (centerX - panX) / oldZoom
        const canvasPointY = (centerY - panY) / oldZoom
        
        zoomLevel = newZoom
        
        panX = centerX - canvasPointX * newZoom
        panY = centerY - canvasPointY * newZoom
        
        constrainPan()
      } else {
        zoomLevel = newZoom
      }
    }
  }

  function constrainPan() {
    if (!viewportElement) return

    const viewportRect = viewportElement.getBoundingClientRect()
    const scaledCanvasWidth = canvasWidth * zoomLevel
    const scaledCanvasHeight = canvasHeight * zoomLevel
    
    // Calculate 10% buffer for additional space
    const bufferX = viewportRect.width * 0.1
    const bufferY = viewportRect.height * 0.1
    
    // Calculate pan limits to allow bottom-right corner to be visible with buffer
    // When panning left (negative panX), we want to see the right edge of canvas
    // When panning up (negative panY), we want to see the bottom edge of canvas
    const minPanX = -(scaledCanvasWidth - viewportRect.width + bufferX)
    const minPanY = -(scaledCanvasHeight - viewportRect.height + bufferY)
    
    // When panning right (positive panX), we want to see the left edge of canvas
    // When panning down (positive panY), we want to see the top edge of canvas
    const maxPanX = bufferX
    const maxPanY = bufferY

    // Apply constraints
    panX = Math.max(minPanX, Math.min(maxPanX, panX))
    panY = Math.max(minPanY, Math.min(maxPanY, panY))
  }

  function resetZoom() {
    zoomLevel = 1
    panX = 0
    panY = 0
  }

  function fitToScreen() {
    if (!viewportElement) return

    const viewportRect = viewportElement.getBoundingClientRect()
    const scaleX = viewportRect.width / canvasWidth
    const scaleY = viewportRect.height / canvasHeight
    
    zoomLevel = Math.min(scaleX, scaleY) * 0.9 // 90% to leave some margin
    
    // Center the canvas in the viewport
    panX = (viewportRect.width - canvasWidth * zoomLevel) / 2
    panY = (viewportRect.height - canvasHeight * zoomLevel) / 2
  }

  // Mouse event handlers for dragging and resizing
  function handleMouseDown(event: MouseEvent, elementId: string) {
    if (readonly || isPanning || isAltPressed) return
    
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
      // Calculate new position relative to canvas, accounting for zoom and pan
      const newX = Math.max(0, Math.min(
        (event.clientX - canvasRect.left - panX) / zoomLevel - dragOffset.x / zoomLevel,
        canvasWidth - element.width
      ))
      const newY = Math.max(0, Math.min(
        (event.clientY - canvasRect.top - panY) / zoomLevel - dragOffset.y / zoomLevel,
        canvasHeight - element.height
      ))
      
      updateElement(selectedElementId, {
        x: Math.round(newX),
        y: Math.round(newY)
      })
    } else if (isResizing) {
      // Calculate mouse movement delta
      const deltaX = (event.clientX - resizeStartData.mouseX) / zoomLevel
      const deltaY = (event.clientY - resizeStartData.mouseY) / zoomLevel
      
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
          if (newWidth === 50) {
            newX = resizeStartData.x + resizeStartData.width - 50
          }
          break
        case 'ne': // top-right
          newWidth = Math.max(50, resizeStartData.width + deltaX)
          newHeight = Math.max(30, resizeStartData.height - deltaY)
          newY = Math.max(0, resizeStartData.y + deltaY)
          if (newHeight === 30) {
            newY = resizeStartData.y + resizeStartData.height - 30
          }
          break
        case 'nw': // top-left
          newWidth = Math.max(50, resizeStartData.width - deltaX)
          newHeight = Math.max(30, resizeStartData.height - deltaY)
          newX = Math.max(0, resizeStartData.x + deltaX)
          newY = Math.max(0, resizeStartData.y + deltaY)
          if (newWidth === 50) {
            newX = resizeStartData.x + resizeStartData.width - 50
          }
          if (newHeight === 30) {
            newY = resizeStartData.y + resizeStartData.height - 30
          }
          break
      }

      // Ensure element stays within canvas bounds
      newX = Math.max(0, Math.min(newX, canvasWidth - newWidth))
      newY = Math.max(0, Math.min(newY, canvasHeight - newHeight))
      newWidth = Math.min(newWidth, canvasWidth - newX)
      newHeight = Math.min(newHeight, canvasHeight - newY)

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
    if (readonly || isPanning || isAltPressed) return
    
    // Only deselect if clicking on the canvas itself, not on an element
    const target = event.target as HTMLElement
    if (target === canvasElement || target.classList.contains('canvas-area')) {
      selectedElementId = null
    }
  }

  // Pan handling - Fixed implementation
  function handleViewportMouseDown(event: MouseEvent) {
    if (!isAltPressed || readonly) return
    
    event.preventDefault()
    event.stopPropagation()
    
    isPanning = true
    panStartX = event.clientX
    panStartY = event.clientY
    panStartPanX = panX
    panStartPanY = panY

    document.addEventListener('mousemove', handlePanMove)
    document.addEventListener('mouseup', handlePanEnd)
  }

  function handlePanMove(event: MouseEvent) {
    if (!isPanning) return

    event.preventDefault()
    
    const deltaX = event.clientX - panStartX
    const deltaY = event.clientY - panStartY
    
    panX = panStartPanX + deltaX
    panY = panStartPanY + deltaY
    
    constrainPan()
  }

  function handlePanEnd(event: MouseEvent) {
    event.preventDefault()
    isPanning = false
    
    document.removeEventListener('mousemove', handlePanMove)
    document.removeEventListener('mouseup', handlePanEnd)
  }

  // Keyboard event handlers
  function handleKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey && !isCtrlPressed) {
      isCtrlPressed = true
      showZoomCursor = true
      showPanCursor = false
    } else if (event.altKey && !isAltPressed) {
      isAltPressed = true
      showZoomCursor = false
      showPanCursor = true
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    if (!event.ctrlKey && isCtrlPressed) {
      isCtrlPressed = false
      showZoomCursor = false
    }
    if (!event.altKey && isAltPressed) {
      isAltPressed = false
      showPanCursor = false
    }
  }

  function handleWheel(event: WheelEvent) {
    if (!event.ctrlKey) return
    
    event.preventDefault()
    handleZoom(-event.deltaY, event.clientX, event.clientY)
  }

  // Touch event handlers for mobile
  let lastTouchDistance = 0
  let lastTouchCenter = { x: 0, y: 0 }

  function handleTouchStart(event: TouchEvent) {
    if (readonly) return

    if (event.touches.length === 2) {
      // Pinch to zoom
      const touch1 = event.touches[0]
      const touch2 = event.touches[1]
      
      lastTouchDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      
      lastTouchCenter = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      }
    }
  }

  function handleTouchMove(event: TouchEvent) {
    if (readonly) return

    if (event.touches.length === 2) {
      event.preventDefault()
      
      const touch1 = event.touches[0]
      const touch2 = event.touches[1]
      
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      
      const currentCenter = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      }

      // Zoom towards touch center
      if (lastTouchDistance > 0) {
        const zoomDelta = currentDistance - lastTouchDistance
        handleZoom(zoomDelta * 0.01, currentCenter.x, currentCenter.y)
      }

      // Pan
      panX += currentCenter.x - lastTouchCenter.x
      panY += currentCenter.y - lastTouchCenter.y
      constrainPan()

      lastTouchDistance = currentDistance
      lastTouchCenter = currentCenter
    }
  }

  // Handle updates from ElementToolbar
  function handleElementUpdate(event: CustomEvent) {
    if (selectedElementId) {
      console.log('Handling element update from toolbar:', event.detail)
      updateElement(selectedElementId, event.detail)
    }
  }

  // Lifecycle
  onMount(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    
    // Set initial zoom to fit screen
    setTimeout(fitToScreen, 100)
  })

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keyup', handleKeyUp)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('mousemove', handlePanMove)
    document.removeEventListener('mouseup', handlePanEnd)
  })
</script>

<div class="h-full flex">
  <!-- Canvas Viewport - Fixed size container that never changes -->
  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <!-- Zoom Controls -->
    <div class="flex items-center justify-between p-2 border-b bg-muted/30 flex-shrink-0">
      <div class="flex items-center gap-2">
        <button
          class="px-2 py-1 text-xs bg-background border rounded hover:bg-muted"
          on:click={() => handleZoom(-1)}
          disabled={readonly}
        >
          -
        </button>
        <span class="text-xs font-mono min-w-[60px] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          class="px-2 py-1 text-xs bg-background border rounded hover:bg-muted"
          on:click={() => handleZoom(1)}
          disabled={readonly}
        >
          +
        </button>
        <button
          class="px-2 py-1 text-xs bg-background border rounded hover:bg-muted"
          on:click={resetZoom}
          disabled={readonly}
        >
          Reset
        </button>
        <button
          class="px-2 py-1 text-xs bg-background border rounded hover:bg-muted"
          on:click={fitToScreen}
          disabled={readonly}
        >
          Fit
        </button>
      </div>
      
      <div class="text-xs text-muted-foreground">
        {readonly ? 'Read-only' : 'Ctrl+Wheel: Zoom • Alt+Drag: Pan'}
      </div>
    </div>

    <!-- Viewport Container - This is the fixed-size scrollable area -->
    <div 
      bind:this={viewportElement}
      class="flex-1 overflow-hidden bg-muted/20 relative"
      style="cursor: {cursorStyle}"
      on:wheel={handleWheel}
      on:mousedown={handleViewportMouseDown}
      on:touchstart={handleTouchStart}
      on:touchmove={handleTouchMove}
    >
      <!-- Canvas - This is positioned and scaled within the viewport -->
      <div 
        bind:this={canvasElement}
        class={cn(
          "absolute bg-white border-2 border-gray-300 rounded-lg shadow-lg canvas-area overflow-hidden",
          safetyZoneClass,
          readonly && 'border-muted'
        )}
        style="
          width: {canvasWidth}px; 
          height: {canvasHeight}px; 
          transform: translate({panX}px, {panY}px) scale({zoomLevel});
          transform-origin: 0 0;
        "
        on:click={handleCanvasClick}
      >
        {#each elements as element (element.id)}
          <div
            class="absolute select-none group"
            class:border-2={selectedElementId === element.id && !readonly}
            class:border-primary={selectedElementId === element.id && !readonly}
            class:border-transparent={selectedElementId !== element.id || readonly}
            class:cursor-move={!readonly && selectedElementId === element.id && !isResizing && !isPanning && !isAltPressed}
            class:cursor-pointer={!readonly && selectedElementId !== element.id && !isPanning && !isAltPressed}
            class:cursor-default={readonly || isPanning || isAltPressed}
            style="left: {element.x}px; top: {element.y}px; width: {element.width}px; height: {element.height}px; z-index: {selectedElementId === element.id ? 10 : 1};"
            on:mousedown={(e) => !readonly && !isPanning && !isAltPressed && handleMouseDown(e, element.id)}
            on:click|stopPropagation={() => !readonly && !isPanning && !isAltPressed && selectElement(element.id)}
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
            {#if selectedElementId === element.id && !readonly && !isAltPressed}
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
  </div>

  <!-- Element Toolbar - Fixed position, unaffected by zoom -->
  {#if !readonly}
    <div class="flex-shrink-0">
      <ElementToolbar 
        {selectedElementId}
        selectedElement={selectedElement}
        on:add={(e) => addElement(e.detail.type)}
        on:update={handleElementUpdate}
        on:delete={() => selectedElementId && deleteElement(selectedElementId)}
      />
    </div>
  {/if}
</div>

<style>
  /* Custom cursor styles */
  :global(.zoom-cursor) {
    cursor: zoom-in !important;
  }
  
  :global(.pan-cursor) {
    cursor: move !important;
  }

  /* Hide scrollbars but keep functionality */
  .overflow-auto::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .overflow-auto::-webkit-scrollbar-track {
    background: hsl(var(--muted));
  }
  
  .overflow-auto::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.3);
    border-radius: 4px;
  }
  
  .overflow-auto::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground) / 0.5);
  }
</style>