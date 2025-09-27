import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  clientSecret: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor() { }

  // Create payment intent
  createPaymentIntent(amount: number, currency: string = 'usd'): Observable<PaymentIntent> {
    const mockPaymentIntent: PaymentIntent = {
      id: 'pi_' + Math.random().toString(36).substring(7),
      amount: amount * 100, // Convert to cents
      currency,
      status: 'pending',
      clientSecret: 'pi_' + Math.random().toString(36).substring(7) + '_secret_' + Math.random().toString(36).substring(7)
    };
    
    return of(mockPaymentIntent).pipe(delay(1000));
  }

  // Get saved payment methods
  getPaymentMethods(customerId: string): Observable<PaymentMethod[]> {
    const mockMethods: PaymentMethod[] = [];
    return of(mockMethods).pipe(delay(500));
  }

  // Save payment method
  savePaymentMethod(customerId: string, paymentMethodId: string): Observable<PaymentMethod> {
    const mockMethod: PaymentMethod = {
      id: paymentMethodId,
      type: 'card',
      last4: '4242',
      brand: 'visa',
      expiryMonth: 12,
      expiryYear: 2025
    };
    
    return of(mockMethod).pipe(delay(1000));
  }

  // Process payment
  processPayment(paymentIntentId: string, paymentMethodId: string): Observable<{ status: string }> {
    // This would integrate with Stripe or another payment processor
    return of({ status: 'succeeded' }).pipe(delay(2000));
  }

  // Create subscription
  createSubscription(customerId: string, priceId: string): Observable<{ id: string; status: string }> {
    const mockSubscription = {
      id: 'sub_' + Math.random().toString(36).substring(7),
      status: 'active'
    };
    
    return of(mockSubscription).pipe(delay(1500));
  }

  // Cancel subscription
  cancelSubscription(subscriptionId: string): Observable<{ status: string }> {
    return of({ status: 'canceled' }).pipe(delay(1000));
  }
}