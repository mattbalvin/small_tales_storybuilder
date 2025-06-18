import { writable } from 'svelte/store'
import { supabase } from '../config/supabase'
import type { Database } from '../types/database'

type Story = Database['public']['Tables']['stories']['Row']
type StoryPage = Database['public']['Tables']['story_pages']['Row']

interface StoriesState {
  stories: Story[]
  currentStory: Story | null
  currentPages: StoryPage[]
  loading: boolean
  currentStoryLoading: boolean
}

const initialState: StoriesState = {
  stories: [],
  currentStory: null,
  currentPages: [],
  loading: false,
  currentStoryLoading: false
}

export const storiesStore = writable<StoriesState>(initialState)

export const storiesService = {
  async loadStories(userId: string) {
    storiesStore.update(state => ({ ...state, loading: true }))
    
    const { data: stories, error } = await supabase
      .from('stories')
      .select('*')
      .eq('author_id', userId)
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
      
      // First, try to load the story without the author_id check to see if it exists
      const { data: storyCheck, error: checkError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single()

      console.log('Story check result:', storyCheck, checkError)

      if (checkError) {
        console.error('Story check error:', checkError)
        storiesStore.update(state => ({
          ...state,
          currentStory: null,
          currentStoryLoading: false
        }))
        throw new Error(`Story not found: ${checkError.message}`)
      }

      if (!storyCheck) {
        storiesStore.update(state => ({
          ...state,
          currentStory: null,
          currentStoryLoading: false
        }))
        throw new Error('Story does not exist')
      }

      // Check if the user owns this story
      if (storyCheck.author_id !== userId) {
        console.error('Access denied. Story author_id:', storyCheck.author_id, 'User ID:', userId)
        storiesStore.update(state => ({
          ...state,
          currentStory: null,
          currentStoryLoading: false
        }))
        throw new Error('You do not have permission to access this story')
      }

      // If we get here, the user owns the story
      storiesStore.update(state => ({
        ...state,
        currentStory: storyCheck,
        currentStoryLoading: false
      }))

      console.log('Story loaded successfully:', storyCheck)
      return storyCheck
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

  setCurrentStory(story: Story | null) {
    storiesStore.update(state => ({
      ...state,
      currentStory: story,
      currentStoryLoading: false
    }))
  }
}