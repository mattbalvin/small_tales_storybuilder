<script lang="ts">
  import Button from '$lib/components/ui/button.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { XCircle, Home, ArrowLeft } from 'lucide-svelte'

  function navigateToHome() {
    window.location.hash = '#/'
  }

  function navigateToPricing() {
    window.location.hash = '#/pricing'
  }
</script>

<svelte:head>
  <title>Payment Canceled - Small Tales</title>
</svelte:head>

<div class="min-h-screen bg-soft-buttercream flex items-center justify-center p-4">
  <Card class="w-full max-w-lg p-8 text-center">
    <div class="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
      <XCircle class="w-12 h-12 text-destructive" />
    </div>
    
    <h1 class="text-2xl font-bold mb-4 text-coral-sunset">Payment Canceled</h1>
    
    <p class="text-dusty-teal mb-8">
      Your payment was canceled. No charges were made to your account.
      If you experienced any issues during checkout, please try again or contact our support team.
    </p>
    
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <Button variant="outline" on:click={navigateToHome} class="accent-element">
        <Home class="w-5 h-5 mr-2" />
        Go to Home
      </Button>
      
      <Button on:click={navigateToPricing}>
        <ArrowLeft class="w-5 h-5 mr-2" />
        Return to Pricing
      </Button>
    </div>
  </Card>
</div>