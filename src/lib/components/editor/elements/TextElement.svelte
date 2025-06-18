<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let element: any

  const dispatch = createEventDispatcher()

  function handleTextChange(event: Event) {
    const target = event.target as HTMLElement
    dispatch('update', {
      properties: {
        ...element.properties,
        text: target.textContent || ''
      }
    })
  }

  $: style = `
    font-size: ${element.properties?.fontSize || 16}px;
    color: ${element.properties?.color || '#000000'};
    width: 100%;
    height: 100%;
    padding: 8px;
    border: none;
    outline: none;
    resize: none;
    background: transparent;
    line-height: 1.4;
  `
</script>

<div
  contenteditable="true"
  {style}
  on:blur={handleTextChange}
  on:input={handleTextChange}
>
  {element.properties?.text || 'Enter text...'}
</div>