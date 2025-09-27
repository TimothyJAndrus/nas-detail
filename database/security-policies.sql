-- Row Level Security Policies for NAS Detail Database
-- These policies ensure users can only access their own data

-- Enable RLS on all user-specific tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Vehicles table policies
CREATE POLICY "Users can manage their own vehicles" ON public.vehicles
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins and technicians can view all vehicles" ON public.vehicles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'technician')
        )
    );

-- Locations table policies
CREATE POLICY "Users can manage their own locations" ON public.locations
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins and technicians can view all locations" ON public.locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'technician')
        )
    );

-- Bookings table policies
CREATE POLICY "Users can manage their own bookings" ON public.bookings
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Technicians can view their assigned bookings" ON public.bookings
    FOR SELECT USING (
        technician_id IN (
            SELECT id FROM public.technicians WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Technicians can update their assigned bookings" ON public.bookings
    FOR UPDATE USING (
        technician_id IN (
            SELECT id FROM public.technicians WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all bookings" ON public.bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Payments table policies
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all payments" ON public.payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Subscriptions table policies
CREATE POLICY "Users can manage their own subscriptions" ON public.subscriptions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Notifications table policies
CREATE POLICY "Users can manage their own notifications" ON public.notifications
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all notifications" ON public.notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Testimonials table policies
CREATE POLICY "Users can manage their own testimonials" ON public.testimonials
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Everyone can view approved testimonials" ON public.testimonials
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Admins can manage all testimonials" ON public.testimonials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Public read access for services and service packages
CREATE POLICY "Anyone can view active services" ON public.services
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage services" ON public.services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Anyone can view active service packages" ON public.service_packages
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage service packages" ON public.service_packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Service areas public read access
CREATE POLICY "Anyone can view active service areas" ON public.service_areas
    FOR SELECT USING (is_active = true);

-- Time slots policies
CREATE POLICY "Anyone can view available time slots" ON public.time_slots
    FOR SELECT USING (is_available = true);

CREATE POLICY "Technicians can manage their own time slots" ON public.time_slots
    FOR ALL USING (
        technician_id IN (
            SELECT id FROM public.technicians WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all time slots" ON public.time_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Technicians table policies
CREATE POLICY "Technicians can view their own profile" ON public.technicians
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Technicians can update their own profile" ON public.technicians
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all technicians" ON public.technicians
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Promotions public read access for active promotions
CREATE POLICY "Anyone can view active promotions" ON public.promotions
    FOR SELECT USING (is_active = true AND valid_from <= NOW() AND valid_until >= NOW());

-- Business settings read access
CREATE POLICY "Anyone can view business settings" ON public.business_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage business settings" ON public.business_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );