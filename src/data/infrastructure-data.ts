export const infrastructureData = {
 hero: {
   title: "Global Infrastructure",
   subtitle: "AS142108 - Built for resilience, not marketing"
 },
 
 network: {
   title: "Network Information",
   asn: "142108",
   organization: "Rotko Networks",
   irrAsSet: "AS142108:AS-ROTKONETWORKS",
   primarySite: "Bangkok, Thailand",
   policy: "Open peering",
   peeringDb: "https://www.peeringdb.com/net/36301",
   peeringInfo: "https://peering.rotko.net"
 },
 
 stats: {
   capacity: "12G",
   ram: "3TB",
   cores: "728",
   uptime: "99.84%"
 },
 
 ibpStats: {
   title: "Infrastructure Builders' Programme",
   description: "Part of a global collective providing resilient infrastructure for decentralized networks",
   dashboard: "https://ibdash.dotters.network",
   metrics: [
     { label: "Global Operators", value: "12" },
     { label: "Countries", value: "12" },
     { label: "Combined Bandwidth", value: "48Gbps" },
     { label: "Active Validators", value: "47" },
     { label: "Networks Supported", value: "8" },
     { label: "Collective Uptime", value: "99.92%" }
   ]
 },
 
 services: [
   {
     name: "Colocation SEA",
     description: "Rack space in Bangkok datacenter",
     features: [
       "24/7 physical access",
       "Redundant power (N+1)",
       "Direct fiber access",
       "Remote hands available"
     ]
   },
   {
     name: "BYOC Hosting",
     description: "Bring Your Own Cloud - full control",
     features: [
       "Your hardware, our infrastructure",
       "Direct BGP to your servers",
       "Full routing table access",
       "Traffic engineering control"
     ]
   },
   {
     name: "Transit & Peering",
     description: "Full table BGP transit",
     features: [
       "3M+ IPv4 prefixes",
       "Multiple upstream providers",
       "Direct IXP connections",
       "DDoS protection included"
     ]
   }
 ],
 
 hardware: {
   title: "Hardware Inventory",
   routers: [
     { model: "MikroTik CCR2216", count: 2, role: "Edge routing, full BGP tables" },
     { model: "MikroTik CCR2116", count: 1, role: "Core routing, VRRP primary" },
     { model: "MikroTik CCR2004", count: 1, role: "Management & OOB access" }
   ],
   switches: [
     { model: "100G Switches", count: 2, role: "Storage network backbone" },
     { model: "Management Switch", count: 1, role: "IPMI/OOB access" }
   ],
   compute: [
     { model: "AMD EPYC 7713", count: 1, role: "Storage node, 64 cores" },
     { model: "AMD EPYC 9654", count: 1, role: "Storage node, 96 cores" },
     { model: "AMD EPYC 7742", count: 1, role: "Storage node, 64 cores" },
     { model: "AMD Ryzen 9950X/X3D", count: 2, role: "Latest gen validators" },
     { model: "AMD Ryzen 7950X/X3D", count: 4, role: "High IPC validators" },
     { model: "AMD Ryzen 5950X", count: 2, role: "Validator nodes" },
     { model: "AMD Ryzen 5600G/7945HX", count: 2, role: "Auxiliary validators" }
   ]
 },
 
 datacenter: {
   title: "Datacenter",
   location: "Bangkok, Thailand",
   facility: "Tier III certified",
   power: "N+1 redundancy, dual feeds",
   cooling: "N+1 CRAC units",
   connectivity: "Carrier-neutral, 10+ providers",
   rack: "48U, dedicated cabinet"
 },
 
 routing: {
   title: "Direct BGP to Servers",
   description: "BGP routes directly to servers for maximum traffic engineering control. Anycast for internal balancing and resilience.",
   features: [
     "Full routing table on every server",
     "Anycast for automatic failover",
     "Path selection at application layer",
     "No middlebox bottlenecks",
     "BGP communities for fine control",
     "MED and local-pref manipulation"
   ]
 },
 
 connectivity: {
   title: "Connectivity",
   transit: [
     { provider: "HGC", speed: "2x 800M", type: "IP Transit" }
   ],
   exchanges: [
     { name: "BKNIX", speed: "10G", type: "Local IX" },
     { name: "AMS-IX Bangkok", speed: "1G", type: "Regional IX" },
     { name: "AMS-IX Hong Kong", speed: "200M", type: "Regional IX" },
     { name: "AMS-IX Europe", speed: "100M", type: "Remote IX" }
   ]
 },
 
 resilience: {
   title: "Resilience & Redundancy",
   items: [
   "Anycast for internal load balancing",
   "2x 800M HGC transit with automatic failover",
   "VRRP redundancy for core routing",
   "Direct BGP to servers eliminates SPOF",
   "100G internal fabric for storage network"
 ]
 }
}
