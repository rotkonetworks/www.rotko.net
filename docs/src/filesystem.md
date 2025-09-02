# Filesystem

Blockchain nodes, such as validators and archive nodes, require a highly reliable and efficient filesystem to operate effectively. The choice of filesystem can significantly affect the performance and reliability of these nodes. In light of performance concerns with ZFS, especially in ParityDB workloads as discussed in [paritytech/polkadot-sdk/pull/1792](https://github.com/paritytech/polkadot-sdk/pull/1792), this guide provides a detailed approach to configuring a robust filesystem in Proxmox.

## Filesystem Choices and Their Impact

The extensive use of I/O operations by blockchain nodes means the filesystem must manage write and read operations efficiently. CoW filesystems, while feature-rich and robust, introduce overhead that can degrade performance, as evidenced by the cited benchmarks.

### Why Not ZFS or Btrfs for Blockchain Nodes?

- **ZFS**: While ZFS is revered for its data integrity, the added overhead from features like snapshotting, checksums, and the dynamic block size can significantly slow down write operations crucial for blockchain databases.
- **Btrfs**: Similar to ZFS, Btrfs offers advanced features such as snapshotting and volume management. However, its CoW nature means it can suffer from fragmentation and performance degradation over time, which is less than ideal for write-intensive blockchain operations.

Given these insights, a move towards a more traditional, performant, and linear filesystem is recommended.

### Recommended Setup: LVM-thin with ext4

For high I/O workloads such as those handled by blockchain validators and archive nodes, `LVM-thin` provisioned with `ext4` stands out:

- **ext4**: Offers a stable and linear write performance, which is critical for the high transaction throughput of blockchain applications.
- **LVM-thin**: Allows for flexible disk space allocation, providing the benefits of thin provisioning such as snapshotting and easier resizing without the CoW overhead.

## Strategic Partitioning for Maximum Reliability and Performance

A well-thought-out partitioning scheme is crucial for maintaining data integrity and ensuring high availability.

### RAID 1 Configuration for the Root Partition

Using a RAID 1 setup for the root partition provides mirroring of data across two disks, thus ensuring that the system can continue to operate even if one disk fails.

#### Implementing RAID 1:

1. **Disk Preparation:**
   - Select two identical disks (e.g., `/dev/sda` and `/dev/sdb`).
   - Partition both disks with an identical layout, reserving space for the root partition.

2. **RAID Array Creation:**
   - Execute the command to create the RAID 1 array:
     ```bash
     mdadm --create --verbose /dev/md0 --level=1 --raid-devices=2 /dev/sda1 /dev/sdb1
     ```
   - Format the RAID array with a resilient filesystem like ext4:
     ```bash
     mkfs.ext4 /dev/md0
     ```
   - Mount the RAID array at the root mount point during the Proxmox installation or manually afterward.

### Boot Partition Configuration

Having two separate boot partitions provides redundancy, ensuring the system remains bootable in the event of a primary boot partition failure.

#### Configuring Boot Partitions:

- **Primary Boot Partition:**
  - On the first disk, create a boot partition (e.g., `/dev/sda2`).
  - Install the bootloader and kernel images here.

- **Fallback Boot Partition:**
  - Mirror the primary boot partition to a second disk (e.g., `/dev/sdb2`).
  - Configure the bootloader to fall back to this partition if the primary boot fails.

### LVM-Thin Provisioning on Data Disks

LVM-thin provisioning is recommended for managing data disks. It allows for efficient disk space utilization by provisioning "thin" volumes that can be expanded dynamically as needed.

#### Steps for LVM-Thin Provisioning:

1. **Initialize LVM Physical Volumes:**
   - Use the `pvcreate` command on the designated data disks:
     ```bash
     pvcreate /dev/nvme1n1 /dev/nvme2n1 /dev/nvme3n1
     ```

2. **Create a Volume Group:**
   - Group the initialized disks into a volume group:
     ```bash
     vgcreate vg_data /dev/nvme1n1 /dev/nvme2n1 /dev/nvme3n1
     ```

3. **Establish a Thin Pool:**
   - Create a thin pool within the volume group to hold the thin volumes:
     ```bash
     lvcreate --size 100G --thinpool data_tpool vg_data
     ```

4. **Provision Thin Volumes:**
   - Create thin volumes from the pool as needed for containers or virtual machines: ```bash
     lvcreate --virtualsize 500G --thin data_tpool --name data_volume
     ```

5. **Format and Mount Thin Volumes:**
   - Format the volumes with a filesystem, such as ext4, and mount them:
     ```bash
     mkfs.ext4 /dev/vg_data/data_volume
     mount /dev/vg_data/data_volume /mnt/data_volume
     ```

## Integrating LVM-Thin Volumes with Proxmox

Proxmox's `pct` command-line tool can manage container storage by mapping LVM-thin volumes to container mount points.

