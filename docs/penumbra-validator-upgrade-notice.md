# validator upgrade notice - penumbra

## short version (for discord/telegram)

```
⚠️ SECURITY UPGRADE REQUIRED - CometBFT Validator Address Mismatch

A critical vulnerability in CometBFT affects commit signature verification.
Penumbra v2.0.6 (released Jan 24) contains the fix.

WHAT'S AT RISK:
• IBC cross-chain proof manipulation
• Light client attacks
• False slashing evidence against honest validators

CURRENT NETWORK STATUS (stake-weighted):
• 38% definitely vulnerable (v0.37.15 or older)
• 20% possibly patched (v0.37.16/v0.37.18)
• 38% unknown (private infrastructure)

We need >33% patched to block attacks. Currently uncertain if we're there.

UPGRADE NOW:
1. Update to Penumbra v2.0.6
2. CometBFT will report v0.37.16 (known bug, actually v0.37.18)
3. Verify fix: strings /path/to/cometbft | grep "validator address mismatch"

Release: https://github.com/penumbra-zone/penumbra/releases/tag/v2.0.6

Please reply with your current version so we can assess network safety.

- rotko.net
```

## longer version (for forum/announcement)

```
PENUMBRA VALIDATOR SECURITY NOTICE
==================================

TL;DR: Upgrade to Penumbra v2.0.6 immediately. A critical CometBFT
vulnerability allows malicious proposers to manipulate validator
attribution in commits.

THE VULNERABILITY
-----------------
CometBFT's commit signature verification has two paths:
• Full nodes verify by INDEX (position in validator set)
• Light clients verify by ADDRESS (ValidatorAddress field)

The bug: when verifying by index, the code never checked if the
validator at that index matches the ValidatorAddress in the commit.

An attacker (any validator during their proposer slot) can:
1. Collect legitimate signatures from consensus
2. Swap the ValidatorAddress fields in the commit
3. Full nodes accept (signatures valid by index)
4. Light clients see wrong validator attribution

ATTACK SCENARIOS
----------------
• IBC proof manipulation - forge cross-chain proofs with wrong
  validator attribution
• Light client attacks - trick wallets about who signed blocks
• False slashing - frame honest validators for double-signing
• Governance manipulation - misattribute validator positions

NETWORK SECURITY THRESHOLD
--------------------------
• Need >33% of stake on patched nodes to block new attacks
• If >66% vulnerable, malicious blocks can actually commit
• Current status: UNCERTAIN - we only have visibility into ~60% of stake

WHAT WE OBSERVE (2026-01-27)
----------------------------
Definitely vulnerable (v0.37.15 or older):
  iqlusion             16.39%
  CroutonDigital        3.94%
  POSTHUMAN             3.44%  (v0.37.6!)
  Stake&Relax           2.78%
  + others             11.71%
  TOTAL:               38.26%

Possibly patched (v0.37.16, likely v0.37.18):
  polkachu.com          8.73%
  rotko.net             8.26%
  ghostinnet            1.82%
  antumbra.net          1.69%
  TOTAL:               20.50%

Unknown (private infrastructure, not visible):
  Informal Systems     15.94%
  Lavender.Five         5.34%
  AutoStake             3.54%
  + others             13.84%
  TOTAL:               38.66%

HOW TO UPGRADE
--------------
1. Download Penumbra v2.0.6:
   curl --proto '=https' --tlsv1.2 -LsSf \
     https://github.com/penumbra-zone/penumbra/releases/download/v2.0.6/pd-installer.sh | sh

2. Stop services, replace binaries, restart

3. Note: cometbft version will show 0.37.16 (known bug, actually 0.37.18)

4. Verify you have the fix:
   strings /path/to/cometbft | grep "validator address mismatch"
   # Should output: "validator address mismatch at index %d: expected %X, got %X"

PLEASE RESPOND
--------------
Reply with your validator name and current cometbft version so we can
track network upgrade progress. We need to know if we've crossed the
33% safety threshold.

REFERENCES
----------
• Penumbra v2.0.6: https://github.com/penumbra-zone/penumbra/releases/tag/v2.0.6
• CometBFT fix: commit 019babe0f (v0.37.18)
• Full analysis: [link to blog post when published]

Stay safe,
rotko.net
```
