<script lang="ts">
  import { cn } from '$lib/utils'
  
  export let value = ''
  export let placeholder = ''
  export let disabled = false
  export let rows = 3
  
  let className = ''
  export { className as class }
</script>

<textarea
  {placeholder}
  {disabled}
  {rows}
  bind:value
  class={cn(
    'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  on:input
  on:change
  on:focus
  on:blur
  {...$$restProps}
></textarea>