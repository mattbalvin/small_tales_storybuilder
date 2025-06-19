<script lang="ts">
  import { onMount } from 'svelte'
  import { storiesStore, storiesService } from '$lib/stores/stories'
  import { mediaStore, mediaService } from '$lib/stores/media'
  import { authStore } from '$lib/stores/auth'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { Plus, FileEdit as Edit, Eye, Trash2, Calendar, Clock, AlertTriangle, Image, Upload, Check, X, Pencil } from 'lucide-svelte'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  $: stories = $storiesStore.stories
  $: loading = $storiesStore.loading
  $: mediaAssets = $mediaStore.assets

  let deletingStoryId: string | null = null
  let showDeleteConfirm = false
  let storyToDelete: any = null
  let editingStoryId: string | null = null
  let editingTitle = ''
  let showCoverSelector: string | null = null
  let fileInput: HTMLInputElement

  onMount(async () => {
    if ($authStore.user) {
      await storiesService.loadStories($authStore.user.id)
      await mediaService.loadAssets($authStore.user.id)
    }
  })

  async function createNewStory() {
    if (!$authStore.user) return

    const newStory = {
      title: 'Untitled Story',
      description: '',
      cover_image: null,
      author_id: $authStore.user.id,
      status: 'draft' as const,
      orientation: 'landscape' as const,
      age_range: '3-8 years',
      settings: {
        volume: 0.7,
        autoRead: true,
        showText: true,
        readingSpeed: 1.0
      }
    }

    const story = await storiesService.createStory(newStory)
    dispatch('edit-story', { storyId: story.id })
  }

  function editStory(storyId: string) {
    dispatch('edit-story', { storyId })
  }

  function previewStory(storyId: string) {
    dispatch('preview-story', { storyId })
  }

  function startEditingTitle(story: any) {
    editingStoryId = story.id
    editingTitle = story.title
  }

  function cancelEditingTitle() {
    editingStoryId = null
    editingTitle = ''
  }

  async function saveTitle() {
    if (!editingStoryId || !editingTitle.trim()) return

    try {
      await storiesService.updateStory(editingStoryId, {
        title: editingTitle.trim(),
        updated_at: new Date().toISOString()
      })
      editingStoryId = null
      editingTitle = ''
    } catch (error) {
      console.error('Failed to update story title:', error)
      alert('Failed to update story title. Please try again.')
    }
  }

  function handleTitleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      saveTitle()
    } else if (event.key === 'Escape') {
      cancelEditingTitle()
    }
  }

  function showCoverImageSelector(storyId: string) {
    showCoverSelector = storyId
  }

  function hideCoverImageSelector() {
    showCoverSelector = null
  }

  async function selectCoverImage(storyId: string, imageUrl: string) {
    try {
      await storiesService.updateStory(storyId, {
        cover_image: imageUrl,
        updated_at: new Date().toISOString()
      })
      showCoverSelector = null
    } catch (error) {
      console.error('Failed to update cover image:', error)
      alert('Failed to update cover image. Please try again.')
    }
  }

  async function removeCoverImage(storyId: string) {
    try {
      await storiesService.updateStory(storyId, {
        cover_image: null,
        updated_at: new Date().toISOString()
      })
      showCoverSelector = null
    } catch (error) {
      console.error('Failed to remove cover image:', error)
      alert('Failed to remove cover image. Please try again.')
    }
  }

  async function uploadCoverImage(storyId: string, file: File) {
    if (!$authStore.user) return

    try {
      const asset = await mediaService.uploadAsset(file, $authStore.user.id, ['cover-image'])
      await selectCoverImage(storyId, asset.url)
    } catch (error) {
      console.error('Failed to upload cover image:', error)
      alert('Failed to upload cover image. Please try again.')
    }
  }

  function triggerFileUpload(storyId: string) {
    fileInput.setAttribute('data-story-id', storyId)
    fileInput.click()
  }

  function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement
    const files = target.files
    const storyId = target.getAttribute('data-story-id')
    
    if (!files || !files[0] || !storyId) return

    uploadCoverImage(storyId, files[0])
    target.value = ''
  }

  function confirmDeleteStory(story: any) {
    storyToDelete = story
    showDeleteConfirm = true
  }

  function cancelDelete() {
    showDeleteConfirm = false
    storyToDelete = null
  }

  async function deleteStory() {
    if (!storyToDelete || !$authStore.user) return

    deletingStoryId = storyToDelete.id
    showDeleteConfirm = false

    try {
      await storiesService.deleteStory(storyToDelete.id)
      await storiesService.loadStories($authStore.user.id)
    } catch (error) {
      console.error('Failed to delete story:', error)
      alert('Failed to delete story. Please try again.')
    } finally {
      deletingStoryId = null
      storyToDelete = null
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString()
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100'
      case 'draft': return 'text-yellow-600 bg-yellow-100'
      case 'archived': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Filter media assets to only show images
  $: imageAssets = mediaAssets.filter(asset => asset.type === 'image')
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold">My Stories</h1>
      <p class="text-muted-foreground">Create and manage your interactive stories</p>
    </div>
    <Button on:click={createNewStory}>
      <Plus class="w-4 h-4 mr-2" />
      New Story
    </Button>
  </div>

  <!-- Hidden file input for cover image upload -->
  <input
    bind:this={fileInput}
    type="file"
    accept="image/*"
    on:change={handleFileUpload}
    class="hidden"
  />

  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each Array(6) as _}
        <Card class="p-6 animate-pulse">
          <div class="h-32 bg-gray-200 rounded mb-4"></div>
          <div class="h-4 bg-gray-200 rounded mb-2"></div>
          <div class="h-3 bg-gray-200 rounded w-2/3"></div>
        </Card>
      {/each}
    </div>
  {:else if stories.length === 0}
    <Card class="p-12 text-center">
      <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Plus class="w-8 h-8 text-primary" />
      </div>
      <h2 class="text-xl font-semibold mb-2">No stories yet</h2>
      <p class="text-muted-foreground mb-6">Start creating your first interactive story</p>
      <Button on:click={createNewStory}>
        <Plus class="w-4 h-4 mr-2" />
        Create Your First Story
      </Button>
    </Card>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each stories as story}
        <Card class="overflow-hidden hover:shadow-lg transition-shadow">
          <!-- Cover Image with Edit Overlay -->
          <div class="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative group">
            {#if story.cover_image}
              <img 
                src={story.cover_image} 
                alt={story.title}
                class="w-full h-full object-cover"
              />
            {:else}
              <div class="text-center text-muted-foreground">
                <Image class="w-12 h-12 mx-auto mb-2" />
                <p class="text-sm">No cover image</p>
              </div>
            {/if}
            
            <!-- Cover image edit overlay -->
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button 
                variant="secondary" 
                size="sm"
                on:click={() => showCoverImageSelector(story.id)}
              >
                <Image class="w-4 h-4 mr-2" />
                Change Cover
              </Button>
            </div>
          </div>

          <!-- Content -->
          <div class="p-4">
            <div class="flex items-start justify-between mb-2">
              <!-- Editable Title -->
              {#if editingStoryId === story.id}
                <div class="flex-1 flex items-center gap-2">
                  <Input
                    bind:value={editingTitle}
                    on:keydown={handleTitleKeydown}
                    on:blur={saveTitle}
                    class="text-lg font-semibold"
                    autofocus
                  />
                  <Button variant="ghost" size="sm" on:click={saveTitle}>
                    <Check class="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" on:click={cancelEditingTitle}>
                    <X class="w-3 h-3" />
                  </Button>
                </div>
              {:else}
                <div class="flex-1 flex items-center gap-2 group">
                  <h3 class="font-semibold text-lg truncate">{story.title}</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    class="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    on:click={() => startEditingTitle(story)}
                  >
                    <Pencil class="w-3 h-3" />
                  </Button>
                </div>
              {/if}
              
              <span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(story.status)} ml-2">
                {story.status}
              </span>
            </div>

            {#if story.description}
              <p class="text-sm text-muted-foreground mb-3 line-clamp-2">
                {story.description}
              </p>
            {/if}

            <!-- Metadata -->
            <div class="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              <div class="flex items-center gap-1">
                <Calendar class="w-3 h-3" />
                {formatDate(story.created_at)}
              </div>
              <div class="flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {formatDate(story.updated_at)}
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <Button variant="outline" size="sm" class="flex-1" on:click={() => editStory(story.id)}>
                <Edit class="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm" class="flex-1" on:click={() => previewStory(story.id)}>
                <Eye class="w-3 h-3 mr-1" />
                Preview
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                class="text-destructive hover:text-destructive hover:bg-destructive/10"
                on:click={() => confirmDeleteStory(story)}
                disabled={deletingStoryId === story.id}
              >
                {#if deletingStoryId === story.id}
                  <div class="w-3 h-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                {:else}
                  <Trash2 class="w-3 h-3" />
                {/if}
              </Button>
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<!-- Cover Image Selector Modal -->
{#if showCoverSelector}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <Card class="w-full max-w-4xl max-h-[80vh] overflow-hidden">
      <div class="p-6 border-b">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Select Cover Image</h3>
          <Button variant="ghost" size="sm" on:click={hideCoverImageSelector}>
            <X class="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div class="p-6 overflow-y-auto max-h-[60vh]">
        <!-- Upload new image -->
        <div class="mb-6">
          <Button on:click={() => triggerFileUpload(showCoverSelector)} class="w-full">
            <Upload class="w-4 h-4 mr-2" />
            Upload New Image
          </Button>
        </div>

        <!-- Remove current cover -->
        <div class="mb-6">
          <Button 
            variant="outline" 
            on:click={() => removeCoverImage(showCoverSelector)} 
            class="w-full"
          >
            <X class="w-4 h-4 mr-2" />
            Remove Cover Image
          </Button>
        </div>

        <!-- Existing images grid -->
        {#if imageAssets.length > 0}
          <div>
            <h4 class="font-medium mb-3">Choose from your media library</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {#each imageAssets as asset}
                <button
                  class="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                  on:click={() => selectCoverImage(showCoverSelector, asset.url)}
                >
                  <img 
                    src={asset.url} 
                    alt={asset.filename}
                    class="w-full h-full object-cover"
                  />
                </button>
              {/each}
            </div>
          </div>
        {:else}
          <div class="text-center py-8 text-muted-foreground">
            <Image class="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No images in your media library</p>
            <p class="text-sm">Upload an image to use as a cover</p>
          </div>
        {/if}
      </div>
    </Card>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm && storyToDelete}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <Card class="w-full max-w-md p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertTriangle class="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h3 class="text-lg font-semibold">Delete Story</h3>
          <p class="text-sm text-muted-foreground">This action cannot be undone</p>
        </div>
      </div>

      <div class="mb-6">
        <p class="text-sm mb-3">
          Are you sure you want to delete <strong>"{storyToDelete.title}"</strong>?
        </p>
        <div class="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <div class="flex items-start gap-2">
            <AlertTriangle class="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <div class="text-sm text-destructive">
              <p class="font-medium mb-1">This will permanently delete:</p>
              <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The story and all its content</li>
                <li>All story pages and elements</li>
                <li>All collaborator access</li>
                <li>Any analytics data</li>
              </ul>
              <p class="mt-2 font-medium">This action cannot be recovered.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <Button variant="outline" class="flex-1" on:click={cancelDelete}>
          Cancel
        </Button>
        <Button variant="destructive" class="flex-1" on:click={deleteStory}>
          <Trash2 class="w-4 h-4 mr-2" />
          Delete Story
        </Button>
      </div>
    </Card>
  </div>
{/if}