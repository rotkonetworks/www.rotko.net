## BKK07 - High-Performance Storage/Compute Node

![BKK07](./images/BKK07/BKK07.webp)

### CPU
**Model:** [AMD EPYC™ 9654](https://www.amd.com/en/product/12191)
- **Core Count:** 96 cores
- **Threads:** 192
- **Max. Boost Clock:** Up to 3.7GHz
- **Base Clock:** 2.4GHz
- **L3 Cache:** 384MB
- **TDP:** 360W (Configurable 320-400W)

**Capabilities:** Cutting-edge Genoa generation processor delivering exceptional performance for high-concurrency storage operations and compute-intensive workloads.

### Motherboard
**Model:** [Supermicro H13SSL-N](https://www.supermicro.com/en/products/motherboard/h13ssl-n)
- **Chipset:** System on Chip
- **Form Factor:** ATX
- **Memory Slots:** 12 x DIMM slots supporting DDR5

### Memory
**Model:** 6x SuperMicro 64GB ECC Registered DDR5 4800
- **Current Capacity:** 384GB (6 modules)
- **Technology:** DDR5 ECC Registered
- **Speed:** 4800MHz
- **Upgrade Path:** Expandable to 12 modules for full bandwidth

### Storage Configuration
```
Pool: bkk07pool
State: ONLINE
Configuration: 1x 12-disk RAIDZ2
- 12x Samsung 990 PRO 4TB NVMe
Redundancy: Can tolerate 2 simultaneous disk failures
Capacity: ~32TB usable (10 data + 2 parity)
Last scrub: 0 errors (July 13, 2025)
```

### Networking
**Primary Interfaces:**
- 2x Intel E810-C 25G QSFP ports (100G capable)
- 2x Broadcom BCM5720 1G management ports

**Anycast Configuration:**
- Participates in 100G anycast routing via BGP
- Route reflector client with dedicated ASN
- VLAN configuration: 100p1.400 for backbone connectivity
- Dual bond interfaces for active-backup failover

### Active Services (24 containers)
Secondary RPC nodes for:
- Polkadot relay chain and all system parachains
- Kusama relay chain and all system parachains
- Paseo testnet (relay and system chains)
- Penumbra node
- IBP infrastructure
- HAProxy load balancer
- Build and Docker services

### Board Management Controller (BMC)
- **BMC Model:** Aspeed AST2600
- **Capabilities:** Full remote management with KVM over IP

### Chassis and Power
- **Chassis:** Ultra Short 2U rackmount chassis
- **PSU:** Greatwall Dual PSU 2U 1+1 CRPS redundant 800W
