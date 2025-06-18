<script lang="ts">
  import { storiesStore, storiesService } from '$lib/stores/stories'
  import { authStore } from '$lib/stores/auth'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { Users, Plus, Trash2, Crown, Edit, Eye, Mail } from 'lucide-svelte'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  export let storyId: string

  $: collaborators = $storiesStore.currentCollaborators
  $: currentUser = $authStore.user
  $: userPermission = currentUser ? storiesService.getUserPermissionLevel(currentUser.id) : null

  let inviteEmail = ''
  let invitePermission: 'editor' | 'viewer' = 'editor'
  let inviting = false
  let inviteError = ''

  async function inviteCollaborator() {
    if (!inviteEmail.trim()) {
      inviteError = 'Please enter an email address'
      return
    }

    inviting = true
    inviteError = ''

    try {
      await storiesService.inviteCollaborator(storyId, inviteEmail.trim(), invitePermission)
      inviteEmail = ''
      dispatch('collaborator-added')
    } catch (error: any) {
      inviteError = error.message || 'Failed to invite collaborator'
    } finally {
      inviting = false
    }
  }

  async function removeCollaborator(userId: string) {
    if (confirm('Are you sure you want to remove this collaborator?')) {
      try {
        await storiesService.removeCollaborator(storyId, userId)
        dispatch('collaborator-removed')
      } catch (error) {
        console.error('Failed to remove collaborator:', error)
      }
    }
  }

  async function updatePermission(userId: string, newPermission: 'owner' | 'editor' | 'viewer') {
    try {
      await storiesService.updateCollaboratorPermission(storyId, userId, newPermission)
      dispatch('permission-updated')
    } catch (error) {
      console.error('Failed to update permission:', error)
    }
  }

  function getPermissionIcon(permission: string) {
    switch (permission) {
      case 'owner': return Crown
      case 'editor': return Edit
      case 'viewer': return Eye
      default: return Users
    }
  }

  function getPermissionColor(permission: string) {
    switch (permission) {
      case 'owner': return 'text-yellow-600'
      case 'editor': return 'text-blue-600'
      case 'viewer': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  function canManageCollaborators(): boolean {
    return userPermission === 'owner'
  }

  function canRemoveCollaborator(collaborator: any): boolean {
    if (!currentUser) return false
    
    // Owners can remove anyone except themselves
    if (userPermission === 'owner') {
      return collaborator.user_id !== currentUser.id
    }
    
    return false
  }

  function canChangePermission(collaborator: any): boolean {
    if (!currentUser) return false
    
    // Only owners can change permissions
    if (userPermission === 'owner') {
      // Can't change own permission
      return collaborator.user_id !== currentUser.id
    }
    
    return false
  }
</script>

<Card class="p-6">
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-2">
      <Users class="w-5 h-5" />
      <h3 class="text-lg font-semibold">Collaborators</h3>
      <span class="text-sm text-muted-foreground">({collaborators.length})</span>
    </div>
  </div>

  <!-- Invite new collaborator -->
  {#if canManageCollaborators()}
    <div class="mb-6 p-4 bg-muted/50 rounded-lg">
      <h4 class="text-sm font-medium mb-3">Invite Collaborator</h4>
      <div class="flex gap-2">
        <div class="flex-1">
          <Input
            type="email"
            placeholder="Enter email address"
            bind:value={inviteEmail}
            disabled={inviting}
          />
        </div>
        <select 
          class="rounded-md border border-input bg-background px-3 py-2 text-sm"
          bind:value={invitePermission}
          disabled={inviting}
        >
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <Button on:click={inviteCollaborator} disabled={inviting || !inviteEmail.trim()}>
          {#if inviting}
            <div class="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
          {:else}
            <Plus class="w-4 h-4 mr-2" />
          {/if}
          Invite
        </Button>
      </div>
      {#if inviteError}
        <p class="text-sm text-destructive mt-2">{inviteError}</p>
      {/if}
    </div>
  {/if}

  <!-- Collaborators list -->
  <div class="space-y-3">
    {#each collaborators as collaborator}
      {@const PermissionIcon = getPermissionIcon(collaborator.permission_level)}
      <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            {#if collaborator.users?.avatar_url}
              <img 
                src={collaborator.users.avatar_url} 
                alt={collaborator.users.full_name || collaborator.users.email}
                class="w-8 h-8 rounded-full object-cover"
              />
            {:else}
              <span class="text-sm font-medium text-primary">
                {(collaborator.users?.full_name || collaborator.users?.email || '?').charAt(0).toUpperCase()}
              </span>
            {/if}
          </div>
          <div>
            <p class="font-medium">
              {collaborator.users?.full_name || 'Unknown User'}
              {#if collaborator.user_id === currentUser?.id}
                <span class="text-sm text-muted-foreground">(You)</span>
              {/if}
            </p>
            <p class="text-sm text-muted-foreground">{collaborator.users?.email}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Permission display/selector -->
          {#if canChangePermission(collaborator)}
            <select 
              class="rounded-md border border-input bg-background px-2 py-1 text-sm"
              value={collaborator.permission_level}
              on:change={(e) => updatePermission(collaborator.user_id, e.target.value)}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="owner">Owner</option>
            </select>
          {:else}
            <div class="flex items-center gap-1 px-2 py-1 rounded text-sm {getPermissionColor(collaborator.permission_level)}">
              <svelte:component this={PermissionIcon} class="w-3 h-3" />
              <span class="capitalize">{collaborator.permission_level}</span>
            </div>
          {/if}

          <!-- Remove button -->
          {#if canRemoveCollaborator(collaborator)}
            <Button 
              variant="destructive" 
              size="sm"
              on:click={() => removeCollaborator(collaborator.user_id)}
            >
              <Trash2 class="w-3 h-3" />
            </Button>
          {/if}
        </div>
      </div>
    {/each}

    {#if collaborators.length === 0}
      <div class="text-center py-8 text-muted-foreground">
        <Users class="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No collaborators yet</p>
        {#if canManageCollaborators()}
          <p class="text-sm">Invite others to collaborate on this story</p>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Permission levels explanation -->
  <div class="mt-6 pt-4 border-t">
    <h4 class="text-sm font-medium mb-2">Permission Levels</h4>
    <div class="space-y-1 text-xs text-muted-foreground">
      <div class="flex items-center gap-2">
        <Crown class="w-3 h-3 text-yellow-600" />
        <span><strong>Owner:</strong> Full access, can manage collaborators and delete story</span>
      </div>
      <div class="flex items-center gap-2">
        <Edit class="w-3 h-3 text-blue-600" />
        <span><strong>Editor:</strong> Can edit story content and pages</span>
      </div>
      <div class="flex items-center gap-2">
        <Eye class="w-3 h-3 text-gray-600" />
        <span><strong>Viewer:</strong> Can view story but not edit</span>
      </div>
    </div>
  </div>
</Card>