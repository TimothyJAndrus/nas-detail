import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StripeCardElement, StripeElements } from '@stripe/stripe-js';
import { PaymentService, PaymentMethod } from '../../services/payment.service';

interface OrderDetails {
  serviceName: string;
  vehicleInfo?: string;
  dateTime: string;
  location?: string;
  baseAmount: number;
  mobileServiceFee?: number;
  tax: number;
  totalAmount: number;
}

@Component({
  selector: 'app-payment',
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.html',
  styleUrl: './payment.scss'
})
export class PaymentComponent implements OnInit, OnDestroy {
  @Input() orderDetails = signal<OrderDetails | null>(null);
  @Output() paymentSuccess = new EventEmitter<any>();
  @Output() paymentError = new EventEmitter<string>();
  @Output() paymentCancel = new EventEmitter<void>();

  @ViewChild('cardElement', { static: false }) cardElementRef!: ElementRef;

  // State
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  savedPaymentMethods = signal<PaymentMethod[]>([]);
  selectedPaymentMethod = signal<PaymentMethod | null>(null);

  // Form state
  showNewCardForm = false;
  cardholderName = '';
  saveCardForFuture = false;

  // Stripe elements
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;

  constructor(private readonly paymentService: PaymentService) {}

  ngOnInit(): void {
    (async () => {
      try {
        await this.initializeStripeElements();
        await this.loadSavedPaymentMethods();
      } catch (error) {
        console.error('Error initializing payment component:', error);
        this.errorMessage.set('Failed to initialize payment system');
      }
    })();
  }

  ngOnDestroy(): void {
    if (this.cardElement) {
      this.cardElement.destroy();
    }
  }

  private async initializeStripeElements(): Promise<void> {
    try {
      this.elements = await this.paymentService.createElements();

      // Wait for the view to be rendered
      setTimeout(() => {
        if (this.cardElementRef) {
          this.mountCardElement();
        }
      }, 100);
    } catch (error) {
      console.error('Error initializing Stripe elements:', error);
      throw error;
    }
  }

  private mountCardElement(): void {
    if (!this.elements || !this.cardElementRef) return;

    this.cardElement = this.elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4',
          },
          padding: '12px',
        },
        invalid: {
          color: '#9e2146',
        },
      },
      hidePostalCode: true
    });

    this.cardElement.mount(this.cardElementRef.nativeElement);

    // Listen for real-time validation errors from the card Element
    this.cardElement.on('change', (event) => {
      if (event.error) {
        this.errorMessage.set(event.error.message);
      } else {
        this.errorMessage.set('');
      }
    });
  }

  private async loadSavedPaymentMethods(): Promise<void> {
    try {
      this.paymentService.paymentMethods$.subscribe(methods => {
        this.savedPaymentMethods.set(methods);

        // Auto-select default payment method
        const defaultMethod = methods.find(m => m.is_default);
        if (defaultMethod && !this.selectedPaymentMethod()) {
          this.selectedPaymentMethod.set(defaultMethod);
        }
      });
    } catch (error) {
      console.error('Error loading saved payment methods:', error);
    }
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.selectedPaymentMethod.set(method);
    this.showNewCardForm = false;
    this.errorMessage.set('');
  }

  getPaymentMethodClasses(method: PaymentMethod): string {
    const isSelected = this.selectedPaymentMethod()?.id === method.id;
    return isSelected
      ? 'border-primary-500 bg-primary-50'
      : 'border-gray-200 hover:border-primary-300';
  }

  getCardIcon(brand: string): string {
    const icons: { [key: string]: string } = {
      'visa': '💳',
      'mastercard': '💳',
      'amex': '💳',
      'discover': '💳',
      'diners': '💳',
      'jcb': '💳',
      // cspell:disable-next-line
      'unionpay': '💳'
    };
    return icons[brand.toLowerCase()] || '💳';
  }

  formatAmount(amount: number): string {
    return this.paymentService.formatAmount(amount * 100); // Convert to cents
  }

  canProcessPayment(): boolean {
    const hasOrder = !!this.orderDetails();
    const hasPaymentMethod = !!this.selectedPaymentMethod() || (this.showNewCardForm && this.cardholderName.trim().length > 0);
    const isNotLoading = !this.loading();
    return hasOrder && hasPaymentMethod && isNotLoading;
  }

  async processPayment(): Promise<void> {
    if (!this.canProcessPayment() || !this.orderDetails()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      let paymentMethodToUse = this.selectedPaymentMethod();

      // If using a new card, create payment method
      if (this.showNewCardForm && this.cardElement) {
        paymentMethodToUse = await this.createNewPaymentMethod();
      }

      if (!paymentMethodToUse) {
        throw new Error('No payment method available');
      }

      // Create payment intent
      const paymentIntent = await this.paymentService.createPaymentIntent(
        this.orderDetails()!.totalAmount * 100, // Convert to cents
        'usd',
        {
          service_name: this.orderDetails()!.serviceName,
          vehicle_info: this.orderDetails()!.vehicleInfo,
          date_time: this.orderDetails()!.dateTime
        }
      );

      // For demo purposes, we'll simulate a successful payment
      // In a real app, you would use the actual Stripe payment confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));

      this.successMessage.set('Payment processed successfully!');

      setTimeout(() => {
        this.paymentSuccess.emit({
          paymentIntent: paymentIntent,
          paymentMethod: paymentMethodToUse,
          amount: this.orderDetails()!.totalAmount
        });
      }, 1500);

    } catch (error: any) {
      console.error('Payment processing error:', error);
      const errorMsg = error?.message || 'Payment processing failed. Please try again.';
      this.errorMessage.set(errorMsg);
      this.paymentError.emit(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  private async createNewPaymentMethod(): Promise<PaymentMethod> {
    if (!this.cardElement || !this.cardholderName.trim()) {
      throw new Error('Card information is incomplete');
    }

    try {
      const paymentMethod = await this.paymentService.addPaymentMethod(this.cardElement);

      if (this.saveCardForFuture) {
        // The payment method is already saved in the service
        this.successMessage.set('Card saved for future use');
      }

      return paymentMethod;
    } catch (error) {
      console.error('Error creating payment method:', error);
      throw error;
    }
  }

  cancel(): void {
    this.paymentCancel.emit();
  }

  // Utility method to handle subscription plans
  async subscribeToPlan(planId: string): Promise<void> {
    if (!this.selectedPaymentMethod()) {
      this.errorMessage.set('Please select a payment method');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const subscription = await this.paymentService.createSubscription(
        planId,
        this.selectedPaymentMethod()!.id
      );

      this.successMessage.set('Subscription created successfully!');
      this.paymentSuccess.emit({
        subscription: subscription,
        type: 'subscription'
      });
    } catch (error: any) {
      console.error('Subscription error:', error);
      const errorMsg = error?.message || 'Failed to create subscription';
      this.errorMessage.set(errorMsg);
      this.paymentError.emit(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }
}
