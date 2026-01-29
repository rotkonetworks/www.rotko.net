# hurricane electric and the graceful shutdown disaster (2026-01-20)

## summary

on january 20, 2026, we performed scheduled maintenance on our edge infrastructure. we followed rfc 8326 by sending bgp graceful shutdown community to peers before taking down sessions. every peer except one re-established automatically when we came back online.

hurricane electric's sessions remained in idle state for 8 days until we manually escalated and they "cleared" them.

## what happened

- **2026-01-20 14:00 ICT**: scheduled maintenance begins, graceful shutdown community sent to all peers
- **2026-01-20 18:00 ICT**: maintenance complete, our side ready to peer
- **2026-01-20 - 2026-01-28**: he sessions stuck in idle
- **2026-01-28**: he responds, admits they "do not support graceful shutdown", manually clears sessions

affected sessions:
- bknix: 203.159.68.168 / 2001:df5:b881::168
- ams-ix: 80.249.212.139 / 2001:7f8:1:0:a500:14:2108:1

## the problem

rfc 8326 defines graceful shutdown as a mechanism to signal impending maintenance. the receiving router should lower local_pref on those routes and keep the session established. when the peer comes back, session continues normally.

if receiving graceful_shutdown causes your router to enter a permanent idle state where it never attempts to reconnect, your implementation is broken. this isn't "not supporting" a feature - it's actively mishandling a well-known community.

he's response:

> We do not support graceful shutdown. The sessions were in an IDLE state on our side. We have cleared these sessions, and see them once again established.

## impact

- 8 days of degraded ipv6 transit capacity
- reduced path diversity at bknix and ams-ix
- validator performance impact during rush hours

we did everything right. we used graceful shutdown per rfc 8326. instead we spent 8 days with degraded connectivity because a tier 1 network's bgp implementation treats a standard community as a reason to permanently idle sessions.
