import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/user.interface';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  loginForm: FormGroup;
  forgotPasswordForm: FormGroup;

  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showForgotPassword = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(show => !show);
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.loading()) {
      this.loading.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      const credentials: LoginRequest = {
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value
      };

      this.authService.signIn(credentials).subscribe({
        next: (response) => {
          this.loading.set(false);
          this.successMessage.set('Login successful! Redirecting...');

          // Redirect to dashboard or intended page
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(error.message || 'Login failed. Please try again.');
        }
      });
    }
  }

  onForgotPassword(): void {
    if (this.forgotPasswordForm.valid && !this.loading()) {
      this.loading.set(true);
      this.errorMessage.set('');

      const email = this.forgotPasswordForm.get('email')?.value;

      this.authService.resetPassword(email).subscribe({
        next: () => {
          this.loading.set(false);
          this.successMessage.set('Password reset link sent to your email!');
          this.showForgotPassword = false;
          this.forgotPasswordForm.reset();
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(error.message || 'Failed to send reset email.');
        }
      });
    }
  }

  signInWithGoogle(): void {
    if (!this.loading()) {
      this.loading.set(true);
      this.errorMessage.set('');

      this.authService.signInWithProvider('google').subscribe({
        next: () => {
          // OAuth redirect will handle the rest
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set('Google sign-in failed. Please try again.');
        }
      });
    }
  }

  signInWithFacebook(): void {
    if (!this.loading()) {
      this.loading.set(true);
      this.errorMessage.set('');

      this.authService.signInWithProvider('facebook').subscribe({
        next: () => {
          // OAuth redirect will handle the rest
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set('Facebook sign-in failed. Please try again.');
        }
      });
    }
  }
}
