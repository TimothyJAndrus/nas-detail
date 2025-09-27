export const environment = {
  production: false,
  supabase: {
    url: 'https://placeholder.supabase.co', // Replace with your Supabase URL
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUwMDAwMDAsImV4cCI6MTk2MDM2MDAwMH0.placeholder', // Replace with your Supabase anon key
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0NTAwMDAwMCwiZXhwIjoxOTYwMzYwMDAwfQ.placeholder' // Replace with service role key (server-side only)
  },
  stripe: {
    publishableKey: 'pk_test_51placeholder123456789012345678901234567890123456789012345678901234567890' // Replace with your Stripe test key
  },
  api: {
    baseUrl: 'http://localhost:3000/api' // Your backend API URL
  },
  features: {
    enableAnalytics: false,
    enableErrorReporting: true,
    enableRealtime: true
  }
};
