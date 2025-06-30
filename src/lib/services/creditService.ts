import { supabase } from '../config/supabase'
import { authService } from '../stores/auth'

export interface CreditPackage {
  id: string
  name: string
  description: string
  credits: number
  price: number
  discountPercent: number
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    description: 'Perfect for trying out AI features',
    credits: 50,
    price: 5,
    discountPercent: 0
  },
  {
    id: 'standard',
    name: 'Standard Pack',
    description: 'Most popular option for regular creators',
    credits: 250,
    price: 20,
    discountPercent: 0
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    description: 'Best value for power users',
    credits: 750,
    price: 50,
    discountPercent: 0
  }
]

export interface SubscriptionTier {
  id: 'free' | 'creator' | 'creator_pro'
  name: string
  description: string
  price: number
  monthlyCredits: number
  discountPercent: number
  features: string[]
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    monthlyCredits: 0,
    discountPercent: 0,
    features: [
      'Create and share stories',
      'Basic editor features',
      '50 Creator Credits for new users',
      'Pay-as-you-go Creator Credit packs',
      'Up to 5 stories',
      'Community support'
    ]
  },
  {
    id: 'creator',
    name: 'Creator',
    description: 'For regular storytellers',
    price: 10,
    monthlyCredits: 100,
    discountPercent: 10,
    features: [
      'Everything in Free plan',
      '100 Creator Credits per month',
      '10% off Creator Credit packs',
      'Unlimited stories',
      'Advanced editor features',
      'Priority support'
    ]
  },
  {
    id: 'creator_pro',
    name: 'Creator Pro',
    description: 'For serious storytellers',
    price: 20,
    monthlyCredits: 250,
    discountPercent: 15,
    features: [
      'Everything in Creator plan',
      '250 Creator Credits per month',
      '15% off Creator Credit packs',
      'Early access to new features',
      'Premium story templates',
      'Dedicated support'
    ]
  }
]

// Credit costs for different AI operations
export const CREDIT_COSTS = {
  IMAGE_GENERATION: {
    standard: 5,
    high_quality: 10
  },
  AUDIO_NARRATION: {
    // Per 100 words
    standard: 1,
    high_quality: 2
  },
  SOUND_EFFECTS: {
    standard: 2
  }
}

export const creditService = {
  /**
   * Get available credit packages with applied discounts based on user's subscription
   */
  getAvailableCreditPackages(): CreditPackage[] {
    const profile = authService.getCurrentProfile()
    if (!profile) return CREDIT_PACKAGES
    
    const userTier = profile.subscription_tier || 'free'
    const discountPercent = SUBSCRIPTION_TIERS.find(tier => tier.id === userTier)?.discountPercent || 0
    
    if (discountPercent === 0) return CREDIT_PACKAGES
    
    return CREDIT_PACKAGES.map(pkg => ({
      ...pkg,
      discountPercent
    }))
  },
  
  /**
   * Calculate the final price of a credit package after applying subscription discount
   */
  calculateDiscountedPrice(packageId: string): number {
    const profile = authService.getCurrentProfile()
    if (!profile) return 0
    
    const creditPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId)
    if (!creditPackage) return 0
    
    const userTier = profile.subscription_tier || 'free'
    const discountPercent = SUBSCRIPTION_TIERS.find(tier => tier.id === userTier)?.discountPercent || 0
    
    if (discountPercent === 0) return creditPackage.price
    
    return creditPackage.price * (1 - discountPercent / 100)
  },
  
  /**
   * Check if user has enough credits for an operation
   */
  async hasEnoughCredits(amount: number): Promise<boolean> {
    const credits = await authService.getCredits()
    return credits >= amount
  },
  
  /**
   * Use credits for an AI operation
   */
  async useCredits(amount: number, description: string): Promise<boolean> {
    return await authService.useCredits(amount, description)
  },
  
  /**
   * Purchase a credit package
   */
  async purchaseCreditPackage(packageId: string): Promise<boolean> {
    const creditPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId)
    if (!creditPackage) return false
    
    // In a real implementation, this would integrate with a payment processor
    // For now, we'll just add the credits directly
    
    const description = `Purchased ${creditPackage.name} (${creditPackage.credits} credits)`
    return await authService.addCredits(creditPackage.credits, description, 'purchase')
  },
  
  /**
   * Subscribe to a paid tier
   */
  async subscribe(tierId: 'creator' | 'creator_pro'): Promise<boolean> {
    const tier = SUBSCRIPTION_TIERS.find(t => t.id === tierId)
    if (!tier) return false
    
    // In a real implementation, this would integrate with a payment processor
    // For now, we'll just update the subscription directly
    
    return await authService.updateSubscription(tierId)
  },
  
  /**
   * Calculate credit cost for image generation
   */
  calculateImageGenerationCost(quality: 'standard' | 'high_quality' = 'standard'): number {
    return CREDIT_COSTS.IMAGE_GENERATION[quality]
  },
  
  /**
   * Calculate credit cost for audio narration
   */
  calculateNarrationCost(wordCount: number, quality: 'standard' | 'high_quality' = 'standard'): number {
    const costPer100Words = CREDIT_COSTS.AUDIO_NARRATION[quality]
    return Math.ceil(wordCount / 100) * costPer100Words
  },
  
  /**
   * Calculate credit cost for sound effect generation
   */
  calculateSoundEffectCost(): number {
    return CREDIT_COSTS.SOUND_EFFECTS.standard
  }
}