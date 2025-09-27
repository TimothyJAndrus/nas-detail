import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Booking {
  id: string;
  service: string;
  date: string;
  time: string;
  vehicle: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  price: number;
}

interface AccountStats {
  totalServices: number;
  totalSpent: number;
  lastService: string | null;
  memberSince: string;
  loyaltyPoints: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  recentBookings = signal<Booking[]>([]);
  accountStats = signal<AccountStats>({
    totalServices: 0,
    totalSpent: 0,
    lastService: null,
    memberSince: 'January 2024',
    loyaltyPoints: 0
  });
  notifications = signal<Notification[]>([]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // Mock data - in a real app, this would come from services
    this.loadRecentBookings();
    this.loadAccountStats();
    this.loadNotifications();
  }

  private loadRecentBookings(): void {
    // Mock recent bookings data
    const mockBookings: Booking[] = [
      {
        id: '1',
        service: 'Premium Wash & Detail',
        date: '2024-01-20',
        time: '10:00 AM',
        vehicle: '2023 Tesla Model 3',
        status: 'completed',
        price: 150
      },
      {
        id: '2',
        service: 'Full Interior Detail',
        date: '2024-01-15',
        time: '2:00 PM',
        vehicle: '2022 BMW X5',
        status: 'scheduled',
        price: 200
      }
    ];
    
    this.recentBookings.set(mockBookings);
  }

  private loadAccountStats(): void {
    // Mock account statistics
    const mockStats: AccountStats = {
      totalServices: 12,
      totalSpent: 1850,
      lastService: 'January 15, 2024',
      memberSince: 'March 2023',
      loyaltyPoints: 750
    };
    
    this.accountStats.set(mockStats);
  }

  private loadNotifications(): void {
    // Mock notifications data
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Booking Confirmed',
        message: 'Your appointment for January 20th has been confirmed.',
        time: '2 hours ago',
        read: false
      },
      {
        id: '2',
        title: 'Service Reminder',
        message: 'Don\'t forget your appointment tomorrow at 10:00 AM.',
        time: '1 day ago',
        read: true
      }
    ];
    
    this.notifications.set(mockNotifications);
  }

  getUserName(): string {
    // Mock user name - in a real app, this would come from auth service
    return 'John Doe';
  }

  getStatusClasses(status: string): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'scheduled':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'in-progress':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  getLoyaltyProgress(): number {
    const points = this.accountStats().loyaltyPoints;
    return Math.min((points / 1000) * 100, 100);
  }
}
