import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface UserStats {
  totalBookings: number;
  lastServiceDate: string | null;
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit {
  activeTab = signal('personal');
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  profilePicture = signal('');
  showDeleteModal = signal(false);

  user = signal<any>(null);
  userStats = signal<UserStats>({ totalBookings: 0, lastServiceDate: null });

  profileForm: FormGroup;
  passwordForm: FormGroup;
  preferencesForm: FormGroup;

  tabs: Tab[] = [
    {
      id: 'personal',
      label: 'Personal Info',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    },
    {
      id: 'security',
      label: 'Security',
      icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
    },
    {
      id: 'account',
      label: 'Account',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.createProfileForm();
    this.passwordForm = this.createPasswordForm();
    this.preferencesForm = this.createPreferencesForm();
  }

  async ngOnInit(): Promise<void> {
    await this.loadUserProfile();
    await this.loadUserStats();
  }

  private createProfileForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/)]],
      address: ['']
    });
  }

  private createPasswordForm(): FormGroup {
    return this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: [
        '', 
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]/)
        ]
      ],
      confirmNewPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private createPreferencesForm(): FormGroup {
    return this.fb.group({
      emailBookingConfirmations: [true],
      emailPromotions: [false],
      emailReminders: [true],
      smsReminders: [false],
      smsUpdates: [false],
      shareDataForAnalytics: [false]
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmNewPassword = control.get('confirmNewPassword');
    
    if (!newPassword || !confirmNewPassword) {
      return null;
    }
    
    if (newPassword.value !== confirmNewPassword.value) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId);
    this.clearMessages();
  }

  getTabClasses(tabId: string): string {
    const baseClasses = 'w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors';
    const activeClasses = 'bg-primary-50 text-primary-700 border-primary-200';
    const inactiveClasses = 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
    
    return `${baseClasses} ${this.activeTab() === tabId ? activeClasses : inactiveClasses}`;
  }

  private async loadUserProfile(): Promise<void> {
    try {
      const currentUser = this.authService.getCurrentUser();
      
      if (currentUser) {
        // Convert User interface to display format
        const userData = {
          first_name: currentUser.firstName,
          last_name: currentUser.lastName,
          email: currentUser.email,
          phone: currentUser.phone || '',
          profile_picture: currentUser.profilePicture || '',
          created_at: currentUser.createdAt.toISOString(),
          preferences: currentUser.preferences
        };
        
        this.user.set(userData);
        this.populateProfileForm(userData);
        this.populatePreferencesForm(userData);
      } else {
        // User not authenticated, redirect to login
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.errorMessage.set('Failed to load user profile');
    }
  }

  private async loadUserStats(): Promise<void> {
    try {
      // This would normally fetch from a user stats service
      // For now, we'll use mock data
      this.userStats.set({
        totalBookings: 5,
        lastServiceDate: '2024-01-15'
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }

  private populateProfileForm(user: any): void {
    this.profileForm.patchValue({
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || ''
    });

    if (user.profile_picture) {
      this.profilePicture.set(user.profile_picture);
    }
  }

  private populatePreferencesForm(user: any): void {
    // This would normally come from user preferences in the database
    this.preferencesForm.patchValue({
      emailBookingConfirmations: user.email_booking_confirmations ?? true,
      emailPromotions: user.email_promotions ?? false,
      emailReminders: user.email_reminders ?? true,
      smsReminders: user.sms_reminders ?? false,
      smsUpdates: user.sms_updates ?? false,
      shareDataForAnalytics: user.share_data_for_analytics ?? false
    });
  }

  getInitials(): string {
    const user = this.user();
    if (!user) return '';
    
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage.set('File size must be less than 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please select a valid image file');
      return;
    }

    // Create a preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.profilePicture.set(e.target.result);
    };
    reader.readAsDataURL(file);

    // Here you would upload the file to your storage service
    this.uploadProfilePicture(file);
  }

  private async uploadProfilePicture(file: File): Promise<void> {
    try {
      this.loading.set(true);
      
      // This would normally upload to your storage service (Supabase Storage, etc.)
      // For now, we'll simulate an upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      this.successMessage.set('Profile picture updated successfully!');
      // this.toastr.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      this.errorMessage.set('Failed to update profile picture');
      // this.toastr.error('Failed to update profile picture');
    } finally {
      this.loading.set(false);
    }
  }

  async updateProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    try {
      const formData = this.profileForm.value;
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      };

      this.authService.updateProfile(updateData).subscribe({
        next: (updatedUser) => {
          const userData = {
            first_name: updatedUser.firstName,
            last_name: updatedUser.lastName,
            email: updatedUser.email,
            phone: updatedUser.phone || '',
            profile_picture: updatedUser.profilePicture || '',
            created_at: updatedUser.createdAt.toISOString(),
            preferences: updatedUser.preferences
          };
          
          this.user.set(userData);
          this.successMessage.set('Profile updated successfully!');
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          const errorMsg = error?.message || 'Failed to update profile';
          this.errorMessage.set(errorMsg);
          this.loading.set(false);
        }
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMsg = error?.message || 'Failed to update profile';
      this.errorMessage.set(errorMsg);
      this.loading.set(false);
    }
  }

  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    try {
      const formData = this.passwordForm.value;
      
      this.authService.changePassword(formData.currentPassword, formData.newPassword).subscribe({
        next: () => {
          this.successMessage.set('Password updated successfully!');
          this.passwordForm.reset();
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error changing password:', error);
          const errorMsg = error?.message || 'Failed to update password';
          this.errorMessage.set(errorMsg);
          this.loading.set(false);
        }
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      const errorMsg = error?.message || 'Failed to update password';
      this.errorMessage.set(errorMsg);
      this.loading.set(false);
    }
  }

  async updatePreferences(): Promise<void> {
    this.loading.set(true);
    this.clearMessages();

    try {
      const preferences = this.preferencesForm.value;
      
      // This would normally update preferences in the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.successMessage.set('Preferences updated successfully!');
      // this.toastr.success('Preferences updated successfully!');
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      const errorMsg = error?.message || 'Failed to update preferences';
      this.errorMessage.set(errorMsg);
      // this.toastr.error(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  confirmDeleteAccount(): void {
    this.showDeleteModal.set(true);
  }

  cancelDeleteAccount(): void {
    this.showDeleteModal.set(false);
  }

  async deleteAccount(): Promise<void> {
    this.loading.set(true);
    
    try {
      // await this.authService.deleteAccount();
      
      // Mock account deletion
      // this.toastr.success('Account deleted successfully');
      this.router.navigate(['/home']);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      const errorMsg = error?.message || 'Failed to delete account';
      this.errorMessage.set(errorMsg);
      // this.toastr.error(errorMsg);
    } finally {
      this.loading.set(false);
      this.showDeleteModal.set(false);
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }
}