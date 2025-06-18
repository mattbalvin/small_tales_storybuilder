import { writable } from 'svelte/store'
import { supabase } from '../config/supabase'
import type { Database } from '../types/database'

type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row']

interface AnalyticsData {
  totalViews: number
  uniqueReaders: number
  avgReadingTime: number
  engagementRate: number
  storiesPublished: number
  activeStories: number
  viewsGrowth: number
  readersGrowth: number
  completionRate: number
  bounceRate: number
  returnReaders: number
  totalShares: number
  topStories: Array<{
    id: string
    title: string
    views: number
    avgReadingTime: number
  }>
  demographics: Array<{
    ageGroup: string
    percentage: number
  }>
  deviceTypes: Array<{
    type: string
    percentage: number
  }>
  viewsOverTime: Array<{
    date: string
    views: number
  }>
}

interface AnalyticsState {
  analytics: AnalyticsData
  loading: boolean
  dateRange: '7d' | '30d' | '90d' | '1y'
}

const initialAnalytics: AnalyticsData = {
  totalViews: 0,
  uniqueReaders: 0,
  avgReadingTime: 0,
  engagementRate: 0,
  storiesPublished: 0,
  activeStories: 0,
  viewsGrowth: 0,
  readersGrowth: 0,
  completionRate: 0,
  bounceRate: 0,
  returnReaders: 0,
  totalShares: 0,
  topStories: [],
  demographics: [
    { ageGroup: '3-5 years', percentage: 35 },
    { ageGroup: '6-8 years', percentage: 40 },
    { ageGroup: '9-12 years', percentage: 20 },
    { ageGroup: '13+ years', percentage: 5 }
  ],
  deviceTypes: [
    { type: 'Mobile', percentage: 65 },
    { type: 'Desktop', percentage: 25 },
    { type: 'Tablet', percentage: 10 }
  ],
  viewsOverTime: []
}

const initialState: AnalyticsState = {
  analytics: initialAnalytics,
  loading: false,
  dateRange: '30d'
}

export const analyticsStore = writable<AnalyticsState>(initialState)

export const analyticsService = {
  async loadAnalytics(userId: string) {
    analyticsStore.update(state => ({ ...state, loading: true }))
    
    try {
      // Get user's stories
      const { data: stories, error: storiesError } = await supabase
        .from('stories')
        .select('id, title')
        .eq('author_id', userId)

      if (storiesError) throw storiesError

      const storyIds = stories?.map(s => s.id) || []
      
      // Get analytics events for user's stories
      const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .in('story_id', storyIds)
        .gte('created_at', this.getDateRangeStart('30d'))

      if (eventsError) throw eventsError

      // Process analytics data
      const analytics = this.processAnalyticsData(events || [], stories || [])

      analyticsStore.update(state => ({
        ...state,
        analytics,
        loading: false
      }))
    } catch (error) {
      console.error('Failed to load analytics:', error)
      analyticsStore.update(state => ({ ...state, loading: false }))
    }
  },

  processAnalyticsData(events: AnalyticsEvent[], stories: any[]): AnalyticsData {
    // For demo purposes, return mock data with some real calculations
    const viewEvents = events.filter(e => e.event_type === 'page_view')
    const uniqueSessions = new Set(events.map(e => e.user_session).filter(Boolean))
    
    return {
      totalViews: viewEvents.length || 1247,
      uniqueReaders: uniqueSessions.size || 892,
      avgReadingTime: 185, // seconds
      engagementRate: 78,
      storiesPublished: stories.length,
      activeStories: stories.length,
      viewsGrowth: 12.5,
      readersGrowth: 8.3,
      completionRate: 65,
      bounceRate: 23,
      returnReaders: 42,
      totalShares: 156,
      topStories: stories.slice(0, 5).map((story, index) => ({
        id: story.id,
        title: story.title,
        views: Math.floor(Math.random() * 500) + 100,
        avgReadingTime: Math.floor(Math.random() * 300) + 60
      })),
      demographics: [
        { ageGroup: '3-5 years', percentage: 35 },
        { ageGroup: '6-8 years', percentage: 40 },
        { ageGroup: '9-12 years', percentage: 20 },
        { ageGroup: '13+ years', percentage: 5 }
      ],
      deviceTypes: [
        { type: 'Mobile', percentage: 65 },
        { type: 'Desktop', percentage: 25 },
        { type: 'Tablet', percentage: 10 }
      ],
      viewsOverTime: this.generateViewsOverTime()
    }
  },

  generateViewsOverTime() {
    const data = []
    const now = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      data.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 100) + 20
      })
    }
    
    return data
  },

  getDateRangeStart(range: string): string {
    const now = new Date()
    switch (range) {
      case '7d':
        now.setDate(now.getDate() - 7)
        break
      case '30d':
        now.setDate(now.getDate() - 30)
        break
      case '90d':
        now.setDate(now.getDate() - 90)
        break
      case '1y':
        now.setFullYear(now.getFullYear() - 1)
        break
    }
    return now.toISOString()
  },

  setDateRange(range: '7d' | '30d' | '90d' | '1y') {
    analyticsStore.update(state => ({
      ...state,
      dateRange: range
    }))
    // Reload analytics with new date range
    // This would trigger a new data fetch in a real implementation
  },

  async trackEvent(storyId: string, eventType: string, eventData: any = {}, userSession?: string) {
    try {
      await supabase
        .from('analytics_events')
        .insert({
          story_id: storyId,
          event_type: eventType,
          event_data: eventData,
          user_session: userSession
        })
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }
}