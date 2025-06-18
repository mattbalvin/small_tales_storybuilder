<script lang="ts">
  import { onMount } from 'svelte'
  import { storiesStore, storiesService } from '$lib/stores/stories'
  import { authStore } from '$lib/stores/auth'
  import Button from '$lib/components/ui/button.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import PageEditor from './PageEditor.svelte'
  import OrientationToggle from './OrientationToggle.svelte'
  import { Plus, Play, Save, Settings } from 'lucide-svelte'

  export let storyId: string

  let currentPageIndex = 0
  let orientation: 'landscape' | 'portrait' = 'landscape'
  let showSafetyZones = true

  $: story = $storiesStore.currentStory
  $: pages = $storiesStore.currentPages
  $: currentPage = pages[currentPageIndex]

  onMount(async () => {
    if (storyId) {
      await storiesService.loadStoryPages(storyId)
    }
  })

  async function addNewPage() {
    if (!story || !$authStore.user) return

    const newPage = {
      story_id: story.id,
      page_number: pages.length + 1,
      content: {
        elements: [],
        background: null,
        animation: null
      }
    }

    await storiesService.createPage(newPage)
    currentPageIndex = pages.length - 1
  }

  async function saveStory() {
    if (!story) return

    await storiesService.updateStory(story.id, {
      updated_at: new Date().toISOString()
    })
  }

  function goToPage(index: number) {
    currentPageIndex = Math.max(0, Math.min(index, pages.length - 1))
  }
</script>

<div class="h-screen flex flex-col bg-background">
  <!-- Header -->
  <header class="border-b bg-card px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <h1 class="text-lg font-semibold">{story?.title || 'Untitled Story'}</h1>
      <div class="text-sm text-muted-foreground">
        Page {currentPageIndex + 1} of {pages.length}
      </div>
    </div>

    <div class="flex items-center gap-2">
      <OrientationToggle bind:orientation bind:showSafetyZones />
      <Button variant="outline" size="sm" on:click={saveStory}>
        <Save class="w-4 h-4 mr-2" />
        Save
      </Button>
      <Button variant="outline" size="sm">
        <Play class="w-4 h-4 mr-2" />
        Preview
      </Button>
      <Button variant="outline" size="sm">
        <Settings class="w-4 h-4" />
      </Button>
    </div>
  </header>

  <div class="flex-1 flex">
    <!-- Sidebar -->
    <aside class="w-64 border-r bg-card p-4">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-medium">Pages</h2>
          <Button size="sm" on:click={addNewPage}>
            <Plus class="w-4 h-4" />
          </Button>
        </div>

        <div class="space-y-2">
          {#each pages as page, index}
            <Card 
              class="p-3 cursor-pointer transition-colors {currentPageIndex === index ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}"
              on:click={() => goToPage(index)}
            >
              <div class="text-sm font-medium">Page {index + 1}</div>
              <div class="text-xs text-muted-foreground">
                {page.content?.elements?.length || 0} elements
              </div>
            </Card>
          {/each}
        </div>
      </div>
    </aside>

    <!-- Main Editor -->
    <main class="flex-1 p-4">
      {#if currentPage}
        <PageEditor 
          page={currentPage} 
          {orientation} 
          {showSafetyZones}
          on:update={(event) => {
            storiesService.updatePage(currentPage.id, {
              content: event.detail.content,
              updated_at: new Date().toISOString()
            })
          }}
        />
      {:else}
        <div class="h-full flex items-center justify-center">
          <Card class="p-8 text-center">
            <h2 class="text-xl font-medium mb-2">No pages yet</h2>
            <p class="text-muted-foreground mb-4">Create your first page to start building your story</p>
            <Button on:click={addNewPage}>
              <Plus class="w-4 h-4 mr-2" />
              Add First Page
            </Button>
          </Card>
        </div>
      {/if}
    </main>
  </div>
</div>