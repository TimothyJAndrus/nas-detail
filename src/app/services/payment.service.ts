import { Injectable, inject } from '@angular/core';
import { loadStripe, Stripe, StripeCardElement, StripeElements } from '@stripe/stripe-js';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  created: number;
  is_default?: boolean;
}

export interface Subscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  plan: {
    id: string;
    name: string;
    amount: number;
    interval: string;
  };
  payment_method?: PaymentMethod;
}

export interface Invoice {
  id: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: string;
  created: number;
  description?: string;
  invoice_pdf?: string;
  subscription_id?: string;
}

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  created: number;
  type: 'payment' | 'subscription' | 'refund';
  service_name?: string;
  invoice_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private stripe: Stripe | null = null;
  private stripePublishableKey = 'pk_test_51234567890123456789012345678901234567890123456789012345678901234567890123456789'; // Replace with actual key
  
  private paymentMethodsSubject = new BehaviorSubject<PaymentMethod[]>([]);
  private subscriptionsSubject = new BehaviorSubject<Subscription[]>([]);
  private paymentHistorySubject = new BehaviorSubject<PaymentHistoryItem[]>([]);
  
  public paymentMethods$ = this.paymentMethodsSubject.asObservable();
  public subscriptions$ = this.subscriptionsSubject.asObservable();
  public paymentHistory$ = this.paymentHistorySubject.asObservable();

  constructor() {
    this.initializeStripe();
    this.loadMockData(); // For development - replace with real API calls
  }

  private async initializeStripe(): Promise<void> {
    try {
      this.stripe = await loadStripe(this.stripePublishableKey);
      if (!this.stripe) {
        throw new Error('Failed to initialize Stripe');
      }
    } catch (error) {
      console.error('Stripe initialization failed:', error);
      throw error;
    }
  }

  private loadMockData(): void {
    // Mock payment methods
    const mockPaymentMethods: PaymentMethod[] = [
      {
        id: 'pm_1234567890',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025
        },
        created: Date.now(),
        is_default: true
      },
      {
        id: 'pm_0987654321',
        type: 'card',
        card: {
          brand: 'mastercard',
          last4: '5555',
          exp_month: 8,
          exp_year: 2026
        },
        created: Date.now() - 86400000
      }
    ];
    
    // Mock subscriptions
    const mockSubscriptions: Subscription[] = [
      {
        id: 'sub_1234567890',
        status: 'active',
        current_period_start: Date.now(),
        current_period_end: Date.now() + (30 * 24 * 60 * 60 * 1000),
        plan: {
          id: 'plan_premium',
          name: 'Premium Care Plan',
          amount: 2999,
          interval: 'month'
        },
        payment_method: mockPaymentMethods[0]
      }
    ];
    
    // Mock payment history
    const mockPaymentHistory: PaymentHistoryItem[] = [
      {
        id: 'pi_1234567890',
        amount: 14900,
        currency: 'usd',
        description: 'Premium Wash & Wax Service',
        status: 'succeeded',
        created: Date.now() - 86400000,
        type: 'payment',
        service_name: 'Premium Wash & Wax'
      },
      {
        id: 'pi_0987654321',
        amount: 2999,
        currency: 'usd',
        description: 'Premium Care Plan - Monthly',
        status: 'succeeded',
        created: Date.now() - (7 * 86400000),
        type: 'subscription'
      },
      {
        id: 'pi_1357924680',
        amount: 24900,
        currency: 'usd',
        description: 'Full Service Detail',
        status: 'succeeded',
        created: Date.now() - (14 * 86400000),
        type: 'payment',
        service_name: 'Full Service Detail'
      }
    ];
    
    this.paymentMethodsSubject.next(mockPaymentMethods);
    this.subscriptionsSubject.next(mockSubscriptions);
    this.paymentHistorySubject.next(mockPaymentHistory);
  }

  async getStripe(): Promise<Stripe> {
    if (!this.stripe) {
      await this.initializeStripe();
    }
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }
    return this.stripe;
  }

  async createElements(): Promise<StripeElements> {
    const stripe = await this.getStripe();
    return stripe.elements();
  }

  // Payment Intent Management
  async createPaymentIntent(amount: number, currency: string = 'usd', metadata?: any): Promise<PaymentIntent> {
    try {
      // In a real app, this would make an API call to your backend
      // The backend would create the payment intent with Stripe
      const mockPaymentIntent: PaymentIntent = {
        id: `pi_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        amount: amount,
        currency: currency,
        status: 'requires_payment_method',
        client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36)}`
      };
      
      return mockPaymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async confirmPayment(clientSecret: string, paymentMethod: any): Promise<any> {
    const stripe = await this.getStripe();
    
    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return result.paymentIntent;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }

  // Payment Methods Management
  async addPaymentMethod(card: StripeCardElement): Promise<PaymentMethod> {
    const stripe = await this.getStripe();
    
    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: card,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // In a real app, save the payment method to your backend
      const newPaymentMethod: PaymentMethod = {
        id: paymentMethod!.id,
        type: paymentMethod!.type,
        card: paymentMethod!.card ? {
          brand: paymentMethod!.card.brand,
          last4: paymentMethod!.card.last4!,
          exp_month: paymentMethod!.card.exp_month,
          exp_year: paymentMethod!.card.exp_year
        } : undefined,
        created: Date.now()
      };
      
      const currentMethods = this.paymentMethodsSubject.value;
      this.paymentMethodsSubject.next([...currentMethods, newPaymentMethod]);
      
      return newPaymentMethod;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      // In a real app, this would make an API call to delete the payment method
      const currentMethods = this.paymentMethodsSubject.value;
      const updatedMethods = currentMethods.filter(pm => pm.id !== paymentMethodId);
      this.paymentMethodsSubject.next(updatedMethods);
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      const currentMethods = this.paymentMethodsSubject.value;
      const updatedMethods = currentMethods.map(pm => ({
        ...pm,
        is_default: pm.id === paymentMethodId
      }));
      this.paymentMethodsSubject.next(updatedMethods);
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw error;
    }
  }

  // Subscription Management
  async createSubscription(planId: string, paymentMethodId: string): Promise<Subscription> {
    try {
      // In a real app, this would make an API call to your backend
      const mockSubscription: Subscription = {
        id: `sub_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        status: 'active',
        current_period_start: Date.now(),
        current_period_end: Date.now() + (30 * 24 * 60 * 60 * 1000),
        plan: {
          id: planId,
          name: planId === 'plan_premium' ? 'Premium Care Plan' : 'Basic Care Plan',
          amount: planId === 'plan_premium' ? 2999 : 1999,
          interval: 'month'
        }
      };
      
      const currentSubscriptions = this.subscriptionsSubject.value;
      this.subscriptionsSubject.next([...currentSubscriptions, mockSubscription]);
      
      return mockSubscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      // In a real app, this would make an API call to cancel the subscription
      const currentSubscriptions = this.subscriptionsSubject.value;
      const updatedSubscriptions = currentSubscriptions.map(sub => 
        sub.id === subscriptionId ? { ...sub, status: 'canceled' } : sub
      );
      this.subscriptionsSubject.next(updatedSubscriptions);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionId: string, planId: string): Promise<Subscription> {
    try {
      // In a real app, this would make an API call to update the subscription
      const currentSubscriptions = this.subscriptionsSubject.value;
      const updatedSubscriptions = currentSubscriptions.map(sub => {
        if (sub.id === subscriptionId) {
          return {
            ...sub,
            plan: {
              id: planId,
              name: planId === 'plan_premium' ? 'Premium Care Plan' : 'Basic Care Plan',
              amount: planId === 'plan_premium' ? 2999 : 1999,
              interval: 'month'
            }
          };
        }
        return sub;
      });
      
      this.subscriptionsSubject.next(updatedSubscriptions);
      return updatedSubscriptions.find(sub => sub.id === subscriptionId)!;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Invoice and Payment History
  async getInvoices(): Promise<Invoice[]> {
    try {
      // Mock invoices - in a real app, this would fetch from your backend
      return [
        {
          id: 'in_1234567890',
          amount_paid: 2999,
          amount_due: 0,
          currency: 'usd',
          status: 'paid',
          created: Date.now() - 86400000,
          description: 'Premium Care Plan - Monthly',
          invoice_pdf: 'https://invoice.stripe.com/i/acct_1234/test_1234',
          subscription_id: 'sub_1234567890'
        }
      ];
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  async downloadInvoice(invoiceId: string): Promise<string> {
    try {
      // In a real app, this would generate a download URL
      return `https://invoice.stripe.com/i/acct_1234/${invoiceId}`;
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  }

  // Utility Methods
  formatAmount(amount: number, currency: string = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getCardBrandIcon(brand: string): string {
    const icons: { [key: string]: string } = {
      'visa': '💳',
      'mastercard': '💳',
      'amex': '💳',
      'discover': '💳',
      'diners': '💳',
      'jcb': '💳',
      'unionpay': '💳'
    };
    return icons[brand.toLowerCase()] || '💳';
  }

  // Process booking payment
  async processBookingPayment(bookingDetails: any): Promise<any> {
    try {
      const paymentIntent = await this.createPaymentIntent(
        bookingDetails.totalAmount * 100, // Convert to cents
        'usd',
        {
          booking_id: bookingDetails.id,
          service_name: bookingDetails.serviceName,
          customer_email: bookingDetails.customerEmail
        }
      );

      return paymentIntent;
    } catch (error) {
      console.error('Error processing booking payment:', error);
      throw error;
    }
  }

  // Refund processing
  async processRefund(paymentIntentId: string, amount?: number): Promise<any> {
    try {
      // In a real app, this would make an API call to your backend to process the refund
      const mockRefund = {
        id: `re_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        amount: amount || 0,
        currency: 'usd',
        status: 'succeeded',
        created: Date.now(),
        payment_intent: paymentIntentId
      };

      // Add to payment history
      const refundHistoryItem: PaymentHistoryItem = {
        id: mockRefund.id,
        amount: mockRefund.amount,
        currency: mockRefund.currency,
        description: 'Refund processed',
        status: mockRefund.status,
        created: mockRefund.created,
        type: 'refund'
      };

      const currentHistory = this.paymentHistorySubject.value;
      this.paymentHistorySubject.next([refundHistoryItem, ...currentHistory]);

      return mockRefund;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }
}