<script lang="ts">
  import '../app.css'
  import { onMount } from 'svelte'
  import { authService } from '$lib/stores/auth'

  onMount(() => {
    authService.initialize()
  })
</script>

<div class="min-h-screen bg-background">
  <slot />
</div>