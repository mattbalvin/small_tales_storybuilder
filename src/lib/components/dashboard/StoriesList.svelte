<script lang="ts">
  import { onMount } from 'svelte'
  import { storiesStore, storiesService } from '$lib/stores/stories'
  import { authStore } from '$lib/stores/auth'
  import Button from '$lib/components/ui/button.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { Plus, FileEdit as Edit, Eye, Trash2, Calendar, Clock } from 'lucide-svelte'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  $: stories = $storiesStore.stories
  $: loading = $storiesStore.loading

  onMount(async () => {
    if ($authStore.user) {
      await storiesService.loadStories($authStore.user.id)
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
      orientation: 'landscape' as const
    }

    const story = await storiesService.createStory(newStory)
    console.log("storyId="+storyId)
    dispatch('edit-story', { id: story.id })
  }

  function editStory(storyId: string) {
    console.log("storyId="+storyId)
    dispatch('edit-story', { id: storyId })
  }

  function previewStory(storyId: string) {
    console.log("storyId="+storyId)
    dispatch('preview-story', { storyId })
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
          <!-- Cover Image -->
          <div class="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            {#if story.cover_image}
              <img 
                src={story.cover_image} 
                alt={story.title}
                class="w-full h-full object-cover"
              />
            {:else}
              <div class="text-center text-muted-foreground">
                <Edit class="w-12 h-12 mx-auto mb-2" />
                <p class="text-sm">No cover image</p>
              </div>
            {/if}
          </div>

          <!-- Content -->
          <div class="p-4">
            <div class="flex items-start justify-between mb-2">
              <h3 class="font-semibold text-lg truncate">{story.title}</h3>
              <span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(story.status)}">
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
              <Button variant="outline" size="sm">
                <Trash2 class="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>