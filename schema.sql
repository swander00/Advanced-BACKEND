-- ===============================
-- TRREB RESO Data Sync Schema
-- ===============================
-- Comprehensive schema for syncing TRREB real estate data
-- Supports Property and Media tables with proper relationships
-- Designed for incremental sync and efficient querying
-- All tables and columns use PascalCase to match RESO feed exactly

-- Drop existing tables in correct order (children first)
DROP TABLE IF EXISTS "Media" CASCADE;
DROP TABLE IF EXISTS "Property" CASCADE;

-- ===============================
-- Property Table
-- ===============================
-- Stores real estate listing data from TRREB RESO Web API
-- Primary entity for all property-related information
CREATE TABLE "Property" (
    -- Primary Key & Identifiers
    "ListingKey" TEXT PRIMARY KEY NOT NULL,
    
    -- Pricing Information
    "ListPrice" NUMERIC,
    "ClosePrice" NUMERIC,
    
    -- Status Fields
    "MlsStatus" TEXT,
    "ContractStatus" TEXT,
    "StandardStatus" TEXT,
    "TransactionType" TEXT,
    
    -- Property Classification
    "PropertyType" TEXT,
    "PropertySubType" TEXT,
    "ArchitecturalStyle" TEXT[],
    
    -- Address Components
    "UnparsedAddress" TEXT,
    "StreetNumber" TEXT,
    "StreetName" TEXT,
    "StreetSuffix" TEXT,
    "City" TEXT,
    "StateOrProvince" TEXT,
    "PostalCode" TEXT,
    "CountyOrParish" TEXT,
    "CityRegion" TEXT,
    "UnitNumber" TEXT,
    
    -- Room Counts
    "KitchensAboveGrade" INTEGER,
    "BedroomsAboveGrade" INTEGER,
    "BedroomsBelowGrade" INTEGER,
    "BathroomsTotalInteger" INTEGER,
    "KitchensBelowGrade" INTEGER,
    "KitchensTotal" INTEGER,
    "DenFamilyRoomYN" TEXT,
    
    -- Property Description
    "PublicRemarks" TEXT,
    "PossessionDetails" TEXT,
    
    -- Timestamp Fields (for sync tracking)
    "PhotosChangeTimestamp" TIMESTAMPTZ,
    "MediaChangeTimestamp" TIMESTAMPTZ,
    "ModificationTimestamp" TIMESTAMPTZ,
    "SystemModificationTimestamp" TIMESTAMPTZ,
    "OriginalEntryTimestamp" TIMESTAMPTZ,
    "SoldConditionalEntryTimestamp" TIMESTAMPTZ,
    "SoldEntryTimestamp" TIMESTAMPTZ,
    "SuspendedEntryTimestamp" TIMESTAMPTZ,
    "TerminatedEntryTimestamp" TIMESTAMPTZ,
    
    -- Date Fields
    "CloseDate" DATE,
    "ConditionalExpiryDate" DATE,
    "PurchaseContractDate" DATE,
    "SuspendedDate" DATE,
    "TerminatedDate" DATE,
    "UnavailableDate" DATE,
    
    -- Property Features (Arrays for multiple values)
    "Cooling" TEXT[],
    "Sewer" TEXT[],
    "Basement" TEXT[],
    "BasementEntrance" TEXT,
    "ExteriorFeatures" TEXT[],
    "InteriorFeatures" TEXT[],
    "PoolFeatures" TEXT[],
    "PropertyFeatures" TEXT[],
    "HeatType" TEXT,
    "FireplaceYN" TEXT,
    "LivingAreaRange" TEXT,
    "WaterfrontYN" TEXT,
    
    -- Possession & Parking
    "PossessionType" TEXT,
    "CoveredSpaces" INTEGER,
    "ParkingSpaces" INTEGER,
    "ParkingTotal" INTEGER,
    
    -- Condo/Association Information
    "AssociationAmenities" TEXT[],
    "Locker" TEXT,
    "BalconyType" TEXT,
    "PetsAllowed" TEXT[],
    "AssociationFee" NUMERIC,
    "AssociationFeeIncludes" TEXT[],
    "ApproximateAge" TEXT,
    "AdditionalMonthlyFee" NUMERIC,
    
    -- Tax & Lot Information
    "TaxAnnualAmount" NUMERIC,
    "TaxYear" INTEGER,
    "LotDepth" NUMERIC,
    "LotWidth" NUMERIC,
    "LotSizeUnits" TEXT,
    
    -- Rental Information
    "Furnished" TEXT,
    "RentIncludes" TEXT[],
    
    -- Audit Fields
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "UpdatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===============================
-- Media Table
-- ===============================
-- Stores media files (images, videos) associated with properties
-- Linked to Property via ResourceRecordKey -> ListingKey
CREATE TABLE "Media" (
    -- Primary Key & Relationships
    "MediaKey" TEXT PRIMARY KEY NOT NULL,
    "ResourceRecordKey" TEXT NOT NULL,
    
    -- Media Identification
    "MediaObjectID" TEXT,
    "MediaURL" TEXT NOT NULL,
    
    -- Media Classification
    "MediaCategory" TEXT,
    "MediaType" TEXT,
    "MediaStatus" TEXT,
    "ImageOf" TEXT,
    "ClassName" TEXT,
    "ImageSizeDescription" TEXT,
    
    -- Display Properties
    "Order" INTEGER,
    "PreferredPhotoYN" TEXT,
    "ShortDescription" TEXT,
    
    -- System Fields
    "ResourceName" TEXT,
    "OriginatingSystemID" TEXT,
    
    -- Timestamp Fields
    "MediaModificationTimestamp" TIMESTAMPTZ,
    "ModificationTimestamp" TIMESTAMPTZ,
    
    -- Audit Fields
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "UpdatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===============================
-- Foreign Key Constraints
-- ===============================
ALTER TABLE "Media" 
ADD CONSTRAINT "fk_media_property" 
FOREIGN KEY ("ResourceRecordKey") 
REFERENCES "Property"("ListingKey") 
ON DELETE CASCADE;

-- ===============================
-- Drop Existing Indexes (for idempotent execution)
-- ===============================
DROP INDEX IF EXISTS "idx_property_modification_listing";
DROP INDEX IF EXISTS "idx_property_contract_status";
DROP INDEX IF EXISTS "idx_property_property_type";
DROP INDEX IF EXISTS "idx_property_city";
DROP INDEX IF EXISTS "idx_property_postal_code";
DROP INDEX IF EXISTS "idx_property_list_price";
DROP INDEX IF EXISTS "idx_property_mls_status";
DROP INDEX IF EXISTS "idx_property_original_entry";
DROP INDEX IF EXISTS "idx_media_modification_key";
DROP INDEX IF EXISTS "idx_media_resource_record_key";
DROP INDEX IF EXISTS "idx_media_size_description";
DROP INDEX IF EXISTS "idx_media_resource_order";
DROP INDEX IF EXISTS "idx_media_preferred_photo";

-- ===============================
-- Indexes for Performance
-- ===============================

-- Property Table Indexes
CREATE INDEX "idx_property_modification_listing" 
ON "Property"("ModificationTimestamp", "ListingKey");

CREATE INDEX "idx_property_contract_status" 
ON "Property"("ContractStatus");

CREATE INDEX "idx_property_property_type" 
ON "Property"("PropertyType");

CREATE INDEX "idx_property_city" 
ON "Property"("City");

CREATE INDEX "idx_property_postal_code" 
ON "Property"("PostalCode");

CREATE INDEX "idx_property_list_price" 
ON "Property"("ListPrice") 
WHERE "ListPrice" IS NOT NULL;

CREATE INDEX "idx_property_mls_status" 
ON "Property"("MlsStatus");

CREATE INDEX "idx_property_original_entry" 
ON "Property"("OriginalEntryTimestamp");

-- Media Table Indexes
CREATE INDEX "idx_media_modification_key" 
ON "Media"("ModificationTimestamp", "MediaKey");

CREATE INDEX "idx_media_resource_record_key" 
ON "Media"("ResourceRecordKey");

CREATE INDEX "idx_media_size_description" 
ON "Media"("ImageSizeDescription");

CREATE INDEX "idx_media_resource_order" 
ON "Media"("ResourceRecordKey", "Order");

CREATE INDEX "idx_media_preferred_photo" 
ON "Media"("ResourceRecordKey", "PreferredPhotoYN") 
WHERE "PreferredPhotoYN" = 'Y';

-- ===============================
-- UpdatedAt Trigger Function
-- ===============================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW."UpdatedAt" = NOW();
    RETURN NEW;
END;
$function$;

-- ===============================
-- UpdatedAt Triggers
-- ===============================
CREATE TRIGGER "update_property_updated_at" 
BEFORE UPDATE ON "Property" 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_media_updated_at" 
BEFORE UPDATE ON "Media" 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ===============================
-- Comments for Documentation
-- ===============================
COMMENT ON TABLE "Property" IS 'Real estate property listings from TRREB RESO Web API';
COMMENT ON TABLE "Media" IS 'Media files associated with properties via ResourceRecordKey';

COMMENT ON COLUMN "Property"."ListingKey" IS 'Primary key - unique listing identifier';
COMMENT ON COLUMN "Property"."ModificationTimestamp" IS 'Critical for incremental sync';
COMMENT ON COLUMN "Property"."ContractStatus" IS 'Available, Sold, Conditional, etc.';

COMMENT ON COLUMN "Media"."MediaKey" IS 'Primary key - unique media identifier';
COMMENT ON COLUMN "Media"."ResourceRecordKey" IS 'Foreign key to Property.ListingKey';
COMMENT ON COLUMN "Media"."ImageSizeDescription" IS 'Thumbnail, Medium, Largest';
COMMENT ON COLUMN "Media"."Order" IS 'Display sequence for property galleries';