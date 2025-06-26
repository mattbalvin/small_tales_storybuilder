<script lang="ts">
  import { onMount } from 'svelte'
  import { authStore } from '$lib/stores/auth'
  import Button from '$lib/components/ui/button.svelte'
  import Card from '$lib/components/ui/card.svelte'
  import { BookOpen, Palette, Volume2, Smartphone, Users, BarChart3, ArrowRight, Star, Play } from 'lucide-svelte'

  function navigateToAuth() {
    window.location.hash = '#/auth'
  }

  function navigateToDashboard() {
    window.location.hash = '#/dashboard'
  }

  // Redirect authenticated users to dashboard
  onMount(() => {
    const unsubscribe = authStore.subscribe(($authStore) => {
      // Only redirect if user is authenticated, not loading, and we're not on the home page
      // This allows users who just signed out to stay on the landing page
      if ($authStore.user && !$authStore.loading && window.location.hash !== '#/' && window.location.hash !== '') {
        window.location.hash = '#/dashboard'
      }
    })

    return unsubscribe
  })
</script>

<div class="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
  <!-- Header -->
  <header class="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
    <div class="container flex items-center justify-between py-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <BookOpen class="w-5 h-5 text-primary-foreground" />
        </div>
        <h1 class="text-xl font-bold text-primary">Small Tales</h1>
      </div>
      
      <div class="flex items-center gap-4">
        {#if $authStore.user}
          <Button variant="ghost" on:click={navigateToDashboard}>
            Dashboard
          </Button>
          <Button on:click={navigateToDashboard}>
            Go to Dashboard
          </Button>
        {:else}
          <Button variant="ghost" on:click={navigateToAuth}>
            Sign In
          </Button>
          <Button on:click={navigateToAuth}>
            Get Started
          </Button>
        {/if}
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="py-20 px-4">
    <div class="container text-center">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Create Interactive Stories That Come to Life
        </h1>
        <p class="text-xl text-muted-foreground mb-8 leading-relaxed">
          Build engaging multimedia storybooks with drag-and-drop simplicity. Add images, audio narration, and interactive elements to captivate your audience across all devices.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          {#if $authStore.user}
            <Button size="lg" class="text-lg px-8 py-6" on:click={navigateToDashboard}>
              <BookOpen class="w-5 h-5 mr-2" />
              Go to Dashboard
              <ArrowRight class="w-5 h-5 ml-2" />
            </Button>
          {:else}
            <Button size="lg" class="text-lg px-8 py-6" on:click={navigateToAuth}>
              <BookOpen class="w-5 h-5 mr-2" />
              Create Your First Story
              <ArrowRight class="w-5 h-5 ml-2" />
            </Button>
          {/if}
          <Button variant="outline" size="lg" class="text-lg px-8 py-6">
            <Play class="w-5 h-5 mr-2" />
            Watch Demo
          </Button>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Grid -->
  <section class="py-20 px-4 bg-background/50">
    <div class="container">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Tell Amazing Stories</h2>
        <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
          Professional storytelling tools designed for creators, educators, and anyone with a story to tell.
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Visual Editor -->
        <Card class="p-6 hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <Palette class="w-6 h-6 text-primary" />
          </div>
          <h3 class="text-xl font-semibold mb-3">Visual Story Editor</h3>
          <p class="text-muted-foreground">
            Drag-and-drop interface with WYSIWYG editing. Design for both landscape and portrait orientations with safety zone guides.
          </p>
        </Card>

        <!-- Audio Integration -->
        <Card class="p-6 hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <Volume2 class="w-6 h-6 text-primary" />
          </div>
          <h3 class="text-xl font-semibold mb-3">Audio Narration</h3>
          <p class="text-muted-foreground">
            Add synchronized audio narration with word-level timing. Support for multiple audio formats and automatic playback controls.
          </p>
        </Card>

        <!-- Cross-Platform -->
        <Card class="p-6 hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <Smartphone class="w-6 h-6 text-primary" />
          </div>
          <h3 class="text-xl font-semibold mb-3">Cross-Platform</h3>
          <p class="text-muted-foreground">
            Stories work seamlessly on web, mobile, and tablets. Export to multiple formats including EPUB and PDF.
          </p>
        </Card>

        <!-- Media Library -->
        <Card class="p-6 hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <BookOpen class="w-6 h-6 text-primary" />
          </div>
          <h3 class="text-xl font-semibold mb-3">Media Library</h3>
          <p class="text-muted-foreground">
            Centralized asset management with tagging, search, and organization. Upload images, audio, and video files.
          </p>
        </Card>

        <!-- Collaboration -->
        <Card class="p-6 hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <Users class="w-6 h-6 text-primary" />
          </div>
          <h3 class="text-xl font-semibold mb-3">Team Collaboration</h3>
          <p class="text-muted-foreground">
            Work together with role-based permissions. Share stories privately or publish them for the world to enjoy.
          </p>
        </Card>

        <!-- Analytics -->
        <Card class="p-6 hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <BarChart3 class="w-6 h-6 text-primary" />
          </div>
          <h3 class="text-xl font-semibold mb-3">Reader Analytics</h3>
          <p class="text-muted-foreground">
            Track engagement, reading time, and interaction points. Understand how readers experience your stories.
          </p>
        </Card>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section class="py-20 px-4">
    <div class="container">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">Loved by Storytellers Everywhere</h2>
        <p class="text-lg text-muted-foreground">
          Join thousands of creators who are bringing their stories to life with Small Tales.
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-8">
        <Card class="p-6">
          <div class="flex items-center gap-1 mb-4">
            {#each Array(5) as _}
              <Star class="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {/each}
          </div>
          <p class="text-muted-foreground mb-4">
            "Small Tales transformed how I create educational content. The audio synchronization feature is incredible!"
          </p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium text-primary">SM</span>
            </div>
            <div>
              <p class="font-medium">Sarah Martinez</p>
              <p class="text-sm text-muted-foreground">Elementary Teacher</p>
            </div>
          </div>
        </Card>

        <Card class="p-6">
          <div class="flex items-center gap-1 mb-4">
            {#each Array(5) as _}
              <Star class="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {/each}
          </div>
          <p class="text-muted-foreground mb-4">
            "The drag-and-drop editor makes it so easy to create professional-looking stories. My kids love them!"
          </p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium text-primary">DJ</span>
            </div>
            <div>
              <p class="font-medium">David Johnson</p>
              <p class="text-sm text-muted-foreground">Parent & Author</p>
            </div>
          </div>
        </Card>

        <Card class="p-6">
          <div class="flex items-center gap-1 mb-4">
            {#each Array(5) as _}
              <Star class="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {/each}
          </div>
          <p class="text-muted-foreground mb-4">
            "Perfect for creating interactive training materials. The analytics help us understand engagement."
          </p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium text-primary">AL</span>
            </div>
            <div>
              <p class="font-medium">Alex Liu</p>
              <p class="text-sm text-muted-foreground">Training Manager</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-20 px-4 bg-primary/5">
    <div class="container text-center">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Story?</h2>
        <p class="text-lg text-muted-foreground mb-8">
          Join thousands of creators who are already using Small Tales to bring their stories to life. 
          Start creating today with our intuitive story builder.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          {#if $authStore.user}
            <Button size="lg" class="text-lg px-8 py-6" on:click={navigateToDashboard}>
              <BookOpen class="w-5 h-5 mr-2" />
              Go to Your Dashboard
              <ArrowRight class="w-5 h-5 ml-2" />
            </Button>
          {:else}
            <Button size="lg" class="text-lg px-8 py-6" on:click={navigateToAuth}>
              <BookOpen class="w-5 h-5 mr-2" />
              Create Your Own Story
              <ArrowRight class="w-5 h-5 ml-2" />
            </Button>
          {/if}
          <Button variant="outline" size="lg" class="text-lg px-8 py-6">
            Learn More
          </Button>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t bg-background py-12 px-4">
    <div class="container">
      <div class="grid md:grid-cols-4 gap-8">
        <div>
          <div class="flex items-center gap-2 mb-4">
            <div class="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <BookOpen class="w-4 h-4 text-primary-foreground" />
            </div>
            <span class="font-bold text-primary">Small Tales</span>
          </div>
          <p class="text-sm text-muted-foreground">
            Interactive storytelling platform for creators, educators, and storytellers.
          </p>
        </div>
        
        <div>
          <h4 class="font-medium mb-3">Product</h4>
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" class="hover:text-foreground">Features</a></li>
            <li><a href="#" class="hover:text-foreground">Pricing</a></li>
            <li><a href="#" class="hover:text-foreground">Templates</a></li>
            <li><a href="#" class="hover:text-foreground">Examples</a></li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-medium mb-3">Resources</h4>
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" class="hover:text-foreground">Documentation</a></li>
            <li><a href="#" class="hover:text-foreground">Tutorials</a></li>
            <li><a href="#" class="hover:text-foreground">Blog</a></li>
            <li><a href="#" class="hover:text-foreground">Community</a></li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-medium mb-3">Company</h4>
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" class="hover:text-foreground">About</a></li>
            <li><a href="#" class="hover:text-foreground">Contact</a></li>
            <li><a href="#" class="hover:text-foreground">Privacy</a></li>
            <li><a href="#" class="hover:text-foreground">Terms</a></li>
          </ul>
        </div>
      </div>
      
      <div class="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
        <p>&copy; 2025 Small Tales. All rights reserved.</p>
      </div>
    </div>
  </footer>
</div>