/**
 * JalSejiwan - Operational Input Sanitization & Validation Layer
 * Protects database updates and client-side flows from script execution, HTML injection, and corrupt numeric logs.
 */

/**
 * Sanitizes input text to block and remove script tags, HTML injection, and extreme SQL-like keywords.
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  let clean = String(input);

  // 1. Strip script tags and their inner content
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 2. Remove other common dangerous tags or inline handlers
  clean = clean.replace(/<[^>]*>?/gm, ''); // Strips all HTML tags
  clean = clean.replace(/javascript:/gi, '');
  clean = clean.replace(/onload=/gi, '');
  clean = clean.replace(/onerror=/gi, '');
  clean = clean.replace(/onclick=/gi, '');

  // 3. Remove raw SQL command statements that are highly nested
  // (Prevents SQL-pattern lookalikes without breaking common words)
  clean = clean.replace(/\b(UNION|SELECT|INSERT|DELETE|DROP|ALTER)\b/gi, '');

  return clean.trim();
}

/**
 * Validates descriptive name lengths (typically customer or user name)
 */
export function validateName(name: string | null | undefined): { valid: boolean; error: string | null; value: string } {
  const clean = sanitizeString(name);
  if (!clean) {
    return { valid: false, error: 'Name is required.', value: '' };
  }
  if (clean.length < 2) {
    return { valid: false, error: 'Name is too short (minimum 2 characters).', value: clean };
  }
  if (clean.length > 80) {
    return { valid: false, error: 'Name is too long (maximum 80 characters).', value: clean.slice(0, 80) };
  }
  
  // Basic alphabet/space/accent check
  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s.\-']+$/;
  if (!nameRegex.test(clean)) {
    return { valid: false, error: 'Name contains invalid characters.', value: clean };
  }

  return { valid: true, error: null, value: clean };
}

/**
 * Validates phone numbers (minimum 10 digits, formatted format options)
 */
export function validatePhone(phone: string | null | undefined): { valid: boolean; error: string | null; value: string } {
  if (!phone) {
    return { valid: false, error: 'Phone number is required.', value: '' };
  }
  
  // Strip all non-numeric characters to test ground number
  const numbersOnly = String(phone).replace(/\D/g, '');
  
  if (numbersOnly.length < 10) {
    return { valid: false, error: 'Phone must be at least 10 digits.', value: numbersOnly };
  }
  
  if (numbersOnly.length > 15) {
    return { valid: false, error: 'Phone cannot exceed 15 digits.', value: numbersOnly.slice(0, 15) };
  }

  return { valid: true, error: null, value: numbersOnly };
}

/**
 * Validates typical email addresses
 */
export function validateEmail(email: string | null | undefined): { valid: boolean; error: string | null; value: string } {
  const clean = sanitizeString(email);
  if (!clean) {
    return { valid: false, error: 'Email is required.', value: '' };
  }
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return { valid: false, error: 'Invalid email address format.', value: clean };
  }

  return { valid: true, error: null, value: clean };
}

/**
 * Validates dynamic currency/amount fields
 */
export function validateAmount(
  amount: any, 
  allowZero: boolean = true, 
  max: number = 1000000
): { valid: boolean; error: string | null; value: number } {
  const parsed = Number(amount);
  
  if (isNaN(parsed)) {
    return { valid: false, error: 'Amount must be a valid number.', value: 0 };
  }

  if (parsed < 0) {
    return { valid: false, error: 'Amount cannot be negative.', value: 0 };
  }

  if (!allowZero && parsed === 0) {
    return { valid: false, error: 'Amount must be greater than zero.', value: parsed };
  }

  if (parsed > max) {
    return { valid: false, error: `Amount exceeds allowable limit of ₹${max}.`, value: parsed };
  }

  // Round to 2 decimal places maximum
  const rounded = Math.round(parsed * 100) / 100;
  return { valid: true, error: null, value: rounded };
}

/**
 * Validates whole quantity levels (bottle inventory, route delivery log limits)
 * Handles empty can log updates as well.
 */
export function validateQuantity(
  qty: any, 
  allowZeroOnPositive: boolean = true, 
  max: number = 10000
): { valid: boolean; error: string | null; value: number } {
  const parsed = parseInt(qty, 10);

  if (isNaN(parsed)) {
    return { valid: false, error: 'Quantity must be a valid integer.', value: 0 };
  }

  if (parsed < 0) {
    return { valid: false, error: 'Quantity cannot be negative.', value: 0 };
  }

  if (!allowZeroOnPositive && parsed === 0) {
    return { valid: false, error: 'Quantity must be at least 1.', value: parsed };
  }

  if (parsed > max) {
    return { valid: false, error: `Quantity exceeds the operational threshold of ${max}.`, value: parsed };
  }

  return { valid: true, error: null, value: parsed };
}
