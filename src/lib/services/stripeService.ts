import { supabase } from '../config/supabase'
import { stripeConfig } from '../stripe-config'

export const stripeService = {
  /**
   * Create a checkout session for a product
   * @param priceId The Stripe price ID
   * @param mode The checkout mode ('payment' or 'subscription')
   * @returns The checkout session URL
   */
  async createCheckoutSession(priceId: string, mode: 'payment' | 'subscription'): Promise<string> {
    try {
      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('User must be authenticated to create a checkout session')
      }

      // Prepare success and cancel URLs
      const origin = window.location.origin
      const successUrl = `${origin}/#/checkout/success?session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${origin}/#/checkout/canceled`

      // Call the Supabase Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: successUrl,
          cancel_url: cancelUrl,
          mode
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.url) {
        throw new Error('No checkout URL returned from server')
      }

      return result.url
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      throw error
    }
  },

  /**
   * Get the product details by price ID
   * @param priceId The Stripe price ID
   * @returns The product details or null if not found
   */
  getProductByPriceId(priceId: string) {
    return stripeConfig.products.find(product => product.priceId === priceId) || null
  },

  /**
   * Get all subscription products
   * @returns Array of subscription products
   */
  getSubscriptionProducts() {
    return stripeConfig.products.filter(product => product.mode === 'subscription')
  },

  /**
   * Get all one-time payment products
   * @returns Array of one-time payment products
   */
  getOneTimeProducts() {
    return stripeConfig.products.filter(product => product.mode === 'payment')
  },

  /**
   * Get user's subscription status
   * @returns The subscription status or null if not found
   */
  async getUserSubscription() {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle()

      if (error) throw error
      
      return data
    } catch (error) {
      console.error('Failed to get user subscription:', error)
      return null
    }
  },

  /**
   * Get user's order history
   * @returns Array of orders
   */
  async getUserOrders() {
    try {
      const { data, error } = await supabase
        .from('stripe_user_orders')
        .select('*')
        .order('order_date', { ascending: false })

      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('Failed to get user orders:', error)
      return []
    }
  }
}