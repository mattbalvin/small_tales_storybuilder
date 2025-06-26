<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let element: any
  export let readonly = false

  const dispatch = createEventDispatcher()

  let textElement: HTMLElement

  function handleTextChange(event: Event) {
    if (readonly) return
    
    const target = event.target as HTMLElement
    dispatch('update', {
      properties: {
        ...element.properties,
        text: target.innerHTML || ''
      }
    })
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (readonly) return

    // Handle bold (Ctrl+B or Cmd+B)
    if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
      event.preventDefault()
      document.execCommand('bold', false)
      handleTextChange(event)
    }
    
    // Handle italic (Ctrl+I or Cmd+I)
    if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
      event.preventDefault()
      document.execCommand('italic', false)
      handleTextChange(event)
    }
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
    padding: 4px;
    border: none;
    outline: none;
    resize: none;
    line-height: 1.4;
    border-radius: 4px;
    overflow: hidden;
    ${readonly ? 'pointer-events: none;' : ''}
  `

  // Set initial content when element loads
  $: if (textElement && element.properties?.text !== undefined) {
    if (textElement.innerHTML !== element.properties.text) {
      textElement.innerHTML = element.properties.text || 'Enter text...'
    }
  }
</script>

<div
  bind:this={textElement}
  contenteditable={!readonly}
  {style}
  on:blur={handleTextChange}
  on:input={handleTextChange}
  on:keydown={handleKeyDown}
  role="textbox"
  tabindex={readonly ? -1 : 0}
>
  {element.properties?.text || 'Enter text...'}
</div>

<style>
  /* Ensure consistent styling for bold and italic elements */
  :global([contenteditable] b, [contenteditable] strong) {
    font-weight: bold;
  }
  
  :global([contenteditable] i, [contenteditable] em) {
    font-style: italic;
  }
  
  /* Remove default browser margins/padding from formatting elements */
  :global([contenteditable] b, [contenteditable] strong, [contenteditable] i, [contenteditable] em) {
    margin: 0;
    padding: 0;
  }
</style>