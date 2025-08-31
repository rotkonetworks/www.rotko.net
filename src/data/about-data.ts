export interface AboutSection {
 title: string
 content: string[]
}

export interface Principle {
 title: string
 description: string
}

export interface TechnicalSpec {
 category: string
 items: string[]
}

export interface CompanyMetric {
 label: string
 value: string
}

export const aboutData = {
 hero: {
   title: "Infrastructure Without Compromise",
   subtitle: "Building the internet backbone that should have existed from the start."
 },
 
 problem: {
   title: "The Problem",
   content: [
     "Modern internet infrastructure is held hostage by monopolistic ISPs, overpriced transit, and decades of technical debt. Businesses accept 99.9% uptime as 'good enough' while losing thousands per minute of downtime.",
     "Cloud providers lock you in with proprietary APIs. CDNs charge premium for basic DDoS protection. Telcos throttle traffic they don't like.",
     "We got tired of accepting this as normal."
   ]
 },
 
 solution: {
   title: "Our Solution",
   content: [
     "Rotko Networks runs its own AS (Autonomous System) with BGP routing. We peer directly with major networks, cutting out middlemen and their markup.",
     "Our infrastructure is built on open standards: Linux, Kubernetes, WireGuard. No vendor lock-in. No proprietary protocols. Everything we build, you could run yourself—if you had the expertise.",
     "That expertise is what we're selling."
   ]
 },
 
 principles: [
   {
     title: "Own the Stack",
     description: "From BGP announcements to application deployments. No black boxes. No 'contact support' when things break at 3am."
   },
   {
     title: "Build for Ourselves",
     description: "Every service we offer runs our own infrastructure first. We're the most demanding users of our platform."
   },
   {
     title: "Radical Transparency",
     description: "Public status pages, open-source tools, detailed postmortems. Trust is earned through transparency, not marketing."
   }
 ],
 
 technical: [
   {
     category: "Network Layer",
     items: [
       "AS142108 - Our own autonomous system",
       "Direct peering with Tier 1 providers",
       "Anycast DNS with sub-10ms resolution",
       "DDoS mitigation at the edge"
     ]
   },
   {
     category: "Infrastructure Layer",
     items: [
       "Bare metal Kubernetes clusters",
       "NixOS for reproducible deployments",
       "Distributed storage with Ceph",
       "GitOps with zero manual intervention"
     ]
   }
 ],
 
 metrics: [
   { label: "Founded", value: "2023" },
   { label: "AS Number", value: "142108" },
   { label: "Regions", value: "6" },
   { label: "Uptime", value: "99.995%" }
 ]
}
