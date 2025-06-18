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
  let passwordStrength = 0
  let passwordFeedback = ''

  function checkPasswordStrength(pwd: string) {
    let strength = 0
    let feedback = []

    if (pwd.length >= 8) {
      strength += 1
    } else {
      feedback.push('at least 8 characters')
    }

    if (/[a-z]/.test(pwd)) {
      strength += 1
    } else {
      feedback.push('lowercase letter')
    }

    if (/[A-Z]/.test(pwd)) {
      strength += 1
    } else {
      feedback.push('uppercase letter')
    }

    if (/[0-9]/.test(pwd)) {
      strength += 1
    } else {
      feedback.push('number')
    }

    if (/[^A-Za-z0-9]/.test(pwd)) {
      strength += 1
    } else {
      feedback.push('special character')
    }

    passwordStrength = strength
    
    if (strength < 3) {
      passwordFeedback = `Weak password. Add: ${feedback.join(', ')}`
    } else if (strength < 4) {
      passwordFeedback = `Good password. Consider adding: ${feedback.join(', ')}`
    } else {
      passwordFeedback = 'Strong password!'
    }
  }

  $: if (password) {
    checkPasswordStrength(password)
  }

  function getStrengthColor(strength: number) {
    if (strength < 2) return 'bg-red-500'
    if (strength < 4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  async function handleSubmit() {
    if (!email || !password || !fullName || !confirmPassword) {
      error = 'Please fill in all fields'
      return
    }

    if (password !== confirmPassword) {
      error = 'Passwords do not match'
      return
    }

    if (passwordStrength < 3) {
      error = 'Please choose a stronger password'
      return
    }

    loading = true
    error = ''

    try {
      await authService.signUp(email, password, fullName)
      dispatch('success')
    } catch (err: any) {
      error = err.message || 'Signup failed'
      // Dispatch error event for parent to handle
      dispatch('error', { message: error })
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
          autocomplete="name"
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
          autocomplete="email"
          bind:value={email}
          disabled={loading}
        />
      </div>

      <div class="space-y-2">
        <label for="password" class="text-sm font-medium">Password</label>
        <Input
          id="password"
          type="password"
          placeholder="Create a secure password"
          autocomplete="new-password"
          bind:value={password}
          disabled={loading}
        />
        
        {#if password}
          <div class="space-y-2">
            <!-- Password strength indicator -->
            <div class="flex space-x-1">
              {#each Array(5) as _, i}
                <div 
                  class="h-1 flex-1 rounded-full {i < passwordStrength ? getStrengthColor(passwordStrength) : 'bg-gray-200'}"
                ></div>
              {/each}
            </div>
            
            <!-- Password feedback -->
            <p class="text-xs {passwordStrength >= 4 ? 'text-green-600' : passwordStrength >= 3 ? 'text-yellow-600' : 'text-red-600'}">
              {passwordFeedback}
            </p>
          </div>
        {/if}
      </div>

      <div class="space-y-2">
        <label for="confirmPassword" class="text-sm font-medium">Confirm Password</label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          autocomplete="new-password"
          bind:value={confirmPassword}
          disabled={loading}
        />
        
        {#if confirmPassword && password !== confirmPassword}
          <p class="text-xs text-red-600">Passwords do not match</p>
        {/if}
      </div>

      {#if error}
        <div class="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      {/if}

      <Button 
        type="submit" 
        class="w-full" 
        disabled={loading || passwordStrength < 3 || password !== confirmPassword}
      >
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