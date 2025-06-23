<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { mediaService } from '$lib/stores/media'
  import { authStore } from '$lib/stores/auth'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import MediaSelector from './MediaSelector.svelte'
  import { Volume2, Plus, Trash2, Copy, FolderOpen, X, Music, Radio, Zap } from 'lucide-svelte'

  const dispatch = createEventDispatcher()

  export let audioElements: any[] = []
  export let triggers: string[] = []
  export let readonly = false

  let showMediaSelector = false
  let selectedAudioId: string | null = null

  function addAudioElement() {
    if (readonly) return

    const newAudioElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'audio' as const,
      properties: {
        src: '',
        volume: 100,
        isIdleLoop: false,
        playbackMode: 'random' as const,
        minDelay: 1,
        maxDelay: 5
      }
    }

    dispatch('update', {
      id: newAudioElement.id,
      updates: newAudioElement.properties
    })
  }

  function updateAudioElement(id: string, updates: any) {
    if (readonly) return
    dispatch('update', { id, updates })
  }

  function deleteAudioElement(id: string) {
    if (readonly) return
    dispatch('delete', { id })
  }

  function duplicateAudioElement(id: string) {
    if (readonly) return
    dispatch('duplicate', { id })
  }

  function openMediaSelector(audioId: string) {
    selectedAudioId = audioId
    showMediaSelector = true
  }

  function closeMediaSelector() {
    selectedAudioId = null
    showMediaSelector = false
  }

  function handleMediaSelect(event: CustomEvent) {
    const { url } = event.detail
    
    if (selectedAudioId) {
      updateAudioElement(selectedAudioId, { src: url })
    }
    
    closeMediaSelector()
  }

  async function handleSrcChange(id: string, newSrc: string) {
    if (!newSrc || !$authStore.user) return

    try {
      // Process the URL through media service (will import if external)
      const processedUrl = await mediaService.processUrlForElement(newSrc, $authStore.user.id, 'audio')
      
      // If the URL was changed (imported), update the element
      if (processedUrl !== newSrc) {
        updateAudioElement(id, { src: processedUrl })
      }
    } catch (error) {
      console.error('Failed to process audio URL:', error)
    }
  }

  function getAudioIcon(element: any) {
    if (element.properties?.isIdleLoop) {
      return Music // Background music
    } else if (element.properties?.playbackMode === 'trigger') {
      return Zap // Triggered audio
    } else {
      return Radio // Random audio
    }
  }

  function getAudioTypeLabel(element: any) {
    if (element.properties?.isIdleLoop) {
      return 'Background Loop'
    } else if (element.properties?.playbackMode === 'trigger') {
      return 'Triggered Audio'
    } else {
      return 'Random Audio'
    }
  }
</script>

{#if showMediaSelector}
  <!-- Media Selector Modal -->
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <Card class="w-full max-w-4xl h-[80vh] overflow-hidden">
      <MediaSelector 
        type="audio"
        selectedUrl=""
        on:select={handleMediaSelect}
        on:close={closeMediaSelector}
      />
    </Card>
  </div>
{/if}

<aside class="w-full border-l bg-card flex flex-col h-full">
  <div class="p-4 space-y-6 flex-1 overflow-y-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="font-medium flex items-center gap-2">
          <Volume2 class="w-4 h-4" />
          Audio Elements ({audioElements.length})
        </h3>
        <p class="text-xs text-muted-foreground">Audio elements are not positioned on the canvas</p>
      </div>
      {#if !readonly}
        <Button size="sm" on:click={addAudioElement}>
          <Plus class="w-4 h-4 mr-2" />
          Add Audio
        </Button>
      {/if}
    </div>

    <!-- Audio Elements List -->
    {#if audioElements.length === 0}
      <Card class="p-6 text-center">
        <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Volume2 class="w-6 h-6 text-primary" />
        </div>
        <h3 class="font-medium mb-2">No audio elements</h3>
        <p class="text-sm text-muted-foreground mb-4">
          {readonly ? 'This page has no audio elements' : 'Add audio elements for background music, sound effects, or narration'}
        </p>
        {#if !readonly}
          <Button size="sm" on:click={addAudioElement}>
            <Plus class="w-4 h-4 mr-2" />
            Add First Audio Element
          </Button>
        {/if}
      </Card>
    {:else}
      <div class="space-y-3">
        {#each audioElements as element (element.id)}
          {@const AudioIcon = getAudioIcon(element)}
          <Card class="p-4">
            <div class="space-y-4">
              <!-- Header -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <svelte:component this={AudioIcon} class="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p class="font-medium text-sm">{getAudioTypeLabel(element)}</p>
                    <p class="text-xs text-muted-foreground">
                      {element.properties?.src ? 'Audio configured' : 'No audio selected'}
                    </p>
                  </div>
                </div>
                
                {#if !readonly}
                  <div class="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      on:click={() => duplicateAudioElement(element.id)}
                      title="Duplicate audio element"
                    >
                      <Copy class="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      on:click={() => deleteAudioElement(element.id)}
                      title="Delete audio element"
                      class="text-destructive hover:text-destructive"
                    >
                      <Trash2 class="w-3 h-3" />
                    </Button>
                  </div>
                {/if}
              </div>

              <!-- Audio Source -->
              <div>
                <label class="text-xs text-muted-foreground mb-2 block">Audio Source</label>
                <div class="flex gap-2">
                  <Input
                    value={element.properties?.src || ''}
                    placeholder="https://... or select from media library"
                    on:input={(e) => {
                      if (e.target instanceof HTMLInputElement && !readonly) {
                        const newSrc = e.target.value
                        updateAudioElement(element.id, { src: newSrc })
                        if (newSrc) {
                          handleSrcChange(element.id, newSrc)
                        }
                      }
                    }}
                    class="flex-1"
                    disabled={readonly}
                  />
                  {#if !readonly}
                    <Button 
                      variant="outline" 
                      size="sm"
                      on:click={() => openMediaSelector(element.id)}
                      title="Select from media library"
                    >
                      <FolderOpen class="w-4 h-4" />
                    </Button>
                  {/if}
                </div>
                {#if !readonly}
                  <p class="text-xs text-muted-foreground mt-1">
                    External URLs will be automatically imported to your media library
                  </p>
                {/if}
              </div>

              <!-- Volume Control -->
              <div>
                <label class="text-xs text-muted-foreground mb-2 block">
                  Volume: {element.properties?.volume || 100}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={element.properties?.volume || 100}
                  on:input={(e) => {
                    if (e.target instanceof HTMLInputElement && !readonly) {
                      updateAudioElement(element.id, { volume: parseInt(e.target.value) })
                    }
                  }}
                  class="w-full"
                  disabled={readonly}
                />
              </div>

              <!-- Idle Loop Checkbox -->
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={element.properties?.isIdleLoop || false}
                  on:change={(e) => {
                    if (e.target instanceof HTMLInputElement && !readonly) {
                      const isIdleLoop = e.target.checked
                      updateAudioElement(element.id, { 
                        isIdleLoop,
                        // Reset other properties when switching modes
                        ...(isIdleLoop ? { actionVolume: 0 } : { playbackMode: 'random', minDelay: 1, maxDelay: 5 })
                      })
                    }
                  }}
                  disabled={readonly}
                />
                <label class="text-sm">Background Idle Loop</label>
              </div>

              <!-- Conditional Controls -->
              {#if element.properties?.isIdleLoop}
                <!-- Action Volume for Idle Loop -->
                <div>
                  <label class="text-xs text-muted-foreground mb-2 block">
                    Action Volume: {element.properties?.actionVolume || 0}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={element.properties?.actionVolume || 0}
                    on:input={(e) => {
                      if (e.target instanceof HTMLInputElement && !readonly) {
                        updateAudioElement(element.id, { actionVolume: parseInt(e.target.value) })
                      }
                    }}
                    class="w-full"
                    disabled={readonly}
                  />
                  <p class="text-xs text-muted-foreground mt-1">
                    Volume when other audio is playing
                  </p>
                </div>
              {:else}
                <!-- Playback Mode for Non-Idle Audio -->
                <div>
                  <label class="text-xs text-muted-foreground mb-2 block">Playback Mode</label>
                  <div class="space-y-3">
                    <!-- Random Mode -->
                    <div class="flex items-center gap-2">
                      <input
                        type="radio"
                        name="playback-{element.id}"
                        value="random"
                        checked={element.properties?.playbackMode === 'random'}
                        on:change={(e) => {
                          if (e.target instanceof HTMLInputElement && e.target.checked && !readonly) {
                            updateAudioElement(element.id, { 
                              playbackMode: 'random',
                              minDelay: element.properties?.minDelay || 1,
                              maxDelay: element.properties?.maxDelay || 5
                            })
                          }
                        }}
                        disabled={readonly}
                      />
                      <label class="text-sm">Random</label>
                    </div>

                    {#if element.properties?.playbackMode === 'random'}
                      <div class="ml-6 grid grid-cols-2 gap-2">
                        <div>
                          <label class="text-xs text-muted-foreground">Min Delay (seconds)</label>
                          <Input
                            type="number"
                            min="0"
                            value={element.properties?.minDelay || 1}
                            on:input={(e) => {
                              if (e.target instanceof HTMLInputElement && !readonly) {
                                updateAudioElement(element.id, { minDelay: parseInt(e.target.value) || 1 })
                              }
                            }}
                            disabled={readonly}
                          />
                        </div>
                        <div>
                          <label class="text-xs text-muted-foreground">Max Delay (seconds)</label>
                          <Input
                            type="number"
                            min="0"
                            value={element.properties?.maxDelay || 5}
                            on:input={(e) => {
                              if (e.target instanceof HTMLInputElement && !readonly) {
                                updateAudioElement(element.id, { maxDelay: parseInt(e.target.value) || 5 })
                              }
                            }}
                            disabled={readonly}
                          />
                        </div>
                      </div>
                    {/if}

                    <!-- Trigger Mode -->
                    <div class="flex items-center gap-2">
                      <input
                        type="radio"
                        name="playback-{element.id}"
                        value="trigger"
                        checked={element.properties?.playbackMode === 'trigger'}
                        on:change={(e) => {
                          if (e.target instanceof HTMLInputElement && e.target.checked && !readonly) {
                            updateAudioElement(element.id, { 
                              playbackMode: 'trigger',
                              triggerName: element.properties?.triggerName || ''
                            })
                          }
                        }}
                        disabled={readonly}
                      />
                      <label class="text-sm">On Trigger</label>
                    </div>

                    {#if element.properties?.playbackMode === 'trigger'}
                      <div class="ml-6">
                        <label class="text-xs text-muted-foreground">Trigger Name</label>
                        <select
                          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={element.properties?.triggerName || ''}
                          on:change={(e) => {
                            if (e.target instanceof HTMLSelectElement && !readonly) {
                              updateAudioElement(element.id, { triggerName: e.target.value })
                            }
                          }}
                          disabled={readonly}
                        >
                          <option value="">Select trigger...</option>
                          {#each triggers as trigger}
                            <option value={trigger}>{trigger}</option>
                          {/each}
                        </select>
                        <p class="text-xs text-muted-foreground mt-1">
                          Audio will play when this trigger is activated
                        </p>
                      </div>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          </Card>
        {/each}
      </div>
    {/if}
  </div>
</aside>