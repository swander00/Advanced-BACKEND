// Only include fields that exist in your database schema
const ALLOWED_PROPERTY_FIELDS = [
  'ListingKey', 'ListPrice', 'ClosePrice', 'MlsStatus', 'ContractStatus', 
  'StandardStatus', 'TransactionType', 'PropertyType', 'PropertySubType', 
  'ArchitecturalStyle', 'UnparsedAddress', 'StreetNumber', 'StreetName', 
  'StreetSuffix', 'City', 'StateOrProvince', 'PostalCode', 'CountyOrParish', 
  'CityRegion', 'UnitNumber', 'KitchensAboveGrade', 'BedroomsAboveGrade', 
  'BedroomsBelowGrade', 'BathroomsTotalInteger', 'KitchensBelowGrade', 
  'KitchensTotal', 'DenFamilyRoomYN', 'PublicRemarks', 'PossessionDetails',
  'PhotosChangeTimestamp', 'MediaChangeTimestamp', 'ModificationTimestamp',
  'SystemModificationTimestamp', 'OriginalEntryTimestamp', 'SoldConditionalEntryTimestamp',
  'SoldEntryTimestamp', 'SuspendedEntryTimestamp', 'TerminatedEntryTimestamp',
  'CloseDate', 'ConditionalExpiryDate', 'PurchaseContractDate', 'SuspendedDate',
  'TerminatedDate', 'UnavailableDate', 'ExpirationDate', 'Cooling', 'Sewer', 'Basement',
  'BasementEntrance', 'ExteriorFeatures', 'InteriorFeatures', 'PoolFeatures',
  'PropertyFeatures', 'HeatType', 'FireplaceYN', 'LivingAreaRange', 
  'WaterfrontYN', 'PossessionType', 'CoveredSpaces', 'ParkingSpaces',
  'ParkingTotal', 'AssociationAmenities', 'Locker', 'BalconyType',
  'PetsAllowed', 'AssociationFee', 'AssociationFeeIncludes', 'ApproximateAge',
  'AdditionalMonthlyFee', 'TaxAnnualAmount', 'TaxYear', 'LotDepth',
  'LotWidth', 'LotSizeUnits', 'Furnished', 'RentIncludes'
];

export function mapProperty(rawProperty) {
  const filtered = {};
  
  // Only include fields that exist in database schema
  ALLOWED_PROPERTY_FIELDS.forEach(field => {
    if (rawProperty.hasOwnProperty(field)) {
      filtered[field] = rawProperty[field];
    }
  });
  
  return filtered;
}