export const coffeeSupportCopy = {
  title: "Buy us a coffee",
  titleSuccess: "You just made our day",
  descriptionModal:
    "Always free — no signup, no paywalls. If we helped you today, a coffee covers our API costs and keeps this free for the next person.",
  description:
    "FlexiSeo Expert is free on purpose. Every audit uses paid Google and AI APIs — your coffee helps us keep it that way for everyone.",
  descriptionAudit: (auditUrl: string) =>
    `Thanks for trusting us with ${auditUrl}. If this report gave you clarity, a coffee helps us run the next audit for someone else — for free.`,
  descriptionAuditModal: (auditUrl: string) =>
    `If your report for ${auditUrl} helped, pick an amount below — it keeps FlexiSeo free for the next person.`,
  success: "Thank you — truly. Your support keeps FlexiSeo free for everyone.",
  footerNote: "Secure via Razorpay · Optional · Always free to use",
} as const;
