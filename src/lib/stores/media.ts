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
    try {
      console.log('Starting upload for file:', file.name, 'size:', file.size, 'type:', file.type)
      
      // Generate unique filename to avoid conflicts
      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      const fileName = `${timestamp}-${randomSuffix}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      console.log('Uploading to path:', filePath)

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      console.log('Upload successful:', uploadData)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      console.log('Public URL generated:', publicUrl)

      // Determine file type
      let fileType: 'image' | 'audio' | 'video'
      if (file.type.startsWith('image/')) {
        fileType = 'image'
      } else if (file.type.startsWith('audio/')) {
        fileType = 'audio'
      } else if (file.type.startsWith('video/')) {
        fileType = 'video'
      } else {
        // Fallback based on file extension
        const ext = fileExt?.toLowerCase()
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
          fileType = 'image'
        } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext || '')) {
          fileType = 'audio'
        } else if (['mp4', 'webm', 'mov', 'avi'].includes(ext || '')) {
          fileType = 'video'
        } else {
          throw new Error(`Unsupported file type: ${file.type}`)
        }
      }

      // Save asset metadata to database
      const assetData = {
        user_id: userId,
        filename: file.name,
        url: publicUrl,
        type: fileType,
        size: file.size,
        tags
      }

      console.log('Saving asset metadata:', assetData)

      const { data: asset, error } = await supabase
        .from('media_assets')
        .insert(assetData)
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        // Try to clean up the uploaded file
        await supabase.storage.from('media').remove([filePath])
        throw new Error(`Failed to save asset metadata: ${error.message}`)
      }

      console.log('Asset saved successfully:', asset)

      // Update store
      mediaStore.update(state => ({
        ...state,
        assets: [asset, ...state.assets]
      }))

      return asset
    } catch (error) {
      console.error('Upload failed:', error)
      throw error
    }
  },

  async importFromUrl(url: string, userId: string, tags: string[] = []): Promise<MediaAsset> {
    try {
      console.log('Starting import from URL:', url)
      
      // Check if URL is already in media library
      const existingAsset = await this.findAssetByUrl(url)
      if (existingAsset) {
        console.log('Asset already exists in library:', existingAsset.filename)
        return existingAsset
      }

      // Check if URL is from our own Supabase storage
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (url.includes(supabaseUrl)) {
        throw new Error('URL is already from media library')
      }

      // Get the current session to use the access token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('User must be authenticated to import media')
      }

      // Use the edge function to fetch the file (bypasses CORS)
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-media`
      
      console.log('Calling import-media edge function...')
      
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
        
        // Handle specific HTTP status codes with more descriptive messages
        if (response.status === 403) {
          throw new Error('Access denied: The external media URL is not publicly accessible or requires authentication. Please ensure the URL is publicly available or try a different source.')
        } else if (response.status === 404) {
          throw new Error('Media not found: The URL does not exist or the resource has been moved.')
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded: Too many requests to the external source. Please try again later.')
        } else if (response.status >= 500) {
          throw new Error('Server error: The external source is experiencing issues. Please try again later.')
        }
        
        throw new Error(errorData.error || `Failed to fetch media (HTTP ${response.status}): ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        const errorMessage = result.error || 'Failed to import media'
        if (errorMessage.toLowerCase().includes('403') || errorMessage.toLowerCase().includes('forbidden')) {
          throw new Error('Access denied: The external media URL is not publicly accessible or requires authentication. Please ensure the URL is publicly available or try a different source.')
        }
        throw new Error(errorMessage)
      }

      console.log('Import successful, processing file data...')

      const { arrayBuffer, filename, contentType, fileType, size } = result.data

      // Convert array back to Uint8Array and create blob
      const uint8Array = new Uint8Array(arrayBuffer)
      const blob = new Blob([uint8Array], { type: contentType })
      
      // Create File object from blob
      const file = new File([blob], filename, { type: contentType })

      console.log('Created file object:', { name: file.name, size: file.size, type: file.type })

      // Upload to media library with import tag
      const importTags = [...tags, 'imported', `imported-${fileType}`]
      const asset = await this.uploadAsset(file, userId, importTags)

      console.log('Import completed successfully:', asset.filename)
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

      console.log(`Processing external ${elementType} URL for import:`, url)

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
    // Get asset info first to delete from storage
    const asset = await supabase
      .from('media_assets')
      .select('url, user_id')
      .eq('id', id)
      .single()

    if (asset.data) {
      // Extract file path from URL
      const url = asset.data.url
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (url.includes(supabaseUrl)) {
        const pathMatch = url.match(/\/storage\/v1\/object\/public\/media\/(.+)$/)
        if (pathMatch) {
          const filePath = pathMatch[1]
          // Delete from storage
          await supabase.storage.from('media').remove([filePath])
        }
      }
    }

    // Delete from database
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

  async updateAssetFilename(id: string, filename: string) {
    const { data: asset, error } = await supabase
      .from('media_assets')
      .update({ filename })
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