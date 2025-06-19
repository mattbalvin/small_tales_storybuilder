<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { Type, Image, Volume2, Trash2, Move3d as Move3D, Palette } from 'lucide-svelte'

  export let selectedElementId: string | null
  export let selectedElement: any = null

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
    if (!selectedElement || selectedElement.type !== 'text') return
    
    updateElement({
      properties: {
        ...selectedElement.properties,
        [property]: value
      }
    })
  }

  function handleImagePropertyChange(property: string, value: any) {
    if (!selectedElement || selectedElement.type !== 'image') return
    
    updateElement({
      properties: {
        ...selectedElement.properties,
        [property]: value
      }
    })
  }

  function handleAudioPropertyChange(property: string, value: any) {
    if (!selectedElement || selectedElement.type !== 'audio') return
    
    updateElement({
      properties: {
        ...selectedElement.properties,
        [property]: value
      }
    })
  }

  function handleAnimationChange(event: Event) {
    if (event.target instanceof HTMLSelectElement && selectedElement) {
      updateElement({ 
        animation: event.target.value === 'none' 
          ? null 
          : { type: event.target.value, duration: 1000 } 
      })
    }
  }
</script>

<aside class="w-80 border-l bg-card p-4 space-y-6">
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

  <!-- Element Properties -->
  {#if selectedElement}
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
                value={selectedElement.x || 0}
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
                value={selectedElement.y || 0}
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
                value={selectedElement.width || 0}
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
                value={selectedElement.height || 0}
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
        {#if selectedElement.type === 'text'}
          <div>
            <h4 class="text-sm font-medium mb-2">Text Properties</h4>
            <div class="space-y-2">
              <div>
                <label class="text-xs text-muted-foreground">Content</label>
                <Input
                  value={selectedElement.properties?.text || ''}
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
                    value={selectedElement.properties?.fontSize || 16}
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
                    value={selectedElement.properties?.color || '#000000'}
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
        {:else if selectedElement.type === 'image'}
          <div>
            <h4 class="text-sm font-medium mb-2">Image Properties</h4>
            <div class="space-y-2">
              <div>
                <label class="text-xs text-muted-foreground">Source URL</label>
                <Input
                  value={selectedElement.properties?.src || ''}
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
                  value={selectedElement.properties?.alt || ''}
                  on:input={(e) => {
                    if (e.target instanceof HTMLInputElement) {
                      handleImagePropertyChange('alt', e.target.value);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        {:else if selectedElement.type === 'audio'}
          <div>
            <h4 class="text-sm font-medium mb-2">Audio Properties</h4>
            <div class="space-y-2">
              <div>
                <label class="text-xs text-muted-foreground">Source URL</label>
                <Input
                  value={selectedElement.properties?.src || ''}
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
                  checked={selectedElement.properties?.autoplay || false}
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
            value={selectedElement.animation?.type || 'none'}
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
</aside>