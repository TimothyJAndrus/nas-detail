export const environment = {
  production: true,
  supabase: {
    url: 'YOUR_PRODUCTION_SUPABASE_URL', // Replace with your production Supabase URL
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmamJzemlocmhna2Fwb3JrenJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MjgyMDcsImV4cCI6MjA3NDAwNDIwN30.bFE7PQmXnwqP-1h2J1gdmOdSM729vSWnrQDjV2WxqC0', // Replace with your production Supabase anon key
    serviceRoleKey: 'YOUR_PROeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmamJzemlocmhna2Fwb3JrenJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQyODIwNywiZXhwIjoyMDc0MDA0MjA3fQ.aLGA3MR6Y4zw6QNsiuoQC54WHnTuX2yVp4LJaqHIGmIDUCTION_SERVICE_ROLE_KEY' // Replace with production service role key
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
