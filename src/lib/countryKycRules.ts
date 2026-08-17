export interface CountryKycRule {
  countryCode: string;
  countryName: string;
  phoneCode: string;
  phonePlaceholder: string;
  phoneRegex: RegExp;
  phoneHelp: string;
  postalLabel: string;
  postalPlaceholder: string;
  postalRegex: RegExp;
  postalHelp: string;
  taxIdLabel: string;
  taxIdPlaceholder: string;
  taxIdRegex: RegExp;
  taxIdHelp: string;
  requiresVatGst: boolean;
  vatGstLabel?: string;
  vatGstPlaceholder?: string;
  vatGstRegex?: RegExp;
  allowedDocTypes: {
    id: string;
    label: string;
    requiresBack: boolean;
    description: string;
  }[];
}

export const COUNTRY_KYC_RULES: Record<string, CountryKycRule> = {
  India: {
    countryCode: "IN",
    countryName: "India",
    phoneCode: "+91",
    phonePlaceholder: "10-digit mobile number (e.g. 9876543210)",
    phoneRegex: /^[6-9]\d{9}$/,
    phoneHelp: "Must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
    postalLabel: "PIN Code",
    postalPlaceholder: "6-digit PIN (e.g. 400001)",
    postalRegex: /^[1-9][0-9]{5}$/,
    postalHelp: "6-digit numeric Postal Index Number.",
    taxIdLabel: "PAN (Permanent Account Number)",
    taxIdPlaceholder: "e.g. ABCDE1234F",
    taxIdRegex: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    taxIdHelp: "10-character alphanumeric PAN issued by the Income Tax Dept of India.",
    requiresVatGst: true,
    vatGstLabel: "GSTIN (Goods and Services Tax ID)",
    vatGstPlaceholder: "e.g. 27ABCDE1234F1Z5",
    vatGstRegex: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    allowedDocTypes: [
      { id: "Aadhaar", label: "Aadhaar Card", requiresBack: true, description: "Front and Back side of UIDAI Aadhaar Card" },
      { id: "Passport", label: "Indian Passport", requiresBack: false, description: "Personal details page of valid Indian Passport" },
      { id: "VoterID", label: "Voter ID Card (EPIC)", requiresBack: true, description: "Front and Back side of Election Card" },
      { id: "DriversLicense", label: "Driving Licence", requiresBack: true, description: "Front and Back side of smartcard DL" },
    ],
  },

  "United States": {
    countryCode: "US",
    countryName: "United States",
    phoneCode: "+1",
    phonePlaceholder: "10-digit US phone number (e.g. 2025550143)",
    phoneRegex: /^[2-9]\d{9}$/,
    phoneHelp: "Standard 10-digit US phone number with area code.",
    postalLabel: "ZIP Code",
    postalPlaceholder: "5-digit ZIP or ZIP+4 (e.g. 90210 or 90210-1234)",
    postalRegex: /^\d{5}(-\d{4})?$/,
    postalHelp: "5-digit numeric ZIP Code or 9-digit ZIP+4.",
    taxIdLabel: "SSN or EIN (Social Security or Tax ID)",
    taxIdPlaceholder: "e.g. 123-45-6789 or 12-3456789",
    taxIdRegex: /^(\d{3}-?\d{2}-?\d{4}|\d{2}-?\d{7})$/,
    taxIdHelp: "9-digit Social Security Number (SSN) or Employer ID (EIN).",
    requiresVatGst: false,
    allowedDocTypes: [
      { id: "DriversLicense", label: "State Driver's License", requiresBack: true, description: "Front and Back side of valid State DL" },
      { id: "StateID", label: "State Identification Card", requiresBack: true, description: "Front and Back side of State issued photo ID" },
      { id: "Passport", label: "US Passport", requiresBack: false, description: "Information page of unexpired US Passport" },
      { id: "GreenCard", label: "Permanent Resident Card (Green Card)", requiresBack: true, description: "Front and Back side of Permanent Resident Card" },
    ],
  },

  "United Kingdom": {
    countryCode: "GB",
    countryName: "United Kingdom",
    phoneCode: "+44",
    phonePlaceholder: "10 or 11-digit UK phone number (e.g. 7911123456)",
    phoneRegex: /^\d{10,11}$/,
    phoneHelp: "Standard UK landline or mobile telephone number.",
    postalLabel: "Postcode",
    postalPlaceholder: "e.g. SW1A 1AA or EC1A 1BB",
    postalRegex: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
    postalHelp: "Valid UK Postcode format.",
    taxIdLabel: "UTR or NIN (Tax Reference or National Insurance No.)",
    taxIdPlaceholder: "e.g. 10-digit UTR or QQ123456C",
    taxIdRegex: /^(\d{10}|[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D])$/i,
    taxIdHelp: "10-digit Unique Taxpayer Reference (UTR) or National Insurance Number.",
    requiresVatGst: true,
    vatGstLabel: "UK VAT Number",
    vatGstPlaceholder: "e.g. GB123456789",
    vatGstRegex: /^(GB)?\d{9}$/i,
    allowedDocTypes: [
      { id: "Passport", label: "UK Passport", requiresBack: false, description: "Photo page of valid UK Passport" },
      { id: "DriversLicense", label: "UK Photocard Driving Licence", requiresBack: true, description: "Front and Back side of UK photocard DL" },
      { id: "NationalID", label: "Biometric Residence Permit (BRP)", requiresBack: true, description: "Front and Back side of UK BRP card" },
    ],
  },

  Canada: {
    countryCode: "CA",
    countryName: "Canada",
    phoneCode: "+1",
    phonePlaceholder: "10-digit Canadian phone number",
    phoneRegex: /^[2-9]\d{9}$/,
    phoneHelp: "10-digit phone number with area code.",
    postalLabel: "Postal Code",
    postalPlaceholder: "e.g. A1A 1A1",
    postalRegex: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
    postalHelp: "6-character Canadian Postal Code (A1A 1A1).",
    taxIdLabel: "SIN or BN (Social Insurance / Business Number)",
    taxIdPlaceholder: "e.g. 9-digit SIN (123-456-789)",
    taxIdRegex: /^\d{3}-?\d{3}-?\d{3}$/,
    taxIdHelp: "9-digit Social Insurance Number or Business Number.",
    requiresVatGst: true,
    vatGstLabel: "GST/HST Registration Number",
    vatGstPlaceholder: "e.g. 123456789RT0001",
    vatGstRegex: /^\d{9}RT\d{4}$/i,
    allowedDocTypes: [
      { id: "Passport", label: "Canadian Passport", requiresBack: false, description: "Photo page of valid Canadian Passport" },
      { id: "DriversLicense", label: "Provincial Driver's License", requiresBack: true, description: "Front and Back side of provincial DL" },
      { id: "ProvincialID", label: "Provincial Photo Card", requiresBack: true, description: "Front and Back side of government photo ID" },
    ],
  },

  Australia: {
    countryCode: "AU",
    countryName: "Australia",
    phoneCode: "+61",
    phonePlaceholder: "Australian phone number (e.g. 412345678)",
    phoneRegex: /^\d{9,10}$/,
    phoneHelp: "Standard Australian phone number.",
    postalLabel: "Postcode",
    postalPlaceholder: "4-digit Postcode (e.g. 2000)",
    postalRegex: /^\d{4}$/,
    postalHelp: "4-digit Australian Postcode.",
    taxIdLabel: "TFN or ABN (Tax File Number / Business Number)",
    taxIdPlaceholder: "e.g. 9-digit TFN or 11-digit ABN",
    taxIdRegex: /^(\d{8,9}|\d{11})$/,
    taxIdHelp: "8 or 9-digit Tax File Number (TFN) or 11-digit Australian Business Number (ABN).",
    requiresVatGst: true,
    vatGstLabel: "ABN GST Registration",
    vatGstPlaceholder: "e.g. 11-digit ABN",
    vatGstRegex: /^\d{11}$/,
    allowedDocTypes: [
      { id: "Passport", label: "Australian Passport", requiresBack: false, description: "Photo page of valid Australian Passport" },
      { id: "DriversLicense", label: "Australian Driver Licence", requiresBack: true, description: "Front and Back side of state DL" },
      { id: "ProofOfAge", label: "Proof of Age Card", requiresBack: true, description: "Front and Back side of photo card" },
    ],
  },

  Germany: {
    countryCode: "DE",
    countryName: "Germany",
    phoneCode: "+49",
    phonePlaceholder: "German phone number",
    phoneRegex: /^\d{9,12}$/,
    phoneHelp: "Standard German telephone number.",
    postalLabel: "Postleitzahl (PLZ)",
    postalPlaceholder: "5-digit PLZ (e.g. 10115)",
    postalRegex: /^\d{5}$/,
    postalHelp: "5-digit German postal code.",
    taxIdLabel: "Steuer-Identifikationsnummer (Steuer-ID)",
    taxIdPlaceholder: "e.g. 11-digit Steuer-ID (12 345 678 901)",
    taxIdRegex: /^\d{11}$/,
    taxIdHelp: "11-digit German Tax Identification Number.",
    requiresVatGst: true,
    vatGstLabel: "Umsatzsteuer-Identifikationsnummer (USt-IdNr.)",
    vatGstPlaceholder: "e.g. DE123456789",
    vatGstRegex: /^DE\d{9}$/i,
    allowedDocTypes: [
      { id: "NationalID", label: "Personalausweis (National ID)", requiresBack: true, description: "Front and Back side of German Personalausweis" },
      { id: "Passport", label: "Reisepass (Passport)", requiresBack: false, description: "Photo page of German Passport" },
      { id: "DriversLicense", label: "Führerschein (Driver's License)", requiresBack: true, description: "Front and Back side of EU photocard license" },
    ],
  },

  "United Arab Emirates": {
    countryCode: "AE",
    countryName: "United Arab Emirates",
    phoneCode: "+971",
    phonePlaceholder: "UAE phone number (e.g. 501234567)",
    phoneRegex: /^\d{9}$/,
    phoneHelp: "9-digit UAE mobile number without leading zero.",
    postalLabel: "Postal Code / PO Box",
    postalPlaceholder: "PO Box or 00000",
    postalRegex: /^[a-zA-Z0-9\s-]{3,10}$/,
    postalHelp: "PO Box or Postal Zone.",
    taxIdLabel: "Emirates ID / TRN (Tax Registration Number)",
    taxIdPlaceholder: "e.g. 784-XXXX-XXXXXXX-X or 15-digit TRN",
    taxIdRegex: /^(\d{3}-?\d{4}-?\d{7}-?\d{1}|\d{15})$/,
    taxIdHelp: "15-digit Emirates ID or Tax Registration Number.",
    requiresVatGst: true,
    vatGstLabel: "UAE TRN",
    vatGstPlaceholder: "15-digit TRN",
    vatGstRegex: /^\d{15}$/,
    allowedDocTypes: [
      { id: "EmiratesID", label: "Emirates ID Card", requiresBack: true, description: "Front and Back side of Federal Identity Card" },
      { id: "Passport", label: "UAE Passport", requiresBack: false, description: "Personal details page of valid UAE Passport" },
    ],
  },

  Other: {
    countryCode: "OTHER",
    countryName: "Other International Jurisdiction",
    phoneCode: "+1",
    phonePlaceholder: "International phone number with country code",
    phoneRegex: /^\d{7,15}$/,
    phoneHelp: "7 to 15 digit telephone number.",
    postalLabel: "Postal / ZIP Code",
    postalPlaceholder: "Postal or ZIP code",
    postalRegex: /^[A-Za-z0-9\s-]{3,10}$/,
    postalHelp: "Local postal code.",
    taxIdLabel: "Tax Identification Number (TIN)",
    taxIdPlaceholder: "National Tax ID or Registration No.",
    taxIdRegex: /^[A-Za-z0-9\s-]{5,25}$/,
    taxIdHelp: "Government issued tax identification number.",
    requiresVatGst: false,
    allowedDocTypes: [
      { id: "Passport", label: "International Passport", requiresBack: false, description: "Photo page of valid Passport" },
      { id: "NationalID", label: "National Identity Card", requiresBack: true, description: "Front and Back side of official National ID" },
      { id: "DriversLicense", label: "Driver's License", requiresBack: true, description: "Front and Back side of valid Driver's License" },
    ],
  },
};

export function getCountryKycRule(countryName?: string): CountryKycRule {
  if (!countryName) return COUNTRY_KYC_RULES["India"];
  const key = Object.keys(COUNTRY_KYC_RULES).find(
    (k) => k.toLowerCase() === countryName.trim().toLowerCase()
  );
  return COUNTRY_KYC_RULES[key || "Other"];
}

export function validateTaxIdByCountry(taxId: string, taxCountry: string): { valid: boolean; error?: string } {
  const rule = getCountryKycRule(taxCountry);
  const cleanId = taxId.trim();
  if (!cleanId) {
    return { valid: false, error: `${rule.taxIdLabel} is required.` };
  }
  if (!rule.taxIdRegex.test(cleanId)) {
    return { valid: false, error: `Invalid format for ${rule.taxIdLabel}. (${rule.taxIdHelp})` };
  }
  return { valid: true };
}

export function validatePostalCodeByCountry(postalCode: string, country: string): { valid: boolean; error?: string } {
  const rule = getCountryKycRule(country);
  const cleanCode = postalCode.trim();
  if (!cleanCode) {
    return { valid: false, error: `${rule.postalLabel} is required.` };
  }
  if (!rule.postalRegex.test(cleanCode)) {
    return { valid: false, error: `Invalid ${rule.postalLabel} for ${rule.countryName}. ${rule.postalHelp}` };
  }
  return { valid: true };
}
