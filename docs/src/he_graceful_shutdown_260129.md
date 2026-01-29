# hurricane electric and the graceful shutdown disaster (2026-01-20)

## summary

on january 20, 2026, we performed scheduled maintenance on our edge infrastructure. we followed rfc 8326 by sending bgp graceful shutdown community to peers before taking down sessions. every peer except one re-established automatically when we came back online.

hurricane electric's sessions remained in idle state for 8 days until we manually escalated and they "cleared" them.

this post documents the incident and raises questions about the state of bgp implementations in supposedly production-grade tier 1 networks.

## what happened

- **2026-01-20 14:00 ICT**: scheduled maintenance begins, graceful shutdown community sent to all peers
- **2026-01-20 18:00 ICT**: maintenance complete, our side ready to peer
- **2026-01-20 - 2026-01-28**: he sessions stuck in idle, multiple attempts to reach noc
- **2026-01-28**: he finally responds, admits they "do not support graceful shutdown", manually clears sessions

affected sessions:
- bknix: 203.159.68.168 / 2001:df5:b881::168
- ams-ix: 80.249.212.139 / 2001:7f8:1:0:a500:14:2108:1

## the problem with "not supporting" graceful shutdown

rfc 8326 defines graceful shutdown as a mechanism to signal impending maintenance. the receiving router should:

1. receive the graceful_shutdown community (65535:0)
2. lower local_pref on those routes to deprioritize them
3. keep the session established
4. when routes are withdrawn, traffic shifts to alternate paths
5. when peer comes back, session continues normally

what graceful shutdown explicitly does **not** do:
- terminate the bgp session
- put the session into idle state
- require manual intervention to re-establish

if receiving graceful_shutdown causes your router to enter a permanent idle state where it never attempts to reconnect, your implementation is broken. this isn't a matter of "not supporting" a feature - it's actively mishandling a well-known community in a way that causes operational harm.

## design implications

this incident exposes a fundamental problem with bgp's trust model. when we send graceful shutdown, we're trusting that the other side will handle it correctly. there's no mechanism to verify peer behavior beforehand, and no way to prevent a broken implementation from causing extended outages.

the bcps around graceful shutdown (bcp 214/rfc 8327) assume implementations actually work. they don't account for tier 1 networks running code that treats a standard operational community as a session killer.

consider the implications:
- you follow best practices
- your peer's broken implementation punishes you for it
- you lose connectivity for over a week
- the "fix" is them manually clearing sessions

this creates a perverse incentive to not use graceful shutdown at all, defeating the entire purpose of the standard.

## he's response

their full response:

> We do not support graceful shutdown. The sessions were in an IDLE state on our side. We have cleared these sessions, and see them once again established.

no explanation of why idle sessions don't retry. no acknowledgment that this behavior is problematic. no indication they plan to fix it.

for context, hurricane electric operates as6939, one of the largest networks by peer count. they peer with thousands of networks. if their implementation breaks sessions when receiving graceful shutdown, this affects everyone who follows best practices during maintenance.

## impact

- 8 days of degraded ipv6 transit capacity
- reduced path diversity at bknix and ams-ix
- higher latency for some asia-pacific routes
- validator performance impact during rush hours

## recommendations

**for network operators:**
- document which peers break on graceful shutdown
- consider per-peer policies for maintenance procedures
- test peer behavior in controlled conditions if possible

**for he:**
- fix your bgp implementation to handle graceful_shutdown correctly
- if you intentionally drop sessions on graceful_shutdown, document this behavior publicly
- idle sessions should retry according to standard bgp timers, not require manual intervention

**for the ietf/community:**
- consider whether bcps need stronger language about implementation requirements
- graceful shutdown is only useful if implementations actually handle it gracefully

## conclusion

we did everything right. we announced maintenance to bknix. we used graceful shutdown per rfc 8326. we expected sessions to re-establish when we came back online.

instead we spent 8 days with degraded connectivity because a tier 1 network's bgp implementation treats a standard community as a reason to permanently idle sessions.

the next time someone asks why network operators are reluctant to follow bcps, point them to this post.
