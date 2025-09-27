export interface Service {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  duration: number; // in minutes
  category: ServiceCategory;
  imageUrl: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ServiceCategory {
  EXTERIOR = 'exterior',
  INTERIOR = 'interior',
  PROTECTION = 'protection',
  MAINTENANCE = 'maintenance',
  PREMIUM = 'premium'
}

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  services: string[]; // service IDs
  totalPrice: number;
  discountPercentage: number;
  finalPrice: number;
  duration: number;
  imageUrl: string;
  isPopular: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  serviceId?: string;
  packageId?: string;
  scheduledDateTime: Date;
  status: BookingStatus;
  vehicleInfo: VehicleInfo;
  location: BookingLocation;
  specialInstructions?: string;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  completedAt?: Date;
  technicianId?: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  customerNotes?: string;
  technicianNotes?: string;
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed'
}

export interface VehicleInfo {
  id?: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vehicleType: VehicleType;
  condition?: VehicleCondition;
}

export enum VehicleType {
  SEDAN = 'sedan',
  SUV = 'suv',
  TRUCK = 'truck',
  COUPE = 'coupe',
  CONVERTIBLE = 'convertible',
  WAGON = 'wagon',
  VAN = 'van',
  MOTORCYCLE = 'motorcycle'
}

export enum VehicleCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor'
}

export interface BookingLocation {
  id?: string;
  type: LocationType;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  accessInstructions?: string;
}

export enum LocationType {
  HOME = 'home',
  OFFICE = 'office',
  OTHER = 'other'
}

export interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
  technicianId?: string;
}