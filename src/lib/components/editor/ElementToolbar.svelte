<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { Type, Image, Volume2, Trash2, Move3d as Move3D, Palette } from 'lucide-svelte'

  export let selectedElementId: string | null
  export let selectedElement: any = null

  const dispatch = createEventDispatcher()

  // Local variables for controlled inputs
  let localX: number = 0
  let localY: number = 0
  let localWidth: number = 0
  let localHeight: number = 0
  let localText: string = ''
  let localFontSize: number = 16
  let localColor: string = '#000000'
  let localSrc: string = ''
  let localAlt: string = ''
  let localAutoplay: boolean = false

  // Update local variables when selectedElement changes
  $: if (selectedElement) {
    localX = selectedElement.x || 0
    localY = selectedElement.y || 0
    localWidth = selectedElement.width || 0
    localHeight = selectedElement.height || 0
    localText = selectedElement.properties?.text || ''
    localFontSize = selectedElement.properties?.fontSize || 16
    localColor = selectedElement.properties?.color || '#000000'
    localSrc = selectedElement.properties?.src || ''
    localAlt = selectedElement.properties?.alt || ''
    localAutoplay = selectedElement.properties?.autoplay || false
  }

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
    const target = event.target as HTMLSelectElement
    if (target && selectedElement) {
      updateElement({ 
        animation: target.value === 'none' 
          ? null 
          : { type: target.value, duration: 1000 } 
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
                value={localX}
                on:input={(e) => handlePositionChange('x', e.target.value)}
              />
            </div>
            <div>
              <label class="text-xs text-muted-foreground">Y</label>
              <Input
                type="number"
                value={localY}
                on:input={(e) => handlePositionChange('y', e.target.value)}
              />
            </div>
            <div>
              <label class="text-xs text-muted-foreground">Width</label>
              <Input
                type="number"
                value={localWidth}
                on:input={(e) => handlePositionChange('width', e.target.value)}
              />
            </div>
            <div>
              <label class="text-xs text-muted-foreground">Height</label>
              <Input
                type="number"
                value={localHeight}
                on:input={(e) => handlePositionChange('height', e.target.value)}
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
                  value={localText}
                  on:input={(e) => handleTextPropertyChange('text', e.target.value)}
                />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-xs text-muted-foreground">Font Size</label>
                  <Input
                    type="number"
                    value={localFontSize}
                    on:input={(e) => handleTextPropertyChange('fontSize', parseInt(e.target.value) || 16)}
                  />
                </div>
                <div>
                  <label class="text-xs text-muted-foreground">Color</label>
                  <Input
                    type="color"
                    value={localColor}
                    on:input={(e) => handleTextPropertyChange('color', e.target.value)}
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
                  value={localSrc}
                  placeholder="https://..."
                  on:input={(e) => handleImagePropertyChange('src', e.target.value)}
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground">Alt Text</label>
                <Input
                  value={localAlt}
                  on:input={(e) => handleImagePropertyChange('alt', e.target.value)}
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
                  value={localSrc}
                  placeholder="https://..."
                  on:input={(e) => handleAudioPropertyChange('src', e.target.value)}
                />
              </div>
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localAutoplay}
                  on:change={(e) => handleAudioPropertyChange('autoplay', e.target.checked)}
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