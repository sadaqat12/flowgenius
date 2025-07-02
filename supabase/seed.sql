-- Sample data for Service Call Manager development

-- Insert sample service calls
INSERT INTO service_calls (customer_name, phone, address, problem_desc, call_type, status, scheduled_at) VALUES
('John Smith', '(555) 123-4567', '123 Main St, Downtown, NY 10001', 'Refrigerator not cooling properly. Temperature seems inconsistent.', 'Warranty', 'New', '2024-07-02 10:00:00+00'),
('Mary Johnson', '(555) 987-6543', '456 Oak Ave, Midtown, NY 10002', 'Washing machine making loud noise during spin cycle.', 'Landlord', 'InProgress', '2024-07-02 14:30:00+00'),
('Bob Wilson', '(555) 555-0123', '789 Pine St, Uptown, NY 10003', 'Dishwasher not draining properly. Water pools at bottom.', 'Extra', 'New', '2024-07-03 09:00:00+00'),
('Alice Brown', '(555) 246-8101', '321 Elm Dr, Eastside, NY 10004', 'Oven temperature not accurate. Overcooking food.', 'Warranty', 'Completed', '2024-07-01 09:00:00+00'),
('Charlie Davis', '(555) 369-2580', '654 Maple Ln, Westside, NY 10005', 'Microwave turntable not rotating. Heating unevenly.', 'Landlord', 'OnHold', '2024-07-03 16:00:00+00'),
('Diana Miller', '(555) 147-8520', '987 Cedar Blvd, Southside, NY 10006', 'Dryer not heating up. Clothes remain damp after cycle.', 'Extra', 'New', '2024-07-04 11:00:00+00'),
('Frank Anderson', '(555) 258-9630', '159 Birch Way, Northside, NY 10007', 'Garbage disposal jammed and making strange noises.', 'Warranty', 'InProgress', '2024-07-04 13:30:00+00'),
('Grace Taylor', '(555) 741-9630', '753 Spruce Ave, Central, NY 10008', 'Air conditioner not cooling efficiently. High energy bills.', 'Landlord', 'New', '2024-07-05 08:00:00+00');

-- Insert sample work logs for some completed calls
INSERT INTO work_logs (call_id, notes, parts_used) 
SELECT id, 'Replaced faulty thermostat. Tested temperature regulation. Unit now maintaining proper temperature.', 'Thermostat (Part #TH-500)'
FROM service_calls WHERE customer_name = 'Alice Brown';

INSERT INTO work_logs (call_id, notes, parts_used) 
SELECT id, 'Diagnosed heating element failure. Ordered replacement part. Will return tomorrow for installation.', 'Heating Element (Part #HE-200) - On Order'
FROM service_calls WHERE customer_name = 'Frank Anderson'; 