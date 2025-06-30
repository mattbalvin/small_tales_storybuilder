<script lang="ts">
  import { onMount } from 'svelte'
  import { authStore, authService } from '$lib/stores/auth'
  import { storiesService } from '$lib/stores/stories'
  import StoriesList from '$lib/components/dashboard/StoriesList.svelte'
  import UserCreditsDisplay from '$lib/components/auth/UserCreditsDisplay.svelte'
  import UserCreditHistory from '$lib/components/dashboard/UserCreditHistory.svelte'
  import Button from '$lib/components/ui/button.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { LogIn, BookOpen, Zap } from 'lucide-svelte'

  function handleEditStory(event: CustomEvent) {
    console.log(event.detail.storyId)
    const storyId = event.detail.storyId
    console.log(storyId)
    window.location.hash = `#/editor/${storyId}`
  }

  function handlePreviewStory(event: CustomEvent) {
    const storyId = event.detail.storyId
    window.location.hash = `#/preview/${storyId}`
  }

  function navigateToAuth() {
    window.location.hash = '#/auth'
  }

  function navigateToLanding() {
    window.location.hash = '#/'
  }

  function navigateToPricing() {
    window.location.hash = '#/pricing'
    // Ensure we scroll to the top when navigating
    window.scrollTo(0, 0)
  }

  onMount(() => {
    // Redirect to auth if not authenticated
    const unsubscribe = authStore.subscribe(($authStore) => {
      if (!$authStore.loading && !$authStore.user) {
        window.location.hash = '#/auth'
      }
    })

    // Set current story to null when returning to dashboard
    if ($authStore.user) {
      storiesService.setCurrentStory(null)
    }

    return unsubscribe
  })
</script>

<svelte:head>
  <title>Dashboard - Small Tales Story Builder</title>
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
            <a href="#/dashboard" class="text-sm font-medium">Dashboard</a>
            <a href="#/media" class="text-sm font-medium text-muted-foreground hover:text-foreground">Media Library</a>
            <!-- <a href="#/analytics" class="text-sm font-medium text-muted-foreground hover:text-foreground">Analytics</a> -->
          </nav>
        {/if}
      </div>
      
      <div class="flex items-center gap-4">
        {#if $authStore.user}
          <div class="flex items-center gap-4">
            <UserCreditsDisplay />
            
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
          </div>
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
            <BookOpen class="w-8 h-8 text-primary" />
          </div>
          <h1 class="text-2xl font-bold mb-3">Authentication Required</h1>
          <p class="text-muted-foreground mb-6">
            Please sign in to access your dashboard and manage your stories.
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
      <!-- Authenticated - show dashboard -->
      <div class="container py-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main content area - Stories List -->
          <div class="lg:col-span-2">
            <StoriesList 
              on:edit-story={handleEditStory}
              on:preview-story={handlePreviewStory}
            />
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
            <UserCreditHistory limit={5} />
          </div>
        </div>
      </div>
    {/if}
  </main>
</div>