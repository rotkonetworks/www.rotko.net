export interface NavItem {
 label: string
 href: string
 external?: boolean
}

export const navigationData: NavItem[] = [
 { label: "Home", href: "/" },
 { label: "About", href: "/about" },
 { label: "Team", href: "/team" },
 { label: "Services", href: "/services" },
 { label: "Infrastructure", href: "/infrastructure" },
 { label: "Blog", href: "/blog" },
 { label: "Contact", href: "/contact" }
]

export const footerData = {
 sections: [
   {
     title: "Company",
     links: [
       { label: "About", href: "/about" },
       { label: "Team", href: "/team" },
       { label: "Blog", href: "/blog" }
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
       { label: "Contact", href: "/contact" }
     ]
   },
   {
     title: "Legal",
     links: [
       { label: "Privacy", href: "/privacy" },
       { label: "Terms", href: "/terms" },
       { label: "SLA", href: "/sla" }
     ]
   }
 ],
 copyright: "© 2024 Rotko Networks. AS211184.",
 tagline: "Built with Linux, Rust, and stubbornness."
}

export const headerData = {
 logo: {
   text: "Rotko",
   suffix: "Networks",
   initial: "R"
 }
}
