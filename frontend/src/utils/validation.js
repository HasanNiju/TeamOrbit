// Bangladesh mobile numbers: 01[3-9]XXXXXXXX, optionally prefixed with +88 or 88.
const BD_MOBILE_RE = /^(?:\+?88)?01[3-9]\d{8}$/;

export function isValidBangladeshMobile(value) {
  if (!value) return false;
  return BD_MOBILE_RE.test(value.replace(/[\s-]/g, ""));
}

/**
 * Validates the submission form. Returns a { field: errorKey } map for any
 * invalid fields; an empty object means the form is valid. Error keys map to
 * submission.errors.* translation strings, and this same shape is what a
 * real backend's 422 response is expected to return per-field.
 */
export function validateSubmission(values) {
  const errors = {};
  if (!values.name?.trim()) errors.name = "submission.errors.name";
  if (!values.designation?.trim()) errors.designation = "submission.errors.designation";
  if (!values.address?.trim()) errors.address = "submission.errors.address";
  if (!isValidBangladeshMobile(values.mobile)) errors.mobile = "submission.errors.mobile";
  if (!values.remarks?.trim()) errors.remarks = "submission.errors.remarks";
  return errors;
}
