import { Injectable, signal } from '@angular/core';
import { Observable, from, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { User, CreateUserRequest, LoginRequest, AuthResponse, UserRole } from '../models/user.interface';
import { supabase, handleSupabaseError } from '../config/supabase.config';
import { Session } from '@supabase/supabase-js';

// Define types for our database operations
interface DbUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  profile_picture_url: string | null;
  role: 'client' | 'admin' | 'technician';
  is_verified: boolean;
  preferences: any;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  private readonly sessionSubject = new BehaviorSubject<Session | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public session$ = this.sessionSubject.asObservable();
  public isAuthenticated$ = signal(false);
  public userRole$ = signal('client' as UserRole);

  constructor() { }

  public init(): void {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await this.setSession(session);
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await this.setSession(session);
        } else if (event === 'SIGNED_OUT') {
          this.clearSession();
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  private async setSession(session: Session): Promise<void> {
    this.sessionSubject.next(session);

    try {
      // Get user profile from database
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // If user doesn't exist in our database, create them
        await this.createUserProfile(session.user);
        return;
      }

      if (userProfile) {
        const user: User = this.mapDbUserToUser(userProfile);
        this.currentUserSubject.next(user);
        this.isAuthenticated$.set(true);
        this.userRole$.set(user.role);

        // Update last login
        const updateData = { last_login_at: new Date().toISOString() };
        await supabase
          .from('users')
          .update(updateData)
          .eq('id', session.user.id);
      }
    } catch (error) {
      console.error('Error setting session:', error);
    }
  }

  private async createUserProfile(authUser: any): Promise<void> {
    try {
      const userInsert = {
        id: authUser.id,
        email: authUser.email,
        first_name: authUser.user_metadata?.first_name || '',
        last_name: authUser.user_metadata?.last_name || '',
        phone: authUser.user_metadata?.phone || null,
        role: 'client' as const,
        is_verified: authUser.email_confirmed_at != null,
        profile_picture_url: authUser.user_metadata?.avatar_url || null
      };

      const { error: profileError } = await supabase
        .from('users')
        .insert(userInsert);

      if (profileError) throw profileError;

      // Create user object and set in state
      const user = this.mapDbUserToUser({
        ...userInsert,
        preferences: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: null
      } as DbUser);

      this.currentUserSubject.next(user);
      this.isAuthenticated$.set(true);
      this.userRole$.set(user.role);
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }

  private clearSession(): void {
    this.sessionSubject.next(null);
    this.currentUserSubject.next(null);
    this.isAuthenticated$.set(false);
    this.userRole$.set(UserRole.CLIENT);
  }

  private mapDbUserToUser(dbUser: DbUser): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      phone: dbUser.phone || undefined,
      profilePicture: dbUser.profile_picture_url || undefined,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
      isVerified: dbUser.is_verified,
      role: dbUser.role as UserRole,
      preferences: dbUser.preferences || {
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        communication: {
          reminders: true,
          promotions: false
        }
      }
    };
  }

  // Sign up with email and password
  signUp(userData: CreateUserRequest): Observable<AuthResponse> {
    return from(supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone
        }
      }
    })).pipe(
      switchMap(async ({ data, error }) => {
        if (error) throw error;
        if (!data.user) throw new Error('User creation failed');

        // The user profile will be created automatically via setSession
        // when the user confirms their email
        return {
          user: {
            id: data.user.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            isVerified: false,
            role: UserRole.CLIENT,
            createdAt: new Date(),
            updatedAt: new Date(),
            preferences: {
              notifications: { email: true, sms: false, push: true },
              communication: { reminders: true, promotions: false }
            }
          } as User,
          accessToken: data.session?.access_token || '',
          refreshToken: data.session?.refresh_token || '',
          expiresIn: data.session?.expires_in || 3600
        } as AuthResponse;
      }),
      catchError(error => throwError(() => new Error(handleSupabaseError(error))))
    );
  }

  // Sign in with email and password
  signIn(credentials: LoginRequest): Observable<AuthResponse> {
    return from(supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    })).pipe(
      switchMap(async ({ data, error }) => {
        if (error) throw error;
        if (!data.user || !data.session) throw new Error('Sign in failed');

        // Get user profile
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          // If user doesn't exist in our database, create them
          await this.createUserProfile(data.user);
        }

        const user = userProfile ? this.mapDbUserToUser(userProfile) : this.getCurrentUser();

        if (!user) throw new Error('Failed to load user profile');

        return {
          user,
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in || 3600
        } as AuthResponse;
      }),
      catchError(error => throwError(() => new Error(handleSupabaseError(error))))
    );
  }

  // Sign out
  signOut(): Observable<void> {
    return from(supabase.auth.signOut()).pipe(
      map(() => void 0),
      catchError(error => throwError(() => new Error(handleSupabaseError(error))))
    );
  }

  // Reset password
  resetPassword(email: string): Observable<void> {
    return from(supabase.auth.resetPasswordForEmail(email)).pipe(
      map(() => void 0),
      catchError(error => throwError(() => new Error(handleSupabaseError(error))))
    );
  }

  // Update user profile
  updateProfile(updates: Partial<User>): Observable<User> {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) {
      return throwError(() => new Error('No authenticated user'));
    }

    const dbUpdates: any = {};
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.profilePicture !== undefined) dbUpdates.profile_picture_url = updates.profilePicture;
    if (updates.preferences !== undefined) dbUpdates.preferences = updates.preferences;
    dbUpdates.updated_at = new Date().toISOString();

    return from(supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', currentUser.id)
      .select()
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const updatedUser = this.mapDbUserToUser(data);
        this.currentUserSubject.next(updatedUser);
        return updatedUser;
      }),
      catchError(error => throwError(() => new Error(handleSupabaseError(error))))
    );
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user has role
  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  // Check if user is technician
  isTechnician(): boolean {
    return this.hasRole(UserRole.TECHNICIAN);
  }

  // Social sign in (Google, Facebook, etc.)
  signInWithProvider(provider: 'google' | 'facebook'): Observable<void> {
    return from(supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${globalThis.location.origin}/auth/callback`
      }
    })).pipe(
      map(() => void 0),
      catchError(error => throwError(() => new Error(handleSupabaseError(error))))
    );
  }

  // Change password
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return from(supabase.auth.updateUser({
      password: newPassword
    })).pipe(
      map(() => void 0),
      catchError(error => throwError(() => new Error(handleSupabaseError(error))))
    );
  }
}
