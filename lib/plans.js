export const billingPlans = [
  {
    id: 'free',
    name: 'Free Trial',
    price: '$0',
    interval: 'forever',
    limit: 5,
    checkoutPriceIdEnv: null,
    description: 'Try the product with daily generation credits.',
    features: ['5 generations per day', '8 market languages', 'Image URL analysis'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$19',
    interval: 'month',
    limit: 120,
    checkoutPriceIdEnv: 'STRIPE_GROWTH_PRICE_ID',
    description: 'For solo cross-border sellers and small stores.',
    features: ['120 generations per month', 'Cloud copy library', 'SEO keyword input'],
  },
  {
    id: 'byok',
    name: 'BYOK Pro',
    price: '$9',
    interval: 'month',
    limit: 999,
    checkoutPriceIdEnv: 'STRIPE_BYOK_PRICE_ID',
    description: 'Let customers bring their own OpenAI API key.',
    features: ['Bring your own key', 'Lower platform cost', 'Heavy usage ready'],
  },
  {
    id: 'agency',
    name: 'Agency',
    price: '$49',
    interval: 'month',
    limit: 800,
    checkoutPriceIdEnv: 'STRIPE_AGENCY_PRICE_ID',
    description: 'For teams managing multiple products and markets.',
    features: ['800 generations per month', 'Team-ready workflow', 'Priority roadmap'],
  },
];

export function getBillingPlan(planId) {
  return billingPlans.find((plan) => plan.id === planId) || billingPlans[0];
}
