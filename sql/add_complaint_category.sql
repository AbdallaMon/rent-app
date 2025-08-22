-- SQL to add ComplaintCategory enum to MySQL
-- This script adds the missing ComplaintCategory enum values to the database
-- Execute this manually on your MySQL database

-- Check if the table exists
-- Note: You might need to adjust this query based on your specific needs
-- This is just a template

-- Alter the Complaint table to ensure it has the category column
ALTER TABLE `Complaint` MODIFY COLUMN `category` ENUM('PROPERTY_ISSUE', 'RENT_ISSUE', 'NEIGHBOR_ISSUE', 'MAINTENANCE_ISSUE', 'NOISE_ISSUE', 'SECURITY_ISSUE', 'PAYMENT_ISSUE', 'OTHER') NOT NULL;
