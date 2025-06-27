<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { authStore } from '$lib/stores/auth'
  import { ImageGenerationService, type ImageGenerationRequest } from '$lib/services/imageGeneration'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import Textarea from '$lib/components/ui/textarea.svelte'
  import { Wand2, X, Download, Save, Eye, Sparkles, Zap, Palette, Camera } from 'lucide-svelte'

  const dispatch = createEventDispatcher()

  export let show = false

  let prompt = ''
  let selectedModel = 'flux-1.1-pro'
  let aspectRatio = '1:1'
  let style = 'auto'
  let numOutputs = 1
  let advancedSettings = false
  let generating = false
  let generatedImages: string[] = []
  let generationResult: any = null
  let filename = ''

  // Advanced settings
  let width = 1024
  let height = 1024
  let guidanceScale = 3.5
  let numInferenceSteps = 28
  let seed = 0
  let safetyTolerance = 2
  let useRandomSeed = true

  $: currentModel = ImageGenerationService.MODELS[selectedModel as keyof typeof ImageGenerationService.MODELS]
  $: recommendedModel = ImageGenerationService.getModelRecommendation(prompt)
  $: estimatedCost = ImageGenerationService.estimateCost(selectedModel, numOutputs)
  $: isFluxModel = selectedModel === 'flux-1.1-pro'
  $: isIdeogramModel = selectedModel === 'ideogram-v3-balanced'
  $: isImagenModel = selectedModel === 'imagen-4'

  // Update dimensions when aspect ratio changes for FLUX
  $: if (isFluxModel && aspectRatio) {
    updateDimensionsFromAspectRatio()
  }

  function updateDimensionsFromAspectRatio() {
    if (!isFluxModel) return
    
    const ratios = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1344, height: 768 },
      '9:16': { width: 768, height: 1344 },
      '4:3': { width: 1152, height: 896 },
      '3:4': { width: 896, height: 1152 },
      '21:9': { width: 1536, height: 640 },
      '2:3': { width: 832, height: 1216 },
      '3:2': { width: 1216, height: 832 }
    }
    
    const ratio = ratios[aspectRatio as keyof typeof ratios]
    if (ratio) {
      width = ratio.width
      height = ratio.height
    }
  }

  async function generateImages() {
    if (!prompt.trim() || !$authStore.user) return

    generating = true
    generatedImages = []
    generationResult = null

    try {
      const options: ImageGenerationRequest = {
        prompt: prompt.trim(),
        model: selectedModel as any,
        num_outputs: numOutputs
      }

      // Add model-specific parameters
      if (isFluxModel) {
        options.width = width
        options.height = height
        options.guidance_scale = guidanceScale
        options.num_inference_steps = numInferenceSteps
        options.safety_tolerance = safetyTolerance
        if (!useRandomSeed) {
          options.seed = seed
        }
      } else if (isIdeogramModel) {
        options.aspect_ratio = aspectRatio
        options.style = style
        options.safety_tolerance = safetyTolerance
      } else if (isImagenModel) {
        options.aspect_ratio = aspectRatio
        options.safety_tolerance = safetyTolerance
      }

      const result = await ImageGenerationService.generateImage(options)
      generatedImages = result.images
      generationResult = result

    } catch (error) {
      console.error('Failed to generate images:', error)
      alert(`Failed to generate images: ${error.message}`)
    } finally {
      generating = false
    }
  }

  async function saveToLibrary() {
    if (!generationResult || !$authStore.user) return

    try {
      const options: ImageGenerationRequest = {
        prompt: generationResult.prompt,
        model: generationResult.model,
        ...generationResult.parameters
      }

      const result = await ImageGenerationService.generateAndUploadImage(
        options,
        $authStore.user.id,
        filename.trim() || undefined
      )

      dispatch('images-generated', {
        urls: result.urls,
        assets: result.assets,
        count: result.assets.length
      })

      closeModal()
    } catch (error) {
      console.error('Failed to save images:', error)
      alert(`Failed to save images: ${error.message}`)
    }
  }

  function downloadImage(imageUrl: string, index: number) {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `generated-image-${index + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function closeModal() {
    show = false
    prompt = ''
    selectedModel = 'flux-1.1-pro'
    aspectRatio = '1:1'
    style = 'auto'
    numOutputs = 1
    advancedSettings = false
    generatedImages = []
    generationResult = null
    filename = ''
    useRandomSeed = true
  }

  function useRecommendedModel() {
    selectedModel = recommendedModel
  }

  function getModelIcon(model: string) {
    switch (model) {
      case 'flux-1.1-pro': return Zap
      case 'ideogram-v3-balanced': return Palette
      case 'imagen-4': return Camera
      default: return Sparkles
    }
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <Card class="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <Wand2 class="w-5 h-5 text-primary" />
            <h2 class="text-xl font-semibold">Generate Images</h2>
          </div>
          <Button variant="ghost" size="sm" on:click={closeModal}>
            <X class="w-4 h-4" />
          </Button>
        </div>

        <!-- Prompt Input -->
        <div class="space-y-4 mb-6">
          <div>
            <label class="text-sm font-medium mb-2 block">Image Description</label>
            <Textarea
              bind:value={prompt}
              placeholder="Describe the image you want to generate... Be specific and detailed for best results."
              rows={3}
              class="w-full"
            />
            <div class="flex items-center justify-between mt-1">
              <p class="text-xs text-muted-foreground">
                {prompt.length} characters
              </p>
              {#if recommendedModel !== selectedModel && prompt.length > 10}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  class="text-xs h-6"
                  on:click={useRecommendedModel}
                >
                  💡 Try {ImageGenerationService.MODELS[recommendedModel].name}
                </Button>
              {/if}
            </div>
          </div>
        </div>

        <!-- Model Selection -->
        <div class="mb-6">
          <label class="text-sm font-medium mb-3 block">AI Model</label>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            {#each Object.entries(ImageGenerationService.MODELS) as [key, model]}
              {@const ModelIcon = getModelIcon(key)}
              <button
                class="p-3 border rounded-lg text-left transition-colors hover:bg-muted {selectedModel === key ? 'border-primary bg-primary/5' : 'border-border'}"
                on:click={() => selectedModel = key}
              >
                <div class="flex items-center gap-2 mb-2">
                  <svelte:component this={ModelIcon} class="w-4 h-4 text-primary" />
                  <span class="font-medium text-sm">{model.name}</span>
                  {#if key === recommendedModel}
                    <span class="text-xs bg-primary/10 text-primary px-1 rounded">Recommended</span>
                  {/if}
                </div>
                <p class="text-xs text-muted-foreground mb-2">{model.description}</p>
                <div class="flex flex-wrap gap-1">
                  {#each model.strengths as strength}
                    <span class="text-xs bg-muted px-1 rounded">{strength}</span>
                  {/each}
                </div>
              </button>
            {/each}
          </div>
        </div>

        <!-- Basic Settings -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <!-- Aspect Ratio / Dimensions -->
          <div>
            <label class="text-sm font-medium mb-2 block">
              {isFluxModel ? 'Dimensions' : 'Aspect Ratio'}
            </label>
            {#if isFluxModel}
              <div class="space-y-2">
                <select 
                  bind:value={aspectRatio}
                  class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {#each Object.entries(ImageGenerationService.ASPECT_RATIOS) as [ratio, label]}
                    <option value={ratio}>{label}</option>
                  {/each}
                </select>
                <div class="text-xs text-muted-foreground">
                  {width} × {height}
                </div>
              </div>
            {:else}
              <select 
                bind:value={aspectRatio}
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {#each Object.entries(ImageGenerationService.ASPECT_RATIOS) as [ratio, label]}
                  <option value={ratio}>{label}</option>
                {/each}
              </select>
            {/if}
          </div>

          <!-- Style (Ideogram only) -->
          {#if isIdeogramModel}
            <div>
              <label class="text-sm font-medium mb-2 block">Style</label>
              <select 
                bind:value={style}
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {#each Object.entries(ImageGenerationService.STYLES) as [styleKey, styleLabel]}
                  <option value={styleKey}>{styleLabel}</option>
                {/each}
              </select>
            </div>
          {/if}

          <!-- Number of Images -->
          <div>
            <label class="text-sm font-medium mb-2 block">Number of Images</label>
            <select 
              bind:value={numOutputs}
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value={1}>1 image</option>
              <option value={2}>2 images</option>
              <option value={3}>3 images</option>
              <option value={4}>4 images</option>
            </select>
            <div class="text-xs text-muted-foreground mt-1">
              Est. cost: ${estimatedCost.toFixed(3)}
            </div>
          </div>
        </div>

        <!-- Advanced Settings -->
        {#if isFluxModel}
          <div class="mb-6">
            <div class="flex items-center gap-2 mb-3">
              <input 
                type="checkbox" 
                id="advancedSettings" 
                bind:checked={advancedSettings}
                class="rounded border-input"
              />
              <label for="advancedSettings" class="text-sm font-medium">Advanced Settings</label>
            </div>

            {#if advancedSettings}
              <div class="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <label class="text-sm font-medium mb-1 block">Guidance Scale: {guidanceScale}</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    step="0.5" 
                    bind:value={guidanceScale}
                    class="w-full"
                  />
                  <p class="text-xs text-muted-foreground">Higher values follow prompt more closely</p>
                </div>
                
                <div>
                  <label class="text-sm font-medium mb-1 block">Inference Steps: {numInferenceSteps}</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    step="1" 
                    bind:value={numInferenceSteps}
                    class="w-full"
                  />
                  <p class="text-xs text-muted-foreground">More steps = higher quality, slower generation</p>
                </div>

                <div>
                  <label class="text-sm font-medium mb-1 block">Safety Tolerance: {safetyTolerance}</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    step="1" 
                    bind:value={safetyTolerance}
                    class="w-full"
                  />
                  <p class="text-xs text-muted-foreground">1 = Strict, 5 = Permissive</p>
                </div>

                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <input 
                      type="checkbox" 
                      id="useRandomSeed" 
                      bind:checked={useRandomSeed}
                      class="rounded border-input"
                    />
                    <label for="useRandomSeed" class="text-sm font-medium">Random Seed</label>
                  </div>
                  {#if !useRandomSeed}
                    <Input
                      type="number"
                      bind:value={seed}
                      placeholder="Enter seed number"
                      class="w-full"
                    />
                    <p class="text-xs text-muted-foreground mt-1">Use same seed for reproducible results</p>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Generate Button -->
        <div class="mb-6">
          <Button 
            on:click={generateImages} 
            disabled={!prompt.trim() || generating}
            class="w-full"
            size="lg"
          >
            {#if generating}
              <div class="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
              Generating Images...
            {:else}
              <Wand2 class="w-4 h-4 mr-2" />
              Generate {numOutputs} Image{numOutputs > 1 ? 's' : ''} with {currentModel.name}
            {/if}
          </Button>
        </div>

        <!-- Generated Images -->
        {#if generatedImages.length > 0}
          <div class="border rounded-lg p-4 mb-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium">Generated Images</h3>
              <div class="text-sm text-muted-foreground">
                {generatedImages.length} image{generatedImages.length > 1 ? 's' : ''} • {generationResult.model}
              </div>
            </div>

            <!-- Images Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {#each generatedImages as imageUrl, index}
                <div class="relative group">
                  <img 
                    src={imageUrl} 
                    alt="Generated image {index + 1}"
                    class="w-full aspect-square object-cover rounded-lg border"
                  />
                  
                  <!-- Image Overlay -->
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <div class="flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        on:click={() => downloadImage(imageUrl, index)}
                      >
                        <Download class="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      
                      <Button 
                        variant="secondary" 
                        size="sm"
                        on:click={() => window.open(imageUrl, '_blank')}
                      >
                        <Eye class="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>

            <!-- Generation Info -->
            <div class="bg-muted/30 rounded p-3 mb-4">
              <div class="text-sm">
                <p class="font-medium mb-1">Prompt:</p>
                <p class="text-muted-foreground">{generationResult.prompt}</p>
              </div>
              {#if generationResult.prediction_id}
                <div class="text-xs text-muted-foreground mt-2">
                  Prediction ID: {generationResult.prediction_id}
                </div>
              {/if}
            </div>

            <!-- Filename Input -->
            <div class="mb-4">
              <label class="text-sm font-medium mb-1 block">Filename Prefix (optional)</label>
              <Input
                bind:value={filename}
                placeholder="my-generated-image"
                class="w-full"
              />
              <p class="text-xs text-muted-foreground mt-1">
                Images will be saved as: {filename || 'generated'}-1.png, {filename || 'generated'}-2.png, etc.
              </p>
            </div>

            <!-- Save to Library -->
            <Button on:click={saveToLibrary} class="w-full" size="lg">
              <Save class="w-4 h-4 mr-2" />
              Save {generatedImages.length} Image{generatedImages.length > 1 ? 's' : ''} to Media Library
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