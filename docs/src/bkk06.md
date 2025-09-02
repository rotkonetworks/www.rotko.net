## BKK06 - High-Performance Storage/Compute Node

![BKK06](./images/bkk06/bkk06.webp)

### CPU
**Model:** [AMD EPYC™ 7713](https://www.amd.com/en/products/cpu/amd-epyc-7713)
- **Core Count:** 64 cores
- **Threads:** 128
- **Max. Boost Clock:** Up to 3.675GHz
- **Base Clock:** 2.0GHz
- **L3 Cache:** 256MB
- **TDP:** 225W

**Capabilities:** Optimized for high-throughput storage operations and parallel processing workloads. The EPYC 7713 provides exceptional multi-threaded performance for distributed storage and compute tasks.

### Motherboard
**Model:** [Supermicro H11SSL-i](https://www.supermicro.com/en/products/motherboard/H11SSL-i)
- **Chipset:** System on Chip
- **Form Factor:** E-ATX
- **Memory Slots:** 8 x DIMM slots supporting DDR4
- **PCIe Slots:** Multiple PCIe 3.0 slots

### Memory
**Model:** 8x Micron 32GB ECC Registered DDR4 3200
- **Total Capacity:** 256GB
- **Technology:** ECC Registered for data integrity
- **Speed:** 3200MHz

### Storage Configuration
```
Pool: bkk06pool
State: ONLINE (with errors requiring attention)
Configuration: 6 mirror vdevs (12x Samsung 990 PRO 4TB NVMe)
Status: 16 data errors detected during scrub
Recent: Removal of vdev 5 completed, 93.6M memory used for mappings
```

### Networking
**Primary Interfaces:**
- 2x Intel E810-C 25G QSFP ports (100G capable)
- 2x Broadcom BCM5720 1G management ports

**Anycast Configuration:**
- Participates in 100G anycast routing via BGP
- Route reflector client with dedicated ASN
- Q-in-Q VLAN tagging for service isolation
- Bond interfaces: bond-bkk00 and bond-bkk20 for redundancy

### Active Services (28 containers)
Primary RPC nodes for:
- Polkadot relay chain and system parachains
- Kusama relay chain and system parachains
- Multiple Polkadot parachains (Moonbeam, Acala, Hydration, Bifrost, etc.)
- Paseo testnet infrastructure
- Penumbra node
- HAProxy load balancer

### Chassis and Power
- **Chassis:** 2U Supermicro server chassis
- **PSU:** Greatwall Dual PSU 2U 1+1 CRPS redundant 800W
