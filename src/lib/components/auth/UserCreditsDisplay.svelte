<script lang="ts">
  import { onMount } from 'svelte'
  import { authStore, authService } from '$lib/stores/auth'
  import { Zap } from 'lucide-svelte'

  export let showSubscription = true
  export let showCredits = true
  export let compact = false

  // Format subscription tier for display
  function formatSubscriptionTier(tier: string): string {
    switch (tier) {
      case 'creator': return 'Creator'
      case 'creator_pro': return 'Creator Pro'
      default: return 'Free'
    }
  }

  // Get subscription badge color
  function getSubscriptionColor(tier: string): string {
    switch (tier) {
      case 'creator': return 'bg-periwinkle-blue/20 text-periwinkle-blue'
      case 'creator_pro': return 'bg-golden-apricot/20 text-golden-apricot'
      default: return 'bg-dusty-teal/20 text-dusty-teal'
    }
  }

  // Format expiration date
  function formatExpirationDate(dateString: string | null): string {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Check if subscription is active
  function isSubscriptionActive(expiresAt: string | null): boolean {
    if (!expiresAt) return false
    
    const expirationDate = new Date(expiresAt)
    const now = new Date()
    
    return expirationDate > now
  }
</script>

{#if $authStore.profile}
  <div class={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}>
    {#if showCredits}
      <div class={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
        <Zap class={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-golden-apricot`} />
        <span class={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
          {$authStore.profile.credit_balance || 0} Credits
        </span>
      </div>
    {/if}
    
    {#if showSubscription && $authStore.profile.subscription_tier}
      <div class={`${getSubscriptionColor($authStore.profile.subscription_tier)} ${compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded-full`}>
        {formatSubscriptionTier($authStore.profile.subscription_tier)}
        
        {#if $authStore.profile.subscription_expires_at && $authStore.profile.subscription_tier !== 'free'}
          {#if isSubscriptionActive($authStore.profile.subscription_expires_at)}
            <span class="text-xs opacity-75">
              (until {formatExpirationDate($authStore.profile.subscription_expires_at)})
            </span>
          {:else}
            <span class="text-xs opacity-75">(expired)</span>
          {/if}
        {/if}
      </div>
    {/if}
  </div>
{/if}