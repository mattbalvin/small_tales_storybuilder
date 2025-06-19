<script lang="ts">
  import { onMount } from 'svelte'
  import { storiesStore, storiesService } from '$lib/stores/stories'
  import { authStore } from '$lib/stores/auth'
  import Button from '$lib/components/ui/button.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import PageEditor from './PageEditor.svelte'
  import OrientationToggle from './OrientationToggle.svelte'
  import CollaboratorManager from './CollaboratorManager.svelte'
  import { Plus, Play, Save, Settings, Users, Crown, FileEdit as Edit, Eye, Trash2, Copy } from 'lucide-svelte'

  export let storyId: string

  let currentPageIndex = 0
  let orientation: 'landscape' | 'portrait' = 'landscape'
  let showSafetyZones = true
  let showCollaborators = false

  $: story = $storiesStore.currentStory
  $: pages = $storiesStore.currentPages
  $: currentPage = pages[currentPageIndex]
  $: userPermission = $authStore.user ? storiesService.getUserPermissionLevel($authStore.user.id) : null

  onMount(async () => {
    if (storyId) {
      await storiesService.loadStoryPages(storyId)
      
      // If no pages exist, create a default blank page
      if ($storiesStore.currentPages.length === 0 && canEdit()) {
        await createDefaultPage()
      }
    }
  })

  // Watch for pages changes and ensure currentPageIndex is valid
  $: if (pages.length > 0 && currentPageIndex >= pages.length) {
    currentPageIndex = pages.length - 1
  }

  async function createDefaultPage() {
    if (!story || !$authStore.user || !canEdit()) return

    const defaultPage = {
      story_id: story.id,
      page_number: 1,
      content: {
        elements: [],
        background: null,
        animation: null
      }
    }

    await storiesService.createPage(defaultPage)
    currentPageIndex = 0
  }

  async function addNewPage() {
    if (!story || !$authStore.user || !canEdit()) return

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

  async function duplicatePage(pageIndex: number) {
    if (!story || !$authStore.user || !canEdit() || !pages[pageIndex]) return

    const originalPage = pages[pageIndex]
    const newPage = {
      story_id: story.id,
      page_number: pages.length + 1,
      content: JSON.parse(JSON.stringify(originalPage.content)) // Deep copy
    }

    await storiesService.createPage(newPage)
    currentPageIndex = pages.length - 1
  }

  async function deletePage(pageIndex: number) {
    if (!story || !$authStore.user || !canEdit() || !pages[pageIndex] || pages.length <= 1) return

    if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return
    }

    const pageToDelete = pages[pageIndex]
    await storiesService.deletePage(pageToDelete.id)

    // Adjust current page index if necessary
    if (currentPageIndex >= pageIndex && currentPageIndex > 0) {
      currentPageIndex = currentPageIndex - 1
    }

    // Renumber remaining pages
    await renumberPages()
  }

  async function renumberPages() {
    if (!canEdit()) return

    const updates = pages.map((page, index) => ({
      id: page.id,
      page_number: index + 1
    }))

    for (const update of updates) {
      if (pages.find(p => p.id === update.id)?.page_number !== update.page_number) {
        await storiesService.updatePage(update.id, { page_number: update.page_number })
      }
    }
  }

  async function saveStory() {
    if (!story || !canEdit()) return

    await storiesService.updateStory(story.id, {
      updated_at: new Date().toISOString()
    })
  }

  function goToPage(index: number) {
    currentPageIndex = Math.max(0, Math.min(index, pages.length - 1))
  }

  function canEdit(): boolean {
    return userPermission === 'owner' || userPermission === 'editor'
  }

  function canManage(): boolean {
    return userPermission === 'owner'
  }

  function getPermissionIcon(permission: string | null) {
    switch (permission) {
      case 'owner': return Crown
      case 'editor': return Edit
      case 'viewer': return Eye
      default: return Eye
    }
  }

  function getPermissionColor(permission: string | null) {
    switch (permission) {
      case 'owner': return 'text-yellow-600'
      case 'editor': return 'text-blue-600'
      case 'viewer': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }
</script>

<div class="h-screen flex flex-col bg-background">
  <!-- Header -->
  <header class="border-b bg-card px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <h1 class="text-lg font-semibold">{story?.title || 'Untitled Story'}</h1>
      <div class="text-sm text-muted-foreground">
        Page {pages.length > 0 ? currentPageIndex + 1 : 0} of {pages.length}
      </div>
      
      <!-- User permission indicator -->
      {#if userPermission}
        {@const PermissionIcon = getPermissionIcon(userPermission)}
        <div class="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs {getPermissionColor(userPermission)}">
          <svelte:component this={PermissionIcon} class="w-3 h-3" />
          <span class="capitalize">{userPermission}</span>
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-2">
      <OrientationToggle bind:orientation bind:showSafetyZones />
      
      {#if canEdit()}
        <Button variant="outline" size="sm" on:click={saveStory}>
          <Save class="w-4 h-4 mr-2" />
          Save
        </Button>
      {/if}
      
      <Button variant="outline" size="sm">
        <Play class="w-4 h-4 mr-2" />
        Preview
      </Button>
      
      {#if canManage()}
        <Button 
          variant="outline" 
          size="sm"
          on:click={() => showCollaborators = !showCollaborators}
        >
          <Users class="w-4 h-4 mr-2" />
          Collaborators
        </Button>
      {/if}
      
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
          {#if canEdit()}
            <Button size="sm" on:click={addNewPage}>
              <Plus class="w-4 h-4" />
            </Button>
          {/if}
        </div>

        <div class="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {#each pages as page, index}
            <Card 
              class="p-3 cursor-pointer transition-colors group relative {currentPageIndex === index ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}"
              on:click={() => goToPage(index)}
            >
              <div class="text-sm font-medium">Page {index + 1}</div>
              <div class="text-xs text-muted-foreground">
                {page.content?.elements?.length || 0} elements
              </div>
              
              <!-- Page actions (show on hover) -->
              {#if canEdit()}
                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    class="h-6 w-6 p-0"
                    on:click|stopPropagation={() => duplicatePage(index)}
                    title="Duplicate page"
                  >
                    <Copy class="w-3 h-3" />
                  </Button>
                  {#if pages.length > 1}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      class="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      on:click|stopPropagation={() => deletePage(index)}
                      title="Delete page"
                    >
                      <Trash2 class="w-3 h-3" />
                    </Button>
                  {/if}
                </div>
              {/if}
            </Card>
          {/each}
        </div>

        <!-- Page management actions -->
        {#if canEdit() && pages.length > 0}
          <div class="pt-2 border-t space-y-2">
            <Button variant="outline" size="sm" class="w-full" on:click={addNewPage}>
              <Plus class="w-4 h-4 mr-2" />
              Add Page
            </Button>
            {#if currentPage}
              <Button variant="outline" size="sm" class="w-full" on:click={() => duplicatePage(currentPageIndex)}>
                <Copy class="w-4 h-4 mr-2" />
                Duplicate Current
              </Button>
            {/if}
          </div>
        {/if}
      </div>
    </aside>

    <!-- Main Editor -->
    <main class="flex-1 flex">
      <div class="flex-1 p-4">
        {#if currentPage}
          <PageEditor 
            page={currentPage} 
            {orientation} 
            {showSafetyZones}
            readonly={!canEdit()}
            on:update={(event) => {
              if (canEdit()) {
                storiesService.updatePage(currentPage.id, {
                  content: event.detail.content,
                  updated_at: new Date().toISOString()
                })
              }
            }}
          />
        {:else if pages.length === 0}
          <div class="h-full flex items-center justify-center">
            <Card class="p-8 text-center">
              <h2 class="text-xl font-medium mb-2">No pages yet</h2>
              <p class="text-muted-foreground mb-4">
                {canEdit() 
                  ? 'Create your first page to start building your story'
                  : 'This story doesn\'t have any pages yet'
                }
              </p>
              {#if canEdit()}
                <Button on:click={addNewPage}>
                  <Plus class="w-4 h-4 mr-2" />
                  Add First Page
                </Button>
              {/if}
            </Card>
          </div>
        {:else}
          <div class="h-full flex items-center justify-center">
            <Card class="p-8 text-center">
              <h2 class="text-xl font-medium mb-2">Page not found</h2>
              <p class="text-muted-foreground mb-4">
                The selected page doesn't exist.
              </p>
              <Button on:click={() => goToPage(0)}>
                Go to First Page
              </Button>
            </Card>
          </div>
        {/if}
      </div>

      <!-- Collaborators Panel -->
      {#if showCollaborators && canManage()}
        <aside class="w-80 border-l bg-card p-4">
          <CollaboratorManager 
            {storyId}
            on:collaborator-added={() => {
              // Refresh collaborators list
              if ($authStore.user) {
                storiesService.loadSingleStory(storyId, $authStore.user.id)
              }
            }}
            on:collaborator-removed={() => {
              // Refresh collaborators list
              if ($authStore.user) {
                storiesService.loadSingleStory(storyId, $authStore.user.id)
              }
            }}
            on:permission-updated={() => {
              // Refresh collaborators list
              if ($authStore.user) {
                storiesService.loadSingleStory(storyId, $authStore.user.id)
              }
            }}
          />
        </aside>
      {/if}
    </main>
  </div>
</div>