<script lang="ts">
  import { authService } from '$lib/stores/auth'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  let email = ''
  let password = ''
  let loading = false
  let error = ''

  async function handleSubmit() {
    if (!email || !password) {
      error = 'Please fill in all fields'
      return
    }

    loading = true
    error = ''

    try {
      await authService.signIn(email, password)
      dispatch('success')
    } catch (err: any) {
      error = err.message || 'Login failed'
    } finally {
      loading = false
    }
  }
</script>

<Card class="w-full max-w-md mx-auto p-6">
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold">Sign In</h1>
      <p class="text-muted-foreground">Welcome back to Small Tales</p>
    </div>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div class="space-y-2">
        <label for="email" class="text-sm font-medium">Email</label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          bind:value={email}
          disabled={loading}
        />
      </div>

      <div class="space-y-2">
        <label for="password" class="text-sm font-medium">Password</label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          bind:value={password}
          disabled={loading}
        />
      </div>

      {#if error}
        <div class="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      {/if}

      <Button type="submit" class="w-full" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>

    <div class="text-center text-sm">
      <button
        type="button"
        class="text-primary hover:underline"
        on:click={() => dispatch('forgot-password')}
      >
        Forgot your password?
      </button>
    </div>

    <div class="text-center text-sm text-muted-foreground">
      Don't have an account?
      <button
        type="button"
        class="text-primary hover:underline"
        on:click={() => dispatch('switch-to-signup')}
      >
        Sign up
      </button>
    </div>
  </div>
</Card>