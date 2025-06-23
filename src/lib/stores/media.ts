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