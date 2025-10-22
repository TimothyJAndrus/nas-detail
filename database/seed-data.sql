-- Sample Data for NAS Detail Car Detailing Database
-- Insert sample services
INSERT INTO public.services (id, name, description, short_description, price, duration_minutes, category, features, is_popular, sort_order) VALUES
(
    uuid_generate_v4(),
    'Express Exterior Wash',
    'Quick and efficient exterior cleaning including pre-rinse, foam wash, wheel cleaning, and drying. Perfect for maintaining your vehicle between detailed services.',
    'Basic exterior wash with foam and wheel cleaning',
    49.99,
    60,
    'exterior',
    ARRAY['Pre-rinse', 'Foam wash', 'Wheel cleaning', 'Hand drying', 'Tire shine'],
    false,
    1
),
(
    uuid_generate_v4(),
    'Premium Exterior Detail',
    'Complete exterior detailing service including wash, clay bar treatment, polish, and premium wax. Includes tire and wheel detail with interior vacuum.',
    'Complete exterior wash, clay bar, polish, and wax',
    89.99,
    180,
    'exterior',
    ARRAY['Pre-rinse', 'Foam wash', 'Clay bar treatment', 'Polish', 'Premium wax', 'Wheel detail', 'Tire shine', 'Interior vacuum'],
    true,
    2
),
(
    uuid_generate_v4(),
    'Interior Deep Clean',
    'Thorough interior cleaning including vacuuming, steam cleaning, leather/fabric treatment, dashboard and console detailing, and window cleaning.',
    'Deep cleaning of all interior surfaces',
    79.99,
    150,
    'interior',
    ARRAY['Complete vacuuming', 'Steam cleaning', 'Leather treatment', 'Fabric protection', 'Dashboard detailing', 'Window cleaning'],
    true,
    3
),
(
    uuid_generate_v4(),
    'Full Service Detail',
    'Complete interior and exterior detailing service. Includes everything from our premium packages plus additional protection and finishing touches.',
    'Complete interior and exterior detailing',
    159.99,
    240,
    'premium',
    ARRAY['Exterior wash & wax', 'Clay bar treatment', 'Interior deep clean', 'Leather treatment', 'Fabric protection', 'Engine bay cleaning'],
    true,
    4
),
(
    uuid_generate_v4(),
    'Ceramic Coating Application',
    'Professional ceramic coating application providing long-lasting protection and shine. Includes full preparation wash, clay bar, and coating application.',
    'Professional ceramic coating for ultimate protection',
    299.99,
    480,
    'protection',
    ARRAY['Full prep wash', 'Clay bar treatment', 'Paint correction', 'Ceramic coating application', '2-year protection guarantee'],
    false,
    5
),
(
    uuid_generate_v4(),
    'Monthly Maintenance Package',
    'Perfect for regular vehicle maintenance. Includes exterior wash, interior vacuum, and basic protection. Subscribe for monthly service.',
    'Regular monthly maintenance service',
    69.99,
    90,
    'maintenance',
    ARRAY['Exterior wash', 'Interior vacuum', 'Basic wax', 'Tire shine', 'Window cleaning'],
    false,
    6
);

-- Insert service packages
INSERT INTO public.service_packages (name, description, services, total_price, discount_percentage, final_price, duration_minutes, is_popular) VALUES
(
    'Ultimate Protection Package',
    'Our most comprehensive package including full detail and ceramic coating for maximum protection and shine.',
    (SELECT ARRAY_AGG(id) FROM public.services WHERE name IN ('Full Service Detail', 'Ceramic Coating Application')),
    459.98,
    15.00,
    390.98,
    360,
    true
),
(
    'Monthly Care Plan',
    'Perfect for vehicle enthusiasts. Includes premium exterior detail and interior deep clean every month.',
    (SELECT ARRAY_AGG(id) FROM public.services WHERE name IN ('Premium Exterior Detail', 'Interior Deep Clean')),
    169.98,
    10.00,
    152.98,
    210,
    false
);

-- Insert sample service areas
INSERT INTO public.service_areas (name, description, cities, postal_codes, is_active) VALUES
(
    'Downtown Metro',
    'Primary service area covering downtown and immediate surrounding neighborhoods',
    ARRAY['Downtown', 'Midtown', 'Arts District', 'Financial District'],
    ARRAY['90210', '90211', '90212', '90213'],
    true
),
(
    'West Side',
    'Extended service area covering western neighborhoods',
    ARRAY['Santa Monica', 'Venice', 'Culver City', 'West Hollywood'],
    ARRAY['90401', '90402', '90291', '90292'],
    true
),
(
    'East Valley',
    'Extended service area with additional travel fee',
    ARRAY['Pasadena', 'Glendale', 'Burbank', 'North Hollywood'],
    ARRAY['91101', '91201', '91505', '91601'],
    true
);

-- Insert business settings
INSERT INTO public.business_settings (key, value, description) VALUES
(
    'business_hours',
    '{"monday": {"open": "08:00", "close": "18:00"}, "tuesday": {"open": "08:00", "close": "18:00"}, "wednesday": {"open": "08:00", "close": "18:00"}, "thursday": {"open": "08:00", "close": "18:00"}, "friday": {"open": "08:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "17:00"}, "sunday": {"closed": true}}',
    'Business operating hours for each day of the week'
),
(
    'booking_settings',
    '{"advance_booking_days": 30, "minimum_notice_hours": 2, "default_duration_minutes": 120, "buffer_time_minutes": 30}',
    'Settings for booking system behavior'
),
(
    'pricing_settings',
    '{"tax_rate": 0.0875, "service_fee": 0.00, "cancellation_fee": 25.00, "currency": "USD"}',
    'Pricing and fee structure settings'
),
(
    'notification_settings',
    '{"email_enabled": true, "sms_enabled": true, "booking_reminder_hours": 24, "follow_up_hours": 48}',
    'Notification preferences and timing'
),
(
    'company_info',
    '{"name": "NAS Detail", "phone": "(123) 456-7890", "email": "info@nasdetail.com", "address": "123 Main St, City, State 12345", "website": "https://nasdetail.com"}',
    'Company contact and basic information'
);

-- Insert sample promotions
INSERT INTO public.promotions (code, name, description, discount_type, discount_value, usage_limit, is_active, valid_from, valid_until) VALUES
(
    'WELCOME20',
    'New Customer Welcome',
    'Get 20% off your first detailing service',
    'percentage',
    20.00,
    100,
    true,
    NOW(),
    NOW() + INTERVAL '90 days'
),
(
    'SPRING25',
    'Spring Cleaning Special',
    'Save $25 on any full service detail',
    'fixed',
    25.00,
    50,
    true,
    NOW(),
    NOW() + INTERVAL '60 days'
),
(
    'MONTHLY10',
    'Monthly Plan Discount',
    'Get 10% off when you sign up for monthly service',
    'percentage',
    10.00,
    NULL,
    true,
    NOW(),
    NOW() + INTERVAL '365 days'
);

-- Insert sample testimonials (these would normally come from real customers)
INSERT INTO public.testimonials (user_id, rating, title, review, is_featured, is_approved, approved_at) VALUES
(
    NULL, -- This would be a real user ID in production
    5,
    'Outstanding Service!',
    'NAS Detail exceeded my expectations! They came to my office and transformed my car while I worked. The attention to detail was incredible, and the convenience of mobile service is unbeatable. My BMW has never looked better!',
    true,
    true,
    NOW()
),
(
    NULL,
    5,
    'Professional and Thorough',
    'I''ve been using NAS Detail for 6 months now with their monthly plan. Every technician has been professional, punctual, and thorough. They clean areas I did not even know were dirty. Highly recommend!',
    true,
    true,
    NOW()
),
(
    NULL,
    5,
    'Amazing Results',
    'Had my SUV detailed before a special event. The team arrived on time with all their equipment and completely transformed my vehicle. The before and after photos speak for themselves. Will definitely book again!',
    true,
    true,
    NOW()
);
