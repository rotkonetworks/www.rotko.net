# Introduction
These docs are open draft space of chief operator officer and not necessarily
uptodate deployed setup in production. We are in process of moving docs into 
website/blog format so treat info here as raw as hackmd posts.

Expect low level mumbling about internet technologies as well as hardware spcecs
of infra we have built ourselves part by part in place to meet the unconvetional
specs for server world that hosting web3 succesfully requires.
Most important components for blockchain perfomance are memory and especially
storage for merkle trie state as well as high clock speed CPU.

Some rule of a thumb when looking components for validator infra, you want CPU
capable to function at 5GHz(singlethread performance in cpubenhcmark +3k),
at least pcie4.0 nvme with constant performance of 1800MB/s(usually marketed
with temporary cahce performance 7000MB/s). Ideally collators/blockbuilder
should be run with pcie5/pcie6 and executed with multiple cores/validators.

Random Access Memory, better known RAM, should be functioning at 4800MHz,
meaning you can only use single stick per CPU because motherboards controller 
is not able to deliver enough voltage for more.
For example running all 4 slots in AM5 motherboards limits performance of RAM
to only 3600MHz instead of functioning at full 4800-6000MHz.

Polkadot new relaychain JAM specs are going to be 16 core 5GHz SMT disabled CPU,
8 TB of NVMe, 64GB DDR5 and networking at ~500Mbits having global routing table
without too over subscribed routes since networking is not anymore gossip based
but direct authenticated point to point.
