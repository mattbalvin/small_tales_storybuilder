<script lang="ts">
  import { cn } from '$lib/utils'
  import { tv, type VariantProps } from 'tailwind-variants'

  const buttonVariants = tv({
    base: 'inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-friendly btn-child-friendly',
    variants: {
      variant: {
        default: 'bg-coral-sunset text-white hover:bg-coral-sunset/90 shadow-md hover:shadow-lg',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg',
        outline: 'border border-periwinkle-blue/30 bg-background hover:bg-periwinkle-blue/10 hover:text-periwinkle-blue shadow-sm hover:shadow-md',
        secondary: 'bg-golden-apricot text-white hover:bg-golden-apricot/90 shadow-md hover:shadow-lg',
        ghost: 'hover:bg-periwinkle-blue/10 hover:text-periwinkle-blue',
        link: 'text-coral-sunset underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-12 rounded-xl px-8',
        icon: 'h-11 w-11'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  })

  type Variant = VariantProps<typeof buttonVariants>['variant']
  type Size = VariantProps<typeof buttonVariants>['size']

  export let variant: Variant = 'default'
  export let size: Size = 'default'
  export let disabled = false
  
  let className = ''
  export { className as class }
</script>

<button
  class={cn(buttonVariants({ variant, size }), className)}
  {disabled}
  on:click
  {...$$restProps}
>
  <slot />
</button>