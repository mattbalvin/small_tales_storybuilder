<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let element: any
  export let readonly = false

  const dispatch = createEventDispatcher()

  let textElement: HTMLElement
  let isEditing = false
  let originalText = ''

  function startEditing() {
    if (readonly) return
    
    isEditing = true
    originalText = element.properties?.text || ''
    
    // Focus the element after it becomes editable
    setTimeout(() => {
      if (textElement) {
        textElement.focus()
        // Select all text for easy replacement
        const range = document.createRange()
        range.selectNodeContents(textElement)
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    }, 0)
  }

  function finishEditing() {
    if (readonly || !isEditing) return
    
    isEditing = false
    const newText = textElement?.textContent || ''
    
    // Only dispatch update if text actually changed
    if (newText !== originalText) {
      dispatch('update', {
        properties: {
          ...element.properties,
          text: newText
        }
      })
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (readonly) return
    
    if (event.key === 'Enter' && !event.shiftKey) {
      // Enter without shift finishes editing
      event.preventDefault()
      finishEditing()
    } else if (event.key === 'Escape') {
      // Escape cancels editing and restores original text
      event.preventDefault()
      if (textElement) {
        textElement.textContent = originalText
      }
      isEditing = false
    }
  }

  function handleInput(event: Event) {
    if (readonly) return
    
    // Optional: Real-time updates while typing (can be removed if too performance-heavy)
    const target = event.target as HTMLElement
    const newText = target.textContent || ''
    
    // Dispatch update for real-time preview
    dispatch('update', {
      properties: {
        ...element.properties,
        text: newText
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
    cursor: ${readonly ? 'default' : (isEditing ? 'text' : 'pointer')};
    user-select: ${readonly ? 'none' : (isEditing ? 'text' : 'none')};
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    ${readonly ? 'pointer-events: none;' : ''}
    ${isEditing ? 'box-shadow: 0 0 0 2px hsl(var(--primary) / 0.5);' : ''}
  `

  // Handle clicks to start editing
  function handleClick(event: MouseEvent) {
    if (readonly) return
    
    // Only start editing if not already editing
    if (!isEditing) {
      event.stopPropagation() // Prevent element selection in parent
      startEditing()
    }
  }

  // Handle double-click as alternative way to start editing
  function handleDoubleClick(event: MouseEvent) {
    if (readonly) return
    
    event.stopPropagation()
    startEditing()
  }
</script>

<div
  bind:this={textElement}
  contenteditable={!readonly && isEditing}
  {style}
  on:click={handleClick}
  on:dblclick={handleDoubleClick}
  on:blur={finishEditing}
  on:keydown={handleKeydown}
  on:input={handleInput}
  role="textbox"
  tabindex={readonly ? -1 : 0}
  aria-label="Text element"
  class="text-element"
  class:editing={isEditing}
>
  {element.properties?.text || 'Click to edit text...'}
</div>

<style>
  .text-element {
    transition: box-shadow 0.2s ease;
  }
  
  .text-element:not(.editing):hover {
    box-shadow: 0 0 0 1px hsl(var(--primary) / 0.3);
  }
  
  .text-element.editing {
    box-shadow: 0 0 0 2px hsl(var(--primary) / 0.5) !important;
  }
  
  /* Ensure text is selectable when editing */
  .text-element[contenteditable="true"] {
    user-select: text !important;
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
  }
</style>