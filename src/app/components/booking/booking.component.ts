import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil, map, tap, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

import { BookingService } from '../../services/booking.service';
import { BookingValidationService } from '../../services/booking-validation.service';
import { BookingApiService } from '../../services/booking-api.service';
import { BookingConfirmationService, BookingConfirmationData, ReminderSettings } from '../../services/booking-confirmation.service';

import {
  BookingState,
  BookingFormData,
  BookingValidationError,
  ServiceType,
  ServiceLevel,
  Vehicle,
  TimeSlot,
  AvailableDay,
  PricingBreakdown,
  BookingCreationResponse,
  BOOKING_STEPS,
  MAX_BOOKING_STEPS
} from '../../models/booking.models';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss']
})
export class BookingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Reactive state from services
  public bookingState$!: Observable<BookingState>;
  public currentStep$!: Observable<number>;
  public formData$!: Observable<BookingFormData>;
  public validationErrors$!: Observable<BookingValidationError[]>;
  public pricing$!: Observable<PricingBreakdown | null>;
  public isLoading$!: Observable<boolean>;
  public isSubmitting$!: Observable<boolean>;
  public canProceedToNextStep$!: Observable<boolean>;
  public canGoToPreviousStep$!: Observable<boolean>;
  public isLastStep$!: Observable<boolean>;
  
  // Step-specific data observables
  public availableServices$!: Observable<ServiceType[]>;
  public availableLevels$!: Observable<ServiceLevel[]>;
  public savedVehicles$!: Observable<Vehicle[]>;
  public availableDays$!: Observable<AvailableDay[]>;
  
  // Confirmation state
  public confirmationStatus$!: Observable<any>;
  public isProcessingConfirmation$!: Observable<boolean>;
  public confirmationData$ = new BehaviorSubject<BookingConfirmationData | null>(null);
  
  // Constants
  public readonly BOOKING_STEPS = BOOKING_STEPS;
  public readonly MAX_STEPS = MAX_BOOKING_STEPS;
  
  // Form groups for each step
  public step1Form!: FormGroup;
  public step2Form!: FormGroup;
  public step3Form!: FormGroup;
  public step4Form!: FormGroup;
  public step5Form!: FormGroup;
  
  // UI state
  public showPricing = false;
  public showConfirmation = false;
  public submissionError: string | null = null;
  
  // Calendar state
  public selectedMonth = new Date();
  public calendarDays: Date[] = [];
  
  // Vehicle form state
  public isAddingNewVehicle = false;
  
  // Location state
  public selectedLocationType: 'mobile' | 'shop' = 'mobile';
  
  constructor(
    private bookingService: BookingService,
    private validationService: BookingValidationService,
    private apiService: BookingApiService,
    private confirmationService: BookingConfirmationService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForms();
    this.initializeObservables();
  }
  
  ngOnInit(): void {
    this.setupSubscriptions();
    this.handlePreselectedService();
    this.generateCalendar();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Initialization Methods
  
  private initializeObservables(): void {
    this.bookingState$ = this.bookingService.bookingState$;
    this.currentStep$ = this.bookingService.currentStep$;
    this.formData$ = this.bookingService.formData$;
    this.validationErrors$ = this.bookingService.validationErrors$;
    this.pricing$ = this.bookingService.pricing$;
    this.isLoading$ = this.bookingService.isLoading$;
    this.isSubmitting$ = this.bookingService.isSubmitting$;
    this.canProceedToNextStep$ = this.bookingService.canProceedToNextStep$;
    this.canGoToPreviousStep$ = this.bookingService.canGoToPreviousStep$;
    this.isLastStep$ = this.bookingService.isLastStep$;
    
    // Step-specific observables
    this.availableServices$ = this.bookingState$.pipe(
      map(state => state.availableServices)
    );
    
    this.availableLevels$ = this.bookingState$.pipe(
      map(state => state.availableLevels)
    );
    
    this.savedVehicles$ = this.bookingState$.pipe(
      map(state => state.savedVehicles)
    );
    
    this.availableDays$ = this.formData$.pipe(
      map(data => data.step3.availableDays)
    );
    
    // Initialize confirmation observables
    this.confirmationStatus$ = this.confirmationService.confirmationStatus$;
    this.isProcessingConfirmation$ = this.confirmationService.isProcessing$;
  }
  
  private initializeForms(): void {
    // Step 1: Service Selection
    this.step1Form = this.fb.group({
      selectedServiceId: ['', Validators.required],
      selectedLevelId: ['', Validators.required]
    });
    
    // Step 2: Vehicle Information
    this.step2Form = this.fb.group({
      selectedVehicleId: [''],
      make: ['', [Validators.required, Validators.minLength(2)]],
      model: ['', [Validators.required, Validators.minLength(1)]],
      year: ['', [Validators.required, Validators.min(1900)]],
      color: ['', [Validators.required, Validators.minLength(3)]],
      licensePlate: ['', [Validators.required, Validators.pattern(/^[A-Z0-9\-\s]+$/i)]],
      vehicleType: ['', Validators.required],
      sizeCategory: ['', Validators.required],
      condition: ['good'],
      notes: ['']
    });
    
    // Step 3: Date and Time
    this.step3Form = this.fb.group({
      selectedDate: [null, Validators.required],
      selectedTimeSlot: [null, Validators.required]
    });
    
    // Step 4: Location and Contact
    this.step4Form = this.fb.group({
      locationType: ['mobile', Validators.required],
      street: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      shopLocationId: [''],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\+]?[(]?[\+]?\d{3}[)]?[-\s\.]?\d{3}[-\s\.]?\d{4}$/)]],
      preferredContact: ['email', Validators.required],
      specialInstructions: ['']
    });
    
    // Step 5: Confirmation
    this.step5Form = this.fb.group({
      termsAccepted: [false, Validators.requiredTrue],
      marketingOptIn: [false],
      specialRequests: [''],
      reminderEmail: [true],
      reminderSms: [false],
      reminderDays: [[1, 7]] // 1 day and 7 days before
    });
  }
  
  private setupSubscriptions(): void {
    // Sync form changes with service state
    this.setupFormSynchronization();
    
    // Handle pricing updates
    this.setupPricingUpdates();
    
    // Handle validation errors
    this.setupValidationHandling();
    
    // Handle step changes
    this.currentStep$.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged()
    ).subscribe(step => {
      this.onStepChange(step);
    });
  }
  
  private setupFormSynchronization(): void {
    // Step 1 form changes
    this.step1Form.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(values => {
      if (values.selectedServiceId) {
        this.availableServices$.pipe(
          map(services => services.find(s => s.id === values.selectedServiceId)),
          takeUntil(this.destroy$)
        ).subscribe(service => {
          if (service) {
            this.bookingService.selectService(service);
          }
        });
      }
      
      if (values.selectedLevelId) {
        this.availableLevels$.pipe(
          map(levels => levels.find(l => l.id === values.selectedLevelId)),
          takeUntil(this.destroy$)
        ).subscribe(level => {
          if (level) {
            this.bookingService.selectServiceLevel(level);
          }
        });
      }
    });
    
    // Step 2 form changes
    this.step2Form.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(500)
    ).subscribe(values => {
      if (values.selectedVehicleId) {
        this.savedVehicles$.pipe(
          map(vehicles => vehicles.find(v => v.id === values.selectedVehicleId)),
          takeUntil(this.destroy$)
        ).subscribe(vehicle => {
          if (vehicle) {
            this.bookingService.selectVehicle(vehicle);
            this.populateVehicleForm(vehicle);
          }
        });
      }
    });
    
    // Step 4 location type changes
    this.step4Form.get('locationType')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged()
    ).subscribe(type => {
      this.selectedLocationType = type;
      this.updateLocationValidation(type);
    });
  }
  
  private setupPricingUpdates(): void {
    // Auto-calculate pricing when relevant data changes
    combineLatest([
      this.formData$,
      this.currentStep$
    ]).pipe(
      takeUntil(this.destroy$),
      debounceTime(500),
      switchMap(([formData, currentStep]) => {
        if (currentStep >= 2 && 
            formData.step1.selectedService && 
            formData.step1.selectedLevel && 
            formData.step2.selectedVehicle) {
          return this.bookingService.calculatePricing();
        }
        return [];
      }),
      catchError(error => {
        console.warn('Pricing calculation error:', error);
        return [];
      })
    ).subscribe();
  }
  
  private setupValidationHandling(): void {
    // Display validation errors
    this.validationErrors$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(errors => {
      this.displayValidationErrors(errors);
    });
  }
  
  private handlePreselectedService(): void {
    const preSelectedServiceId = this.route.snapshot.queryParams['service'];
    if (preSelectedServiceId) {
      this.step1Form.patchValue({ selectedServiceId: preSelectedServiceId });
    }
  }
  
  // Navigation Methods
  
  public nextStep(): void {
    this.bookingService.nextStep().subscribe({
      next: () => {
        // Step completed successfully
      },
      error: (error) => {
        console.error('Navigation error:', error);
      }
    });
  }
  
  public previousStep(): void {
    this.bookingService.previousStep().subscribe();
  }
  
  public goToStep(step: number): void {
    this.bookingService.goToStep(step).subscribe({
      error: (error) => {
        console.error('Step navigation error:', error);
      }
    });
  }
  
  private onStepChange(step: number): void {
    // Handle step-specific initialization
    switch (step) {
      case BOOKING_STEPS.SERVICE_SELECTION:
        this.initializeStep1();
        break;
      case BOOKING_STEPS.VEHICLE_INFO:
        this.initializeStep2();
        break;
      case BOOKING_STEPS.DATE_TIME:
        this.initializeStep3();
        break;
      case BOOKING_STEPS.LOCATION_CONTACT:
        this.initializeStep4();
        break;
      case BOOKING_STEPS.CONFIRMATION:
        this.initializeStep5();
        break;
    }
  }
  
  // Step-specific initialization
  
  private initializeStep1(): void {
    this.showPricing = false;
  }
  
  private initializeStep2(): void {
    // Load saved vehicles if not already loaded
    this.savedVehicles$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(vehicles => {
      if (vehicles.length === 0) {
        this.apiService.getCustomerVehicles().subscribe();
      }
    });
  }
  
  private initializeStep3(): void {
    this.generateCalendar();
  }
  
  private initializeStep4(): void {
    this.updateLocationValidation(this.selectedLocationType);
    this.showPricing = true;
  }
  
  private initializeStep5(): void {
    this.showPricing = true;
  }
  
  // Service Selection (Step 1)
  
  public selectService(service: ServiceType): void {
    this.step1Form.patchValue({ selectedServiceId: service.id });
  }
  
  public selectServiceLevel(level: ServiceLevel): void {
    this.step1Form.patchValue({ selectedLevelId: level.id });
  }
  
  // Vehicle Management (Step 2)
  
  public selectExistingVehicle(vehicle: Vehicle): void {
    this.step2Form.patchValue({ selectedVehicleId: vehicle.id });
    this.isAddingNewVehicle = false;
  }
  
  public toggleAddNewVehicle(): void {
    this.isAddingNewVehicle = !this.isAddingNewVehicle;
    if (this.isAddingNewVehicle) {
      this.step2Form.patchValue({ selectedVehicleId: '' });
    }
  }
  
  public saveNewVehicle(): void {
    if (this.step2Form.valid) {
      const vehicleData: Vehicle = {
        make: this.step2Form.value.make,
        model: this.step2Form.value.model,
        year: parseInt(this.step2Form.value.year),
        color: this.step2Form.value.color,
        licensePlate: this.step2Form.value.licensePlate,
        vehicleType: this.step2Form.value.vehicleType,
        sizeCategory: this.step2Form.value.sizeCategory,
        condition: this.step2Form.value.condition,
        notes: this.step2Form.value.notes
      };
      
      this.bookingService.addNewVehicle(vehicleData).subscribe({
        next: (savedVehicle) => {
          this.isAddingNewVehicle = false;
          this.step2Form.patchValue({ selectedVehicleId: savedVehicle.id });
        },
        error: (error) => {
          console.error('Failed to save vehicle:', error);
        }
      });
    }
  }
  
  private populateVehicleForm(vehicle: Vehicle): void {
    this.step2Form.patchValue({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      licensePlate: vehicle.licensePlate,
      vehicleType: vehicle.vehicleType,
      sizeCategory: vehicle.sizeCategory,
      condition: vehicle.condition || 'good',
      notes: vehicle.notes || ''
    });
  }
  
  // Date and Time Selection (Step 3)
  
  public selectDate(date: Date): void {
    this.step3Form.patchValue({ 
      selectedDate: date, 
      selectedTimeSlot: null 
    });
    this.bookingService.selectDate(date);
  }
  
  public selectTimeSlot(slot: TimeSlot): void {
    this.step3Form.patchValue({ selectedTimeSlot: slot });
    this.bookingService.selectTimeSlot(slot);
  }
  
  public previousMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }
  
  public nextMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }
  
  private generateCalendar(): void {
    const year = this.selectedMonth.getFullYear();
    const month = this.selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    this.calendarDays = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      this.calendarDays.push(date);
    }
  }
  
  public isDateAvailable(date: Date): boolean {
    // Check if date has available slots
    const availableDays = this.bookingService.currentState.formData.step3.availableDays;
    const dayData = availableDays.find(d => 
      new Date(d.date).toDateString() === date.toDateString()
    );
    return dayData ? !dayData.fullyBooked : true;
  }
  
  public isDateSelected(date: Date): boolean {
    const selectedDate = this.step3Form.value.selectedDate;
    return selectedDate && new Date(selectedDate).toDateString() === date.toDateString();
  }
  
  // Location and Contact (Step 4)
  
  public updateLocation(type: 'mobile' | 'shop'): void {
    this.step4Form.patchValue({ locationType: type });
    this.selectedLocationType = type;
  }
  
  private updateLocationValidation(type: 'mobile' | 'shop'): void {
    const streetControl = this.step4Form.get('street');
    const cityControl = this.step4Form.get('city');
    const stateControl = this.step4Form.get('state');
    const zipControl = this.step4Form.get('zipCode');
    
    if (type === 'mobile') {
      streetControl?.setValidators([Validators.required]);
      cityControl?.setValidators([Validators.required]);
      stateControl?.setValidators([Validators.required]);
      zipControl?.setValidators([Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]);
    } else {
      streetControl?.clearValidators();
      cityControl?.clearValidators();
      stateControl?.clearValidators();
      zipControl?.clearValidators();
    }
    
    streetControl?.updateValueAndValidity();
    cityControl?.updateValueAndValidity();
    stateControl?.updateValueAndValidity();
    zipControl?.updateValueAndValidity();
  }
  
  // Booking Submission (Step 5)
  
  public submitBooking(): void {
    if (this.step5Form.valid) {
      this.submissionError = null;
      
      this.bookingService.submitBooking().subscribe({
        next: (response: BookingCreationResponse) => {
          this.handleBookingSuccess(response);
        },
        error: (error) => {
          this.submissionError = error.message || 'Failed to submit booking';
        }
      });
    }
  }
  
  private handleBookingSuccess(response: BookingCreationResponse): void {
    // Create reminder settings from form
    const reminderSettings: ReminderSettings = {
      email: this.step5Form.value.reminderEmail,
      sms: this.step5Form.value.reminderSms,
      daysBefore: this.step5Form.value.reminderDays || [1]
    };
    
    // Process confirmation
    this.confirmationService.processBookingConfirmation(response, reminderSettings).subscribe({
      next: (confirmationData: BookingConfirmationData) => {
        this.confirmationData$.next(confirmationData);
        this.showConfirmation = true;
        
        // Navigate to confirmation page after delay
        setTimeout(() => {
          this.router.navigate(['/booking/confirmation', response.confirmationNumber]);
        }, 3000);
      },
      error: (error) => {
        console.error('Confirmation processing error:', error);
        // Still show success but with warning about notifications
      }
    });
  }
  
  // Utility Methods
  
  private displayValidationErrors(errors: BookingValidationError[]): void {
    // Group errors by step and field for display
    const errorsByStep = errors.reduce((acc, error) => {
      if (!acc[error.step]) acc[error.step] = {};
      if (!acc[error.step][error.field]) acc[error.step][error.field] = [];
      acc[error.step][error.field].push(error.message);
      return acc;
    }, {} as Record<number, Record<string, string[]>>);
    
    // You can implement UI error display logic here
    console.log('Validation errors:', errorsByStep);
  }
  
  public formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
  
  public formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  }
  
  public formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date));
  }
  
  public getStepTitle(step: number): string {
    const titles: Record<number, string> = {
      [BOOKING_STEPS.SERVICE_SELECTION]: 'Choose Your Service',
      [BOOKING_STEPS.VEHICLE_INFO]: 'Vehicle Information',
      [BOOKING_STEPS.DATE_TIME]: 'Select Date & Time',
      [BOOKING_STEPS.LOCATION_CONTACT]: 'Location & Contact',
      [BOOKING_STEPS.CONFIRMATION]: 'Review & Confirm'
    };
    return titles[step] || `Step ${step}`;
  }
  
  public isStepCompleted(step: number): boolean {
    const currentState = this.bookingService.currentState;
    return this.validationService.isStepValid(step, currentState.formData);
  }
  
  public isStepAccessible(step: number): boolean {
    const currentStep = this.bookingService.currentState.currentStep;
    return step <= currentStep || this.isStepCompleted(step - 1);
  }
  
  // Reset booking
  public resetBooking(): void {
    if (confirm('Are you sure you want to start over? All entered information will be lost.')) {
      this.bookingService.resetBooking();
      this.step1Form.reset();
      this.step2Form.reset();
      this.step3Form.reset();
      this.step4Form.reset();
      this.step5Form.reset();
      this.showConfirmation = false;
      this.submissionError = null;
    }
  }
}