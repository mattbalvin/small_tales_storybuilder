<script lang="ts">
  import { onMount } from 'svelte'
  import { authStore } from '$lib/stores/auth'
  import { stripeService } from '$lib/services/stripeService'
  import Button from '$lib/components/ui/button.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { CheckCircle, Home, ArrowRight, Zap } from 'lucide-svelte'

  let sessionId = ''
  let loading = true
  let subscription: any = null
  let order: any = null

  onMount(async () => {
    // Get session ID from URL
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1])
    sessionId = urlParams.get('session_id') || ''
    
    if (!sessionId) {
      loading = false
      return
    }

    // Wait a moment to allow webhook processing
    setTimeout(async () => {
      try {
        if ($authStore.user) {
          // Try to get subscription first
          subscription = await stripeService.getUserSubscription()
          
          // If no subscription, try to get order
          if (!subscription) {
            const orders = await stripeService.getUserOrders()
            if (orders && orders.length > 0) {
              order = orders[0]
            }
          }
        }
      } catch (error) {
        console.error('Error fetching purchase data:', error)
      } finally {
        loading = false
      }
    }, 2000)
  })

  function navigateToHome() {
    window.location.hash = '#/'
  }

  function navigateToDashboard() {
    window.location.hash = '#/dashboard'
  }

  function navigateToAccount() {
    window.location.hash = '#/account'
  }
</script>

<svelte:head>
  <title>Payment Successful - Small Tales</title>
</svelte:head>

<div class="min-h-screen bg-soft-buttercream flex items-center justify-center p-4">
  <Card class="w-full max-w-lg p-8 text-center">
    {#if loading}
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-sunset mx-auto mb-6"></div>
      <h1 class="text-2xl font-bold mb-4 text-coral-sunset">Processing Your Purchase</h1>
      <p class="text-dusty-teal mb-6">
        Please wait while we finalize your purchase. This should only take a moment...
      </p>
    {:else}
      <div class="w-20 h-20 bg-dusty-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle class="w-12 h-12 text-dusty-teal" />
      </div>
      
      <h1 class="text-2xl font-bold mb-4 text-coral-sunset">Payment Successful!</h1>
      
      {#if subscription}
        <p class="text-dusty-teal mb-6">
          Thank you for subscribing to Small Tales! Your subscription is now active.
        </p>
        <div class="bg-periwinkle-blue/10 rounded-xl p-6 mb-8 border border-periwinkle-blue/20">
          <h3 class="font-semibold text-periwinkle-blue mb-3">Subscription Details</h3>
          <p class="text-dusty-teal mb-2">
            Your {subscription.subscription_status === 'active' ? 'active' : 'pending'} subscription will renew on {new Date(subscription.current_period_end * 1000).toLocaleDateString()}.
          </p>
          <p class="flex items-center justify-center gap-2 text-golden-apricot font-medium">
            <Zap class="w-5 h-5" />
            {subscription.price_id === 'price_1Rfl7SQwl4gRGLWNDZxv3aGx' ? '250' : '100'} credits have been added to your account
          </p>
        </div>
      {:else if order}
        <p class="text-dusty-teal mb-6">
          Thank you for your purchase! Your credits have been added to your account.
        </p>
        <div class="bg-periwinkle-blue/10 rounded-xl p-6 mb-8 border border-periwinkle-blue/20">
          <h3 class="font-semibold text-periwinkle-blue mb-3">Order Details</h3>
          <p class="text-dusty-teal mb-2">
            Order ID: {order.order_id}
          </p>
          <p class="text-dusty-teal mb-2">
            Amount: ${(order.amount_total / 100).toFixed(2)} {order.currency.toUpperCase()}
          </p>
          <p class="flex items-center justify-center gap-2 text-golden-apricot font-medium">
            <Zap class="w-5 h-5" />
            Your credits have been added to your account
          </p>
        </div>
      {:else}
        <p class="text-dusty-teal mb-6">
          Thank you for your purchase! Your payment has been processed successfully.
        </p>
      {/if}
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="secondary" on:click={navigateToDashboard}>
          <Home class="w-5 h-5 mr-2" />
          Go to Dashboard
        </Button>
        
        <Button on:click={navigateToAccount} class="featured-item">
          <Zap class="w-5 h-5 mr-2" />
          View My Account
          <ArrowRight class="w-5 h-5 ml-2" />
        </Button>
      </div>
    {/if}
  </Card>
</div>