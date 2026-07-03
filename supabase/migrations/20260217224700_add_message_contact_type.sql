-- Add MESSAGE contact type to enable direct messaging via contacts

-- Add MESSAGE to the contact_type enum
ALTER TYPE contact_type ADD VALUE IF NOT EXISTS 'MESSAGE';
