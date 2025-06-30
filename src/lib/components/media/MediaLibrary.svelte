<script lang="ts">
  import { onMount } from 'svelte'
  import { mediaStore, mediaService } from '$lib/stores/media'
  import { authStore } from '$lib/stores/auth'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import ImageGenerationModal from './ImageGenerationModal.svelte'
  import { Upload, Search, Filter, Image, Volume2, Video, Trash2, Tag, FileEdit as Edit3, Check, X, Wand2, Link, Pencil, Plus } from 'lucide-svelte'
  import { formatFileSize } from '$lib/utils'

  $: assets = $mediaStore.assets
  $: loading = $mediaStore.loading
  $: searchTerm = $mediaStore.searchTerm
  $: filterType = $mediaStore.filterType

  let fileInput: HTMLInputElement
  let uploading = false
  let editingAsset: string | null = null
  let editingTags = ''
  let editingFilename: string | null = null
  let editingFilenameValue = ''
  let showImageGeneration = false
  let showImportUrl = false
  let importUrl = ''
  let importing = false

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

  function openImageGeneration() {
    showImageGeneration = true
  }

  function openImportUrl() {
    showImportUrl = true
    importUrl = ''
  }

  function closeImportUrl() {
    showImportUrl = false
    importUrl = ''
    importing = false
  }

  async function handleImportUrl() {
    if (!importUrl.trim() || !$authStore.user) return

    importing = true

    try {
      // Validate URL format
      const url = new URL(importUrl.trim())
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Please enter a valid HTTP or HTTPS URL')
      }

      // Import the URL using the media service
      await mediaService.importFromUrl(importUrl.trim(), $authStore.user.id, ['imported-url'])
      
      // Refresh the media library
      await mediaService.loadAssets($authStore.user.id)
      
      closeImportUrl()
      alert('Media imported successfully!')
    } catch (error) {
      console.error('Import failed:', error)
      alert(`Failed to import media: ${error.message}`)
    } finally {
      importing = false
    }
  }

  function handleImagesGenerated(event: CustomEvent) {
    const { assets, count } = event.detail
    
    // Refresh the media library to show new images
    if ($authStore.user) {
      mediaService.loadAssets($authStore.user.id)
    }
    
    // Show success message
    alert(`Successfully generated and saved ${count} image${count > 1 ? 's' : ''} to your media library!`)
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
      alert('Failed to update tags. Please try again.')
    }
  }

  function startEditingFilename(asset: any) {
    editingFilename = asset.id
    // Remove file extension for editing
    const lastDotIndex = asset.filename.lastIndexOf('.')
    editingFilenameValue = lastDotIndex > 0 ? asset.filename.substring(0, lastDotIndex) : asset.filename
  }

  function cancelEditingFilename() {
    editingFilename = null
    editingFilenameValue = ''
  }

  async function saveAssetFilename(assetId: string, originalFilename: string) {
    if (!editingFilenameValue.trim()) {
      cancelEditingFilename()
      return
    }

    try {
      // Get file extension from original filename
      const lastDotIndex = originalFilename.lastIndexOf('.')
      const extension = lastDotIndex > 0 ? originalFilename.substring(lastDotIndex) : ''
      const newFilename = editingFilenameValue.trim() + extension

      await mediaService.updateAssetFilename(assetId, newFilename)
      editingFilename = null
      editingFilenameValue = ''
    } catch (error) {
      console.error('Failed to update filename:', error)
      alert('Failed to update filename. Please try again.')
    }
  }

  function addTag(assetId: string, newTag: string) {
    if (!newTag.trim()) return
    
    const asset = assets.find(a => a.id === assetId)
    if (!asset) return

    const currentTags = asset.tags || []
    if (currentTags.includes(newTag.trim())) return // Tag already exists

    const updatedTags = [...currentTags, newTag.trim()]
    mediaService.updateAssetTags(assetId, updatedTags)
  }

  function removeTag(assetId: string, tagToRemove: string) {
    const asset = assets.find(a => a.id === assetId)
    if (!asset) return

    const updatedTags = asset.tags.filter(tag => tag !== tagToRemove)
    mediaService.updateAssetTags(assetId, updatedTags)
  }

  function copyAssetUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      // Could show a toast notification here
      console.log('URL copied to clipboard')
    })
  }

  function handleTagKeydown(event: KeyboardEvent, assetId: string) {
    if (event.key === 'Enter') {
      saveAssetTags(assetId)
    } else if (event.key === 'Escape') {
      cancelEditingTags()
    }
  }

  function handleFilenameKeydown(event: KeyboardEvent, assetId: string, originalFilename: string) {
    if (event.key === 'Enter') {
      saveAssetFilename(assetId, originalFilename)
    } else if (event.key === 'Escape') {
      cancelEditingFilename()
    }
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
    <div class="flex items-center gap-2">
      <Button variant="outline" on:click={triggerFileUpload} disabled={uploading}>
        <Upload class="w-4 h-4 mr-2" />
        {uploading ? 'Uploading...' : 'Upload Files'}
      </Button>
      <Button variant="outline" on:click={openImportUrl}>
        <Link class="w-4 h-4 mr-2" />
        Import URL
      </Button>
      <Button variant="outline" on:click={openImageGeneration}>
        <Wand2 class="w-4 h-4 mr-2" />
        Generate Images
      </Button>
    </div>
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

  <!-- Import URL Modal -->
  {#if showImportUrl}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card class="w-full max-w-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Import from URL</h3>
          <Button variant="ghost" size="sm" on:click={closeImportUrl}>
            <X class="w-4 h-4" />
          </Button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium mb-2 block">Media URL</label>
            <Input
              bind:value={importUrl}
              placeholder="https://example.com/image.jpg"
              class="w-full"
              disabled={importing}
            />
            <p class="text-xs text-muted-foreground mt-1">
              Enter a direct link to an image, audio, or video file
            </p>
          </div>

          <div class="flex gap-2">
            <Button variant="outline" class="flex-1" on:click={closeImportUrl} disabled={importing}>
              Cancel
            </Button>
            <Button 
              class="flex-1" 
              on:click={handleImportUrl} 
              disabled={!importUrl.trim() || importing}
            >
              {#if importing}
                <div class="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                Importing...
              {:else}
                <Link class="w-4 h-4 mr-2" />
                Import
              {/if}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  {/if}

  <!-- Image Generation Modal -->
  <ImageGenerationModal 
    bind:show={showImageGeneration}
    on:images-generated={handleImagesGenerated}
  />

  <!-- Assets Grid -->
  {#if loading}
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {#each Array(12) as _}
        <Card class="aspect-square animate-pulse">
          <div class="w-full h-full bg-muted rounded"></div>
        </Card>
      {/each}
    </div>
  {:else if filteredAssets.length === 0}
    <Card class="p-12 text-center">
      <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Upload class="w-8 h-8 text-primary" />
      </div>
      <h2 class="text-xl font-semibold mb-2">No media files</h2>
      <p class="text-muted-foreground mb-6">Upload images, audio, or video files to get started, or generate AI images</p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <Button on:click={triggerFileUpload}>
          <Upload class="w-4 h-4 mr-2" />
          Upload Your First File
        </Button>
        <Button variant="outline" on:click={openImportUrl}>
          <Link class="w-4 h-4 mr-2" />
          Import from URL
        </Button>
        <Button variant="outline" on:click={openImageGeneration}>
          <Wand2 class="w-4 h-4 mr-2" />
          Generate AI Images
        </Button>
      </div>
    </Card>
  {:else}
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {#each filteredAssets as asset}
        <Card class="group relative overflow-hidden hover:shadow-lg transition-shadow">
          <div class="aspect-square bg-muted flex items-center justify-center relative">
            {#if asset.type === 'image'}
              <img 
                src={asset.url} 
                alt={asset.filename}
                class="w-full h-full object-cover"
              />
              
              <!-- AI Generated Badge -->
              {#if asset.tags.includes('ai-generated')}
                <div class="absolute top-2 left-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                  <Wand2 class="w-3 h-3 inline mr-1" />
                  AI
                </div>
              {/if}
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
            <!-- Filename -->
            <div class="mb-1">
              {#if editingFilename === asset.id}
                <div class="flex items-center gap-1">
                  <Input
                    bind:value={editingFilenameValue}
                    class="text-xs h-6 flex-1"
                    on:keydown={(e) => handleFilenameKeydown(e, asset.id, asset.filename)}
                    on:blur={() => saveAssetFilename(asset.id, asset.filename)}
                    autofocus
                  />
                  <Button variant="ghost" size="sm" class="h-6 w-6 p-0" on:click={() => saveAssetFilename(asset.id, asset.filename)}>
                    <Check class="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" class="h-6 w-6 p-0" on:click={cancelEditingFilename}>
                    <X class="w-3 h-3" />
                  </Button>
                </div>
              {:else}
                <div class="flex items-center justify-between group/filename">
                  <p class="text-xs font-medium truncate flex-1">{asset.filename}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    class="h-6 w-6 p-0 opacity-0 group-hover/filename:opacity-100 transition-opacity"
                    on:click={() => startEditingFilename(asset)}
                    title="Rename file"
                  >
                    <Pencil class="w-3 h-3" />
                  </Button>
                </div>
              {/if}
            </div>
            
            <p class="text-xs text-muted-foreground mb-2">{formatFileSize(asset.size)}</p>
            
            <!-- Tags -->
            <div>
              {#if editingAsset === asset.id}
                <div class="flex items-center gap-1">
                  <Input
                    bind:value={editingTags}
                    placeholder="tag1, tag2, tag3"
                    class="text-xs h-6 flex-1"
                    on:keydown={(e) => handleTagKeydown(e, asset.id)}
                    on:blur={() => saveAssetTags(asset.id)}
                    autofocus
                  />
                  <Button variant="ghost" size="sm" class="h-6 w-6 p-0" on:click={() => saveAssetTags(asset.id)}>
                    <Check class="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" class="h-6 w-6 p-0" on:click={cancelEditingTags}>
                    <X class="w-3 h-3" />
                  </Button>
                </div>
              {:else}
                <div class="flex items-center justify-between group/tags">
                  <div class="flex flex-wrap gap-1 flex-1 min-h-[20px]">
                    {#each asset.tags.slice(0, 2) as tag}
                      <button
                        class="text-xs bg-muted px-1 rounded hover:bg-destructive/20 hover:text-destructive transition-colors group/tag"
                        on:click={() => removeTag(asset.id, tag)}
                        title="Click to remove tag"
                      >
                        {tag}
                        <X class="w-2 h-2 inline ml-1 opacity-0 group-hover/tag:opacity-100" />
                      </button>
                    {/each}
                    {#if asset.tags.length > 2}
                      <span class="text-xs text-muted-foreground">+{asset.tags.length - 2}</span>
                    {/if}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    class="h-6 w-6 p-0 opacity-0 group-hover/tags:opacity-100 transition-opacity"
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