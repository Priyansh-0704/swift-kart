export const EMPTY_ADDRESS_FORM = {
  label: "Home",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

export function validateAddress(formData) {
  const errs = {};

  const label = formData.label.trim();
  if (!label || label.length < 2 || label.length > 30) {
    errs.label = "Label must be between 2 and 30 characters.";
  }

  const fullName = formData.fullName.trim();
  if (!fullName || fullName.length < 2 || fullName.length > 50) {
    errs.fullName = "Full name must be between 2 and 50 characters.";
  }

  const phone = formData.phone.trim();
  if (!phone || !/^[0-9+\-\s]{10,15}$/.test(phone)) {
    errs.phone = "Phone number must be between 10 and 15 digits.";
  }

  const line1 = formData.addressLine1.trim();
  if (!line1 || line1.length < 2 || line1.length > 100) {
    errs.addressLine1 = "Address line 1 must be between 2 and 100 characters.";
  }

  if (formData.addressLine2 && formData.addressLine2.trim().length > 100) {
    errs.addressLine2 = "Address line 2 cannot exceed 100 characters.";
  }

  if (formData.landmark && formData.landmark.trim().length > 50) {
    errs.landmark = "Landmark cannot exceed 50 characters.";
  }

  const city = formData.city.trim();
  if (!city || city.length < 2 || city.length > 50) {
    errs.city = "City must be between 2 and 50 characters.";
  }

  const state = formData.state.trim();
  if (!state || state.length < 2 || state.length > 50) {
    errs.state = "State must be between 2 and 50 characters.";
  }

  const pincode = formData.pincode.trim();
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    errs.pincode = "Pincode must be exactly 6 digits.";
  }

  const country = formData.country.trim();
  if (!country || country.length < 2 || country.length > 40) {
    errs.country = "Country must be between 2 and 40 characters.";
  }

  return errs;
}