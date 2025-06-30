<script lang="ts">
  import Button from '$lib/components/ui/button.svelte'
  import { Home } from 'lucide-svelte'
  import { BookOpen, ArrowRight } from 'lucide-svelte'
</script>

<svelte:head>
  <title>About Us - Small Tales</title>
</svelte:head>

<div class="min-h-screen bg-soft-buttercream">
  <!-- Header -->
  <header class="border-b border-periwinkle-blue/20 bg-coral-sunset/90 backdrop-blur-sm sticky top-0 z-50">
    <div class="container flex items-center justify-between py-4">
      <Button on:click={() => window.location.hash = '#/'} class="bg-golden-apricot text-white hover:bg-golden-apricot shadow-md hover:shadow-lg rounded-full px-6 hover:scale-105">
        <Home class="w-5 h-5 mr-2" />
        Back to Home
      </Button>
      
      <h1 class="text-2xl font-bold text-white">About Us</h1>
    </div>
  </header>

  <!-- Content -->
  <div class="container py-12">
    <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <h1 class="text-3xl font-bold mb-6 text-coral-sunset">About Us</h1>

      <div class="prose prose-lg max-w-none text-dusty-teal">
        <p>
          Small Tales is on a mission to spark curiosity, creativity, and confidence in young learners through the power of storytelling and the possibilities of generative AI.
        </p>
        
        <p>
          We believe that foundational education should be fun, engaging, and future-ready. Our interactive storybooks and learning tools are designed to blend core educational fundamentals—like reading, problem solving, and early STEM concepts—with the emerging skills of the AI age, including creative prompting, digital exploration, and critical thinking.
        </p>
        
        <p>
          At Small Tales, we're passionate about building resources that not only teach children how to read and think—but also how to imagine, create, and express themselves using the latest technology. Our content encourages kids to play with ideas, experiment with storytelling, and grow their confidence as learners and makers in a world where AI will be a daily tool.
        </p>
        
        <p>
          Whether it's guiding a curious kitten through a math-filled adventure or helping young readers craft their own AI-assisted stories, we're here to help a new generation learn how to learn—and love it.
        </p>
        
        <div class="mt-12 bg-periwinkle-blue/10 p-6 rounded-xl border border-periwinkle-blue/20">
          <h2 class="text-2xl font-bold text-coral-sunset mb-4">Our Vision</h2>
          <p>
            We envision a world where every child has access to engaging, interactive stories that spark their imagination and foster a lifelong love of learning. Through our platform, we aim to:
          </p>
          <ul class="mt-4 space-y-2">
            <li class="flex items-start">
              <span class="text-golden-apricot text-xl mr-2">•</span>
              <span>Make reading an interactive, multi-sensory experience</span>
            </li>
            <li class="flex items-start">
              <span class="text-golden-apricot text-xl mr-2">•</span>
              <span>Empower educators and parents with tools to create custom learning materials</span>
            </li>
            <li class="flex items-start">
              <span class="text-golden-apricot text-xl mr-2">•</span>
              <span>Bridge traditional storytelling with emerging technologies</span>
            </li>
            <li class="flex items-start">
              <span class="text-golden-apricot text-xl mr-2">•</span>
              <span>Prepare children for a future where creativity and technology intersect</span>
            </li>
          </ul>
        </div>
        
        <div class="mt-12 flex flex-col md:flex-row gap-6">
          <div class="flex-1 bg-dusty-teal/10 p-6 rounded-xl border border-dusty-teal/20">
            <h3 class="text-xl font-bold text-dusty-teal mb-3">For Educators</h3>
            <p class="mb-4">
              Our platform provides teachers with customizable story templates, curriculum-aligned content, and analytics to track student engagement and comprehension.
            </p>
            <!--Button variant="outline" class="accent-element">Learn More</Button-->
          </div>
          
          <div class="flex-1 bg-coral-sunset/10 p-6 rounded-xl border border-coral-sunset/20">
            <h3 class="text-xl font-bold text-coral-sunset mb-3">For Families</h3>
            <p class="mb-4">
              Create personalized stories featuring your child's name, interests, and adventures. Build a library of meaningful tales that grow with your family.
            </p>
            <!--Button variant="outline" class="accent-element">Learn More</Button-->
          </div>
        </div>
        
        <div class="mt-12 text-center">
          <h2 class="text-2xl font-bold text-coral-sunset mb-6">Join Us on This Adventure</h2>
          <p class="mb-8">
            We're just getting started, and we'd love for you to be part of our story. Create an account today and begin crafting magical tales that inspire, educate, and delight.
          </p>
          <Button on:click={() => window.location.hash = '#/auth'} class="featured-item px-8 py-3 text-lg">
            <BookOpen class="w-5 h-5 mr-2" />
            Start Creating
            <ArrowRight class="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="bg-[#558A80] text-white py-8 px-4 mt-12">
    <div class="container text-center">
      <p>&copy; 2025 Small Tales. All rights reserved.</p>
      <p class="mt-2">
        <a href="#/" class="text-white hover:text-golden-apricot transition-colors">Home</a> | 
        <a href="#/about" class="text-white font-medium">About</a> | 
        <a href="#/privacy" class="text-white hover:text-golden-apricot transition-colors">Privacy Policy</a> | 
        <a href="#/terms" class="text-white hover:text-golden-apricot transition-colors">Terms and Conditions</a>
      </p>
    </div>
  </footer>
</div>