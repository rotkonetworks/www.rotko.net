// src/data/team-data.ts
export interface TeamMember {
  name: string
  title: string
  description: string
  image: string
  location: string
  github?: string
  linkedin?: string
  setup: {
    editor: string
    os: string
    de: string
    shell: string
  }
}

export const teamData: TeamMember[] = [
  {
    name: "Tommi",
    title: "Chief Executive Operator",
    description:
      "Built first PC before learning to read. Same approach to infrastructure - hands-on, component by component, adapting Oxide rack designs when vendors won't deliver. Two decades building what we need, not what VCs want. Power user first - if we won't use it daily, we won't build it. Runs BGP because telco dependency is technical debt. Makes Linux tooling accessible without dumbing it down.",
    image: "tommi.webp",
    location: "Southeast Asia",
    github: "https://github.com/hitchhooker",
    linkedin: "https://www.linkedin.com/in/tomminiemi",
    setup: {
      editor: "neovim",
      os: "nixOS/arch",
      de: "bspwm",
      shell: "zsh",
    },
  },
  {
    name: "Yass",
    title: "Backend Developer",
    description:
      "Electrical engineering background - understands latency from transistor to TCP. Ships production Rust code that handles millions of concurrent connections. Active contributor to tokio ecosystem. Reduced query times 100x by understanding cache hierarchies. Chooses tools that eliminate entire bug classes: Rust for memory safety, NixOS for reproducible deployments.",
    image: "yass.webp",
    location: "Mediterranean",
    github: "https://github.com/yassinebenarbia",
    setup: {
      editor: "neovim",
      os: "nixOS",
      de: "hyprland/niri",
      shell: "zsh",
    },
  },
  {
    name: "Al",
    title: "DevOps Engineer",
    description:
      "Math background, pragmatic execution. Catches production issues before they happen because monitoring is proactive, not reactive. Infrastructure as code that actually works - no snowflakes, no surprises. Vim efficiency translates to everything: one-liners that replace entire scripts, deployments that take seconds not hours. If it breaks at 3am, his automation already fixed it. Treats uptime like a solved problem because proper engineering makes it one.",
    image: "al.webp",
    location: "Southeast Asia",
    github: "https://github.com/Catopish",
    setup: {
      editor: "neovim",
      os: "Arch Linux",
      de: "bspwm",
      shell: "zsh",
    },
  },
  {
    name: "Allan",
    title: "Fullstack Developer",
    description:
      "Brazilian developer who stars Jetpack Compose chart libraries and Rust components like he's building a wishlist for the perfect stack. Contributes to company's identity registrar and peering infrastructure while somehow finding time to explore everything from Android memory leak detection to terminal emulators. Part-time contributor who ships more features than most full-timers. Has an eye for UI libraries that actually work across different screen sizes and network conditions.",
    image: "allan.webp",
    location: "Pacific Coast",
    github: "https://github.com/allanveloso",
    setup: {
      editor: "android_studio",
      os: "Windows",
      de: "Windows 11",
      shell: "wsl",
    },
  },
  {
    name: "Mikko",
    title: "Advisor",
    description:
      "Over 40 years of technical experience spanning all layers from hardware programming to application interfaces. Started at Nokia Mobile Phones in the mid-1980s, hand-writing UI in NEC Assembly without compilers and inventing the menu buttons on mobile displays - a feature now ubiquitous in mobile interfaces. Served as IT Manager at University of Turku, managing complete infrastructure including datacenter upgrades, WLAN, network topology, and private cloud services. Deep expertise in everything from Novell NetWare to modern networking makes him invaluable for building robust Internet infrastructure at Rotko Networks.",
    image: "mikko.webp",
    location: "Nordic",
    linkedin: "https://www.linkedin.com/in/mniemi/",
    setup: {
      editor: "notepad",
      os: "Windows",
      de: "Windows 11",
      shell: "cmd",
    },
  },
]

export const teamPageData = {
  hero: {
    title: "Team",
    subtitle: "we build what we use. no third party dependencies."
  },
  stats: [
    { label: "corporate bs", value: "0" }
  ],
  principles: [
    "infrastructure from first principles - BGP to browser",
    "fix upstream instead of working around broken abstractions",
    "remote by default. results over meetings.",
    "if it can't handle 3am failures on its own, it's not done"
  ],
  careers: {
    title: "Careers at Rotko",
    description: [
      "Interested in joining our team? We're always looking for talented individuals who share our passion for innovation and quality.",
      "Connect with us on IRC to discuss opportunities, ask questions, or just chat about technology."
    ],
    contactLink: {
      text: "[Contact Us]",
      href: "/contact"
    }
  }
}
