/*
  # Generate Narration Edge Function

  This function creates comprehensive narration resources using ElevenLabs API:
  - Full voice recording of the provided text
  - Word-level timestamps for synchronization
  - Individual word recordings for each unique word
  - Utility functions for playback and management
  
  1. Narration Resource Structure
    - text: Original text used for generation
    - fullAudio: Complete narration audio URL and metadata
    - wordTimestamps: Array of word timing data
    - wordRecordings: Map of unique words to their audio URLs
    - metadata: Generation settings and voice info
  
  2. Features
    - Word-level timing synchronization
    - Individual word pronunciation recordings
    - Playback utilities for full narration or specific words
    - Support for multiple ElevenLabs voices
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface GenerateNarrationRequest {
  text: string;
  voice_id?: string;
  model_id?: string;
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  include_word_recordings?: boolean;
}

interface WordTimestamp {
  word: string;
  start_time: number; // milliseconds from start
  end_time: number;   // milliseconds from start
  confidence?: number;
}

interface NarrationResource {
  id: string;
  text: string;
  fullAudio: {
    url: string;
    duration: number; // milliseconds
    size_bytes: number;
    format: string;
  };
  wordTimestamps: WordTimestamp[];
  wordRecordings: Record<string, {
    url: string;
    size_bytes: number;
    format: string;
  }>;
  metadata: {
    voice_id: string;
    voice_name: string;
    model_id: string;
    voice_settings: any;
    character_count: number;
    unique_words: number;
    created_at: string;
  };
}

// Predefined voices optimized for narration
const NARRATION_VOICES = {
    // Female voices good for storytelling
    clara: { id: '8LVfoRdkh4zgjr8v5ObE', name: 'Clara', gender: 'female', description: 'Calm, warm storytelling voice' },
    domi: { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'female', description: 'Strong, confident narrator' },
    bella: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'female', description: 'Friendly, engaging voice' },
    aria: { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', gender: 'female', description: 'Calm, informative voice' },
    amelia: { id: 'ZF6FPAbjXT4488VcRRnw', name: 'Amelia', gender: 'female', description: 'Clear, expressive, British accent narrator' },

    // Male voices good for storytelling  
    adam: { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', description: 'Deep, authoritative narrator' },
    sam: { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', gender: 'male', description: 'Clear, professional voice' },
    josh: { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', gender: 'male', description: 'Deep, authoritative narrator' },
    liam: { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', gender: 'male', description: 'Young, energetic warm narrator' },

    // Child-friendly voices
    dorothy: { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy', gender: 'female', description: 'Gentle, child-friendly voice' }
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get ElevenLabs API key
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: GenerateNarrationRequest = await req.json();
    
    if (!body.text || typeof body.text !== 'string' || body.text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Valid text is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const text = body.text.trim();
    const voiceId = body.voice_id || '8LVfoRdkh4zgjr8v5ObE'; // Default to Clara
    const modelId = body.model_id || 'eleven_multilingual_v2';
    const includeWordRecordings = body.include_word_recordings !== false; // Default true

    // Default voice settings optimized for narration
    const voiceSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
      ...body.voice_settings
    };

    const voiceInfo = Object.values(NARRATION_VOICES).find(v => v.id === voiceId) || 
                     { id: voiceId, name: 'Custom Voice', description: 'Custom voice' };

    console.log('Generating narration:', {
      text_length: text.length,
      voice_id: voiceId,
      voice_name: voiceInfo.name,
      model_id: modelId,
      include_word_recordings: includeWordRecordings
    });

    // Step 1: Generate full narration with alignment data
    const fullNarrationResult = await generateFullNarration(
      text, 
      voiceId, 
      modelId, 
      voiceSettings, 
      elevenLabsApiKey
    );

    // Step 2: Extract unique words for individual recordings
    const uniqueWords = extractUniqueWords(text);
    console.log(`Found ${uniqueWords.length} unique words for individual recording`);

    // Step 3: Generate individual word recordings (if requested)
    let wordRecordings: Record<string, any> = {};
    if (includeWordRecordings && uniqueWords.length > 0) {
      wordRecordings = await generateWordRecordings(
        uniqueWords,
        voiceId,
        modelId,
        voiceSettings,
        elevenLabsApiKey
      );
    }

    // Step 4: Create narration resource
    const narrationId = generateId();
    const narrationResource: NarrationResource = {
      id: narrationId,
      text: text,
      fullAudio: {
        url: fullNarrationResult.audioUrl,
        duration: fullNarrationResult.duration,
        size_bytes: fullNarrationResult.size_bytes,
        format: 'audio/mpeg'
      },
      wordTimestamps: fullNarrationResult.wordTimestamps,
      wordRecordings: wordRecordings,
      metadata: {
        voice_id: voiceId,
        voice_name: voiceInfo.name,
        model_id: modelId,
        voice_settings: voiceSettings,
        character_count: text.length,
        unique_words: uniqueWords.length,
        created_at: new Date().toISOString()
      }
    };

    console.log('Narration generation completed:', {
      id: narrationId,
      full_audio_size: fullNarrationResult.size_bytes,
      word_recordings_count: Object.keys(wordRecordings).length,
      duration_ms: fullNarrationResult.duration,
      word_timestamps_count: fullNarrationResult.wordTimestamps.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        narration: narrationResource,
        utilities: generateUtilityFunctions()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('Error in generate-narration function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function generateFullNarration(
  text: string, 
  voiceId: string, 
  modelId: string, 
  voiceSettings: any, 
  apiKey: string
) {
  // Generate audio with alignment data for word timestamps
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: text,
      model_id: modelId,
      voice_settings: voiceSettings,
      output_format: 'mp3_44100_128'
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  
  console.log('ElevenLabs API result alignment data:', JSON.stringify(result.alignment, null, 2));

  // Convert base64 audio to data URL
  const audioUrl = `data:audio/mpeg;base64,${result.audio_base64}`;
  
  // Process alignment data to create word timestamps
  const wordTimestamps: WordTimestamp[] = [];
  if (result.alignment && result.alignment.characters) {
    const processedTimestamps = processAlignmentData(result.alignment, text);
    console.log('Processed alignment data result:', JSON.stringify(processedTimestamps, null, 2));
    wordTimestamps.push(...processedTimestamps);
  } else {
    // Fallback: estimate word timings based on average speaking rate
    console.log('Falling back to estimating word timings.');
    const estimatedTimestamps = estimateWordTimings(text, result.audio_duration_ms || 5000);
    console.log('Estimated word timings result:', JSON.stringify(estimatedTimestamps, null, 2));
    wordTimestamps.push(...estimatedTimestamps);
  }

  return {
    audioUrl: audioUrl,
    duration: result.audio_duration_ms || estimateAudioDuration(text),
    size_bytes: Math.floor(result.audio_base64.length * 0.75), // Approximate size from base64
    wordTimestamps: wordTimestamps
  };
}

async function generateWordRecordings(
  words: string[], 
  voiceId: string, 
  modelId: string, 
  voiceSettings: any, 
  apiKey: string
): Promise<Record<string, any>> {
  const recordings: Record<string, any> = {};
  const batchSize = 5; // Process words in batches to avoid rate limits
  
  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    const batchPromises = batch.map(word => generateSingleWordRecording(
      word, voiceId, modelId, voiceSettings, apiKey
    ));
    
    try {
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        const word = batch[index];
        if (result.status === 'fulfilled' && result.value) {
          recordings[word] = result.value;
        } else {
          console.warn(`Failed to generate recording for word: ${word}`, 
                      result.status === 'rejected' ? result.reason : 'Unknown error');
        }
      });
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < words.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error processing batch ${i}-${i + batchSize}:`, error);
    }
  }
  
  return recordings;
}

// Determine if a word needs "The word is" prefix for better pronunciation
function needsWordPrefix(word: string): boolean {
  const wordLower = word.toLowerCase();
  
  // Very short words (3 characters or less) that often get mispronounced
  const shortWords = [
    'a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'by', 'up', 'it', 'is', 'be', 'or', 'as', 
    'no', 'so', 'we', 'he', 'me', 'my', 'go', 'do', 'if', 'am', 'us', 'oh', 'ah', 'hi', 'ok', 
    'um', 'eh', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'and', 'but', 'for', 'nor', 'yet'
  ];
  
  // Use prefix for words 3 characters or less that are in our short words list
  return word.length <= 3 && shortWords.includes(wordLower);
}

async function generateSingleWordRecording(
  word: string, 
  voiceId: string, 
  modelId: string, 
  voiceSettings: any, 
  apiKey: string
) {
  try {
    // Determine the text to send to ElevenLabs
    let textToSpeak: string;
    
    if (needsWordPrefix(word)) {
      // For short words that need context, use "The word is" prefix
      textToSpeak = `The word is ${word}.`;
      console.log(`Generating recording for short word "${word}" with prefix`);
    } else {
      // For longer words, just use the word itself
      textToSpeak = word;
      console.log(`Generating recording for word "${word}" without prefix`);
    }
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: textToSpeak,
        model_id: modelId,
        voice_settings: {
          ...voiceSettings,
          // Slightly more stable settings for individual words
          stability: Math.min(voiceSettings.stability + 0.1, 1.0),
          similarity_boost: Math.min(voiceSettings.similarity_boost + 0.05, 1.0),
        },
        output_format: 'mp3_44100_128'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    return {
      url: audioUrl,
      size_bytes: audioBuffer.byteLength,
      format: 'audio/mpeg',
      text_used: textToSpeak, // Store what text was actually sent for debugging
      has_prefix: needsWordPrefix(word) // Store whether prefix was used
    };
  } catch (error) {
    console.error(`Failed to generate recording for word "${word}":`, error);
    return null;
  }
}

function extractUniqueWords(text: string): string[] {
  // Improved word extraction that preserves contractions like "fergie's"
  const words = text
    .toLowerCase()
    // Replace em-dashes, en-dashes, and other punctuation with spaces, but preserve apostrophes in contractions
    .replace(/[—–\-\.,;:!?\(\)\[\]""\"""''`~@#$%^&*+=<>{}|\\\/]/g, ' ')
    // Split on whitespace
    .split(/\s+/)
    // Filter out empty strings and very long words
    .filter(word => word.length > 0 && word.length <= 20)
    // Only keep words that contain letters (allows apostrophes in contractions)
    .filter(word => /[a-zA-Z]/.test(word))
    // Clean up any remaining non-letter, non-apostrophe characters at start/end
    .map(word => word.replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, ''))
    // Filter out empty results from cleaning
    .filter(word => word.length > 0);
  
  return [...new Set(words)]; // Remove duplicates
}

function processAlignmentData(alignment: any, text: string): WordTimestamp[] {
  const timestamps: WordTimestamp[] = [];
  
  if (!alignment.characters || !Array.isArray(alignment.characters)) {
    return estimateWordTimings(text, alignment.duration_ms || 5000);
  }
  
  let currentWord = '';
  let wordStartTime = 0;
  let charIndex = 0;
  
  for (const charData of alignment.characters) {
    const char = charData.character;
    const startTime = Math.round(charData.start_time_ms || 0);
    const endTime = Math.round(charData.end_time_ms || 0);
    
    if (/\s/.test(char) || charIndex === alignment.characters.length - 1) {
      // End of word or end of text
      if (currentWord.trim().length > 0) {
        // Clean the word similar to how we extract unique words
        const cleanWord = currentWord.trim().replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, '');
        if (cleanWord.length > 0) {
          timestamps.push({
            word: cleanWord,
            start_time: wordStartTime,
            end_time: endTime,
            confidence: charData.confidence || 1.0
          });
        }
      }
      currentWord = '';
      wordStartTime = endTime;
    } else {
      if (currentWord === '') {
        wordStartTime = startTime;
      }
      currentWord += char;
    }
    charIndex++;
  }
  
  return timestamps;
}

function estimateWordTimings(text: string, totalDurationMs: number): WordTimestamp[] {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const timestamps: WordTimestamp[] = [];
  
  if (words.length === 0) return timestamps;
  
  const avgWordDuration = totalDurationMs / words.length;
  let currentTime = 0;
  
  words.forEach((word, index) => {
    const wordDuration = avgWordDuration * (0.8 + Math.random() * 0.4); // Add some variation
    // Clean the word similar to how we extract unique words
    const cleanWord = word.replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, '');
    if (cleanWord.length > 0) {
      timestamps.push({
        word: cleanWord,
        start_time: Math.round(currentTime),
        end_time: Math.round(currentTime + wordDuration),
        confidence: 0.5 // Lower confidence for estimated timings
      });
    }
    currentTime += wordDuration;
  });
  
  return timestamps;
}

function estimateAudioDuration(text: string): number {
  // Estimate based on average speaking rate (150-200 words per minute for narration)
  const words = text.split(/\s+/).length;
  const wordsPerMinute = 175; // Average narration speed
  return Math.round((words / wordsPerMinute) * 60 * 1000); // Convert to milliseconds
}

function generateId(): string {
  return 'narr_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function generateUtilityFunctions(): string {
  return `
// Narration Utility Functions
// These functions help manage and play narration resources

class NarrationPlayer {
  constructor(narration) {
    this.narration = narration;
    this.audio = null;
    this.currentWordIndex = -1;
    this.isPlaying = false;
    this.animationFrame = null;
    this.onWordHighlight = null; // Callback for word highlighting
    this.onPlaybackEnd = null;   // Callback for playback completion
    this.onPlaybackStart = null; // Callback for playback start
    this.onPlaybackPause = null; // Callback for playback pause
  }

  // Play the full narration with word highlighting
  async playFull() {
    if (this.audio) {
      this.audio.pause();
    }

    this.audio = new Audio(this.narration.fullAudio.url);
    this.audio.currentTime = 0;
    this.currentWordIndex = -1;
    this.isPlaying = true;

    // Set up word highlighting
    this.setupWordHighlighting();

    try {
      await this.audio.play();
      if (this.onPlaybackStart) {
        this.onPlaybackStart();
      }
    } catch (error) {
      console.error('Failed to play narration:', error);
      this.isPlaying = false;
      throw error;
    }
  }

  // Play a specific word
  async playWord(word) {
    const wordLower = word.toLowerCase();
    const wordRecording = this.narration.wordRecordings[wordLower];
    
    if (!wordRecording) {
      console.warn('No recording found for word:', word);
      return false;
    }

    if (this.audio) {
      this.audio.pause();
    }

    this.audio = new Audio(wordRecording.url);
    
    try {
      await this.audio.play();
      return true;
    } catch (error) {
      console.error('Failed to play word:', word, error);
      return false;
    }
  }

  // Seek to a specific word in the full narration
  seekToWord(word) {
    if (!this.audio) return false;

    const wordData = this.narration.wordTimestamps.find(w => 
      w.word.toLowerCase() === word.toLowerCase()
    );

    if (wordData) {
      this.audio.currentTime = wordData.start_time / 1000; // Convert ms to seconds
      return true;
    }

    return false;
  }

  // Pause playback
  pause() {
    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
      if (this.onPlaybackPause) {
        this.onPlaybackPause();
      }
    }
  }

  // Resume playback
  resume() {
    if (this.audio && !this.isPlaying) {
      this.audio.play();
      this.isPlaying = true;
      if (this.onPlaybackStart) {
        this.onPlaybackStart();
      }
    }
  }

  // Stop playback
  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
      this.currentWordIndex = -1;
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
    }
  }

  // Set up word highlighting during playback
  setupWordHighlighting() {
    if (!this.audio) return;

    const updateHighlight = () => {
      if (!this.isPlaying || !this.audio) return;

      const currentTimeMs = this.audio.currentTime * 1000;
      const currentWord = this.narration.wordTimestamps.find(w => 
        currentTimeMs >= w.start_time && currentTimeMs <= w.end_time
      );

      if (currentWord) {
        const wordIndex = this.narration.wordTimestamps.indexOf(currentWord);
        if (wordIndex !== this.currentWordIndex) {
          this.currentWordIndex = wordIndex;
          if (this.onWordHighlight) {
            this.onWordHighlight(currentWord, wordIndex);
          }
        }
      }

      if (this.isPlaying) {
        this.animationFrame = requestAnimationFrame(updateHighlight);
      }
    };

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      updateHighlight();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.currentWordIndex = -1;
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
      if (this.onPlaybackEnd) {
        this.onPlaybackEnd();
      }
    });
  }

  // Get current playback position info
  getCurrentPosition() {
    if (!this.audio) return null;

    const currentTimeMs = this.audio.currentTime * 1000;
    const currentWord = this.narration.wordTimestamps.find(w => 
      currentTimeMs >= w.start_time && currentTimeMs <= w.end_time
    );

    return {
      timeMs: currentTimeMs,
      progress: currentTimeMs / this.narration.fullAudio.duration,
      currentWord: currentWord,
      wordIndex: currentWord ? this.narration.wordTimestamps.indexOf(currentWord) : -1
    };
  }

  // Get narration metadata
  getMetadata() {
    return {
      duration: this.narration.fullAudio.duration,
      wordCount: this.narration.wordTimestamps.length,
      uniqueWords: Object.keys(this.narration.wordRecordings).length,
      voice: this.narration.metadata.voice_name,
      text: this.narration.text
    };
  }

  // Check if a word has an individual recording
  hasWordRecording(word) {
    return word.toLowerCase() in this.narration.wordRecordings;
  }

  // Get all available words with recordings
  getAvailableWords() {
    return Object.keys(this.narration.wordRecordings);
  }

  // Destroy the player and clean up resources
  destroy() {
    this.stop();
    if (this.audio) {
      this.audio.src = '';
      this.audio = null;
    }
    this.onWordHighlight = null;
    this.onPlaybackEnd = null;
    this.onPlaybackStart = null;
    this.onPlaybackPause = null;
  }
}

// Usage example:
// const player = new NarrationPlayer(narrationResource);
// player.onWordHighlight = (word, index) => highlightWordInUI(word);
// player.onPlaybackEnd = () => showCompletionMessage();
// await player.playFull();
`;
}