<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let element: any
  export let readonly = false

  const dispatch = createEventDispatcher()

  function handleTextChange(event: Event) {
    if (readonly) return
    
    const target = event.target as HTMLElement
    dispatch('update', {
      properties: {
        ...element.properties,
        text: target.textContent || ''
      }
    })
  }

  // Convert hex color with alpha to rgba
  function hexToRgba(hex: string, alpha: number): string {
    // Remove # if present
    hex = hex.replace('#', '')
    
    // Parse hex values
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  $: backgroundColor = element.properties?.backgroundColor && element.properties?.backgroundAlpha !== undefined
    ? hexToRgba(element.properties.backgroundColor, element.properties.backgroundAlpha / 100)
    : 'transparent'

  $: style = `
    font-size: ${element.properties?.fontSize || 16}px;
    color: ${element.properties?.color || '#000000'};
    background-color: ${backgroundColor};
    width: 100%;
    height: 100%;
    padding: 8px;
    border: none;
    outline: none;
    resize: none;
    line-height: 1.4;
    border-radius: 4px;
    ${readonly ? 'pointer-events: none;' : ''}
  `
</script>

<div
  contenteditable={!readonly}
  {style}
  on:blur={handleTextChange}
  on:input={handleTextChange}
>
  {element.properties?.text || 'Enter text...'}
</div>