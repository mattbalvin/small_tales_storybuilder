<script lang="ts">
  import Button from '$lib/components/ui/button.svelte'
  import { Monitor, Smartphone, Eye, EyeOff } from 'lucide-svelte'

  export let orientation: 'landscape' | 'portrait'
  export let showSafetyZones: boolean
</script>

<div class="flex items-center gap-3">
  <div class="flex rounded-xl border border-periwinkle-blue/30 shadow-sm">
    <Button
      variant={orientation === 'landscape' ? 'secondary' : 'ghost'}
      size="sm"
      class="rounded-r-none"
      on:click={() => orientation = 'landscape'}
    >
      <Monitor class="w-4 h-4 mr-1" />
      16:9
    </Button>
    <Button
      variant={orientation === 'portrait' ? 'secondary' : 'ghost'}
      size="sm"
      class="rounded-l-none border-l"
      on:click={() => orientation = 'portrait'}
    >
      <Smartphone class="w-4 h-4 mr-1" />
      9:16
    </Button>
  </div>

  <Button
    variant={showSafetyZones ? 'secondary' : 'outline'}
    size="sm"
    on:click={() => showSafetyZones = !showSafetyZones}
    class="accent-element"
  >
    {#if showSafetyZones}
      <Eye class="w-4 h-4 mr-1" />
    {:else}
      <EyeOff class="w-4 h-4 mr-1" />
    {/if}
    Safety Zones
  </Button>
</div>