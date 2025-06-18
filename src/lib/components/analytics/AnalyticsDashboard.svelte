<script lang="ts">
  import { onMount } from 'svelte'
  import { analyticsStore, analyticsService } from '$lib/stores/analytics'
  import { authStore } from '$lib/stores/auth'
  import Card from '$lib/components/ui/card.svelte'
  import Button from '$lib/components/ui/button.svelte'
  import { BarChart3, Eye, Clock, Users, TrendingUp, Calendar, Download } from 'lucide-svelte'
  import { formatDuration } from '$lib/utils'

  $: analytics = $analyticsStore.analytics
  $: loading = $analyticsStore.loading
  $: dateRange = $analyticsStore.dateRange

  onMount(async () => {
    if ($authStore.user) {
      await analyticsService.loadAnalytics($authStore.user.id)
    }
  })

  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  function getEngagementColor(rate: number): string {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }
</script>

<div class="p-6 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold">Analytics Dashboard</h1>
      <p class="text-muted-foreground">Track your story performance and reader engagement</p>
    </div>
    <div class="flex items-center gap-2">
      <select 
        class="rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={dateRange}
        on:change={(e) => analyticsService.setDateRange(e.target.value)}
      >
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
        <option value="1y">Last year</option>
      </select>
      <Button variant="outline" size="sm">
        <Download class="w-4 h-4 mr-2" />
        Export
      </Button>
    </div>
  </div>

  {#if loading}
    <!-- Loading State -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each Array(4) as _}
        <Card class="p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded mb-2"></div>
          <div class="h-8 bg-gray-200 rounded"></div>
        </Card>
      {/each}
    </div>
  {:else}
    <!-- Key Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Total Views</p>
            <p class="text-2xl font-bold">{formatNumber(analytics.totalViews)}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Eye class="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div class="flex items-center mt-2 text-sm">
          <TrendingUp class="w-4 h-4 text-green-600 mr-1" />
          <span class="text-green-600">+{analytics.viewsGrowth}%</span>
          <span class="text-muted-foreground ml-1">vs last period</span>
        </div>
      </Card>

      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Unique Readers</p>
            <p class="text-2xl font-bold">{formatNumber(analytics.uniqueReaders)}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Users class="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div class="flex items-center mt-2 text-sm">
          <TrendingUp class="w-4 h-4 text-green-600 mr-1" />
          <span class="text-green-600">+{analytics.readersGrowth}%</span>
          <span class="text-muted-foreground ml-1">vs last period</span>
        </div>
      </Card>

      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Avg. Reading Time</p>
            <p class="text-2xl font-bold">{formatDuration(analytics.avgReadingTime)}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Clock class="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div class="flex items-center mt-2 text-sm">
          <span class="text-muted-foreground">Engagement rate:</span>
          <span class={`ml-1 font-medium ${getEngagementColor(analytics.engagementRate)}`}>
            {analytics.engagementRate}%
          </span>
        </div>
      </Card>

      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Stories Published</p>
            <p class="text-2xl font-bold">{analytics.storiesPublished}</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <BarChart3 class="w-6 h-6 text-orange-600" />
          </div>
        </div>
        <div class="flex items-center mt-2 text-sm">
          <span class="text-muted-foreground">Active stories:</span>
          <span class="ml-1 font-medium">{analytics.activeStories}</span>
        </div>
      </Card>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Views Over Time -->
      <Card class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Views Over Time</h3>
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar class="w-4 h-4" />
            {dateRange === '7d' ? 'Last 7 days' : 
             dateRange === '30d' ? 'Last 30 days' : 
             dateRange === '90d' ? 'Last 90 days' : 'Last year'}
          </div>
        </div>
        <div class="h-64 flex items-center justify-center bg-gray-50 rounded">
          <p class="text-muted-foreground">Chart visualization would go here</p>
        </div>
      </Card>

      <!-- Top Stories -->
      <Card class="p-6">
        <h3 class="text-lg font-semibold mb-4">Top Performing Stories</h3>
        <div class="space-y-4">
          {#each analytics.topStories as story, index}
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                  {index + 1}
                </div>
                <div>
                  <p class="font-medium">{story.title}</p>
                  <p class="text-sm text-muted-foreground">{story.views} views</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium">{formatDuration(story.avgReadingTime)}</p>
                <p class="text-xs text-muted-foreground">avg. time</p>
              </div>
            </div>
          {/each}
        </div>
      </Card>
    </div>

    <!-- Detailed Analytics -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Reader Demographics -->
      <Card class="p-6">
        <h3 class="text-lg font-semibold mb-4">Reader Demographics</h3>
        <div class="space-y-3">
          {#each analytics.demographics as demo}
            <div class="flex items-center justify-between">
              <span class="text-sm">{demo.ageGroup}</span>
              <div class="flex items-center gap-2">
                <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-primary rounded-full" 
                    style="width: {demo.percentage}%"
                  ></div>
                </div>
                <span class="text-sm font-medium w-8">{demo.percentage}%</span>
              </div>
            </div>
          {/each}
        </div>
      </Card>

      <!-- Device Types -->
      <Card class="p-6">
        <h3 class="text-lg font-semibold mb-4">Device Usage</h3>
        <div class="space-y-3">
          {#each analytics.deviceTypes as device}
            <div class="flex items-center justify-between">
              <span class="text-sm">{device.type}</span>
              <div class="flex items-center gap-2">
                <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-green-500 rounded-full" 
                    style="width: {device.percentage}%"
                  ></div>
                </div>
                <span class="text-sm font-medium w-8">{device.percentage}%</span>
              </div>
            </div>
          {/each}
        </div>
      </Card>

      <!-- Engagement Metrics -->
      <Card class="p-6">
        <h3 class="text-lg font-semibold mb-4">Engagement Metrics</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm">Completion Rate</span>
            <span class="text-sm font-medium">{analytics.completionRate}%</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm">Bounce Rate</span>
            <span class="text-sm font-medium">{analytics.bounceRate}%</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm">Return Readers</span>
            <span class="text-sm font-medium">{analytics.returnReaders}%</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm">Shares</span>
            <span class="text-sm font-medium">{analytics.totalShares}</span>
          </div>
        </div>
      </Card>
    </div>
  {/if}
</div>