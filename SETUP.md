# NAS Detail Website Setup Guide

This guide will help you set up the NAS Detail website with proper database and authentication integration.

## Prerequisites

1. Node.js 18+ and npm
2. Angular CLI 19+
3. Supabase account (free tier available)

## Environment Setup

### 1. Supabase Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. Choose your organization and set project name: `nas-detail`
3. Set a strong database password
4. Choose a region close to your users

### 2. Get Supabase Credentials

After project creation, get these from your Supabase dashboard:

1. Go to Settings → API
2. Copy your:
   - Project URL
   - Anon Key
   - Service Role Key (keep secret!)

### 3. Update Environment Files

Replace the placeholder values in:

**`src/environments/environment.development.ts`**

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'https://your-project-id.supabase.co',
    anonKey: 'your-anon-key-here',
    serviceRoleKey: 'your-service-role-key-here'
  },
  stripe: {
    publishableKey: 'pk_test_YOUR_STRIPE_TEST_KEY'
  },
  api: {
    baseUrl: 'http://localhost:3000/api'
  },
  features: {
    enableAnalytics: false,
    enableErrorReporting: true,
    enableRealtime: true
  }
};
```

**`src/environments/environment.ts`** (Production)

```typescript
export const environment = {
  production: true,
  supabase: {
    url: 'https://your-project-id.supabase.co',
    anonKey: 'your-production-anon-key',
    serviceRoleKey: 'your-production-service-role-key'
  },
  stripe: {
    publishableKey: 'pk_live_YOUR_STRIPE_LIVE_KEY'
  },
  api: {
    baseUrl: 'https://api.nasdetail.com'
  },
  features: {
    enableAnalytics: true,
    enableErrorReporting: true,
    enableRealtime: true
  }
};
```

### 4. Database Schema Setup

1. In your Supabase dashboard, go to SQL Editor
2. Copy and paste the contents from `database/schema.sql`
3. Click "Run" to create all tables and types

### 5. Enable Authentication

1. In Supabase, go to Authentication → Settings
2. Enable email authentication
3. For social login, configure:
   - **Google**: Add your Google OAuth credentials
   - **Facebook**: Add your Facebook App credentials

### 6. Row Level Security (Optional but Recommended)

1. In SQL Editor, run the contents from `database/security-policies.sql`
2. This sets up proper data access controls

### 7. Seed Data (Optional)

For development and testing:

1. In SQL Editor, run `database/seed-data.sql`
2. This populates sample services and promotions

## Development

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm start
# or
ng serve
```

The application will be available at `http://localhost:4200`

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Serve SSR Build

```bash
npm run serve:ssr:nas-detail-website
```

## Features

### Authentication

- Email/password registration and login
- Google OAuth integration
- Facebook OAuth integration
- Password reset functionality
- Email verification

### User Management

- Profile management
- Password changes
- Preference settings
- Account deletion

### Booking System

- Service catalog browsing
- Multi-step booking process
- Vehicle management
- Time slot selection
- Payment integration

### Database

- PostgreSQL with Supabase
- Real-time subscriptions
- Row Level Security
- Automated backups

## Troubleshooting

### Common Issues

1. **Supabase Connection Errors**
   - Verify your URL and keys are correct
   - Check network connectivity
   - Ensure no typos in environment files

2. **Authentication Issues**
   - Verify OAuth provider setup
   - Check redirect URLs are configured
   - Ensure email confirmation is enabled

3. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Update Angular CLI: `npm install -g @angular/cli@latest`
   - Check TypeScript version compatibility

### Social Login Setup

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret to Supabase

#### Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app
3. Add Facebook Login product
4. Configure Valid OAuth Redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
5. Copy App ID and Secret to Supabase

## Support

For issues and questions:

- Check the [Supabase Documentation](https://supabase.com/docs)
- Review [Angular Documentation](https://angular.dev)
- Create an issue in the project repository
