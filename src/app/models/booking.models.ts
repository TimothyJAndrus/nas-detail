// Booking system models and interfaces

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  duration: number; // in minutes
  category: 'exterior' | 'interior' | 'full' | 'specialty';
  available: boolean;
}

export interface ServiceLevel {
  id: string;
  name: string;
  description: string;
  priceMultiplier: number;
  features: string[];
}

export interface Vehicle {
  id?: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vehicleType: 'sedan' | 'suv' | 'truck' | 'coupe' | 'convertible' | 'van' | 'motorcycle' | 'other';
  sizeCategory: 'small' | 'medium' | 'large' | 'xlarge';
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
}

export interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  available: boolean;
  price?: number; // surge pricing or time-based pricing
}

export interface AvailableDay {
  date: Date;
  slots: TimeSlot[];
  fullyBooked: boolean;
}

export interface Location {
  type: 'mobile' | 'shop';
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  shopLocation?: {
    id: string;
    name: string;
    address: string;
    phone: string;
    hours: string;
  };
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContact: 'email' | 'phone' | 'text';
  specialInstructions?: string;
}

export interface BookingStep1Data {
  selectedService: ServiceType | null;
  selectedLevel: ServiceLevel | null;
  preSelectedService?: string;
}

export interface BookingStep2Data {
  selectedVehicle: Vehicle | null;
  isNewVehicle: boolean;
  vehicles: Vehicle[];
}

export interface BookingStep3Data {
  selectedDate: Date | null;
  selectedTimeSlot: TimeSlot | null;
  availableDays: AvailableDay[];
}

export interface BookingStep4Data {
  location: Location;
  contactInfo: ContactInfo;
}

export interface BookingStep5Data {
  termsAccepted: boolean;
  marketingOptIn: boolean;
  specialRequests?: string;
}

export interface BookingFormData {
  step1: BookingStep1Data;
  step2: BookingStep2Data;
  step3: BookingStep3Data;
  step4: BookingStep4Data;
  step5: BookingStep5Data;
}

export interface PricingBreakdown {
  servicePrice: number;
  levelMultiplier: number;
  vehicleSizeMultiplier: number;
  timeSlotSurcharge: number;
  locationSurcharge: number;
  taxes: number;
  discounts: number;
  total: number;
}

export interface Booking {
  id?: string;
  customerId?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  service: ServiceType;
  serviceLevel: ServiceLevel;
  vehicle: Vehicle;
  scheduledDate: Date;
  timeSlot: TimeSlot;
  location: Location;
  contactInfo: ContactInfo;
  pricing: PricingBreakdown;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'card' | 'cash' | 'check';
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  rating?: number;
  review?: string;
}

export interface BookingValidationError {
  step: number;
  field: string;
  message: string;
  code: string;
}

export interface BookingState {
  currentStep: number;
  isLoading: boolean;
  formData: BookingFormData;
  validationErrors: BookingValidationError[];
  pricing: PricingBreakdown | null;
  availableServices: ServiceType[];
  availableLevels: ServiceLevel[];
  savedVehicles: Vehicle[];
  isSubmitting: boolean;
  submissionError: string | null;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BookingCreationResponse {
  booking: Booking;
  confirmationNumber: string;
  estimatedArrival?: Date;
  paymentRequired: boolean;
  nextSteps: string[];
}

export interface AvailabilityRequest {
  serviceId: string;
  vehicleSize: string;
  locationType: 'mobile' | 'shop';
  preferredDate?: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface AvailabilityResponse {
  availableDays: AvailableDay[];
  nextAvailableDate?: Date;
  blackoutDates: Date[];
  timeZone: string;
}

// Form validation interfaces
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any, formData?: BookingFormData) => string | null;
}

export interface StepValidation {
  [fieldName: string]: ValidationRule[];
}

export interface BookingValidationSchema {
  step1: StepValidation;
  step2: StepValidation;
  step3: StepValidation;
  step4: StepValidation;
  step5: StepValidation;
}

// Event interfaces for booking flow
export interface BookingEvent {
  type: 'step_changed' | 'data_updated' | 'validation_error' | 'submission_started' | 'submission_completed' | 'submission_failed';
  step?: number;
  data?: Partial<BookingFormData>;
  error?: BookingValidationError | string;
  timestamp: Date;
}

// Customer preferences
export interface CustomerPreferences {
  preferredServices: string[];
  savedVehicles: Vehicle[];
  defaultLocation: Location;
  contactPreferences: ContactInfo;
  marketingOptIn: boolean;
  reminderPreferences: {
    email: boolean;
    sms: boolean;
    daysBefore: number;
  };
}

// Notification interfaces
export interface NotificationTemplate {
  id: string;
  type: 'booking_confirmation' | 'reminder' | 'arrival_notice' | 'completion' | 'follow_up' | 'cancellation';
  subject: string;
  content: string;
  variables: string[];
}

export interface NotificationRequest {
  templateId: string;
  recipient: {
    email: string;
    phone?: string;
    name: string;
  };
  variables: Record<string, any>;
  scheduledFor?: Date;
  channel: 'email' | 'sms' | 'push';
}

// Analytics and reporting
export interface BookingAnalytics {
  conversionRate: number;
  averageBookingValue: number;
  popularServices: ServiceType[];
  peakTimes: TimeSlot[];
  cancellationRate: number;
  customerSatisfaction: number;
}

export interface BookingMetrics {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  revenue: number;
  averageRating: number;
  repeatCustomers: number;
}

// Error handling
export interface BookingError extends Error {
  code: string;
  step?: number;
  field?: string;
  details?: any;
  userMessage: string;
}

// Utility types
export type BookingStepData = BookingStep1Data | BookingStep2Data | BookingStep3Data | BookingStep4Data | BookingStep5Data;

export type BookingStatus = Booking['status'];
export type PaymentStatus = Booking['paymentStatus'];
export type ServiceCategory = ServiceType['category'];
export type VehicleType = Vehicle['vehicleType'];
export type LocationType = Location['type'];
export type ContactMethod = ContactInfo['preferredContact'];

// Constants
export const BOOKING_STEPS = {
  SERVICE_SELECTION: 1,
  VEHICLE_INFO: 2,
  DATE_TIME: 3,
  LOCATION_CONTACT: 4,
  CONFIRMATION: 5
} as const;

export const MAX_BOOKING_STEPS = Object.keys(BOOKING_STEPS).length;

export const VEHICLE_SIZE_MULTIPLIERS = {
  small: 1.0,
  medium: 1.2,
  large: 1.5,
  xlarge: 2.0
} as const;

export const LOCATION_SURCHARGES = {
  mobile: 25, // $25 surcharge for mobile service
  shop: 0    // No surcharge for shop service
} as const;