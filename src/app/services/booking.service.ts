import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map, tap, catchError, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {
  BookingState,
  BookingFormData,
  BookingValidationError,
  BookingEvent,
  ServiceType,
  ServiceLevel,
  Vehicle,
  TimeSlot,
  AvailableDay,
  PricingBreakdown,
  Booking,
  BookingCreationResponse,
  AvailabilityRequest,
  AvailabilityResponse,
  ApiResponse,
  BOOKING_STEPS,
  MAX_BOOKING_STEPS,
  VEHICLE_SIZE_MULTIPLIERS,
  LOCATION_SURCHARGES
} from '../models/booking.models';
import { BookingValidationService } from './booking-validation.service';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly apiBaseUrl = '/api/bookings';
  
  // State management
  private bookingStateSubject = new BehaviorSubject<BookingState>(this.createInitialState());
  private eventSubject = new BehaviorSubject<BookingEvent | null>(null);
  
  // Public observables
  public bookingState$ = this.bookingStateSubject.asObservable();
  public events$ = this.eventSubject.asObservable();
  
  // Computed observables
  public currentStep$ = this.bookingState$.pipe(map(state => state.currentStep));
  public isLoading$ = this.bookingState$.pipe(map(state => state.isLoading));
  public formData$ = this.bookingState$.pipe(map(state => state.formData));
  public validationErrors$ = this.bookingState$.pipe(map(state => state.validationErrors));
  public pricing$ = this.bookingState$.pipe(map(state => state.pricing));
  public isSubmitting$ = this.bookingState$.pipe(map(state => state.isSubmitting));

  // Step-specific observables
  public canProceedToNextStep$ = combineLatest([
    this.currentStep$,
    this.formData$,
    this.validationErrors$
  ]).pipe(
    map(([currentStep, formData, errors]) => {
      const stepErrors = errors.filter(error => error.step === currentStep);
      return stepErrors.length === 0 && this.validationService.canProceedToNextStep(currentStep, formData);
    })
  );

  public canGoToPreviousStep$ = this.currentStep$.pipe(
    map(step => step > 1)
  );

  public isLastStep$ = this.currentStep$.pipe(
    map(step => step === MAX_BOOKING_STEPS)
  );

  constructor(
    private http: HttpClient,
    private validationService: BookingValidationService
  ) {
    // Initialize with mock data
    this.loadInitialData();
  }

  // State Management Methods
  
  private createInitialState(): BookingState {
    return {
      currentStep: 1,
      isLoading: false,
      formData: {
        step1: {
          selectedService: null,
          selectedLevel: null,
          preSelectedService: undefined
        },
        step2: {
          selectedVehicle: null,
          isNewVehicle: false,
          vehicles: []
        },
        step3: {
          selectedDate: null,
          selectedTimeSlot: null,
          availableDays: []
        },
        step4: {
          location: {
            type: 'mobile',
            address: {
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: 'US'
            }
          },
          contactInfo: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            preferredContact: 'email'
          }
        },
        step5: {
          termsAccepted: false,
          marketingOptIn: false,
          specialRequests: ''
        }
      },
      validationErrors: [],
      pricing: null,
      availableServices: [],
      availableLevels: [],
      savedVehicles: [],
      isSubmitting: false,
      submissionError: null
    };
  }

  private updateState(updates: Partial<BookingState>): void {
    const currentState = this.bookingStateSubject.value;
    const newState = { ...currentState, ...updates };
    this.bookingStateSubject.next(newState);
  }

  private emitEvent(event: BookingEvent): void {
    this.eventSubject.next(event);
  }

  // Navigation Methods

  public goToStep(step: number): Observable<boolean> {
    if (step < 1 || step > MAX_BOOKING_STEPS) {
      return throwError(() => new Error(`Invalid step: ${step}`));
    }

    const currentState = this.bookingStateSubject.value;
    
    // Validate current step before allowing navigation
    if (step > currentState.currentStep) {
      const canProceed = this.validationService.canProceedToNextStep(currentState.currentStep, currentState.formData);
      if (!canProceed) {
        const errors = this.validationService.validateStep(currentState.currentStep, currentState.formData);
        this.updateState({ validationErrors: [...currentState.validationErrors, ...errors] });
        return throwError(() => new Error('Please complete current step before proceeding'));
      }
    }

    this.updateState({ currentStep: step });
    this.emitEvent({
      type: 'step_changed',
      step,
      timestamp: new Date()
    });

    return new BehaviorSubject(true).asObservable();
  }

  public nextStep(): Observable<boolean> {
    const currentStep = this.bookingStateSubject.value.currentStep;
    return this.goToStep(currentStep + 1);
  }

  public previousStep(): Observable<boolean> {
    const currentStep = this.bookingStateSubject.value.currentStep;
    return this.goToStep(currentStep - 1);
  }

  // Form Data Management

  public updateStepData(step: number, data: Partial<any>): void {
    const currentState = this.bookingStateSubject.value;
    const stepKey = this.getStepKey(step);
    
    if (!stepKey) return;

    const updatedFormData = {
      ...currentState.formData,
      [stepKey]: {
        ...currentState.formData[stepKey],
        ...data
      }
    };

    // Clear validation errors for the updated fields
    const updatedErrors = currentState.validationErrors.filter(
      error => error.step !== step
    );

    this.updateState({
      formData: updatedFormData,
      validationErrors: updatedErrors
    });

    // Recalculate pricing if necessary
    if (this.shouldRecalculatePricing(step)) {
      this.calculatePricing();
    }

    this.emitEvent({
      type: 'data_updated',
      step,
      data: { [stepKey]: data },
      timestamp: new Date()
    });
  }

  // Service Selection (Step 1)

  public selectService(service: ServiceType): void {
    this.updateStepData(1, { selectedService: service });
    this.loadServiceLevels(service.id);
  }

  public selectServiceLevel(level: ServiceLevel): void {
    this.updateStepData(1, { selectedLevel: level });
  }

  // Vehicle Management (Step 2)

  public selectVehicle(vehicle: Vehicle): void {
    this.updateStepData(2, { selectedVehicle: vehicle, isNewVehicle: false });
  }

  public addNewVehicle(vehicle: Vehicle): Observable<Vehicle> {
    this.updateState({ isLoading: true });
    
    return this.http.post<ApiResponse<Vehicle>>(`${this.apiBaseUrl}/vehicles`, vehicle).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Failed to save vehicle');
        }
        return response.data;
      }),
      tap(savedVehicle => {
        const currentState = this.bookingStateSubject.value;
        const updatedVehicles = [...currentState.savedVehicles, savedVehicle];
        
        this.updateState({
          isLoading: false,
          savedVehicles: updatedVehicles
        });
        
        this.updateStepData(2, { 
          selectedVehicle: savedVehicle, 
          isNewVehicle: true,
          vehicles: updatedVehicles 
        });
      }),
      catchError(error => {
        this.updateState({ isLoading: false });
        return throwError(() => error);
      })
    );
  }

  // Date and Time Selection (Step 3)

  public loadAvailableSlots(date: Date): Observable<AvailableDay> {
    const currentState = this.bookingStateSubject.value;
    const { selectedService } = currentState.formData.step1;
    const { selectedVehicle } = currentState.formData.step2;
    const { location } = currentState.formData.step4;

    if (!selectedService || !selectedVehicle) {
      return throwError(() => new Error('Service and vehicle must be selected first'));
    }

    this.updateState({ isLoading: true });

    const request: AvailabilityRequest = {
      serviceId: selectedService.id,
      vehicleSize: selectedVehicle.sizeCategory,
      locationType: location.type,
      preferredDate: date,
      location: location.address?.coordinates
    };

    return this.http.post<ApiResponse<AvailabilityResponse>>(`${this.apiBaseUrl}/availability`, request).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Failed to load availability');
        }
        return response.data.availableDays.find(day => 
          new Date(day.date).toDateString() === date.toDateString()
        ) || { date, slots: [], fullyBooked: true };
      }),
      tap(availableDay => {
        const currentAvailableDays = currentState.formData.step3.availableDays;
        const updatedDays = [
          ...currentAvailableDays.filter(day => 
            new Date(day.date).toDateString() !== date.toDateString()
          ),
          availableDay
        ];

        this.updateStepData(3, { availableDays: updatedDays });
        this.updateState({ isLoading: false });
      }),
      catchError(error => {
        this.updateState({ isLoading: false });
        return throwError(() => error);
      })
    );
  }

  public selectDate(date: Date): void {
    this.updateStepData(3, { selectedDate: date, selectedTimeSlot: null });
    this.loadAvailableSlots(date).subscribe();
  }

  public selectTimeSlot(timeSlot: TimeSlot): void {
    this.updateStepData(3, { selectedTimeSlot: timeSlot });
  }

  // Location and Contact (Step 4)

  public updateLocation(location: any): void {
    this.updateStepData(4, { location });
  }

  public updateContactInfo(contactInfo: any): void {
    this.updateStepData(4, { contactInfo });
  }

  // Pricing Calculations

  public calculatePricing(): Observable<PricingBreakdown> {
    const currentState = this.bookingStateSubject.value;
    const { step1, step2, step3, step4 } = currentState.formData;

    if (!step1.selectedService || !step1.selectedLevel || !step2.selectedVehicle) {
      return throwError(() => new Error('Required selections not complete'));
    }

    const servicePrice = step1.selectedService.basePrice;
    const levelMultiplier = step1.selectedLevel.priceMultiplier;
    const vehicleSizeMultiplier = VEHICLE_SIZE_MULTIPLIERS[step2.selectedVehicle.sizeCategory];
    const timeSlotSurcharge = step3.selectedTimeSlot?.price || 0;
    const locationSurcharge = LOCATION_SURCHARGES[step4.location.type];

    const subtotal = servicePrice * levelMultiplier * vehicleSizeMultiplier;
    const totalSurcharges = timeSlotSurcharge + locationSurcharge;
    const taxRate = 0.08; // 8% tax
    const taxes = (subtotal + totalSurcharges) * taxRate;
    const total = subtotal + totalSurcharges + taxes;

    const pricing: PricingBreakdown = {
      servicePrice: subtotal,
      levelMultiplier,
      vehicleSizeMultiplier,
      timeSlotSurcharge,
      locationSurcharge,
      taxes,
      discounts: 0, // TODO: Implement discount logic
      total
    };

    this.updateState({ pricing });

    return new BehaviorSubject(pricing).asObservable();
  }

  // Booking Submission

  public submitBooking(): Observable<BookingCreationResponse> {
    const currentState = this.bookingStateSubject.value;
    
    // Final validation
    const allErrors = this.validationService.validateAllSteps(currentState.formData);
    if (allErrors.length > 0) {
      this.updateState({ validationErrors: allErrors });
      this.emitEvent({
        type: 'validation_error',
        error: 'Please correct all validation errors',
        timestamp: new Date()
      });
      return throwError(() => new Error('Validation errors exist'));
    }

    this.updateState({ isSubmitting: true, submissionError: null });
    this.emitEvent({
      type: 'submission_started',
      timestamp: new Date()
    });

    const bookingData = this.createBookingFromFormData(currentState.formData, currentState.pricing!);

    return this.http.post<ApiResponse<BookingCreationResponse>>(`${this.apiBaseUrl}`, bookingData).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Failed to create booking');
        }
        return response.data;
      }),
      tap(result => {
        this.updateState({ isSubmitting: false });
        this.emitEvent({
          type: 'submission_completed',
          timestamp: new Date()
        });
      }),
      catchError(error => {
        this.updateState({ 
          isSubmitting: false, 
          submissionError: error.message || 'Failed to submit booking' 
        });
        this.emitEvent({
          type: 'submission_failed',
          error: error.message,
          timestamp: new Date()
        });
        return throwError(() => error);
      })
    );
  }

  // Validation

  public validateCurrentStep(): Observable<BookingValidationError[]> {
    const currentState = this.bookingStateSubject.value;
    const errors = this.validationService.validateStep(currentState.currentStep, currentState.formData);
    
    this.updateState({
      validationErrors: [
        ...currentState.validationErrors.filter(e => e.step !== currentState.currentStep),
        ...errors
      ]
    });

    return new BehaviorSubject(errors).asObservable();
  }

  public clearValidationErrors(step?: number): void {
    const currentState = this.bookingStateSubject.value;
    const updatedErrors = step 
      ? currentState.validationErrors.filter(error => error.step !== step)
      : [];
    
    this.updateState({ validationErrors: updatedErrors });
  }

  // Data Loading

  private loadInitialData(): void {
    this.loadAvailableServices().subscribe();
    this.loadSavedVehicles().subscribe();
  }

  private loadAvailableServices(): Observable<ServiceType[]> {
    this.updateState({ isLoading: true });
    
    return this.http.get<ApiResponse<ServiceType[]>>(`${this.apiBaseUrl}/services`).pipe(
      map(response => response.data || this.getMockServices()),
      tap(services => {
        this.updateState({ 
          availableServices: services,
          isLoading: false 
        });
      }),
      catchError(() => {
        // Fallback to mock data
        const mockServices = this.getMockServices();
        this.updateState({ 
          availableServices: mockServices,
          isLoading: false 
        });
        return new BehaviorSubject(mockServices);
      })
    );
  }

  private loadServiceLevels(serviceId: string): void {
    this.http.get<ApiResponse<ServiceLevel[]>>(`${this.apiBaseUrl}/services/${serviceId}/levels`).pipe(
      map(response => response.data || this.getMockServiceLevels()),
      tap(levels => {
        this.updateState({ availableLevels: levels });
      }),
      catchError(() => {
        const mockLevels = this.getMockServiceLevels();
        this.updateState({ availableLevels: mockLevels });
        return new BehaviorSubject(mockLevels);
      })
    ).subscribe();
  }

  private loadSavedVehicles(): Observable<Vehicle[]> {
    return this.http.get<ApiResponse<Vehicle[]>>(`${this.apiBaseUrl}/vehicles`).pipe(
      map(response => response.data || []),
      tap(vehicles => {
        this.updateState({ savedVehicles: vehicles });
        this.updateStepData(2, { vehicles });
      }),
      catchError(() => {
        return new BehaviorSubject([]);
      })
    );
  }

  // Utility Methods

  private getStepKey(step: number): keyof BookingFormData | null {
    switch (step) {
      case 1: return 'step1';
      case 2: return 'step2';
      case 3: return 'step3';
      case 4: return 'step4';
      case 5: return 'step5';
      default: return null;
    }
  }

  private shouldRecalculatePricing(step: number): boolean {
    return [1, 2, 3, 4].includes(step);
  }

  private createBookingFromFormData(formData: BookingFormData, pricing: PricingBreakdown): Partial<Booking> {
    return {
      service: formData.step1.selectedService!,
      serviceLevel: formData.step1.selectedLevel!,
      vehicle: formData.step2.selectedVehicle!,
      scheduledDate: formData.step3.selectedDate!,
      timeSlot: formData.step3.selectedTimeSlot!,
      location: formData.step4.location,
      contactInfo: formData.step4.contactInfo,
      pricing,
      specialInstructions: formData.step5.specialRequests,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Mock Data (for development)

  private getMockServices(): ServiceType[] {
    return [
      {
        id: '1',
        name: 'Exterior Wash',
        description: 'Complete exterior cleaning and detailing',
        basePrice: 75,
        duration: 60,
        category: 'exterior',
        available: true
      },
      {
        id: '2',
        name: 'Interior Detail',
        description: 'Deep interior cleaning and conditioning',
        basePrice: 100,
        duration: 90,
        category: 'interior',
        available: true
      },
      {
        id: '3',
        name: 'Full Service Detail',
        description: 'Complete interior and exterior detailing',
        basePrice: 150,
        duration: 180,
        category: 'full',
        available: true
      }
    ];
  }

  private getMockServiceLevels(): ServiceLevel[] {
    return [
      {
        id: 'basic',
        name: 'Basic',
        description: 'Standard service level',
        priceMultiplier: 1.0,
        features: ['Basic wash', 'Vacuum', 'Tire shine']
      },
      {
        id: 'premium',
        name: 'Premium',
        description: 'Enhanced service with premium products',
        priceMultiplier: 1.3,
        features: ['Premium wash', 'Deep vacuum', 'Tire shine', 'Interior protection']
      },
      {
        id: 'ultimate',
        name: 'Ultimate',
        description: 'The complete luxury experience',
        priceMultiplier: 1.6,
        features: ['Ultimate wash', 'Complete detail', 'Protection package', 'Interior/exterior']
      }
    ];
  }

  // Public getter for current state (for debugging/testing)
  get currentState(): BookingState {
    return this.bookingStateSubject.value;
  }

  // Reset booking flow
  public resetBooking(): void {
    this.bookingStateSubject.next(this.createInitialState());
    this.emitEvent({
      type: 'step_changed',
      step: 1,
      timestamp: new Date()
    });
  }
}