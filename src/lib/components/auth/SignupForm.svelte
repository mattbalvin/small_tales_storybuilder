<script lang="ts">
  import { authService } from '$lib/stores/auth'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  let email = ''
  let password = ''
  let fullName = ''
  let confirmPassword = ''
  let loading = false
  let error = ''

  async function handleSubmit() {
    if (!email || !password || !fullName || !confirmPassword) {
      error = 'Please fill in all fields'
      return
    }

    if (password !== confirmPassword) {
      error = 'Passwords do not match'
      return
    }

    if (password.length < 6) {
      error = 'Password must be at least 6 characters'
      return
    }

    loading = true
    error = ''

    try {
      await authService.signUp(email, password, fullName)
      dispatch('success')
    } catch (err: any) {
      error = err.message || 'Signup failed'
    } finally {
      loading = false
    }
  }
</script>

<Card class="w-full max-w-md mx-auto p-6">
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold">Create Account</h1>
      <p class="text-muted-foreground">Start creating amazing stories</p>
    </div>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div class="space-y-2">
        <label for="fullName" class="text-sm font-medium">Full Name</label>
        <Input
          id="fullName"
          type="text"
          placeholder="Enter your full name"
          bind:value={fullName}
          disabled={loading}
        />
      </div>

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
          placeholder="Create a password"
          bind:value={password}
          disabled={loading}
        />
      </div>

      <div class="space-y-2">
        <label for="confirmPassword" class="text-sm font-medium">Confirm Password</label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          bind:value={confirmPassword}
          disabled={loading}
        />
      </div>

      {#if error}
        <div class="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      {/if}

      <Button type="submit" class="w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>

    <div class="text-center text-sm text-muted-foreground">
      Already have an account?
      <button
        type="button"
        class="text-primary hover:underline"
        on:click={() => dispatch('switch-to-login')}
      >
        Sign in
      </button>
    </div>
  </div>
</Card>