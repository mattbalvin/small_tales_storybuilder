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
      if ($authStore.user && !$authStore.loading && $authStore.user != null) {
        window.location.hash = '#/dashboard'
      }
    })

    return unsubscribe
  })
</script>

<div class="min-h-screen bg-soft-buttercream">
  <!-- Header -->
  <header class="border-b border-periwinkle-blue/20 bg-soft-buttercream/80 backdrop-blur-sm sticky top-0 z-50">
    <div class="container flex items-center justify-between py-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-coral-sunset rounded-xl flex items-center justify-center shadow-lg">
          <BookOpen class="w-6 h-6 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-coral-sunset">Small Tales</h1>
      </div>
      
      <div class="flex items-center gap-4">
        {#if $authStore.user}
          <Button variant="ghost" on:click={navigateToDashboard}>
            Dashboard
          </Button>
          <Button on:click={navigateToDashboard} class="featured-item">
            Go to Dashboard
          </Button>
        {:else}
          <Button variant="ghost" on:click={navigateToAuth}>
            Sign In
          </Button>
          <Button on:click={navigateToAuth} class="featured-item">
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
        <h1 class="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-coral-sunset to-dusty-teal bg-clip-text text-transparent">
          Create Interactive Stories That Come to Life
        </h1>
        <p class="text-xl text-dusty-teal mb-8 leading-relaxed">
          Build engaging multimedia storybooks with drag-and-drop simplicity. Add images, audio narration, and interactive elements to captivate your audience across all devices.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          {#if $authStore.user}
            <Button size="lg" class="text-lg px-8 py-6 featured-item" on:click={navigateToDashboard}>
              <BookOpen class="w-5 h-5 mr-2" />
              Go to Dashboard
              <ArrowRight class="w-5 h-5 ml-2" />
            </Button>
          {:else}
            <Button size="lg" class="text-lg px-8 py-6 featured-item" on:click={navigateToAuth}>
              <BookOpen class="w-5 h-5 mr-2" />
              Create Your First Story
              <ArrowRight class="w-5 h-5 ml-2" />
            </Button>
          {/if}
          <Button variant="secondary" size="lg" class="text-lg px-8 py-6">
            <Play class="w-5 h-5 mr-2" />
            Watch Demo
          </Button>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Grid -->
  <section class="py-20 px-4">
    <div class="container">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold mb-4 text-coral-sunset">Everything You Need to Tell Amazing Stories</h2>
        <p class="text-lg text-dusty-teal max-w-2xl mx-auto">
          Professional storytelling tools designed for creators, educators, and anyone with a story to tell.
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Visual Editor -->
        <Card class="p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div class="w-16 h-16 bg-golden-apricot/20 rounded-xl flex items-center justify-center mb-6">
            <Palette class="w-8 h-8 text-golden-apricot" />
          </div>
          <h3 class="text-xl font-semibold mb-4 text-coral-sunset">Visual Story Editor</h3>
          <p class="text-dusty-teal">
            Drag-and-drop interface with WYSIWYG editing. Design for both landscape and portrait orientations with safety zone guides.
          </p>
        </Card>

        <!-- Audio Integration -->
        <Card class="p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div class="w-16 h-16 bg-periwinkle-blue/20 rounded-xl flex items-center justify-center mb-6">
            <Volume2 class="w-8 h-8 text-periwinkle-blue" />
          </div>
          <h3 class="text-xl font-semibold mb-4 text-coral-sunset">Audio Narration</h3>
          <p class="text-dusty-teal">
            Add synchronized audio narration with word-level timing. Support for multiple audio formats and automatic playback controls.
          </p>
        </Card>

        <!-- Cross-Platform -->
        <Card class="p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div class="w-16 h-16 bg-dusty-teal/20 rounded-xl flex items-center justify-center mb-6">
            <Smartphone class="w-8 h-8 text-dusty-teal" />
          </div>
          <h3 class="text-xl font-semibold mb-4 text-coral-sunset">Cross-Platform</h3>
          <p class="text-dusty-teal">
            Stories work seamlessly on web, mobile, and tablets. Export to multiple formats including EPUB and PDF.
          </p>
        </Card>

        <!-- Media Library -->
        <Card class="p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div class="w-16 h-16 bg-golden-apricot/20 rounded-xl flex items-center justify-center mb-6">
            <BookOpen class="w-8 h-8 text-golden-apricot" />
          </div>
          <h3 class="text-xl font-semibold mb-4 text-coral-sunset">Media Library</h3>
          <p class="text-dusty-teal">
            Centralized asset management with tagging, search, and organization. Upload images, audio, and video files.
          </p>
        </Card>

        <!-- Collaboration -->
        <Card class="p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div class="w-16 h-16 bg-periwinkle-blue/20 rounded-xl flex items-center justify-center mb-6">
            <Users class="w-8 h-8 text-periwinkle-blue" />
          </div>
          <h3 class="text-xl font-semibold mb-4 text-coral-sunset">Team Collaboration</h3>
          <p class="text-dusty-teal">
            Work together with role-based permissions. Share stories privately or publish them for the world to enjoy.
          </p>
        </Card>

        <!-- Analytics -->
        <Card class="p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div class="w-16 h-16 bg-dusty-teal/20 rounded-xl flex items-center justify-center mb-6">
            <BarChart3 class="w-8 h-8 text-dusty-teal" />
          </div>
          <h3 class="text-xl font-semibold mb-4 text-coral-sunset">Reader Analytics</h3>
          <p class="text-dusty-teal">
            Track engagement, reading time, and interaction points. Understand how readers experience your stories.
          </p>
        </Card>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section class="py-20 px-4 bg-periwinkle-blue/5">
    <div class="container">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold mb-4 text-coral-sunset">Loved by Storytellers Everywhere</h2>
        <p class="text-lg text-dusty-teal">
          Join thousands of creators who are bringing their stories to life with Small Tales.
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-8">
        <Card class="p-8">
          <div class="flex items-center gap-1 mb-6">
            {#each Array(5) as _}
              <Star class="w-5 h-5 fill-golden-apricot text-golden-apricot" />
            {/each}
          </div>
          <p class="text-dusty-teal mb-6">
            "Small Tales transformed how I create educational content. The audio synchronization feature is incredible!"
          </p>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-coral-sunset/20 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium text-coral-sunset">SM</span>
            </div>
            <div>
              <p class="font-medium text-coral-sunset">Sarah Martinez</p>
              <p class="text-sm text-muted-foreground">Elementary Teacher</p>
            </div>
          </div>
        </Card>

        <Card class="p-8">
          <div class="flex items-center gap-1 mb-6">
            {#each Array(5) as _}
              <Star class="w-5 h-5 fill-golden-apricot text-golden-apricot" />
            {/each}
          </div>
          <p class="text-dusty-teal mb-6">
            "The drag-and-drop editor makes it so easy to create professional-looking stories. My kids love them!"
          </p>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-periwinkle-blue/20 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium text-periwinkle-blue">DJ</span>
            </div>
            <div>
              <p class="font-medium text-coral-sunset">David Johnson</p>
              <p class="text-sm text-muted-foreground">Parent & Author</p>
            </div>
          </div>
        </Card>

        <Card class="p-8">
          <div class="flex items-center gap-1 mb-6">
            {#each Array(5) as _}
              <Star class="w-5 h-5 fill-golden-apricot text-golden-apricot" />
            {/each}
          </div>
          <p class="text-dusty-teal mb-6">
            "Perfect for creating interactive training materials. The analytics help us understand engagement."
          </p>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-dusty-teal/20 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium text-dusty-teal">AL</span>
            </div>
            <div>
              <p class="font-medium text-coral-sunset">Alex Liu</p>
              <p class="text-sm text-muted-foreground">Training Manager</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-20 px-4">
    <div class="container text-center">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-3xl md:text-4xl font-bold mb-6 text-coral-sunset">Ready to Start Your Story?</h2>
        <p class="text-lg text-dusty-teal mb-8">
          Join thousands of creators who are already using Small Tales to bring their stories to life. 
          Start creating today with our intuitive story builder.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          {#if $authStore.user}
            <Button size="lg" class="text-lg px-8 py-6 featured-item" on:click={navigateToDashboard}>
              <BookOpen class="w-5 h-5 mr-2" />
              Go to Your Dashboard
              <ArrowRight class="w-5 h-5 ml-2" />
            </Button>
          {:else}
            <Button size="lg" class="text-lg px-8 py-6 featured-item" on:click={navigateToAuth}>
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
  <footer class="border-t border-periwinkle-blue/20 bg-soft-buttercream py-12 px-4">
    <div class="container">
      <div class="grid md:grid-cols-4 gap-8">
        <div>
          <div class="flex items-center gap-3 mb-6">
            <div class="w-8 h-8 bg-coral-sunset rounded-lg flex items-center justify-center">
              <BookOpen class="w-5 h-5 text-white" />
            </div>
            <span class="font-bold text-coral-sunset text-lg">Small Tales</span>
          </div>
          <p class="text-dusty-teal">
            Interactive storytelling platform for creators, educators, and storytellers.
          </p>
        </div>
        
        <div>
          <h4 class="font-medium mb-4 text-coral-sunset">Product</h4>
          <ul class="space-y-3 text-dusty-teal">
            <li><a href="#" class="hover:text-coral-sunset transition-colors">Features</a></li>
            <li><a href="#" class="hover:text-coral-sunset transition-colors">Pricing</a></li>
            <li><a href="#" class="hover:text-coral-sunset transition-colors">Templates</a></li>
            <li><a href="#" class="hover:text-coral-sunset transition-colors">Examples</a></li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-medium mb-4 text-coral-sunset">Resources</h4>
          <ul class="space-y-3 text-dusty-teal">
            <li><a href="#" class="hover:text-coral-sunset transition-colors">Documentation</a></li>
            <li><a href="#" class="hover:text-coral-sunset transition-colors">Tutorials</a></li>
            <li><a href="#" class="hover:text-coral-sunset transition-colors">Blog</a></li>
            <li><a href="#" class="hover:text-coral-sunset transition-colors">Community</a></li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-medium mb-4 text-coral-sunset">Company</h4>
          <ul class="space-y-3 text-dusty-teal">
            <li><a href="#" class="hover:text-coral-sunset transition-colors">About</a></li>
            <li><a href="#" class="hover:text-coral-sunset transition-colors">Contact</a></li>
            <li><a href="#" class="hover:text-coral-sunset transition-colors">Privacy</a></li>
            <li><a href="#" class="hover:text-coral-sunset transition-colors">Terms</a></li>
          </ul>
        </div>
      </div>
      
      <div class="border-t border-periwinkle-blue/20 mt-8 pt-8 text-center text-dusty-teal">
        <p>&copy; 2025 Small Tales. All rights reserved.</p>
      </div>
    </div>
  </footer>
</div>