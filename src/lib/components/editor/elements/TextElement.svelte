<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let element: any
  export let readonly = false

  const dispatch = createEventDispatcher()

  let textElement: HTMLElement
  let isEditing = false
  let originalText = ''

  function startEditing(event?: MouseEvent) {
    if (readonly) return
    
    isEditing = true
    originalText = element.properties?.text || ''
    
    // Focus the element after it becomes editable
    setTimeout(() => {
      if (textElement) {
        textElement.focus()
        
        // If this was triggered by a click event, position cursor at click location
        if (event) {
          positionCursorAtClick(event)
        }
      }
    }, 0)
  }

  function positionCursorAtClick(event: MouseEvent) {
    if (!textElement) return
    
    // Create a range and selection to position cursor at click location
    const range = document.createRange()
    const selection = window.getSelection()
    
    if (selection) {
      // Use caretPositionFromPoint or caretRangeFromPoint to get position
      let caretRange: Range | null = null
      
      if (document.caretPositionFromPoint) {
        const caretPosition = document.caretPositionFromPoint(event.clientX, event.clientY)
        if (caretPosition) {
          range.setStart(caretPosition.offsetNode, caretPosition.offset)
          range.collapse(true)
          caretRange = range
        }
      } else if (document.caretRangeFromPoint) {
        caretRange = document.caretRangeFromPoint(event.clientX, event.clientY)
      }
      
      if (caretRange) {
        selection.removeAllRanges()
        selection.addRange(caretRange)
      }
    }
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
    line-height: 1;
    border-radius: 4px;
    cursor: ${readonly ? 'default' : (isEditing ? 'text' : 'pointer')};
    user-select: ${readonly ? 'none' : (isEditing ? 'text' : 'none')};
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    ${readonly ? 'pointer-events: none;' : ''}
    ${isEditing ? 'box-shadow: 0 0 0 2px hsl(var(--primary) / 0.5);' : ''}
  `

  // Handle clicks to start editing or position cursor
  function handleClick(event: MouseEvent) {
    if (readonly) return
    
    if (!isEditing) {
      // Start editing mode
      event.stopPropagation() // Prevent element selection in parent
      startEditing(event)
    }
    // If already editing, let the browser handle cursor positioning naturally
  }

  // Handle double-click to select word
  function handleDoubleClick(event: MouseEvent) {
    if (readonly) return
    
    event.stopPropagation()
    
    if (!isEditing) {
      startEditing()
      // After starting edit mode, select the word at cursor
      setTimeout(() => {
        if (textElement) {
          const selection = window.getSelection()
          if (selection) {
            selection.modify('move', 'backward', 'word')
            selection.modify('extend', 'forward', 'word')
          }
        }
      }, 0)
    }
    // If already editing, let the browser handle word selection naturally
  }

  // Handle mouse down for text selection
  function handleMouseDown(event: MouseEvent) {
    if (readonly || !isEditing) return
    
    // Allow natural text selection behavior when in edit mode
    event.stopPropagation() // Prevent triggering parent drag handlers
  }
</script>

<div
  bind:this={textElement}
  contenteditable={!readonly && isEditing}
  {style}
  on:click={handleClick}
  on:dblclick={handleDoubleClick}
  on:mousedown={handleMouseDown}
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