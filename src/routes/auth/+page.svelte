<script lang="ts">
  import { onMount } from 'svelte'
  import { authStore } from '$lib/stores/auth'
  import LoginForm from '$lib/components/auth/LoginForm.svelte'
  import SignupForm from '$lib/components/auth/SignupForm.svelte'

  let mode: 'login' | 'signup' = 'login'

  onMount(() => {
    // Redirect to dashboard if already authenticated
    const unsubscribe = authStore.subscribe(($authStore) => {
      if ($authStore.user && !$authStore.loading) {
        window.location.hash = '#/dashboard'
      }
    })

    return unsubscribe
  })

  function handleAuthSuccess() {
    // The reactive statement above will handle the redirect
    // when the auth store updates
  }

  function handleAuthCancel() {
    // Redirect to landing page if auth is canceled
    window.location.hash = '#/'
  }

  function handleAuthError() {
    // Redirect to landing page if auth fails
    window.location.hash = '#/'
  }
</script>

<svelte:head>
  <title>Authentication - Small Tales</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <button on:click={() => window.location.hash = '#/'} class="text-3xl font-bold text-primary mb-2 hover:opacity-80">
        Small Tales
      </button>
      <p class="text-muted-foreground">Interactive Story Builder</p>
    </div>

    {#if mode === 'login'}
      <LoginForm 
        on:success={handleAuthSuccess}
        on:switch-to-signup={() => mode = 'signup'}
        on:forgot-password={() => {
          // Handle forgot password
          console.log('Forgot password')
        }}
      />
    {:else}
      <SignupForm 
        on:success={handleAuthSuccess}
        on:switch-to-login={() => mode = 'login'}
      />
    {/if}

    <!-- Back to home link -->
    <div class="text-center mt-6">
      <button
        type="button"
        class="text-sm text-muted-foreground hover:text-foreground"
        on:click={handleAuthCancel}
      >
        ← Back to Home
      </button>
    </div>
  </div>
</div>