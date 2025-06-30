export const stripeConfig = {
  products: [
    {
      id: 'prod_Sax54Ptws8KLFY',
      priceId: 'price_1RflB1Qwl4gRGLWNSxEmcKOT',
      name: 'Creator Credits Pro Pack',
      description: '750 Creator Credits to use in Small Tales Studio',
      price: 50.00,
      mode: 'payment',
      credits: 750
    },
    {
      id: 'prod_Sax47LdxNKTyuF',
      priceId: 'price_1RflAFQwl4gRGLWNzW3rzfNf',
      name: 'Creator Credits Standard Pack',
      description: '250 Creator Credits to use in Small Tales Studio',
      price: 20.00,
      mode: 'payment',
      credits: 250
    },
    {
      id: 'prod_Sax3HCIoTYhVwE',
      priceId: 'price_1Rfl96Qwl4gRGLWNExV4tJ4z',
      name: 'Creator Credits Starter Pack',
      description: '50 Creator Credits to use in Small Tales Studio',
      price: 5.00,
      mode: 'payment',
      credits: 50
    },
    {
      id: 'prod_Sax1KUGJbCUg66',
      priceId: 'price_1Rfl7SQwl4gRGLWNDZxv3aGx',
      name: 'Small Tales Studio Pro Subscription',
      description: 'Create children\'s stories with Small Tales Studio Pro.',
      price: 20.00,
      mode: 'subscription',
      tier: 'creator_pro',
      monthlyCredits: 250
    },
    {
      id: 'prod_Sawk5MevvjaOoA',
      priceId: 'price_1RfkqYQwl4gRGLWNMrWND2bv',
      name: 'Small Tales Studio Subscription',
      description: 'Create children\'s stories with Small Tales Studio.',
      price: 10.00,
      mode: 'subscription',
      tier: 'creator',
      monthlyCredits: 100
    }
  ]
}