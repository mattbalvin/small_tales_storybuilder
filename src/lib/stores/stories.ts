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
}

const initialState: StoriesState = {
  stories: [],
  currentStory: null,
  currentPages: [],
  loading: false
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
      currentStory: data
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
      currentStory: story
    }))
  }
}