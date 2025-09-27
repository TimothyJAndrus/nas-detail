import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then(c => c.HomeComponent)
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services').then(c => c.ServicesComponent)
  },
  {
    path: 'booking',
    loadComponent: () => import('./pages/booking/booking').then(c => c.BookingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register').then(c => c.RegisterComponent)
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./pages/auth/callback/callback').then(c => c.AuthCallbackComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then(c => c.DashboardComponent)
    // Add auth guard here later
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile').then(c => c.ProfileComponent)
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];