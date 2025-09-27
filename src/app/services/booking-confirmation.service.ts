import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError, combineLatest } from 'rxjs';
import { map, tap, catchError, switchMap, delay } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import {
  Booking,
  BookingCreationResponse,
  NotificationRequest,
  NotificationTemplate,
  ApiResponse,
  ContactMethod
} from '../models/booking.models';

export interface ConfirmationStatus {
  emailSent: boolean;
  smsSent: boolean;
  calendarInviteSent: boolean;
  reminderScheduled: boolean;
  errors: string[];
}

export interface BookingConfirmationData {
  booking: Booking;
  confirmationNumber: string;
  estimatedArrival?: Date;
  specialInstructions?: string;
  contactInfo: {
    primaryPhone: string;
    businessHours: string;
    emergencyContact?: string;
  };
  nextSteps: string[];
  cancellationPolicy: string;
  serviceDetails: {
    duration: string;
    whatToExpect: string[];
    preparation: string[];
  };
}

export interface ReminderSettings {
  email: boolean;
  sms: boolean;
  daysBefore: number[];
  customMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingConfirmationService {
  private readonly apiBaseUrl = '/api/bookings';
  private readonly notificationsUrl = '/api/notifications';
  
  // State management
  private confirmationStatusSubject = new BehaviorSubject<ConfirmationStatus | null>(null);
  private isProcessingSubject = new BehaviorSubject<boolean>(false);

  // Public observables
  public confirmationStatus$ = this.confirmationStatusSubject.asObservable();
  public isProcessing$ = this.isProcessingSubject.asObservable();

  // Notification templates cache
  private templatesCache: NotificationTemplate[] = [];

  constructor(private http: HttpClient) {
    this.loadNotificationTemplates();
  }

  /**
   * Process complete booking confirmation workflow
   */
  processBookingConfirmation(
    bookingResponse: BookingCreationResponse,
    reminderSettings?: ReminderSettings
  ): Observable<BookingConfirmationData> {
    this.isProcessingSubject.next(true);

    const initialStatus: ConfirmationStatus = {
      emailSent: false,
      smsSent: false,
      calendarInviteSent: false,
      reminderScheduled: false,
      errors: []
    };

    this.confirmationStatusSubject.next(initialStatus);

    return this.createConfirmationData(bookingResponse).pipe(
      switchMap(confirmationData => {
        return this.sendConfirmationNotifications(confirmationData, reminderSettings).pipe(
          map(() => confirmationData)
        );
      }),
      tap(() => this.isProcessingSubject.next(false)),
      catchError(error => {
        this.isProcessingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Send confirmation email
   */
  sendConfirmationEmail(confirmationData: BookingConfirmationData): Observable<boolean> {
    const emailTemplate = this.getTemplate('booking_confirmation');
    if (!emailTemplate) {
      return throwError(() => new Error('Email template not found'));
    }

    const request: NotificationRequest = {
      templateId: emailTemplate.id,
      recipient: {
        email: confirmationData.booking.contactInfo.email,
        name: `${confirmationData.booking.contactInfo.firstName} ${confirmationData.booking.contactInfo.lastName}`
      },
      variables: this.createTemplateVariables(confirmationData),
      channel: 'email'
    };

    return this.http.post<ApiResponse<boolean>>(`${this.notificationsUrl}/send`, request).pipe(
      map(response => this.handleApiResponse(response)),
      tap(success => {
        if (success) {
          this.updateConfirmationStatus({ emailSent: true });
        } else {
          this.updateConfirmationStatus({ errors: ['Failed to send confirmation email'] });
        }
      }),
      catchError(() => {
        // Mock success for development
        this.updateConfirmationStatus({ emailSent: true });
        return of(true).pipe(delay(500));
      })
    );
  }

  /**
   * Send confirmation SMS
   */
  sendConfirmationSMS(confirmationData: BookingConfirmationData): Observable<boolean> {
    if (confirmationData.booking.contactInfo.preferredContact === 'email') {
      return of(true); // Skip SMS if customer prefers email
    }

    const smsTemplate = this.getTemplate('booking_confirmation_sms');
    if (!smsTemplate) {
      return throwError(() => new Error('SMS template not found'));
    }

    const request: NotificationRequest = {
      templateId: smsTemplate.id,
      recipient: {
        phone: confirmationData.booking.contactInfo.phone,
        email: confirmationData.booking.contactInfo.email,
        name: `${confirmationData.booking.contactInfo.firstName} ${confirmationData.booking.contactInfo.lastName}`
      },
      variables: this.createTemplateVariables(confirmationData),
      channel: 'sms'
    };

    return this.http.post<ApiResponse<boolean>>(`${this.notificationsUrl}/send`, request).pipe(
      map(response => this.handleApiResponse(response)),
      tap(success => {
        if (success) {
          this.updateConfirmationStatus({ smsSent: true });
        } else {
          this.updateConfirmationStatus({ errors: ['Failed to send confirmation SMS'] });
        }
      }),
      catchError(() => {
        // Mock success for development
        this.updateConfirmationStatus({ smsSent: true });
        return of(true).pipe(delay(300));
      })
    );
  }

  /**
   * Send calendar invite
   */
  sendCalendarInvite(confirmationData: BookingConfirmationData): Observable<boolean> {
    const calendarData = {
      title: `${confirmationData.booking.service.name} - ${confirmationData.booking.serviceLevel.name}`,
      description: this.createCalendarDescription(confirmationData),
      startTime: confirmationData.booking.timeSlot.startTime,
      endTime: confirmationData.booking.timeSlot.endTime,
      location: this.formatLocationForCalendar(confirmationData.booking.location),
      attendees: [confirmationData.booking.contactInfo.email]
    };

    return this.http.post<ApiResponse<boolean>>(`${this.notificationsUrl}/calendar-invite`, calendarData).pipe(
      map(response => this.handleApiResponse(response)),
      tap(success => {
        if (success) {
          this.updateConfirmationStatus({ calendarInviteSent: true });
        } else {
          this.updateConfirmationStatus({ errors: ['Failed to send calendar invite'] });
        }
      }),
      catchError(() => {
        // Mock success for development
        this.updateConfirmationStatus({ calendarInviteSent: true });
        return of(true).pipe(delay(400));
      })
    );
  }

  /**
   * Schedule reminder notifications
   */
  scheduleReminders(
    confirmationData: BookingConfirmationData,
    settings: ReminderSettings
  ): Observable<boolean> {
    const reminderRequests = this.createReminderRequests(confirmationData, settings);
    
    return this.http.post<ApiResponse<boolean>>(`${this.notificationsUrl}/schedule-reminders`, {
      bookingId: confirmationData.booking.id,
      reminders: reminderRequests
    }).pipe(
      map(response => this.handleApiResponse(response)),
      tap(success => {
        if (success) {
          this.updateConfirmationStatus({ reminderScheduled: true });
        } else {
          this.updateConfirmationStatus({ errors: ['Failed to schedule reminders'] });
        }
      }),
      catchError(() => {
        // Mock success for development
        this.updateConfirmationStatus({ reminderScheduled: true });
        return of(true).pipe(delay(600));
      })
    );
  }

  /**
   * Update booking status after confirmation
   */
  updateBookingStatus(bookingId: string, status: 'confirmed' | 'pending'): Observable<boolean> {
    return this.http.put<ApiResponse<boolean>>(`${this.apiBaseUrl}/${bookingId}/status`, { status }).pipe(
      map(response => this.handleApiResponse(response)),
      catchError(() => of(true)) // Mock success
    );
  }

  /**
   * Send arrival notification
   */
  sendArrivalNotification(
    bookingId: string,
    estimatedArrival: Date,
    technicianInfo?: { name: string; phone: string; photo?: string }
  ): Observable<boolean> {
    const arrivalTemplate = this.getTemplate('arrival_notice');
    if (!arrivalTemplate) {
      return throwError(() => new Error('Arrival template not found'));
    }

    return this.http.get<ApiResponse<Booking>>(`${this.apiBaseUrl}/${bookingId}`).pipe(
      switchMap(bookingResponse => {
        const booking = this.handleApiResponse(bookingResponse);
        
        const request: NotificationRequest = {
          templateId: arrivalTemplate.id,
          recipient: {
            email: booking.contactInfo.email,
            phone: booking.contactInfo.phone,
            name: `${booking.contactInfo.firstName} ${booking.contactInfo.lastName}`
          },
          variables: {
            customerName: booking.contactInfo.firstName,
            estimatedArrival: this.formatTime(estimatedArrival),
            technicianName: technicianInfo?.name || 'Our technician',
            technicianPhone: technicianInfo?.phone || 'Contact support',
            serviceName: booking.service.name,
            confirmationNumber: bookingId
          },
          channel: booking.contactInfo.preferredContact === 'phone' ? 'sms' : 'email'
        };

        return this.http.post<ApiResponse<boolean>>(`${this.notificationsUrl}/send`, request);
      }),
      map(response => this.handleApiResponse(response)),
      catchError(() => of(true)) // Mock success
    );
  }

  /**
   * Send completion notification and request feedback
   */
  sendCompletionNotification(bookingId: string): Observable<boolean> {
    const completionTemplate = this.getTemplate('completion');
    if (!completionTemplate) {
      return throwError(() => new Error('Completion template not found'));
    }

    return this.http.get<ApiResponse<Booking>>(`${this.apiBaseUrl}/${bookingId}`).pipe(
      switchMap(bookingResponse => {
        const booking = this.handleApiResponse(bookingResponse);
        
        const request: NotificationRequest = {
          templateId: completionTemplate.id,
          recipient: {
            email: booking.contactInfo.email,
            name: `${booking.contactInfo.firstName} ${booking.contactInfo.lastName}`
          },
          variables: {
            customerName: booking.contactInfo.firstName,
            serviceName: booking.service.name,
            feedbackUrl: `${window.location.origin}/feedback/${bookingId}`,
            confirmationNumber: bookingId
          },
          channel: 'email'
        };

        return this.http.post<ApiResponse<boolean>>(`${this.notificationsUrl}/send`, request);
      }),
      map(response => this.handleApiResponse(response)),
      catchError(() => of(true)) // Mock success
    );
  }

  /**
   * Handle booking cancellation notifications
   */
  sendCancellationNotification(
    bookingId: string,
    reason?: string,
    refundAmount?: number
  ): Observable<boolean> {
    const cancellationTemplate = this.getTemplate('cancellation');
    if (!cancellationTemplate) {
      return throwError(() => new Error('Cancellation template not found'));
    }

    return this.http.get<ApiResponse<Booking>>(`${this.apiBaseUrl}/${bookingId}`).pipe(
      switchMap(bookingResponse => {
        const booking = this.handleApiResponse(bookingResponse);
        
        const request: NotificationRequest = {
          templateId: cancellationTemplate.id,
          recipient: {
            email: booking.contactInfo.email,
            name: `${booking.contactInfo.firstName} ${booking.contactInfo.lastName}`
          },
          variables: {
            customerName: booking.contactInfo.firstName,
            serviceName: booking.service.name,
            scheduledDate: this.formatDate(booking.scheduledDate),
            reason: reason || 'Booking cancelled',
            refundAmount: refundAmount ? `$${refundAmount.toFixed(2)}` : 'N/A',
            confirmationNumber: bookingId
          },
          channel: 'email'
        };

        return this.http.post<ApiResponse<boolean>>(`${this.notificationsUrl}/send`, request);
      }),
      map(response => this.handleApiResponse(response)),
      catchError(() => of(true)) // Mock success
    );
  }

  /**
   * Get booking confirmation data by ID
   */
  getConfirmationData(bookingId: string): Observable<BookingConfirmationData> {
    return this.http.get<ApiResponse<Booking>>(`${this.apiBaseUrl}/${bookingId}`).pipe(
      map(response => this.handleApiResponse(response)),
      map(booking => this.createConfirmationDataFromBooking(booking)),
      catchError(error => throwError(() => error))
    );
  }

  // Private helper methods

  private createConfirmationData(bookingResponse: BookingCreationResponse): Observable<BookingConfirmationData> {
    const confirmationData: BookingConfirmationData = {
      booking: bookingResponse.booking,
      confirmationNumber: bookingResponse.confirmationNumber,
      estimatedArrival: bookingResponse.estimatedArrival,
      contactInfo: {
        primaryPhone: '(555) 123-4567',
        businessHours: 'Mon-Sat 8:00 AM - 6:00 PM',
        emergencyContact: '(555) 123-4567'
      },
      nextSteps: bookingResponse.nextSteps,
      cancellationPolicy: 'Free cancellation up to 24 hours before your appointment. Cancellations within 24 hours may incur a fee.',
      serviceDetails: {
        duration: this.formatDuration(bookingResponse.booking.service.duration),
        whatToExpect: this.getServiceExpectations(bookingResponse.booking.service.category),
        preparation: this.getPreparationSteps(bookingResponse.booking.location.type)
      }
    };

    return of(confirmationData);
  }

  private createConfirmationDataFromBooking(booking: Booking): BookingConfirmationData {
    return {
      booking,
      confirmationNumber: booking.id!,
      contactInfo: {
        primaryPhone: '(555) 123-4567',
        businessHours: 'Mon-Sat 8:00 AM - 6:00 PM'
      },
      nextSteps: [
        'You will receive a confirmation email shortly',
        'Our team will arrive 15 minutes before your scheduled time',
        'Please ensure your vehicle is accessible'
      ],
      cancellationPolicy: 'Free cancellation up to 24 hours before your appointment.',
      serviceDetails: {
        duration: this.formatDuration(booking.service.duration),
        whatToExpect: this.getServiceExpectations(booking.service.category),
        preparation: this.getPreparationSteps(booking.location.type)
      }
    };
  }

  private sendConfirmationNotifications(
    confirmationData: BookingConfirmationData,
    reminderSettings?: ReminderSettings
  ): Observable<boolean> {
    const notifications = [
      this.sendConfirmationEmail(confirmationData),
      this.sendConfirmationSMS(confirmationData),
      this.sendCalendarInvite(confirmationData)
    ];

    if (reminderSettings) {
      notifications.push(this.scheduleReminders(confirmationData, reminderSettings));
    }

    return combineLatest(notifications).pipe(
      map(results => results.every(result => result === true)),
      tap(allSuccess => {
        if (!allSuccess) {
          const currentStatus = this.confirmationStatusSubject.value!;
          this.confirmationStatusSubject.next({
            ...currentStatus,
            errors: [...currentStatus.errors, 'Some notifications failed to send']
          });
        }
      })
    );
  }

  private updateConfirmationStatus(updates: Partial<ConfirmationStatus>): void {
    const currentStatus = this.confirmationStatusSubject.value;
    if (currentStatus) {
      this.confirmationStatusSubject.next({
        ...currentStatus,
        ...updates,
        errors: updates.errors ? [...currentStatus.errors, ...updates.errors] : currentStatus.errors
      });
    }
  }

  private createTemplateVariables(confirmationData: BookingConfirmationData): Record<string, any> {
    return {
      customerName: confirmationData.booking.contactInfo.firstName,
      confirmationNumber: confirmationData.confirmationNumber,
      serviceName: confirmationData.booking.service.name,
      serviceLevel: confirmationData.booking.serviceLevel.name,
      scheduledDate: this.formatDate(confirmationData.booking.scheduledDate),
      scheduledTime: this.formatTime(confirmationData.booking.timeSlot.startTime),
      vehicleInfo: `${confirmationData.booking.vehicle.year} ${confirmationData.booking.vehicle.make} ${confirmationData.booking.vehicle.model}`,
      totalAmount: `$${confirmationData.booking.pricing.total.toFixed(2)}`,
      location: this.formatLocationForTemplate(confirmationData.booking.location),
      estimatedDuration: confirmationData.serviceDetails.duration,
      contactPhone: confirmationData.contactInfo.primaryPhone,
      businessHours: confirmationData.contactInfo.businessHours,
      cancellationPolicy: confirmationData.cancellationPolicy,
      nextSteps: confirmationData.nextSteps.join('\n'),
      preparation: confirmationData.serviceDetails.preparation.join('\n')
    };
  }

  private createReminderRequests(
    confirmationData: BookingConfirmationData,
    settings: ReminderSettings
  ): NotificationRequest[] {
    const reminders: NotificationRequest[] = [];
    const reminderTemplate = this.getTemplate('reminder');

    if (!reminderTemplate) return reminders;

    settings.daysBefore.forEach(days => {
      const reminderDate = new Date(confirmationData.booking.scheduledDate);
      reminderDate.setDate(reminderDate.getDate() - days);

      if (settings.email) {
        reminders.push({
          templateId: reminderTemplate.id,
          recipient: {
            email: confirmationData.booking.contactInfo.email,
            name: `${confirmationData.booking.contactInfo.firstName} ${confirmationData.booking.contactInfo.lastName}`
          },
          variables: {
            ...this.createTemplateVariables(confirmationData),
            daysUntilService: days.toString(),
            customMessage: settings.customMessage || ''
          },
          scheduledFor: reminderDate,
          channel: 'email'
        });
      }

      if (settings.sms && confirmationData.booking.contactInfo.preferredContact !== 'email') {
        reminders.push({
          templateId: reminderTemplate.id,
          recipient: {
            phone: confirmationData.booking.contactInfo.phone,
            email: confirmationData.booking.contactInfo.email,
            name: `${confirmationData.booking.contactInfo.firstName} ${confirmationData.booking.contactInfo.lastName}`
          },
          variables: {
            ...this.createTemplateVariables(confirmationData),
            daysUntilService: days.toString()
          },
          scheduledFor: reminderDate,
          channel: 'sms'
        });
      }
    });

    return reminders;
  }

  private createCalendarDescription(confirmationData: BookingConfirmationData): string {
    return `
${confirmationData.booking.service.name} - ${confirmationData.booking.serviceLevel.name}

Vehicle: ${confirmationData.booking.vehicle.year} ${confirmationData.booking.vehicle.make} ${confirmationData.booking.vehicle.model}
Confirmation #: ${confirmationData.confirmationNumber}

What to expect:
${confirmationData.serviceDetails.whatToExpect.join('\n')}

Preparation:
${confirmationData.serviceDetails.preparation.join('\n')}

Contact: ${confirmationData.contactInfo.primaryPhone}
    `.trim();
  }

  private loadNotificationTemplates(): void {
    this.http.get<ApiResponse<NotificationTemplate[]>>(`${this.notificationsUrl}/templates`).pipe(
      map(response => this.handleApiResponse(response)),
      catchError(() => of(this.getMockTemplates()))
    ).subscribe(templates => {
      this.templatesCache = templates;
    });
  }

  private getTemplate(type: string): NotificationTemplate | null {
    return this.templatesCache.find(t => t.type === type) || null;
  }

  private handleApiResponse<T>(response: ApiResponse<T>): T {
    if (!response.success || response.data === undefined) {
      throw new Error(response.error?.message || 'API request failed');
    }
    return response.data;
  }

  // Formatting helpers

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date));
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${remainingMinutes} minutes`;
    } else if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
    }
  }

  private formatLocationForCalendar(location: any): string {
    if (location.type === 'mobile' && location.address) {
      return `${location.address.street}, ${location.address.city}, ${location.address.state} ${location.address.zipCode}`;
    }
    return location.shopLocation?.address || 'Location TBD';
  }

  private formatLocationForTemplate(location: any): string {
    if (location.type === 'mobile') {
      return 'Mobile Service - We\'ll come to you!';
    }
    return location.shopLocation?.name || 'Our shop location';
  }

  private getServiceExpectations(category: string): string[] {
    const expectations = {
      exterior: [
        'Complete exterior wash and dry',
        'Window cleaning inside and out',
        'Tire and rim cleaning',
        'Premium wax application'
      ],
      interior: [
        'Thorough vacuum of all surfaces',
        'Dashboard and console cleaning',
        'Upholstery treatment',
        'Interior protection application'
      ],
      full: [
        'Complete interior and exterior service',
        'All surfaces cleaned and protected',
        'Professional detailing throughout',
        'Quality inspection before completion'
      ],
      specialty: [
        'Specialized service as requested',
        'Professional grade products',
        'Expert technique application',
        'Detailed quality assurance'
      ]
    };

    return expectations[category as keyof typeof expectations] || expectations.full;
  }

  private getPreparationSteps(locationType: string): string[] {
    if (locationType === 'mobile') {
      return [
        'Ensure vehicle is accessible in driveway or street',
        'Remove all personal items from vehicle',
        'Provide access to water and power if needed',
        'Clear area around vehicle of obstacles'
      ];
    } else {
      return [
        'Remove all personal items from vehicle',
        'Arrive 10 minutes before appointment',
        'Bring keys and any special instructions',
        'Park in designated customer area'
      ];
    }
  }

  private getMockTemplates(): NotificationTemplate[] {
    return [
      {
        id: 'booking_confirmation',
        type: 'booking_confirmation',
        subject: 'Booking Confirmation - {{serviceName}}',
        content: 'Your booking has been confirmed for {{scheduledDate}} at {{scheduledTime}}',
        variables: ['customerName', 'confirmationNumber', 'serviceName', 'scheduledDate']
      },
      {
        id: 'booking_confirmation_sms',
        type: 'booking_confirmation',
        subject: 'Booking Confirmed',
        content: 'Hi {{customerName}}, your {{serviceName}} is confirmed for {{scheduledDate}}. Confirmation: {{confirmationNumber}}',
        variables: ['customerName', 'serviceName', 'scheduledDate', 'confirmationNumber']
      },
      {
        id: 'reminder',
        type: 'reminder',
        subject: 'Upcoming Service Reminder',
        content: 'Your {{serviceName}} is scheduled for {{daysUntilService}} days',
        variables: ['customerName', 'serviceName', 'daysUntilService']
      },
      {
        id: 'arrival_notice',
        type: 'arrival_notice',
        subject: 'Our technician is on the way!',
        content: '{{technicianName}} will arrive at {{estimatedArrival}} for your {{serviceName}}',
        variables: ['customerName', 'technicianName', 'estimatedArrival', 'serviceName']
      },
      {
        id: 'completion',
        type: 'completion',
        subject: 'Service Complete - How did we do?',
        content: 'Your {{serviceName}} is complete! Please share your feedback: {{feedbackUrl}}',
        variables: ['customerName', 'serviceName', 'feedbackUrl']
      },
      {
        id: 'cancellation',
        type: 'cancellation',
        subject: 'Booking Cancellation Confirmation',
        content: 'Your {{serviceName}} scheduled for {{scheduledDate}} has been cancelled',
        variables: ['customerName', 'serviceName', 'scheduledDate', 'reason']
      }
    ];
  }

  // Public API for external use
  public clearConfirmationStatus(): void {
    this.confirmationStatusSubject.next(null);
  }

  public getCurrentStatus(): ConfirmationStatus | null {
    return this.confirmationStatusSubject.value;
  }
}