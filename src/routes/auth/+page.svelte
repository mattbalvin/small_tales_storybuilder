<script lang="ts">
  import { onMount } from 'svelte'
  import { authStore } from '$lib/stores/auth'
  import LoginForm from '$lib/components/auth/LoginForm.svelte'
  import SignupForm from '$lib/components/auth/SignupForm.svelte'

  let mode: 'login' | 'signup' = 'login'

  onMount(() => {
    // Redirect to dashboard if already authenticated
    if ($authStore.user) {
      window.location.hash = '#/'
    }
  })

  function handleAuthSuccess() {
    window.location.hash = '#/'
  }
</script>

<svelte:head>
  <title>Authentication - Small Tales</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-primary mb-2">Small Tales</h1>
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
  </div>
</div>