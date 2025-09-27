export const environment = {
  production: true,
  supabase: {
    url: 'YOUR_PRODUCTION_SUPABASE_URL', // Replace with your production Supabase URL
    anonKey: 'YOUR_PRODUCTION_SUPABASE_ANON_KEY', // Replace with your production Supabase anon key
    serviceRoleKey: 'YOUR_PRODUCTION_SERVICE_ROLE_KEY' // Replace with production service role key
  },
  stripe: {
    publishableKey: 'pk_live_YOUR_STRIPE_LIVE_KEY' // Replace with your Stripe live key
  },
  api: {
    baseUrl: 'https://api.nasdetail.com' // Your production API URL
  },
  features: {
    enableAnalytics: true,
    enableErrorReporting: true,
    enableRealtime: true
  }
};