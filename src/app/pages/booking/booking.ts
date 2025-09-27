import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  categoryId: string;
  features: string[];
  levels?: ServiceLevel[];
  rating: number;
  reviewCount: number;
  isPopular?: boolean;
}

interface ServiceLevel {
  name: string;
  description: string;
  price: number;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vehicleType: string;
  notes?: string;
}

interface BookingStep {
  id: string;
  title: string;
  description: string;
}

interface CalendarDate {
  day: number;
  date: Date;
  available: boolean;
  isToday?: boolean;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  isPopular?: boolean;
}

@Component({
  selector: 'app-booking',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking.html',
  styleUrl: './booking.scss'
})
export class BookingComponent implements OnInit {
  currentStep = signal(0);
  loading = signal(false);
  
  // Service selection
  preSelectedService = signal<Service | null>(null);
  selectedServiceLevel = signal<ServiceLevel | null>(null);
  availableServices = signal<Service[]>([]);
  
  // Vehicle information
  userVehicles = signal<Vehicle[]>([]);
  selectedVehicle = signal<Vehicle | null>(null);
  vehicleForm: FormGroup;
  availableYears: number[] = [];
  
  // Date & time selection
  selectedDate = signal<CalendarDate | null>(null);
  selectedTimeSlot = signal<TimeSlot | null>(null);
  availableDates = signal<CalendarDate[]>([]);
  availableTimeSlots = signal<TimeSlot[]>([]);
  
  // Location & contact
  selectedLocationType = signal<'mobile' | 'shop'>('mobile');
  contactForm: FormGroup;
  
  bookingSteps: BookingStep[] = [
    { id: 'service', title: 'Service', description: 'Choose your service' },
    { id: 'vehicle', title: 'Vehicle', description: 'Vehicle information' },
    { id: 'datetime', title: 'Date & Time', description: 'Schedule appointment' },
    { id: 'location', title: 'Location', description: 'Service location' },
    { id: 'confirmation', title: 'Confirmation', description: 'Review and confirm' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.vehicleForm = this.createVehicleForm();
    this.contactForm = this.createContactForm();
    this.generateAvailableYears();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.checkForPreSelectedService();
  }

  private loadInitialData(): void {
    this.loadAvailableServices();
    this.loadUserVehicles();
    this.loadAvailableDates();
  }

  private checkForPreSelectedService(): void {
    const serviceId = this.route.snapshot.queryParams['serviceId'];
    if (serviceId) {
      const service = this.availableServices().find(s => s.id === serviceId);
      if (service) {
        this.preSelectedService.set(service);
      }
    }
  }

  private loadAvailableServices(): void {
    // Mock services data - in a real app, this would come from a service
    const mockServices: Service[] = [
      {
        id: '1',
        name: 'Premium Wash & Wax',
        description: 'Complete exterior wash with high-quality carnauba wax protection.',
        price: 149,
        duration: 120,
        categoryId: 'exterior',
        features: ['Hand wash', 'Clay bar', 'Carnauba wax', 'Tire shine'],
        rating: 4.8,
        reviewCount: 124,
        isPopular: true
      },
      {
        id: '2',
        name: 'Interior Deep Clean',
        description: 'Thorough interior cleaning and conditioning.',
        price: 99,
        duration: 90,
        categoryId: 'interior',
        features: ['Vacuum', 'Steam clean', 'Leather conditioning'],
        rating: 4.7,
        reviewCount: 89,
        levels: [
          { name: 'Basic', description: 'Essential cleaning', price: 79 },
          { name: 'Deep', description: 'Comprehensive detailing', price: 99 },
          { name: 'Luxury', description: 'Premium treatment', price: 129 }
        ]
      },
      {
        id: '3',
        name: 'Full Service Detail',
        description: 'Complete interior and exterior detailing package.',
        price: 249,
        duration: 180,
        categoryId: 'premium',
        features: ['Exterior wash & wax', 'Interior cleaning', 'Engine bay'],
        rating: 4.8,
        reviewCount: 156,
        isPopular: true
      }
    ];
    
    this.availableServices.set(mockServices);
  }

  private loadUserVehicles(): void {
    // Mock user vehicles - in a real app, this would come from user's saved vehicles
    const mockVehicles: Vehicle[] = [
      {
        id: '1',
        make: 'Tesla',
        model: 'Model 3',
        year: 2023,
        color: 'White',
        licensePlate: 'TESLA1',
        vehicleType: 'sedan'
      },
      {
        id: '2',
        make: 'BMW',
        model: 'X5',
        year: 2022,
        color: 'Black',
        licensePlate: 'BMW123',
        vehicleType: 'suv'
      }
    ];
    
    this.userVehicles.set(mockVehicles);
  }

  private loadAvailableDates(): void {
    const dates: CalendarDate[] = [];
    const today = new Date();
    
    // Generate next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      dates.push({
        day: date.getDate(),
        date: date,
        available: date.getDay() !== 0 && i > 0, // Not Sunday and not today
        isToday: i === 0
      });
    }
    
    this.availableDates.set(dates);
  }

  private generateAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    
    for (let year = currentYear; year >= currentYear - 30; year--) {
      years.push(year);
    }
    
    this.availableYears = years;
  }

  private createVehicleForm(): FormGroup {
    return this.fb.group({
      make: ['', [Validators.required]],
      model: ['', [Validators.required]],
      year: ['', [Validators.required]],
      color: ['', [Validators.required]],
      licensePlate: ['', [Validators.required]],
      vehicleType: ['', [Validators.required]],
      notes: ['']
    });
  }

  private createContactForm(): FormGroup {
    return this.fb.group({
      contactName: ['John Doe', [Validators.required]],
      contactPhone: ['(555) 123-4567', [Validators.required]],
      address: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      specialInstructions: ['']
    });
  }

  // Step navigation
  nextStep(): void {
    if (this.canProceedToNextStep()) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep()) {
      case 0: // Service selection
        return !!this.getSelectedService();
      case 1: // Vehicle information
        return this.selectedVehicle() !== null || this.vehicleForm.valid;
      case 2: // Date & time
        return !!this.selectedDate() && !!this.selectedTimeSlot();
      case 3: // Location & contact
        return this.contactForm.valid;
      default:
        return true;
    }
  }

  // Service selection methods
  selectService(service: Service): void {
    this.preSelectedService.set(service);
    this.selectedServiceLevel.set(null);
  }

  selectServiceLevel(level: ServiceLevel): void {
    this.selectedServiceLevel.set(level);
  }

  clearServiceSelection(): void {
    this.preSelectedService.set(null);
    this.selectedServiceLevel.set(null);
  }

  getSelectedService(): Service | null {
    return this.preSelectedService();
  }

  hasServiceLevels(): boolean {
    const service = this.preSelectedService();
    return !!(service?.levels && service.levels.length > 0);
  }

  // Vehicle selection methods
  selectExistingVehicle(vehicle: Vehicle): void {
    this.selectedVehicle.set(vehicle);
    this.vehicleForm.reset();
  }

  // Date & time selection methods
  selectDate(date: CalendarDate): void {
    if (!date.available) return;
    
    this.selectedDate.set(date);
    this.selectedTimeSlot.set(null);
    this.loadTimeSlots(date);
  }

  private loadTimeSlots(date: CalendarDate): void {
    // Mock time slots - in a real app, this would check actual availability
    const timeSlots: TimeSlot[] = [
      { id: '1', time: '8:00 AM', available: true },
      { id: '2', time: '10:00 AM', available: true, isPopular: true },
      { id: '3', time: '12:00 PM', available: false },
      { id: '4', time: '2:00 PM', available: true, isPopular: true },
      { id: '5', time: '4:00 PM', available: true },
      { id: '6', time: '6:00 PM', available: true }
    ];
    
    this.availableTimeSlots.set(timeSlots);
  }

  selectTimeSlot(timeSlot: TimeSlot): void {
    if (!timeSlot.available) return;
    this.selectedTimeSlot.set(timeSlot);
  }

  // Location selection methods
  selectLocationType(type: 'mobile' | 'shop'): void {
    this.selectedLocationType.set(type);
    
    if (type === 'shop') {
      // Clear mobile service address fields
      this.contactForm.patchValue({
        address: '',
        city: '',
        state: '',
        zipCode: ''
      });
    }
  }

  // CSS helper methods
  getStepClasses(stepIndex: number): string {
    const current = this.currentStep();
    if (stepIndex < current) {
      return 'bg-green-600 text-white';
    } else if (stepIndex === current) {
      return 'bg-primary-600 text-white';
    } else {
      return 'bg-gray-300 text-gray-600';
    }
  }

  getStepTextClasses(stepIndex: number): string {
    const current = this.currentStep();
    if (stepIndex <= current) {
      return 'text-primary-600';
    } else {
      return 'text-gray-500';
    }
  }

  getConnectorClasses(stepIndex: number): string {
    return stepIndex < this.currentStep() ? 'bg-green-600' : 'bg-gray-300';
  }

  getServiceLevelClasses(level: ServiceLevel): string {
    const isSelected = this.selectedServiceLevel()?.name === level.name;
    return isSelected 
      ? 'border-primary-500 bg-primary-50'
      : 'border-gray-200 hover:border-primary-300';
  }

  getVehicleSelectionClasses(vehicle: Vehicle): string {
    const isSelected = this.selectedVehicle()?.id === vehicle.id;
    return isSelected 
      ? 'border-primary-500 bg-primary-50'
      : 'border-gray-200 hover:border-primary-300';
  }

  getDateClasses(date: CalendarDate): string {
    if (!date.available) {
      return 'bg-gray-100 text-gray-400 cursor-not-allowed';
    }
    
    const isSelected = this.selectedDate()?.date.getTime() === date.date.getTime();
    const isToday = date.isToday;
    
    if (isSelected) {
      return 'bg-primary-600 text-white';
    } else if (isToday) {
      return 'bg-primary-100 text-primary-600 border border-primary-300';
    } else {
      return 'bg-white text-gray-900 hover:bg-primary-50 border border-gray-200';
    }
  }

  getTimeSlotClasses(timeSlot: TimeSlot): string {
    if (!timeSlot.available) {
      return 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed';
    }
    
    const isSelected = this.selectedTimeSlot()?.id === timeSlot.id;
    return isSelected 
      ? 'border-primary-500 bg-primary-50 text-primary-700'
      : 'border-gray-200 hover:border-primary-300 text-gray-900';
  }

  getLocationTypeClasses(type: 'mobile' | 'shop'): string {
    const isSelected = this.selectedLocationType() === type;
    return isSelected 
      ? 'border-primary-500 bg-primary-50'
      : 'border-gray-200 hover:border-primary-300';
  }

  // Utility methods
  formatSelectedDate(date: CalendarDate): string {
    return date.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getSelectedVehicleDisplay(): string {
    const vehicle = this.selectedVehicle();
    if (vehicle) {
      return `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.color})`;
    }
    
    const form = this.vehicleForm.value;
    if (form.make && form.model && form.year) {
      return `${form.year} ${form.make} ${form.model} (${form.color || 'Color TBD'})`;
    }
    
    return 'Vehicle information required';
  }

  getServicePrice(): number {
    const level = this.selectedServiceLevel();
    if (level) {
      return level.price;
    }
    
    const service = this.getSelectedService();
    return service?.price || 0;
  }

  getTaxAmount(): number {
    const basePrice = this.getServicePrice();
    const mobileServiceFee = this.selectedLocationType() === 'mobile' ? 25 : 0;
    return Math.round((basePrice + mobileServiceFee) * 0.08 * 100) / 100; // 8% tax
  }

  getTotalAmount(): number {
    const basePrice = this.getServicePrice();
    const mobileServiceFee = this.selectedLocationType() === 'mobile' ? 25 : 0;
    const tax = this.getTaxAmount();
    return basePrice + mobileServiceFee + tax;
  }

  canConfirmBooking(): boolean {
    return !!(this.getSelectedService() && this.selectedDate() && 
             this.selectedTimeSlot() && this.selectedLocationType());
  }

  // Action methods
  goBack(): void {
    this.router.navigate(['/services']);
  }

  async confirmBooking(): Promise<void> {
    if (!this.canConfirmBooking()) return;
    
    this.loading.set(true);
    
    try {
      // Mock booking confirmation - in a real app, this would call the booking service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to success page or dashboard
      this.router.navigate(['/dashboard'], {
        queryParams: { bookingConfirmed: 'true' }
      });
    } catch (error) {
      console.error('Booking failed:', error);
      // Handle error
    } finally {
      this.loading.set(false);
    }
  }
}
