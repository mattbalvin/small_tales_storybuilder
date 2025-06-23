<script lang="ts">
  import { onMount } from 'svelte'
  import { mediaStore, mediaService } from '$lib/stores/media'
  import { authStore } from '$lib/stores/auth'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { Search, Upload, Image, Volume2, Video, X, Check } from 'lucide-svelte'
  import { createEventDispatcher } from 'svelte'
  import { formatFileSize } from '$lib/utils'

  const dispatch = createEventDispatcher()

  export let type: 'image' | 'audio' | 'video' | 'all' = 'all'
  export let selectedUrl: string = ''

  $: assets = $mediaStore.assets
  $: loading = $mediaStore.loading
  $: searchTerm = $mediaStore.searchTerm

  let fileInput: HTMLInputElement
  let uploading = false

  onMount(async () => {
    if ($authStore.user) {
      await mediaService.loadAssets($authStore.user.id)
    }
  })

  // Filter assets based on type and search
  $: filteredAssets = assets.filter(asset => {
    const matchesType = type === 'all' || asset.type === type
    const matchesSearch = asset.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesType && matchesSearch
  })

  async function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement
    const files = target.files
    
    if (!files || !$authStore.user) return

    uploading = true

    try {
      for (const file of Array.from(files)) {
        // Check if file type matches the selector type
        if (type !== 'all') {
          const fileType = file.type.startsWith('image/') ? 'image' : 
                          file.type.startsWith('audio/') ? 'audio' : 'video'
          if (fileType !== type) continue
        }
        
        await mediaService.uploadAsset(file, $authStore.user.id, [`editor-${type}`])
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      uploading = false
      target.value = ''
    }
  }

  function triggerFileUpload() {
    fileInput.click()
  }

  function selectAsset(asset: any) {
    dispatch('select', { 
      url: asset.url, 
      filename: asset.filename,
      type: asset.type,
      alt: asset.filename 
    })
  }

  function getFileIcon(assetType: string) {
    if (assetType === 'image') return Image
    if (assetType === 'audio') return Volume2
    if (assetType === 'video') return Video
    return Image
  }

  function getAcceptTypes() {
    switch (type) {
      case 'image': return 'image/*'
      case 'audio': return 'audio/*'
      case 'video': return 'video/*'
      default: return 'image/*,audio/*,video/*'
    }
  }

  function getTypeLabel() {
    switch (type) {
      case 'image': return 'Images'
      case 'audio': return 'Audio Files'
      case 'video': return 'Video Files'
      default: return 'Media Files'
    }
  }
</script>

<div class="flex flex-col h-full">
  <!-- Header -->
  <div class="p-4 border-b">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Select {getTypeLabel()}</h3>
      <Button variant="outline" size="sm" on:click={() => dispatch('close')}>
        <X class="w-4 h-4" />
      </Button>
    </div>

    <!-- Search and Upload -->
    <div class="flex gap-2 mb-4">
      <div class="flex-1 relative">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search {getTypeLabel().toLowerCase()}..."
          value={searchTerm}
          on:input={(e) => mediaService.setSearchTerm(e.target.value)}
          class="pl-10"
        />
      </div>
      <Button on:click={triggerFileUpload} disabled={uploading} size="sm">
        <Upload class="w-4 h-4 mr-2" />
        {uploading ? 'Uploading...' : 'Upload'}
      </Button>
    </div>

    <!-- Hidden file input -->
    <input
      bind:this={fileInput}
      type="file"
      multiple
      accept={getAcceptTypes()}
      on:change={handleFileUpload}
      class="hidden"
    />
  </div>

  <!-- Assets Grid -->
  <div class="flex-1 overflow-y-auto p-4">
    {#if loading}
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {#each Array(8) as _}
          <Card class="aspect-square animate-pulse">
            <div class="w-full h-full bg-gray-200 rounded"></div>
          </Card>
        {/each}
      </div>
    {:else if filteredAssets.length === 0}
      <Card class="p-8 text-center">
        <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload class="w-8 h-8 text-primary" />
        </div>
        <h3 class="text-lg font-semibold mb-2">No {getTypeLabel().toLowerCase()}</h3>
        <p class="text-muted-foreground mb-4">
          {searchTerm ? `No ${getTypeLabel().toLowerCase()} match your search.` : `Upload ${getTypeLabel().toLowerCase()} to get started.`}
        </p>
        <Button on:click={triggerFileUpload} disabled={uploading}>
          <Upload class="w-4 h-4 mr-2" />
          Upload {getTypeLabel()}
        </Button>
      </Card>
    {:else}
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {#each filteredAssets as asset}
          <Card class="group relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
            <button
              class="w-full h-full"
              on:click={() => selectAsset(asset)}
            >
              <div class="aspect-square bg-gray-100 flex items-center justify-center relative">
                {#if asset.type === 'image'}
                  <img 
                    src={asset.url} 
                    alt={asset.filename}
                    class="w-full h-full object-cover"
                  />
                {:else}
                  <svelte:component this={getFileIcon(asset.type)} class="w-8 h-8 text-muted-foreground" />
                {/if}
                
                <!-- Selected indicator -->
                {#if selectedUrl === asset.url}
                  <div class="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Check class="w-5 h-5 text-primary-foreground" />
                    </div>
                  </div>
                {/if}

                <!-- Hover overlay -->
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="secondary" size="sm">
                    Select
                  </Button>
                </div>
              </div>

              <!-- Info -->
              <div class="p-2 text-left">
                <p class="text-xs font-medium truncate">{asset.filename}</p>
                <p class="text-xs text-muted-foreground">{formatFileSize(asset.size)}</p>
                {#if asset.tags.length > 0}
                  <div class="flex flex-wrap gap-1 mt-1">
                    {#each asset.tags.slice(0, 2) as tag}
                      <span class="text-xs bg-muted px-1 rounded">{tag}</span>
                    {/each}
                    {#if asset.tags.length > 2}
                      <span class="text-xs text-muted-foreground">+{asset.tags.length - 2}</span>
                    {/if}
                  </div>
                {/if}
              </div>
            </button>
          </Card>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Footer -->
  <div class="p-4 border-t bg-muted/30">
    <div class="flex items-center justify-between text-sm text-muted-foreground">
      <span>{filteredAssets.length} {getTypeLabel().toLowerCase()}</span>
      <span>Click to select • Upload new files with the upload button</span>
    </div>
  </div>
</div>