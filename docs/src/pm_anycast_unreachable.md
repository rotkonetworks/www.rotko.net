# post mortem: anycast ip 160.22.181.81 unreachable from internet

## tldr

**problem:** external users couldn't reach anycast ip 160.22.181.81 despite correct bgp announcements  
**root cause:** anycast ip commented out in bkk06 interface config, bird announcing as unreachable, routing table corruption preventing bird reloads  
**immediate fix:** uncommented ip in `/etc/network/interfaces`, cleaned duplicate routing table entries, restarted bird  
**systematic fix:** updated network config generator to prevent routing table corruption and improve anycast management  
**result:** external connectivity restored in <5 minutes, prevention system deployed  
**action items:** configure redundant anycast instances on bkk07/bkk08, add external monitoring  

---

## problem statement

external users could not ping 160.22.181.81 from the internet, despite:
- aggregate 160.22.180.0/23 being properly announced to upstream providers
- internal ibgp routing showing correct paths to the anycast ip
- no obvious bgp or routing issues at the edge

## investigation timeline

### initial analysis
- confirmed aggregate announcement to upstreams (amsix, hgc, bknix)
- verified internal routing table showed 160.22.181.81/32 via 10.155.206.1 (bkk06)
- ping from edge routers (bkk00/bkk20) to 160.22.181.81 failed with timeouts
- discovered icmp redirects when pinging from bkk06 itself

### root cause discovery
investigation of bkk06 configuration revealed multiple issues:

1. **anycast ip not configured on interface**
   - `/etc/network/interfaces` had the line commented out:
   ```bash
   #up ip addr add 160.22.181.81/32 dev lo
   ```

2. **bird announcing unreachable route**
   - bird static configuration had:
   ```bash
   route 160.22.181.81/32 unreachable;
   ```
   - this caused bird to announce the route but blackhole traffic locally

3. **routing table corruption preventing bird reloads**
   - `/etc/iproute2/rt_tables` had multiple duplicate entries:
   ```bash
   100 anycast
   100 public  
   100 anycast
   100 anycast  # ... 6+ duplicates
   ```
   - caused bird reload failures: `already defined` errors
   - accumulated from repeated network interface restarts

## changes implemented

### 1. immediate fix - restored connectivity

**fixed interface configuration:**
```bash
# before
#up ip addr add 160.22.181.81/32 dev lo

# after  
up ip addr add 160.22.181.81/32 dev lo
```

**cleaned routing table duplicates:**
```bash
# removed duplicates, restored clean version
255	local
254	main
253	default
0	unspec
100	anycast
```

**restarted bird daemon:**
```bash
systemctl restart bird
```

bird's direct protocol automatically detected the newly configured interface ip and began announcing 160.22.181.81 as reachable.

### 2. systematic fix - prevention system

**updated network config generator** ([commit 7f3da69](https://github.com/rotkonetworks/networking/commit/7f3da69e6e0d2002fbc08ce06f819cffb9a90196)):

**prevented duplicate routing table entries:**
```bash
# old (caused duplicates on every interface restart)
up echo "100 anycast" >> /etc/iproute2/rt_tables 2>/dev/null || true

# new (checks before adding)
add_rt_table() {
  local table_id="$1" table_name="$2"
  echo "up grep -q \"^${table_id}[[:space:]]${table_name}\" /etc/iproute2/rt_tables || echo \"${table_id} ${table_name}\" >> /etc/iproute2/rt_tables"
}
```

**improved anycast source routing:**
- only creates anycast routing table when anycast IPs are configured
- proper load balancing across route reflectors
- comprehensive cleanup rules prevent rule accumulation

**enhanced bond configuration:**
- changed default from `802.3ad` to `active-backup` for better compatibility
- fixed interface naming for split uplink configurations

## verification

**immediate results:**
- external ping to 160.22.181.81 successful (62ms response time)
- bird status clean with no configuration errors
- bgp advertisements showing proper reachable routes

**systematic prevention:**
- network interface restarts no longer accumulate routing table entries
- bird configuration reloads work reliably
- anycast routing properly configured with failover capabilities

## lessons learned

### configuration management issues
- critical services had commented-out configuration 
- no monitoring to detect interface ip mismatches vs bgp announcements
- accumulated config debris from repeated interface operations
- **fixed:** automated config generation prevents manual configuration drift

### anycast design gaps  
- only one server (bkk06) configured for the anycast ip
- no failover capability - single point of failure
- **fixing:** systematic anycast deployment across multiple servers

### monitoring blindspots
- edge router bgp announcements showed "valid" but didn't detect local unreachability  
- missing end-to-end connectivity monitoring from external vantage points
- no alerting on interface configuration drift vs bgp announcements

## recommendations

### immediate (completed)
- [x] configure anycast ip on interface
- [x] clean routing table duplicates  
- [x] restart bird daemon
- [x] deploy systematic fix to prevent recurrence

### short term
- [ ] configure 160.22.181.81 on bkk07 and bkk08 for redundancy using updated config generator
- [ ] test failover scenarios (shutdown bkk06, verify traffic shifts)
- [ ] add external monitoring for anycast ips

### long term  
- [ ] implement configuration drift detection
- [ ] add monitoring for interface vs bgp announcement consistency
- [ ] document anycast ip allocation and server responsibilities
- [ ] create runbooks for anycast troubleshooting
- [ ] automated anycast health checking and failover testing

## technical details

### updated network configuration generator

**key improvements:**
- **duplicate prevention:** routing table entries checked before addition
- **anycast routing:** proper source-based routing with load balancing
- **cleanup automation:** comprehensive rule cleanup prevents accumulation
- **bond compatibility:** improved defaults for diverse network environments

**anycast source routing example:**
```bash
# creates anycast table only when needed
add_rt_table "100" "anycast"

# load balancing across route reflectors  
post-up ip route add default table anycast nexthop via 10.155.106.0 weight 1 nexthop via 10.155.206.0 weight 1

# source-based routing for anycast traffic
post-up ip rule add from 160.22.181.81 table anycast priority 100
```

### bgp filtering optimization

during investigation, we also consolidated ibgp gateway filtering rules:

**bkk20 (blocks vlans 106,107,108):**
```bash
/ip/firewall/address-list/add list=ibgp-block-gw-v4 address=10.155.106.0/24
/ip/firewall/address-list/add list=ibgp-block-gw-v4 address=10.155.107.0/24  
/ip/firewall/address-list/add list=ibgp-block-gw-v4 address=10.155.108.0/24
```

**bkk00 (blocks vlans 206,207,208):**
```bash
/ip/firewall/address-list/add list=ibgp-block-gw-v4 address=10.155.206.0/24
/ip/firewall/address-list/add list=ibgp-block-gw-v4 address=10.155.207.0/24
/ip/firewall/address-list/add list=ibgp-block-gw-v4 address=10.155.208.0/24
```

prevents routing loops through non-existent local vlans while maintaining proper ibgp route reflection behavior.

## impact

**service restoration:** external connectivity to anycast services restored within 5 minutes  
**reliability improvement:** eliminated recurring bird configuration failures  
**operational efficiency:** automated configuration management reduces manual intervention  
**scalability:** systematic anycast deployment enables rapid service expansion
