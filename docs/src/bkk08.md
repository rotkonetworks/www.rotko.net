## BKK08 - High-Performance Storage/Compute Node

![BKK08](./images/BKK08/BKK08.webp)

### CPU
**Model:** [AMD EPYC™ 7742](https://www.amd.com/en/products/cpu/amd-epyc-7742)
- **Core Count:** 64 cores
- **Threads:** 128
- **Max. Boost Clock:** Up to 3.4GHz
- **Base Clock:** 2.25GHz
- **L3 Cache:** 256MB
- **TDP:** 225W

**Capabilities:** Optimized for parallel processing and storage workloads, delivering excellent multi-threaded performance for distributed systems.

### Motherboard
**Model:** Supermicro H11SSL-series
- **Chipset:** System on Chip
- **Form Factor:** E-ATX
- **Memory Slots:** 8 x DIMM slots supporting DDR4

### Memory
**Configuration:** 8x 32GB DDR4 ECC Registered
- **Total Capacity:** 256GB
- **Speed:** 3200MHz
- **Technology:** ECC for data integrity

### Storage Configuration
Pool: bkk08pool
State: ONLINE
Configuration: 2x 4-disk RAIDZ1 vdevs

8x Samsung 990 PRO 4TB NVMe total
Redundancy: Can tolerate 1 disk failure per vdev
Capacity: ~24TB usable (6 data + 2 parity)
Last scrub: 0 errors (July 13, 2025)


### Networking
**Primary Interfaces:**
- 2x Intel E810-C 25G QSFP ports (100G capable)
- 2x Broadcom BCM5720 1G management ports

**Anycast Configuration:**
- Participates in 100G anycast routing via BGP
- Route reflector client with dedicated ASN
- Redundant path configuration for high availability
- Q-in-Q VLAN tagging for traffic isolation

### Active Services (24 containers)
Tertiary/specialized nodes for:
- Polkadot RPC and parachains (Moonbeam, Nexus, Acala, Kilt, Hydration, Bifrost, Ajuna, Polimec, Unique, XCavate, Mythos)
- Paseo validator and RPC nodes
- Penumbra node
- IBP infrastructure
- IX peering management
- HAProxy load balancer
- Build services and logging infrastructure

### Board Management Controller (BMC)
- **BMC Model:** Aspeed AST2500
- **Capabilities:** Remote management with IPMI/KVM over IP

### Chassis and Power
- **Chassis:** Ultra Short 2U rackmount chassis
- **PSU:** Greatwall Dual PSU 2U 1+1 CRPS redundant 800W

---

## Network Architecture Overview

All three nodes (BKK06, BKK07, BKK08) participate in our advanced networking infrastructure:

### Anycast Implementation
- **100G Backbone:** High-speed interconnects between storage nodes
- **BGP Routing:** Each node operates as a route reflector client
- **Dedicated ASN:** Independent autonomous system number per edge node
- **Service Isolation:** Q-in-Q VLAN tagging for traffic segregation

### Redundancy Features
- **Dual Uplinks:** Each node has redundant connections to core routers
- **Active-Backup Bonds:** Sub-second failover between interfaces
- **Path Diversity:** Multiple routing paths for fault tolerance
- **VLAN Segmentation:** Separate VLANs for management, storage, and service traffic

### Performance Optimization
- **Hardware Offload:** Intel E810-C NICs provide advanced packet processing
- **NUMA Awareness:** Memory and network affinity for optimal performance
- **Jumbo Frames:** MTU 9000 enabled on storage network
- **Flow Control:** Configured for lossless Ethernet on storage paths
