<script lang="ts">
  import { cn } from '$lib/utils'
  import { createEventDispatcher } from 'svelte'
  
  export let value = ''
  export let type = 'text'
  export let placeholder = ''
  export let disabled = false
  export let autocomplete = ''
  
  let className = ''
  export { className as class }
  
  const dispatch = createEventDispatcher()
  
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement
    if (target) {
      value = target.value
      dispatch('input', event)
    }
  }
  
  function handleChange(event: Event) {
    dispatch('change', event)
  }
  
  function handleFocus(event: Event) {
    dispatch('focus', event)
  }
  
  function handleBlur(event: Event) {
    dispatch('blur', event)
  }
</script>

<input
  type={type}
  {placeholder}
  {disabled}
  {autocomplete}
  {value}
  class={cn(
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  on:input={handleInput}
  on:change={handleChange}
  on:focus={handleFocus}
  on:blur={handleBlur}
  on:input
  on:change
  on:focus
  on:blur
  {...$$restProps}
/>