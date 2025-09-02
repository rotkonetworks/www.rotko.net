## ICMPv6 Structure and Types

### Basic ICMPv6 Header Structure
```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|     Type      |     Code      |          Checksum             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                         Message Body                          +
|                                                               |
```

### ICMPv6 Message Types

#### Error Messages (Types 1-127)

**Type 1: Destination Unreachable**
```
Code 0: No route to destination
Code 1: Communication administratively prohibited
Code 2: Beyond scope of source address
Code 3: Address unreachable
Code 4: Port unreachable
Code 5: Source address failed ingress/egress policy
Code 6: Reject route to destination
Code 7: Error in Source Routing Header
```

**Type 2: Packet Too Big**
```
Code: 0 (always)
Body includes: MTU (4 bytes) + As much of original packet as possible
```

**Type 3: Time Exceeded**
```
Code 0: Hop limit exceeded in transit
Code 1: Fragment reassembly time exceeded
```

**Type 4: Parameter Problem**
```
Code 0: Erroneous header field encountered
Code 1: Unrecognized Next Header type encountered
Code 2: Unrecognized IPv6 option encountered
Body includes: Pointer (4 bytes) indicating error location
```

#### Informational Messages (Types 128-255)

**Type 128: Echo Request**
```
Code: 0
Used by: ping6
Body: Identifier + Sequence Number + Data
```

**Type 129: Echo Reply**
```
Code: 0
Response to: Echo Request
Body: Same as Echo Request
```

**Type 133: Router Solicitation (RS)**
```
Code: 0
Source: Host seeking routers
Destination: ff02::2 (all-routers)
Options: Source Link-Layer Address
```

**Type 134: Router Advertisement (RA)**
```
Code: 0
Source: Router
Destination: ff02::1 (all-nodes) or unicast
Flags: M|O|H|Prf|P|R
Options: 
- Prefix Information
- MTU
- Source Link-Layer Address
- Route Information
- DNS Information (RFC 8106)
```

**Type 135: Neighbor Solicitation (NS)**
```
Code: 0
Purpose: Address resolution, DAD, NUD
Target: Solicited IPv6 address
Options: Source Link-Layer Address
```

**Type 136: Neighbor Advertisement (NA)**
```
Code: 0
Flags: R|S|O (Router|Solicited|Override)
Target: IPv6 address being advertised
Options: Target Link-Layer Address
```

**Type 137: Redirect**
```
Code: 0
Source: Router only
Purpose: Inform host of better next-hop
Body: Target Address + Destination Address
```

### Multicast Listener Discovery (MLD)

**Type 130: Multicast Listener Query**
```
Code: 0
Versions: MLDv1 (RFC 2710), MLDv2 (RFC 3810)
```

**Type 131: Multicast Listener Report (MLDv1)**
```
Code: 0
```

**Type 132: Multicast Listener Done**
```
Code: 0
```

**Type 143: Multicast Listener Report (MLDv2)**
```
Code: 0
```

### Secure Neighbor Discovery (SEND)

**Type 148: Certification Path Solicitation**
**Type 149: Certification Path Advertisement**

### Other Important Types

**Type 138: Router Renumbering**
```
Code 0: Router Renumbering Command
Code 1: Router Renumbering Result
Code 255: Sequence Number Reset
```

**Type 139: Node Information Query**
**Type 140: Node Information Response**

**Type 141: Inverse ND Solicitation**
**Type 142: Inverse ND Advertisement**

### Mobile IPv6 Types

**Type 144: Home Agent Address Discovery Request**
**Type 145: Home Agent Address Discovery Reply**
**Type 146: Mobile Prefix Solicitation**
**Type 147: Mobile Prefix Advertisement**

### RPL (Routing Protocol for Low-Power)

**Type 155: RPL Control Message**

## Practical Examples

### 1. Capturing ICMPv6 with tcpdump:
```bash
# All ICMPv6
tcpdump -i eth0 icmp6

# Specific types
tcpdump -i eth0 'icmp6 and icmp6[0] == 134'  # Router Advertisements
tcpdump -i eth0 'icmp6 and icmp6[0] == 135'  # Neighbor Solicitations
```

### 2. Generating ICMPv6 Messages:
```bash
# Echo Request
ping6 2001:db8::1

# Router Solicitation
rdisc6 eth0

# Neighbor Discovery
ndisc6 2001:db8::1 eth0
```

### 3. Common Wireshark Filters:
```
icmpv6.type == 1              # Destination Unreachable
icmpv6.type == 134            # Router Advertisement
icmpv6.type == 135            # Neighbor Solicitation
icmpv6.code == 0              # Specific code
icmpv6.nd.flag.router         # RA with Router flag
```

## Security Considerations

### ICMPv6 Filtering Firewall Best Practices:
```mikrotik
# Core router (firewall)
/ipv6 firewall raw
add chain=prerouting protocol=icmpv6 icmp-options=135:0 action=accept comment="Type 135: Neighbor Solicitation"
add chain=prerouting protocol=icmpv6 icmp-options=136:0 action=accept comment="Type 136: Neighbor Advertisement"
add chain=prerouting protocol=icmpv6 icmp-options=2:0 action=accept comment="Type 2: Packet Too Big"
add chain=prerouting protocol=icmpv6 icmp-options=3:0-1 action=accept comment="Type 3: Time Exceeded"
add chain=prerouting protocol=icmpv6 icmp-options=4:0-2 action=accept comment="Type 4: Parameter Problem"
add chain=prerouting protocol=icmpv6 icmp-options=133:0 action=accept comment="Type 133: Router Solicitation"
add chain=prerouting protocol=icmpv6 icmp-options=134:0 action=accept comment="Type 134: Router Advertisement"
add chain=prerouting protocol=icmpv6 icmp-options=128:0 limit=10,5:packet action=accept comment="Type 128: Echo Request"
add chain=prerouting protocol=icmpv6 icmp-options=129:0 action=accept comment="Type 129: Echo Reply"
add chain=prerouting protocol=icmpv6 action=drop comment="Drop all other ICMPv6"
```

### ICMPv6 Filtering IX-facing Edge Router Best Practices:
```mikrotik
# Edge router (IX-facing interface protection)
/ipv6 firewall raw
# PREROUTING (Ingress from IX)
add chain=prerouting in-interface=sfp-sfpplus1 protocol=icmpv6 icmp-options=133:0-137:0 hop-limit=not-equal:255 action=drop
add chain=prerouting in-interface=sfp-sfpplus1 protocol=icmpv6 icmp-options=134:0 action=drop
add chain=prerouting in-interface=sfp-sfpplus1 protocol=icmpv6 icmp-options=137:0 action=drop
add chain=prerouting protocol=icmpv6 icmp-options=2:0 action=accept
add chain=prerouting protocol=icmpv6 icmp-options=3:0-1 limit=50,20:packet action=accept
add chain=prerouting protocol=icmpv6 icmp-options=4:0-2 limit=50,20:packet action=accept
add chain=prerouting protocol=icmpv6 icmp-options=1:0-4 limit=50,20:packet action=accept
add chain=prerouting protocol=icmpv6 icmp-options=135:0 action=accept
add chain=prerouting protocol=icmpv6 icmp-options=136:0 action=accept
add chain=prerouting protocol=icmpv6 icmp-options=128:0 limit=5,2:packet action=accept
add chain=prerouting protocol=icmpv6 icmp-options=129:0 action=accept
add chain=prerouting protocol=icmpv6 action=drop

# OUTPUT (Egress to IX)
add chain=output out-interface=sfp-sfpplus1 protocol=icmpv6 icmp-options=134:0 action=drop
add chain=output out-interface=sfp-sfpplus1 protocol=icmpv6 icmp-options=137:0 action=drop
add chain=output out-interface=sfp-sfpplus1 protocol=icmpv6 icmp-options=1:0-7 limit=50,20:packet action=accept
add chain=output out-interface=sfp-sfpplus1 protocol=icmpv6 icmp-options=3:0-1 limit=50,20:packet action=accept
add chain=output out-interface=sfp-sfpplus1 protocol=icmpv6 icmp-options=129:0 limit=5,2:packet action=accept
add chain=output protocol=icmpv6 action=accept comment="Allow other ICMPv6 output"
```

**Key Points:**
- ICMPv6 is mandatory for IPv6 operation (unlike ICMP in IPv4)
- Never block all ICMPv6 - it breaks IPv6
- Types 1-127 are errors, 128-255 are informational
- Neighbor Discovery (Types 133-137) is critical for IPv6
- Path MTU Discovery relies on Type 2 (Packet Too Big)
