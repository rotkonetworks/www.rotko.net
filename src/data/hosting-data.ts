// VM hosting catalog for the /hosting page. Mirrors the HermesHost control-plane
// catalog (the Rust API that provisions onto Rotko's Proxmox + ZFS clusters).
// Prices are USD / month; node class applies a multiplier; IPv4 is opt-in.

export interface NodeClass {
  id: string
  label: string
  cpu: string
  multiplier: number
}

export const hostingData = {
  // Only classes the control plane can actually place on a distinct node.
  // "Zen 4"/epyc9k mapped to the same node (bkk08) as Zen 3, so charging its
  // 1.4× multiplier was a phantom upsell — dropped until bkk07 (real Zen 4) is
  // wired as its own provisioning target with its own IPv4 pool.
  nodeClasses: [
    { id: 'epyc7k', label: 'Zen 3', cpu: 'AMD EPYC 7003', multiplier: 1.0 },
  ] as NodeClass[],

  // Per-core pricing. Shared = oversubscribed (fractional cores); dedicated =
  // pinned. Node class (Zen3/Zen4) multiplies the compute portion only.
  // Targets ~50% of AWS (vCPU $18, RAM $4.50, io2 $0.50/GB, egress $0.09/GB).
  pricing: {
    sharedCoreMonth: 7,      // $/vCPU·mo (oversubscribed)
    dedicatedCoreMonth: 9,   // $/vCPU·mo (pinned) — 50% of AWS $18 (Zen3 base)
    ramGbMonth: 2.25,        // $/GB·mo — 50% of AWS $4.50
    baseDiskGb: 25,          // NVMe included free with every VM
  },

  // The only core sizes we sell. Shared/dedicated is automatic: fractional
  // cores are oversubscribed (shared), whole cores are pinned (dedicated).
  coreOptions: [
    { vcpu: 0.25, dedicated: false },
    { vcpu: 0.5, dedicated: false },
    { vcpu: 1, dedicated: true },
    { vcpu: 2, dedicated: true },
    { vcpu: 4, dedicated: true },
    { vcpu: 8, dedicated: true },
    { vcpu: 16, dedicated: true },
  ],

  // The only RAM sizes we sell (in GB; 0.5 = 512 MB).
  ramOptions: [0.5, 1, 2, 4, 8, 16, 32, 64, 128],

  // Per /32 IPv4, opt-in (IPv6 /64 is always included and free).
  ipv4Month: 3,

  // Extra NVMe (ZFS data volume) is cheap and abundant here, disk is not the
  // constraint, bandwidth is. Add capacity in 1 TB steps.
  storage: {
    perTbMonth: 100,    // $0.10/GB — mid-market block storage (DO/Vultr SG), ~2× Hetzner
    stepGb: 10,         // add NVMe in 10 GB increments ($1.00 each)
    maxGb: 24000,
  },

  // Per-VM traffic. Transit is the binding cost (~$2,000/Gbps·mo ≈ ~$10/TB
  // delivered), so overage is $45/TB — 50% of AWS ($0.09/GB) and ~4.5× our
  // cost. Note: the 1 TB "included" is ~$10 of real cost per VM — trim it (or
  // go fully metered) if it eats compute margin on small boxes.
  bandwidth: {
    includedTb: 1,     // included free with every VM (~$10 real cost — review)
    perTbMonth: 45,    // $0.045/GB — 50% of AWS, ~4.5× transit cost
    maxTb: 100,
  },

  features: [
    { icon: 'i-mdi-ip-network', title: 'IPv6-first', desc: 'A routed /64 per VM, included. IPv4 opt-in.' },
    { icon: 'i-mdi-harddisk', title: 'RAID PCIe 4.0 NVMe', desc: '6000 MB/s RAID-protected NVMe, snapshots and extra data volumes.' },
    { icon: 'i-mdi-flash', title: 'Cloud-init + apps', desc: 'Zero-touch boot config and one-click app images.' },
    { icon: 'i-mdi-chart-line', title: '95th-percentile billing', desc: 'Burst to 1 Gbit/s; pay on p95 against your commit.' },
    { icon: 'i-mdi-router-network', title: 'Routed BGP fabric', desc: 'On AS142108 with BIRD, no NAT, real addresses.' },
    { icon: 'i-mdi-console', title: 'Full root', desc: 'KVM VMs, your kernel, serial + console access.' },
  ],
}
