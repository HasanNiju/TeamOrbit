// Backend validation is authoritative (PRD §11) — the frontend's checks are
// only a courtesy; every one of these is re-checked here regardless of what
// the client already validated.

const BD_MOBILE_RE = /^(?:\+8801|01)[3-9]\d{8}$/;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidBdMobile(value) {
  return typeof value === "string" && BD_MOBILE_RE.test(value.trim());
}

/** Returns an array of { field, message } problems; empty array means valid. */
function validateSubmissionInput(body) {
  const errors = [];
  if (!isNonEmptyString(body.name)) errors.push({ field: "name", message: "Name is required." });
  if (!isNonEmptyString(body.designation)) errors.push({ field: "designation", message: "Designation is required." });
  if (!isNonEmptyString(body.address)) errors.push({ field: "address", message: "Address is required." });
  if (!isNonEmptyString(body.mobile)) {
    errors.push({ field: "mobile", message: "Mobile number is required." });
  } else if (!isValidBdMobile(body.mobile)) {
    errors.push({ field: "mobile", message: "Enter a valid Bangladeshi mobile number." });
  }
  if (!isNonEmptyString(body.opinion)) errors.push({ field: "opinion", message: "Opinion / remarks is required." });
  return errors;
}

module.exports = { isNonEmptyString, isValidBdMobile, validateSubmissionInput };
