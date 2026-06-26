export interface NavItem {
  label: string
  href?: string
  external?: boolean
  children?: NavItem[]
}

export const navigationData: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Infrastructure", href: "/infrastructure" },
  { label: "Software", href: "/software" },
  {
    label: "About",
    children: [
      { label: "Team", href: "/team" },
      { label: "News", href: "/news" },
      { label: "Blog", href: "/blog" }
    ]
  },
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
        { label: "VM Hosting", href: "/hosting" },
        { label: "Colocation", href: "/colocation" },
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
  tagline: "Where bits flow through.",
  social: [
    { label: "GitHub", href: "https://github.com/rotkonetworks", icon: "i-mdi-github" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/rotko-networks", icon: "i-mdi-linkedin" }
  ]
}

export const headerData = {
  logo: {
    text: "Rotko",
    suffix: "Networks",
    initial: "R"
  }
}
