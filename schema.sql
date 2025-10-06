-- ===============================================================
-- TRREB RESO Data Sync Schema
-- ===============================================================
-- Comprehensive schema for syncing TRREB real estate data
-- Includes Property, Media, PropertyRooms, OpenHouse, and SyncState tables
-- Designed for incremental sync, efficient querying, and modularity
-- All tables and columns use PascalCase to match RESO feed exactly

-- ===============================================================
-- Drop Existing Tables (Child Tables First)
-- ===============================================================
DROP TABLE IF EXISTS "Media" CASCADE;
DROP TABLE IF EXISTS "PropertyRooms" CASCADE;
DROP TABLE IF EXISTS "OpenHouse" CASCADE;
DROP TABLE IF EXISTS "Property" CASCADE;
DROP TABLE IF EXISTS "SyncState" CASCADE;

-- ===============================================================
-- Property Table
-- ===============================================================
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

    -- Room Counts (NUMERIC for flexibility)
    "KitchensAboveGrade" NUMERIC,
    "BedroomsAboveGrade" NUMERIC,
    "BedroomsBelowGrade" NUMERIC,
    "BathroomsTotalInteger" NUMERIC,
    "KitchensBelowGrade" NUMERIC,
    "KitchensTotal" NUMERIC,
    "DenFamilyRoomYN" TEXT,

    -- Property Description
    "PublicRemarks" TEXT,
    "PossessionDetails" TEXT,

    -- Timestamp Fields
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

    -- Property Features
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
    "CoveredSpaces" NUMERIC,
    "ParkingSpaces" NUMERIC,
    "ParkingTotal" NUMERIC,

    -- Condo/Association Info
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

    -- Virtual Tour Information
    "VirtualTourURLUnbranded" TEXT,

    -- Audit Fields
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "UpdatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===============================================================
-- Media Table
-- ===============================================================
CREATE TABLE "Media" (
    "MediaKey" TEXT PRIMARY KEY NOT NULL,
    "ResourceRecordKey" TEXT NOT NULL,

    "MediaObjectID" TEXT,
    "MediaURL" TEXT NOT NULL,

    "MediaCategory" TEXT,
    "MediaType" TEXT,
    "MediaStatus" TEXT,
    "ImageOf" TEXT,
    "ClassName" TEXT,
    "ImageSizeDescription" TEXT,

    "Order" INTEGER,
    "PreferredPhotoYN" TEXT,
    "ShortDescription" TEXT,

    "ResourceName" TEXT,
    "OriginatingSystemID" TEXT,

    "MediaModificationTimestamp" TIMESTAMPTZ,
    "ModificationTimestamp" TIMESTAMPTZ,

    "CreatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "UpdatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT "fk_media_property"
        FOREIGN KEY ("ResourceRecordKey")
        REFERENCES "Property"("ListingKey")
        ON DELETE CASCADE
);

-- ===============================================================
-- PropertyRooms Table
-- ===============================================================
CREATE TABLE "PropertyRooms" (
    "RoomKey" TEXT PRIMARY KEY NOT NULL,
    "ListingKey" TEXT NOT NULL,

    "RoomType" TEXT,
    "RoomLevel" TEXT,
    "RoomLength" NUMERIC,
    "RoomWidth" NUMERIC,
    "RoomDescription" TEXT,
    "RoomAreaUnits" TEXT,
    "RoomFeature1" TEXT,
    "RoomFeature2" TEXT,
    "RoomFeature3" TEXT,
    "CombinedFeatures" TEXT,
    "RoomMeasurements" TEXT,

    "ModificationTimestamp" TIMESTAMPTZ,

    "CreatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "UpdatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT "fk_rooms_property"
        FOREIGN KEY ("ListingKey")
        REFERENCES "Property"("ListingKey")
        ON DELETE CASCADE
);

-- ===============================================================
-- OpenHouse Table
-- ===============================================================
CREATE TABLE "OpenHouse" (
    "OpenHouseKey" TEXT PRIMARY KEY NOT NULL,
    "ListingKey" TEXT NOT NULL,

    "OpenHouseDate" DATE,
    "OpenHouseStartTime" TIME,
    "OpenHouseEndTime" TIME,
    "OpenHouseRemarks" TEXT,
    "OpenHouseStatus" TEXT,
    "OpenHouseType" TEXT,
    "ShowingAgentKey" TEXT,
    "ShowingAgentKeyNumeric" INTEGER,

    "ModificationTimestamp" TIMESTAMPTZ,

    "CreatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "UpdatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT "fk_openhouse_property"
        FOREIGN KEY ("ListingKey")
        REFERENCES "Property"("ListingKey")
        ON DELETE CASCADE
);

-- ===============================================================
-- SyncState Table (Resume-Friendly Backfill)
-- ===============================================================
CREATE TABLE "SyncState" (
    "SyncType" TEXT PRIMARY KEY NOT NULL,
    "LastTimestamp" TIMESTAMPTZ NOT NULL,
    "LastKey" TEXT NOT NULL,
    "TotalProcessed" INTEGER DEFAULT 0,
    "LastRunStarted" TIMESTAMPTZ,
    "LastRunCompleted" TIMESTAMPTZ,
    "Status" TEXT DEFAULT 'idle',
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "UpdatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Initialize Default SyncState Rows
INSERT INTO "SyncState" ("SyncType", "LastTimestamp", "LastKey")
VALUES 
    ('IDX', '2024-01-01T00:00:00Z', '0'),
    ('VOW', '2024-01-01T00:00:00Z', '0')
ON CONFLICT ("SyncType") DO NOTHING;

-- ===============================================================
-- Indexes
-- ===============================================================
CREATE INDEX "idx_property_modification_listing" ON "Property"("ModificationTimestamp","ListingKey");
CREATE INDEX "idx_property_contract_status" ON "Property"("ContractStatus");
CREATE INDEX "idx_property_property_type" ON "Property"("PropertyType");
CREATE INDEX "idx_property_city" ON "Property"("City");
CREATE INDEX "idx_property_postal_code" ON "Property"("PostalCode");
CREATE INDEX "idx_property_list_price" ON "Property"("ListPrice") WHERE "ListPrice" IS NOT NULL;
CREATE INDEX "idx_property_mls_status" ON "Property"("MlsStatus");
CREATE INDEX "idx_property_original_entry" ON "Property"("OriginalEntryTimestamp");

CREATE INDEX "idx_media_modification_key" ON "Media"("ModificationTimestamp","MediaKey");
CREATE INDEX "idx_media_resource_record_key" ON "Media"("ResourceRecordKey");
CREATE INDEX "idx_media_size_description" ON "Media"("ImageSizeDescription");
CREATE INDEX "idx_media_resource_order" ON "Media"("ResourceRecordKey","Order");
CREATE INDEX "idx_media_preferred_photo" ON "Media"("ResourceRecordKey","PreferredPhotoYN") WHERE "PreferredPhotoYN"='Y';

CREATE INDEX "idx_rooms_listing_key" ON "PropertyRooms"("ListingKey");
CREATE INDEX "idx_rooms_modification" ON "PropertyRooms"("ModificationTimestamp");
CREATE INDEX "idx_rooms_type" ON "PropertyRooms"("RoomType");

CREATE INDEX "idx_openhouse_listing_key" ON "OpenHouse"("ListingKey");
CREATE INDEX "idx_openhouse_date" ON "OpenHouse"("OpenHouseDate");
CREATE INDEX "idx_openhouse_modification" ON "OpenHouse"("ModificationTimestamp");
CREATE INDEX "idx_openhouse_status" ON "OpenHouse"("OpenHouseStatus");

-- ===============================================================
-- Trigger Function
-- ===============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."UpdatedAt" = NOW();
  RETURN NEW;
END;
$$;

-- ===============================================================
-- Triggers
-- ===============================================================
CREATE TRIGGER "update_property_updated_at" BEFORE UPDATE ON "Property"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_media_updated_at" BEFORE UPDATE ON "Media"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_rooms_updated_at" BEFORE UPDATE ON "PropertyRooms"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_openhouse_updated_at" BEFORE UPDATE ON "OpenHouse"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_syncstate_updated_at" BEFORE UPDATE ON "SyncState"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================================
-- Room Feature Triggers
-- ===============================================================

-- Trigger function for CombinedFeatures
CREATE OR REPLACE FUNCTION update_combined_features()
RETURNS TRIGGER AS $$
DECLARE
    features TEXT[];
    clean_feature TEXT;
BEGIN
    features := ARRAY[]::TEXT[];
    
    IF NEW."RoomFeature1" IS NOT NULL THEN
        clean_feature := TRIM(BOTH '"[]' FROM NEW."RoomFeature1");
        IF clean_feature != '' THEN
            features := array_append(features, clean_feature);
        END IF;
    END IF;
    
    IF NEW."RoomFeature2" IS NOT NULL THEN
        clean_feature := TRIM(BOTH '"[]' FROM NEW."RoomFeature2");
        IF clean_feature != '' THEN
            features := array_append(features, clean_feature);
        END IF;
    END IF;
    
    IF NEW."RoomFeature3" IS NOT NULL THEN
        clean_feature := TRIM(BOTH '"[]' FROM NEW."RoomFeature3");
        IF clean_feature != '' THEN
            features := array_append(features, clean_feature);
        END IF;
    END IF;
    
    IF array_length(features, 1) > 0 THEN
        NEW."CombinedFeatures" := array_to_string(features, ', ');
    ELSE
        NEW."CombinedFeatures" := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for RoomMeasurements
CREATE OR REPLACE FUNCTION update_room_measurements()
RETURNS TRIGGER AS $$
DECLARE
    result TEXT := '';
BEGIN
    IF NEW."RoomLength" IS NOT NULL THEN
        result := NEW."RoomLength"::TEXT;
        
        IF NEW."RoomWidth" IS NOT NULL THEN
            result := result || 'x' || NEW."RoomWidth"::TEXT;
        END IF;
        
        IF NEW."RoomAreaUnits" IS NOT NULL AND result != '' THEN
            result := result || ' ' || NEW."RoomAreaUnits";
        END IF;
    END IF;
    
    IF result = '' THEN
        NEW."RoomMeasurements" := NULL;
    ELSE
        NEW."RoomMeasurements" := result;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for room features
CREATE TRIGGER "trigger_update_combined_features"
    BEFORE INSERT OR UPDATE OF "RoomFeature1", "RoomFeature2", "RoomFeature3"
    ON "PropertyRooms"
    FOR EACH ROW
    EXECUTE FUNCTION update_combined_features();

CREATE TRIGGER "trigger_update_room_measurements"
    BEFORE INSERT OR UPDATE OF "RoomLength", "RoomWidth", "RoomAreaUnits"
    ON "PropertyRooms"
    FOR EACH ROW
    EXECUTE FUNCTION update_room_measurements();

-- ===============================================================
-- Comments
-- ===============================================================
COMMENT ON TABLE "Property" IS 'Real estate property listings from TRREB RESO Web API';
COMMENT ON TABLE "Media" IS 'Media files associated with properties via ResourceRecordKey';
COMMENT ON TABLE "PropertyRooms" IS 'Room details for properties, linked via ListingKey';
COMMENT ON TABLE "OpenHouse" IS 'Open house schedules for properties, linked via ListingKey';
COMMENT ON TABLE "SyncState" IS 'Tracks sync progress for resume support';
COMMENT ON COLUMN "SyncState"."SyncType" IS 'IDX, VOW, IDX_INCREMENTAL, etc.';
COMMENT ON COLUMN "SyncState"."LastTimestamp" IS 'Last ModificationTimestamp processed';
COMMENT ON COLUMN "SyncState"."LastKey" IS 'Last ListingKey processed at that timestamp';

-- Room feature columns
COMMENT ON COLUMN "PropertyRooms"."RoomFeature1" IS 'Room Feature 1 - String (List, Single)';
COMMENT ON COLUMN "PropertyRooms"."RoomFeature2" IS 'Room Feature 2 - String (List, Single)';
COMMENT ON COLUMN "PropertyRooms"."RoomFeature3" IS 'Room Feature 3 - String (List, Single)';
COMMENT ON COLUMN "PropertyRooms"."CombinedFeatures" IS 'Combined room features from RoomFeature1-3 (auto-populated by trigger)';
COMMENT ON COLUMN "PropertyRooms"."RoomMeasurements" IS 'Combined room measurements from length, width, and units (auto-populated by trigger)';
