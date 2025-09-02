# Proxmox Network Configuration Guide

## Overview
Networking in Proxmox is managed through the Debian network interface
configuration file at `/etc/network/interfaces`. This guide will walk you
through the process of configuring the network interfaces and creating a Linux
bridge for your Proxmox server.

## Pre-requisites:

Before we begin, you should have:

1. A Proxmox VE installed and configured on your server.
2. Administrative or root access to your Proxmox VE server.

## Step 1: Understand Proxmox Network Configuration Files

Proxmox network settings are mainly configured in two files:

- `/etc/network/interfaces`: This file describes the network interfaces
available on your system and how to activate them. This file is critical for
setting up bridged networking or configuring network interfaces manually.
- `/etc/hosts`: This file contains IP address to hostname mappings.

## Step 2: Configure Primary Network Interface
First, open the network interfaces configuration file for editing:
Set your primary network interface (e.g., `enp9s0`) to manual:

```bash
nano /etc/network/interfaces
```

```bash
auto enp9s0
iface enp9s0 inet manual
```

## Step 3: Configure Linux Bridge
Next, create a Linux bridge (`vmbr0`):

```bash
auto vmbr0
iface vmbr0 inet static
    address 192.168.69.103
    netmask 255.255.255.0
    gateway 192.168.69.1
    bridge_ports enp9s0
    bridge_stp off
    bridge_fd 0
```

Make sure to replace the `address`, `netmask`, and `gateway` parameters with
the correct values for your network.

## Step 4: Apply Configuration
Save and exit the file, then restart the network service for the changes to
take effect:

```bash
systemctl restart networking.service
```

## Step 5: Verify Configuration
Use the `ip a` command to verify that the bridge was created successfully:

```bash
ip a
```

## Step 6: Configure the Hosts File

The `/etc/hosts` file maps network addresses to hostnames. Open this file in a
text editor:

```bash
nano /etc/hosts
```

Then, define the IP address and corresponding FQDN and hostname for your
Proxmox server:

```bash
127.0.0.1	localhost
192.168.69.103	bkk03.yourdomain.com	bkk03

# The following lines are desirable for IPv6 capable hosts
::1     localhost ip6-localhost ip6-loopback
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters
```

Remember to replace `192.168.69.103`, `bkk03.yourdomain.com`, and `bkk03` with
your server's IP address, FQDN, and hostname, respectively.

After updating the `/etc/hosts` file, save and exit the editor.

**Important**: Ensure the FQDN in your `/etc/hosts` matches the actual FQDN of
your server. This FQDN should be resolvable from the server itself and any
machines that will be accessing it. The Proxmox web interface uses this
hostname to generate SSL certificates for the HTTPS interface, so incorrect
resolution may lead to certificate issues.

By carefully following the instructions provided in this guide, administrators
can ensure a robust and secure networking setup for their Proxmox servers. This
guide should provide a good starting point for both new and experienced Proxmox
administrators to understand and manage the network settings of their servers
effectively.


## Troubleshooting
If you run into issues during this process, you can use the following commands
to troubleshoot:

- `systemctl status networking.service`: Displays the status of the networking
service.

- `journalctl -xeu networking.service`: Provides detailed logs for the
networking service.

- `ip addr flush dev <interface>` and `ip route flush dev <interface>`: Clears
IP addresses and routes on a given interface.

- `ip link delete <bridge>` and `ip link add name <bridge> type bridge`:
Deletes and recreates a bridge.

- `ip link set <interface> master <bridge>`: Assigns an interface to a bridge.

- `ip addr add <ip>/<subnet> dev <bridge>`: Assigns an IP address to a bridge.

Remember to replace `<interface>`, `<bridge>`, `<ip>`, and `<subnet>` with the
appropriate values for your network.

For more detailed information about Proxmox networking, refer to the [official
Proxmox documentation](https://pve.proxmox.com/wiki/Network_Configuration).
