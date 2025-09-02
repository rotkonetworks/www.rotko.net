# Software Infrastructure
Our infrastructure leverages several powerful
technologies and platforms to provide a robust and efficient environment for
our operations.

## Debian
Our servers run on Debian, a highly stable and reliable Linux-based operating
system. Debian provides a strong foundation for our operations, with its wide
array of packages, excellent package management system, and strong community
support. Its stability and robustness make it an excellent choice for our
server environments.

## Proxmox Virtual Environment
We utilize Proxmox, an open-source server virtualization management solution.
Proxmox allows us to manage virtual machines, containers, storage, virtualized
networks, and HA clustering from a single, integrated platform. This is crucial
in ensuring we have maximum control and efficiency in managing our various
server processes. We utilize linux 6.1 lts pve kernel.

## LXC (Linux Containers)
We leverage LXC (Linux Containers) to run multiple isolated Linux systems
(containers) on a single host. This containerization technology provides us
with lightweight, secure, and performant alternatives to full machine
virtualization.

## ZFS
ZFS, the Zettabyte File System, is an advanced filesystem and logical volume
manager. It was designed to overcome many of the major issues found in previous
designs and is used for storing data in our Proxmox environment. It provides
robust data protection, supporting high storage capacities and efficient data
compression, and allows us to create snapshots and clones of our filesystem.

## Ansible
We use Ansible for automation of our system configuration and management tasks.
Ansible enables us to define and deploy consistent configurations across
multiple servers, and automate routine maintenance tasks, thus increasing
efficiency and reducing the risk of errors.

## MikroTik RouterOS 
Our network infrastructure relies on MikroTik RouterOS, a robust network
operating system. This system offers a variety of features such as routing,
firewall, bandwidth management, wireless access point, backhaul link, hotspot
gateway, VPN server, and more. This helps us ensure secure, efficient, and
reliable network operations.

All these technologies are intertwined, working together to support our
operations. They are chosen not just for their individual capabilities, but
also for their compatibility and interoperability, creating an integrated,
efficient, and reliable software infrastructure.
