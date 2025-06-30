<script lang="ts">
  import { onMount } from 'svelte'
  import { authStore, authService } from '$lib/stores/auth'
  import { creditService, SUBSCRIPTION_TIERS, type SubscriptionTier } from '$lib/services/creditService'
  import { stripeService } from '$lib/services/stripeService'
  import { stripeConfig } from '$lib/stripe-config'
  import UserCreditsDisplay from '$lib/components/auth/UserCreditsDisplay.svelte'
  import UserCreditHistory from '$lib/components/dashboard/UserCreditHistory.svelte'
  import Button from '$lib/components/ui/button.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { LogIn, BookOpen, Zap, CreditCard, Calendar, CheckCircle, AlertCircle, User, Settings, Home, Loader2 } from 'lucide-svelte'

  let changingSubscription = false
  let subscriptionChangeSuccess = false
  let subscriptionChangeError = false
  let errorMessage = ''
  let isLoading = false
  let loadingProduct = ''

  // Get the current subscription tier details
  $: currentTierInfo = SUBSCRIPTION_TIERS.find(tier => tier.id === $authStore.profile?.subscription_tier) || SUBSCRIPTION_TIERS[0]
  
  // Get subscription products from Stripe config
  $: subscriptionProducts = stripeConfig.products.filter(p => p.mode === 'subscription')
  
  // Map subscription products to tiers
  $: subscriptionProductMap = {
    'creator': subscriptionProducts.find(p => p.tier === 'creator'),
    'creator_pro': subscriptionProducts.find(p => p.tier === 'creator_pro')
  }

  function navigateToAuth() {
    window.location.hash = '#/auth'
  }

  function navigateToLanding() {
    window.location.hash = '#/'
  }

  function navigateToDashboard() {
    window.location.hash = '#/dashboard'
  }

  function navigateToPricing() {
    window.location.hash = '#/pricing'
    // Ensure we scroll to the top when navigating
    window.scrollTo(0, 0)
  }

  async function handleSubscribe(priceId: string) {
    if (!$authStore.user) {
      navigateToAuth()
      return
    }

    try {
      isLoading = true
      loadingProduct = priceId
      
      const checkoutUrl = await stripeService.createCheckoutSession(priceId, 'subscription')
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      alert('Failed to create checkout session. Please try again.')
    } finally {
      isLoading = false
      loadingProduct = ''
    }
  }

  async function changeSubscription(tierId: 'free' | 'creator' | 'creator_pro') {
    if (tierId === 'free') {
      // For downgrading to free, we'll just update the local subscription
      changingSubscription = true
      subscriptionChangeSuccess = false
      subscriptionChangeError = false
      errorMessage = ''

      try {
        const success = await authService.updateSubscription(tierId)
        
        if (success) {
          subscriptionChangeSuccess = true
          setTimeout(() => {
            subscriptionChangeSuccess = false
          }, 3000)
        } else {
          throw new Error('Failed to update subscription')
        }
      } catch (error) {
        console.error('Error changing subscription:', error)
        subscriptionChangeError = true
        errorMessage = error.message || 'An error occurred while updating your subscription'
      } finally {
        changingSubscription = false
      }
    } else {
      // For upgrading to paid plans, use Stripe checkout
      const product = subscriptionProductMap[tierId]
      if (product) {
        await handleSubscribe(product.priceId)
      } else {
        alert('Subscription plan not found')
      }
    }
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  function getRemainingDays(dateString: string | null): number {
    if (!dateString) return 0
    
    const expiryDate = new Date(dateString)
    const today = new Date()
    
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }

  onMount(() => {
    // Redirect to auth if not authenticated
    const unsubscribe = authStore.subscribe(($authStore) => {
      if (!$authStore.loading && !$authStore.user) {
        window.location.hash = '#/auth'
      }
    })

    return unsubscribe
  })
</script>

<svelte:head>
  <title>Account - Small Tales Story Builder</title>
</svelte:head>

<div class="min-h-screen bg-white">
  <header class="border-b border-periwinkle-blue/20 bg-soft-buttercream">
    <div class="container flex items-center justify-between py-4">
      <div class="flex items-center gap-4">
        <button on:click={navigateToLanding} class="text-xl font-bold text-coral-sunset hover:opacity-80">
          Small Tales
        </button>
        {#if $authStore.user}
          <nav class="flex items-center gap-6">
            <a href="#/dashboard" class="text-sm font-medium text-muted-foreground hover:text-foreground">Dashboard</a>
            <a href="#/media" class="text-sm font-medium text-muted-foreground hover:text-foreground">Media Library</a>
            <a href="#/account" class="text-sm font-medium">Account</a>
          </nav>
        {/if}
      </div>
      
      <div class="flex items-center gap-4">
        {#if $authStore.user}
          <UserCreditsDisplay compact={true} showSubscription={false} />
          
          <span class="text-sm text-muted-foreground">
            {$authStore.profile?.full_name || $authStore.user?.email}
          </span>
          <button 
            class="text-sm text-muted-foreground hover:text-foreground"
            on:click={() => {
              authService.signOut()
              window.location.hash = '#/'
            }}
          >
            Sign Out
          </button>
        {:else}
          <Button variant="outline" on:click={navigateToAuth}>
            <LogIn class="w-4 h-4 mr-2" />
            Sign In
          </Button>
        {/if}
      </div>
    </div>
  </header>

  <main>
    {#if $authStore.loading}
      <!-- Loading state -->
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p class="text-muted-foreground">Loading...</p>
        </div>
      </div>
    {:else if !$authStore.user}
      <!-- Not authenticated - redirect handled in onMount -->
      <div class="flex items-center justify-center min-h-[60vh] p-4">
        <Card class="w-full max-w-md p-8 text-center">
          <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <User class="w-8 h-8 text-primary" />
          </div>
          <h1 class="text-2xl font-bold mb-3">Authentication Required</h1>
          <p class="text-muted-foreground mb-6">
            Please sign in to access your account settings.
          </p>
          <div class="space-y-3">
            <Button class="w-full" on:click={navigateToAuth}>
              <LogIn class="w-4 h-4 mr-2" />
              Sign In
            </Button>
            <Button variant="outline" class="w-full" on:click={navigateToLanding}>
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    {:else}
      <!-- Authenticated - show account page -->
      <div class="container py-8">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-3xl font-bold text-coral-sunset">Account Settings</h1>
            <p class="text-dusty-teal">Manage your subscription, credits, and account details</p>
          </div>
          <Button variant="outline" on:click={navigateToDashboard} class="accent-element">
            <Home class="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main content area - Account Settings -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Subscription Section -->
            <Card class="overflow-hidden">
              <div class="p-6 border-b border-periwinkle-blue/20">
                <h2 class="text-xl font-bold text-coral-sunset">Your Subscription</h2>
              </div>
              
              <div class="p-6">
                <!-- Current Plan -->
                <div class="bg-periwinkle-blue/10 rounded-xl p-6 mb-6 border border-periwinkle-blue/20">
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl bg-periwinkle-blue/20 flex items-center justify-center flex-shrink-0">
                      <Calendar class="w-6 h-6 text-periwinkle-blue" />
                    </div>
                    
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <h3 class="text-lg font-bold text-dusty-teal">
                          {currentTierInfo.name} Plan
                        </h3>
                        <span class={`px-2 py-0.5 text-xs rounded-full ${
                          currentTierInfo.id === 'free' ? 'bg-dusty-teal/20 text-dusty-teal' : 
                          currentTierInfo.id === 'creator' ? 'bg-periwinkle-blue/20 text-periwinkle-blue' : 
                          'bg-golden-apricot/20 text-golden-apricot'
                        }`}>
                          Current Plan
                        </span>
                      </div>
                      
                      <p class="text-dusty-teal mb-3">{currentTierInfo.description}</p>
                      
                      {#if currentTierInfo.id !== 'free'}
                        <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mb-4">
                          <div>
                            <span class="text-sm text-muted-foreground">Monthly price:</span>
                            <span class="font-medium text-coral-sunset ml-1">${currentTierInfo.price}</span>
                          </div>
                          
                          <div>
                            <span class="text-sm text-muted-foreground">Monthly credits:</span>
                            <span class="font-medium text-golden-apricot ml-1">{currentTierInfo.monthlyCredits}</span>
                          </div>
                          
                          {#if $authStore.profile?.subscription_expires_at}
                            <div>
                              <span class="text-sm text-muted-foreground">Next billing date:</span>
                              <span class="font-medium ml-1">
                                {formatDate($authStore.profile.subscription_expires_at)}
                                {#if getRemainingDays($authStore.profile.subscription_expires_at) > 0}
                                  <span class="text-xs text-periwinkle-blue">
                                    ({getRemainingDays($authStore.profile.subscription_expires_at)} days left)
                                  </span>
                                {/if}
                              </span>
                            </div>
                          {/if}
                        </div>
                      {/if}
                      
                      {#if currentTierInfo.id !== 'free'}
                        <Button 
                          variant="outline" 
                          class="text-destructive hover:text-destructive hover:bg-destructive/10"
                          on:click={() => changeSubscription('free')}
                          disabled={changingSubscription}
                        >
                          Cancel Subscription
                        </Button>
                      {/if}
                    </div>
                  </div>
                </div>
                
                <!-- Subscription Change Messages -->
                {#if subscriptionChangeSuccess}
                  <div class="mb-6 p-4 bg-dusty-teal/10 border border-dusty-teal/20 rounded-lg flex items-start gap-3">
                    <CheckCircle class="w-5 h-5 text-dusty-teal flex-shrink-0 mt-0.5" />
                    <div>
                      <p class="font-medium text-dusty-teal">Subscription updated successfully</p>
                      <p class="text-sm text-muted-foreground">Your subscription changes will take effect immediately.</p>
                    </div>
                  </div>
                {/if}
                
                {#if subscriptionChangeError}
                  <div class="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                    <AlertCircle class="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p class="font-medium text-destructive">Failed to update subscription</p>
                      <p class="text-sm text-destructive/80">{errorMessage || 'Please try again later.'}</p>
                    </div>
                  </div>
                {/if}
                
                <!-- Available Plans -->
                <h3 class="text-lg font-bold text-dusty-teal mb-4">Available Plans</h3>
                
                <div class="space-y-4">
                  {#if currentTierInfo.id !== 'creator'}
                    <div class="border border-periwinkle-blue/20 rounded-xl p-4 hover:border-periwinkle-blue/40 transition-colors">
                      <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-lg bg-periwinkle-blue/20 flex items-center justify-center flex-shrink-0">
                          <span class="text-sm font-bold text-periwinkle-blue">C</span>
                        </div>
                        
                        <div class="flex-1">
                          <div class="flex items-center justify-between mb-1">
                            <h4 class="font-bold">Creator Plan</h4>
                            <span class="text-coral-sunset font-medium">$10/month</span>
                          </div>
                          
                          <p class="text-sm text-dusty-teal mb-2">For regular storytellers</p>
                          
                          <div class="flex items-center gap-2 mb-3">
                            <Zap class="w-4 h-4 text-golden-apricot" />
                            <span class="text-sm">
                              <span class="font-medium text-golden-apricot">100</span> 
                              <span class="text-muted-foreground">credits monthly</span>
                            </span>
                          </div>
                          
                          <Button 
                            variant="secondary"
                            on:click={() => handleSubscribe(subscriptionProductMap.creator.priceId)}
                            disabled={isLoading && loadingProduct === subscriptionProductMap.creator.priceId}
                          >
                            {#if isLoading && loadingProduct === subscriptionProductMap.creator.priceId}
                              <Loader2 class="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            {:else}
                              {currentTierInfo.id === 'creator_pro' ? 'Downgrade' : 'Upgrade'} to Creator
                            {/if}
                          </Button>
                        </div>
                      </div>
                    </div>
                  {/if}
                  
                  {#if currentTierInfo.id !== 'creator_pro'}
                    <div class="border border-golden-apricot/30 rounded-xl p-4 hover:border-golden-apricot/60 transition-colors bg-golden-apricot/5">
                      <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-lg bg-golden-apricot/20 flex items-center justify-center flex-shrink-0">
                          <span class="text-sm font-bold text-golden-apricot">P</span>
                        </div>
                        
                        <div class="flex-1">
                          <div class="flex items-center justify-between mb-1">
                            <h4 class="font-bold">Creator Pro Plan</h4>
                            <span class="text-coral-sunset font-medium">$20/month</span>
                          </div>
                          
                          <p class="text-sm text-dusty-teal mb-2">For serious storytellers</p>
                          
                          <div class="flex items-center gap-2 mb-3">
                            <Zap class="w-4 h-4 text-golden-apricot" />
                            <span class="text-sm">
                              <span class="font-medium text-golden-apricot">250</span> 
                              <span class="text-muted-foreground">credits monthly</span>
                            </span>
                          </div>
                          
                          <Button 
                            class="featured-item"
                            on:click={() => handleSubscribe(subscriptionProductMap.creator_pro.priceId)}
                            disabled={isLoading && loadingProduct === subscriptionProductMap.creator_pro.priceId}
                          >
                            {#if isLoading && loadingProduct === subscriptionProductMap.creator_pro.priceId}
                              <Loader2 class="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            {:else}
                              Upgrade to Creator Pro
                            {/if}
                          </Button>
                        </div>
                      </div>
                    </div>
                  {/if}
                  
                  {#if currentTierInfo.id !== 'free'}
                    <div class="border border-dusty-teal/20 rounded-xl p-4 hover:border-dusty-teal/40 transition-colors">
                      <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-lg bg-dusty-teal/20 flex items-center justify-center flex-shrink-0">
                          <span class="text-sm font-bold text-dusty-teal">F</span>
                        </div>
                        
                        <div class="flex-1">
                          <div class="flex items-center justify-between mb-1">
                            <h4 class="font-bold">Free Plan</h4>
                            <span class="text-coral-sunset font-medium">$0/month</span>
                          </div>
                          
                          <p class="text-sm text-dusty-teal mb-2">Perfect for getting started</p>
                          
                          <div class="flex items-center gap-2 mb-3">
                            <Zap class="w-4 h-4 text-golden-apricot opacity-50" />
                            <span class="text-sm text-muted-foreground">
                              No monthly credits
                            </span>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            class="text-dusty-teal border-dusty-teal/30"
                            on:click={() => changeSubscription('free')}
                            disabled={changingSubscription}
                          >
                            {#if changingSubscription}
                              <Loader2 class="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            {:else}
                              Downgrade to Free
                            {/if}
                          </Button>
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            </Card>
            
            <!-- Account Information -->
            <Card class="overflow-hidden">
              <div class="p-6 border-b border-periwinkle-blue/20">
                <h2 class="text-xl font-bold text-coral-sunset">Account Information</h2>
              </div>
              
              <div class="p-6">
                <div class="space-y-4">
                  <div>
                    <label class="text-sm font-medium text-dusty-teal">Email</label>
                    <p class="font-medium">{$authStore.user?.email}</p>
                  </div>
                  
                  <div>
                    <label class="text-sm font-medium text-dusty-teal">Full Name</label>
                    <p class="font-medium">{$authStore.profile?.full_name || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <label class="text-sm font-medium text-dusty-teal">Account Created</label>
                    <p class="font-medium">{formatDate($authStore.profile?.created_at)}</p>
                  </div>
                </div>
                
                <div class="mt-6 pt-6 border-t border-periwinkle-blue/20">
                  <Button variant="outline" class="text-destructive hover:text-destructive hover:bg-destructive/10">
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          
          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Credits Card -->
            <Card class="overflow-hidden">
              <div class="p-4 border-b border-periwinkle-blue/20">
                <h3 class="font-semibold text-coral-sunset">Your Creator Credits</h3>
              </div>
              <div class="p-4">
                <div class="flex items-center justify-between mb-6">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-golden-apricot/20 rounded-xl flex items-center justify-center">
                      <Zap class="w-6 h-6 text-golden-apricot" />
                    </div>
                    <div>
                      <p class="text-sm text-dusty-teal">Available Credits</p>
                      <p class="text-2xl font-bold text-golden-apricot">{$authStore.profile?.credit_balance || 0}</p>
                    </div>
                  </div>
                  
                  <Button variant="secondary" on:click={navigateToPricing}>
                    Get More
                  </Button>
                </div>
                
                <div class="bg-periwinkle-blue/10 rounded-xl p-4 mb-4">
                  <div class="flex items-center gap-2 mb-2">
                    <div class="w-8 h-8 bg-periwinkle-blue/20 rounded-lg flex items-center justify-center">
                      <span class="text-periwinkle-blue font-medium">
                        {$authStore.profile?.subscription_tier === 'free' ? 'F' : 
                         $authStore.profile?.subscription_tier === 'creator' ? 'C' : 'P'}
                      </span>
                    </div>
                    <div>
                      <p class="font-medium">
                        {$authStore.profile?.subscription_tier === 'free' ? 'Free Plan' : 
                         $authStore.profile?.subscription_tier === 'creator' ? 'Creator Plan' : 'Creator Pro Plan'}
                      </p>
                    </div>
                  </div>
                  
                  {#if $authStore.profile?.subscription_tier === 'free'}
                    <p class="text-sm text-dusty-teal mb-3">
                      Upgrade to get monthly credits and exclusive features
                    </p>
                    <Button variant="outline" class="w-full accent-element" on:click={navigateToPricing}>
                      View Plans
                    </Button>
                  {:else}
                    <p class="text-sm text-dusty-teal">
                      Your subscription includes {$authStore.profile?.subscription_tier === 'creator' ? '100' : '250'} credits per month
                    </p>
                  {/if}
                </div>
              </div>
            </Card>
            
            <!-- Credit History -->
            <UserCreditHistory limit={10} showViewAll={false} />
            
            <!-- Payment Methods (placeholder) -->
            <Card class="overflow-hidden">
              <div class="p-4 border-b border-periwinkle-blue/20">
                <h3 class="font-semibold text-coral-sunset">Payment Methods</h3>
              </div>
              <div class="p-4">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 bg-periwinkle-blue/10 rounded-lg flex items-center justify-center">
                    <CreditCard class="w-5 h-5 text-periwinkle-blue" />
                  </div>
                  <div class="text-center flex-1">
                    <p class="text-dusty-teal">No payment methods added yet</p>
                  </div>
                </div>
                
                <Button variant="outline" class="w-full accent-element">
                  Add Payment Method
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    {/if}
  </main>
</div>