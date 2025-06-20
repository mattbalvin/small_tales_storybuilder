<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { Type, Image, Volume2, Trash2, Move3d as Move3D, Palette, Eye, EyeOff, ChevronUp, ChevronDown, Layers, GripVertical } from 'lucide-svelte'

  export let selectedElementId: string | null
  export let selectedElement: any = null
  export let elements: any[] = []

  $: localElement = selectedElement
  $: localElementId = selectedElementId
  
  const dispatch = createEventDispatcher()

  // Drag and drop state
  let draggedElement: any = null
  let dragOverElement: any = null
  let isDraggingElement = false
  let dragOverPosition: 'above' | 'below' | null = null

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

  function toggleElementVisibility(elementId: string) {
    dispatch('toggle-visibility', { elementId })
  }

  function moveElementBack(elementId: string) {
    dispatch('move-back', { elementId })
  }

  function moveElementForward(elementId: string) {
    dispatch('move-forward', { elementId })
  }

  function duplicateElement(elementId: string) {
    dispatch('duplicate', { elementId })
  }

  function reorderElements(fromIndex: number, toIndex: number) {
    dispatch('reorder', { fromIndex, toIndex })
  }

  // Input handlers that validate and update immediately
  function handlePositionChange(field: 'x' | 'y' | 'width' | 'height', value: string) {
    const numValue = parseInt(value) || 0
    const constrainedValue = field === 'width' ? Math.max(50, numValue) : 
                           field === 'height' ? Math.max(30, numValue) : 
                           Math.max(0, numValue)
    
    updateElement({ [field]: constrainedValue })
  }

  function handleTextPropertyChange(property: string, value: any) {
    console.log("handleTextPropertyChange: " + property + ' => ' + value)
    if (!localElement || localElement.type !== 'text') return
    
    updateElement({
      properties: {
        ...localElement.properties,
        [property]: value
      }
    })
  }

  function handleImagePropertyChange(property: string, value: any) {
    if (!localElement || localElement.type !== 'image') return
    
    updateElement({
      properties: {
        ...localElement.properties,
        [property]: value
      }
    })
  }

  function handleAudioPropertyChange(property: string, value: any) {
    if (!localElement || localElement.type !== 'audio') return
    
    updateElement({
      properties: {
        ...localElement.properties,
        [property]: value
      }
    })
  }

  function handleAnimationChange(event: Event) {
    if (event.target instanceof HTMLSelectElement && localElement) {
      updateElement({ 
        animation: event.target.value === 'none' 
          ? null 
          : { type: event.target.value, duration: 1000 } 
      })
    }
  }

  function getElementIcon(type: string) {
    switch (type) {
      case 'text': return Type
      case 'image': return Image
      case 'audio': return Volume2
      default: return Move3D
    }
  }

  function getElementDisplayName(element: any): string {
    switch (element.type) {
      case 'text':
        const text = element.properties?.text || 'Text Element'
        return text.length > 20 ? text.substring(0, 20) + '...' : text
      case 'image':
        return element.properties?.alt || 'Image Element'
      case 'audio':
        return 'Audio Element'
      default:
        return 'Element'
    }
  }

  // Sort elements by z-index (lowest to highest z-index = bottom to top in list)
  $: sortedElements = [...elements].sort((a, b) => {
    const aZ = a.zIndex ?? 0
    const bZ = b.zIndex ?? 0
    return aZ - bZ // Lower z-index first (bottom to top in list)
  })

  // Create a reactive map of element z-indices for efficient lookups
  $: elementZIndexMap = new Map(elements.map(el => [el.id, el.zIndex ?? 0]))

  // Drag and drop handlers
  function handleDragStart(event: DragEvent, element: any) {
    if (!event.dataTransfer) return
    
    draggedElement = element
    isDraggingElement = true
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', element.id)
    
    // Add visual feedback
    if (event.target instanceof HTMLElement) {
      event.target.style.opacity = '0.5'
    }
  }

  function handleDragEnd(event: DragEvent) {
    isDraggingElement = false
    draggedElement = null
    dragOverElement = null
    dragOverPosition = null
    
    // Reset visual feedback
    if (event.target instanceof HTMLElement) {
      event.target.style.opacity = '1'
    }
  }

  function handleDragOver(event: DragEvent, element: any) {
    event.preventDefault()
    if (!draggedElement || draggedElement.id === element.id) return
    
    dragOverElement = element
    
    // Determine if we're dropping above or below the midpoint
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    dragOverPosition = event.clientY < midY ? 'above' : 'below'
    
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
  }

  function handleDragLeave(event: DragEvent) {
    // Only clear dragOverElement if we're actually leaving the element
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      dragOverElement = null
      dragOverPosition = null
    }
  }

  function handleDrop(event: DragEvent, targetElement: any) {
    event.preventDefault()
    
    if (!draggedElement || draggedElement.id === targetElement.id) return
    
    const fromIndex = sortedElements.findIndex(el => el.id === draggedElement.id)
    let toIndex = sortedElements.findIndex(el => el.id === targetElement.id)
    
    // Adjust toIndex based on drop position
    if (dragOverPosition === 'below') {
      toIndex += 1
    }
    
    // If dropping below the last element, move to end
    if (toIndex >= sortedElements.length) {
      toIndex = sortedElements.length - 1
    }
    
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      reorderElements(fromIndex, toIndex)
    }
    
    draggedElement = null
    dragOverElement = null
    dragOverPosition = null
    isDraggingElement = false
  }

  // Handle dropping above or below the list boundaries
  function handleListDragOver(event: DragEvent) {
    event.preventDefault()
    if (!draggedElement) return
    
    const listElement = event.currentTarget as HTMLElement
    const rect = listElement.getBoundingClientRect()
    
    // Check if we're above the list (move to top)
    if (event.clientY < rect.top + 20) {
      dragOverElement = 'list-top'
      dragOverPosition = 'above'
    }
    // Check if we're below the list (move to bottom)
    else if (event.clientY > rect.bottom - 20) {
      dragOverElement = 'list-bottom'
      dragOverPosition = 'below'
    }
    else {
      // We're within the list bounds, let individual elements handle it
      if (dragOverElement === 'list-top' || dragOverElement === 'list-bottom') {
        dragOverElement = null
        dragOverPosition = null
      }
    }
  }

  function handleListDrop(event: DragEvent) {
    event.preventDefault()
    
    if (!draggedElement) return
    
    const fromIndex = sortedElements.findIndex(el => el.id === draggedElement.id)
    let toIndex: number
    
    if (dragOverElement === 'list-top') {
      // Move to the beginning (lowest z-index)
      toIndex = 0
    } else if (dragOverElement === 'list-bottom') {
      // Move to the end (highest z-index)
      toIndex = sortedElements.length - 1
    } else {
      return // Not a list boundary drop
    }
    
    if (fromIndex !== -1 && fromIndex !== toIndex) {
      reorderElements(fromIndex, toIndex)
    }
    
    draggedElement = null
    dragOverElement = null
    dragOverPosition = null
    isDraggingElement = false
  }

  // Event handlers that prevent propagation and handle button clicks properly
  function handleToggleVisibility(event: MouseEvent, elementId: string) {
    event.preventDefault()
    event.stopPropagation()
    toggleElementVisibility(elementId)
  }

  function handleMoveBack(event: MouseEvent, elementId: string) {
    event.preventDefault()
    event.stopPropagation()
    moveElementBack(elementId)
  }

  function handleMoveForward(event: MouseEvent, elementId: string) {
    event.preventDefault()
    event.stopPropagation()
    moveElementForward(elementId)
  }

  function handleDeleteElement(event: MouseEvent, elementId: string) {
    event.preventDefault()
    event.stopPropagation()
    if (localElementId === elementId) {
      deleteElement()
    } else {
      dispatch('delete-element', { elementId })
    }
  }

  function handleElementClick(event: MouseEvent, elementId: string) {
    event.preventDefault()
    event.stopPropagation()
    selectElement(elementId)
  }
</script>

<aside class="w-80 border-l bg-card flex flex-col h-full">
  <div class="p-4 space-y-6 flex-1 overflow-y-auto">
    <!-- Add Elements -->
    <div>
      <h3 class="font-medium mb-3">Add Elements</h3>
      <div class="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" on:click={() => addElement('text')}>
          <Type class="w-4 h-4 mr-2" />
          Text
        </Button>
        <Button variant="outline" size="sm" on:click={() => addElement('image')}>
          <Image class="w-4 h-4 mr-2" />
          Image
        </Button>
        <Button variant="outline" size="sm" on:click={() => addElement('audio')} class="col-span-2">
          <Volume2 class="w-4 h-4 mr-2" />
          Audio
        </Button>
      </div>
    </div>

    <!-- Elements List -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-medium flex items-center gap-2">
          <Layers class="w-4 h-4" />
          Elements ({elements.length})
        </h3>
        <div class="text-xs text-muted-foreground">
          Lowest to highest
        </div>
      </div>
      
      {#if elements.length === 0}
        <div class="text-center py-8 text-muted-foreground">
          <Layers class="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p class="text-sm">No elements on this page</p>
          <p class="text-xs">Add elements to get started</p>
        </div>
      {:else}
        <div 
          class="space-y-1 max-h-64 overflow-y-auto relative"
          on:dragover={handleListDragOver}
          on:drop={handleListDrop}
        >
          <!-- Drop zone indicator for top of list -->
          {#if dragOverElement === 'list-top'}
            <div class="h-1 bg-primary rounded-full mx-2 mb-1"></div>
          {/if}
          
          {#each sortedElements as element, index (element.id)}
            {@const ElementIcon = getElementIcon(element.type)}
            {@const currentZIndex = elementZIndexMap.get(element.id) ?? 0}
            {@const isSelected = localElementId === element.id}
            {@const isDraggedOver = dragOverElement?.id === element.id}
            
            <!-- Drop indicator above element -->
            {#if isDraggedOver && dragOverPosition === 'above'}
              <div class="h-1 bg-primary rounded-full mx-2"></div>
            {/if}
            
            <div 
              class="flex items-center gap-2 p-2 rounded-md border transition-colors cursor-pointer group relative {isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted border-transparent'}"
              draggable="true"
              on:dragstart={(event) => handleDragStart(event, element)}
              on:dragend={handleDragEnd}
              on:dragover={(event) => handleDragOver(event, element)}
              on:dragleave={handleDragLeave}
              on:drop={(event) => handleDrop(event, element)}
              on:click={(event) => handleElementClick(event, element.id)}
            >
              <!-- Drag Handle -->
              <div class="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                <GripVertical class="w-4 h-4" />
              </div>

              <!-- Element Icon and Info -->
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <div class="w-6 h-6 bg-muted rounded flex items-center justify-center flex-shrink-0">
                  <svelte:component this={ElementIcon} class="w-3 h-3" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium truncate">{getElementDisplayName(element)}</p>
                  <p class="text-xs text-muted-foreground">{element.type} • z:{currentZIndex}</p>
                </div>
              </div>

              <!-- Element Controls -->
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <!-- Visibility Toggle -->
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-6 w-6 p-0"
                  on:click={(event) => handleToggleVisibility(event, element.id)}
                  title={element.hidden ? 'Show element' : 'Hide element'}
                >
                  {#if element.hidden}
                    <EyeOff class="w-3 h-3 text-muted-foreground" />
                  {:else}
                    <Eye class="w-3 h-3" />
                  {/if}
                </button>

                <!-- Z-Order Controls -->
                <div class="flex flex-col">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-3 w-6 p-0"
                    on:click={(event) => handleMoveBack(event, element.id)}
                    disabled={index === 0}
                    title="Move back"
                  >
                    <ChevronUp class="w-2 h-2" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-3 w-6 p-0"
                    on:click={(event) => handleMoveForward(event, element.id)}
                    disabled={index === sortedElements.length - 1}
                    title="Move forward"
                  >
                    <ChevronDown class="w-2 h-2" />
                  </button>
                </div>

                <!-- Delete Button -->
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-6 w-6 p-0 text-destructive hover:text-destructive"
                  on:click={(event) => handleDeleteElement(event, element.id)}
                  title="Delete element"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            </div>
            
            <!-- Drop indicator below element -->
            {#if isDraggedOver && dragOverPosition === 'below'}
              <div class="h-1 bg-primary rounded-full mx-2"></div>
            {/if}
          {/each}
          
          <!-- Drop zone indicator for bottom of list -->
          {#if dragOverElement === 'list-bottom'}
            <div class="h-1 bg-primary rounded-full mx-2 mt-1"></div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Element Properties -->
    {#if localElement}
      <Card class="p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium">Element Properties</h3>
          <Button variant="destructive" size="sm" on:click={deleteElement}>
            <Trash2 class="w-4 h-4" />
          </Button>
        </div>

        <div class="space-y-4">
          <!-- Position and Size -->
          <div>
            <h4 class="text-sm font-medium mb-2">Position & Size</h4>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-xs text-muted-foreground">X</label>
                <Input
                  type="number"
                  value={localElement.x || 0}
                  on:input={(e) => {
                    if (e.target instanceof HTMLInputElement) {
                      handlePositionChange('x', e.target.value);
                    }
                  }}
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground">Y</label>
                <Input
                  type="number"
                  value={localElement.y || 0}
                  on:input={(e) => {
                    if (e.target instanceof HTMLInputElement) {
                      handlePositionChange('y', e.target.value);
                    }
                  }}
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground">Width</label>
                <Input
                  type="number"
                  value={localElement.width || 0}
                  on:input={(e) => {
                    if (e.target instanceof HTMLInputElement) {
                      handlePositionChange('width', e.target.value);
                    }
                  }}
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground">Height</label>
                <Input
                  type="number"
                  value={localElement.height || 0}
                  on:input={(e) => {
                    if (e.target instanceof HTMLInputElement) {
                      handlePositionChange('height', e.target.value);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <!-- Z-Index Control -->
          <div>
            <h4 class="text-sm font-medium mb-2">Layer Order</h4>
            <div class="flex items-center gap-2">
              <Input
                type="number"
                value={localElement.zIndex ?? 0}
                on:input={(e) => {
                  if (e.target instanceof HTMLInputElement) {
                    const newZIndex = parseInt(e.target.value) || 0;
                    updateElement({ zIndex: Math.max(0, newZIndex) });
                  }
                }}
                class="flex-1"
              />
              <div class="flex flex-col gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  class="h-6 px-2"
                  on:click={() => moveElementBack(localElement.id)}
                  title="Move back"
                >
                  <ChevronUp class="w-3 h-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  class="h-6 px-2"
                  on:click={() => moveElementForward(localElement.id)}
                  title="Move forward"
                >
                  <ChevronDown class="w-3 h-3" />
                </Button>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              Higher values appear in front of lower values
            </p>
          </div>

          <!-- Type-specific properties -->
          {#if localElement.type === 'text'}
            <div>
              <h4 class="text-sm font-medium mb-2">Text Properties</h4>
              <div class="space-y-2">
                <div>
                  <label class="text-xs text-muted-foreground">Content</label>
                  <Input
                    value={localElement.properties?.text || ''}
                    on:input={(e) => {
                      if (e.target instanceof HTMLInputElement) {
                        handleTextPropertyChange('text', e.target.value);
                      }
                    }}
                  />
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="text-xs text-muted-foreground">Font Size</label>
                    <Input
                      type="number"
                      value={localElement.properties?.fontSize || 16}
                      on:input={(e) => {
                        if (e.target instanceof HTMLInputElement) {
                          handleTextPropertyChange('fontSize', parseInt(e.target.value) || 16);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label class="text-xs text-muted-foreground">Text Color</label>
                    <Input
                      type="color"
                      value={localElement.properties?.color || '#000000'}
                      on:input={(e) => {
                        if (e.target instanceof HTMLInputElement) {
                          handleTextPropertyChange('color', e.target.value);
                        }
                      }}
                    />
                  </div>
                </div>
                
                <!-- Background Color Section -->
                <div>
                  <label class="text-xs text-muted-foreground mb-2 block">Background</label>
                  <div class="space-y-2">
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="text-xs text-muted-foreground">Background Color</label>
                        <Input
                          type="color"
                          value={localElement.properties?.backgroundColor || '#ffffff'}
                          on:input={(e) => {
                            if (e.target instanceof HTMLInputElement) {
                              handleTextPropertyChange('backgroundColor', e.target.value);
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label class="text-xs text-muted-foreground">Opacity (%)</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={localElement.properties?.backgroundAlpha ?? 0}
                          on:input={(e) => {
                            if (e.target instanceof HTMLInputElement) {
                              const alpha = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                              handleTextPropertyChange('backgroundAlpha', alpha);
                            }
                          }}
                        />
                      </div>
                    </div>
                    
                    <!-- Background Preview -->
                    {#if localElement.properties?.backgroundColor && localElement.properties?.backgroundAlpha > 0}
                      <div class="mt-2">
                        <label class="text-xs text-muted-foreground">Preview</label>
                        <div 
                          class="w-full h-8 rounded border border-input flex items-center justify-center text-xs"
                          style="background-color: rgba({parseInt(localElement.properties.backgroundColor.slice(1, 3), 16)}, {parseInt(localElement.properties.backgroundColor.slice(3, 5), 16)}, {parseInt(localElement.properties.backgroundColor.slice(5, 7), 16)}, {(localElement.properties.backgroundAlpha || 0) / 100}); color: {localElement.properties?.color || '#000000'};"
                        >
                          Sample Text
                        </div>
                      </div>
                    {/if}
                    
                    <!-- Quick Alpha Presets -->
                    <div class="flex gap-1">
                      <button
                        type="button"
                        class="px-2 py-1 text-xs bg-background border rounded hover:bg-muted"
                        on:click={() => handleTextPropertyChange('backgroundAlpha', 0)}
                      >
                        None
                      </button>
                      <button
                        type="button"
                        class="px-2 py-1 text-xs bg-background border rounded hover:bg-muted"
                        on:click={() => handleTextPropertyChange('backgroundAlpha', 25)}
                      >
                        25%
                      </button>
                      <button
                        type="button"
                        class="px-2 py-1 text-xs bg-background border rounded hover:bg-muted"
                        on:click={() => handleTextPropertyChange('backgroundAlpha', 50)}
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        class="px-2 py-1 text-xs bg-background border rounded hover:bg-muted"
                        on:click={() => handleTextPropertyChange('backgroundAlpha', 75)}
                      >
                        75%
                      </button>
                      <button
                        type="button"
                        class="px-2 py-1 text-xs bg-background border rounded hover:bg-muted"
                        on:click={() => handleTextPropertyChange('backgroundAlpha', 100)}
                      >
                        100%
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {:else if localElement.type === 'image'}
            <div>
              <h4 class="text-sm font-medium mb-2">Image Properties</h4>
              <div class="space-y-2">
                <div>
                  <label class="text-xs text-muted-foreground">Source URL</label>
                  <Input
                    value={localElement.properties?.src || ''}
                    placeholder="https://..."
                    on:input={(e) => {
                      if (e.target instanceof HTMLInputElement) {
                        handleImagePropertyChange('src', e.target.value);
                      }
                    }}
                  />
                </div>
                <div>
                  <label class="text-xs text-muted-foreground">Alt Text</label>
                  <Input
                    value={localElement.properties?.alt || ''}
                    on:input={(e) => {
                      if (e.target instanceof HTMLInputElement) {
                        handleImagePropertyChange('alt', e.target.value);
                      }
                    }}
                  />
                </div>
                
                <!-- Opacity Control -->
                <div>
                  <label class="text-xs text-muted-foreground mb-2 block">Opacity</label>
                  <div class="space-y-2">
                    <div>
                      <label class="text-xs text-muted-foreground">Opacity (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={localElement.properties?.opacity ?? 100}
                        on:input={(e) => {
                          if (e.target instanceof HTMLInputElement) {
                            const opacity = Math.max(0, Math.min(100, parseInt(e.target.value) || 100));
                            handleImagePropertyChange('opacity', opacity);
                          }
                        }}
                      />
                    </div>
                    
                    <!-- Opacity Preview -->
                    {#if localElement.properties?.src}
                      <div class="mt-2">
                        <label class="text-xs text-muted-foreground">Preview</label>
                        <div 
                          class="w-full h-16 rounded border border-input bg-gray-100 flex items-center justify-center overflow-hidden"
                        >
                          <img 
                            src={localElement.properties.src} 
                            alt="Preview"
                            class="max-w-full max-h-full object-contain"
                            style="opacity: {(localElement.properties?.opacity ?? 100) / 100};"
                          />
                        </div>
                      </div>
                    {/if}
                    
                    <!-- Quick Opacity Presets -->
                    <div class="flex gap-1">
                      <button
                        type="button"
                        class="px-2 py-1 text-xs bg-background border rounded hover:bg-muted"
                        on:click={() => handleImagePropertyChange('opacity', 25)}
                      >
                        25%
                      </button>
                      <button
                        type="button"
                        class="px-2 py-1 text-xs bg-background border rounded hover:bg-muted"
                        on:click={() => handleImagePropertyChange('opacity', 50)}
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        class="px-2 py-1 text-xs bg-background border rounded hover:bg-muted"
                        on:click={() => handleImagePropertyChange('opacity', 75)}
                      >
                        75%
                      </button>
                      <button
                        type="button"
                        class="px-2 py-1 text-xs bg-background border rounded hover:bg-muted"
                        on:click={() => handleImagePropertyChange('opacity', 100)}
                      >
                        100%
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {:else if localElement.type === 'audio'}
            <div>
              <h4 class="text-sm font-medium mb-2">Audio Properties</h4>
              <div class="space-y-2">
                <div>
                  <label class="text-xs text-muted-foreground">Source URL</label>
                  <Input
                    value={localElement.properties?.src || ''}
                    placeholder="https://..."
                    on:input={(e) => {
                      if (e.target instanceof HTMLInputElement) {
                        handleAudioPropertyChange('src', e.target.value);
                      }
                    }}
                  />
                </div>
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localElement.properties?.autoplay || false}
                    on:change={(e) => {
                      if (e.target instanceof HTMLInputElement) {
                        handleAudioPropertyChange('autoplay', e.target.checked);
                      }
                    }}
                  />
                  <label class="text-sm">Autoplay</label>
                </div>
              </div>
            </div>
          {/if}

          <!-- Animation Properties -->
          <div>
            <h4 class="text-sm font-medium mb-2">Animation</h4>
            <select 
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={localElement.animation?.type || 'none'}
              on:change={handleAnimationChange}
            >
              <option value="none">No animation</option>
              <option value="fadeIn">Fade In</option>
              <option value="slideInLeft">Slide In Left</option>
              <option value="slideInRight">Slide In Right</option>
              <option value="bounceIn">Bounce In</option>
              <option value="scaleIn">Scale In</option>
            </select>
          </div>
        </div>
      </Card>
    {:else}
      <Card class="p-4">
        <div class="text-center text-muted-foreground">
          <Move3D class="w-8 h-8 mx-auto mb-2" />
          <p class="text-sm">Select an element to edit its properties</p>
        </div>
      </Card>
    {/if}
  </div>
</aside>