<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { authStore } from '$lib/stores/auth'
  import { NarrationGenerationService, type NarrationRequest, type NarrationResource } from '$lib/services/narrationGeneration'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import Textarea from '$lib/components/ui/textarea.svelte'
  import { Volume2, X, Play, Pause, Download, Wand2, Eye, EyeOff } from 'lucide-svelte'

  const dispatch = createEventDispatcher()

  export let show = false
  export let initialText = ''

  let text = initialText
  let selectedVoice = 'rachel'
  let selectedPreset = 'storytelling'
  let customSettings = false
  let includeWordRecordings = true
  let generating = false
  let generatedNarration: NarrationResource | null = null
  let player: any = null
  let isPlaying = false
  let currentWord: string | null = null
  let filename = ''
  let showWordTimestamps = false

  // Voice settings
  let stability = 0.5
  let similarityBoost = 0.75
  let style = 0.0
  let useSpeakerBoost = true

  $: if (show && initialText !== text) {
    text = initialText
  }

  $: currentVoice = NarrationGenerationService.VOICES[selectedVoice as keyof typeof NarrationGenerationService.VOICES]
  $: currentPreset = NarrationGenerationService.VOICE_PRESETS[selectedPreset as keyof typeof NarrationGenerationService.VOICE_PRESETS]
  $: costEstimate = NarrationGenerationService.estimateCost(text, includeWordRecordings)

  // Update settings when preset changes
  $: if (!customSettings && currentPreset) {
    stability = currentPreset.stability
    similarityBoost = currentPreset.similarity_boost
    style = currentPreset.style
    useSpeakerBoost = currentPreset.use_speaker_boost
  }

  async function generateNarration() {
    if (!text.trim() || !$authStore.user) return

    generating = true
    generatedNarration = null
    currentWord = null

    try {
      const options: NarrationRequest = {
        text: text.trim(),
        voice_id: currentVoice.id,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
          use_speaker_boost: useSpeakerBoost
        },
        include_word_recordings: includeWordRecordings
      }

      const narration = await NarrationGenerationService.generateNarration(options)
      generatedNarration = narration

      // Create player
      player = NarrationGenerationService.createPlayer(narration)
      
      // Set up event handlers
      player.onWordHighlight = (word: any, index: number) => {
        currentWord = word.word
      }
      
      player.onPlaybackStart = () => {
        isPlaying = true
      }
      
      player.onPlaybackPause = () => {
        isPlaying = false
      }
      
      player.onPlaybackEnd = () => {
        isPlaying = false
        currentWord = null
      }

    } catch (error) {
      console.error('Failed to generate narration:', error)
      alert(`Failed to generate narration: ${error.message}`)
    } finally {
      generating = false
    }
  }

  async function playPauseNarration() {
    if (!player) return

    if (isPlaying) {
      player.pause()
    } else {
      await player.playFull()
    }
  }

  async function playWord(word: string) {
    if (!player) return
    await player.playWord(word)
  }

  function stopNarration() {
    if (player) {
      player.stop()
      isPlaying = false
      currentWord = null
    }
  }

  function downloadNarration() {
    if (!generatedNarration) return

    const link = document.createElement('a')
    link.href = generatedNarration.fullAudio.url
    link.download = filename.trim() || `narration-${Date.now()}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function saveToLibrary() {
    if (!generatedNarration) return

    dispatch('narration-generated', {
      narration: generatedNarration,
      filename: filename.trim() || `narration-${Date.now()}.mp3`
    })

    closeModal()
  }

  function closeModal() {
    if (player) {
      player.destroy()
      player = null
    }
    
    show = false
    text = ''
    generatedNarration = null
    isPlaying = false
    currentWord = null
    filename = ''
    showWordTimestamps = false
  }

  function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Helper function to get unique words from text for display
  function getUniqueWordsFromText(inputText: string): string[] {
    if (!inputText) return []
    
    return inputText
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/)
      .filter(word => word.length > 0 && word.length <= 20) // Filter out empty and very long words
      .filter(word => /^[a-zA-Z]+$/.test(word)) // Only alphabetic words
      .filter((word, index, array) => array.indexOf(word) === index) // Remove duplicates
  }

  // Get unique words count for display
  $: uniqueWordsInText = getUniqueWordsFromText(text)
  $: uniqueWordCount = uniqueWordsInText.length
</script>

{#if show}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <Card class="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <Volume2 class="w-5 h-5 text-primary" />
            <h2 class="text-xl font-semibold">Generate Narration</h2>
          </div>
          <Button variant="ghost" size="sm" on:click={closeModal}>
            <X class="w-4 h-4" />
          </Button>
        </div>

        <!-- Text Input -->
        <div class="space-y-4 mb-6">
          <div>
            <label class="text-sm font-medium mb-2 block">Text to Narrate</label>
            <Textarea
              bind:value={text}
              placeholder="Enter the text you want to convert to narration..."
              rows={4}
              class="w-full"
            />
            <div class="flex items-center justify-between mt-1">
              <p class="text-xs text-muted-foreground">
                {text.length} characters • {uniqueWordCount} unique words
              </p>
              <p class="text-xs text-muted-foreground">
                Est. cost: ${costEstimate.estimatedCost.toFixed(4)}
              </p>
            </div>
          </div>
        </div>

        <!-- Voice and Settings -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="text-sm font-medium mb-2 block">Voice</label>
            <select 
              bind:value={selectedVoice}
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {#each Object.entries(NarrationGenerationService.VOICES) as [key, voice]}
                <option value={key}>{voice.name} ({voice.gender}) - {voice.description}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="text-sm font-medium mb-2 block">Style Preset</label>
            <select 
              bind:value={selectedPreset}
              on:change={() => customSettings = false}
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="storytelling">Storytelling</option>
              <option value="dramatic">Dramatic</option>
              <option value="calm">Calm</option>
              <option value="energetic">Energetic</option>
              <option value="children">Children's Story</option>
            </select>
          </div>
        </div>

        <!-- Options -->
        <div class="mb-6">
          <div class="flex items-center gap-4 mb-3">
            <div class="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="includeWordRecordings" 
                bind:checked={includeWordRecordings}
                class="rounded border-input"
              />
              <label for="includeWordRecordings" class="text-sm font-medium">Include individual word recordings</label>
            </div>
            
            <div class="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="customSettings" 
                bind:checked={customSettings}
                class="rounded border-input"
              />
              <label for="customSettings" class="text-sm font-medium">Custom voice settings</label>
            </div>
          </div>

          {#if customSettings}
            <div class="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <label class="text-sm font-medium mb-1 block">Stability: {stability}</label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  bind:value={stability}
                  class="w-full"
                />
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">Similarity: {similarityBoost}</label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  bind:value={similarityBoost}
                  class="w-full"
                />
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">Style: {style}</label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  bind:value={style}
                  class="w-full"
                />
              </div>
              <div class="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="speakerBoost" 
                  bind:checked={useSpeakerBoost}
                  class="rounded border-input"
                />
                <label for="speakerBoost" class="text-sm font-medium">Speaker Boost</label>
              </div>
            </div>
          {/if}
        </div>

        <!-- Generate Button -->
        <div class="mb-6">
          <Button 
            on:click={generateNarration} 
            disabled={!text.trim() || generating}
            class="w-full"
          >
            {#if generating}
              <div class="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
              Generating Narration...
            {:else}
              <Wand2 class="w-4 h-4 mr-2" />
              Generate Narration
            {/if}
          </Button>
        </div>

        <!-- Generated Narration -->
        {#if generatedNarration}
          <div class="border rounded-lg p-4 mb-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium">Generated Narration</h3>
              <div class="text-sm text-muted-foreground">
                {formatDuration(generatedNarration.fullAudio.duration)} • 
                {formatFileSize(generatedNarration.fullAudio.size_bytes)} • 
                {generatedNarration.wordTimestamps?.length || 0} words
              </div>
            </div>

            <!-- Playback Controls -->
            <div class="flex items-center gap-2 mb-4">
              <Button variant="outline" size="sm" on:click={playPauseNarration}>
                {#if isPlaying}
                  <Pause class="w-4 h-4" />
                {:else}
                  <Play class="w-4 h-4" />
                {/if}
              </Button>
              
              <Button variant="outline" size="sm" on:click={stopNarration}>
                Stop
              </Button>
              
              <Button variant="outline" size="sm" on:click={downloadNarration}>
                <Download class="w-4 h-4 mr-1" />
                Download
              </Button>

              <div class="flex-1"></div>

              <Button 
                variant="outline" 
                size="sm" 
                on:click={() => showWordTimestamps = !showWordTimestamps}
              >
                {#if showWordTimestamps}
                  <EyeOff class="w-4 h-4 mr-1" />
                  Hide Words
                {:else}
                  <Eye class="w-4 h-4 mr-1" />
                  Show Words
                {/if}
              </Button>
            </div>

            <!-- Current Word Display -->
            {#if currentWord}
              <div class="mb-4 p-2 bg-primary/10 rounded text-center">
                <span class="text-sm text-muted-foreground">Currently highlighting:</span>
                <span class="font-medium text-primary ml-2">{currentWord}</span>
              </div>
            {/if}

            <!-- Word Timestamps Display -->
            {#if showWordTimestamps && generatedNarration.wordTimestamps && generatedNarration.wordTimestamps.length > 0}
              <div class="mb-4">
                <h4 class="text-sm font-medium mb-2">Word Timeline</h4>
                <div class="max-h-32 overflow-y-auto border rounded p-2 bg-muted/20">
                  <div class="flex flex-wrap gap-1">
                    {#each generatedNarration.wordTimestamps as wordData, index}
                      {#if wordData && wordData.word}
                        <button
                          class="px-2 py-1 text-xs rounded border hover:bg-primary/10 transition-colors {currentWord === wordData.word ? 'bg-primary/20 border-primary' : 'bg-background'}"
                          on:click={() => playWord(wordData.word)}
                          title="Click to hear this word • {formatDuration(wordData.start_time || 0)} - {formatDuration(wordData.end_time || 0)}"
                        >
                          {wordData.word}
                        </button>
                      {/if}
                    {/each}
                  </div>
                </div>
                <p class="text-xs text-muted-foreground mt-1">
                  Click any word to hear its pronunciation
                </p>
              </div>
            {/if}

            <!-- Individual Word Recordings Info -->
            {#if includeWordRecordings && generatedNarration.wordRecordings && Object.keys(generatedNarration.wordRecordings).length > 0}
              <div class="mb-4">
                <h4 class="text-sm font-medium mb-2">
                  Individual Word Recordings ({Object.keys(generatedNarration.wordRecordings).length} unique words)
                </h4>
                <div class="text-xs text-muted-foreground">
                  Each unique word has been recorded separately for precise pronunciation playback.
                </div>
                
                <!-- Show unique words that were recorded -->
                <div class="mt-2 max-h-20 overflow-y-auto">
                  <div class="flex flex-wrap gap-1">
                    {#each Object.keys(generatedNarration.wordRecordings) as word}
                      <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded border">
                        {word}
                      </span>
                    {/each}
                  </div>
                </div>
              </div>
            {/if}

            <!-- Expected vs Actual Word Count -->
            {#if includeWordRecordings}
              <div class="mb-4 p-3 bg-muted/20 rounded">
                <div class="text-sm">
                  <div class="flex justify-between items-center">
                    <span>Expected unique words:</span>
                    <span class="font-medium">{uniqueWordCount}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span>Recorded unique words:</span>
                    <span class="font-medium">{generatedNarration.wordRecordings ? Object.keys(generatedNarration.wordRecordings).length : 0}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span>Word timeline entries:</span>
                    <span class="font-medium">{generatedNarration.wordTimestamps?.length || 0}</span>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Filename Input -->
            <div class="mb-4">
              <label class="text-sm font-medium mb-1 block">Filename (optional)</label>
              <Input
                bind:value={filename}
                placeholder="narration-audio.mp3"
                class="w-full"
              />
            </div>

            <!-- Save to Library -->
            <Button on:click={saveToLibrary} class="w-full">
              Save to Media Library
            </Button>
          </div>
        {/if}
      </div>
    </Card>
  </div>
{/if}

<style>
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    background: hsl(var(--muted));
    border-radius: 2px;
    outline: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: hsl(var(--primary));
    border-radius: 50%;
    cursor: pointer;
  }

  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: hsl(var(--primary));
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
</style>