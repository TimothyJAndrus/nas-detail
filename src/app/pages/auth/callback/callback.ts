import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 class="mt-6 text-center text-2xl font-bold text-gray-900">
            Completing sign-in...
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Please wait while we complete your authentication.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class AuthCallbackComponent implements OnInit {

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    try {
      // The AuthService should automatically handle the session
      // when Supabase detects the auth callback

      // Wait a moment for the auth state to update
      setTimeout(() => {
        if (this.authService.isAuthenticated$()) {
          // User is authenticated, redirect to dashboard
          this.router.navigate(['/dashboard']);
        } else {
          // Authentication failed, redirect to login with error
          this.router.navigate(['/login'], {
            queryParams: { error: 'Authentication failed. Please try again.' }
          });
        }
      }, 2000);
    } catch (error) {
      console.error('Auth callback error:', error);
      this.router.navigate(['/login'], {
        queryParams: { error: 'Authentication failed. Please try again.' }
      });
    }
  }
}
