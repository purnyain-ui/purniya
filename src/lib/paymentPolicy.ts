export const PREPAID_ANNOUNCEMENT = 'Free Express Shipping on Orders Above ₹999  |  Secure Online Payments';

// Old database/local-storage announcements must not restore an unavailable option.
export function prepaidAnnouncement(text: string | null | undefined): string {
  return !text?.trim() || /\bcod\b|cash\s+on\s+delivery|pay\s+on\s+delivery/i.test(text)
    ? PREPAID_ANNOUNCEMENT : text;
}
