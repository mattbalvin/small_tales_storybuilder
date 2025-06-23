import { writable } from 'svelte/store'
import { supabase } from '../config/supabase'
import type { Database } from '../types/database'

type MediaAsset = Database['public']['Tables']['media_assets']['Row']

interface MediaState {
  assets: MediaAsset[]
  selectedAssets: MediaAsset[]
  loading: boolean
  searchTerm: string
  filterType: 'all' | 'image' | 'audio' | 'video'
}

const initialState: MediaState = {
  assets: [],
  selectedAssets: [],
  loading: false,
  searchTerm: '',
  filterType: 'all'
}

export const mediaStore = writable<MediaState>(initialState)

export const mediaService = {
  async loadAssets(userId: string) {
    mediaStore.update(state => ({ ...state, loading: true }))
    
    const { data: assets, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    mediaStore.update(state => ({
      ...state,
      assets: assets || [],
      loading: false
    }))
  },

  async uploadAsset(file: File, userId: string, tags: string[] = []) {
    // Upload file to Supabase storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath)

    // Save asset metadata
    const assetData = {
      user_id: userId,
      filename: file.name,
      url: publicUrl,
      type: file.type.startsWith('image/') ? 'image' as const : 
            file.type.startsWith('audio/') ? 'audio' as const : 'video' as const,
      size: file.size,
      tags
    }

    const { data: asset, error } = await supabase
      .from('media_assets')
      .insert(assetData)
      .select()
      .single()

    if (error) throw error

    mediaStore.update(state => ({
      ...state,
      assets: [asset, ...state.assets]
    }))

    return asset
  },

  async importFromUrl(url: string, userId: string, tags: string[] = []): Promise<MediaAsset> {
    try {
      // Check if URL is already in media library
      const existingAsset = await this.findAssetByUrl(url)
      if (existingAsset) {
        return existingAsset
      }

      // Check if URL is from our own Supabase storage
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (url.includes(supabaseUrl)) {
        // This is already a Supabase URL, don't re-import
        throw new Error('URL is already from media library')
      }

      // Fetch the file from the external URL
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`)
      }

      // Get content type and determine file type
      const contentType = response.headers.get('content-type') || ''
      let fileType: 'image' | 'audio' | 'video'
      let fileExtension: string

      if (contentType.startsWith('image/')) {
        fileType = 'image'
        fileExtension = contentType.split('/')[1] || 'jpg'
      } else if (contentType.startsWith('audio/')) {
        fileType = 'audio'
        fileExtension = contentType.split('/')[1] || 'mp3'
      } else if (contentType.startsWith('video/')) {
        fileType = 'video'
        fileExtension = contentType.split('/')[1] || 'mp4'
      } else {
        // Try to guess from URL
        const urlLower = url.toLowerCase()
        if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/)) {
          fileType = 'image'
          fileExtension = urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg)/)?.[1] || 'jpg'
        } else if (urlLower.match(/\.(mp3|wav|ogg|m4a|aac)(\?|$)/)) {
          fileType = 'audio'
          fileExtension = urlLower.match(/\.(mp3|wav|ogg|m4a|aac)/)?.[1] || 'mp3'
        } else if (urlLower.match(/\.(mp4|webm|mov|avi)(\?|$)/)) {
          fileType = 'video'
          fileExtension = urlLower.match(/\.(mp4|webm|mov|avi)/)?.[1] || 'mp4'
        } else {
          throw new Error('Unable to determine file type from URL')
        }
      }

      // Convert response to blob
      const blob = await response.blob()
      
      // Generate filename from URL or use generic name
      const urlPath = new URL(url).pathname
      const originalFilename = urlPath.split('/').pop() || `imported-${fileType}`
      const filename = originalFilename.includes('.') 
        ? originalFilename 
        : `${originalFilename}.${fileExtension}`

      // Create File object from blob
      const file = new File([blob], filename, { type: contentType || `${fileType}/*` })

      // Upload to media library with import tag
      const importTags = [...tags, 'imported', `imported-${fileType}`]
      const asset = await this.uploadAsset(file, userId, importTags)

      return asset
    } catch (error) {
      console.error('Failed to import from URL:', error)
      throw error
    }
  },

  async findAssetByUrl(url: string): Promise<MediaAsset | null> {
    let assets: MediaAsset[] = []
    const unsubscribe = mediaStore.subscribe(state => {
      assets = state.assets
    })
    unsubscribe()

    return assets.find(asset => asset.url === url) || null
  },

  async processUrlForElement(url: string, userId: string, elementType: 'image' | 'audio'): Promise<string> {
    if (!url || !url.trim()) {
      return url
    }

    try {
      // Check if it's already a valid HTTP/HTTPS URL
      const urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return url // Not a web URL, return as-is
      }

      // Check if URL is from our Supabase storage
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (url.includes(supabaseUrl)) {
        return url // Already from our storage
      }

      // Import the external URL to media library
      const asset = await this.importFromUrl(url, userId, [`auto-import-${elementType}`])
      
      console.log(`Successfully imported ${elementType} from external URL to media library:`, asset.filename)
      return asset.url
    } catch (error) {
      console.warn(`Failed to import ${elementType} from URL, using original:`, error)
      return url // Return original URL if import fails
    }
  },

  async deleteAsset(id: string) {
    const { error } = await supabase
      .from('media_assets')
      .delete()
      .eq('id', id)

    if (error) throw error

    mediaStore.update(state => ({
      ...state,
      assets: state.assets.filter(asset => asset.id !== id),
      selectedAssets: state.selectedAssets.filter(asset => asset.id !== id)
    }))
  },

  async updateAssetTags(id: string, tags: string[]) {
    const { data: asset, error } = await supabase
      .from('media_assets')
      .update({ tags })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    mediaStore.update(state => ({
      ...state,
      assets: state.assets.map(a => a.id === id ? asset : a)
    }))

    return asset
  },

  setSearchTerm(term: string) {
    mediaStore.update(state => ({
      ...state,
      searchTerm: term
    }))
  },

  setFilterType(type: 'all' | 'image' | 'audio' | 'video') {
    mediaStore.update(state => ({
      ...state,
      filterType: type
    }))
  },

  toggleAssetSelection(asset: MediaAsset) {
    mediaStore.update(state => {
      const isSelected = state.selectedAssets.some(a => a.id === asset.id)
      return {
        ...state,
        selectedAssets: isSelected
          ? state.selectedAssets.filter(a => a.id !== asset.id)
          : [...state.selectedAssets, asset]
      }
    })
  },

  clearSelection() {
    mediaStore.update(state => ({
      ...state,
      selectedAssets: []
    }))
  },

  getAssetsByType(type: 'image' | 'audio' | 'video') {
    let assets: MediaAsset[] = []
    const unsubscribe = mediaStore.subscribe(state => {
      assets = state.assets.filter(asset => asset.type === type)
    })
    unsubscribe()
    return assets
  }
}