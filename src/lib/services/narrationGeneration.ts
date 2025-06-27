import { supabase } from '../config/supabase'

export interface NarrationRequest {
  text: string
  voice_id?: string
  model_id?: string
  voice_settings?: {
    stability?: number
    similarity_boost?: number
    style?: number
    use_speaker_boost?: boolean
  }
  include_word_recordings?: boolean
}

export interface WordTimestamp {
  word: string
  start_time: number // milliseconds from start
  end_time: number   // milliseconds from start
  confidence?: number
}

export interface NarrationResource {
  id: string
  text: string
  fullAudio: {
    url: string
    duration: number // milliseconds
    size_bytes: number
    format: string
  }
  wordTimestamps: WordTimestamp[]
  wordRecordings: Record<string, {
    url: string
    size_bytes: number
    format: string
  }>
  metadata: {
    voice_id: string
    voice_name: string
    model_id: string
    voice_settings: any
    character_count: number
    unique_words: number
    created_at: string
  }
}

export class NarrationPlayer {
  private narration: NarrationResource
  private audio: HTMLAudioElement | null = null
  private currentWordIndex: number = -1
  private isPlaying: boolean = false
  private animationFrame: number | null = null

  public onWordHighlight: ((word: WordTimestamp, index: number) => void) | null = null
  public onPlaybackEnd: (() => void) | null = null
  public onPlaybackStart: (() => void) | null = null
  public onPlaybackPause: (() => void) | null = null

  constructor(narration: NarrationResource) {
    this.narration = narration
  }

  // Play the full narration with word highlighting
  async playFull(): Promise<void> {
    if (this.audio) {
      this.audio.pause()
    }

    this.audio = new Audio(this.narration.fullAudio.url)
    this.audio.currentTime = 0
    this.currentWordIndex = -1
    this.isPlaying = true

    // Set up word highlighting
    this.setupWordHighlighting()

    try {
      await this.audio.play()
      if (this.onPlaybackStart) {
        this.onPlaybackStart()
      }
    } catch (error) {
      console.error('Failed to play narration:', error)
      this.isPlaying = false
      throw error
    }
  }

  // Play a specific word
  async playWord(word: string): Promise<boolean> {
    const wordLower = word.toLowerCase()
    const wordRecording = this.narration.wordRecordings[wordLower]
    
    if (!wordRecording) {
      console.warn('No recording found for word:', word)
      return false
    }

    if (this.audio) {
      this.audio.pause()
    }

    this.audio = new Audio(wordRecording.url)
    
    try {
      await this.audio.play()
      return true
    } catch (error) {
      console.error('Failed to play word:', word, error)
      return false
    }
  }

  // Seek to a specific word in the full narration
  seekToWord(word: string): boolean {
    if (!this.audio) return false

    const wordData = this.narration.wordTimestamps.find(w => 
      w.word.toLowerCase() === word.toLowerCase()
    )

    if (wordData) {
      this.audio.currentTime = wordData.start_time / 1000 // Convert ms to seconds
      return true
    }

    return false
  }

  // Pause playback
  pause(): void {
    if (this.audio) {
      this.audio.pause()
      this.isPlaying = false
      if (this.onPlaybackPause) {
        this.onPlaybackPause()
      }
    }
  }

  // Resume playback
  resume(): void {
    if (this.audio && !this.isPlaying) {
      this.audio.play()
      this.isPlaying = true
      if (this.onPlaybackStart) {
        this.onPlaybackStart()
      }
    }
  }

  // Stop playback
  stop(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
      this.isPlaying = false
      this.currentWordIndex = -1
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame)
        this.animationFrame = null
      }
    }
  }

  // Set up word highlighting during playback
  private setupWordHighlighting(): void {
    if (!this.audio) return

    const updateHighlight = () => {
      if (!this.isPlaying || !this.audio) return

      const currentTimeMs = this.audio.currentTime * 1000
      const currentWord = this.narration.wordTimestamps.find(w => 
        currentTimeMs >= w.start_time && currentTimeMs <= w.end_time
      )

      if (currentWord) {
        const wordIndex = this.narration.wordTimestamps.indexOf(currentWord)
        if (wordIndex !== this.currentWordIndex) {
          this.currentWordIndex = wordIndex
          if (this.onWordHighlight) {
            this.onWordHighlight(currentWord, wordIndex)
          }
        }
      }

      if (this.isPlaying) {
        this.animationFrame = requestAnimationFrame(updateHighlight)
      }
    }

    this.audio.addEventListener('play', () => {
      this.isPlaying = true
      updateHighlight()
    })

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame)
        this.animationFrame = null
      }
    })

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false
      this.currentWordIndex = -1
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame)
        this.animationFrame = null
      }
      if (this.onPlaybackEnd) {
        this.onPlaybackEnd()
      }
    })
  }

  // Get current playback position info
  getCurrentPosition(): {
    timeMs: number
    progress: number
    currentWord: WordTimestamp | undefined
    wordIndex: number
  } | null {
    if (!this.audio) return null

    const currentTimeMs = this.audio.currentTime * 1000
    const currentWord = this.narration.wordTimestamps.find(w => 
      currentTimeMs >= w.start_time && currentTimeMs <= w.end_time
    )

    return {
      timeMs: currentTimeMs,
      progress: currentTimeMs / this.narration.fullAudio.duration,
      currentWord: currentWord,
      wordIndex: currentWord ? this.narration.wordTimestamps.indexOf(currentWord) : -1
    }
  }

  // Get narration metadata
  getMetadata(): {
    duration: number
    wordCount: number
    uniqueWords: number
    voice: string
    text: string
  } {
    return {
      duration: this.narration.fullAudio.duration,
      wordCount: this.narration.wordTimestamps.length,
      uniqueWords: Object.keys(this.narration.wordRecordings).length,
      voice: this.narration.metadata.voice_name,
      text: this.narration.text
    }
  }

  // Check if a word has an individual recording
  hasWordRecording(word: string): boolean {
    return word.toLowerCase() in this.narration.wordRecordings
  }

  // Get all available words with recordings
  getAvailableWords(): string[] {
    return Object.keys(this.narration.wordRecordings)
  }

  // Destroy the player and clean up resources
  destroy(): void {
    this.stop()
    if (this.audio) {
      this.audio.src = ''
      this.audio = null
    }
    this.onWordHighlight = null
    this.onPlaybackEnd = null
    this.onPlaybackStart = null
    this.onPlaybackPause = null
  }
}

export class NarrationGenerationService {
  private static readonly FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-narration`

  // Predefined voices optimized for narration
  static readonly VOICES = {
    rachel: { 
      id: 'pNInz6obpgDQGcFmaJgB', 
      name: 'Rachel', 
      description: 'Warm, clear storytelling voice',
      gender: 'female'
    },
    josh: { 
      id: 'TxGEqnHWrfWFTfGW9XjX', 
      name: 'Josh', 
      description: 'Deep, authoritative narrator',
      gender: 'male'
    },
    bella: { 
      id: 'EXAVITQu4vr4xnSDxMaL', 
      name: 'Bella', 
      description: 'Friendly, engaging voice',
      gender: 'female'
    },
    dorothy: { 
      id: 'ThT5KcBeYPX3keUQqHPh', 
      name: 'Dorothy', 
      description: 'Gentle, child-friendly voice',
      gender: 'female'
    }
  }

  // Voice presets for different narration styles
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
    },
    children: {
      stability: 0.6,
      similarity_boost: 0.8,
      style: 0.1,
      use_speaker_boost: true
    }
  }

  static async generateNarration(options: NarrationRequest): Promise<NarrationResource> {
    try {
      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('User must be authenticated to generate narration')
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
        throw new Error(result.error || 'Failed to generate narration')
      }

      return result.narration
    } catch (error) {
      console.error('Narration generation failed:', error)
      throw error
    }
  }

  static createPlayer(narration: NarrationResource): NarrationPlayer {
    return new NarrationPlayer(narration)
  }

  // Utility function to extract text from story page elements
  static extractTextFromPage(pageContent: any): string {
    if (!pageContent?.elements) return ''

    const textElements = pageContent.elements.filter((el: any) => el.type === 'text')
    return textElements
      .map((el: any) => el.properties?.text || '')
      .filter((text: string) => text.trim().length > 0)
      .join(' ')
  }

  // Utility function to estimate narration cost
  static estimateCost(text: string, includeWordRecordings: boolean = true): {
    characterCount: number
    estimatedCost: number
    uniqueWords: number
  } {
    const characterCount = text.length
    const uniqueWords = this.countUniqueWords(text)
    
    // ElevenLabs pricing estimate (as of 2024)
    const costPerCharacter = 0.0001 // $0.0001 per character
    const baseCost = characterCount * costPerCharacter
    const wordRecordingCost = includeWordRecordings ? uniqueWords * costPerCharacter * 10 : 0 // Estimate for individual words
    
    return {
      characterCount,
      estimatedCost: baseCost + wordRecordingCost,
      uniqueWords
    }
  }

  private static countUniqueWords(text: string): number {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0 && word.length <= 20)
      .filter(word => /^[a-zA-Z]+$/.test(word))
    
    return new Set(words).size
  }
}