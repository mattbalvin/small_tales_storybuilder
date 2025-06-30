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
  <header class="border-b border-periwinkle-blue/20 bg-coral-sunset/90 backdrop-blur-sm sticky top-0 z-50">
    <div class="container flex items-center justify-between py-4">
      <div class="flex items-center gap-3">
        <div class="bg-[#FEF5E1] rounded-lg border-2 border-[#558A80] p-1">
          <img 
            src="/a-vibrant-logo-illustration-of-an-open-s_cW_N4un2Sn2tPv27_2LPKA_ihURQ9I_SK6GaVnhM6m41Q.png" 
            alt="Small Tales Logo" 
            class="h-12"
          />
        </div>
      </div>
      
      <nav class="hidden md:flex items-center gap-8">
        <a href="#" class="text-white font-medium">Home</a>
        <a href="#" class="text-white hover:text-golden-apricot transition-colors">Stories</a>
        <a href="#" class="text-white hover:text-golden-apricot transition-colors">About Us</a>
      </nav>
      
      <div class="flex items-center gap-4">
        {#if $authStore.user}
          <Button variant="ghost" on:click={navigateToDashboard} class="text-white hover:text-white">
            Dashboard
          </Button>
          <Button on:click={navigateToDashboard} class="bg-golden-apricot text-white hover:bg-golden-apricot shadow-md hover:shadow-lg rounded-full px-6">
            Go to Dashboard
          </Button>
        {:else}
          <Button on:click={navigateToAuth} class="bg-golden-apricot text-white hover:bg-golden-apricot shadow-md hover:shadow-lg rounded-full px-6">
            Read Now
          </Button>
        {/if}
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="relative overflow-hidden">
    <!-- Hero Background -->
    <div class="absolute inset-0 bg-soft-buttercream -z-10"></div>
    
    <!-- Hero Content -->
    <div class="container mx-auto px-4 pt-8 pb-16 md:pt-12">
      <div class="flex flex-col items-center">
        <!-- Main Illustration -->
        <div class="w-full max-w-5xl mx-auto mb-8">
          <img 
            src="/transparent-a-vibrant-landing-page-for-small-tales-a_5wFyNmIVR82c80rZxEoFmQ_CI97eOdZRCmcn--7ue-shA-topaz-sharpen-denoise-upscale-2x-topaz-upscale-2x.png" 
            alt="Cute animal characters reading books around a campfire"
            class="w-full h-auto rounded-2xl"
          />
        </div>
        
        <!-- Heading and Tagline -->
        <div class="text-center max-w-4xl">
          <h1 class="text-5xl md:text-6xl font-bold mb-6">
            <span class="text-coral-sunset block">Big Adventures</span>
            <span class="text-golden-apricot block">in Small Tales</span>
          </h1>
          <p class="text-xl text-dusty-teal mb-8">
            Exciting interactive stories for early readers
          </p>
          
          <!-- Story Cards -->
          <div class="flex justify-center gap-4 mt-8">
            <div class="w-32 h-44 bg-periwinkle-blue rounded-xl shadow-lg flex flex-col items-center justify-center transform -rotate-6 border-4 border-white">
              <span class="text-white font-bold text-sm">The Lost</span>
              <span class="text-white font-bold text-sm">Kitten</span>
              <div class="mt-2 w-12 h-12 bg-golden-apricot rounded-full flex items-center justify-center">
                <span class="text-white text-2xl">😺</span>
              </div>
            </div>
            <div class="w-32 h-44 bg-dusty-teal rounded-xl shadow-lg flex flex-col items-center justify-center border-4 border-white">
              <span class="text-white font-bold text-sm">The Brave</span>
              <span class="text-white font-bold text-sm">Little Bear</span>
              <div class="mt-2 w-12 h-12 bg-soft-buttercream rounded-full flex items-center justify-center">
                <span class="text-2xl">🐻</span>
              </div>
            </div>
            <div class="w-32 h-44 bg-periwinkle-blue/80 rounded-xl shadow-lg flex flex-col items-center justify-center transform rotate-6 border-4 border-white">
              <span class="text-white font-bold text-sm">The Magical</span>
              <span class="text-white font-bold text-sm">Treehouse</span>
              <div class="mt-2 w-12 h-12 bg-coral-sunset rounded-full flex items-center justify-center">
                <span class="text-white text-2xl">🌳</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Decorative Wave -->
    <div class="absolute bottom-0 left-0 right-0 h-16 md:h-24 bg-white rounded-t-[50%] -z-5"></div>
  </section>

  <!-- Features Grid -->
  <section class="py-20 px-4 bg-white">
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

        <!-- Media Library -->
        <Card class="p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div class="w-16 h-16 bg-golden-apricot/20 rounded-xl flex items-center justify-center mb-6">
            <BookOpen class="w-8 h-8 text-golden-apricot" />
          </div>
          <h3 class="text-xl font-semibold mb-4 text-coral-sunset">Media Library</h3>
          <p class="text-dusty-teal">
            Centralized asset management with tagging, search, and organization. Upload your own image and audio assets or use our integrated generative AI features to create the perfect art for your story.
          </p>
        </Card>

        <!-- Cross-Platform - Coming Soon -->
        <Card class="p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
          <div class="absolute -right-12 top-6 bg-coral-sunset text-white px-10 py-1 transform rotate-45 shadow-md">
            <span class="text-xs font-bold">COMING SOON</span>
          </div>
          <div class="w-16 h-16 bg-dusty-teal/20 rounded-xl flex items-center justify-center mb-6">
            <Smartphone class="w-8 h-8 text-dusty-teal" />
          </div>
          <h3 class="text-xl font-semibold mb-4 text-coral-sunset">Cross-Platform</h3>
          <p class="text-dusty-teal">
            Stories work seamlessly on web, mobile, and tablets. Export to multiple formats including EPUB and PDF.
          </p>
        </Card>

        <!-- Collaboration - Coming Soon -->
        <Card class="p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
          <div class="absolute -right-12 top-6 bg-coral-sunset text-white px-10 py-1 transform rotate-45 shadow-md">
            <span class="text-xs font-bold">COMING SOON</span>
          </div>
          <div class="w-16 h-16 bg-periwinkle-blue/20 rounded-xl flex items-center justify-center mb-6">
            <Users class="w-8 h-8 text-periwinkle-blue" />
          </div>
          <h3 class="text-xl font-semibold mb-4 text-coral-sunset">Team Collaboration</h3>
          <p class="text-dusty-teal">
            Work together with role-based permissions. Share stories privately or publish them for the world to enjoy.
          </p>
        </Card>

        <!-- Analytics - Coming Soon -->
        <Card class="p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
          <div class="absolute -right-12 top-6 bg-coral-sunset text-white px-10 py-1 transform rotate-45 shadow-md">
            <span class="text-xs font-bold">COMING SOON</span>
          </div>
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
  <footer class="bg-[#558A80] text-white py-12 px-4">
    <div class="container">
      <div class="grid md:grid-cols-4 gap-8">
        <div>
          <div class="flex items-center mb-6">
            <div class="bg-[#FEF5E1] rounded-lg border-2 border-[#E2684F] p-1">
              <img 
                src="/a-vibrant-logo-illustration-of-an-open-s_cW_N4un2Sn2tPv27_2LPKA_ihURQ9I_SK6GaVnhM6m41Q.png" 
                alt="Small Tales Logo" 
                class="h-10"
              />
            </div>
          </div>
          <p class="text-white">
            Interactive storytelling platform for creators, educators, and storytellers.
          </p>
        </div>
        
        <div>
          <h4 class="font-medium mb-4 text-white">Product</h4>
          <ul class="space-y-3 text-white">
            <li><a href="#" class="hover:text-golden-apricot transition-colors">Features</a></li>
            <li><a href="#" class="hover:text-golden-apricot transition-colors">Pricing</a></li>
            <li><a href="#" class="hover:text-golden-apricot transition-colors">Templates</a></li>
            <li><a href="#" class="hover:text-golden-apricot transition-colors">Examples</a></li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-medium mb-4 text-white">Resources</h4>
          <ul class="space-y-3 text-white">
            <li><a href="#" class="hover:text-golden-apricot transition-colors">Documentation</a></li>
            <li><a href="#" class="hover:text-golden-apricot transition-colors">Tutorials</a></li>
            <li><a href="#" class="hover:text-golden-apricot transition-colors">Blog</a></li>
            <li><a href="#" class="hover:text-golden-apricot transition-colors">Community</a></li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-medium mb-4 text-white">Company</h4>
          <ul class="space-y-3 text-white">
            <li><a href="#" class="hover:text-golden-apricot transition-colors">About</a></li>
            <li><a href="#" class="hover:text-golden-apricot transition-colors">Contact</a></li>
            <li><a href="#" class="hover:text-golden-apricot transition-colors">Privacy</a></li>
            <li><a href="#" class="hover:text-golden-apricot transition-colors">Terms</a></li>
          </ul>
        </div>
      </div>
      
      <div class="border-t border-white/20 mt-8 pt-8 text-center text-white">
        <p>&copy; 2025 Small Tales. All rights reserved.</p>
      </div>
    </div>
  </footer>
</div>