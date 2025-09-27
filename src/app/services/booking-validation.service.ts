import { Injectable } from '@angular/core';
import {
  BookingFormData,
  BookingValidationError,
  BookingValidationSchema,
  ValidationRule,
  StepValidation,
  BOOKING_STEPS
} from '../models/booking.models';

@Injectable({
  providedIn: 'root'
})
export class BookingValidationService {
  private validationSchema: BookingValidationSchema;

  constructor() {
    this.validationSchema = this.createValidationSchema();
  }

  /**
   * Validates a specific step of the booking form
   */
  validateStep(step: number, formData: BookingFormData): BookingValidationError[] {
    const errors: BookingValidationError[] = [];
    const stepKey = this.getStepKey(step);
    
    if (!stepKey || !this.validationSchema[stepKey]) {
      return errors;
    }

    const stepValidation = this.validationSchema[stepKey];
    const stepData = formData[stepKey];

    // Validate each field in the step
    Object.entries(stepValidation).forEach(([fieldName, rules]) => {
      const fieldValue = this.getNestedValue(stepData, fieldName);
      const fieldErrors = this.validateField(fieldName, fieldValue, rules, formData, step);
      errors.push(...fieldErrors);
    });

    return errors;
  }

  /**
   * Validates the entire booking form
   */
  validateAllSteps(formData: BookingFormData): BookingValidationError[] {
    const allErrors: BookingValidationError[] = [];
    
    for (let step = 1; step <= 5; step++) {
      const stepErrors = this.validateStep(step, formData);
      allErrors.push(...stepErrors);
    }

    return allErrors;
  }

  /**
   * Validates a single field
   */
  validateField(
    fieldName: string,
    value: any,
    rules: ValidationRule[],
    formData: BookingFormData,
    step: number
  ): BookingValidationError[] {
    const errors: BookingValidationError[] = [];

    rules.forEach(rule => {
      const error = this.applyValidationRule(fieldName, value, rule, formData, step);
      if (error) {
        errors.push(error);
      }
    });

    return errors;
  }

  /**
   * Checks if a step is valid
   */
  isStepValid(step: number, formData: BookingFormData): boolean {
    const errors = this.validateStep(step, formData);
    return errors.length === 0;
  }

  /**
   * Gets validation errors for a specific field
   */
  getFieldErrors(fieldName: string, step: number, allErrors: BookingValidationError[]): BookingValidationError[] {
    return allErrors.filter(error => error.step === step && error.field === fieldName);
  }

  /**
   * Checks if the form can proceed to the next step
   */
  canProceedToNextStep(currentStep: number, formData: BookingFormData): boolean {
    // Check if current step is valid
    if (!this.isStepValid(currentStep, formData)) {
      return false;
    }

    // Additional business logic checks
    switch (currentStep) {
      case BOOKING_STEPS.SERVICE_SELECTION:
        return formData.step1.selectedService !== null && formData.step1.selectedLevel !== null;
      
      case BOOKING_STEPS.VEHICLE_INFO:
        return formData.step2.selectedVehicle !== null;
      
      case BOOKING_STEPS.DATE_TIME:
        return formData.step3.selectedDate !== null && formData.step3.selectedTimeSlot !== null;
      
      case BOOKING_STEPS.LOCATION_CONTACT:
        return this.isContactInfoComplete(formData.step4.contactInfo) && 
               this.isLocationComplete(formData.step4.location);
      
      default:
        return true;
    }
  }

  private createValidationSchema(): BookingValidationSchema {
    return {
      step1: {
        'selectedService': [{ required: true }],
        'selectedLevel': [{ required: true }]
      },
      step2: {
        'selectedVehicle': [{ required: true }],
        'selectedVehicle.make': [
          { required: true },
          { minLength: 2 },
          { maxLength: 50 }
        ],
        'selectedVehicle.model': [
          { required: true },
          { minLength: 1 },
          { maxLength: 50 }
        ],
        'selectedVehicle.year': [
          { required: true },
          { custom: this.validateYear }
        ],
        'selectedVehicle.color': [
          { required: true },
          { minLength: 3 },
          { maxLength: 30 }
        ],
        'selectedVehicle.licensePlate': [
          { required: true },
          { minLength: 2 },
          { maxLength: 10 },
          { pattern: /^[A-Z0-9\-\s]+$/i }
        ],
        'selectedVehicle.vehicleType': [{ required: true }],
        'selectedVehicle.sizeCategory': [{ required: true }]
      },
      step3: {
        'selectedDate': [
          { required: true },
          { custom: this.validateFutureDate }
        ],
        'selectedTimeSlot': [{ required: true }]
      },
      step4: {
        'contactInfo.firstName': [
          { required: true },
          { minLength: 2 },
          { maxLength: 50 },
          { pattern: /^[a-zA-Z\s'-]+$/ }
        ],
        'contactInfo.lastName': [
          { required: true },
          { minLength: 2 },
          { maxLength: 50 },
          { pattern: /^[a-zA-Z\s'-]+$/ }
        ],
        'contactInfo.email': [
          { required: true },
          { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
        ],
        'contactInfo.phone': [
          { required: true },
          { pattern: /^[\+]?[(]?[\+]?\d{3}[)]?[-\s\.]?\d{3}[-\s\.]?\d{4}$/ }
        ],
        'contactInfo.preferredContact': [{ required: true }],
        'location.type': [{ required: true }],
        'location.address.street': [
          { 
            custom: (value: any, formData?: BookingFormData) => {
              if (formData?.step4.location.type === 'mobile' && !value) {
                return 'Street address is required for mobile service';
              }
              return null;
            }
          }
        ],
        'location.address.city': [
          { 
            custom: (value: any, formData?: BookingFormData) => {
              if (formData?.step4.location.type === 'mobile' && !value) {
                return 'City is required for mobile service';
              }
              return null;
            }
          }
        ],
        'location.address.zipCode': [
          { 
            custom: (value: any, formData?: BookingFormData) => {
              if (formData?.step4.location.type === 'mobile') {
                if (!value) {
                  return 'ZIP code is required for mobile service';
                }
                if (!/^\d{5}(-\d{4})?$/.test(value)) {
                  return 'Invalid ZIP code format';
                }
              }
              return null;
            }
          }
        ]
      },
      step5: {
        'termsAccepted': [
          { 
            custom: (value: any) => {
              if (!value) {
                return 'You must accept the terms and conditions to proceed';
              }
              return null;
            }
          }
        ]
      }
    };
  }

  private applyValidationRule(
    fieldName: string,
    value: any,
    rule: ValidationRule,
    formData: BookingFormData,
    step: number
  ): BookingValidationError | null {
    // Required validation
    if (rule.required && this.isEmpty(value)) {
      return {
        step,
        field: fieldName,
        message: `${this.humanizeFieldName(fieldName)} is required`,
        code: 'REQUIRED'
      };
    }

    // Skip other validations if value is empty and not required
    if (this.isEmpty(value)) {
      return null;
    }

    // Length validations
    if (rule.minLength && this.getLength(value) < rule.minLength) {
      return {
        step,
        field: fieldName,
        message: `${this.humanizeFieldName(fieldName)} must be at least ${rule.minLength} characters`,
        code: 'MIN_LENGTH'
      };
    }

    if (rule.maxLength && this.getLength(value) > rule.maxLength) {
      return {
        step,
        field: fieldName,
        message: `${this.humanizeFieldName(fieldName)} must be no more than ${rule.maxLength} characters`,
        code: 'MAX_LENGTH'
      };
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(String(value))) {
      return {
        step,
        field: fieldName,
        message: this.getPatternErrorMessage(fieldName),
        code: 'INVALID_FORMAT'
      };
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value, formData);
      if (customError) {
        return {
          step,
          field: fieldName,
          message: customError,
          code: 'CUSTOM_VALIDATION'
        };
      }
    }

    return null;
  }

  private validateYear = (year: number): string | null => {
    const currentYear = new Date().getFullYear();
    const minYear = 1900;
    const maxYear = currentYear + 1;

    if (year < minYear || year > maxYear) {
      return `Year must be between ${minYear} and ${maxYear}`;
    }
    return null;
  };

  private validateFutureDate = (date: Date): string | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      return 'Please select a future date';
    }
    return null;
  };

  private getStepKey(step: number): keyof BookingValidationSchema | null {
    switch (step) {
      case 1: return 'step1';
      case 2: return 'step2';
      case 3: return 'step3';
      case 4: return 'step4';
      case 5: return 'step5';
      default: return null;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  private getLength(value: any): number {
    if (typeof value === 'string') return value.length;
    if (Array.isArray(value)) return value.length;
    return 0;
  }

  private humanizeFieldName(fieldName: string): string {
    // Convert dot notation and camelCase to readable format
    return fieldName
      .split('.')
      .pop()!
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private getPatternErrorMessage(fieldName: string): string {
    const field = fieldName.toLowerCase();
    
    if (field.includes('email')) {
      return 'Please enter a valid email address';
    }
    if (field.includes('phone')) {
      return 'Please enter a valid phone number';
    }
    if (field.includes('licenseplate')) {
      return 'Please enter a valid license plate (letters and numbers only)';
    }
    if (field.includes('firstname') || field.includes('lastname')) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }
    if (field.includes('zipcode')) {
      return 'Please enter a valid ZIP code (12345 or 12345-6789)';
    }
    
    return `Please enter a valid ${this.humanizeFieldName(fieldName).toLowerCase()}`;
  }

  private isContactInfoComplete(contactInfo: any): boolean {
    return !!(
      contactInfo?.firstName &&
      contactInfo?.lastName &&
      contactInfo?.email &&
      contactInfo?.phone &&
      contactInfo?.preferredContact
    );
  }

  private isLocationComplete(location: any): boolean {
    if (location?.type === 'shop') {
      return !!location.shopLocation;
    }
    
    if (location?.type === 'mobile') {
      return !!(
        location.address?.street &&
        location.address?.city &&
        location.address?.zipCode
      );
    }
    
    return false;
  }

  /**
   * Gets user-friendly error messages for display
   */
  getDisplayErrors(errors: BookingValidationError[]): string[] {
    return errors.map(error => error.message);
  }

  /**
   * Gets errors grouped by field
   */
  getErrorsByField(errors: BookingValidationError[]): Record<string, string[]> {
    const grouped: Record<string, string[]> = {};
    
    errors.forEach(error => {
      if (!grouped[error.field]) {
        grouped[error.field] = [];
      }
      grouped[error.field].push(error.message);
    });
    
    return grouped;
  }

  /**
   * Clears validation errors for a specific field
   */
  clearFieldErrors(fieldName: string, step: number, errors: BookingValidationError[]): BookingValidationError[] {
    return errors.filter(error => !(error.field === fieldName && error.step === step));
  }

  /**
   * Validates that required services are available
   */
  validateServiceAvailability(serviceId: string, availableServices: any[]): boolean {
    return availableServices.some(service => service.id === serviceId && service.available);
  }

  /**
   * Validates time slot availability
   */
  validateTimeSlotAvailability(timeSlot: any): boolean {
    if (!timeSlot) return false;
    
    const now = new Date();
    const slotTime = new Date(timeSlot.startTime);
    
    // Must be in the future and marked as available
    return slotTime > now && timeSlot.available;
  }
}