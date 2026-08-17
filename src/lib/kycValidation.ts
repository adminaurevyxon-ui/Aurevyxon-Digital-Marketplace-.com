import { getCountryKycRule, validateTaxIdByCountry, validatePostalCodeByCountry } from "./countryKycRules";

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateStep1(data: {
  fullName: string;
  dob: string;
  country: string;
  phoneNumber: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  idType: string;
  nationalId: string;
  hasFrontDoc?: boolean;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const countryRule = getCountryKycRule(data.country);

  // 1. Full Legal Name Validation
  const nameTrim = (data.fullName || "").trim();
  if (!nameTrim) {
    errors.fullName = "Full legal name is required.";
  } else if (!/^[a-zA-Z\s'\-]{2,100}$/.test(nameTrim)) {
    errors.fullName = "Full name can only contain letters, spaces, hyphens, and apostrophes. Numbers and symbols are not allowed.";
  } else {
    const words = nameTrim.split(/\s+/).filter(Boolean);
    if (words.length < 2) {
      errors.fullName = "Please enter your full legal name (must include at least first and last name, e.g. 'John Doe').";
    } else if (words.some(w => w.length < 1) || nameTrim.length < 3) {
      errors.fullName = "Full name is too short or invalid.";
    }
  }

  // 2. Date of Birth Validation
  if (!data.dob) {
    errors.dob = "Date of Birth is required.";
  } else {
    const dobDate = new Date(data.dob);
    const today = new Date();
    if (isNaN(dobDate.getTime())) {
      errors.dob = "Please enter a valid Date of Birth (YYYY-MM-DD).";
    } else if (dobDate > today) {
      errors.dob = "Date of Birth cannot be in the future.";
    } else {
      // Calculate age
      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
      if (age < 18) {
        errors.dob = `You must be at least 18 years old to register as a seller (current age: ${age}).`;
      } else if (age > 120) {
        errors.dob = "Please enter a valid Date of Birth.";
      }
    }
  }

  // 3. Country Validation
  if (!data.country || !data.country.trim()) {
    errors.country = "Country of residence is required.";
  }

  // 4. Phone Number Validation
  const phoneDigits = (data.phoneNumber || "").replace(/[\s\-\(\)]/g, "");
  if (!phoneDigits) {
    errors.phoneNumber = "Phone number is required.";
  } else if (!/^\d+$/.test(phoneDigits)) {
    errors.phoneNumber = "Phone number must contain numeric digits only. Letters and special characters are forbidden.";
  } else if (!countryRule.phoneRegex.test(phoneDigits)) {
    errors.phoneNumber = countryRule.phoneHelp;
  }

  // 5. Address Validation
  const addrTrim = (data.addressLine1 || "").trim();
  if (!addrTrim) {
    errors.addressLine1 = "Street address is required.";
  } else if (addrTrim.length < 8) {
    errors.addressLine1 = "Address is too short. Please enter complete street/building address (minimum 8 characters).";
  } else if (/^([a-zA-Z])\1+$/i.test(addrTrim.replace(/\s+/g, ""))) {
    errors.addressLine1 = "Address cannot be random repeating characters.";
  }

  // 6. City & State Validation
  const cityTrim = (data.city || "").trim();
  if (!cityTrim) {
    errors.city = "City is required.";
  } else if (cityTrim.length < 2 || !/^[a-zA-Z\s'\.-]+$/.test(cityTrim)) {
    errors.city = "Please enter a valid city name (letters and spaces only).";
  }

  const stateTrim = (data.state || "").trim();
  if (!stateTrim) {
    errors.state = "State / Province is required.";
  } else if (stateTrim.length < 2 || !/^[a-zA-Z\s'\.-]+$/.test(stateTrim)) {
    errors.state = "Please enter a valid state/province name.";
  }

  // 7. Postal Code Validation
  const postalVal = validatePostalCodeByCountry(data.postalCode || "", data.country);
  if (!postalVal.valid) {
    errors.postalCode = postalVal.error || "Invalid postal code.";
  }

  // 8. ID Type & National ID Number Format
  if (!data.idType) {
    errors.idType = "Please select a Government ID type.";
  }

  const idNum = (data.nationalId || "").trim().toUpperCase();
  if (!idNum) {
    errors.nationalId = "Government ID Number is required.";
  } else {
    if (data.idType === "PAN" || (data.country === "India" && data.idType === "PAN Card")) {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(idNum)) {
        errors.nationalId = "Invalid Indian PAN format. Must be 10 characters (e.g. ABCDE1234F).";
      }
    } else if (data.idType === "Aadhaar" || (data.country === "India" && data.idType === "Aadhaar Card")) {
      const cleanAadhaar = idNum.replace(/\s+/g, "");
      if (!/^\d{12}$/.test(cleanAadhaar)) {
        errors.nationalId = "Aadhaar number must be exactly 12 numeric digits.";
      }
    } else if (data.idType === "Passport") {
      if (!/^[A-Z0-9]{6,12}$/i.test(idNum)) {
        errors.nationalId = "Passport number must be 6 to 12 alphanumeric characters.";
      }
    } else if (data.idType === "VoterID") {
      if (!/^[A-Z]{3}[0-9]{7}$/i.test(idNum)) {
        errors.nationalId = "Voter ID (EPIC) format must be 3 letters followed by 7 digits (e.g. ABC1234567).";
      }
    } else if (data.idType === "SSN" || (data.country === "United States" && data.idType === "SSN")) {
      const cleanSSN = idNum.replace(/-/g, "");
      if (!/^\d{9}$/.test(cleanSSN)) {
        errors.nationalId = "SSN must be exactly 9 numeric digits (e.g. 123-45-6789).";
      }
    } else {
      // General ID validation: 5 to 30 alphanumerics, hyphens, spaces. No illegal symbols.
      if (!/^[A-Za-z0-9\s\-]{4,30}$/.test(idNum) || /[\$@#%^&*()_+=\[\]{}|\\/<>?,~`]/.test(idNum)) {
        errors.nationalId = "ID number contains invalid special characters or symbols. Enter a valid ID number.";
      }
    }
  }

  // 9. Document Upload Check (if provided in verification)
  if (data.hasFrontDoc === false) {
    errors.frontDoc = "Front side document image upload is required to proceed.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateStep2(data: {
  sellerType: string;
  taxCountry: string;
  taxId: string;
  gstin?: string;
  businessLegalName?: string;
  businessRegNumber?: string;
  authorizedSignatoryName?: string;
  taxAccepted?: boolean;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.taxCountry) {
    errors.taxCountry = "Tax Residence Country is required.";
  }

  // Tax ID Validation (Country Aware)
  const taxVal = validateTaxIdByCountry(data.taxId || "", data.taxCountry || "India");
  if (!taxVal.valid) {
    errors.taxId = taxVal.error || "Invalid Tax Identification Number.";
  }

  // GSTIN Validation for India or when provided
  if (data.gstin && data.gstin.trim().length > 0) {
    const cleanGstin = data.gstin.trim().toUpperCase();
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGstin)) {
      errors.gstin = "Invalid GSTIN format. Example: 27ABCDE1234F1Z5.";
    }
  }

  // Business-specific validations
  if (data.sellerType === "business") {
    const bizName = (data.businessLegalName || "").trim();
    if (!bizName) {
      errors.businessLegalName = "Registered Business Legal Name is required for business sellers.";
    } else if (bizName.length < 3 || !/^[a-zA-Z0-9\s'\.\-&]{3,100}$/.test(bizName)) {
      errors.businessLegalName = "Please enter a valid business legal name (letters, numbers, spaces).";
    }

    const bizReg = (data.businessRegNumber || "").trim();
    if (!bizReg) {
      errors.businessRegNumber = "Business Registration / CIN / Incorporation Number is required.";
    } else if (!/^[A-Za-z0-9\s\-]{4,30}$/.test(bizReg)) {
      errors.businessRegNumber = "Please enter a valid registration number without illegal symbols.";
    }

    const authName = (data.authorizedSignatoryName || "").trim();
    if (!authName) {
      errors.authorizedSignatoryName = "Authorized Signatory Name is required.";
    } else if (!/^[a-zA-Z\s'\-]{2,100}$/.test(authName) || authName.split(/\s+/).length < 2) {
      errors.authorizedSignatoryName = "Please enter full legal name of Authorized Signatory (at least 2 words).";
    }
  }

  if (data.taxAccepted === false) {
    errors.taxAccepted = "You must acknowledge tax declaration to proceed.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateStep3(data: {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
  country?: string;
  payoutMethod?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Bank Name Validation
  const bankTrim = (data.bankName || "").trim();
  if (!bankTrim) {
    errors.bankName = "Bank Name is required.";
  } else if (!/^[a-zA-Z\s'\.\-&]{2,100}$/.test(bankTrim)) {
    errors.bankName = "Bank name can only contain letters, spaces, hyphens, and ampersand. Numbers and gibberish symbols are forbidden.";
  }

  // Account Holder Name Validation
  const holderTrim = (data.accountHolder || "").trim();
  if (!holderTrim) {
    errors.accountHolder = "Account Holder Name is required.";
  } else if (!/^[a-zA-Z\s'\.\-]{2,100}$/.test(holderTrim)) {
    errors.accountHolder = "Account holder name can only contain letters, spaces, hyphens, and periods. Gibberish symbols or numbers are forbidden.";
  } else if (holderTrim.split(/\s+/).length < 2) {
    errors.accountHolder = "Please enter full account holder name (first and last name as listed in bank).";
  }

  // Account Number Validation
  const accNum = (data.accountNumber || "").replace(/[\s\-]/g, "");
  if (!accNum) {
    errors.accountNumber = "Bank Account Number is required.";
  } else if (!/^\d+$/.test(accNum)) {
    errors.accountNumber = "Bank Account Number must contain numeric digits only.";
  } else if (accNum.length < 8 || accNum.length > 20) {
    errors.accountNumber = "Bank Account Number must be between 8 and 20 numeric digits.";
  }

  // IFSC / SWIFT Code Validation
  const codeTrim = (data.ifscCode || "").trim().toUpperCase();
  if (!codeTrim) {
    errors.ifscCode = "IFSC or SWIFT/BIC Code is required.";
  } else {
    // Check if Indian IFSC format
    const isIndianIFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(codeTrim);
    // Check if SWIFT/BIC format
    const isSwift = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i.test(codeTrim);

    if (!isIndianIFSC && !isSwift) {
      errors.ifscCode = "Invalid IFSC or SWIFT/BIC code. (IFSC format: 11 characters e.g. SBIN0001234, or SWIFT: 8-11 alphanumerics e.g. HDFC33XXX).";
    }
  }

  // UPI ID Validation (if provided)
  if (data.upiId && data.upiId.trim().length > 0) {
    const upiTrim = data.upiId.trim();
    if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiTrim)) {
      errors.upiId = "Invalid UPI ID format. Example: name@bank or 9876543210@paytm.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateStep4(data: {
  termsAccepted: boolean;
  declarationAccepted: boolean;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.termsAccepted) {
    errors.termsAccepted = "You must accept the Seller Terms of Service.";
  }
  if (!data.declarationAccepted) {
    errors.declarationAccepted = "You must confirm that all provided information is accurate and true.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
