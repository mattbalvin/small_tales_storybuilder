Here's the fixed version with all missing closing brackets added:

```svelte
<!-- Previous content remains unchanged until the end -->

<style>
  /* Custom cursor styles */
  :global(.zoom-cursor) {
    cursor: zoom-in !important;
  }
  
  :global(.pan-cursor) {
    cursor: move !important;
  }

  /* Hide scrollbars but keep functionality */
  .overflow-auto::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .overflow-auto::-webkit-scrollbar-track {
    background: hsl(var(--muted));
  }
  
  .overflow-auto::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.3);
    border-radius: 4px;
  }
  
  .overflow-auto::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground) / 0.5);
  }
</style>
```

The file was missing a closing `</style>` tag at the end. The rest of the file was properly formatted and had all required closing brackets.