<script lang="ts">
  import Button from '$lib/components/ui/button.svelte'
  import { Home } from 'lucide-svelte'
</script>

<svelte:head>
  <title>Terms and Conditions - Small Tales</title>
</svelte:head>

<div class="min-h-screen bg-soft-buttercream">
  <!-- Header -->
  <header class="border-b border-periwinkle-blue/20 bg-coral-sunset/90 backdrop-blur-sm sticky top-0 z-50">
    <div class="container flex items-center justify-between py-4">
      <Button on:click={() => window.location.hash = '#/'} class="bg-golden-apricot text-white hover:bg-golden-apricot shadow-md hover:shadow-lg rounded-full px-6 hover:scale-105">
        <Home class="w-5 h-5 mr-2" />
        Back to Home
      </Button>
      
      <h1 class="text-2xl font-bold text-white">Terms and Conditions</h1>
    </div>
  </header>

  <!-- Content -->
  <div class="container py-12">
    <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <h1 class="text-3xl font-bold mb-6 text-coral-sunset">Terms and Conditions</h1>
      <p class="text-dusty-teal mb-4">Last Updated: June 28, 2025</p>

      <div class="prose prose-lg max-w-none text-dusty-teal">
        <h2>1. Introduction</h2>
        <p>
          Welcome to Small Tales ("we," "our," or "us"). These Terms and Conditions govern your access to and use of the Small Tales platform, including any content, functionality, and services offered on or through our website and mobile applications (collectively, the "Service").
        </p>
        <p>
          Please read these Terms and Conditions carefully before using our Service. By accessing or using the Service, you agree to be bound by these Terms and Conditions. If you do not agree to all the terms and conditions, then you may not access the Service.
        </p>

        <h2>2. User Accounts</h2>
        <p>
          When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
        </p>
        <p>
          You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
        </p>

        <h2>3. User Content</h2>
        <h3>3.1 Content Ownership</h3>
        <p>
          <strong>You retain all rights to the content you create using our Service.</strong> This includes stories, images, audio recordings, and any other materials you create, upload, or generate through the Small Tales platform ("User Content").
        </p>
        <p>
          By using our Service to create User Content, you grant us a non-exclusive, royalty-free, worldwide license to use, store, display, reproduce, and distribute your User Content solely for the purpose of providing and improving the Service. This license exists only for as long as you choose to continue to include such User Content on the Service and will terminate when you remove your User Content from the Service.
        </p>

        <h3>3.2 Shared Content</h3>
        <p>
          When you choose to share your User Content with others through our Service (for example, by sharing a story publicly or with specific users), you grant us the right to make that User Content available to the designated recipients and to provide the necessary functionality to allow them to view, play, or interact with your shared User Content.
        </p>
        <p>
          You understand that once you share User Content, those who can access it may copy, download, or reshare it in accordance with these Terms and our Privacy Policy. We are not responsible for what others do with your User Content once you share it.
        </p>

        <h3>3.3 Content Restrictions</h3>
        <p>
          You agree not to create, upload, or share User Content that:
        </p>
        <ul>
          <li>Violates the intellectual property rights of others</li>
          <li>Contains illegal, obscene, defamatory, threatening, intimidating, harassing, or offensive material</li>
          <li>Contains viruses, malware, or other harmful code</li>
          <li>Violates any applicable law or regulation</li>
          <li>Impersonates any person or entity or falsely states or misrepresents your affiliation with a person or entity</li>
        </ul>
        <p>
          We reserve the right, but not the obligation, to monitor, edit, or remove any User Content that we determine, in our sole discretion, violates these Terms or is otherwise objectionable.
        </p>

        <h2>4. Intellectual Property</h2>
        <h3>4.1 Service Content</h3>
        <p>
          The Service and its original content (excluding User Content), features, and functionality are and will remain the exclusive property of Small Tales and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Small Tales.
        </p>

        <h3>4.2 Feedback</h3>
        <p>
          If you provide us with any feedback or suggestions regarding the Service ("Feedback"), you hereby assign to us all rights in such Feedback and agree that we shall have the right to use and fully exploit such Feedback in any manner we deem appropriate. We will treat any Feedback you provide to us as non-confidential and non-proprietary.
        </p>

        <h2>5. Subscription and Payments</h2>
        <p>
          Some aspects of the Service may be provided for a fee. You will be required to select a payment plan and provide accurate information regarding your payment method. You agree to pay all fees specified at the time of purchase.
        </p>
        <p>
          Payments are non-refundable except as required by law or as explicitly stated in our refund policy. We reserve the right to change our prices at any time. If we change our prices, we will provide notice of the change on the Site or by email, at our option.
        </p>

        <h2>6. Third-Party Services</h2>
        <p>
          Our Service may contain links to third-party websites or services that are not owned or controlled by Small Tales. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. You further acknowledge and agree that Small Tales shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods, or services available on or through any such websites or services.
        </p>

        <h2>7. Termination</h2>
        <p>
          We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
        </p>
        <p>
          All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          In no event shall Small Tales, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
        </p>
        <ul>
          <li>Your access to or use of or inability to access or use the Service;</li>
          <li>Any conduct or content of any third party on the Service;</li>
          <li>Any content obtained from the Service; and</li>
          <li>Unauthorized access, use, or alteration of your transmissions or content</li>
        </ul>

        <h2>9. Disclaimer</h2>
        <p>
          Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.
        </p>

        <h2>10. Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
        </p>

        <h2>11. Changes to Terms</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
        </p>
        <p>
          By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.
        </p>

        <h2>12. Children's Use</h2>
        <p>
          Small Tales is designed to be used by children with adult supervision. We encourage parents and guardians to monitor their children's use of our Service. By allowing a child to use our Service, the parent or guardian agrees to these Terms on behalf of the child.
        </p>

        <!--h2>13. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at:
        </p>
        <p>
          Email: terms@smalltales.com<br>
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
        <a href="#/privacy" class="text-white hover:text-golden-apricot transition-colors">Privacy Policy</a> | 
        <a href="#/terms" class="text-white hover:text-golden-apricot transition-colors">Terms and Conditions</a>
      </p>
    </div>
  </footer>
</div>