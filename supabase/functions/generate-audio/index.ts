import { corsHeaders } from '../_shared/cors.ts'

interface GenerateAudioRequest {
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

interface ElevenLabsResponse {
  audio_base64?: string
  error?: string
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get the request body
    const body: GenerateAudioRequest = await req.json()
    
    if (!body.text || body.text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get ElevenLabs API key from environment
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!elevenLabsApiKey) {
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Default voice settings for good quality narration
    const defaultVoiceSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    }

    // Use provided voice_id or default to Rachel (a good female voice for storytelling)
    const voiceId = body.voice_id || 'pNInz6obpgDQGcFmaJgB'
    
    // Use provided model or default to eleven_multilingual_v2 for better quality
    const modelId = body.model_id || 'eleven_multilingual_v2'

    // Merge voice settings
    const voiceSettings = {
      ...defaultVoiceSettings,
      ...body.voice_settings
    }

    // Prepare the request to ElevenLabs
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`
    
    const elevenLabsPayload = {
      text: body.text,
      model_id: modelId,
      voice_settings: voiceSettings
    }

    console.log('Calling ElevenLabs API with payload:', {
      voice_id: voiceId,
      model_id: modelId,
      text_length: body.text.length,
      voice_settings: voiceSettings
    })

    // Make request to ElevenLabs
    const elevenLabsResponse = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify(elevenLabsPayload),
    })

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text()
      console.error('ElevenLabs API error:', {
        status: elevenLabsResponse.status,
        statusText: elevenLabsResponse.statusText,
        error: errorText
      })
      
      return new Response(
        JSON.stringify({ 
          error: `ElevenLabs API error: ${elevenLabsResponse.status} ${elevenLabsResponse.statusText}`,
          details: errorText
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get the audio data as array buffer
    const audioBuffer = await elevenLabsResponse.arrayBuffer()
    
    // Convert to base64 for JSON response
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))

    // Get character count for billing/usage tracking
    const characterCount = body.text.length

    console.log('Successfully generated audio:', {
      character_count: characterCount,
      audio_size_bytes: audioBuffer.byteLength,
      voice_id: voiceId,
      model_id: modelId
    })

    return new Response(
      JSON.stringify({
        success: true,
        audio_base64: audioBase64,
        character_count: characterCount,
        voice_id: voiceId,
        model_id: modelId,
        audio_size_bytes: audioBuffer.byteLength
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in generate-audio function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})