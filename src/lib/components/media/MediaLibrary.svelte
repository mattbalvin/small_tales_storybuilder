<script lang="ts">
  import { onMount } from 'svelte'
  import { mediaStore, mediaService } from '$lib/stores/media'
  import { authStore } from '$lib/stores/auth'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { Upload, Search, Filter, Image, Volume2, Video, Trash2, Tag, FileEdit as Edit3, Check, X } from 'lucide-svelte'
  import { formatFileSize } from '$lib/utils'

  $: assets = $mediaStore.assets
  $: loading = $mediaStore.loading
  $: searchTerm = $mediaStore.searchTerm
  $: filterType = $mediaStore.filterType

  let fileInput: HTMLInputElement
  let uploading = false
  let editingAsset: string | null = null
  let editingTags = ''

  onMount(async () => {
    if ($authStore.user) {
      await mediaService.loadAssets($authStore.user.id)
    }
  })

  async function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement
    const files = target.files
    
    if (!files || !$authStore.user) return

    uploading = true

    try {
      for (const file of Array.from(files)) {
        await mediaService.uploadAsset(file, $authStore.user.id)
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

  function getFileIcon(type: string) {
    if (type === 'image') return Image
    if (type === 'audio') return Volume2
    if (type === 'video') return Video
    return Image
  }

  function startEditingTags(asset: any) {
    editingAsset = asset.id
    editingTags = asset.tags.join(', ')
  }

  function cancelEditingTags() {
    editingAsset = null
    editingTags = ''
  }

  async function saveAssetTags(assetId: string) {
    try {
      const tags = editingTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      await mediaService.updateAssetTags(assetId, tags)
      editingAsset = null
      editingTags = ''
    } catch (error) {
      console.error('Failed to update tags:', error)
    }
  }

  function copyAssetUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      // Could show a toast notification here
      console.log('URL copied to clipboard')
    })
  }

  $: filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === 'all' || asset.type === filterType
    return matchesSearch && matchesType
  })
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold">Media Library</h1>
      <p class="text-muted-foreground">Manage your images, audio, and video assets</p>
    </div>
    <Button on:click={triggerFileUpload} disabled={uploading}>
      <Upload class="w-4 h-4 mr-2" />
      {uploading ? 'Uploading...' : 'Upload Files'}
    </Button>
  </div>

  <!-- Search and Filter -->
  <div class="flex gap-4 mb-6">
    <div class="flex-1 relative">
      <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Search files..."
        value={searchTerm}
        on:input={(e) => mediaService.setSearchTerm(e.target.value)}
        class="pl-10"
      />
    </div>
    
    <select 
      class="rounded-md border border-input bg-background px-3 py-2 text-sm"
      value={filterType}
      on:change={(e) => mediaService.setFilterType(e.target.value)}
    >
      <option value="all">All Files</option>
      <option value="image">Images</option>
      <option value="audio">Audio</option>
      <option value="video">Video</option>
    </select>
  </div>

  <!-- Hidden file input -->
  <input
    bind:this={fileInput}
    type="file"
    multiple
    accept="image/*,audio/*,video/*"
    on:change={handleFileUpload}
    class="hidden"
  />

  <!-- Assets Grid -->
  {#if loading}
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {#each Array(12) as _}
        <Card class="aspect-square animate-pulse">
          <div class="w-full h-full bg-gray-200 rounded"></div>
        </Card>
      {/each}
    </div>
  {:else if filteredAssets.length === 0}
    <Card class="p-12 text-center">
      <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Upload class="w-8 h-8 text-primary" />
      </div>
      <h2 class="text-xl font-semibold mb-2">No media files</h2>
      <p class="text-muted-foreground mb-6">Upload images, audio, or video files to get started</p>
      <Button on:click={triggerFileUpload}>
        <Upload class="w-4 h-4 mr-2" />
        Upload Your First File
      </Button>
    </Card>
  {:else}
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {#each filteredAssets as asset}
        <Card class="group relative overflow-hidden hover:shadow-lg transition-shadow">
          <div class="aspect-square bg-gray-100 flex items-center justify-center">
            {#if asset.type === 'image'}
              <img 
                src={asset.url} 
                alt={asset.filename}
                class="w-full h-full object-cover"
              />
            {:else}
              <svelte:component this={getFileIcon(asset.type)} class="w-8 h-8 text-muted-foreground" />
            {/if}
          </div>
          
          <!-- Overlay -->
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div class="flex gap-2">
              <Button variant="secondary" size="sm" on:click={() => copyAssetUrl(asset.url)} title="Copy URL">
                Copy URL
              </Button>
              <Button variant="destructive" size="sm" on:click={() => mediaService.deleteAsset(asset.id)}>
                <Trash2 class="w-3 h-3" />
              </Button>
            </div>
          </div>

          <!-- Info -->
          <div class="p-2">
            <p class="text-xs font-medium truncate">{asset.filename}</p>
            <p class="text-xs text-muted-foreground">{formatFileSize(asset.size)}</p>
            
            <!-- Tags -->
            <div class="mt-1">
              {#if editingAsset === asset.id}
                <div class="flex items-center gap-1">
                  <Input
                    bind:value={editingTags}
                    placeholder="tag1, tag2, tag3"
                    class="text-xs h-6"
                    on:keydown={(e) => {
                      if (e.key === 'Enter') {
                        saveAssetTags(asset.id)
                      } else if (e.key === 'Escape') {
                        cancelEditingTags()
                      }
                    }}
                  />
                  <Button variant="ghost" size="sm" class="h-6 w-6 p-0" on:click={() => saveAssetTags(asset.id)}>
                    <Check class="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" class="h-6 w-6 p-0" on:click={cancelEditingTags}>
                    <X class="w-3 h-3" />
                  </Button>
                </div>
              {:else}
                <div class="flex items-center justify-between">
                  <div class="flex flex-wrap gap-1">
                    {#each asset.tags.slice(0, 2) as tag}
                      <span class="text-xs bg-muted px-1 rounded">{tag}</span>
                    {/each}
                    {#if asset.tags.length > 2}
                      <span class="text-xs text-muted-foreground">+{asset.tags.length - 2}</span>
                    {/if}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    class="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    on:click={() => startEditingTags(asset)}
                    title="Edit tags"
                  >
                    <Tag class="w-3 h-3" />
                  </Button>
                </div>
              {/if}
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>