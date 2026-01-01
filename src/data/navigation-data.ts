export interface NavItem {
  label: string
  href: string
  external?: boolean
}

export const navigationData: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Stake", href: "/software/vctl" },
  { label: "Services", href: "/services" },
  { label: "Software", href: "/software" },
  { label: "Infrastructure", href: "/infrastructure" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" }
]

export const footerData = {
  sections: [
    {
      title: "Staking",
      links: [
        { label: "Stake Now", href: "/software/vctl" },
        { label: "Polkadot", href: "/services/staking/polkadot" },
        { label: "Kusama", href: "/services/staking/kusama" },
        { label: "Penumbra", href: "/services/staking/penumbra" }
      ]
    },
    {
      title: "Infrastructure",
      links: [
        { label: "Services", href: "/services" },
        { label: "Endpoints", href: "/services/endpoints/polkadot" },
        { label: "Status", href: "https://status.rotko.net", external: true }
      ]
    },
    {
      title: "Resources",
      links: [
        { label: "Software", href: "/software" },
        { label: "Blog", href: "/blog" },
        { label: "GitHub", href: "https://github.com/rotkonetworks", external: true }
      ]
    },
  //   {
  //     title: "Legal",
  //     links: [
  //       { label: "Privacy", href: "/privacy" },
  //       { label: "Terms", href: "/terms" },
  //       { label: "SLA", href: "/sla" }
  //     ]
  //   }
  ],
  copyright: "© 2025 Rotko Networks. AS142108.",
  tagline: "Where bits flow through iron will."
}

export const headerData = {
  logo: {
    text: "Rotko",
    suffix: "Networks",
    initial: "R"
  }
}
