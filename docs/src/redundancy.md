# IBP Rank 6 Network Infrastructure Documentation
## ROTKO NETWORKS OÜ (AS142108)

### Executive Summary

ROTKO NETWORKS operates a highly redundant, carrier-grade network infrastructure
in Bangkok, Thailand, designed to meet and exceed IBP Rank 6 requirements. Our
infrastructure features full redundancy at every layer - from multiple 10G/100G
transit connections to redundant route reflectors, hypervisors, and storage
systems.

## Network Architecture Overview

### Core Routing Infrastructure

Our network utilizes a hierarchical BGP architecture with dedicated route
reflectors providing redundancy and scalability:

#### Route Reflectors (Core Routers)
- **BKK00** (CCR2216-1G-12XS-2XQ) - Primary Route Reflector
  - Router ID: 10.155.255.4
  - 100G connections to edge routers
  - Multiple 10G transit/IX connections
  
- **BKK20** (CCR2216-1G-12XS-2XQ) - Secondary Route Reflector
  - Router ID: 10.155.255.2
  - 100G connections to edge routers
  - Diverse 10G transit/IX connections

Both route reflectors run iBGP with full mesh connectivity and serve as
aggregation points for external BGP sessions.

### Layer 2 Switching Infrastructure

#### Core Switches
- **BKK30** (CRS504-4XQ) - 4x100G QSFP28 switch
- **BKK40** (CRS504-4XQ) - 4x100G QSFP28 switch
- **BKK10** (CCR2216-1G-12XS-4XQ) - 4xSFP+ 25G 12x 1G (fallback for 100G)  
- **BKK60** (CRS354-48G-4S+2Q+) - 48x1G + 4xSFP+ + 2xQSFP+ switch (reserved)
- **BKK50** (CCR2004-16G-2S+) - Management network

These switches provide Q-in-Q VLAN tagging for service isolation and traffic segregation.

## Multi-Layer Redundancy Architecture

### 1. Physical Layer Redundancy

#### Diverse Fiber Paths
- **3x Independent 10G fiber uplinks** from different carriers
- **Physically diverse cable routes** to prevent simultaneous cuts
- **Multiple cross-connects** within the data center
- **Dual power feeds** to all critical equipment

#### Hardware Redundancy
- **Dual PSU** on all servers and network equipment
- **Hot-swappable components** (fans, PSUs, drives)
- **N+1 cooling** in server chassis
- **Spare equipment** pre-racked for rapid replacement

### 2. Network Layer Redundancy

#### Transit Diversity
Our multi-homed architecture eliminates single points of failure:

**Primary Transit - HGC (AS9304)**
```
Hong Kong Path:
├── Active: BKK00 → VLAN 2519 → 400M (burst 800M)
└── Backup: BKK20 → VLAN 2517 → 800M standby

Singapore Path:
├── Active: BKK20 → VLAN 2520 → 400M (burst 800M)
└── Backup: BKK00 → VLAN 2518 → 800M standby
```

**Internet Exchange Diversity**
```
Local (Thailand):
├── BKNIX: 10G direct peering (200+ networks)
└── AMS-IX Bangkok: 1G peering (100+ networks)

Regional:
├── AMS-IX Hong Kong: 200M connection
└── HGC IPTx: Dual paths to HK/SG

Global:
└── AMS-IX Europe: 100M connection
```

#### BGP Redundancy Features
- **Dual Route Reflectors**: Automatic failover with iBGP
- **BFD Detection**: 100ms failure detection
- **Graceful Restart**: Maintains forwarding during control plane restart
- **Path Diversity**: Multiple valid routes to every destination
- **ECMP Load Balancing**: Traffic distributed across equal-cost paths

### 3. Hypervisor Layer Redundancy

#### Proxmox Cluster Features
```
High Availability Configuration:
├── Live Migration: Zero-downtime VM movement
├── HA Manager: Automatic VM restart on node failure
├── Shared Storage: Distributed access to VM data
└── Fencing: Ensures failed nodes are isolated
```

#### Per-Hypervisor Network Redundancy
Each hypervisor (BKK06, BKK07, BKK08) implements:
```
Dual Uplink Configuration:
├── bond-bkk00 (Active Path)
│   ├── Primary: vlan1X7 @ 100G
│   └── Backup: vlan1X7 @ 100G (different switch)
└── bond-bkk20 (Standby Path)
    ├── Primary: vlan2X7 @ 100G
    └── Backup: vlan2X7 @ 100G (different switch)

Failover Time: <100ms using active-backup bonding
```

### 4. Storage Layer Redundancy

#### ZFS Resilience by Node

**BKK06 - Maximum Redundancy (Mirror)**
```
Configuration: 6x mirror vdevs (2-way mirrors)
Fault Tolerance: 
- Can lose 1 disk per mirror (up to 6 disks total)
- Instant read performance during rebuild
- 50% storage efficiency for maximum protection
Recovery: Hot spare activation < 1 minute
```

**BKK07 - Balanced Redundancy (RAIDZ2)**
```
Configuration: 12-disk RAIDZ2
Fault Tolerance:
- Can lose any 2 disks simultaneously
- Maintains full operation during rebuild
- 83% storage efficiency
Recovery: Distributed parity reconstruction
```

**BKK08 - Performance Redundancy (RAIDZ1)**
```
Configuration: 2x 4-disk RAIDZ1 vdevs
Fault Tolerance:
- Can lose 1 disk per vdev (2 disks total)
- Parallel vdev operation for performance
- 75% storage efficiency
Recovery: Per-vdev independent rebuild
```

### 5. Service Layer Redundancy

#### Container Distribution Strategy
```
Service Deployment:
├── Primary Instance: BKK06
├── Secondary Instance: BKK07
├── Tertiary/Specialized: BKK08
└── Load Balancing: HAProxy on each node

Failover Mechanism:
- Health checks every 2 seconds
- Automatic traffic rerouting
- Session persistence via cookies
- <5 second service failover
```

#### Anycast Services
```
Global Anycast: 160.22.180.180/32
├── Announced from all locations
├── BGP-based geographic routing
└── Automatic closest-node selection

Local Anycast: 160.22.181.81/32
├── Thailand-specific services
├── Lower latency for regional users
└── Fallback to global on failure
```

### 6. Failure Scenarios & Recovery

#### Single Component Failures (No Impact)
- **1 Transit Link Down**: Traffic reroutes via alternate transit
- **1 Route Reflector Down**: Secondary handles all traffic
- **1 Hypervisor Down**: VMs migrate or run from replicas
- **1 Disk Failure**: ZFS continues with degraded redundancy
- **1 PSU Failure**: Secondary PSU maintains operation

#### Multiple Component Failures (Degraded but Operational)
- **Both HK Links Down**: Singapore paths maintain connectivity
- **Entire Hypervisor Failure**: Services run from remaining 2 nodes
- **Multiple Disk Failures**: ZFS tolerates per design limits
- **Primary + Backup Network Path**: Tertiary paths available

#### Disaster Recovery
- **Complete DC Failure**: 
  - Off-site backups available
  - DNS failover to alternate regions
  - Recovery Time Objective (RTO): 4 hours
  - Recovery Point Objective (RPO): 1 hour

## Redundancy Validation & Testing

### Automated Testing
- **BGP Session Monitoring**: Real-time alerting on session drops
- **Path Validation**: Continuous reachability tests
- **Storage Health**: ZFS scrubs weekly, SMART monitoring
- **Service Health**: Prometheus + Grafana dashboards

### Manual Testing Schedule
- **Monthly**: Controlled failover testing
- **Quarterly**: Full redundancy validation
- **Annually**: Disaster recovery drill

## Compliance with IBP Rank 6 Requirements

### ✓ No Single Point of Failure
Every critical component has at least one backup:
- Dual route reflectors with automatic failover
- Multiple transit providers and exchange points
- Redundant power, cooling, and network paths
- Distributed storage with multi-disk fault tolerance

### ✓ Sub-Second Network Convergence
- BFD: 100ms detection + 200ms convergence = 300ms total
- Bond failover: <100ms for layer 2 switchover
- BGP: Graceful restart maintains forwarding plane

### ✓ Geographic & Provider Diversity
- Transit via Hong Kong and Singapore
- Peering in Bangkok, Hong Kong, and Amsterdam
- Multiple submarine cable systems
- Carrier-neutral facility

### ✓ Automated Recovery
- HA cluster manages VM availability
- BGP automatically selects best paths
- ZFS self-healing with checksum validation
- Container orchestration via systemd

This comprehensive redundancy architecture ensures 99.95% uptime SLA compliance
and exceeds all IBP Rank 6 requirements for infrastructure resilience.
