export function isPrivateInquiryEnabled() {
  return process.env.NEXT_PUBLIC_PRIVATE_INQUIRY_ENABLED === 'true';
}
