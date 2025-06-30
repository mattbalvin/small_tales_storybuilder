<script lang="ts">
  import Button from '$lib/components/ui/button.svelte'
  import { Home } from 'lucide-svelte'
</script>

<svelte:head>
  <title>Privacy Policy - Small Tales</title>
</svelte:head>

<div class="min-h-screen bg-soft-buttercream">
  <!-- Header -->
  <header class="border-b border-periwinkle-blue/20 bg-coral-sunset/90 backdrop-blur-sm sticky top-0 z-50">
    <div class="container flex items-center justify-between py-4">
      <Button on:click={() => window.location.hash = '#/'} class="bg-golden-apricot text-white hover:bg-golden-apricot shadow-md hover:shadow-lg rounded-full px-6 hover:scale-105">
        <Home class="w-5 h-5 mr-2" />
        Back to Home
      </Button>
      
      <h1 class="text-2xl font-bold text-white">Privacy Policy</h1>
    </div>
  </header>
  
  <!-- Content -->
  <div class="container py-12">
    <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <h1 class="text-3xl font-bold mb-6 text-coral-sunset">Privacy Policy</h1>
      <p class="text-dusty-teal mb-4">Last Updated: June 28, 2025</p>

      <div class="prose prose-lg max-w-none text-dusty-teal">
        <h2>Introduction</h2>
        <p>
          Welcome to Small Tales ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our interactive storytelling platform.
        </p>
        <p>
          Please read this Privacy Policy carefully. By accessing or using Small Tales, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy.
        </p>

        <h2>Information We Collect</h2>
        <p>We may collect several types of information from and about users of our platform, including:</p>
        <h3>Personal Information</h3>
        <ul>
          <li><strong>Account Information:</strong> When you create an account, we collect your email address, name, and password.</li>
          <li><strong>Profile Information:</strong> You may choose to provide additional information such as a profile picture or biography.</li>
          <li><strong>Content:</strong> We collect and store the stories, images, audio, and other content you create or upload to our platform.</li>
        </ul>

        <h3>Usage Information</h3>
        <ul>
          <li><strong>Log Data:</strong> We automatically collect information that your browser sends whenever you visit our platform, including your IP address, browser type, access times, and pages viewed.</li>
          <li><strong>Device Information:</strong> We collect information about the device you use to access our platform, including hardware model, operating system, and unique device identifiers.</li>
          <li><strong>Analytics Data:</strong> We track how you interact with our platform, including which features you use and how long you spend on different pages.</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve our platform</li>
          <li>Process and complete transactions</li>
          <li>Send you technical notices, updates, security alerts, and support messages</li>
          <li>Respond to your comments, questions, and requests</li>
          <li>Develop new products and services</li>
          <li>Monitor and analyze trends, usage, and activities in connection with our platform</li>
          <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
          <li>Personalize your experience on our platform</li>
        </ul>

        <h2>How We Share Your Information</h2>
        <p>We may share your personal information in the following situations:</p>
        <ul>
          <li><strong>With Service Providers:</strong> We may share your information with third-party vendors, service providers, contractors, or agents who perform services for us.</li>
          <li><strong>With Collaborators:</strong> If you choose to collaborate on a story, your profile information and contributions will be visible to your collaborators.</li>
          <li><strong>For Legal Reasons:</strong> We may disclose your information where required to do so by law or in response to valid requests by public authorities.</li>
          <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with a merger, acquisition, reorganization, or sale of assets.</li>
          <li><strong>With Your Consent:</strong> We may share your information for any other purpose with your consent.</li>
        </ul>

        <h2>Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect the security of your personal information. However, please be aware that no method of transmission over the Internet or method of electronic storage is 100% secure.
        </p>

        <h2>Children's Privacy</h2>
        <p>
          Our platform is intended for use by children with adult supervision. We do not knowingly collect personally identifiable information from children under 13 without verifiable parental consent. If you are a parent or guardian and believe we have collected information from your child without your consent, please contact us so that we can remove the information.
        </p>

        <h2>Your Privacy Rights</h2>
        <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
        <ul>
          <li>The right to access your personal information</li>
          <li>The right to correct inaccurate or incomplete information</li>
          <li>The right to delete your personal information</li>
          <li>The right to restrict or object to our processing of your personal information</li>
          <li>The right to data portability</li>
          <li>The right to withdraw consent</li>
        </ul>
        <p>
          To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
        </p>

        <h2>Cookies and Tracking Technologies</h2>
        <p>
          We use cookies and similar tracking technologies to track activity on our platform and hold certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
        </p>

        <h2>Third-Party Services</h2>
        <p>
          Our platform may contain links to third-party websites or services that are not owned or controlled by us. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services.
        </p>

        <h2>Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
        </p>

        <!--h2>Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at:
        </p>
        <p>
          Email: privacy@smalltales.com<br>
          Address: 123 Storybook Lane, Imagination City, IC 12345
        </p-->
      </div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="bg-[#558A80] text-white py-8 px-4 mt-12">
    <div class="container text-center">
      <p>&copy; 2025 Small Tales. All rights reserved.</p>
      <p class="mt-2">
        <a href="#/" class="text-white hover:text-golden-apricot transition-colors">Home</a> | 
        <a href="#/about" class="text-white hover:text-golden-apricot transition-colors">About</a> | 
        <a href="#/privacy" class="text-white font-medium">Privacy Policy</a> | 
        <a href="#/terms" class="text-white hover:text-golden-apricot transition-colors">Terms and Conditions</a>
      </p>
    </div>
  </footer>
</div>