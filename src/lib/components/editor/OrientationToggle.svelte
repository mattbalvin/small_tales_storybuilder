<script lang="ts">
  import Button from '$lib/components/ui/button.svelte'
  import { Monitor, Smartphone } from 'lucide-svelte'

  export let orientation: 'landscape' | 'portrait'
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
</div>