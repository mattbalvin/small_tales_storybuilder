<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { Type, Image, Volume2, Trash2, Move3d as Move3D, Palette, Eye, EyeOff, ChevronUp, ChevronDown, Layers } from 'lucide-svelte'

  export let selectedElementId: string | null
  export let selectedElement: any = null
  export let elements: any[] = []

  $: localElement = selectedElement
  $: localElementId = selectedElementId
  
  const dispatch = createEventDispatcher()

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

  function moveElementUp(elementId: string) {
    dispatch('move-up', { elementId })
  }

  function moveElementDown(elementId: string) {
    dispatch('move-down', { elementId })
  }

  function duplicateElement(elementId: string) {
    dispatch('duplicate', { elementId })
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

  // Sort elements by z-index (higher z-index = on top)
  $: sortedElements = [...elements].sort((a, b) => {
    const aZ = a.zIndex || 0
    const bZ = b.zIndex || 0
    return bZ - aZ // Higher z-index first (top to bottom in list)
  })

  // Event handlers that prevent propagation
  function handleToggleVisibility(event: Event, elementId: string) {
    event.stopPropagation()
    toggleElementVisibility(elementId)
  }

  function handleMoveUp(event: Event, elementId: string) {
    event.stopPropagation()
    moveElementUp(elementId)
  }

  function handleMoveDown(event: Event, elementId: string) {
    event.stopPropagation()
    moveElementDown(elementId)
  }

  function handleDeleteElement(event: Event, elementId: string) {
    event.stopPropagation()
    if (localElementId === elementId) {
      deleteElement()
    } else {
      dispatch('delete-element', { elementId })
    }
  }

  function handleElementClick(event: Event, elementId: string) {
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
      </div>
      
      {#if elements.length === 0}
        <div class="text-center py-8 text-muted-foreground">
          <Layers class="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p class="text-sm">No elements on this page</p>
          <p class="text-xs">Add elements to get started</p>
        </div>
      {:else}
        <div class="space-y-1 max-h-64 overflow-y-auto">
          {#each sortedElements as element, index (element.id)}
            {@const ElementIcon = getElementIcon(element.type)}
            <div 
              class="flex items-center gap-2 p-2 rounded-md border transition-colors cursor-pointer group {localElementId === element.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted border-transparent'}"
              on:click={(event) => handleElementClick(event, element.id)}
            >
              <!-- Element Icon and Info -->
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <div class="w-6 h-6 bg-muted rounded flex items-center justify-center flex-shrink-0">
                  <svelte:component this={ElementIcon} class="w-3 h-3" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium truncate">{getElementDisplayName(element)}</p>
                  <p class="text-xs text-muted-foreground">{element.type}</p>
                </div>
              </div>

              <!-- Element Controls -->
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <!-- Visibility Toggle -->
                <button
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
                    class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-3 w-6 p-0"
                    on:click={(event) => handleMoveUp(event, element.id)}
                    disabled={index === 0}
                    title="Move to front"
                  >
                    <ChevronUp class="w-2 h-2" />
                  </button>
                  <button
                    class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-3 w-6 p-0"
                    on:click={(event) => handleMoveDown(event, element.id)}
                    disabled={index === sortedElements.length - 1}
                    title="Move to back"
                  >
                    <ChevronDown class="w-2 h-2" />
                  </button>
                </div>

                <!-- Delete Button -->
                <button
                  class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-6 w-6 p-0 text-destructive hover:text-destructive"
                  on:click={(event) => handleDeleteElement(event, element.id)}
                  title="Delete element"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            </div>
          {/each}
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
                    <label class="text-xs text-muted-foreground">Color</label>
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