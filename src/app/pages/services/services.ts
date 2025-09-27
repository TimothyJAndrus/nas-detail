import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface ServiceCategory {
  id: string;
  name: string;
}

interface ServiceLevel {
  name: string;
  description: string;
  price: number;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  duration: number;
  categoryId: string;
  features: string[];
  levels?: ServiceLevel[];
  rating: number;
  reviewCount: number;
  isPopular?: boolean;
  image?: string;
}

@Component({
  selector: 'app-services',
  imports: [CommonModule],
  templateUrl: './services.html',
  styleUrl: './services.scss'
})
export class ServicesComponent implements OnInit {
  private allServices = signal<Service[]>([]);
  filteredServices = signal<Service[]>([]);
  selectedService = signal<Service | null>(null);
  activeCategory = signal<string>('all');

  serviceCategories: ServiceCategory[] = [
    { id: 'all', name: 'All Services' },
    { id: 'exterior', name: 'Exterior' },
    { id: 'interior', name: 'Interior' },
    { id: 'protection', name: 'Protection' },
    { id: 'premium', name: 'Premium Packages' },
    { id: 'maintenance', name: 'Maintenance' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadServices();
  }

  private loadServices(): void {
    // Mock services data - in a real app, this would come from a service
    const mockServices: Service[] = [
      {
        id: '1',
        name: 'Premium Wash & Wax',
        description: 'Complete exterior wash with high-quality carnauba wax protection for a showroom shine.',
        price: 149,
        originalPrice: 179,
        duration: 120,
        categoryId: 'exterior',
        features: [
          'Hand wash with premium soap',
          'Clay bar treatment',
          'Carnauba wax application',
          'Tire shine and dressing',
          'Window cleaning inside & out',
          'Wheel cleaning and polishing'
        ],
        rating: 4.8,
        reviewCount: 124,
        isPopular: true
      },
      {
        id: '2',
        name: 'Interior Deep Clean',
        description: 'Thorough interior cleaning and conditioning for a fresh, like-new cabin experience.',
        price: 99,
        duration: 90,
        categoryId: 'interior',
        features: [
          'Vacuum all surfaces and crevices',
          'Steam cleaning of upholstery',
          'Leather conditioning',
          'Dashboard and console cleaning',
          'Door panel and trim detailing',
          'Air freshener application'
        ],
        rating: 4.7,
        reviewCount: 89,
        levels: [
          {
            name: 'Basic Interior',
            description: 'Essential interior cleaning',
            price: 79
          },
          {
            name: 'Deep Interior',
            description: 'Comprehensive interior detailing',
            price: 99
          },
          {
            name: 'Luxury Interior',
            description: 'Premium treatment with protection',
            price: 129
          }
        ]
      },
      {
        id: '3',
        name: 'Paint Correction & Polish',
        description: 'Professional paint correction to remove swirls, scratches, and restore your paint\'s clarity.',
        price: 299,
        duration: 240,
        categoryId: 'premium',
        features: [
          'Multi-stage paint correction',
          'Swirl and scratch removal',
          'High-gloss polish application',
          'Paint depth measurement',
          'UV protection treatment',
          '6-month shine guarantee'
        ],
        rating: 4.9,
        reviewCount: 67,
        isPopular: true
      },
      {
        id: '4',
        name: 'Ceramic Coating Protection',
        description: 'Long-lasting ceramic coating that provides superior protection and an incredible shine.',
        price: 599,
        duration: 360,
        categoryId: 'protection',
        features: [
          '9H ceramic coating application',
          'Paint correction prep work',
          'Hydrophobic water beading',
          '2-year protection guarantee',
          'UV and chemical resistance',
          'Easy maintenance instructions'
        ],
        rating: 5.0,
        reviewCount: 43,
        levels: [
          {
            name: '1-Year Ceramic',
            description: 'Entry-level ceramic protection',
            price: 399
          },
          {
            name: '3-Year Ceramic',
            description: 'Premium ceramic coating',
            price: 599
          },
          {
            name: '5-Year Ceramic',
            description: 'Ultimate protection package',
            price: 899
          }
        ]
      },
      {
        id: '5',
        name: 'Express Wash & Dry',
        description: 'Quick but thorough exterior wash perfect for regular maintenance.',
        price: 49,
        duration: 45,
        categoryId: 'maintenance',
        features: [
          'Touchless pre-rinse',
          'Foam cannon wash',
          'Spot-free rinse',
          'Hand drying with chamois',
          'Quick tire shine',
          'Window cleaning'
        ],
        rating: 4.5,
        reviewCount: 201
      },
      {
        id: '6',
        name: 'Full Service Detail',
        description: 'Complete interior and exterior detailing package for the ultimate car care experience.',
        price: 249,
        originalPrice: 299,
        duration: 180,
        categoryId: 'premium',
        features: [
          'Complete exterior wash & wax',
          'Full interior deep cleaning',
          'Engine bay cleaning',
          'Headlight restoration',
          'Chrome polishing',
          'Protective coating application',
          '30-day satisfaction guarantee'
        ],
        rating: 4.8,
        reviewCount: 156,
        isPopular: true
      },
      {
        id: '7',
        name: 'Headlight Restoration',
        description: 'Restore cloudy, yellowed headlights to like-new clarity and brightness.',
        price: 89,
        duration: 60,
        categoryId: 'maintenance',
        features: [
          'Professional sanding process',
          'Compound and polish application',
          'UV protective coating',
          'Both headlights included',
          'Improved visibility',
          '1-year clarity guarantee'
        ],
        rating: 4.6,
        reviewCount: 73
      },
      {
        id: '8',
        name: 'Engine Bay Detailing',
        description: 'Professional engine bay cleaning and dressing for a pristine under-hood appearance.',
        price: 79,
        duration: 75,
        categoryId: 'exterior',
        features: [
          'Safe engine degreasing',
          'Component protection covering',
          'Steam cleaning process',
          'Plastic and rubber dressing',
          'Metal polishing',
          'Final protective coating'
        ],
        rating: 4.7,
        reviewCount: 92
      }
    ];

    this.allServices.set(mockServices);
    this.filteredServices.set(mockServices);
  }

  filterByCategory(categoryId: string): void {
    this.activeCategory.set(categoryId);
    
    if (categoryId === 'all') {
      this.filteredServices.set(this.allServices());
    } else {
      const filtered = this.allServices().filter(service => service.categoryId === categoryId);
      this.filteredServices.set(filtered);
    }
  }

  getCategoryButtonClasses(categoryId: string): string {
    const isActive = this.activeCategory() === categoryId;
    const baseClasses = 'px-6 py-3 rounded-full font-medium transition-all duration-200';
    
    return isActive 
      ? `${baseClasses} bg-primary-600 text-white shadow-lg`
      : `${baseClasses} bg-white text-primary-600 border border-primary-600 hover:bg-primary-50`;
  }

  viewServiceDetails(service: Service): void {
    this.selectedService.set(service);
  }

  closeServiceDetails(): void {
    this.selectedService.set(null);
  }

  bookService(service: Service): void {
    // Navigate to booking page with service pre-selected
    this.router.navigate(['/booking'], {
      queryParams: { serviceId: service.id }
    });
  }

  openConsultationForm(): void {
    // This would open a consultation form modal or navigate to a contact page
    console.log('Opening consultation form...');
    // For now, scroll to contact section or show a modal
  }

  getServiceCategoryName(categoryId: string | undefined): string {
    if (!categoryId) return 'Unknown';
    const category = this.serviceCategories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  }
}
