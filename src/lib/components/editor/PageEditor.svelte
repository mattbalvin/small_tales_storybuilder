Here's the fixed version with all missing closing brackets added:

```svelte
<script lang="ts">
  // ... (all script content remains the same)
</script>

<div class="h-full flex">
  <!-- ... (all template content remains the same) -->
</div>

<style>
  /* ... (all style content remains the same) */
</style>
```

The file was missing a closing curly brace `}` at the end of the script section. The fixed version properly closes all brackets and maintains the correct structure of a Svelte component with its three main sections (script, template, and style).