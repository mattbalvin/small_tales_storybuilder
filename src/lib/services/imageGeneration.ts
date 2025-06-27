import { supabase } from '../config/supabase'

export interface ImageGenerationRequest {
  prompt: string
  model: 'flux-1.1-pro' | 'ideogram-v3-balanced' | 'imagen-4'
  width?: number
  height?: number
  num_outputs?: number
  guidance_scale?: number
  num_inference_steps?: number
  seed?: number
  style?: string // For Ideogram
  aspect_ratio?: string // For Ideogram and Imagen
  safety_tolerance?: number // For Imagen
}

export interface GeneratedImage {
  images: string[]
  model: string
  prompt: string
  prediction_id: string
  parameters: any
}

export class ImageGenerationService {
  private static readonly FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`

  // Available AI models for image generation
  static readonly MODELS = {
    'flux-1.1-pro': {
      name: 'FLUX 1.1 Pro',
      description: 'High-quality, fast generation with excellent prompt following',
      provider: 'Black Forest Labs',
      strengths: ['Photorealistic', 'Fast', 'Detailed'],
      defaultParams: {
        width: 1024,
        height: 1024,
        guidance_scale: 3.5,
        num_inference_steps: 28,
        safety_tolerance: 2
      }
    },
    'ideogram-v3-balanced': {
      name: 'Ideogram V3 Balanced',
      description: 'Excellent for text rendering and balanced artistic styles',
      provider: 'Ideogram AI',
      strengths: ['Text rendering', 'Artistic styles', 'Balanced output'],
      defaultParams: {
        aspect_ratio: '1:1',
        style: 'auto',
        safety_tolerance: 2
      }
    },
    'imagen-4': {
      name: 'Imagen 4',
      description: 'Google\'s latest model with superior quality and safety',
      provider: 'Google',
      strengths: ['High quality', 'Safe content', 'Realistic'],
      defaultParams: {
        aspect_ratio: '1:1',
        safety_tolerance: 2
      }
    }
  }

  // Common aspect ratios
  static readonly ASPECT_RATIOS = {
    '1:1': 'Square (1:1)',
    '16:9': 'Landscape (16:9)',
    '9:16': 'Portrait (9:16)',
    '4:3': 'Standard (4:3)',
    '3:4': 'Portrait (3:4)',
    '21:9': 'Ultrawide (21:9)',
    '2:3': 'Photo (2:3)',
    '3:2': 'Photo Landscape (3:2)'
  }

  // Style presets for Ideogram
  static readonly STYLES = {
    'auto': 'Auto (recommended)',
    'general': 'General',
    'realistic': 'Realistic',
    'design': 'Design',
    'render_3d': '3D Render',
    'anime': 'Anime',
    'photography': 'Photography'
  }

  static async generateImage(options: ImageGenerationRequest): Promise<GeneratedImage> {
    try {
      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('User must be authenticated to generate images')
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
        throw new Error(result.error || 'Failed to generate image')
      }

      return {
        images: result.images,
        model: result.model,
        prompt: result.prompt,
        prediction_id: result.prediction_id,
        parameters: result.parameters
      }
    } catch (error) {
      console.error('Image generation failed:', error)
      throw error
    }
  }

  static async generateAndUploadImage(
    options: ImageGenerationRequest,
    userId: string,
    filename?: string
  ): Promise<{ urls: string[]; assets: any[] }> {
    try {
      // Generate images
      const result = await this.generateImage(options)
      
      const uploadedAssets = []
      const urls = []

      // Upload each generated image to the media library
      for (let i = 0; i < result.images.length; i++) {
        const imageUrl = result.images[i]
        
        // Fetch the image data
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch generated image ${i + 1}`)
        }
        
        const imageBlob = await imageResponse.blob()
        
        // Generate filename
        const timestamp = Date.now()
        const imageFilename = filename 
          ? `${filename}-${i + 1}.png`
          : `generated-${result.model}-${timestamp}-${i + 1}.png`
        
        // Upload to Supabase storage
        const filePath = `${userId}/generated/${imageFilename}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, imageBlob, {
            contentType: 'image/png',
            upsert: false
          })

        if (uploadError) {
          throw new Error(`Upload failed for image ${i + 1}: ${uploadError.message}`)
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
            filename: imageFilename,
            url: publicUrl,
            type: 'image',
            size: imageBlob.size,
            tags: [
              'generated', 
              'ai-generated', 
              result.model, 
              `prompt:${result.prompt.substring(0, 50)}`,
              `prediction:${result.prediction_id}`
            ]
          })
          .select()
          .single()

        if (assetError) {
          throw new Error(`Failed to save asset metadata for image ${i + 1}: ${assetError.message}`)
        }

        uploadedAssets.push(asset)
        urls.push(publicUrl)
      }

      return {
        urls,
        assets: uploadedAssets
      }
    } catch (error) {
      console.error('Failed to generate and upload image:', error)
      throw error
    }
  }

  // Utility function to get model recommendations based on prompt
  static getModelRecommendation(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase()
    
    // Check for text-heavy prompts
    if (lowerPrompt.includes('text') || lowerPrompt.includes('sign') || lowerPrompt.includes('logo') || lowerPrompt.includes('typography')) {
      return 'ideogram-v3-balanced'
    }
    
    // Check for photorealistic prompts
    if (lowerPrompt.includes('photo') || lowerPrompt.includes('realistic') || lowerPrompt.includes('portrait')) {
      return 'flux-1.1-pro'
    }
    
    // Check for artistic prompts
    if (lowerPrompt.includes('art') || lowerPrompt.includes('painting') || lowerPrompt.includes('drawing')) {
      return 'ideogram-v3-balanced'
    }
    
    // Default to FLUX for general use
    return 'flux-1.1-pro'
  }

  // Utility function to estimate generation cost
  static estimateCost(model: string, numOutputs: number = 1): number {
    // Rough cost estimates (these would need to be updated based on actual pricing)
    const costPerImage = {
      'flux-1.1-pro': 0.04,
      'ideogram-v3-balanced': 0.08,
      'imagen-4': 0.12
    }
    
    return (costPerImage[model as keyof typeof costPerImage] || 0.04) * numOutputs
  }
}