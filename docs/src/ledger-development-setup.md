# Ledger Penumbra Development Setup Guide

This guide covers setting up the Penumbra app for Ledger hardware wallets on Linux and macOS. Tested successfully only on NixOS so message me out if you spot any faults in it. It's also good to note out that you should probably be quite advanced computer user to participate in testing the hardware wallet this early.

## Prerequisites

### System Dependencies

**Linux (Ubuntu/Debian):**
```bash
sudo apt update && sudo apt-get -y install build-essential git wget cmake \
libssl-dev libgmp-dev autoconf libtool python3 python3-venv
```

**macOS:**
```bash
brew install cmake autoconf automake libtool python3
```

### Docker
- **Linux**: Follow [Docker CE installation](https://docs.docker.com/install/)
- **macOS**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Additional Tools
- Node.js > v14.0 (via `nvm` or `n`)
- Rust toolchain (for running tests)

## Setup Instructions

### 1. Clone and Initialize Repository

```bash
# Clone the repository
git clone https://github.com/Zondax/ledger-penumbra.git
cd ledger-penumbra

# Initialize submodules (CRITICAL STEP)
git submodule update --init --recursive
```

### 2. Build the Application

Build for your specific device:

```bash
# For Nano S+
make buildS2

# For Nano X
make buildX

# For Flex
make buildFL

# For Stax
make buildST
```

## Installation Methods

### Method A: Using Development Release (Easiest)

1. Download the installer from [releases page](https://github.com/zondax/ledger-penumbra/releases)
2. For Nano S+, download `installer_s2.sh`
3. Make executable and run:
```bash
chmod +x ./installer_s2.sh
./installer_s2.sh load
```

### Method B: Loading from Source Build (recommended)

#### Setup Python Environment
Since many systems have read-only Python installations (like NixOS), use a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
pip install ledgerblue
```

#### USB Permissions (Linux only)
```bash
# Download and install Ledger udev rules
wget -q -O - https://raw.githubusercontent.com/LedgerHQ/udev-rules/master/add_udev_rules.sh | sudo bash

# Replug your device after installing rules
```

#### Load to Device
```bash
# Ensure device is connected and unlocked
make loadS2  # or loadX, loadFL, loadST for other devices
```

### Method C: Using Emulator (No Device Needed)

```bash
# Install Zemu emulator
make zemu_install

# Run tests in emulator
make zemu_test
```

## Preparing Development Device

**⚠️ WARNING: Use a dedicated development device without real funds!**

### 1. Enter Recovery Mode
- Hold right button while plugging in device
- Device shows "Recovery"

### 2. Initialize with Test Mnemonic
```bash
make dev_init
```
This sets:
- PIN: `5555`
- Mnemonic: `equip will roof matter pink blind book anxiety banner elbow sun young`

### 3. Add Development Certificate
```bash
# Still in recovery mode
make dev_ca
```

## Running Tests

### Unit Tests (Rust)
```bash
make rust_test
```

### Integration Tests (Zemu)
```bash
make zemu_test
```

### All Tests
```bash
make test_all
```

## Troubleshooting

### "No dongle found" Error
1. Check device is connected and unlocked
2. Verify USB detection: `lsusb | grep Ledger`
3. On Linux, ensure udev rules are installed
4. Try without sudo first, then with sudo if needed

### "BOLOS_SDK is not set" Error
Never run make commands from the `app/` subdirectory. Always run from project root.

### Submodule Errors
If you see errors about missing files in `deps/`:
```bash
git submodule update --init --recursive
```

### Python Installation Issues
If system Python is read-only (NixOS, etc.):
```bash
python3 -m venv venv
source venv/bin/activate
pip install ledgerblue
```

## Development Workflow

1. Make code changes
2. Rebuild: `make buildS2`
3. Reload: `make loadS2`
4. Test: `make zemu_test`

## Platform-Specific Notes

### macOS
- Ensure Docker Desktop is running
- No udev rules needed
- Device should work out of the box

### Linux
- Install udev rules for device recognition
- May need to run with sudo for USB access
- Some distros require user to be in `plugdev` group

## Important Notes

- The releases on GitHub are **unvetted development builds**
- Only use devices without real funds for development
- Production-ready versions will be available through Ledger Live after security audit
