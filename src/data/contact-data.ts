export const contactData = {
  hero: {
    eyebrow: "Contact",
    title: "Talk to the engineers",
    subtitle:
      "Questions about RPC endpoints, validators, peering, or whitelabel infrastructure? Send a note below and we'll reply to the address you give.",
  },

  form: {
    // Where /api/contact relays the message. The backend sets the real
    // recipient; this is used as the mailto fallback.
    emailTo: "hq@rotko.net",
  },

  booking: {
    label: "Book a call",
    note: "Prefer to talk? Grab a slot directly.",
    // Cal.com scheduling for Rotko Networks (account: rotkonetworks@gmail.com).
    url: "https://cal.com/rotko",
  },
}
