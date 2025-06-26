<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { authStore } from '$lib/stores/auth'
  import { AudioGenerationService } from '$lib/services/audioGeneration'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import Textarea from '$lib/components/ui/textarea.svelte'
  import { Volume2, X, Play, Pause, Download, Wand2 } from 'lucide-svelte'

  const dispatch = createEventDispatcher()

  export let show = false
  export let initialText = ''

  let text = initialText
  let selectedVoice = 'rachel'
  let selectedPreset = 'storytelling'
  let customSettings = false
  let generating = false
  let generatedAudio: any = null
  let audioElement: HTMLAudioElement | null = null
  let isPlaying = false
  let filename = ''

  // Voice settings
  let stability = 0.5
  let similarityBoost = 0.75
  let style = 0.0
  let useSpeakerBoost = true

  $: if (show && initialText !== text) {
    text = initialText
  }

  $: currentVoice = AudioGenerationService.VOICES[selectedVoice as keyof typeof AudioGenerationService.VOICES]
  $: currentPreset = AudioGenerationService.VOICE_PRESETS[selectedPreset as keyof typeof AudioGenerationService.VOICE_PRESETS]

  // Update settings when preset changes
  $: if (!customSettings && currentPreset) {
    stability = currentPreset.stability
    similarityBoost = currentPreset.similarity_boost
    style = currentPreset.style
    useSpeakerBoost = currentPreset.use_speaker_boost
  }

  async function generateAudio() {
    if (!text.trim() || !$authStore.user) return

    generating = true
    generatedAudio = null

    try {
      const options = {
        text: text.trim(),
        voice_id: currentVoice.id,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
          use_speaker_boost: useSpeakerBoost
        }
      }

      const result = await AudioGenerationService.generateAudio(options)
      generatedAudio = result

      // Create audio URL for preview
      const audioBlob = base64ToBlob(result.audio_base64, 'audio/mpeg')
      const audioUrl = URL.createObjectURL(audioBlob)
      
      if (audioElement) {
        audioElement.src = audioUrl
      }

    } catch (error) {
      console.error('Failed to generate audio:', error)
      alert(`Failed to generate audio: ${error.message}`)
    } finally {
      generating = false
    }
  }

  async function saveToLibrary() {
    if (!generatedAudio || !$authStore.user) return

    try {
      const audioFilename = filename.trim() || `narration-${Date.now()}.mp3`
      
      const result = await AudioGenerationService.generateAndUploadAudio(
        text.trim(),
        $authStore.user.id,
        audioFilename,
        {
          voice_id: currentVoice.id,
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style,
            use_speaker_boost: useSpeakerBoost
          }
        }
      )

      dispatch('audio-generated', {
        url: result.url,
        asset: result.asset,
        filename: audioFilename
      })

      closeModal()
    } catch (error) {
      console.error('Failed to save audio:', error)
      alert(`Failed to save audio: ${error.message}`)
    }
  }

  function playPause() {
    if (!audioElement || !generatedAudio) return

    if (isPlaying) {
      audioElement.pause()
    } else {
      audioElement.play()
    }
  }

  function downloadAudio() {
    if (!generatedAudio) return

    const audioBlob = base64ToBlob(generatedAudio.audio_base64, 'audio/mpeg')
    const url = URL.createObjectURL(audioBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename.trim() || `generated-audio-${Date.now()}.mp3`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  function closeModal() {
    show = false
    text = ''
    generatedAudio = null
    isPlaying = false
    filename = ''
    if (audioElement) {
      audioElement.pause()
      audioElement.src = ''
    }
  }

  function handleAudioEvents() {
    if (!audioElement) return
    
    audioElement.addEventListener('play', () => isPlaying = true)
    audioElement.addEventListener('pause', () => isPlaying = false)
    audioElement.addEventListener('ended', () => isPlaying = false)
  }

  $: if (audioElement) {
    handleAudioEvents()
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <Card class="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <Volume2 class="w-5 h-5 text-primary" />
            <h2 class="text-xl font-semibold">Generate Audio Narration</h2>
          </div>
          <Button variant="ghost" size="sm" on:click={closeModal}>
            <X class="w-4 h-4" />
          </Button>
        </div>

        <!-- Text Input -->
        <div class="space-y-4 mb-6">
          <div>
            <label class="text-sm font-medium mb-2 block">Text to Convert</label>
            <Textarea
              bind:value={text}
              placeholder="Enter the text you want to convert to speech..."
              rows={4}
              class="w-full"
            />
            <p class="text-xs text-muted-foreground mt-1">
              {text.length} characters
            </p>
          </div>
        </div>

        <!-- Voice Selection -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="text-sm font-medium mb-2 block">Voice</label>
            <select 
              bind:value={selectedVoice}
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {#each Object.entries(AudioGenerationService.VOICES) as [key, voice]}
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
            </select>
          </div>
        </div>

        <!-- Advanced Settings -->
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <input 
              type="checkbox" 
              id="customSettings" 
              bind:checked={customSettings}
              class="rounded border-input"
            />
            <label for="customSettings" class="text-sm font-medium">Custom Voice Settings</label>
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
            on:click={generateAudio} 
            disabled={!text.trim() || generating}
            class="w-full"
          >
            {#if generating}
              <div class="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
              Generating Audio...
            {:else}
              <Wand2 class="w-4 h-4 mr-2" />
              Generate Audio
            {/if}
          </Button>
        </div>

        <!-- Audio Preview -->
        {#if generatedAudio}
          <div class="border rounded-lg p-4 mb-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-medium">Generated Audio</h3>
              <div class="text-sm text-muted-foreground">
                {generatedAudio.character_count} chars • {Math.round(generatedAudio.audio_size_bytes / 1024)} KB
              </div>
            </div>

            <!-- Audio Element -->
            <audio bind:this={audioElement} class="hidden"></audio>

            <!-- Controls -->
            <div class="flex items-center gap-2 mb-4">
              <Button variant="outline" size="sm" on:click={playPause}>
                {#if isPlaying}
                  <Pause class="w-4 h-4" />
                {:else}
                  <Play class="w-4 h-4" />
                {/if}
              </Button>
              <Button variant="outline" size="sm" on:click={downloadAudio}>
                <Download class="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>

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
</script>

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