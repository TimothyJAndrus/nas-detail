import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { 
  Service, 
  ServicePackage, 
  ServiceCategory,
  Booking,
  VehicleInfo,
  BookingLocation,
  TimeSlot,
  BookingStatus,
  PaymentStatus
} from '../models/service.interface';

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  private mockServices: Service[] = [
    {
      id: '1',
      name: 'Express Exterior Wash',
      description: 'Quick and efficient exterior cleaning including pre-rinse, foam wash, wheel cleaning, and drying.',
      shortDescription: 'Basic exterior wash with foam and wheel cleaning',
      price: 49.99,
      duration: 60,
      category: ServiceCategory.EXTERIOR,
      imageUrl: '',
      features: ['Pre-rinse', 'Foam wash', 'Wheel cleaning', 'Hand drying', 'Tire shine'],
      isPopular: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Premium Exterior Detail',
      description: 'Complete exterior detailing service including wash, clay bar treatment, polish, and premium wax.',
      shortDescription: 'Complete exterior wash, clay bar, polish, and wax',
      price: 89.99,
      duration: 180,
      category: ServiceCategory.EXTERIOR,
      imageUrl: '',
      features: ['Pre-rinse', 'Foam wash', 'Clay bar treatment', 'Polish', 'Premium wax', 'Wheel detail', 'Tire shine'],
      isPopular: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: 'Interior Deep Clean',
      description: 'Thorough interior cleaning including vacuuming, steam cleaning, leather/fabric treatment.',
      shortDescription: 'Deep cleaning of all interior surfaces',
      price: 79.99,
      duration: 150,
      category: ServiceCategory.INTERIOR,
      imageUrl: '',
      features: ['Complete vacuuming', 'Steam cleaning', 'Leather treatment', 'Fabric protection', 'Dashboard detailing'],
      isPopular: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      name: 'Full Service Detail',
      description: 'Complete interior and exterior detailing service with protection.',
      shortDescription: 'Complete interior and exterior detailing',
      price: 159.99,
      duration: 240,
      category: ServiceCategory.PREMIUM,
      imageUrl: '',
      features: ['Exterior wash & wax', 'Clay bar treatment', 'Interior deep clean', 'Leather treatment', 'Fabric protection'],
      isPopular: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  constructor() { }

  // Get all active services
  getServices(): Observable<Service[]> {
    return of(this.mockServices).pipe(delay(500));
  }

  // Get services by category
  getServicesByCategory(category: ServiceCategory): Observable<Service[]> {
    const filtered = this.mockServices.filter(service => service.category === category);
    return of(filtered).pipe(delay(500));
  }

  // Get popular services
  getPopularServices(): Observable<Service[]> {
    const popular = this.mockServices.filter(service => service.isPopular);
    return of(popular).pipe(delay(500));
  }

  // Get service by ID
  getServiceById(serviceId: string): Observable<Service> {
    const service = this.mockServices.find(s => s.id === serviceId);
    return of(service!).pipe(delay(500));
  }

  // Get service packages
  getServicePackages(): Observable<ServicePackage[]> {
    const mockPackages: ServicePackage[] = [
      {
        id: 'pkg1',
        name: 'Ultimate Protection Package',
        description: 'Our most comprehensive package including full detail and ceramic coating.',
        services: ['3', '4'],
        totalPrice: 239.98,
        discountPercentage: 15,
        finalPrice: 203.98,
        duration: 300,
        imageUrl: '',
        isPopular: true
      }
    ];
    return of(mockPackages).pipe(delay(500));
  }

  // Get user's vehicles
  getUserVehicles(userId: string): Observable<VehicleInfo[]> {
    const mockVehicles: VehicleInfo[] = [];
    return of(mockVehicles).pipe(delay(500));
  }

  // Get user's locations
  getUserLocations(userId: string): Observable<BookingLocation[]> {
    const mockLocations: BookingLocation[] = [];
    return of(mockLocations).pipe(delay(500));
  }

  // Add vehicle for user
  addVehicle(userId: string, vehicle: Omit<VehicleInfo, 'id'>): Observable<VehicleInfo> {
    const newVehicle: VehicleInfo = {
      ...vehicle,
      id: 'vehicle_' + Math.random().toString(36).substring(7)
    };
    return of(newVehicle).pipe(delay(1000));
  }

  // Add location for user
  addLocation(userId: string, location: Omit<BookingLocation, 'id'>): Observable<BookingLocation> {
    const newLocation: BookingLocation = {
      ...location,
      id: 'location_' + Math.random().toString(36).substring(7)
    };
    return of(newLocation).pipe(delay(1000));
  }

  // Create booking
  createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Observable<Booking> {
    const newBooking: Booking = {
      ...booking,
      id: 'booking_' + Math.random().toString(36).substring(7),
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return of(newBooking).pipe(delay(1000));
  }

  // Get user bookings
  getUserBookings(userId: string): Observable<Booking[]> {
    const mockBookings: Booking[] = [];
    return of(mockBookings).pipe(delay(500));
  }

  // Update booking status
  updateBookingStatus(bookingId: string, status: BookingStatus): Observable<Booking> {
    // This would be implemented with real backend
    const mockBooking = {} as Booking;
    return of(mockBooking).pipe(delay(1000));
  }

  // Get available time slots for a date
  getAvailableTimeSlots(date: Date): Observable<TimeSlot[]> {
    const mockSlots: TimeSlot[] = [
      { date: date.toISOString().split('T')[0], time: '09:00', available: true },
      { date: date.toISOString().split('T')[0], time: '11:00', available: true },
      { date: date.toISOString().split('T')[0], time: '14:00', available: false },
      { date: date.toISOString().split('T')[0], time: '16:00', available: true }
    ];
    return of(mockSlots).pipe(delay(500));
  }
}