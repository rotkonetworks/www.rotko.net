export interface NavItem {
  label: string
  href: string
  external?: boolean
}

export const navigationData: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Validators", href: "/validators" },
  { label: "Software", href: "/software" },
  { label: "Infrastructure", href: "/infrastructure" },
  { label: "Team", href: "/team" },
  { label: "Blog", href: "/blog" },
  { label: "News", href: "/news" },
  { label: "Contact", href: "/contact" }
]

export const footerData = {
  sections: [
    {
      title: "Company",
      links: [
        { label: "Team", href: "/team" },
        { label: "Blog", href: "/blog" },
        { label: "News", href: "/news" },
        { label: "Contact", href: "/contact" }
      ]
    },
    {
      title: "Infrastructure",
      links: [
        { label: "Network", href: "/infrastructure" },
        { label: "Services", href: "/services" },
        { label: "Status", href: "https://status.rotko.net", external: true }
      ]
    },
    {
      title: "Resources",
      links: [
        { label: "GitHub", href: "https://github.com/rotkonetworks", external: true },
        { label: "Documentation", href: "/docs" },
        { label: "Software", href: "/software" }
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
