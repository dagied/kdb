/**
 * Validates the full resident registration payload.
 * Returns { valid: true } or { valid: false, errors: string[] }
 */
export function validateResidentPayload(body) {
  const errors = [];

  // ── Personal ──────────────────────────────────────────────────────────────
  if (!body.first_name?.trim())        errors.push('First name is required.');
  if (!body.father_name?.trim())       errors.push("Father's name is required.");
  if (!body.grandfather_name?.trim())  errors.push("Grandfather's name is required.");

  if (!body.date_of_birth)             errors.push('Date of birth is required.');
  else {
    const dob = new Date(body.date_of_birth);
    if (isNaN(dob.getTime()))          errors.push('Date of birth is not a valid date.');
    else if (dob > new Date())         errors.push('Date of birth cannot be in the future.');
  }

  // Accept both 'Male'/'Female' and 'M'/'F'
  const validGenders = ['Male', 'Female', 'M', 'F'];
  if (!body.gender || !validGenders.includes(body.gender))
    errors.push(`Gender must be Male, Female, M, or F.`);

  const validMarital = ['Single', 'Married', 'Divorced', 'Widowed'];
  if (!body.marital_status || !validMarital.includes(body.marital_status))
    errors.push(`Marital status must be one of: ${validMarital.join(', ')}.`);

  // ── Household ─────────────────────────────────────────────────────────────
  if (!body.house_id) {
    errors.push("House ID is required.");
  }

  const validRoles = ['Head', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Other Dependent'];
  if (!body.household_role || !validRoles.includes(body.household_role))
    errors.push(`Household role must be one of: ${validRoles.join(', ')}.`);

  // STRONG VALIDATION for create_new_household with INTEGER household_id
  const isCreatingNew = body.create_new_household === true || body.create_new_household === 'true';
  
  if (!isCreatingNew) {
    if (!body.household_id) {
      errors.push("Household ID is required when not creating a new household.");
    } else if (isNaN(Number(body.household_id))) {
      errors.push("Household ID must be a number (integer).");
    }
  }
  
  if (isCreatingNew && body.household_id) {
    errors.push("Do not send household_id when creating a new household. It will be auto-generated.");
  }

  // ── Phones (optional) ────────────────────────────────────────────────────
  if (body.phones && Array.isArray(body.phones)) {
    body.phones.forEach((p, i) => {
      if (p && !/^[0-9+\-\s()]{7,15}$/.test(p.trim()))
        errors.push(`Phone number at position ${i + 1} is invalid.`);
    });
  }

  return errors.length ? { valid: false, errors } : { valid: true };
}

/**
 * Sanitises a string — trims whitespace, returns null if empty.
 */
export function clean(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s === '' ? null : s;
}