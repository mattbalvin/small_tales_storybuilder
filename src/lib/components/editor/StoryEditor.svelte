<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte'
  import { storiesStore, storiesService } from '$lib/stores/stories'
  import { authStore } from '$lib/stores/auth'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import PageEditor from './PageEditor.svelte'
  import OrientationToggle from './OrientationToggle.svelte'
  import CollaboratorManager from './CollaboratorManager.svelte'
  import { Plus, Play, Save, Settings, Users, Crown, FileEdit as Edit, Eye, Trash2, Copy, Home, Pencil, Check, X, GripVertical } from 'lucide-svelte'

  export let storyId: string

  const dispatch = createEventDispatcher()

  let currentPageIndex = 0
  let orientation: 'landscape' | 'portrait' = 'landscape'
  let showCollaborators = false
  let editingTitle = false
  let editingTitleValue = ''

  // Drag and drop state
  let draggedPageIndex: number | null = null
  let dragOverPageIndex: number | null = null
  let isDraggingPage = false
  let dragOverPosition: 'above' | 'below' | null = null

  $: story = $storiesStore.currentStory
  $: pages = $storiesStore.currentPages
  $: currentPage = pages[currentPageIndex]
  $: collaborators = $storiesStore.currentCollaborators
  $: currentStoryLoading = $storiesStore.currentStoryLoading
  $: userPermission = getUserPermissionLevel()

  // Get user permission level from collaborators
  function getUserPermissionLevel(): 'owner' | 'editor' | 'viewer' | null {
    if (!$authStore.user || !collaborators || collaborators.length === 0) {
      console.log('No user or collaborators:', { hasUser: !!$authStore.user, collaboratorsLength: collaborators?.length || 0 })
      return null
    }
    
    const userCollaboration = collaborators.find(c => c.user_id === $authStore.user!.id)
    const permission = userCollaboration?.permission_level as 'owner' | 'editor' | 'viewer' | null
    console.log('User permission found:', permission, 'for user:', $authStore.user.id)
    return permission
  }

  function navigateToDashboard() {
    window.location.hash = '#/dashboard'
  }

  function startEditingTitle() {
    if (!canEdit() || !story) return
    editingTitle = true
    editingTitleValue = story.title
  }

  function cancelEditingTitle() {
    editingTitle = false
    editingTitleValue = ''
  }

  async function saveTitle() {
    if (!story || !editingTitleValue.trim() || !canEdit()) return

    try {
      await storiesService.updateStory(story.id, {
        title: editingTitleValue.trim(),
        updated_at: new Date().toISOString()
      })
      editingTitle = false
      editingTitleValue = ''
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

  function handlePreview() {
    dispatch('preview', { pageIndex: currentPageIndex })
  }

  onMount(async () => {
    console.log('StoryEditor mounted with storyId:', storyId)
    
    if (storyId) {
      await storiesService.loadStoryPages(storyId)
    }
  })

  // Watch for pages changes and ensure currentPageIndex is valid
  $: if (pages.length > 0 && currentPageIndex >= pages.length) {
    currentPageIndex = pages.length - 1
  }

  // Reset to first page when pages are first loaded
  $: if (pages.length > 0 && currentPageIndex < 0) {
    currentPageIndex = 0
  }

  async function addNewPage() {
    if (!story || !$authStore.user || !canEdit()) {
      console.log('Cannot add page:', { hasStory: !!story, hasUser: !!$authStore.user, canEdit: canEdit() })
      return
    }

    console.log('Adding new page to story:', story.id)

    const newPage = {
      story_id: story.id,
      page_number: pages.length + 1,
      content: {
        elements: [],
        audioElements: [],
        background: null,
        animation: null
      }
    }

    try {
      await storiesService.createPage(newPage)
      currentPageIndex = pages.length - 1
      console.log('New page added successfully')
    } catch (error) {
      console.error('Failed to add new page:', error)
    }
  }

  async function duplicatePage(pageIndex: number) {
    if (!story || !$authStore.user || !canEdit() || !pages[pageIndex]) return

    const originalPage = pages[pageIndex]
    const insertPosition = pageIndex + 1 // Insert right after the current page
    
    const newPage = {
      story_id: story.id,
      page_number: insertPosition + 1, // Set page number for the insert position
      content: JSON.parse(JSON.stringify(originalPage.content)) // Deep copy
    }

    try {
      // First, shift all pages after the insert position to make room
      for (let i = pages.length - 1; i >= insertPosition; i--) {
        const page = pages[i]
        await storiesService.updatePage(page.id, { page_number: page.page_number + 1 })
      }
      
      // Create the new page
      await storiesService.createPage(newPage)
      
      // Set current page to the newly created page
      currentPageIndex = insertPosition
    } catch (error) {
      console.error('Failed to duplicate page:', error)
    }
  }

  async function deletePage(pageIndex: number) {
    if (!story || !$authStore.user || !canEdit() || !pages[pageIndex]) return

    const pageToDelete = pages[pageIndex]
    
    try {
      await storiesService.deletePage(pageToDelete.id)

      // Adjust current page index if necessary
      if (currentPageIndex >= pageIndex && currentPageIndex > 0) {
        currentPageIndex = currentPageIndex - 1
      } else if (pages.length === 1) {
        // If this was the last page, reset to 0 (will show empty state)
        currentPageIndex = 0
      }

      // Renumber remaining pages
      await renumberPages()
    } catch (error) {
      console.error('Failed to delete page:', error)
    }
  }

  async function renumberPages() {
    if (!canEdit()) return

    const updates = pages.map((page, index) => ({
      id: page.id,
      page_number: index + 1
    }))

    for (const update of updates) {
      if (pages.find(p => p.id === update.id)?.page_number !== update.page_number) {
        try {
          await storiesService.updatePage(update.id, { page_number: update.page_number })
        } catch (error) {
          console.error('Failed to renumber page:', error)
        }
      }
    }
  }

  async function saveStory() {
    if (!story || !canEdit()) return

    try {
      await storiesService.updateStory(story.id, {
        updated_at: new Date().toISOString()
      })
      console.log('Story saved successfully')
    } catch (error) {
      console.error('Failed to save story:', error)
    }
  }

  function goToPage(index: number) {
    console.log('goToPage called with index:', index, 'current pages length:', pages.length)
    const newIndex = Math.max(0, Math.min(index, pages.length - 1))
    console.log('Setting currentPageIndex to:', newIndex)
    currentPageIndex = newIndex
  }

  // Drag and drop functions for page reordering
  function handlePageDragStart(event: DragEvent, pageIndex: number) {
    if (!canEdit()) {
      event.preventDefault()
      return
    }
    
    // Set dragging state immediately
    draggedPageIndex = pageIndex
    isDraggingPage = true
    
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', pageIndex.toString())
      // Set a drag image to improve visual feedback
      if (event.target instanceof HTMLElement) {
        event.dataTransfer.setDragImage(event.target, 0, 0)
      }
    }
    
    // Add visual feedback
    if (event.target instanceof HTMLElement) {
      event.target.style.opacity = '0.5'
    }
  }

  function handlePageDragEnd(event: DragEvent) {
    // Always reset state, regardless of canEdit status
    isDraggingPage = false
    draggedPageIndex = null
    dragOverPageIndex = null
    dragOverPosition = null
    
    // Reset visual feedback
    if (event.target instanceof HTMLElement) {
      event.target.style.opacity = '1'
    }
  }

  function handlePageDragOver(event: DragEvent, pageIndex: number) {
    if (!canEdit() || !isDraggingPage || draggedPageIndex === null || draggedPageIndex === pageIndex) {
      return
    }

    // Always call preventDefault to allow the drop
    event.preventDefault()
    
    // Set dropEffect to 'move' to show the correct cursor
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    
    dragOverPageIndex = pageIndex
    
    // Determine if we're dropping above or below the midpoint
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    dragOverPosition = event.clientY < midY ? 'above' : 'below'
  }

  function handlePageDragLeave(event: DragEvent) {
    // Only clear dragOverPageIndex if we're actually leaving the element
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      dragOverPageIndex = null
      dragOverPosition = null
    }
  }

  async function handlePageDrop(event: DragEvent, targetPageIndex: number) {
    if (!canEdit() || draggedPageIndex === null || draggedPageIndex === targetPageIndex) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    let newIndex = targetPageIndex

    // Adjust newIndex based on drop position
    if (dragOverPosition === 'below') {
      newIndex += 1
    }

    // If dropping below the last page, move to end
    if (newIndex >= pages.length) {
      newIndex = pages.length - 1
    }

    // If dragging from above the target, adjust for the removal
    if (draggedPageIndex < newIndex) {
      newIndex -= 1
    }

    if (draggedPageIndex !== newIndex) {
      try {
        await reorderPages(draggedPageIndex, newIndex)
      } catch (error) {
        console.error('Failed to reorder pages:', error)
        // Reset state on error
        isDraggingPage = false
        draggedPageIndex = null
        dragOverPageIndex = null
        dragOverPosition = null
      }
    }

    // Always reset state
    isDraggingPage = false
    draggedPageIndex = null
    dragOverPageIndex = null
    dragOverPosition = null
  }

  async function reorderPages(fromIndex: number, toIndex: number) {
    if (!canEdit() || fromIndex === toIndex) return

    // Validate indices
    if (fromIndex < 0 || fromIndex >= pages.length || toIndex < 0 || toIndex >= pages.length) {
      console.error('Invalid page indices for reordering:', { fromIndex, toIndex, pagesLength: pages.length })
      return
    }

    try {
      // Create a new array with the reordered pages
      const reorderedPages = [...pages]
      const [movedPage] = reorderedPages.splice(fromIndex, 1)
      reorderedPages.splice(toIndex, 0, movedPage)

      // Update page numbers in the database
      const updatePromises = reorderedPages.map((page, i) => {
        const newPageNumber = i + 1
        if (page.page_number !== newPageNumber) {
          return storiesService.updatePage(page.id, { page_number: newPageNumber })
        }
        return Promise.resolve()
      })

      // Wait for all updates to complete
      await Promise.all(updatePromises)

      // Reload pages to get the updated order
      await storiesService.loadStoryPages(storyId)

      // Adjust current page index if the current page was moved
      if (fromIndex === currentPageIndex) {
        currentPageIndex = toIndex
      } else if (fromIndex < currentPageIndex && toIndex >= currentPageIndex) {
        currentPageIndex -= 1
      } else if (fromIndex > currentPageIndex && toIndex <= currentPageIndex) {
        currentPageIndex += 1
      }

      // Ensure currentPageIndex is within bounds
      currentPageIndex = Math.max(0, Math.min(currentPageIndex, pages.length - 1))

      console.log('Pages reordered successfully', { fromIndex, toIndex, newCurrentIndex: currentPageIndex })
    } catch (error) {
      console.error('Failed to reorder pages:', error)
      // Don't show alert, let the calling function handle the error
      throw error
    }
  }

  function canEdit(): boolean {
    const permission = getUserPermissionLevel()
    const result = permission === 'owner' || permission === 'editor'
    console.log('canEdit check:', { 
      permission, 
      result, 
      userId: $authStore.user?.id, 
      collaboratorsLength: collaborators?.length || 0,
      collaborators: collaborators?.map(c => ({ userId: c.user_id, permission: c.permission_level })) || []
    })
    return result
  }

  function canManage(): boolean {
    const permission = getUserPermissionLevel()
    return permission === 'owner'
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

  // Debug logging
  $: console.log('StoryEditor state:', {
    storyId,
    hasStory: !!story,
    storyTitle: story?.title,
    pagesCount: pages.length,
    currentPageIndex,
    currentPageId: currentPage?.id,
    userPermission,
    canEdit: canEdit(),
    canManage: canManage(),
    collaboratorsCount: collaborators?.length || 0,
    userId: $authStore.user?.id,
    collaboratorDetails: collaborators?.map(c => ({ 
      userId: c.user_id, 
      permission: c.permission_level,
      email: c.users?.email 
    })) || [],
    currentStoryLoading
  })
</script>

<div class="h-screen flex flex-col bg-white">
  <!-- Header -->
  <header class="border-b border-periwinkle-blue/20 bg-soft-buttercream px-4 py-3 flex items-center justify-between">
    <!-- Left side - Home Icon and Story Info -->
    <div class="flex items-center gap-4">
      <!-- Home Icon -->
      <Button 
        variant="outline" 
        size="sm"
        on:click={navigateToDashboard}
        title="Return to dashboard"
      >
        <Home class="w-4 h-4" />
      </Button>

      <!-- Story title and info -->
      <div class="flex items-center gap-3">
        <!-- Editable Story Title -->
        {#if editingTitle}
          <div class="flex items-center gap-2">
            <Input
              bind:value={editingTitleValue}
              on:keydown={handleTitleKeydown}
              on:blur={saveTitle}
              class="text-lg font-semibold min-w-[200px]"
              autofocus
            />
            <Button variant="ghost" size="sm" on:click={saveTitle} title="Save title">
              <Check class="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" on:click={cancelEditingTitle} title="Cancel editing">
              <X class="w-3 h-3" />
            </Button>
          </div>
        {:else}
          <div class="flex items-center gap-2 group">
            <h1 class="text-lg font-semibold text-coral-sunset">{story?.title || 'Untitled Story'}</h1>
            {#if canEdit()}
              <Button 
                variant="ghost" 
                size="sm" 
                class="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                on:click={startEditingTitle}
                title="Edit story title"
              >
                <Pencil class="w-3 h-3" />
              </Button>
            {/if}
          </div>
        {/if}

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
    </div>

    <!-- Right side - Actions -->
    <div class="flex items-center gap-2">
      <!-- Page management buttons in header - ALWAYS VISIBLE when user can edit -->
      {#if canEdit()}
        <div class="flex items-center gap-1 border rounded-md bg-background">
          <Button 
            variant="ghost" 
            size="sm" 
            on:click={addNewPage} 
            title="Add new page"
            class="rounded-r-none border-r"
          >
            <Plus class="w-4 h-4 mr-1" />
            Add Page
          </Button>
          {#if pages.length > 0 && currentPage}
            <Button 
              variant="ghost" 
              size="sm" 
              on:click={() => deletePage(currentPageIndex)}
              title="Delete current page"
              class="text-destructive hover:text-destructive rounded-l-none"
            >
              <Trash2 class="w-4 h-4 mr-1" />
              Delete
            </Button>
          {/if}
        </div>
      {/if}

      <OrientationToggle bind:orientation />
      
      {#if canEdit()}
        <Button variant="outline" size="sm" on:click={saveStory}>
          <Save class="w-4 h-4 mr-2" />
          Save
        </Button>
      {/if}
      
      <Button variant="outline" size="sm" on:click={handlePreview}>
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
    <aside class="w-16 border-r border-periwinkle-blue/20 bg-soft-buttercream p-2 flex flex-col  min-w-60">
      <div class="space-y-2 flex-1 overflow-y-auto">
        <!-- Pages Header with Add Button - ALWAYS VISIBLE -->
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-xs font-medium text-coral-sunset">Pages</h2>
          {#if canEdit()}
            <Button 
              size="sm" 
              on:click={addNewPage} 
              title="Add new page"
              class="h-6 w-6 p-0"
            >
              <Plus class="w-3 h-3" />
            </Button>
          {/if}
        </div>

        <!-- Show message when no pages exist -->
        {#if pages.length === 0}
          <Card class="p-2 text-center">
            <p class="text-xs text-muted-foreground mb-2">No pages</p>
            {#if canEdit()}
              <Button size="sm" on:click={addNewPage} class="w-full h-6 text-xs p-0">
                <Plus class="w-3 h-3" />
              </Button>
            {:else}
              <p class="text-xs text-muted-foreground">No pages</p>
            {/if}
          </Card>
        {:else}
          <!-- Pages List with Drag and Drop -->
          <div class="space-y-1 flex-1 overflow-y-auto">
            {#each pages as page, index (page.id)}
              <!-- Use a button instead of Card for better click handling -->
              <button
                class="w-full mt=1 p-1 text-center rounded-lg border bg-card text-card-foreground shadow-sm cursor-pointer transition-colors group relative {currentPageIndex === index ? 'bg-primary/10 border-primary' : 'hover:bg-muted'} {isDraggingPage && draggedPageIndex === index ? 'opacity-50' : ''}"
                draggable={canEdit()}
                on:click={(event) => {
                  // Only handle click if we haven't started dragging
                  if (!isDraggingPage && draggedPageIndex === null) {
                    console.log('Page clicked:', index, 'page id:', page.id)
                    goToPage(index)
                  }
                }}
                on:dragstart={(event) => handlePageDragStart(event, index)}
                on:dragend={handlePageDragEnd}
                on:dragover={(event) => handlePageDragOver(event, index)}
                on:dragleave={handlePageDragLeave}
                on:drop={(event) => handlePageDrop(event, index)}
                type="button"
                aria-label="Go to page {index + 1}"
              >
                <!-- Drop indicator above -->
                {#if dragOverPageIndex === index && dragOverPosition === 'above'}
                  <div class="absolute -top-1 left-0 right-0 h-1 bg-golden-apricot rounded-full"></div>
                {/if}

                <div class="flex flex-row items-center">
                  <!-- Page number -->
                  <GripVertical class="w-5 h-5 mr-1 text-dusty-teal cursor-grab flex-shrink-0" />
                  <div class="text-xs font-medium text-coral-sunset">Page {index + 1}</div>
                  
                  <!-- Page actions (show on hover) -->
                  {#if canEdit() && currentPageIndex === index}
                    <div class="mt-1 ml-auto flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        class="h-5 w-5 p-0"
                        on:click={(event) => { 
                          event.stopPropagation(); 
                          duplicatePage(index); 
                        }}
                        title="Duplicate page"
                      >
                        <Copy class="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        class="h-5 w-5 ml-auto p-0 text-destructive hover:text-destructive"
                        on:click={(event) => { 
                          event.stopPropagation(); 
                          deletePage(index); 
                        }}
                        title="Delete page"
                      >
                        <Trash2 class="w-3 h-3" />
                      </Button>
                    </div>
                  {/if}
                </div>

                <!-- Drop indicator below -->
                {#if dragOverPageIndex === index && dragOverPosition === 'below'}
                  <div class="absolute -bottom-1 left-0 right-0 h-1 bg-golden-apricot rounded-full"></div>
                {/if}
              </button>
            {/each}
          </div>

          <!-- Drag and drop instructions -->
          {#if canEdit() && pages.length > 1}
            <div class="text-xs text-muted-foreground text-center py-1 border-t">
              Drag to reorder
            </div>
          {/if}
        {/if}
      </div>

      <!-- Page management actions at bottom - ALWAYS VISIBLE -->
      {#if canEdit()}
        <div class="pt-2 border-t space-y-1">
          <Button variant="outline" size="sm" class="w-full h-7 text-xs p-0" on:click={addNewPage}>
            <Plus class="w-3 h-3" /> Add Page
          </Button>
          {#if currentPage}
            <Button variant="outline" size="sm" class="w-full h-7 text-xs p-0" on:click={() => duplicatePage(currentPageIndex)}>
              <Copy class="w-3 h-3" /> Duplicate Page
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              class="w-full h-7 text-xs p-0 text-destructive hover:text-destructive" 
              on:click={() => deletePage(currentPageIndex)}
            >
              <Trash2 class="w-3 h-3" /> Delete Page
            </Button>
          {/if}
        </div>
      {/if}
    </aside>

    <!-- Main Editor -->
    <main class="flex-1 flex min-w-0">
      <div class="flex-1 p-4 min-w-0">
        {#if currentPage}
          <PageEditor 
            page={currentPage} 
            {orientation} 
            readonly={!canEdit()}
            on:update={(event) => {
              if (canEdit()) {
                storiesService.updatePage(currentPage.id, {
                  content: event.detail.content
                })
              }
            }}
          />
        {:else if pages.length === 0}
          <div class="h-full flex items-center justify-center">
            <Card class="p-8 text-center max-w-md">
              <h2 class="text-xl font-medium mb-2 text-coral-sunset">No pages yet</h2>
              <p class="text-dusty-teal mb-4">
                {canEdit() 
                  ? 'Create your first page to start building your story'
                  : 'This story doesn\'t have any pages yet'
                }
              </p>
              {#if canEdit()}
                <Button on:click={addNewPage} class="w-full" size="lg" variant="secondary">
                  <Plus class="w-4 h-4 mr-2" />
                  Add First Page
                </Button>
              {/if}
            </Card>
          </div>
        {:else}
          <div class="h-full flex items-center justify-center">
            <Card class="p-8 text-center">
              <h2 class="text-xl font-medium mb-2 text-coral-sunset">Page not found</h2>
              <p class="text-dusty-teal mb-4">
                The selected page doesn't exist. Current index: {currentPageIndex}, Pages: {pages.length}
              </p>
              <Button on:click={() => goToPage(0)} class="w-full" variant="secondary">
                Go to First Page
              </Button>
            </Card>
          </div>
        {/if}
      </div>

      <!-- Collaborators Panel -->
      {#if showCollaborators && canManage()}
        <aside class="w-80 border-l border-periwinkle-blue/20 bg-soft-buttercream p-4">
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

<style>
  /* Custom styles for drag and drop */
  .cursor-grab {
    cursor: grab;
  }
  
  .cursor-grabbing {
    cursor: grabbing;
  }
  
  /* Smooth transitions for drag feedback */
  button[draggable="true"] {
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  
  button[draggable="true"]:hover {
    transform: translateY(-1px);
  }
</style>