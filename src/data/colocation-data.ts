// Colocation pricing for the /colocation builder. Indicative monthly USD —
// adjust freely; the builder reads everything from here.

export interface PriceOption {
  id: string
  label: string
  desc?: string
  price: number // USD / month (delta added to the running total)
  quote?: boolean // true = "contact for quote", excluded from the numeric total
}

export const colocationData = {
  // Per-rack-unit monthly price (volume discounts negotiated for 5U+ / 10U+).
  perUnit: 45,

  // Hard cap on the unit stepper; the page clamps this to actual free units.
  maxUnits: 26,

  bandwidth: [
    { id: 'bw-1g-10t', label: '1 Gbps port · 10 TB / mo', price: 40 },
    { id: 'bw-1g-unmetered', label: '1 Gbps unmetered', price: 150 },
    { id: 'bw-10g-100t', label: '10 Gbps port · 100 TB / mo', price: 400 },
    { id: 'bw-10g-unmetered', label: '10 Gbps unmetered', price: 900 },
  ] as PriceOption[],

  power: [
    { id: 'pwr-1a', label: 'Up to 1A @ 230V', desc: '≈ 230 W, included', price: 0 },
    { id: 'pwr-2a', label: 'Up to 2A @ 230V', desc: '≈ 460 W', price: 30 },
    { id: 'pwr-4a', label: 'Up to 4A @ 230V', desc: '≈ 920 W', price: 75 },
    { id: 'pwr-custom', label: 'Higher draw / dual feed', desc: 'A+B redundant power', price: 0, quote: true },
  ] as PriceOption[],

  ipv4: [
    { id: 'v4-1', label: '/32, 1 address', price: 3 },
    { id: 'v4-29', label: '/29, 8 addresses', price: 12 },
    { id: 'v4-28', label: '/28, 16 addresses', price: 22 },
    { id: 'v4-27', label: '/27, 32 addresses', price: 40 },
    { id: 'v4-24', label: '/24, 256 addresses', price: 300 },
    { id: 'v4-byoip', label: 'BYOIP / larger block', desc: 'Announced via AS142108', price: 0, quote: true },
  ] as PriceOption[],

  ipv6: [
    { id: 'v6-48', label: '/48', desc: 'included', price: 0 },
    { id: 'v6-44', label: '/44', price: 10 },
    { id: 'v6-40', label: '/40', price: 25 },
  ] as PriceOption[],

  // Rent a dedicated physical server in our rack, we provide the hardware.
  // (Distinct from colocation, where you bring your own.) 1-3 day delivery in
  // Asia; price scales with the networking (bandwidth commit + IPs) packed in.
  bareMetalDelivery: '1-3 day delivery in Asia',
  // Ryzen-only fleet (no EPYC). Specs are indicative of what we stock —
  // confirm exact RAM/NVMe on order.
  bareMetal: [
    { id: 'r5950x', cpu: 'Ryzen 9 5950X', cores: '16c / 32t · Zen 3', ram: '64 GB DDR4', disk: '2×2 TB / 2×4 TB PCIe 4.0 NVMe', price: 290 },
    { id: 'r7950x', cpu: 'Ryzen 9 7950X', cores: '16c / 32t · Zen 4', ram: '64 GB DDR5', disk: '2×2 TB / 2×4 TB PCIe 4.0 NVMe', price: 350 },
    { id: 'r9950x', cpu: 'Ryzen 9 9950X', cores: '16c / 32t · Zen 5', ram: '64 GB DDR5', disk: '2×2 TB / 2×4 TB PCIe 4.0 NVMe', price: 420 },
    { id: 'r7945hx', cpu: 'Ryzen 9 7945HX', cores: '16c / 32t · Zen 4', ram: '64 GB DDR5', disk: '2×2 TB / 2×4 TB PCIe 4.0 NVMe', price: 330 },
  ],

  addons: [
    { id: 'xconnect', label: 'Cross-connect', desc: 'Patch to another rack / carrier', price: 25 },
    { id: 'oob', label: 'Out-of-band / IPMI access', price: 10 },
    { id: 'ddos', label: 'DDoS protection', desc: 'Always-on scrubbing', price: 10 },
  ] as PriceOption[],

  // Smart hands is per-request, dispatched by an on-site engineer. No free tier.
  smartHandsRequest: 20,
}
