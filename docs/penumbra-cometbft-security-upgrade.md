# penumbra validator security upgrade - critical

**date**: 2026-01-27
**priority**: critical
**affected**: penumbra.rotko.net (currently v0.37.15)
**target**: penumbra v2.0.6 with cometbft v0.37.18

---

## vulnerability summary

a critical flaw exists in cometbft's commit signature verification. the code that verifies block
commits has two paths:

1. **index-based lookup** - used by full nodes during consensus
2. **address-based lookup** - used by light clients

the problem: when using index-based lookup, the code retrieves the validator at position `idx` but
never checks if that validator's address matches the `ValidatorAddress` field in the commit
signature.

```go
// VULNERABLE CODE (before fix)
if lookUpByIndex {
    val = vals.Validators[idx]
    // BUG: no check that val.Address == commitSig.ValidatorAddress
}
```

the signature itself doesn't include the validator's identity - it only proves someone signed a
vote for a specific block. this means a malicious proposer can craft commits where validator
addresses are misattributed.

### what an attacker can do

- create blocks with manipulated validator attribution in commits
- potentially trick light clients about which validators signed
- forge IBC proofs with wrong validator information
- possibly generate false slashing evidence against honest validators

### why 2/3 stake matters

for a malicious block to actually commit to chain:
1. malicious proposer creates the bad block
2. validators vote on it
3. needs >2/3 voting power to accept

if >2/3 of stake runs patched nodes → attack fails (block rejected)
if >2/3 of stake runs unpatched nodes → attack can succeed

**current network state**: many nodes still on v0.37.15, definitely vulnerable

---

## fix details

### patched versions

| software | version | notes |
|----------|---------|-------|
| cometbft | v0.37.18 | contains fix (commit `019babe0f`) |
| penumbra | v2.0.6 | includes cometbft v0.37.18 |
| penumbra | v2.1.1 | also patched (for v2.1.x series) |

### version reporting bug

**important**: cometbft v0.37.18 has a bug where `cometbft version` reports `0.37.16`. after
upgrade, the node will show v0.37.16 in p2p but is actually patched. this is a known upstream bug.

---

## upgrade procedure

### 1. pre-upgrade checks

```bash
# check current version
cometbft version
# expected: 0.37.15 or similar (vulnerable)

# check current penumbra version
pd --version
# expected: something before 2.0.6

# verify node is synced before upgrade
curl -s localhost:26657/status | jq '.result.sync_info.catching_up'
# should be false
```

### 2. download penumbra v2.0.6

```bash
# option a: install script
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/penumbra-zone/penumbra/releases/download/v2.0.6/pd-installer.sh | sh

# option b: manual download (x86_64 linux)
wget https://github.com/penumbra-zone/penumbra/releases/download/v2.0.6/pd-x86_64-unknown-linux-gnu.tar.gz
tar -xzf pd-x86_64-unknown-linux-gnu.tar.gz
# verify checksum
wget https://github.com/penumbra-zone/penumbra/releases/download/v2.0.6/pd-x86_64-unknown-linux-gnu.tar.gz.sha256
sha256sum -c pd-x86_64-unknown-linux-gnu.tar.gz.sha256
```

### 3. download cometbft v0.37.18

penumbra v2.0.6 requires cometbft v0.37.18 separately:

```bash
# check penumbra docs for exact cometbft binary location
# or build from source:
git clone https://github.com/cometbft/cometbft.git
cd cometbft
git checkout v0.37.18
make build
# binary at ./build/cometbft
```

### 4. update cometbft config

edit `~/.penumbra/network_data/node0/cometbft/config/config.toml`:

```toml
[statesync]
# add this line (new in v0.37.18)
max_snapshot_chunks = 100000
```

this is a DoS protection for state sync - limits how many chunks a peer can advertise. not
strictly required for validators not using state sync, but good to have.

### 5. stop services

```bash
# if using systemd
sudo systemctl stop penumbra-pd
sudo systemctl stop penumbra-cometbft

# or if running directly
pkill pd
pkill cometbft
```

### 6. replace binaries

```bash
# backup old binaries
sudo cp /usr/local/bin/pd /usr/local/bin/pd.backup
sudo cp /usr/local/bin/cometbft /usr/local/bin/cometbft.backup

# install new binaries
sudo cp pd /usr/local/bin/pd
sudo cp cometbft /usr/local/bin/cometbft

# verify
pd --version      # should show 2.0.6
cometbft version  # will show 0.37.16 due to bug (actually 0.37.18)
```

### 7. start services

```bash
sudo systemctl start penumbra-cometbft
sudo systemctl start penumbra-pd

# or if running directly
cometbft start --home ~/.penumbra/network_data/node0/cometbft &
pd start --home ~/.penumbra/network_data/node0/pd &
```

### 8. verify upgrade

```bash
# check node is running and syncing
curl -s localhost:26657/status | jq '.result.sync_info'

# check node_info version (will show 0.37.16 due to bug)
curl -s localhost:26657/status | jq '.result.node_info.version'

# check consensus state
curl -s localhost:26657/consensus_state | jq '.result.round_state.height'

# check validator is signing
curl -s localhost:26657/status | jq '.result.validator_info'
```

---

## rollback procedure (if needed)

```bash
sudo systemctl stop penumbra-pd penumbra-cometbft

# restore old binaries
sudo cp /usr/local/bin/pd.backup /usr/local/bin/pd
sudo cp /usr/local/bin/cometbft.backup /usr/local/bin/cometbft

# remove new config option if added
# edit config.toml and remove max_snapshot_chunks line

sudo systemctl start penumbra-cometbft penumbra-pd
```

---

## verification that fix is applied

the actual code fix adds this check:

```go
if lookUpByIndex {
    val = vals.Validators[idx]
    if !bytes.Equal(val.Address, commitSig.ValidatorAddress) {
        return fmt.Errorf("validator address mismatch at index %d: expected %X, got %X",
            idx, val.Address, commitSig.ValidatorAddress)
    }
}
```

you can verify the binary contains the fix:

```bash
# check if the error string exists in binary
strings /usr/local/bin/cometbft | grep -i "validator address mismatch"
# should return the error message if patched
```

---

## monitoring post-upgrade

watch for:
- consensus participation (validator should be signing blocks)
- peer connections (should maintain healthy peer count)
- no unusual errors in logs about validation failures

```bash
# tail cometbft logs
journalctl -u penumbra-cometbft -f

# look for any validation errors
journalctl -u penumbra-cometbft --since "1 hour ago" | grep -i "mismatch\|invalid\|error"
```

---

## references

- penumbra v2.0.6 release: https://github.com/penumbra-zone/penumbra/releases/tag/v2.0.6
- cometbft security fix commit: `019babe0f`
- related advisories: ASA-2025-001, ASA-2025-002
- our analysis: see blog post draft in `src/posts/cometbft-validator-address-mismatch-vulnerability.mdx`

---

## contact

if issues during upgrade, check:
1. penumbra discord
2. cometbft github issues
3. internal escalation

**do not delay this upgrade** - the vulnerability is critical and patches are available.
