<script lang="ts">
  import Button from '$lib/components/ui/button.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { Home, Check, Star, Zap, Sparkles } from 'lucide-svelte'
  import { authStore } from '$lib/stores/auth'

  function navigateToAuth() {
    window.location.hash = '#/auth'
  }

  function navigateToHome() {
    window.location.hash = '#/'
  }
</script>

<svelte:head>
  <title>Pricing - Small Tales</title>
</svelte:head>

<div class="min-h-screen bg-soft-buttercream">
  <!-- Header -->
  <header class="border-b border-periwinkle-blue/20 bg-coral-sunset/90 backdrop-blur-sm sticky top-0 z-50">
    <div class="container flex items-center justify-between py-4">
      <Button on:click={navigateToHome} class="bg-golden-apricot text-white hover:bg-golden-apricot shadow-md hover:shadow-lg rounded-full px-6 hover:scale-105">
        <Home class="w-5 h-5 mr-2" />
        Back to Home
      </Button>
      
      <h1 class="text-2xl font-bold text-white">Pricing</h1>
    </div>
  </header>

  <!-- Content -->
  <div class="container py-12">
    <div class="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
      <!-- Heading -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold mb-4 text-coral-sunset">Simple, Transparent Pricing</h1>
        <p class="text-xl text-dusty-teal max-w-2xl mx-auto">
          Choose the plan that works best for you and start creating magical stories today.
        </p>
      </div>

      <!-- Creator Credits Explanation -->
      <div class="bg-soft-buttercream rounded-2xl p-6 mb-12 shadow-lg border border-periwinkle-blue/20">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-golden-apricot/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap class="w-6 h-6 text-golden-apricot" />
          </div>
          <div>
            <h3 class="text-xl font-bold text-coral-sunset mb-2">What are Creator Credits?</h3>
            <p class="text-dusty-teal mb-3">
              Creator Credits power the AI features in Small Tales, allowing you to generate custom images, narration, and audio for your stories.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div class="bg-periwinkle-blue/10 p-4 rounded-xl">
                <h4 class="font-medium text-periwinkle-blue mb-2">Image Generation</h4>
                <p class="text-sm">5-10 credits per image, depending on quality and size</p>
              </div>
              <div class="bg-coral-sunset/10 p-4 rounded-xl">
                <h4 class="font-medium text-coral-sunset mb-2">Audio Narration</h4>
                <p class="text-sm">1 credit per 100 words of narrated text</p>
              </div>
              <div class="bg-dusty-teal/10 p-4 rounded-xl">
                <h4 class="font-medium text-dusty-teal mb-2">Sound Effects</h4>
                <p class="text-sm">2 credits per generated sound effect</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing Tiers -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Free Tier -->
        <Card class="overflow-hidden relative">
          <div class="p-6 border-b border-periwinkle-blue/20">
            <h3 class="text-xl font-bold text-dusty-teal mb-1">Free</h3>
            <p class="text-sm text-muted-foreground mb-4">Perfect for getting started</p>
            <div class="flex items-end gap-1 mb-4">
              <span class="text-4xl font-bold text-coral-sunset">$0</span>
              <span class="text-dusty-teal mb-1">/month</span>
            </div>
            <Button 
              variant="outline" 
              class="w-full accent-element" 
              on:click={$authStore.user ? navigateToHome : navigateToAuth}
            >
              {$authStore.user ? 'Current Plan' : 'Get Started'}
            </Button>
          </div>
          <div class="p-6">
            <ul class="space-y-3">
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-dusty-teal flex-shrink-0 mt-0.5" />
                <span>Create and share stories</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-dusty-teal flex-shrink-0 mt-0.5" />
                <span>Basic editor features</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-dusty-teal flex-shrink-0 mt-0.5" />
                <span><strong>50 Creator Credits</strong> for new users</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-dusty-teal flex-shrink-0 mt-0.5" />
                <span>Pay-as-you-go Creator Credit packs</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-dusty-teal flex-shrink-0 mt-0.5" />
                <span>Up to 5 stories</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-dusty-teal flex-shrink-0 mt-0.5" />
                <span>Community support</span>
              </li>
            </ul>
          </div>
        </Card>

        <!-- Creator Tier -->
        <Card class="overflow-hidden relative">
          <div class="p-6 border-b border-periwinkle-blue/20">
            <h3 class="text-xl font-bold text-periwinkle-blue mb-1">Creator</h3>
            <p class="text-sm text-muted-foreground mb-4">For regular storytellers</p>
            <div class="flex items-end gap-1 mb-4">
              <span class="text-4xl font-bold text-coral-sunset">$10</span>
              <span class="text-dusty-teal mb-1">/month</span>
            </div>
            <Button 
              variant="secondary" 
              class="w-full" 
              on:click={$authStore.user ? navigateToHome : navigateToAuth}
            >
              {$authStore.user ? 'Upgrade Plan' : 'Get Started'}
            </Button>
          </div>
          <div class="p-6">
            <ul class="space-y-3">
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-periwinkle-blue flex-shrink-0 mt-0.5" />
                <span>Everything in Free plan</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-periwinkle-blue flex-shrink-0 mt-0.5" />
                <span><strong>100 Creator Credits</strong> per month</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-periwinkle-blue flex-shrink-0 mt-0.5" />
                <span><strong>10% off</strong> Creator Credit packs</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-periwinkle-blue flex-shrink-0 mt-0.5" />
                <span>Unlimited stories</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-periwinkle-blue flex-shrink-0 mt-0.5" />
                <span>Advanced editor features</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-periwinkle-blue flex-shrink-0 mt-0.5" />
                <span>Priority support</span>
              </li>
            </ul>
          </div>
        </Card>

        <!-- Creator Pro Tier -->
        <Card class="overflow-hidden relative border-golden-apricot">
          <!-- Best Value Badge -->
          <div class="absolute -right-12 top-7 bg-golden-apricot text-white px-12 py-1 transform rotate-45 shadow-md">
            <span class="text-xs font-bold">BEST VALUE</span>
          </div>
          
          <div class="p-6 border-b border-periwinkle-blue/20 bg-golden-apricot/5">
            <h3 class="text-xl font-bold text-golden-apricot mb-1">Creator Pro</h3>
            <p class="text-sm text-muted-foreground mb-4">For serious storytellers</p>
            <div class="flex items-end gap-1 mb-4">
              <span class="text-4xl font-bold text-coral-sunset">$20</span>
              <span class="text-dusty-teal mb-1">/month</span>
            </div>
            <Button 
              class="w-full featured-item" 
              on:click={$authStore.user ? navigateToHome : navigateToAuth}
            >
              {$authStore.user ? 'Upgrade Plan' : 'Get Started'}
            </Button>
          </div>
          <div class="p-6">
            <ul class="space-y-3">
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-golden-apricot flex-shrink-0 mt-0.5" />
                <span>Everything in Creator plan</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-golden-apricot flex-shrink-0 mt-0.5" />
                <span><strong>250 Creator Credits</strong> per month</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-golden-apricot flex-shrink-0 mt-0.5" />
                <span><strong>15% off</strong> Creator Credit packs</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-golden-apricot flex-shrink-0 mt-0.5" />
                <span>Early access to new features</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-golden-apricot flex-shrink-0 mt-0.5" />
                <span>Premium story templates</span>
              </li>
              <li class="flex items-start gap-2">
                <Check class="w-5 h-5 text-golden-apricot flex-shrink-0 mt-0.5" />
                <span>Dedicated support</span>
              </li>
            </ul>
          </div>
        </Card>
      </div>

      <!-- Credit Packs -->
      <div class="mt-16">
        <h2 class="text-2xl font-bold text-coral-sunset mb-6 text-center">Creator Credit Packs</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card class="p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div class="w-12 h-12 bg-periwinkle-blue/20 rounded-xl flex items-center justify-center mb-4">
              <Sparkles class="w-6 h-6 text-periwinkle-blue" />
            </div>
            <h3 class="text-lg font-semibold mb-2 text-periwinkle-blue">Starter Pack</h3>
            <div class="flex items-end gap-1 mb-4">
              <span class="text-2xl font-bold text-coral-sunset">$5</span>
              <span class="text-dusty-teal mb-0.5">for 50 credits</span>
            </div>
            <p class="text-sm text-dusty-teal mb-4">Perfect for trying out AI features</p>
            <Button variant="outline" class="w-full accent-element">Purchase</Button>
          </Card>

          <Card class="p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div class="w-12 h-12 bg-golden-apricot/20 rounded-xl flex items-center justify-center mb-4">
              <Star class="w-6 h-6 text-golden-apricot" />
            </div>
            <h3 class="text-lg font-semibold mb-2 text-golden-apricot">Standard Pack</h3>
            <div class="flex items-end gap-1 mb-4">
              <span class="text-2xl font-bold text-coral-sunset">$20</span>
              <span class="text-dusty-teal mb-0.5">for 250 credits</span>
            </div>
            <p class="text-sm text-dusty-teal mb-4">Most popular option for regular creators</p>
            <Button variant="secondary" class="w-full">Purchase</Button>
          </Card>

          <Card class="p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div class="w-12 h-12 bg-coral-sunset/20 rounded-xl flex items-center justify-center mb-4">
              <Zap class="w-6 h-6 text-coral-sunset" />
            </div>
            <h3 class="text-lg font-semibold mb-2 text-coral-sunset">Pro Pack</h3>
            <div class="flex items-end gap-1 mb-4">
              <span class="text-2xl font-bold text-coral-sunset">$50</span>
              <span class="text-dusty-teal mb-0.5">for 750 credits</span>
            </div>
            <p class="text-sm text-dusty-teal mb-4">Best value for power users</p>
            <Button class="w-full featured-item">Purchase</Button>
          </Card>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="mt-16">
        <h2 class="text-2xl font-bold text-coral-sunset mb-8 text-center">Frequently Asked Questions</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-soft-buttercream p-6 rounded-xl shadow-md border border-periwinkle-blue/20">
            <h3 class="text-lg font-semibold mb-3 text-coral-sunset">What happens when I run out of Creator Credits?</h3>
            <p class="text-dusty-teal">
              You can continue to use all non-AI features of Small Tales. To use AI features again, you can purchase additional Creator Credit packs or upgrade to a paid plan.
            </p>
          </div>

          <div class="bg-soft-buttercream p-6 rounded-xl shadow-md border border-periwinkle-blue/20">
            <h3 class="text-lg font-semibold mb-3 text-coral-sunset">Do unused credits roll over?</h3>
            <p class="text-dusty-teal">
              Yes! Any unused credits from your monthly allowance will roll over for up to 3 months, ensuring you never lose your credits.
            </p>
          </div>

          <div class="bg-soft-buttercream p-6 rounded-xl shadow-md border border-periwinkle-blue/20">
            <h3 class="text-lg font-semibold mb-3 text-coral-sunset">Can I cancel my subscription anytime?</h3>
            <p class="text-dusty-teal">
              Absolutely. You can cancel your subscription at any time. You'll continue to have access to your plan benefits until the end of your current billing cycle.
            </p>
          </div>

          <div class="bg-soft-buttercream p-6 rounded-xl shadow-md border border-periwinkle-blue/20">
            <h3 class="text-lg font-semibold mb-3 text-coral-sunset">Do I own the content I create?</h3>
            <p class="text-dusty-teal">
              Yes, you retain full ownership of all content you create with Small Tales, including AI-generated assets. See our Terms of Service for complete details.
            </p>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="mt-16 text-center">
        <h2 class="text-2xl font-bold text-coral-sunset mb-4">Ready to Start Creating?</h2>
        <p class="text-lg text-dusty-teal mb-8 max-w-2xl mx-auto">
          Join thousands of storytellers who are bringing their imagination to life with Small Tales.
        </p>
        <Button 
          size="lg" 
          class="px-8 py-6 text-lg featured-item"
          on:click={$authStore.user ? navigateToHome : navigateToAuth}
        >
          {$authStore.user ? 'Go to Dashboard' : 'Create Your First Story'}
        </Button>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="bg-[#558A80] text-white py-8 px-4 mt-12">
    <div class="container text-center">
      <p>&copy; 2025 Small Tales. All rights reserved.</p>
      <p class="mt-2">
        <a href="#/" class="text-white hover:text-golden-apricot transition-colors">Home</a> | 
        <a href="#/about" class="text-white hover:text-golden-apricot transition-colors">About</a> | 
        <a href="#/pricing" class="text-white font-medium">Pricing</a> | 
        <a href="#/privacy" class="text-white hover:text-golden-apricot transition-colors">Privacy Policy</a> | 
        <a href="#/terms" class="text-white hover:text-golden-apricot transition-colors">Terms and Conditions</a>
      </p>
    </div>
  </footer>
</div>