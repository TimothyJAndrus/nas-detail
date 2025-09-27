# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is "nas-detail-website", an Angular 20.x application for a car detailing service business. The application uses standalone components, Angular SSR (Server-Side Rendering), and integrates with Supabase for backend services and Stripe for payments.

## Key Technologies

- **Angular 20.x** with standalone components (no NgModules)
- **TypeScript 5.9** with strict type checking
- **TailwindCSS** for styling with custom forms and typography plugins
- **NgRx** for state management
- **Supabase** for authentication and database
- **Stripe** for payment processing
- **Angular Material** and **Angular CDK** for UI components
- **SCSS** for component-specific styling

## Common Development Commands

### Development Server
```bash
npm start                    # Start development server on localhost:4200
ng serve                     # Alternative command
```

### Building
```bash
npm run build               # Production build with SSR
ng build                    # Alternative command
npm run watch               # Development build with file watching
```

### Testing
```bash
npm test                    # Run unit tests with Karma
ng test                     # Alternative command
ng test --watch=false       # Run tests once without watching
```

### SSR Server
```bash
npm run serve:ssr:nas-detail-website    # Serve the SSR build
```

### Code Generation
```bash
ng generate component components/example --style=scss
ng generate service services/example
ng generate guard guards/auth
```

## Architecture Overview

### Application Structure

The application follows Angular best practices with a feature-based structure:

- **`src/app/core/`** - Core services and models shared across the application
  - `services/` - Authentication, booking core services
  - `models/` - TypeScript interfaces for users and services
- **`src/app/pages/`** - Lazy-loaded page components (home, services, booking, dashboard, profile)
- **`src/app/components/`** - Reusable UI components (booking, payment)
- **`src/app/shared/`** - Shared components (header, footer)
- **`src/app/services/`** - Business logic services (booking API, validation, confirmation)
- **`src/environments/`** - Environment-specific configuration

### Routing Strategy

The application uses lazy-loaded routes for optimal performance:
- All page components are loaded dynamically using `loadComponent()`
- Default redirect from root to `/home`
- Wildcard route redirects to home page

### State Management

- **NgRx** for global application state
- **Angular Signals** for local component state (following modern Angular patterns)
- Authentication state managed through `AuthService` with BehaviorSubject and signals

### Key Services

- **`AuthService`** - Handles user authentication, registration, and session management
- **`BookingService`** - Manages car detailing service bookings and service catalog
- **`PaymentService`** - Integrates with Stripe for payment processing

## Development Guidelines

### Component Standards
- Use **standalone components** (default in Angular 19+)
- Set `changeDetection: ChangeDetectionStrategy.OnPush` for performance
- Use `input()` and `output()` functions instead of decorators
- Prefer `computed()` for derived state
- Use native control flow (`@if`, `@for`, `@switch`) instead of structural directives

### TypeScript Standards
- Strict type checking enabled
- Avoid `any` type; use `unknown` when uncertain
- Use type inference when obvious

### Styling Standards
- TailwindCSS for utility-first styling
- SCSS for component-specific styles
- Prettier configuration with 100 character line width
- Use `class` bindings instead of `ngClass`
- Use `style` bindings instead of `ngStyle`

### Service Architecture
- Use `inject()` function instead of constructor injection
- Services are singletons with `providedIn: 'root'`
- Follow single responsibility principle

## Environment Configuration

The application uses environment files for configuration:
- Development environment includes Supabase development keys
- Production environment requires actual API keys for Supabase and Stripe
- Feature flags for analytics, error reporting, and realtime features

## Key Dependencies

### Core Angular
- Angular 20.x with SSR support
- Zoneless change detection enabled
- Client hydration with event replay

### UI/UX
- Angular Material for UI components
- TailwindCSS for utility styling
- Angular Google Maps integration
- Angular YouTube Player

### Backend Integration
- Supabase client for database and auth
- Stripe.js and ngx-stripe for payments
- Auth0 JWT for token handling

### Development Tools
- Karma and Jasmine for unit testing
- TypeScript with strict configuration
- Prettier for code formatting

## Testing Strategy

The application includes unit tests for core services:
- `auth.service.spec.ts` - Authentication service tests
- `booking.service.spec.ts` - Booking service tests  
- `payment.service.spec.ts` - Payment service tests
- Component tests for major pages and shared components

Run tests with `npm test` and use `--watch=false` for CI/CD pipelines.

## Business Domain

This application serves a car detailing business with:
- Service catalog management (exterior, interior, premium packages)
- Customer booking system with time slot management
- User authentication and profile management
- Payment processing for services
- Dashboard for customer booking history

The service categories include:
- **Exterior** services (washing, polishing, waxing)
- **Interior** services (deep cleaning, leather treatment)
- **Premium** packages (full-service details)