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

  async loadPublicStoryData(storyId: string) {
    storiesStore.update(state => ({ ...state, currentStoryLoading: true }))
    
    try {
      console.log('Loading public story data:', storyId)
      
      // Load story metadata - let RLS handle access control
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .maybeSingle()

      if (storyError) {
        console.error('Public story access error:', storyError)
        storiesStore.update(state => ({
          ...state,
          currentStory: null,
          currentStoryLoading: false
        }))
        throw new Error(`Story not found or not accessible: ${storyError.message}`)
      }

      if (!storyData) {
        storiesStore.update(state => ({
          ...state,
          currentStory: null,
          currentStoryLoading: false
        }))
        throw new Error('Story not found')
      }

      storiesStore.update(state => ({
        ...state,
        currentStory: storyData,
        currentCollaborators: [], // No collaborators for public access
        currentStoryLoading: false
      }))

      console.log('Public story loaded successfully:', storyData)
      return storyData
    } catch (error) {
      console.error('Error in loadPublicStoryData:', error)
      storiesStore.update(state => ({
        ...state,
        currentStory: null,
        currentStoryLoading: false
      }))
      throw error
    }
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

      // Load all collaborators for this story - FIX THE AMBIGUOUS RELATIONSHIP
      const { data: collaborators, error: collabError } = await supabase
        .from('story_collaborators')
        .select(`
          *,
          user:users!story_collaborators_user_id_fkey(
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('story_id', storyId)
        .not('accepted_at', 'is', null)

      if (collabError) {
        console.error('Failed to load collaborators:', collabError)
        // Don't throw here, just log the error and continue without collaborators
      }

      // Transform the data to match expected structure
      const transformedCollaborators = (collaborators || []).map(collab => ({
        ...collab,
        users: collab.user // Rename user to users for backward compatibility
      }))

      storiesStore.update(state => ({
        ...state,
        currentStory: storyData,
        currentCollaborators: transformedCollaborators,
        currentStoryLoading: false
      }))

      console.log('Story loaded successfully:', storyData)
      console.log('User permission level:', storyData.story_collaborators[0]?.permission_level)
      console.log('Collaborators loaded:', transformedCollaborators.length)
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
    try {
      // Verify user is authenticated and get fresh session
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      console.log('Creating story for user:', user.id)
      console.log('Story data:', story)

      // Ensure author_id is set correctly
      const storyData = {
        ...story,
        author_id: user.id
      }

      // Create the story with explicit author_id
      const { data, error } = await supabase
        .from('stories')
        .insert(storyData)
        .select()
        .single()

      if (error) {
        console.error('Story creation error:', error)
        throw new Error(`Failed to create story: ${error.message}`)
      }

      console.log('Story created successfully:', data)

      // The trigger should automatically add the author as owner,
      // but let's verify and add explicitly if needed
      const { data: existingCollaborator, error: checkError } = await supabase
        .from('story_collaborators')
        .select('*')
        .eq('story_id', data.id)
        .eq('user_id', user.id)
        .single()

      if (checkError && checkError.code === 'PGRST116') {
        // No collaborator record exists, create one
        console.log('Adding author as collaborator explicitly')
        const { error: collaboratorError } = await supabase
          .from('story_collaborators')
          .insert({
            story_id: data.id,
            user_id: user.id,
            permission_level: 'owner',
            invited_by: user.id,
            accepted_at: new Date().toISOString()
          })

        if (collaboratorError) {
          console.warn('Failed to add story owner as collaborator:', collaboratorError)
        }
      }

      // Create the default first page for the new story
      console.log('Creating default page for new story:', data.id)
      const defaultPage = {
        story_id: data.id,
        page_number: 1,
        content: {
          elements: [],
          audioElements: [],
          background: null,
          animation: null
        }
      }

      const { data: pageData, error: pageError } = await supabase
        .from('story_pages')
        .insert(defaultPage)
        .select()
        .single()

      if (pageError) {
        console.error('Failed to create default page:', pageError)
        // Don't throw here, the story was created successfully
        // The user can manually add pages if needed
      } else {
        console.log('Default page created successfully:', pageData)
      }

      storiesStore.update(state => ({
        ...state,
        stories: [data, ...state.stories],
        currentStory: data,
        currentStoryLoading: false
      }))

      return data
    } catch (error) {
      console.error('Error in createStory:', error)
      throw error
    }
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

  async deleteStory(id: string) {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', id)

    if (error) throw error

    storiesStore.update(state => ({
      ...state,
      stories: state.stories.filter(story => story.id !== id),
      currentStory: state.currentStory?.id === id ? null : state.currentStory
    }))
  },

  async loadStoryPages(storyId: string) {
    console.log('Loading story pages for:', storyId)
    
    const { data: pages, error } = await supabase
      .from('story_pages')
      .select('*')
      .eq('story_id', storyId)
      .order('page_number')

    if (error) {
      console.error('Error loading story pages:', error)
      throw error
    }

    console.log('Loaded', pages?.length || 0, 'pages for story', storyId)

    storiesStore.update(state => ({
      ...state,
      currentPages: pages || []
    }))

    return pages || []
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

  async deletePage(id: string) {
    const { error } = await supabase
      .from('story_pages')
      .delete()
      .eq('id', id)

    if (error) throw error

    storiesStore.update(state => ({
      ...state,
      currentPages: state.currentPages.filter(page => page.id !== id)
    }))
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
        user:users!story_collaborators_user_id_fkey(
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) throw error

    // Transform the data to match expected structure
    const transformedData = {
      ...data,
      users: data.user
    }

    // Update store
    storiesStore.update(state => ({
      ...state,
      currentCollaborators: [...state.currentCollaborators, transformedData]
    }))

    return transformedData
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
        user:users!story_collaborators_user_id_fkey(
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) throw error

    // Transform the data to match expected structure
    const transformedData = {
      ...data,
      users: data.user
    }

    // Update store
    storiesStore.update(state => ({
      ...state,
      currentCollaborators: state.currentCollaborators.map(collab =>
        collab.user_id === userId ? transformedData : collab
      )
    }))

    return transformedData
  },

  getUserPermissionLevel(userId: string): 'owner' | 'editor' | 'viewer' | null {
    let currentCollaborators: StoryCollaborator[] = []
    
    // Get current value from store
    const unsubscribe = storiesStore.subscribe(state => {
      currentCollaborators = state.currentCollaborators
    })
    unsubscribe() // Immediately unsubscribe since we just want the current value

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