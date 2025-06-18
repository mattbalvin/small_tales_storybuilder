import { writable } from 'svelte/store'
import { supabase } from '../config/supabase'
import type { Database } from '../types/database'

type Story = Database['public']['Tables']['stories']['Row']
type StoryPage = Database['public']['Tables']['story_pages']['Row']
type StoryCollaborator = Database['public']['Tables']['story_collaborators']['Row']

interface StoriesState {
  stories: Story[]
  currentStory: Story | null
  currentPages: StoryPage[]
  currentCollaborators: StoryCollaborator[]
  loading: boolean
  currentStoryLoading: boolean
}

const initialState: StoriesState = {
  stories: [],
  currentStory: null,
  currentPages: [],
  currentCollaborators: [],
  loading: false,
  currentStoryLoading: false
}

export const storiesStore = writable<StoriesState>(initialState)

export const storiesService = {
  async loadStories(userId: string) {
    storiesStore.update(state => ({ ...state, loading: true }))
    
    // Load stories where user is a collaborator (including owned stories)
    const { data: stories, error } = await supabase
      .from('stories')
      .select(`
        *,
        story_collaborators!inner(
          permission_level,
          accepted_at
        )
      `)
      .eq('story_collaborators.user_id', userId)
      .not('story_collaborators.accepted_at', 'is', null)
      .order('updated_at', { ascending: false })

    if (error) throw error

    storiesStore.update(state => ({
      ...state,
      stories: stories || [],
      loading: false
    }))
  },

  async loadSingleStory(storyId: string, userId: string) {
    storiesStore.update(state => ({ ...state, currentStoryLoading: true }))
    
    try {
      console.log('Loading story:', storyId, 'for user:', userId)
      
      // Load story with collaborator information
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select(`
          *,
          story_collaborators!inner(
            permission_level,
            accepted_at
          )
        `)
        .eq('id', storyId)
        .eq('story_collaborators.user_id', userId)
        .not('story_collaborators.accepted_at', 'is', null)
        .single()

      if (storyError) {
        console.error('Story access error:', storyError)
        storiesStore.update(state => ({
          ...state,
          currentStory: null,
          currentStoryLoading: false
        }))
        throw new Error(`You don't have access to this story: ${storyError.message}`)
      }

      if (!storyData) {
        storiesStore.update(state => ({
          ...state,
          currentStory: null,
          currentStoryLoading: false
        }))
        throw new Error('Story not found or access denied')
      }

      // Load all collaborators for this story
      const { data: collaborators, error: collabError } = await supabase
        .from('story_collaborators')
        .select(`
          *,
          users(
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('story_id', storyId)
        .not('accepted_at', 'is', null)

      if (collabError) {
        console.warn('Failed to load collaborators:', collabError)
      }

      storiesStore.update(state => ({
        ...state,
        currentStory: storyData,
        currentCollaborators: collaborators || [],
        currentStoryLoading: false
      }))

      console.log('Story loaded successfully:', storyData)
      console.log('User permission level:', storyData.story_collaborators[0]?.permission_level)
      return storyData
    } catch (error) {
      console.error('Error in loadSingleStory:', error)
      storiesStore.update(state => ({
        ...state,
        currentStory: null,
        currentStoryLoading: false
      }))
      throw error
    }
  },

  async createStory(story: Database['public']['Tables']['stories']['Insert']) {
    const { data, error } = await supabase
      .from('stories')
      .insert(story)
      .select()
      .single()

    if (error) throw error

    storiesStore.update(state => ({
      ...state,
      stories: [data, ...state.stories],
      currentStory: data,
      currentStoryLoading: false
    }))

    return data
  },

  async updateStory(id: string, updates: Database['public']['Tables']['stories']['Update']) {
    const { data, error } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    storiesStore.update(state => ({
      ...state,
      stories: state.stories.map(story => 
        story.id === id ? data : story
      ),
      currentStory: state.currentStory?.id === id ? data : state.currentStory
    }))

    return data
  },

  async loadStoryPages(storyId: string) {
    const { data: pages, error } = await supabase
      .from('story_pages')
      .select('*')
      .eq('story_id', storyId)
      .order('page_number')

    if (error) throw error

    storiesStore.update(state => ({
      ...state,
      currentPages: pages || []
    }))
  },

  async createPage(page: Database['public']['Tables']['story_pages']['Insert']) {
    const { data, error } = await supabase
      .from('story_pages')
      .insert(page)
      .select()
      .single()

    if (error) throw error

    storiesStore.update(state => ({
      ...state,
      currentPages: [...state.currentPages, data].sort((a, b) => a.page_number - b.page_number)
    }))

    return data
  },

  async updatePage(id: string, updates: Database['public']['Tables']['story_pages']['Update']) {
    const { data, error } = await supabase
      .from('story_pages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    storiesStore.update(state => ({
      ...state,
      currentPages: state.currentPages.map(page => 
        page.id === id ? data : page
      )
    }))

    return data
  },

  async inviteCollaborator(storyId: string, email: string, permissionLevel: 'editor' | 'viewer' = 'editor') {
    // First, find the user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !user) {
      throw new Error('User not found with that email address')
    }

    // Add collaborator
    const { data, error } = await supabase
      .from('story_collaborators')
      .insert({
        story_id: storyId,
        user_id: user.id,
        permission_level: permissionLevel,
        invited_by: (await supabase.auth.getUser()).data.user?.id,
        accepted_at: new Date().toISOString() // Auto-accept for now
      })
      .select(`
        *,
        users(
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) throw error

    // Update store
    storiesStore.update(state => ({
      ...state,
      currentCollaborators: [...state.currentCollaborators, data]
    }))

    return data
  },

  async removeCollaborator(storyId: string, userId: string) {
    const { error } = await supabase
      .from('story_collaborators')
      .delete()
      .eq('story_id', storyId)
      .eq('user_id', userId)

    if (error) throw error

    // Update store
    storiesStore.update(state => ({
      ...state,
      currentCollaborators: state.currentCollaborators.filter(
        collab => collab.user_id !== userId
      )
    }))
  },

  async updateCollaboratorPermission(storyId: string, userId: string, permissionLevel: 'owner' | 'editor' | 'viewer') {
    const { data, error } = await supabase
      .from('story_collaborators')
      .update({ permission_level: permissionLevel })
      .eq('story_id', storyId)
      .eq('user_id', userId)
      .select(`
        *,
        users(
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) throw error

    // Update store
    storiesStore.update(state => ({
      ...state,
      currentCollaborators: state.currentCollaborators.map(collab =>
        collab.user_id === userId ? data : collab
      )
    }))

    return data
  },

  getUserPermissionLevel(userId: string): 'owner' | 'editor' | 'viewer' | null {
    const store = storiesStore
    let currentCollaborators: StoryCollaborator[] = []
    
    store.subscribe(state => {
      currentCollaborators = state.currentCollaborators
    })()

    const collaborator = currentCollaborators.find(collab => collab.user_id === userId)
    return collaborator?.permission_level as 'owner' | 'editor' | 'viewer' | null
  },

  setCurrentStory(story: Story | null) {
    storiesStore.update(state => ({
      ...state,
      currentStory: story,
      currentStoryLoading: false,
      currentCollaborators: story ? state.currentCollaborators : []
    }))
  }
}