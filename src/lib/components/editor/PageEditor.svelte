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

  // Smooth drag/resize state
  let activeElementDOM: HTMLElement | null = null
  let animationFrameId: number | null = null
  let currentVisualX = 0
  let currentVisualY = 0
  let currentVisualWidth = 0
  let currentVisualHeight = 0

  // Separate zoom and pan state for each orientation
  let viewState = {
    landscape: {
      zoomLevel: 1,
      panX: 0,
      panY: 0
    },
    portrait: {
      zoomLevel: 1,
      panX: 0,
      panY: 0
    }
  }

  // Current view state (reactive to orientation)
  $: currentViewState = viewState[orientation]
  $: zoomLevel = currentViewState.zoomLevel
  $: panX = currentViewState.panX
  $: panY = currentViewState.panY

  // Pan state
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

  // Get elements from the page content - this is the source of truth
  $: elements = page.content?.elements || []

  // Create display elements with layout-specific properties for current orientation
  $: displayElements = elements.map(element => {
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
  })

  // Reactive statement to get selected element
  $: selectedElement = selectedElementId ? displayElements.find(el => el.id === selectedElementId) : null

  $: aspectRatio = orientation === 'landscape' ? '16/9' : '9/16'
  $: safetyZoneClass = showSafetyZones 
    ? (orientation === 'landscape' ? 'safety-zone-16-9' : 'safety-zone-9-16')
    : ''

  // Canvas dimensions (logical size)
  $: canvasWidth = orientation === 'landscape' ? 1600 : 900
  $: canvasHeight = orientation === 'landscape' ? 900 : 1600

  // Cursor styles based on key states
  $: cursorStyle = isCtrlPressed ? 'zoom-in' : isAltPressed ? 'move' : 'default'

  // Sort elements by z-index for rendering (lower z-index renders first, higher z-index on top)
  $: sortedElements = [...displayElements].sort((a, b) => {
    const aZ = a.zIndex || 0
    const bZ = b.zIndex || 0
    return aZ - bZ
  })

  // Watch for orientation changes and update view state
  $: if (orientation) {
    // When orientation changes, ensure we have proper view state
    if (!viewState[orientation]) {
      viewState[orientation] = {
        zoomLevel: 1,
        panX: 0,
        panY: 0
      }
    }
    
    // Fit to screen for the new orientation if it's at default values
    if (viewState[orientation].zoomLevel === 1 && 
        viewState[orientation].panX === 0 && 
        viewState[orientation].panY === 0) {
      // Delay to ensure viewport is ready
      setTimeout(() => fitToScreenForOrientation(orientation), 100)
    }
  }

  function updateViewState(updates: Partial<typeof currentViewState>) {
    viewState = {
      ...viewState,
      [orientation]: {
        ...viewState[orientation],
        ...updates
      }
    }
  }

  function updatePageContent() {
    console.log(`=== updatePageContent called for ${orientation} ===`)
    
    // Create the new content structure
    const newContent = {
      ...page.content,
      elements: elements // Use the current elements array as-is
    }
    
    console.log(`Dispatching page content update for ${orientation}`)
    
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
    
    // Find the highest z-index and add 1
    const maxZIndex = displayElements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0)
    
    // Calculate default position based on orientation
    const defaultX = orientation === 'landscape' ? 50 : 30
    const defaultY = orientation === 'landscape' ? 50 : 80
    const defaultWidth = orientation === 'landscape' 
      ? (type === 'text' ? 300 : 200) 
      : (type === 'text' ? 250 : 150)
    const defaultHeight = orientation === 'landscape' 
      ? (type === 'text' ? 100 : 150) 
      : (type === 'text' ? 120 : 180)
    
    const newElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      properties: type === 'text' 
        ? { text: 'New text element', fontSize: orientation === 'landscape' ? 16 : 14, color: '#000000' }
        : type === 'image'
        ? { src: '', alt: '', opacity: 100 }
        : { src: '', autoplay: false },
      layouts: {
        landscape: {
          x: orientation === 'landscape' ? defaultX : 50,
          y: orientation === 'landscape' ? defaultY : 50,
          width: orientation === 'landscape' ? defaultWidth : 300,
          height: orientation === 'landscape' ? defaultHeight : 100,
          zIndex: maxZIndex + 1,
          hidden: false
        },
        portrait: {
          x: orientation === 'portrait' ? defaultX : 30,
          y: orientation === 'portrait' ? defaultY : 80,
          width: orientation === 'portrait' ? defaultWidth : 250,
          height: orientation === 'portrait' ? defaultHeight : 120,
          zIndex: maxZIndex + 1,
          hidden: false
        }
      }
    }

    // Add to elements array
    elements = [...elements, newElement]
    selectedElementId = newElement.id
    updatePageContent()
  }

  function selectElement(id: string) {
    if (readonly || isPanning) return
    selectedElementId = id
    console.log('Selected element:', id)
  }

  function updateElement(id: string, updates: any) {
    if (readonly) return
    
    console.log('=== updateElement called ===')
    console.log('Element ID:', id)
    console.log('Updates:', updates)
    console.log('Current orientation:', orientation)
    
    // Check if this is a layout property update
    const layoutProps = ['x', 'y', 'width', 'height', 'zIndex', 'hidden']
    const isLayoutUpdate = Object.keys(updates).some(key => layoutProps.includes(key))
    
    if (isLayoutUpdate) {
      console.log('This is a layout update')
      
      // Update layout properties for current orientation
      elements = elements.map(el => {
        if (el.id === id) {
          // Ensure layouts object exists
          const existingLayouts = el.layouts || { 
            landscape: { x: 50, y: 50, width: 200, height: 100, zIndex: 0, hidden: false },
            portrait: { x: 30, y: 80, width: 250, height: 120, zIndex: 0, hidden: false }
          }
          
          const currentLayout = existingLayouts[orientation] || {}
          
          const updatedLayoutData = {
            ...currentLayout,
            ...updates
          }
          
          const updatedLayouts = {
            ...existingLayouts,
            [orientation]: updatedLayoutData
          }
          
          console.log(`Updated ${orientation} layout for element ${id}:`, updatedLayoutData)
          
          const updatedElement = {
            ...el,
            layouts: updatedLayouts
          }
          
          console.log('Full updated element:', updatedElement)
          return updatedElement
        }
        return el
      })
    } else {
      console.log('This is a content property update')
      
      // Update shared content properties
      elements = elements.map(el => {
        if (el.id === id) {
          return { ...el, ...updates }
        }
        return el
      })
    }
    
    // Force reactivity by triggering page content update
    updatePageContent()
    
    // Force a re-render by updating the selected element reference
    if (selectedElementId === id) {
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

  function toggleElementVisibility(id: string) {
    if (readonly) return
    
    const element = displayElements.find(el => el.id === id)
    if (element) {
      updateElement(id, { hidden: !element.hidden })
    }
  }

  function moveElementBack(id: string) {
    if (readonly) return
    
    const element = displayElements.find(el => el.id === id)
    if (!element) return
    
    // Find the next lower z-index
    const lowerElements = displayElements.filter(el => (el.zIndex || 0) < (element.zIndex || 0))
    if (lowerElements.length === 0) return // Already at bottom
    
    const nextZIndex = Math.max(...lowerElements.map(el => el.zIndex || 0))
    const elementAtNextLevel = displayElements.find(el => (el.zIndex || 0) === nextZIndex)
    
    if (elementAtNextLevel) {
      // Swap z-indices
      updateElement(id, { zIndex: nextZIndex })
      updateElement(elementAtNextLevel.id, { zIndex: element.zIndex || 0 })
    }
  }

  function moveElementForward(id: string) {
    if (readonly) return
    
    const element = displayElements.find(el => el.id === id)
    if (!element) return
    
    // Find the next higher z-index
    const higherElements = displayElements.filter(el => (el.zIndex || 0) > (element.zIndex || 0))
    if (higherElements.length === 0) return // Already at top
    
    const nextZIndex = Math.min(...higherElements.map(el => el.zIndex || 0))
    const elementAtNextLevel = displayElements.find(el => (el.zIndex || 0) === nextZIndex)
    
    if (elementAtNextLevel) {
      // Swap z-indices
      updateElement(id, { zIndex: nextZIndex })
      updateElement(elementAtNextLevel.id, { zIndex: element.zIndex || 0 })
    }
  }
  
  function duplicateElement(id: string) {
    if (readonly) return
    
    const element = elements.find(el => el.id === id)
    if (!element) return
    
    const maxZIndex = displayElements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0)
    
    // Get current layout data for the orientation
    const currentLayoutData = element.layouts?.[orientation] || {}
    
    const duplicatedElement = {
      ...element,
      id: Math.random().toString(36).substr(2, 9),
      layouts: {
        ...element.layouts,
        [orientation]: {
          ...currentLayoutData,
          x: (currentLayoutData.x || 0) + 20,
          y: (currentLayoutData.y || 0) + 20,
          zIndex: maxZIndex + 1
        }
      }
    }
    
    elements = [...elements, duplicatedElement]
    selectedElementId = duplicatedElement.id
    updatePageContent()
  }

  function reorderElements(fromIndex: number, toIndex: number) {
    if (readonly) return
    
    // Get the sorted elements array (by z-index, lowest first)
    const sortedByZIndex = [...displayElements].sort((a, b) => {
      const aZ = a.zIndex || 0
      const bZ = b.zIndex || 0
      return aZ - bZ
    })
    
    // Move element from fromIndex to toIndex
    const [movedElement] = sortedByZIndex.splice(fromIndex, 1)
    sortedByZIndex.splice(toIndex, 0, movedElement)
    
    // Reassign z-indices based on new order (lowest z-index = index 0)
    sortedByZIndex.forEach((element, index) => {
      updateElement(element.id, { zIndex: index })
    })
  }

  function copyElementToOtherOrientation(id: string) {
    if (readonly) return
    
    const element = elements.find(el => el.id === id)
    if (!element) return
    
    const otherOrientation = orientation === 'landscape' ? 'portrait' : 'landscape'
    const currentLayout = element.layouts?.[orientation] || {}
    const otherLayout = element.layouts?.[otherOrientation] || {}
    
    // Scale element position and size for the other orientation
    const scaleX = otherOrientation === 'landscape' ? (1600 / 900) : (900 / 1600)
    const scaleY = otherOrientation === 'landscape' ? (900 / 1600) : (1600 / 900)
    
    const scaledLayout = {
      x: Math.round((currentLayout.x || 0) * scaleX),
      y: Math.round((currentLayout.y || 0) * scaleY),
      width: Math.round((currentLayout.width || 0) * scaleX),
      height: Math.round((currentLayout.height || 0) * scaleY),
      zIndex: otherLayout.zIndex || 0,
      hidden: false
    }
    
    // Update the element's layout for the other orientation
    elements = elements.map(el => {
      if (el.id === id) {
        return {
          ...el,
          layouts: {
            ...el.layouts,
            [otherOrientation]: scaledLayout
          }
        }
      }
      return el
    })
    
    updatePageContent()
    
    console.log(`Copied element to ${otherOrientation} orientation with scaled dimensions`)
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
      
      // Update zoom level and pan for current orientation
      const newPanX = mouseX - canvasMouseX * newZoom
      const newPanY = mouseY - canvasMouseY * newZoom
      
      updateViewState({
        zoomLevel: newZoom,
        panX: newPanX,
        panY: newPanY
      })
      
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
        
        const newPanX = centerX - canvasPointX * newZoom
        const newPanY = centerY - canvasPointY * newZoom
        
        updateViewState({
          zoomLevel: newZoom,
          panX: newPanX,
          panY: newPanY
        })
        
        constrainPan()
      } else {
        updateViewState({ zoomLevel: newZoom })
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

    // Apply constraints and update view state
    const constrainedPanX = Math.max(minPanX, Math.min(maxPanX, panX))
    const constrainedPanY = Math.max(minPanY, Math.min(maxPanY, panY))
    
    if (constrainedPanX !== panX || constrainedPanY !== panY) {
      updateViewState({
        panX: constrainedPanX,
        panY: constrainedPanY
      })
    }
  }

  function resetZoom() {
    updateViewState({
      zoomLevel: 1,
      panX: 0,
      panY: 0
    })
  }

  function fitToScreen() {
    fitToScreenForOrientation(orientation)
  }

  function fitToScreenForOrientation(targetOrientation: 'landscape' | 'portrait') {
    if (!viewportElement) return

    const viewportRect = viewportElement.getBoundingClientRect()
    const targetCanvasWidth = targetOrientation === 'landscape' ? 1600 : 900
    const targetCanvasHeight = targetOrientation === 'landscape' ? 900 : 1600
    
    const scaleX = viewportRect.width / targetCanvasWidth
    const scaleY = viewportRect.height / targetCanvasHeight
    
    const newZoomLevel = Math.min(scaleX, scaleY) * 0.9 // 90% to leave some margin
    
    // Center the canvas in the viewport
    const newPanX = (viewportRect.width - targetCanvasWidth * newZoomLevel) / 2
    const newPanY = (viewportRect.height - targetCanvasHeight * newZoomLevel) / 2
    
    // Update view state for the target orientation
    viewState = {
      ...viewState,
      [targetOrientation]: {
        zoomLevel: newZoomLevel,
        panX: newPanX,
        panY: newPanY
      }
    }
  }

  // Smooth visual update function
  function updateElementVisuals() {
    if (!activeElementDOM || (!isDragging && !isResizing)) return

    // Apply visual changes directly to DOM
    activeElementDOM.style.left = `${currentVisualX}px`
    activeElementDOM.style.top = `${currentVisualY}px`
    activeElementDOM.style.width = `${currentVisualWidth}px`
    activeElementDOM.style.height = `${currentVisualHeight}px`
  }

  // Mouse event handlers for dragging and resizing
  function handleMouseDown(event: MouseEvent, elementId: string) {
    if (readonly || isPanning || isAltPressed) return
    
    event.preventDefault()
    event.stopPropagation()
    
    const element = displayElements.find(el => el.id === elementId)
    if (!element) return

    selectedElementId = elementId
    
    // Store reference to the DOM element
    activeElementDOM = event.currentTarget as HTMLElement
    
    // Initialize visual state with current element values
    currentVisualX = element.x
    currentVisualY = element.y
    currentVisualWidth = element.width
    currentVisualHeight = element.height
    
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
      
      // Calculate offset relative to the element's position on canvas
      // Get the canvas rectangle and account for zoom and pan
      const canvasRect = getCanvasRect()
      
      // Calculate the mouse position relative to the canvas coordinate system
      const canvasMouseX = (event.clientX - canvasRect.left - panX) / zoomLevel
      const canvasMouseY = (event.clientY - canvasRect.top - panY) / zoomLevel
      
      // Calculate offset from element's top-left corner
      dragOffset = {
        x: canvasMouseX - element.x,
        y: canvasMouseY - element.y
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(event: MouseEvent) {
    if (!selectedElementId || !activeElementDOM) return

    const element = displayElements.find(el => el.id === selectedElementId)
    if (!element) return

    const canvasRect = getCanvasRect()

    if (isDragging) {
      // Calculate new position relative to canvas, accounting for zoom and pan
      const canvasMouseX = (event.clientX - canvasRect.left - panX) / zoomLevel
      const canvasMouseY = (event.clientY - canvasRect.top - panY) / zoomLevel
      
      const newX = Math.max(0, Math.min(
        canvasMouseX - dragOffset.x,
        canvasWidth - element.width
      ))
      const newY = Math.max(0, Math.min(
        canvasMouseY - dragOffset.y,
        canvasHeight - element.height
      ))
      
      // Update visual state
      currentVisualX = Math.round(newX)
      currentVisualY = Math.round(newY)
      
      // Cancel any pending animation frame and request a new one
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      animationFrameId = requestAnimationFrame(updateElementVisuals)
      
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

      // Update visual state
      currentVisualX = Math.round(newX)
      currentVisualY = Math.round(newY)
      currentVisualWidth = Math.round(newWidth)
      currentVisualHeight = Math.round(newHeight)
      
      // Cancel any pending animation frame and request a new one
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      animationFrameId = requestAnimationFrame(updateElementVisuals)
    }
  }

  function handleMouseUp() {
    // Cancel any pending animation frame
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    
    // Update Svelte state with final values
    if (selectedElementId && (isDragging || isResizing)) {
      const updates: any = {}
      
      if (isDragging) {
        updates.x = currentVisualX
        updates.y = currentVisualY
      }
      
      if (isResizing) {
        updates.x = currentVisualX
        updates.y = currentVisualY
        updates.width = currentVisualWidth
        updates.height = currentVisualHeight
      }
      
      console.log('Final update for element:', selectedElementId, 'in orientation:', orientation, 'updates:', updates)
      updateElement(selectedElementId, updates)
    }
    
    // Clear inline styles to let Svelte take back control
    if (activeElementDOM) {
      activeElementDOM.style.left = ''
      activeElementDOM.style.top = ''
      activeElementDOM.style.width = ''
      activeElementDOM.style.height = ''
      activeElementDOM = null
    }
    
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
    
    const newPanX = panStartPanX + deltaX
    const newPanY = panStartPanY + deltaY
    
    updateViewState({
      panX: newPanX,
      panY: newPanY
    })
    
    // constrainPan()
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
      const newPanX = panX + (currentCenter.x - lastTouchCenter.x)
      const newPanY = panY + (currentCenter.y - lastTouchCenter.y)
      
      updateViewState({
        panX: newPanX,
        panY: newPanY
      })
      
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

  function handleElementSelect(event: CustomEvent) {
    selectedElementId = event.detail.elementId
  }

  function handleToggleVisibility(event: CustomEvent) {
    toggleElementVisibility(event.detail.elementId)
  }

  function handleMoveBack(event: CustomEvent) {
    moveElementBack(event.detail.elementId)
  }

  function handleMoveForward(event: CustomEvent) {
    moveElementForward(event.detail.elementId)
  }

  function handleDuplicate(event: CustomEvent) {
    duplicateElement(event.detail.elementId)
  }

  function handleDeleteElement(event: CustomEvent) {
    deleteElement(event.detail.elementId)
  }

  function handleReorder(event: CustomEvent) {
    reorderElements(event.detail.fromIndex, event.detail.toIndex)
  }

  function handleCopyToOtherOrientation(event: CustomEvent) {
    copyElementToOtherOrientation(event.detail.elementId)
  }

  // Lifecycle
  onMount(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    
    // Set initial zoom to fit screen for current orientation
    setTimeout(() => fitToScreenForOrientation(orientation), 100)
  })

  onDestroy(() => {
    // Clean up any pending animation frames
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keyup', handleKeyUp)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('mousemove', handlePanMove)
    document.removeEventListener('mouseup', handlePanEnd)
  })

  // Update position and size properties in the toolbar during drag/resize operations
  $: if (selectedElement && (isDragging || isResizing)) {
    // Update the selected element's position/size values in real-time for the toolbar
    const updatedElement = {
      ...selectedElement,
      x: currentVisualX,
      y: currentVisualY,
      width: currentVisualWidth,
      height: currentVisualHeight
    }
    
    // Update the selectedElement reference without triggering a full page update
    selectedElement = updatedElement
  }
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
        {readonly ? 'Read-only' : 'Ctrl+Wheel: Zoom • Alt+Drag: Pan'} • {orientation} ({canvasWidth}×{canvasHeight})
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
        {#each sortedElements as element (element.id)}
          <div
            class="absolute select-none group"
            class:border-2={selectedElementId === element.id && !readonly}
            class:border-primary={selectedElementId === element.id && !readonly}
            class:border-transparent={selectedElementId !== element.id || readonly}
            class:cursor-move={!readonly && selectedElementId === element.id && !isResizing && !isPanning && !isAltPressed}
            class:cursor-pointer={!readonly && selectedElementId !== element.id && !isPanning && !isAltPressed}
            class:cursor-default={readonly || isPanning || isAltPressed}
            class:opacity-30={element.hidden}
            style="
              left: {(isDragging || isResizing) && selectedElementId === element.id ? currentVisualX : element.x}px; 
              top: {(isDragging || isResizing) && selectedElementId === element.id ? currentVisualY : element.y}px; 
              width: {isResizing && selectedElementId === element.id ? currentVisualWidth : element.width}px; 
              height: {isResizing && selectedElementId === element.id ? currentVisualHeight : element.height}px; 
              z-index: {element.zIndex || 0};
            "
            on:mousedown={(e) => !readonly && !isPanning && !isAltPressed && handleMouseDown(e, element.id)}
            on:click|stopPropagation={() => !readonly && !isPanning && !isAltPressed && selectElement(element.id)}
          >
            {#if !element.hidden}
              {#if element.type === 'text'}
                <TextElement 
                  {element} 
                  {readonly}
                  on:update={(e) => !readonly && updateElement(element.id, { properties: { ...element.properties, ...e.detail.properties } })} 
                />
              {:else if element.type === 'image'}
                <ImageElement 
                  {element} 
                  on:update={(e) => !readonly && updateElement(element.id, { properties: { ...element.properties, ...e.detail.properties } })} 
                />
              {:else if element.type === 'audio'}
                <AudioElement 
                  {element} 
                  on:update={(e) => !readonly && updateElement(element.id, { properties: { ...element.properties, ...e.detail.properties } })} 
                />
              {/if}
            {:else}
              <!-- Hidden element placeholder -->
              <div class="w-full h-full border-2 border-dashed border-muted-foreground/30 bg-muted/10 flex items-center justify-center">
                <span class="text-xs text-muted-foreground">Hidden</span>
              </div>
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
        {#if displayElements.length === 0}
          <div class="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
            <div class="text-center">
              <p class="text-lg font-medium mb-2">Empty {orientation} layout</p>
              <p class="text-sm">
                {readonly ? 'This layout has no content' : 'Add elements using the toolbar'}
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
        elements={displayElements}
        {orientation}
        on:add={(e) => addElement(e.detail.type)}
        on:update={handleElementUpdate}
        on:delete={() => selectedElementId && deleteElement(selectedElementId)}
        on:select={handleElementSelect}
        on:toggle-visibility={handleToggleVisibility}
        on:move-back={handleMoveBack}
        on:move-forward={handleMoveForward}
        on:duplicate={handleDuplicate}
        on:delete-element={handleDeleteElement}
        on:reorder={handleReorder}
        on:copy-to-other-orientation={handleCopyToOtherOrientation}
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