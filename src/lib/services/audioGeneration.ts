import { supabase } from '../config/supabase'

export interface GenerateAudioOptions {
  text: string
  voice_id?: string
  model_id?: string
  voice_settings?: {
    stability?: number
    similarity_boost?: number
    style?: number
    use_speaker_boost?: boolean
  }
}

export interface GeneratedAudio {
  audio_base64: string
  character_count: number
  voice_id: string
  model_id: string
  audio_size_bytes: number
}

export class AudioGenerationService {
  private static readonly FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-audio`

  static async generateAudio(options: GenerateAudioOptions): Promise<GeneratedAudio> {
    try {
      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('User must be authenticated to generate audio')
      }

      const response = await fetch(this.FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate audio')
      }

      return {
        audio_base64: result.audio_base64,
        character_count: result.character_count,
        voice_id: result.voice_id,
        model_id: result.model_id,
        audio_size_bytes: result.audio_size_bytes
      }
    } catch (error) {
      console.error('Audio generation failed:', error)
      throw error
    }
  }

  static async generateAndUploadAudio(
    text: string, 
    userId: string, 
    filename?: string,
    options?: Omit<GenerateAudioOptions, 'text'>
  ): Promise<{ url: string; asset: any }> {
    try {
      // Generate audio using ElevenLabs
      const audioData = await this.generateAudio({
        text,
        ...options
      })

      // Convert base64 to blob
      const audioBlob = this.base64ToBlob(audioData.audio_base64, 'audio/mpeg')
      
      // Generate filename if not provided
      const audioFilename = filename || `generated-audio-${Date.now()}.mp3`
      
      // Upload to Supabase storage
      const filePath = `${userId}/generated/${audioFilename}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, audioBlob, {
          contentType: 'audio/mpeg',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      // Save asset metadata to database
      const { data: asset, error: assetError } = await supabase
        .from('media_assets')
        .insert({
          user_id: userId,
          filename: audioFilename,
          url: publicUrl,
          type: 'audio',
          size: audioData.audio_size_bytes,
          tags: ['generated', 'elevenlabs', 'tts']
        })
        .select()
        .single()

      if (assetError) {
        throw new Error(`Failed to save asset metadata: ${assetError.message}`)
      }

      return {
        url: publicUrl,
        asset
      }
    } catch (error) {
      console.error('Failed to generate and upload audio:', error)
      throw error
    }
  }

  private static base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  // Predefined voices for easy selection
  static readonly VOICES = {
    // Female voices good for storytelling
    rachel: { id: 'pNInz6obpgDQGcFmaJgB', name: 'Rachel', gender: 'female', description: 'Calm, warm storytelling voice' },
    domi: { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'female', description: 'Strong, confident narrator' },
    bella: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'female', description: 'Friendly, engaging voice' },
    
    // Male voices good for storytelling  
    adam: { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', description: 'Deep, authoritative narrator' },
    sam: { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', gender: 'male', description: 'Clear, professional voice' },
    
    // Child-friendly voices
    dorothy: { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy', gender: 'female', description: 'Gentle, child-friendly voice' }
  }

  // Preset voice settings for different story types
  static readonly VOICE_PRESETS = {
    storytelling: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    },
    dramatic: {
      stability: 0.3,
      similarity_boost: 0.8,
      style: 0.2,
      use_speaker_boost: true
    },
    calm: {
      stability: 0.7,
      similarity_boost: 0.7,
      style: 0.0,
      use_speaker_boost: false
    },
    energetic: {
      stability: 0.2,
      similarity_boost: 0.9,
      style: 0.3,
      use_speaker_boost: true
    }
  }
}