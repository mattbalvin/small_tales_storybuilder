<script lang="ts">
  import { onMount } from 'svelte'
  import { authStore, authService } from '$lib/stores/auth'
  import Button from '$lib/components/ui/button.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { Zap, Plus, Minus, RefreshCw, Gift, CreditCard, Calendar } from 'lucide-svelte'

  export let limit: number = 5
  export let showViewAll: boolean = true

  let transactions: any[] = []
  let loading: boolean = true

  onMount(async () => {
    if ($authStore.user) {
      await loadTransactions()
    }
  })

  async function loadTransactions() {
    loading = true
    transactions = await authService.getCreditTransactions(limit)
    loading = false
  }

  function getTransactionIcon(type: string) {
    switch (type) {
      case 'purchase': return CreditCard
      case 'subscription': return Calendar
      case 'usage': return Minus
      case 'bonus': return Gift
      case 'refund': return RefreshCw
      default: return Zap
    }
  }

  function getTransactionColor(type: string, amount: number) {
    if (amount < 0) return 'text-destructive'
    
    switch (type) {
      case 'purchase': return 'text-periwinkle-blue'
      case 'subscription': return 'text-dusty-teal'
      case 'bonus': return 'text-golden-apricot'
      case 'refund': return 'text-coral-sunset'
      default: return 'text-periwinkle-blue'
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function formatAmount(amount: number) {
    return amount > 0 ? `+${amount}` : amount.toString()
  }
</script>

<Card class="overflow-hidden">
  <div class="p-4 border-b border-periwinkle-blue/20">
    <div class="flex items-center justify-between">
      <h3 class="font-semibold text-coral-sunset">Credit History</h3>
      <Button variant="ghost" size="sm" on:click={loadTransactions} disabled={loading}>
        <RefreshCw class={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  </div>

  <div class="p-4">
    {#if loading}
      <div class="space-y-3">
        {#each Array(3) as _}
          <div class="flex items-center gap-3 p-3 rounded-lg bg-periwinkle-blue/5 animate-pulse-child">
            <div class="w-8 h-8 rounded-full bg-periwinkle-blue/20"></div>
            <div class="flex-1">
              <div class="h-4 bg-periwinkle-blue/20 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-periwinkle-blue/20 rounded w-1/2"></div>
            </div>
            <div class="w-16 h-6 bg-periwinkle-blue/20 rounded"></div>
          </div>
        {/each}
      </div>
    {:else if transactions.length === 0}
      <div class="text-center py-6">
        <Zap class="w-10 h-10 mx-auto mb-3 text-golden-apricot opacity-50" />
        <p class="text-dusty-teal">No credit transactions yet</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each transactions as transaction}
          {@const TransactionIcon = getTransactionIcon(transaction.transaction_type)}
          <div class="flex items-center gap-3 p-3 rounded-lg bg-periwinkle-blue/5">
            <div class="w-8 h-8 rounded-full bg-periwinkle-blue/10 flex items-center justify-center">
              <svelte:component this={TransactionIcon} class="w-4 h-4 text-periwinkle-blue" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">{transaction.description}</p>
              <p class="text-xs text-muted-foreground">{formatDate(transaction.created_at)}</p>
            </div>
            <div class={`font-medium ${getTransactionColor(transaction.transaction_type, transaction.amount)}`}>
              {formatAmount(transaction.amount)}
            </div>
          </div>
        {/each}
      </div>

      {#if showViewAll && transactions.length >= limit}
        <div class="mt-4 text-center">
          <Button variant="ghost" size="sm" class="text-periwinkle-blue">
            View All Transactions
          </Button>
        </div>
      {/if}
    {/if}
  </div>
</Card>