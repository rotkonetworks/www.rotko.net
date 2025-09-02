# Network Outage Postmortem (2025-3-6)

## Summary
On March 6, 2025, at approximately 09:31 UTC, a network misconfiguration on router caused an outage, 
rendering the router and other dependent infrastructure unreachable. Reversing the misconfiguration did not
immediately restore network connectivity, leading to an 18-minute downtime until a router reboot resolved the issue.
The outage impacted a lower era points for our validators, while our RPC nodes SLA allows ~40 mins of weekly downtime.

## Technical Details
The issue arose when configuring our router & switch infra. Approximately 1-3 minutes later after doing the suspected cause
the infra is not reachable using ssh and our proxy for ssh is inside the infra. And after tried to use WireGuard, we can ssh
into the router and reverse the changes. However, this reversal did not take effect immediately, leaving the router in a stuck
state where SSH access was unreachable. This situation persisted until a manual reboot restored proper functionality.

## Response Timeline
- 09:31 UTC: Network outage occurred & connectivity loss detected
- ~09:37 UTC: Connectivity with WireGuard established
- ~09:38 UTC: Reversal of the root cause, but not solve the problem
- ~09:47 UTC: Decision to reboot the router
- 09:49 UTC: Service restored after rebooting the router

## Mitigation
The immediate resolution was to reboot bkk50, which restored its functionality as the network gateway. However, this incident highlighted
the lack of a fully redundant infrastructure.

## Impact
- Network downtime lasted approximately 18 minutes, affecting internal infrastructure.
- No major disruption to services, but some validators experienced mildly lower era points in Era 7801 for [Kusama](https://apps.turboflakes.io/?chain=kusama#/validator/ESSZefozpZYVLbLF1vaGtabthQYg8PVXiTytVm6YiiwAnee?mode=history) and Era 1738 for [Polkadot](https://apps.turboflakes.io/#/validator/1ArdZJtNUrZsfidfn1t69xHaSWwzf6PQNdLEUpcnVmbkZc5?mode=history).
- No impact on RPC services, which remain within SLA allowances (weekly downtime limit: 40 minutes).

## Current Status and Future Plans
The network is now fully operational. However, this incident underscores the need for more robust redundancy and streamlined access to critical infrastructure.

## Future Work
### Identified Problems:
- Lack of a redundant fallback mechanism for critical routers.
- Current proxy method for router access relies on internal infrastructure instead of an external jump server.
- Forced reliance on WireGuard VPN for emergency access, which can be cumbersome.
### Improvement Plan:
Jump Server Access: Configure external jump server access, allowing:
 - Simple SSH access via ssh router_name@jump.rotko.net.
 - Users to have pre-configured jump configurations on their machines.
 - Access management via per-user SSH authorized_keys file.

Network Redundancy:
 - Improving infra setup to have more redundancy.
