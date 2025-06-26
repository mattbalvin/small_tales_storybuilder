<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
  import type { StoryPage, PageElement } from '$lib/types/database';

  export let page: StoryPage;
  export let orientation: 'landscape' | 'portrait' = 'landscape';
  export let zoom = 1;
  export let readonly = false;

  const dispatch = createEventDispatcher();

  let canvas: HTMLDivElement;
  let isDragging = false;
  let dragElement: PageElement | null = null;
  let dragOffset = { x: 0, y: 0 };

  $: currentContent = page.content?.[orientation] || { elements: [], background: null };

  function handleElementClick(element: PageElement, event: MouseEvent) {
    if (readonly) return;
    
    event.stopPropagation();
    dispatch('elementSelect', element);
  }

  function handleCanvasClick() {
    if (readonly) return;
    dispatch('elementSelect', null);
  }

  function startDrag(element: PageElement, event: MouseEvent) {
    if (readonly) return;
    
    isDragging = true;
    dragElement = element;
    
    const rect = canvas.getBoundingClientRect();
    dragOffset = {
      x: event.clientX - rect.left - (element.x || 0) * zoom,
      y: event.clientY - rect.top - (element.y || 0) * zoom
    };
    
    event.preventDefault();
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDragging || !dragElement || readonly) return;
    
    const rect = canvas.getBoundingClientRect();
    const newX = (event.clientX - rect.left - dragOffset.x) / zoom;
    const newY = (event.clientY - rect.top - dragOffset.y) / zoom;
    
    dispatch('elementUpdate', {
      ...dragElement,
      x: Math.max(0, newX),
      y: Math.max(0, newY)
    });
  }

  function handleMouseUp() {
    isDragging = false;
    dragElement = null;
  }

  onMount(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  });
</script>

<div class="relative w-full h-full overflow-hidden">
  <div 
    bind:this={canvas}
    class="relative w-full h-full cursor-crosshair"
    style="transform: scale({zoom}); transform-origin: top left;"
    on:click={handleCanvasClick}
    role="button"
    tabindex="0"
  >
    <!-- Background -->
    {#if currentContent.background}
      <div 
        class="absolute inset-0 bg-cover bg-center"
        style="background-image: url({currentContent.background})"
      />
    {/if}
    
    <!-- Elements -->
    {#each currentContent.elements || [] as element (element.id)}
      <div
        class="absolute cursor-move select-none"
        style="
          left: {element.x || 0}px;
          top: {element.y || 0}px;
          width: {element.width || 100}px;
          height: {element.height || 100}px;
          z-index: {element.zIndex || 1};
        "
        on:click={(e) => handleElementClick(element, e)}
        on:mousedown={(e) => startDrag(element, e)}
        role="button"
        tabindex="0"
      >
        {#if element.type === 'text'}
          <div
            class="w-full h-full flex items-center justify-center text-center"
            style="
              font-size: {element.fontSize || 16}px;
              color: {element.color || '#000000'};
              font-family: {element.fontFamily || 'Arial'};
              font-weight: {element.fontWeight || 'normal'};
            "
          >
            {element.content || 'Text'}
          </div>
        {:else if element.type === 'image'}
          <img
            src={element.src}
            alt={element.alt || ''}
            class="w-full h-full object-cover rounded"
          />
        {:else if element.type === 'audio'}
          <div class="w-full h-full bg-blue-100 border-2 border-blue-300 rounded flex items-center justify-center">
            <span class="text-blue-600 text-sm">🎵 Audio</span>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

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