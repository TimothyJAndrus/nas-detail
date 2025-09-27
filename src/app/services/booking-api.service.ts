import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, delay, tap } from 'rxjs/operators';
import {
  ApiResponse,
  ServiceType,
  ServiceLevel,
  Vehicle,
  Booking,
  BookingCreationResponse,
  AvailabilityRequest,
  AvailabilityResponse,
  TimeSlot,
  AvailableDay,
  PricingBreakdown,
  CustomerPreferences,
  NotificationRequest,
  BookingAnalytics,
  BookingMetrics
} from '../models/booking.models';

@Injectable({
  providedIn: 'root'
})
export class BookingApiService {
  private readonly apiBaseUrl = '/api/bookings';
  private readonly servicesUrl = `${this.apiBaseUrl}/services`;
  private readonly vehiclesUrl = `${this.apiBaseUrl}/vehicles`;
  private readonly availabilityUrl = `${this.apiBaseUrl}/availability`;
  private readonly customersUrl = `${this.apiBaseUrl}/customers`;
  private readonly notificationsUrl = `${this.apiBaseUrl}/notifications`;
  private readonly analyticsUrl = `${this.apiBaseUrl}/analytics`;

  // Cache for frequently accessed data
  private servicesCache = new BehaviorSubject<ServiceType[] | null>(null);
  private vehiclesCache = new BehaviorSubject<Vehicle[] | null>(null);

  constructor(private http: HttpClient) {}

  // Services API

  /**
   * Get all available services
   */
  getServices(): Observable<ServiceType[]> {
    // Check cache first
    const cachedServices = this.servicesCache.value;
    if (cachedServices) {
      return of(cachedServices);
    }

    return this.http.get<ApiResponse<ServiceType[]>>(this.servicesUrl).pipe(
      map(response => this.handleApiResponse(response)),
      tap(services => this.servicesCache.next(services)),
      catchError(() => this.getMockServices())
    );
  }

  /**
   * Get service by ID
   */
  getService(serviceId: string): Observable<ServiceType> {
    return this.http.get<ApiResponse<ServiceType>>(`${this.servicesUrl}/${serviceId}`).pipe(
      map(response => this.handleApiResponse(response)),
      catchError(() => {
        const mockServices = this.getMockServicesSync();
        const service = mockServices.find(s => s.id === serviceId);
        if (service) {
          return of(service);
        }
        return throwError(() => new Error(`Service not found: ${serviceId}`));
      })
    );
  }

  /**
   * Get service levels for a specific service
   */
  getServiceLevels(serviceId: string): Observable<ServiceLevel[]> {
    return this.http.get<ApiResponse<ServiceLevel[]>>(`${this.servicesUrl}/${serviceId}/levels`).pipe(
      map(response => this.handleApiResponse(response)),
      catchError(() => this.getMockServiceLevels())
    );
  }

  // Vehicle API

  /**
   * Get saved vehicles for a customer
   */
  getCustomerVehicles(customerId?: string): Observable<Vehicle[]> {
    // Check cache first
    const cachedVehicles = this.vehiclesCache.value;
    if (cachedVehicles) {
      return of(cachedVehicles);
    }

    const params = customerId ? new HttpParams().set('customerId', customerId) : new HttpParams();
    
    return this.http.get<ApiResponse<Vehicle[]>>(this.vehiclesUrl, { params }).pipe(
      map(response => this.handleApiResponse(response)),
      tap(vehicles => this.vehiclesCache.next(vehicles)),
      catchError(() => of(this.getMockVehiclesSync()))
    );
  }

  /**
   * Save a new vehicle
   */
  saveVehicle(vehicle: Vehicle): Observable<Vehicle> {
    return this.http.post<ApiResponse<Vehicle>>(this.vehiclesUrl, vehicle).pipe(
      map(response => this.handleApiResponse(response)),
      tap(savedVehicle => {
        // Update cache
        const currentVehicles = this.vehiclesCache.value || [];
        this.vehiclesCache.next([...currentVehicles, savedVehicle]);
      }),
      catchError(() => {
        // Mock save - return vehicle with generated ID
        const savedVehicle = { ...vehicle, id: this.generateId() };
        // Simulate API delay
        return of(savedVehicle).pipe(delay(500));
      })
    );
  }

  /**
   * Update an existing vehicle
   */
  updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.put<ApiResponse<Vehicle>>(`${this.vehiclesUrl}/${vehicleId}`, updates).pipe(
      map(response => this.handleApiResponse(response)),
      tap(updatedVehicle => {
        // Update cache
        const currentVehicles = this.vehiclesCache.value || [];
        const index = currentVehicles.findIndex(v => v.id === vehicleId);
        if (index >= 0) {
          currentVehicles[index] = updatedVehicle;
          this.vehiclesCache.next([...currentVehicles]);
        }
      })
    );
  }

  /**
   * Delete a vehicle
   */
  deleteVehicle(vehicleId: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.vehiclesUrl}/${vehicleId}`).pipe(
      map(response => this.handleApiResponse(response)),
      tap(() => {
        // Update cache
        const currentVehicles = this.vehiclesCache.value || [];
        this.vehiclesCache.next(currentVehicles.filter(v => v.id !== vehicleId));
      })
    );
  }

  // Availability API

  /**
   * Check availability for specific criteria
   */
  checkAvailability(request: AvailabilityRequest): Observable<AvailabilityResponse> {
    return this.http.post<ApiResponse<AvailabilityResponse>>(this.availabilityUrl, request).pipe(
      map(response => this.handleApiResponse(response)),
      catchError(() => this.getMockAvailability(request))
    );
  }

  /**
   * Get available time slots for a specific date
   */
  getAvailableSlots(date: Date, serviceId: string, vehicleSize: string, locationType: 'mobile' | 'shop'): Observable<TimeSlot[]> {
    const params = new HttpParams()
      .set('date', date.toISOString().split('T')[0])
      .set('serviceId', serviceId)
      .set('vehicleSize', vehicleSize)
      .set('locationType', locationType);

    return this.http.get<ApiResponse<TimeSlot[]>>(`${this.availabilityUrl}/slots`, { params }).pipe(
      map(response => this.handleApiResponse(response)),
      catchError(() => this.getMockTimeSlots(date))
    );
  }

  // Booking API

  /**
   * Create a new booking
   */
  createBooking(booking: Partial<Booking>): Observable<BookingCreationResponse> {
    return this.http.post<ApiResponse<BookingCreationResponse>>(this.apiBaseUrl, booking).pipe(
      map(response => this.handleApiResponse(response)),
      catchError(() => this.getMockBookingCreationResponse(booking))
    );
  }

  /**
   * Get booking by ID
   */
  getBooking(bookingId: string): Observable<Booking> {
    return this.http.get<ApiResponse<Booking>>(`${this.apiBaseUrl}/${bookingId}`).pipe(
      map(response => this.handleApiResponse(response))
    );
  }

  /**
   * Update booking
   */
  updateBooking(bookingId: string, updates: Partial<Booking>): Observable<Booking> {
    return this.http.put<ApiResponse<Booking>>(`${this.apiBaseUrl}/${bookingId}`, updates).pipe(
      map(response => this.handleApiResponse(response))
    );
  }

  /**
   * Cancel booking
   */
  cancelBooking(bookingId: string, reason?: string): Observable<boolean> {
    const body = { reason };
    return this.http.post<ApiResponse<boolean>>(`${this.apiBaseUrl}/${bookingId}/cancel`, body).pipe(
      map(response => this.handleApiResponse(response))
    );
  }

  /**
   * Get customer bookings
   */
  getCustomerBookings(customerId: string, status?: string): Observable<Booking[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ApiResponse<Booking[]>>(`${this.customersUrl}/${customerId}/bookings`, { params }).pipe(
      map(response => this.handleApiResponse(response))
    );
  }

  // Pricing API

  /**
   * Calculate pricing for a booking
   */
  calculatePricing(
    serviceId: string,
    serviceLevelId: string,
    vehicleSize: string,
    locationType: 'mobile' | 'shop',
    timeSlot?: TimeSlot,
    promoCode?: string
  ): Observable<PricingBreakdown> {
    const body = {
      serviceId,
      serviceLevelId,
      vehicleSize,
      locationType,
      timeSlot,
      promoCode
    };

    return this.http.post<ApiResponse<PricingBreakdown>>(`${this.apiBaseUrl}/pricing`, body).pipe(
      map(response => this.handleApiResponse(response)),
      catchError(() => this.getMockPricing(serviceId, serviceLevelId, vehicleSize, locationType))
    );
  }

  // Customer API

  /**
   * Get customer preferences
   */
  getCustomerPreferences(customerId: string): Observable<CustomerPreferences> {
    return this.http.get<ApiResponse<CustomerPreferences>>(`${this.customersUrl}/${customerId}/preferences`).pipe(
      map(response => this.handleApiResponse(response))
    );
  }

  /**
   * Update customer preferences
   */
  updateCustomerPreferences(customerId: string, preferences: Partial<CustomerPreferences>): Observable<CustomerPreferences> {
    return this.http.put<ApiResponse<CustomerPreferences>>(`${this.customersUrl}/${customerId}/preferences`, preferences).pipe(
      map(response => this.handleApiResponse(response))
    );
  }

  // Notifications API

  /**
   * Send notification
   */
  sendNotification(request: NotificationRequest): Observable<boolean> {
    return this.http.post<ApiResponse<boolean>>(this.notificationsUrl, request).pipe(
      map(response => this.handleApiResponse(response))
    );
  }

  /**
   * Get notification templates
   */
  getNotificationTemplates(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.notificationsUrl}/templates`).pipe(
      map(response => this.handleApiResponse(response))
    );
  }

  // Analytics API

  /**
   * Get booking analytics
   */
  getBookingAnalytics(startDate?: Date, endDate?: Date): Observable<BookingAnalytics> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate.toISOString());
    if (endDate) params = params.set('endDate', endDate.toISOString());

    return this.http.get<ApiResponse<BookingAnalytics>>(this.analyticsUrl, { params }).pipe(
      map(response => this.handleApiResponse(response))
    );
  }

  /**
   * Get booking metrics
   */
  getBookingMetrics(period: 'day' | 'week' | 'month' | 'year' = 'month'): Observable<BookingMetrics> {
    const params = new HttpParams().set('period', period);

    return this.http.get<ApiResponse<BookingMetrics>>(`${this.analyticsUrl}/metrics`, { params }).pipe(
      map(response => this.handleApiResponse(response))
    );
  }

  // Payment API

  /**
   * Process payment for booking
   */
  processPayment(bookingId: string, paymentMethod: any, amount: number): Observable<any> {
    const body = {
      bookingId,
      paymentMethod,
      amount
    };

    return this.http.post<ApiResponse<any>>(`${this.apiBaseUrl}/payment`, body).pipe(
      map(response => this.handleApiResponse(response))
    );
  }

  /**
   * Refund payment
   */
  refundPayment(bookingId: string, amount?: number, reason?: string): Observable<any> {
    const body = { amount, reason };

    return this.http.post<ApiResponse<any>>(`${this.apiBaseUrl}/${bookingId}/refund`, body).pipe(
      map(response => this.handleApiResponse(response))
    );
  }

  // Location Services

  /**
   * Get service areas
   */
  getServiceAreas(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiBaseUrl}/service-areas`).pipe(
      map(response => this.handleApiResponse(response))
    );
  }

  /**
   * Check if location is serviceable
   */
  checkServiceability(address: string): Observable<boolean> {
    const params = new HttpParams().set('address', address);

    return this.http.get<ApiResponse<boolean>>(`${this.apiBaseUrl}/serviceable`, { params }).pipe(
      map(response => this.handleApiResponse(response))
    );
  }

  /**
   * Get estimated travel time
   */
  getEstimatedTravelTime(fromAddress: string, toAddress: string): Observable<number> {
    const params = new HttpParams()
      .set('from', fromAddress)
      .set('to', toAddress);

    return this.http.get<ApiResponse<number>>(`${this.apiBaseUrl}/travel-time`, { params }).pipe(
      map(response => this.handleApiResponse(response))
    );
  }

  // Utility Methods

  private handleApiResponse<T>(response: ApiResponse<T>): T {
    if (!response.success || response.data === undefined) {
      throw new Error(response.error?.message || 'API request failed');
    }
    return response.data;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Cache Management

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.servicesCache.next(null);
    this.vehiclesCache.next(null);
  }

  /**
   * Refresh specific cache
   */
  refreshCache(cacheType: 'services' | 'vehicles'): void {
    switch (cacheType) {
      case 'services':
        this.servicesCache.next(null);
        this.getServices().subscribe();
        break;
      case 'vehicles':
        this.vehiclesCache.next(null);
        this.getCustomerVehicles().subscribe();
        break;
    }
  }

  // Mock Data Methods (for development/testing)

  private getMockServices(): Observable<ServiceType[]> {
    const services = this.getMockServicesSync();
    return of(services).pipe(delay(300));
  }

  private getMockServicesSync(): ServiceType[] {
    return [
      {
        id: '1',
        name: 'Exterior Wash & Wax',
        description: 'Complete exterior cleaning with premium wax protection',
        basePrice: 75,
        duration: 60,
        category: 'exterior',
        available: true
      },
      {
        id: '2',
        name: 'Interior Deep Clean',
        description: 'Thorough interior cleaning including upholstery and dashboard',
        basePrice: 100,
        duration: 90,
        category: 'interior',
        available: true
      },
      {
        id: '3',
        name: 'Full Service Detail',
        description: 'Complete interior and exterior detailing package',
        basePrice: 150,
        duration: 180,
        category: 'full',
        available: true
      },
      {
        id: '4',
        name: 'Paint Correction',
        description: 'Professional paint correction and ceramic coating',
        basePrice: 300,
        duration: 300,
        category: 'specialty',
        available: true
      }
    ];
  }

  private getMockServiceLevels(): Observable<ServiceLevel[]> {
    const levels: ServiceLevel[] = [
      {
        id: 'basic',
        name: 'Basic',
        description: 'Essential service package',
        priceMultiplier: 1.0,
        features: ['Basic wash', 'Vacuum', 'Tire shine', 'Windows cleaned']
      },
      {
        id: 'premium',
        name: 'Premium',
        description: 'Enhanced service with premium products',
        priceMultiplier: 1.3,
        features: ['Premium wash', 'Deep vacuum', 'Tire shine', 'Interior protection', 'Dashboard treatment']
      },
      {
        id: 'ultimate',
        name: 'Ultimate',
        description: 'The complete luxury experience',
        priceMultiplier: 1.6,
        features: ['Ultimate wash', 'Complete detail', 'Protection package', 'Interior/exterior treatment', 'Air freshener']
      }
    ];
    return of(levels).pipe(delay(200));
  }

  private getMockVehiclesSync(): Vehicle[] {
    return [
      {
        id: '1',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        color: 'Silver',
        licensePlate: 'ABC123',
        vehicleType: 'sedan',
        sizeCategory: 'medium',
        condition: 'good'
      },
      {
        id: '2',
        make: 'Honda',
        model: 'CR-V',
        year: 2021,
        color: 'Black',
        licensePlate: 'XYZ789',
        vehicleType: 'suv',
        sizeCategory: 'large',
        condition: 'excellent'
      }
    ];
  }

  private getMockAvailability(request: AvailabilityRequest): Observable<AvailabilityResponse> {
    const startDate = request.preferredDate || new Date();
    const days: AvailableDay[] = [];

    // Generate 7 days of mock availability
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const slots = this.generateMockTimeSlots(date);
      days.push({
        date,
        slots,
        fullyBooked: slots.length === 0
      });
    }

    const response: AvailabilityResponse = {
      availableDays: days,
      nextAvailableDate: days.find(d => !d.fullyBooked)?.date,
      blackoutDates: [],
      timeZone: 'America/New_York'
    };

    return of(response).pipe(delay(400));
  }

  private getMockTimeSlots(date: Date): Observable<TimeSlot[]> {
    const slots = this.generateMockTimeSlots(date);
    return of(slots).pipe(delay(300));
  }

  private generateMockTimeSlots(date: Date): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startHour = 8; // 8 AM
    const endHour = 17; // 5 PM
    const slotDuration = 60; // 60 minutes

    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + slotDuration);

      // Randomly make some slots unavailable
      const available = Math.random() > 0.3; // 70% availability

      slots.push({
        id: `${date.toISOString().split('T')[0]}-${hour}`,
        startTime,
        endTime,
        available,
        price: available && hour > 15 ? 25 : 0 // Rush hour surcharge
      });
    }

    return slots;
  }

  private getMockBookingCreationResponse(booking: Partial<Booking>): Observable<BookingCreationResponse> {
    const response: BookingCreationResponse = {
      booking: {
        ...booking,
        id: this.generateId(),
        customerId: 'mock-customer-id',
        status: 'confirmed',
        paymentStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      } as Booking,
      confirmationNumber: `NAS${Date.now().toString().slice(-6)}`,
      paymentRequired: true,
      nextSteps: [
        'You will receive a confirmation email shortly',
        'Our team will arrive 15 minutes before your scheduled time',
        'Please ensure your vehicle is accessible'
      ]
    };

    return of(response).pipe(delay(800));
  }

  private getMockPricing(
    serviceId: string,
    serviceLevelId: string,
    vehicleSize: string,
    locationType: 'mobile' | 'shop'
  ): Observable<PricingBreakdown> {
    // Mock pricing calculation
    const basePrice = 75;
    const levelMultipliers = { basic: 1.0, premium: 1.3, ultimate: 1.6 };
    const sizeMultipliers = { small: 1.0, medium: 1.2, large: 1.5, xlarge: 2.0 };
    
    const levelMultiplier = levelMultipliers[serviceLevelId as keyof typeof levelMultipliers] || 1.0;
    const vehicleMultiplier = sizeMultipliers[vehicleSize as keyof typeof sizeMultipliers] || 1.0;
    
    const servicePrice = basePrice * levelMultiplier * vehicleMultiplier;
    const locationSurcharge = locationType === 'mobile' ? 25 : 0;
    const taxes = (servicePrice + locationSurcharge) * 0.08;
    const total = servicePrice + locationSurcharge + taxes;

    const pricing: PricingBreakdown = {
      servicePrice,
      levelMultiplier,
      vehicleSizeMultiplier: vehicleMultiplier,
      timeSlotSurcharge: 0,
      locationSurcharge,
      taxes,
      discounts: 0,
      total
    };

    return of(pricing).pipe(delay(300));
  }
}