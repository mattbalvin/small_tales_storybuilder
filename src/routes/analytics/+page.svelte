<script lang="ts">
  import { authStore, authService } from '$lib/stores/auth'
  import { onMount } from 'svelte'
  import AnalyticsDashboard from '$lib/components/analytics/AnalyticsDashboard.svelte'
  import Button from '$lib/components/ui/button.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { LogIn, BarChart3 } from 'lucide-svelte'

  function navigateToAuth() {
    window.location.hash = '#/auth'
  }

  function navigateToLanding() {
    window.location.hash = '#/'
  }

  onMount(() => {
    // Check authentication but don't redirect automatically
  })
</script>

<svelte:head>
  <title>Analytics - Small Tales</title>
</svelte:head>

<div class="min-h-screen bg-background">
  <header class="border-b bg-card">
    <div class="container flex items-center justify-between py-4">
      <div class="flex items-center gap-4">
        <button on:click={navigateToLanding} class="text-xl font-bold text-primary hover:opacity-80">
          Small Tales
        </button>
        {#if $authStore.user}
          <nav class="flex items-center gap-6">
            <a href="#/dashboard" class="text-sm font-medium text-muted-foreground hover:text-foreground">Dashboard</a>
            <a href="#/media" class="text-sm font-medium text-muted-foreground hover:text-foreground">Media Library</a>
            <a href="#/analytics" class="text-sm font-medium">Analytics</a>
          </nav>
        {/if}
      </div>
      
      <div class="flex items-center gap-4">
        {#if $authStore.user}
          <span class="text-sm text-muted-foreground">
            {$authStore.profile?.full_name || $authStore.user?.email}
          </span>
          <button 
            class="text-sm text-muted-foreground hover:text-foreground"
            on:click={() => authService.signOut()}
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
      <!-- Not authenticated - show login prompt -->
      <div class="flex items-center justify-center min-h-[60vh] p-4">
        <Card class="w-full max-w-md p-8 text-center">
          <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 class="w-8 h-8 text-primary" />
          </div>
          <h1 class="text-2xl font-bold mb-3">Analytics Dashboard</h1>
          <p class="text-muted-foreground mb-6">
            Sign in to view detailed analytics about your story performance, reader engagement, and usage statistics.
          </p>
          <div class="space-y-3">
            <Button class="w-full" on:click={navigateToAuth}>
              <LogIn class="w-4 h-4 mr-2" />
              Sign In to View Analytics
            </Button>
            <Button variant="outline" class="w-full" on:click={navigateToLanding}>
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    {:else}
      <!-- Authenticated - show analytics dashboard -->
      <AnalyticsDashboard />
    {/if}
  </main>
</div>
</svelte:head>