# Post Mortems

## Why We Write Postmortems

At Rotko Network, we believe in radical transparency. While it's common in our
industry to see providers minimize their technical issues or deflect blame onto
others, we choose a different path. Every failure is an opportunity to learn
and improve - not just for us, but for the broader network engineering community.

We've observed a concerning trend where major providers often:
- Minimize the scope of incidents
- Provide vague technical details
- Deflect responsibility to third parties
- Hide valuable learning opportunities

A prime example of this behavior can be seen in the [October 2024 OVHcloud incident](https://blog.cloudflare.com/ovhcloud-outage-route-leak-october-2024),
where their initial response blamed a "peering partner" without acknowledging
the underlying architectural(basic filtering) vulnerabilities that allowed
the route leak to cause such significant impact.

In contrast, our postmortems:
- Provide detailed technical analysis
- Acknowledge our mistakes openly
- Share our learnings
- Document both immediate fixes and longer-term improvements
- Include specific timeline data for accountability
- Reference relevant RFCs and technical standards

## Directory

### 2024
- [2024-12-19: Edge Router Configuration Incident](network_outage_pm_241219.md)
  - Impact: 95-minute connectivity loss affecting AMSIX, BKNIX, and HGC Hong Kong IPTx
  - Root Cause: Misconceptions about router-id uniqueness requirements and OSPF behavior
  - Status: Partial resolution, follow-up planned for 2025

### 2025
- [2025-3-6: Router Misconfiguration Incident](network_outage_pm_250306.md)
  - Impact: 18-minute network outage affecting lower era points for validator and RPC nodes downtime
  - Root Cause: Misconfiguration between a router and switch.
  - Status: Fully recover
