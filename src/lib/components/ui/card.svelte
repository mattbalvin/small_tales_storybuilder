<script lang="ts">
  import { cn } from '$lib/utils'
  
  let className = ''
  export { className as class }
</script>

<div class={cn('rounded-2xl border bg-card text-card-foreground shadow-lg card-child-friendly', className)} {...$$restProps}>
  <slot />
</div>