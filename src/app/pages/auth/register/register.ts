import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { CreateUserRequest } from '../../../core/models/user.interface';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.createRegistrationForm();
  }

  private createRegistrationForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/)]],
      password: [
        '', 
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        ]
      ],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
      newsletter: [false]
    }, { validators: this.passwordMatchValidator });
  }

  // Custom validator for password confirmation
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    if (password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formData = this.registerForm.value;
    const userData: CreateUserRequest = {
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || undefined
    };

    this.authService.signUp(userData).subscribe({
      next: (response) => {
        this.successMessage.set(
          'Registration successful! Please check your email for verification instructions.'
        );
        
        // Reset form
        this.registerForm.reset();
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
        
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Registration error:', error);
        
        let errorMsg = 'Registration failed. Please try again.';
        
        if (error?.message) {
          if (error.message.includes('User already registered')) {
            errorMsg = 'An account with this email already exists. Please sign in instead.';
          } else if (error.message.includes('Invalid email')) {
            errorMsg = 'Please enter a valid email address.';
          } else if (error.message.includes('Password')) {
            errorMsg = 'Password does not meet requirements. Please check and try again.';
          } else {
            errorMsg = error.message;
          }
        }
        
        this.errorMessage.set(errorMsg);
        this.loading.set(false);
      }
    });
  }

  signUpWithGoogle(): void {
    if (this.loading()) return;
    
    this.loading.set(true);
    this.errorMessage.set('');
    
    this.authService.signInWithProvider('google').subscribe({
      next: () => {
        // OAuth redirect will handle the rest
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Google registration error:', error);
        this.errorMessage.set('Google registration failed. Please try again.');
        this.loading.set(false);
      }
    });
  }

  signUpWithFacebook(): void {
    if (this.loading()) return;
    
    this.loading.set(true);
    this.errorMessage.set('');
    
    this.authService.signInWithProvider('facebook').subscribe({
      next: () => {
        // OAuth redirect will handle the rest
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Facebook registration error:', error);
        this.errorMessage.set('Facebook registration failed. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // Helper methods for template
  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get email() { return this.registerForm.get('email'); }
  get phone() { return this.registerForm.get('phone'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get acceptTerms() { return this.registerForm.get('acceptTerms'); }
  get newsletter() { return this.registerForm.get('newsletter'); }
}
