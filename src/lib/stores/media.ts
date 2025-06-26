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

      // Get the current session to use the access token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('User must be authenticated to import media')
      }

      // Use the edge function to fetch the file (bypasses CORS)
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-media`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ url })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to import media')
      }

      const { arrayBuffer, filename, contentType, fileType, size } = result.data

      // Convert array back to Uint8Array and create blob
      const uint8Array = new Uint8Array(arrayBuffer)
      const blob = new Blob([uint8Array], { type: contentType })
      
      // Create File object from blob
      const file = new File([blob], filename, { type: contentType })

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