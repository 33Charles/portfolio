---
title: Network Traffic Analysis, The Complete Field Guide
tags:
---


# Network Traffic Analysis: The Complete Field Guide

Primary tools: **Wireshark** (plus tshark, dumpcap, editcap, mergecap, capinfos, text2pcap) and **tcpdump**. Supporting tools: Zeek, Suricata, NetworkMiner, tcpflow, ngrep, Scapy, Arkime, RITA, CyberChef, mitmproxy and others (Part 13).

## Contents

0. How to use this guide and the right mindset
1. Foundations: what traffic analysis is, packet anatomy, TCP, visibility limits, vantage points, file formats
2. Methodology: the thinking behind a good analysis
3. Capturing traffic: tcpdump, dumpcap, tshark, BPF capture filters
4. Wireshark: setup, interface, display filters (complete)
5. Wireshark statistics, one menu item at a time
6. TCP analysis and troubleshooting logic
7. Protocol deep dives (L2 to L7, including legacy and Windows enterprise protocols)
8. TLS, HTTPS, QUIC: analysing and decrypting encrypted traffic
9. Extracting files and artifacts (carving)
10. tshark in depth (command-line analysis and automation)
11. Threat patterns: what each attack looks like on the wire
12. Performance and troubleshooting analysis
13. Other tools worth knowing
14. CTF-specific techniques
15. The master workflow (checklist you can follow on any pcap)
16. Cheat sheets and reference tables
17. Pitfalls, legal and ethical notes

---

# Part 0: How to use this guide and the right mindset

**Packets are evidence of behaviour, not of intent.** A packet tells you _what was sent, by whom, to whom, when, and how much_. It never directly tells you _why_. Your job is to reconstruct the "why" from patterns, and to say how confident you are.

Three questions drive everything:

1. **What is normal here?** (baseline)
2. **What deviates from normal?** (anomaly)
3. **Can I explain the deviation with evidence?** (verification)

Skipping step 1 is the most common beginner mistake. A host talking to 40 domains is alarming on a database server and routine on a laptop. Context is the multiplier on every finding.

Learning order that works: Part 1 and 2 (theory), 3 and 4 (tools), 5 and 6 (statistics and TCP), 7 (protocols), 15 (workflow). Use 11 and 16 as lookup tables once you know the theory.

---

# Part 1: Foundations

## 1.1 What traffic analysis answers

|Domain|Typical questions|
|---|---|
|**Security / DFIR**|Who was compromised? How did the attacker get in? What did they touch? What left the network? Is the attacker still there?|
|**Threat hunting**|Is there beaconing, tunnelling, scanning, lateral movement that no alert caught?|
|**Troubleshooting**|Why is it slow? Where is the delay: client, network or server? Why does the connection reset?|
|**Malware analysis**|What does the sample talk to? What protocol, what C2 structure, what does it download?|
|**CTF**|Where is the hidden flag, credential, file or covert channel?|
|**Protocol learning/dev**|How does the protocol really behave versus the RFC?|

## 1.2 Types of network data (and why packets are the "ground truth")

|Data type|What it contains|Size|Strength|Weakness|
|---|---|---|---|---|
|**Full packet capture (PCAP)**|Every byte (headers + payload), subject to snaplen|Huge|Ground truth. Everything can be re-derived|Storage cost. Encryption hides payload|
|**Flow data (NetFlow/IPFIX/sFlow/Argus)**|Who talked to whom, ports, bytes, packets, times, flags|Tiny|Long retention, great for volume and beaconing stats|No payload, no content|
|**Metadata/log extraction (Zeek, Suricata EVE)**|Parsed protocol logs (conn, dns, http, ssl, files)|Small|Searchable, structured, scales|Depends on the parser. Misses what it was not built to parse|
|**Endpoint logs / EDR / Sysmon / proxy / DNS logs**|Process, user, URL, resolver view|Varies|Gives the _who/what process_ that the network cannot|Can be tampered with by an attacker on the host|

Logic: use flows to find _where to look_, packets to _prove what happened_, host logs to find _which process/user_.

## 1.3 Packet anatomy and encapsulation

Data is wrapped layer by layer on the way out (encapsulation) and unwrapped on the way in.

```
[ Ethernet header | IP header | TCP/UDP header | Application data | (Ethernet trailer/FCS) ]
   Layer 2           Layer 3     Layer 4          Layer 7
```

### Layer 2: Ethernet (frame)

- Fields: destination MAC, source MAC, EtherType (0x0800 IPv4, 0x86DD IPv6, 0x0806 ARP, 0x8100 VLAN tag), FCS.
- **Why it matters:** MACs only mean something on the local segment. After a router, MAC addresses change at every hop. Capturing at a host shows that host's gateway MAC, not the remote server's.
- MAC OUI (first 3 bytes) reveals the vendor (VMware `00:0c:29`, VirtualBox `08:00:27`, Raspberry Pi etc.). Useful for spotting unexpected devices.
- 802.1Q VLAN tags: `vlan.id`. Seeing multiple VLANs means trunk capture.

### Layer 3: IP

Key IPv4 fields and why you care:

|Field|Why it matters|
|---|---|
|Source/Destination IP|Who talks to whom. Spoofable on UDP and in scans|
|**TTL**|Decrements per hop. Initial values hint at OS: ~64 Linux/macOS/Android, ~128 Windows, ~255 network gear. A packet that claims to be from host X but arrives with a different TTL than X's other packets may be spoofed/injected|
|Identification, Flags (DF, MF), Fragment offset|Fragmentation. Used in evasion (overlapping fragments) and scans. DF set = path MTU discovery|
|Protocol|1 ICMP, 6 TCP, 17 UDP, 47 GRE, 50 ESP, 51 AH, 89 OSPF, 41 IPv6-in-IPv4 (tunnelling)|
|Header checksum|Mostly irrelevant. Offloading makes it look wrong on the capturing host|
|Total length|Packet size. Uniform sizes suggest automation|
|DSCP/ECN|QoS markings, occasionally a covert channel|

IPv6 differences: no fragmentation by routers, extension headers, **Neighbor Discovery (ICMPv6)** replaces ARP, **Router Advertisements** can be abused (rogue RA/mitm6), link-local `fe80::/10`.

Private ranges (RFC1918): `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`. Others to know: `169.254.0.0/16` (link-local/APIPA), `100.64.0.0/10` (CGNAT), `127.0.0.0/8` (loopback), `224.0.0.0/4` (multicast).

### Layer 4: TCP and UDP

- **TCP**: connection-oriented, reliable, ordered. Fields: ports, sequence, acknowledgment, flags, window, options. It leaves a _rich_ trail (handshake, retransmissions, RTT).
- **UDP**: connectionless, no handshake, no retransmission. Used by DNS, DHCP, NTP, SNMP, syslog, QUIC, VoIP. Easy to spoof, so UDP floods and reflection attacks are common.
- **Ports:** source port is usually ephemeral (49152 to 65535 on modern OSes, 32768 to 60999 on Linux), destination port usually identifies the service. A **well-known port carrying non-matching protocol** (HTTP on 53, SSH on 443) is a classic evasion and tunnelling sign. Don't trust port numbers, trust the _content_.

### Layer 7: Application

HTTP, DNS, SMB, etc. This is where meaning lives. Dissectors in Wireshark decode these by port guess or heuristics. If the traffic is on a non-standard port, use **Decode As**.

## 1.4 TCP in depth (the foundation of most analysis)

### The three-way handshake

```
Client                         Server
  | --- SYN (seq=x) ----------> |    "I want to talk, my ISN is x"
  | <-- SYN,ACK (seq=y, ack=x+1)|    "OK, my ISN is y"
  | --- ACK (ack=y+1) --------> |    "Got it"  → ESTABLISHED
```

What you learn from the handshake alone:

- **Initial RTT** (time between SYN→SYN/ACK→ACK) gives network distance (`tcp.analysis.initial_rtt`).
- **SYN options** fingerprint the OS: MSS, window scale, SACK permitted, timestamps, NOP padding order.
- A server answering with **RST,ACK** means the port is closed. **No answer** means filtered or host down. **SYN,ACK** means open.

### Data transfer

- **Sequence number** = byte offset of the first byte in this segment. **ACK number** = next byte expected.
- Wireshark shows _relative_ sequence numbers (starting at 0) by default. The raw ones are in the hex.
- **Window size** = how much more data the receiver can buffer. Scaled by the _window scale_ option negotiated in SYN (so Wireshark's "calculated window size" is the real value).
- **PSH** = push to application. **URG** = urgent pointer (rarely used legitimately, so hidden-data channel in CTFs).

### Teardown

- **Graceful:** FIN→ACK, FIN→ACK (4-way) or FIN,ACK combos.
- **Abrupt:** RST. Causes: closed port, firewall/IDS injecting resets, application crash, timeouts, scanner cleanup (a SYN scan sends RST after receiving SYN/ACK).

### TCP states you may reason about

LISTEN, SYN-SENT, SYN-RECEIVED, ESTABLISHED, FIN-WAIT-1/2, CLOSE-WAIT, LAST-ACK, TIME-WAIT, CLOSED. From a pcap you infer them from the flags.

### Reliability mechanisms visible in captures

|Observation|Meaning|
|---|---|
|**Retransmission** (same seq resent after timeout, RTO)|Packet or ACK lost, or very slow path|
|**Fast retransmission** (after 3 duplicate ACKs)|Loss detected quicker than a timeout|
|**Duplicate ACK**|Receiver got out-of-order data (a gap). 3 of them trigger fast retransmit|
|**Out-of-order**|Packets took different paths or capture-point artefacts|
|**Zero window**|Receiver application is not reading fast enough (server overloaded, slow consumer)|
|**Window full**|Sender has filled the receiver's advertised window|
|**Spurious retransmission**|Retransmitted although the original had arrived|
|**Previous segment not captured**|Capture lost a packet, or you started mid-stream|

## 1.5 What you can and cannot see

|Layer / item|Plain protocol|Encrypted (TLS/VPN/SSH)|
|---|---|---|
|Ethernet/IP/TCP/UDP headers|Visible|Visible|
|Source/destination IPs, ports, timing, sizes, direction|Visible|**Visible** (this is the key: metadata is never fully hidden)|
|DNS names|Visible|Visible unless DoH/DoT/DoQ|
|TLS SNI (server name)|n/a|Visible in ClientHello unless **ECH** (Encrypted Client Hello)|
|TLS certificate|n/a|Visible in TLS ≤1.2. **Encrypted in TLS 1.3**|
|HTTP method/URL/headers/body|Visible|Hidden (unless decrypted)|
|Credentials|Cleartext for FTP/Telnet/HTTP basic/POP/IMAP/SMTP/SNMPv1-2c|Hidden|
|Packet sizes/timing/volume|Visible|**Visible**, enabling traffic analysis without decryption|

**Takeaway:** encryption removes _content_, not _behaviour_. You can still detect beaconing, exfiltration volume, scanning, JA3/JA4 client fingerprints, odd certificates, suspicious SNI, and long-lived connections to rare destinations. See Part 8.

## 1.6 Vantage point: where you capture decides what you see

|Capture point|What you see|Blind spots|
|---|---|---|
|**On the host itself**|That host's traffic, often decrypted side available via key logging|Offload artefacts (bad checksums, giant frames), adds the capturing machine's own noise, can be tampered if the host is compromised|
|**Switch SPAN/mirror port**|Copies of traffic on mirrored ports/VLANs|Can drop packets under load, may miss east-west traffic not mirrored, duplicates if mirroring both directions|
|**Network TAP** (passive/active)|Complete copy of a link, no drops|Costs hardware, still link-local|
|**Router/firewall interface**|Traffic crossing that boundary (north-south)|Internal east-west traffic invisible. NAT: you see translated addresses on one side|
|**Inline proxy / MITM (mitmproxy, Burp)**|Decrypted HTTP(S)|Only proxy-aware or redirected traffic|
|**Cloud (AWS VPC Traffic Mirroring, Azure vTAP, GCP Packet Mirroring)**|VPC traffic|Config required, encapsulated in VXLAN|
|**Wi-Fi monitor mode**|802.11 frames over the air|Only one channel at a time. WPA encrypted unless you have the PSK + captured handshake|
|**Docker/containers/VMs**|`docker0`, `veth*`, bridge or `nsenter` into the container's netns|Easy to capture the wrong interface|

Consequences you must reason about:

- **NAT:** many internal hosts appear as one IP outside. Inside you see real IPs. Know which side you captured.
- **Asymmetric routing:** you may see only one direction of a conversation, making TCP analysis report "missing segments"/"ACKed unseen segment" falsely.
- **Capture started mid-stream:** no handshake means no window scaling info (Wireshark mis-shows windows), no relative sequence base.
- **Time:** timestamps come from the capturing clock. If you merge captures from different devices, clock skew breaks the timeline. Check NTP.
- **Snaplen:** if capture truncated packets (old tcpdump default 68/96 bytes), payloads are cut. Use `-s 0` or `-s 262144`.

## 1.7 Capture file formats

|Format|Notes|
|---|---|
|**pcap (libpcap)**|Classic. Magic `D4 C3 B2 A1` (little-endian, microsecond) or `A1 B2 C3 D4`, nanosecond variants `4D 3C B2 A1`. One link type per file, no comments|
|**pcapng**|Wireshark default. Magic `0A 0D 0D 0A`. Supports multiple interfaces, **packet comments**, name resolution blocks, **embedded TLS decryption secrets (DSB)**, per-packet flags, nanosecond time|
|**Others**|Snoop, NetMon, Pcap from Cisco/Juniper, ERF, etc. Wireshark opens most of them|

Identify a mystery file: `file capture.pcap`, `capinfos capture.pcap`, `xxd capture.pcap | head`.

Hash it first: `sha256sum capture.pcap`. Work on copies.

---

# Part 2: Methodology (the thinking behind the clicks)

## 2.1 Core principles

1. **Define the question before you open the file.** "Find something bad" is not a question. "Did host X talk to anything outside the company on non-standard ports after 14:00?" is.
2. **Top-down, then pivot.** Start with the aggregate (statistics), narrow to conversations, then packets. Never start by reading packets from #1. A capture of 1M packets is unreadable linearly.
3. **Understand normal, then hunt abnormal.** Everything unusual is _interesting_. Only some of it is _malicious_. Most is misconfiguration.
4. **Follow the bytes, don't trust the labels.** Ports, user agents, domain names and even protocols can lie. Content and behaviour are harder to fake.
5. **Time is the spine.** Always build a timeline. Cause precedes effect: DNS lookup → TCP connect → TLS handshake → request → response → follow-on connections.
6. **Every claim needs evidence and a packet number.** "Host A exfiltrated 40 MB" must point to a conversation, byte counts, and frames.
7. **Separate observation from interpretation.** "Host A sent 40 MB to 203.0.113.9 over TCP/443" is observation. "Exfiltration" is interpretation, so state your confidence.
8. **Absence of evidence is not evidence of absence.** Encryption, capture position and drops can hide things. State limitations.
9. **Reduce noise aggressively and deliberately.** Filter out known-good, but record what you removed so you can revisit it.
10. **Correlate with other data.** DNS ↔ TLS SNI ↔ HTTP Host ↔ IPs; network ↔ host logs ↔ threat intel.

## 2.2 The analysis funnel (phases)

```
Phase 0  Scope & questions        What's the objective, time range, hosts, constraints?
Phase 1  Integrity & metadata     Hash, capinfos, time range, link types, drops, snaplen
Phase 2  Big picture statistics   Protocol Hierarchy, Conversations, Endpoints, I/O graph
Phase 3  Identify actors          Who are the internal hosts? servers? external IPs? roles?
Phase 4  Baseline                 What's normal for these hosts/protocols/times?
Phase 5  Hypothesis triage        Per-protocol sweeps (DNS, HTTP, TLS, SMB...) for anomalies
Phase 6  Deep dive                Follow streams, decode payloads, extract files
Phase 7  Pivot & expand           Take each indicator, search the whole capture for it
Phase 8  Timeline & narrative     Build the story with timestamps
Phase 9  Report                   Findings, IOCs, evidence refs, confidence, recommendations
```

### Phase 0: Scope

Write down: what the capture is (where, when, why), what you're asked to find, what you already know (alerts, IPs, times), and what is out of scope.

### Phase 1: Integrity and metadata (why)

`capinfos` tells you: file type, packet count, duration, data rate, start/end time, interfaces, snaplen, comments. Why: a 3-second capture cannot show beaconing every 60 seconds. Short snaplen means you cannot read payloads. Low packet count over a long duration can mean the capture is sampled or filtered. Check for **dropped packets** (pcapng interface statistics block).

### Phase 2: Statistics (why before packets)

You compress a million packets into a few tables: which protocols, which pairs of hosts, how many bytes, when. Anomalies stand out in aggregate: an unexpected protocol, one pair with huge bytes, a spike at 03:00.

### Phase 3: Identify actors

Classify every important IP: client, server, gateway/router, DNS server, DHCP server, domain controller, proxy, scanner, unknown external. Typical heuristics:

- Receives connections on many ports and from many clients: server.
- Sends DNS queries: client. Receives them: resolver.
- Sends DHCP Offer/ACK: DHCP server.
- Receives Kerberos AS-REQ/TGS-REQ: domain controller.
- Many SYNs to many hosts: scanner (or a busy proxy).
- Names: DHCP option 12, NBNS, Kerberos CNameString, SMB session setup, HTTP user agents give hostnames/usernames/OS.

### Phase 4: Baseline

Define normal on three axes:

- **Who talks to whom** (peer graph, e.g. workstations normally never talk to each other over SMB).
- **What protocols/ports** (servers normally listen on a few ports).
- **How much / how often / when** (volume, periodicity, business hours). In a capture with no baseline, use _relative baseline_: compare hosts against their peers. The odd one out is the lead (the one host with 10x DNS queries, the one that connects to a country no one else does).

### Phase 5: Hypothesis-driven triage

For each hypothesis, run the specific tests. Examples:

- _"A host was port scanned"_ → SYN-without-ACK from one source to many ports/hosts; RST,ACK replies.
- _"Credentials were sniffed or brute-forced"_ → repeated auth failures; cleartext protocols.
- _"Malware beaconed"_ → periodic small connections to the same rare destination.
- _"Data left"_ → large outbound-heavy conversations, uploads, DNS tunnels.
- _"Lateral movement"_ → SMB/WinRM/RDP/RPC between internal hosts that normally do not talk.

### Phase 6: Deep dive

Follow streams, read the payload, extract files, decode encodings (base64, hex, gzip, XOR). Verify each hypothesis by finding the _proof packet_.

### Phase 7: Pivot

Every indicator (IP, domain, URL, User-Agent, JA3, filename, hash, account name, MAC) becomes a search key across the whole capture. This is how a single suspicious download expands into a full intrusion story: _who else contacted that IP? what else did that host do after receiving that file?_

### Phase 8: Timeline

Build a table: time (UTC), source → destination, protocol, event, frame#. The attack chain usually looks like: recon → initial access → execution → persistence/C2 → credential access → discovery → lateral movement → collection → exfiltration.

### Phase 9: Report

See 15.8.

## 2.3 The 5W+H question framework (apply to any flow)

- **Who** initiated (client) and who responded (server)? Which user/host name?
- **What** protocol, port, application, payload? File type?
- **When** did it start/end? Periodic? Business hours?
- **Where** to/from? Internal/external? Geography/ASN/reputation?
- **How much** data each direction? How many packets? Packet sizes?
- **How** did it begin (DNS lookup? redirect? link click?) and **what happened next** (download? new connection?)?

## 2.4 What makes something anomalous (the "7 smells")

1. **Rare**: few hosts, few connections, first seen. (rarity ≠ malice)
2. **Regular**: machine-like periodicity (beacons), identical sizes, identical intervals.
3. **Large**: unusually large outbound (exfil), or huge request counts (brute force, DoS).
4. **Odd protocol/port**: protocol on the wrong port, unknown protocol, undissected "Data".
5. **Wrong direction**: client-like traffic from a server (servers initiating outbound), workstation-to-workstation SMB.
6. **Wrong time**: off-hours activity.
7. **Wrong content**: encoded blobs in URLs/DNS labels/headers, executable magic bytes where text is expected, weird user agents, high-entropy data in plaintext protocols.

## 2.5 Cognitive traps

- **Confirmation bias:** hunting for proof of your first theory. Actively look for evidence that _contradicts_ it.
- **Noise blindness:** CDNs, cloud services, update traffic look weird but are benign. Verify with certificate, SNI, reputation.
- **Over-trusting reputation:** attackers use Google Drive, Slack, GitHub, Telegram, S3, Dropbox, Cloudflare Workers for C2/exfil. A known-good domain can still carry bad behaviour.
- **Anchoring on IPs:** shared hosting and CDNs mean one IP serves thousands of domains.
- **Capture artefacts treated as attacks:** checksum errors from offload, retransmissions from SPAN drops, duplicates from mirrored ports.
- **Absence = innocence:** forgetting encryption/out-of-capture channels.

## 2.6 Evidence handling

- Hash original (`sha256sum`), record time/source/how acquired, keep original read-only, work on copies.
- Use packet comments (pcapng) and a separate notes file with frame numbers and filters used.
- Screenshots + exported filtered pcaps (`File → Export Specified Packets`) for each finding.
- Sanitise before sharing (IPs, credentials). Treat pcaps as sensitive: they contain passwords, cookies, personal data.
- Analyse live malware captures in an isolated VM. **Never** open extracted files on the host.
- Name resolution: disable "network name resolution" so your analysis machine doesn't send DNS queries for the attacker's domains/IPs (that tips them off and pollutes evidence).

## 2.7 Frameworks to map findings

- **Cyber Kill Chain:** recon, weaponisation, delivery, exploitation, installation, C2, actions on objectives.
- **MITRE ATT&CK:** map to tactics/techniques, e.g. T1046 Network Service Discovery (scan), T1071.004 DNS C2, T1572 Protocol Tunneling, T1048 Exfiltration over alternative protocol, T1557 Adversary-in-the-Middle (ARP/LLMNR poisoning, T1557.001), T1110 Brute Force, T1558.003 Kerberoasting, T1003.006 DCSync, T1021.002 SMB/Admin Shares, T1021.001 RDP, T1550.002 Pass the Hash, T1105 Ingress Tool Transfer, T1041 Exfil over C2, T1568 Dynamic Resolution (DGA), T1573 Encrypted Channel, T1095 Non-application layer protocol.
- **Pyramid of Pain:** hashes and IPs are easy for attackers to change, TTPs are hard. Prefer behavioural detections (beacon patterns, JA3/JA4, protocol misuse) to single IP matches.

---

# Part 3: Capturing traffic

## 3.1 Capture filter vs display filter (critical difference)

||Capture filter|Display filter|
|---|---|---|
|Syntax|**BPF** (Berkeley Packet Filter)|Wireshark display filter language|
|Applied|**During capture**, packets not matching are never stored|**After capture**, only hides packets|
|Reversible|**No**, dropped data is gone|Yes|
|Use|Limit volume (high-speed links), focus|Analysis|
|Tools|tcpdump, dumpcap, tshark `-f`|Wireshark, tshark `-Y`|

Rule of thumb: **capture broadly, filter narrowly later**, unless disk/performance forces you. Over-filtering at capture time loses evidence you didn't know you needed.

## 3.2 tcpdump: the essentials

Requires root (or capabilities: `sudo setcap cap_net_raw,cap_net_admin=eip /usr/sbin/tcpdump`).

```bash
tcpdump -D                              # list interfaces
sudo tcpdump -i eth0                    # live, default snaplen
sudo tcpdump -i eth0 -nn                # no DNS/service name resolution (faster, cleaner, no side-effects)
sudo tcpdump -i any -nn                 # all interfaces (Linux "cooked" capture, no real Ethernet header)
sudo tcpdump -i eth0 -nn -s 0 -w cap.pcap      # write full packets to file
tcpdump -nn -r cap.pcap                 # read a file
tcpdump -nn -r cap.pcap -c 20           # first 20 packets
```

### Important flags

|Flag|Meaning / why|
|---|---|
|`-i <if>`|Interface. `any` = all (Linux)|
|`-n` / `-nn`|Don't resolve hostnames / also don't resolve port names. Always use `-nn` for analysis|
|`-s 0`|Snaplen: capture full packet (modern tcpdump default is 262144, but older ones truncated to 68/96 bytes)|
|`-w file`|Write raw packets to file (use for evidence)|
|`-r file`|Read from file|
|`-c N`|Stop after N packets|
|`-v`, `-vv`, `-vvv`|Verbosity (TTL, IP id, options, decoded details)|
|`-X`|Hex + ASCII of payload (excluding link header). `-XX` includes Ethernet header|
|`-A`|ASCII only. Good for HTTP/cleartext|
|`-e`|Show link-layer (MAC) header|
|`-q`|Quiet, shorter protocol info|
|`-t`|No timestamp. `-tt` epoch. `-ttt` delta from previous. `-tttt` human date+time. `-ttttt` delta from first packet|
|`-p`|Don't enable promiscuous mode|
|`-Q in|out|
|`-B <KiB>`|Kernel capture buffer size (raise it to avoid drops under load)|
|`-U`|Packet-buffered write (flush each packet)|
|`-C <MB>`|Rotate file after N million bytes|
|`-W <n>`|Keep at most n files (ring buffer with `-C`/`-G`)|
|`-G <sec>`|Rotate file every N seconds (use strftime in `-w`)|
|`-Z <user>`|Drop privileges after opening the interface|
|`-K`|Don't verify checksums (useful on the capturing host due to offload)|
|`-j`/`--time-stamp-type`, `--time-stamp-precision=nano`|Timestamp source/precision|
|`-I`|Monitor mode (wireless, where supported)|
|`-y <linktype>`|Specify data link type|

### Ring buffer / long-running captures

```bash
sudo tcpdump -i eth0 -nn -s 0 -C 100 -W 20 -w ring.pcap          # 20 files × 100 MB, overwrite oldest
sudo tcpdump -i eth0 -nn -s 0 -G 3600 -w 'cap_%Y%m%d_%H%M%S.pcap'  # new file each hour
sudo tcpdump -i eth0 -nn -s 0 -G 3600 -W 24 -w 'cap_%H.pcap' -Z root
```

### Reading the tcpdump output line

```
12:03:45.123456 IP 10.0.0.5.51234 > 93.184.216.34.443: Flags [S], seq 1234567890, win 64240, options [mss 1460,sackOK,TS val 1 ecr 0,nop,wscale 7], length 0
```

Timestamp, protocol, `src.port > dst.port`, TCP flags (`S` SYN, `.` ACK, `P` PSH, `F` FIN, `R` RST, `U` URG, `E`/`W` ECN), seq/ack/win, options, payload length.

## 3.3 BPF capture filter language (works in tcpdump, dumpcap, tshark -f, Wireshark capture options)

### Primitives

```
host 10.0.0.5                 # src or dst
src host 10.0.0.5 / dst host 10.0.0.5
net 10.0.0.0/24               # or: net 10.0.0.0 mask 255.255.255.0
port 443 / src port 53 / dst port 80
portrange 1-1024
tcp / udp / icmp / icmp6 / arp / ip / ip6
ether host aa:bb:cc:dd:ee:ff
ether proto 0x0806
vlan 100                      # note: vlan primitive changes offsets for later primitives
broadcast / multicast / ip broadcast / ip multicast
less 100 / greater 1000       # packet length
```

Combine with `and` (`&&`), `or` (`||`), `not` (`!`), and parentheses (quote them in shell).

### Examples

```bash
# Only traffic from a host to anywhere on web ports
tcpdump -nn -i eth0 'host 10.0.0.5 and (port 80 or port 443)'
# Everything except SSH (don't capture your own session)
tcpdump -nn -i eth0 'not port 22'
# DNS only
tcpdump -nn -i eth0 'udp port 53 or tcp port 53'
# Traffic between two hosts
tcpdump -nn 'host 10.0.0.5 and host 10.0.0.9'
# Subnet to anything outside RFC1918
tcpdump -nn 'src net 10.0.0.0/8 and not dst net (10.0.0.0/8 or 172.16.0.0/12 or 192.168.0.0/16)'
# Only large packets
tcpdump -nn 'greater 1400'
```

### Flag-level BPF (the power feature)

TCP flags live in byte 13 of the TCP header (`tcp[13]`), accessible via `tcp[tcpflags]`:

```bash
tcpdump -nn 'tcp[tcpflags] == tcp-syn'                         # SYN only (new connection attempts / scans)
tcpdump -nn 'tcp[tcpflags] & (tcp-syn|tcp-ack) == (tcp-syn|tcp-ack)'   # SYN-ACK
tcpdump -nn 'tcp[tcpflags] & tcp-rst != 0'                     # any RST
tcpdump -nn 'tcp[tcpflags] & (tcp-fin|tcp-psh|tcp-urg) == (tcp-fin|tcp-psh|tcp-urg)'  # XMAS scan
tcpdump -nn 'tcp[tcpflags] == 0'                               # NULL scan
tcpdump -nn 'tcp[13] == 2'                                     # numeric SYN-only equivalent
tcpdump -nn 'icmp[icmptype] == icmp-echo'                      # pings (echo request)
tcpdump -nn 'icmp[icmptype] != icmp-echo and icmp[icmptype] != icmp-echoreply'
tcpdump -nn 'ip[6:2] & 0x1fff != 0 or ip[6] & 0x20 != 0'       # fragments (offset>0 or MF set)
tcpdump -nn 'ip[8] < 5'                                        # low TTL (traceroute-like)
tcpdump -nn 'tcp port 80 and (((ip[2:2] - ((ip[0]&0xf)<<2)) - ((tcp[12]&0xf0)>>2)) != 0)'  # HTTP packets with payload
tcpdump -nn -A 'tcp port 80 and tcp[((tcp[12:1] & 0xf0) >> 2):4] = 0x47455420'   # HTTP GET ("GET ")
tcpdump -nn 'tcp dst port 80 and tcp[((tcp[12:1] & 0xf0) >> 2):4] = 0x504f5354'  # HTTP POST
```

Why `tcp[12]&0xf0 >> 2`: the TCP header length (data offset) is variable, so payload starts at that computed offset.

### tcpdump recipes for investigation

```bash
# Cleartext credentials hunting
sudo tcpdump -nn -A -s 0 'tcp port 21 or tcp port 23 or tcp port 110 or tcp port 143 or tcp port 25' | grep -iE 'user|pass|login'
# HTTP hosts and user-agents live
sudo tcpdump -nn -A -s 0 'tcp port 80' | grep -E 'Host:|User-Agent:|GET |POST '
# DNS queries live
sudo tcpdump -nn -l -i eth0 udp port 53
# Count top talkers from a pcap
tcpdump -nn -r cap.pcap | awk '{print $3}' | cut -d. -f1-4 | sort | uniq -c | sort -rn | head
# Split a big pcap by filter into a new file
tcpdump -nn -r big.pcap -w http_only.pcap 'tcp port 80'
# Time-sliced read
tcpdump -nn -tttt -r cap.pcap | head
# Detect ARP anomalies
sudo tcpdump -nn -e arp
# Show DHCP exchanges (full detail)
sudo tcpdump -nn -v -i eth0 'udp port 67 or udp port 68'
# Capture on loopback or inside a container
sudo tcpdump -i lo -nn
sudo nsenter -t <container_pid> -n tcpdump -nn -i eth0
```

`-l` line-buffers output so you can pipe live to `grep`.

## 3.4 dumpcap and tshark for capture

- **dumpcap** is Wireshark's capture engine. Lightweight, privilege-separated, used by Wireshark/tshark. Better than tcpdump for pcapng and ring buffers with multiple conditions.

```bash
dumpcap -D
dumpcap -i eth0 -f "not port 22" -w out.pcapng -b duration:3600 -b files:24
dumpcap -i eth0 -w out.pcapng -a duration:300         # stop after 5 min
dumpcap -i eth0 -w out.pcapng -a filesize:500000      # stop at ~500 MB (KB units)
```

- **tshark** can capture and analyse in one tool:

```bash
tshark -i eth0 -f "tcp port 443" -w out.pcapng
tshark -i eth0 -Y "dns" -T fields -e ip.src -e dns.qry.name    # live, with display filter
```

Capture filters use `-f`, display filters use `-Y`.

## 3.5 Capture gotchas (what silently ruins analysis)

|Problem|Symptom|Fix/Understanding|
|---|---|---|
|**Checksum offload**|"Bad checksum" on outbound packets captured on the sending host|NIC computes checksum after capture. Ignore or disable validation (Wireshark default is off)|
|**TSO/GSO/GRO**|Huge frames (>1500 bytes, up to 64 KB)|NIC/kernel coalescing. Disable with `ethtool -K eth0 tso off gso off gro off` for faithful capture|
|**Dropped packets**|Gaps, "previous segment not captured"|Increase buffer (`-B`), write to fast disk, filter, use TAP/dedicated NIC, check drop stats|
|**Promiscuous mode**|Only your own traffic|Enable promisc on switch-mirror captures (default on in Wireshark/tcpdump except `-p`)|
|**`any` interface**|Link type "Linux cooked" (SLL), no MACs, no VLAN|Capture a real interface if L2 matters|
|**Wrong interface**|Empty capture|`-D`, check which interface has traffic|
|**Duplicate packets**|Same packet twice (SPAN of both directions, or bridge)|`editcap -d` removes exact duplicates, but beware masking real retransmits|
|**Clock**|Timeline inconsistencies|Sync NTP before captures. Note timezone, prefer UTC|
|**Capturing your own tool's traffic**|SSH/remote desktop floods capture|Exclude with `not port 22` etc|
|**Wi-Fi**|Only your frames, or encrypted|Monitor mode, correct channel, capture the 4-way handshake, supply PSK|

## 3.6 The Wireshark command-line utilities (know all of these)

|Tool|Purpose|Example|
|---|---|---|
|**capinfos**|Metadata of a capture|`capinfos cap.pcap` / `capinfos -T -m *.pcap` (table)|
|**editcap**|Edit/convert/split/trim|`editcap -c 100000 big.pcap part.pcap` (split by packets). `editcap -i 300 big.pcap part.pcap` (every 5 min). `editcap -A "2026-10-04 09:00:00" -B "2026-10-04 10:00:00" in.pcap out.pcap` (time window). `editcap -r in.pcap out.pcap 1-100` (keep packets 1–100). `editcap -d` (drop duplicates). `editcap -F pcap in.pcapng out.pcap` (convert). `editcap --inject-secrets tls,keys.log in.pcap out.pcapng` (embed TLS keys)|
|**mergecap**|Merge captures|`mergecap -w all.pcapng a.pcap b.pcap` (chronological). `mergecap -a` (append in order given)|
|**reordercap**|Fix out-of-order timestamps|`reordercap in.pcap out.pcap`|
|**text2pcap**|Hex dump → pcap|`text2pcap -e 0x800 hex.txt out.pcap` or with `-T`/`-u` to add fake headers (handy for turning a hex-dumped payload into a dissectable packet)|
|**rawshark**|Read raw packet stream from pipe|Niche|
|**dftest**|Test/compile display filter|`dftest 'tcp.port == 80'`|
|**randpkt**|Generate random packets|Testing|
|**sharkd**|Wireshark JSON-RPC daemon|Automation|

---

# Part 4: Wireshark

## 4.1 The interface and what each pane is for

- **Packet List:** one row per packet (No., Time, Source, Destination, Protocol, Length, Info). Your _overview_.
- **Packet Details:** the dissected tree of the selected packet (Frame → Ethernet → IP → TCP → Application). Your _explanation_. Right-click any field → **Apply as Filter / Prepare as Filter / Apply as Column / Follow**.
- **Packet Bytes:** hex + ASCII. Your _ground truth_. Click a field and its bytes highlight. When a dissector looks wrong, trust the bytes.
- **Status bar:** capture file, profile, packets displayed/total, marked. Expert Info indicator (coloured dot) bottom-left.
- **Display filter bar:** green = valid, red = invalid, yellow = valid but possibly unintended (e.g. deprecated syntax). Autocomplete shows field names.

## 4.2 Set up before you analyse (do this once, save as a Profile)

**Profiles:** `Edit → Configuration Profiles → New`. Create "Analysis" and "Troubleshooting". A profile saves columns, colouring rules, filter buttons, and preferences.

### Recommended columns

Right-click field → _Apply as Column_ (or Preferences → Appearance → Columns):

- `frame.time_delta_displayed` (delta between _displayed_ packets, great for beaconing)
- `tcp.srcport`, `tcp.dstport` and `udp.srcport`, `udp.dstport` (or `Src Port`/`Dst Port` via `%uS`, `%uD`)
- `tcp.stream` and `udp.stream` (conversation index)
- `http.host`, `http.request.uri`, `http.user_agent`
- `dns.qry.name`
- `tls.handshake.extensions_server_name` (SNI)
- `ip.ttl`
- `frame.len`
- `tcp.window_size` when analysing performance, `tcp.analysis.ack_rtt`

### Time display (View → Time Display Format)

- **UTC Date and Time of Day** for evidence/timeline work (always UTC if multiple sources).
- **Seconds Since Beginning of Capture** for duration math.
- **Seconds Since Previous Displayed Packet** for intervals/beacons.
- Set precision to microseconds/automatic.

### Name resolution (View → Name Resolution or Preferences → Name Resolution)

- **Resolve MAC addresses:** OK (local OUI lookup, no network).
- **Resolve network (IP) addresses:** **OFF** during security work. It makes your analysis box send reverse-DNS queries to the Internet, alerting attackers and polluting evidence.
- **Use captured DNS packet data for name resolution:** ON (Wireshark builds IP→name from DNS responses in the capture itself, safely). View it in `Statistics → Resolved Addresses`.
- **Resolve transport names (ports → services):** optional, leave off if you prefer seeing raw port numbers.

### Key protocol preferences (Edit → Preferences → Protocols)

|Protocol|Setting|Why|
|---|---|---|
|**TCP**|_Allow subdissector to reassemble TCP streams_ = ON|Needed to rebuild HTTP bodies, files, etc. across segments|
|**TCP**|_Analyze TCP sequence numbers_ = ON|Enables all `tcp.analysis.*` flags|
|**TCP**|_Relative sequence numbers_ = ON (default)|Readable seq numbers|
|**TCP**|_Calculate conversation timestamps_ = ON|Adds `tcp.time_relative` / `tcp.time_delta` (time since stream start / previous segment in same stream)|
|**TCP**|_Track number of bytes in flight_|Performance analysis|
|**TCP**|_Validate the TCP checksum if possible_ = OFF on captures taken on the same host (offload)|Avoids false "bad checksum" noise|
|**IPv4**|_Reassemble fragmented datagrams_ = ON|Needed to see fragmented payloads|
|**IPv4/UDP**|Checksum validation OFF if captured on sending host|Same offload reason|
|**TLS**|(Pre)-Master-Secret log filename / RSA keys list|Decryption (Part 8)|
|**HTTP**|_Reassemble entity bodies spanning multiple TCP segments_, _Uncompress entity bodies_ = ON|Reading and exporting gzip'd content|
|**SMB/SMB2**|Reassembly ON|File extraction|

### Colouring rules (View → Coloring Rules)

Default colours: black/red = errors (TCP problems), light green = HTTP, light blue = UDP/DNS, lavender = TCP, yellow = routing/ARP, gray = TCP SYN/FIN/etc. Add your own: e.g. highlight `ip.addr == <suspect>` red, `dns.flags.rcode != 0` orange, `tcp.flags.reset == 1` purple.

### Filter buttons

Click `+` at the right of the filter bar to save frequent filters as buttons (e.g. "DNS Queries", "SYN only", "HTTP POST", "Exclude noise").

## 4.3 Display filter language (complete reference)

### 4.3.1 Basics

```
ip.addr == 10.0.0.5                       # src OR dst
ip.src == 10.0.0.5 && ip.dst == 8.8.8.8
tcp.port == 443                           # src OR dst port
tcp.dstport == 80
udp.port == 53
!(ip.addr == 10.0.0.5)                    # negate (always parenthesise)
ip.addr == 10.0.0.0/24                    # CIDR
ip.addr in {10.0.0.5 10.0.0.9}            # set membership
tcp.port in {80 443 8080 8443}
tcp.port in {1..1024}                     # ranges
frame.number >= 100 && frame.number <= 200
frame.time >= "2026-10-04 09:00:00" && frame.time <= "2026-10-04 09:30:00"
frame.time_relative > 30 && frame.time_relative < 60
```

**Wireshark 3.x gotcha:** `ip.addr != 1.2.3.4` meant "any of the addresses differs", which matches nearly every packet. Write `!(ip.addr == 1.2.3.4)`. In Wireshark 4.0+ `!=` is `!(==)`, but the parenthesised form is always safe.

### 4.3.2 Operators

|Operator|Meaning|
|---|---|
|`==` `eq`|equal|
|`!=` `ne`|not equal|
|`>` `gt`, `<` `lt`, `>=` `ge`, `<=` `le`|comparisons|
|`contains`|substring (case-sensitive) in a field/bytes|
|`matches` / `~`|PCRE regex (use `(?i)` for case-insensitive)|
|`in {a b c}`|membership, ranges with `..`|
|`&&` `and`, `||
|`&` (bitwise AND)|`tcp.flags & 0x02`|
|`[n:m]` / `[n]`|slice (byte offset: length)|
|`len()`, `lower()`, `upper()`, `count()`, `string()`|functions (availability varies by version)|

### 4.3.3 Matching strings and bytes (searching payloads)

```
frame contains "password"                         # anywhere in the packet
frame matches "(?i)(pass|pwd|token|secret)="      # case-insensitive regex
tcp.payload contains "flag{"
http.request.uri contains "../"                   # path traversal attempt
http contains "Authorization"
lower(http.user_agent) contains "curl"
dns.qry.name matches "^[a-z0-9]{20,}\\."          # long random-looking label
frame[0:2] == 4d:5a                               # MZ at start of frame (rare)
tcp.payload[0:2] == 4d:5a                         # PE executable at start of TCP payload
data.data[0:4] == 7f:45:4c:46                     # ELF
```

**Note:** `contains` on `frame` only sees what's _in that frame_. A string split across two TCP segments will be missed. For stream-level search, use _Follow TCP Stream_ or `Edit → Find Packet → String`, or use the reassembled field (`http.file_data contains ...`).

### 4.3.4 Protocol presence

Typing just the protocol name filters packets that contain that dissector layer: `http`, `dns`, `tls`, `smb2`, `kerberos`, `ftp`, `arp`, `icmp`, `dhcp`. Combine: `tcp && !tls && !http` finds TCP traffic not understood as TLS/HTTP, often custom protocols or C2.

- `data` = packets with undissected payload (a strong "unknown protocol" detector).
- `_ws.malformed` = malformed packets. `_ws.expert` = anything with an expert item. `_ws.expert.severity == error`.
- `tcp.len > 0` = TCP packets with payload (hides pure ACKs).
- `!tcp.analysis.flags` hides TCP problem noise, and `tcp.analysis.flags` shows only them.

### 4.3.5 Conversation/stream filters

```
tcp.stream == 14        # a specific TCP conversation
udp.stream == 3
http.request            # HTTP requests
http.response           # HTTP responses
```

Right-click a packet → **Conversation Filter → TCP/IP/Ethernet**, or **Follow → TCP Stream** (applies `tcp.stream eq N`).

### 4.3.6 Useful TCP flag filters

```
tcp.flags.syn == 1 && tcp.flags.ack == 0     # SYN only
tcp.flags.syn == 1 && tcp.flags.ack == 1     # SYN/ACK
tcp.flags == 0x002                            # exactly SYN
tcp.flags == 0x012                            # exactly SYN/ACK
tcp.flags == 0x014                            # RST/ACK (closed-port reply)
tcp.flags.reset == 1
tcp.flags.fin == 1
tcp.flags == 0x000                            # NULL scan
tcp.flags == 0x029                            # XMAS (FIN+PSH+URG)
tcp.flags == 0x001                            # FIN-only scan
tcp.flags.urg == 1 || tcp.urgent_pointer > 0  # urgent usage (unusual → hidden data in CTF)
```

### 4.3.7 Reading TCP analysis flags

```
tcp.analysis.retransmission
tcp.analysis.fast_retransmission
tcp.analysis.spurious_retransmission
tcp.analysis.duplicate_ack
tcp.analysis.out_of_order
tcp.analysis.lost_segment                 # "previous segment not captured"
tcp.analysis.ack_lost_segment
tcp.analysis.zero_window
tcp.analysis.window_full
tcp.analysis.window_update
tcp.analysis.reused_ports                 # port reuse (also appears in scans/tools)
tcp.analysis.keep_alive
tcp.analysis.initial_rtt > 0.2            # slow handshake (>200 ms)
tcp.analysis.ack_rtt > 1                  # slow acknowledgement
```

### 4.3.8 Layer and field tricks

```
ip.ttl < 10                               # near-expiry or traceroute
ip.ttl == 128 && ip.src == <linux-host>   # TTL inconsistency (possible spoof/relay)
ip.flags.mf == 1 || ip.frag_offset > 0    # fragments
ip.flags.df == 1
ip.len > 1400
ip.dsfield.dscp != 0
eth.addr == aa:bb:cc:dd:ee:ff
eth.src[0:3] == 00:0c:29                  # VMware OUI
vlan.id == 100
frame.len > 1500                          # jumbo / offload coalescing
frame.coloring_rule.name == "..."
```

### 4.3.9 Filter macros and saved filters

`Analyze → Display Filter Macros` lets you define reusable expressions. `Analyze → Display Filters…` stores named filters.

### 4.3.10 Always remember

- Filter by **what you want to see**, then add exclusions for noise. Build iteratively: start `ip.addr == X`, then `&& !dns && !arp && !mdns` etc.
- A filter that doesn't match means one of: wrong field, wrong direction, protocol not dissected (wrong port → use _Decode As_), or traffic isn't in the capture.
- When Wireshark shows a protocol as `TCP` only with data, try _Analyze → Decode As_ (e.g. TCP port 8080 → HTTP, TCP port 4443 → TLS).

## 4.4 Finding things

- **Edit → Find Packet (Ctrl+F):** by _Display filter_, _Hex value_, _String_ (search in Packet list / Packet details / Packet bytes, with encoding narrow/wide UTF-16 and case sensitivity), or _Regular Expression_. Use **Narrow & Wide (UTF-16/ASCII)** when hunting Windows strings.
- **Mark packets (Ctrl+M)**, then _Edit → Mark/Unmark_, _Next Mark_. Export only marked via _File → Export Specified Packets_.
- **Time reference (Ctrl+T)** on a packet makes subsequent relative times start from it (measure delay between events).
- **Packet comments:** right-click → Packet Comment (pcapng only). _Statistics → Capture File Properties_ lists all comments.
- **Go to packet (Ctrl+G)**, _Go → Next/Previous Packet in Conversation_.
- **Ignore Packet (Ctrl+D)** to exclude a packet from dissection/analysis (temporary hiding of noise).

## 4.5 Follow Stream (Analyze → Follow, Ctrl+Alt+Shift+T for TCP)

Reconstructs the application-layer conversation.

- Types: **TCP, UDP, TLS (decrypted), HTTP, HTTP/2, QUIC, SIP, DCCP**.
- Colours: **red = client→server, blue = server→client** (client = the side that sent first).
- Options at bottom: _Show data as_ ASCII / Hex Dump / Raw / C Arrays / YAML / EBCDIC / UTF-8; _Entire conversation_ vs one direction; **Save as…** for raw bytes (carving files); **Filter Out This Stream** (adds `!(tcp.stream eq N)`), and a **stream number selector** to walk through all streams quickly.
- **Method:** step through streams (`Stream:` spinbox), skimming. Anything readable (commands, JSON, headers, credentials, shell prompts like `$ whoami`) is a lead.
- **Raw** mode + Save gives you the exact bytes (important for binaries, as ASCII mode corrupts non-text bytes).

## 4.6 Exporting

- **File → Export Objects →** HTTP, SMB, TFTP, IMF (email), DICOM, **FTP-DATA** (in newer versions). Lists files Wireshark could reassemble, with hostname, content type, size. Save one or all.
- **File → Export Specified Packets:** save displayed/marked packets as a new pcap (isolating evidence).
- **File → Export Packet Dissections:** to CSV/text/JSON/XML.
- **File → Export TLS Session Keys:** write out keys embedded in the capture.
- **File → Export PDUs to File:** export reassembled application PDUs (for example, a plain HTTP body stream) for further analysis.
- **Tools → Credentials:** lists cleartext credentials Wireshark's dissectors recognise (HTTP basic, FTP, Telnet-ish, POP, IMAP, SMTP AUTH, etc., depending on version).

---

# Part 5: Wireshark Statistics, every menu item and the logic behind it

**Principle:** statistics answer "what's in this capture?" without reading packets. Start here, always. Most tables have a **"Limit to display filter"** checkbox, which is the technique for drilling down: apply a filter, then re-run the stat, and it only counts what you filtered.

## 5.1 Capture File Properties (Ctrl+Alt+Shift+C)

Shows: file name, length, SHA hashes, format, encapsulation (link type), snaplen, first/last packet time, elapsed time, **interface info**, **dropped packets** (if recorded), packet counts, avg pps, avg packet size, bytes, avg bits/s, capture comments. **Why:** Validates the capture: wrong link type, truncated packets (snaplen), duration too short, drops, timezone/time range.

## 5.2 Resolved Addresses

Shows hosts and names gathered from the capture (via DNS responses), plus address/port resolution files. **Why:** Quick IP→domain map built _from the traffic itself_. Instantly shows which domain an unknown IP was contacted as. Ethernet OUI vendor resolution.

## 5.3 Protocol Hierarchy

A tree of every protocol layer with **% packets, packets, % bytes, bytes, bits/s, end packets/bytes**. **How to read:**

- Compare **% by packets vs % by bytes.** Lots of packets but few bytes = chatty small messages (DNS, ACKs, beacons). Few packets but lots of bytes = bulk transfer (downloads, exfil).
- Look for **unexpected protocols**: Telnet, FTP, TFTP, IRC, SMB over the Internet, NetBIOS, SNMP, RDP, VNC, Tor-ish patterns, ICMP with big bytes, QUIC where not expected.
- Look for **"Data"** leaf nodes: undissected payload = unknown/custom protocol or traffic on a non-standard port. Investigate with `data` filter.
- **"Malformed Packet"** nodes: broken dissection (exploit attempts, fuzzing, truncated captures, or Wireshark limitations).
- **Right-click → Apply as Filter → Selected** to jump to that protocol's packets. **Logic:** each hierarchy entry is a hypothesis generator. "Why is there 4% IRC?" "Why is ICMP 30% of bytes?"

## 5.4 Conversations (Statistics → Conversations)

Tabs: **Ethernet, IPv4, IPv6, TCP, UDP, (others: BLUETOOTH, WLAN, USB, SCTP...)**. Columns: Address A/B, Port A/B, Packets, Bytes, **Packets/Bytes A→B and B→A**, Rel Start, **Duration**, Bits/s A→B, Bits/s B→A, **Stream ID**. Options: _Name resolution_, _Limit to display filter_, _Absolute start time_, **Follow Stream**, **Graph** (opens I/O graph for that conversation), **Copy** (CSV), **Conversation Types** (select which tabs).

**How to use it (patterns):**

|Pattern in Conversations|Meaning|
|---|---|
|Sort by **Bytes**|Biggest transfers. Check direction asymmetry|
|**Bytes B→A ≫ A→B** (A internal)|Download (updates, malware drop, streaming)|
|**Bytes A→B ≫ B→A** (A internal)|**Upload / exfil** candidate|
|Many conversations of _tiny, identical_ size to same B|**Beaconing** (check the start times for regular intervals)|
|Long **Duration**, very low bytes|Interactive or keep-alive C2, reverse shell, SSH/RDP session, persistent connection|
|One A with conversations to _many different B on the same port_|Scan/sweep (or a busy web client)|
|Many conversations to _one B on many ports_|Port scan|
|TCP conversations with 1 to 3 packets|Failed/short connections, scans, SYN floods|
|Port B unusual (4444, 1337, 8080, 31337, 6667, high random)|Possible C2/backdoor. Verify with content|
|Internal ↔ internal on SMB/RDP/WinRM when not normal|Lateral movement|
|Same B across many internal A|A shared external service (could be C2 if rare) or an internal server|

**Always do:** check **IPv4 tab** for host pairs, **TCP tab** for sessions + ports, **UDP tab** for DNS/NTP/QUIC/odd UDP. Sort each by Bytes, Packets, Duration, Rel Start.

## 5.5 Endpoints

Like Conversations, but per _single address_ instead of per pair: Packets, Bytes, **Tx packets/bytes, Rx packets/bytes**, Country/City/AS (if GeoIP databases are configured). **Why:** Find **top talkers**, who is mostly a sender (clients/exfil) vs receiver (servers). Geo/AS columns reveal unexpected countries or hosting providers (needs MaxMind DBs under Preferences → Name Resolution → GeoIP; optional).

- With `dns.flags.response==0` applied and _limit to display filter_, Endpoints Tx packets = DNS queries per client (the method used earlier).

## 5.6 Packet Lengths

Histogram of frame sizes in buckets. **Why:** _Uniform_ sizes imply automation (beacons, keep-alive, tunnels). A spike at the MTU (1514) means bulk. Lots of exactly-same-size tiny packets suggests a heartbeat. Many packets of one unusual size can be a covert channel or a protocol fingerprint.

## 5.7 I/O Graphs (Statistics → I/O Graphs)

Plots packets/bytes/bits (or any numeric field) over time, with **custom filters per line**, intervals from 1 ms to 10 min, and axis log scale. **How to use:**

- Overall activity, then add lines: `dns`, `http`, `tls`, `tcp.analysis.retransmission`, `ip.addr==X`.
- **Spikes** = scans, floods, large transfers, backups, infection events.
- **Regular comb-like pattern** at a fixed period = beaconing (set interval to match: e.g. 1s or 10s).
- **Sudden drop to zero** = outage or capture stopped.
- Use **Advanced** to graph functions: `SUM(frame.len)`, `COUNT FRAMES`, `AVG(tcp.analysis.ack_rtt)`, `MAX(tcp.window_size)`.
- Graph one host's bytes in vs out (two lines with `ip.src==X` and `ip.dst==X`) to see exfil shape: long steady upload or one big burst.
- Click on a point to jump to the packet.

## 5.8 Flow Graph (Statistics → Flow Graph)

A **sequence diagram** of packets between hosts over time (arrows with flags/Info). Options: all packets / displayed only; flow type General / TCP / ICMP / ICMPv6 / UDP Multicast / etc.; limit to displayed. **Why:** Visualise the exact choreography of a handshake, retransmission pattern, redirect chain, DNS→TCP→HTTP sequence, or scan response pattern. Ideal for reporting.

## 5.9 Service Response Time (SRT)

Measures request→response latency for protocols that support it: **DCE-RPC, SMB/SMB2, LDAP, DNS (in DNS stats), NFS/ONC-RPC, Diameter, FC, H.225, RADIUS, etc.** Shows min/max/avg per command. **Why:** Separates **server think time** from **network delay**, which is core to performance troubleshooting (e.g. slow SMB `Create`/`Read`, slow LDAP search).

## 5.10 DNS statistics (Statistics → DNS)

Counts of query types, response codes, rcodes, opcodes, top query names and service response time, **unsolicited/unanswered** stats. **Why:** Fast summary of DNS behaviour without scripting: many NXDOMAIN (rcode 3), many TXT/NULL, high query rate.

## 5.11 HTTP statistics (Statistics → HTTP)

- **Packet Counter:** requests vs responses, by status code class (2xx/3xx/4xx/5xx).
- **Requests:** per host and URI tree (what was requested where).
- **Load Distribution:** per server.
- **Request Sequences:** order of requests (referrer chains). **Why:** Spot scanners (hundreds of 404), brute-forcers (many 401/403), or errors (5xx). See which hosts got hit and the URL tree structure.

## 5.12 HTTP/2, QUIC, and others

Per-protocol stats exist for HTTP/2, Sametime, SIP (telephony), RTP, DHCP (BOOTP) etc.

## 5.13 DHCP (BOOTP) statistics

Count of DHCP message types: Discover, Offer, Request, ACK, NAK, Release, Inform. **Why:** A pile of Discovers with no Offers means no DHCP server. Offers from multiple servers can indicate a **rogue DHCP server**. NAKs mean lease problems.

## 5.14 IPv4 Statistics / IPv6 Statistics

- **All Addresses**: counts per IP with rate and burst rate.
- **Destinations and Ports**: for each destination, ports used (scan view).
- **IP Protocol Types**: TCP/UDP/ICMP/GRE/ESP/etc. (unusual protocols like GRE or IP-in-IP = tunnelling/VPN).
- **Source and Destination Addresses**: pair table with burst rates. **Why:** Another route to scanning, odd protocol numbers, and burst detection (high burst rate = flood/scan).

## 5.15 TCP Stream Graphs (Statistics → TCP Stream Graphs) for a selected packet's stream

Select a TCP packet first (direction matters, it graphs from that packet's sender).

|Graph|Shows|Use|
|---|---|---|
|**Time Sequence (Stevens)**|Sequence number vs time|Straight rising line = healthy. Flat sections = stalls. Jagged/steps = loss/retransmission|
|**Time Sequence (tcptrace)**|Sequence, ACK line, window, SACK|Gap between ACK line and window line = receive window limit. Detailed loss analysis|
|**Throughput**|Instant and moving average bytes/sec|Real transfer speed over time|
|**Round Trip Time**|RTT per segment|Latency spikes, bufferbloat|
|**Window Scaling**|Receive window and bytes in flight|Is the receiver window the bottleneck?|
|**Why:** the main tool for explaining _why_ a transfer is slow (loss vs window vs latency vs app).|||

## 5.16 Others worth knowing

- **UDP Multicast Streams**, **SCTP**, **Bluetooth**, **WLAN Traffic** (Wireless → WLAN Traffic: SSIDs, BSSIDs, stations, probe requests).
- **Telephony → VoIP Calls, RTP Streams, RTP Player, SIP Flows:** reconstruct calls, jitter, packet loss, and _play back audio_.
- **Tools → Firewall ACL Rules:** generate iptables/Cisco rules from a packet.
- **Tools → Credentials**, **Tools → Lua**.

---

# Part 6: Expert Information and TCP analysis logic

## 6.1 Expert Information (Analyze → Expert Information)

Groups anomalies by severity: **Error (red), Warning (yellow), Note (cyan), Chat (blue)**, then by group (Sequence, Checksum, Malformed, Protocol, Response code, Security, Comment...). **Reading approach:**

1. Look at **Errors** first (malformed, bad checksums, protocol violations). Then **Warnings** (retransmissions, zero window, connection reset, "ACKed unseen segment").
2. **Count and spread matter.** 3 retransmissions in 1M packets is nothing. 30% retransmissions is a network problem. Many `Connection reset (RST)` from one host = scanning/IDS.
3. Click an item to see the packet list. Use as a **triage index of weirdness**.
4. Notes like _"This frame is a (suspected) retransmission"_, _"TCP port numbers reused"_, _"Connection establish request (SYN): server port X"_ (listing every SYN = a connection map).
5. **Chat** group includes _Connection finish (FIN)_, _Connection establish acknowledge (SYN+ACK)_, _HTTP Request/Response_ and other lifecycle events. **Security-relevant expert items:** malformed packets (exploits/fuzzing), "Unknown/obsolete protocol version", "Possible overlapping fragments", "TLS: unsupported/old version", "Cleartext password" (Security group in some dissectors).

## 6.2 TCP troubleshooting logic (a diagnostic decision tree)

**Step 1: Does the connection even establish?**

- SYN, no response → host down, firewall DROP, routing issue, wrong IP.
- SYN → RST,ACK → port closed (service not running, or firewall REJECT).
- SYN → SYN,ACK → fine. Then check the final ACK arrives (if not, it's a half-open/SYN flood style or asymmetric path).
- SYN → SYN,ACK → then immediate RST from client = scanner (SYN scan) or app rejected.

**Step 2: How long did the handshake take?** (`tcp.analysis.initial_rtt`) → that's your **network RTT** baseline. If RTT=20 ms and a request takes 3 s to get a response, the delay is in the **server**, not the network.

**Step 3: After the request, where's the delay?**

|Delay between|Culprit|
|---|---|
|Client ACK of data **→** server's first data|Server application processing time (slow DB/app)|
|Request sent **→** ACK from server (fast) **→** response (slow)|Server app slow. Network fine|
|Request sent **→** no ACK, retransmissions|Network loss or firewall/path issue|
|Response data trickles, small segments|Nagle/delayed-ACK interaction, small window, slow receiver|
|Zero window messages|Client app not reading|
|Long pauses then `Keep-Alive`|Idle connection|

**Step 4: Loss and reordering.** Retransmissions + duplicate ACKs. Where do they appear (before/after a device)? Capture on both sides of a suspected device and compare: loss appears where it first occurs.

**Step 5: MTU/MSS issues.** Large packets disappear while small ones work; symptoms: handshake works, data stalls. Look for ICMP "fragmentation needed" (type 3 code 4), DF bit set, MSS in SYN (1460 typical; 1380/1360 on VPN/PPPoE) and PMTU black holes.

**Step 6: Window/throughput.** If `bytes in flight` ≈ receive window, window limits throughput (check window scaling in SYN: missing `WS` option caps at 64 KB → low throughput on high-latency paths). Throughput max ≈ window / RTT.

**Step 7: How it ended.** Graceful FIN vs RST; who sent the RST (client/server/middlebox? check TTL and IP ID of the RST: a differing TTL from the rest of that host's packets suggests injection by a middlebox/IPS).

## 6.3 Recognising TCP behaviours in security context

|On the wire|Interpretation|
|---|---|
|SYN to many ports, single source|Port scan (vertical)|
|SYN to one port, many hosts|Sweep (horizontal)|
|SYN → SYN,ACK → RST (from scanner)|Nmap SYN ("half-open") scan. The full connect scan completes ACK then RST/FIN|
|RST,ACK replies to many different ports|Closed-port answers to a scan|
|FIN-only / NULL / XMAS packets|Stealth scans (RFC 793 behaviour reveals open/closed on some stacks)|
|Many SYN, few completions, spoofed sources|SYN flood|
|Fixed small window (e.g. 1024) and odd TCP options ordering on SYNs|Scanner/crafted-packet fingerprints (Nmap/masscan/zmap use recognisable constants. Compare against a normal OS SYN)|
|Repeated connections from the same source port|Crafted/scanner traffic. Normal OSes randomise ephemeral ports|
|Very high ephemeral port reuse|Tooling|
|Connection stays open for hours with sparse small packets|Possible reverse shell, tunnels, or legitimate long-lived session|

---

# Part 7: Protocol deep dives

For each protocol: **what it is, how it normally looks, what to look for, key filters, attacker abuse.**

## 7.1 Ethernet and ARP (Layer 2)

**ARP** maps IP → MAC on the local segment. Request is broadcast ("Who has 10.0.0.1? Tell 10.0.0.5"), reply is unicast. It is **unauthenticated**, which is why spoofing works.

Normal: each host ARPs for its gateway and a few neighbours. Occasional gratuitous ARP at boot/IP change.

Look for:

- **ARP spoofing/poisoning (MITM):** one MAC claiming _multiple IPs_ (especially the gateway's), repeated unsolicited ARP replies, two different MACs for the same IP.
- **ARP scan/sweep:** one host asking for sequential IPs (`10.0.0.1, .2, .3, ...`). It is the local-network equivalent of a ping sweep.
- **Duplicate IP:** `arp.duplicate-address-detected`.

```
arp
arp.opcode == 1                          # request
arp.opcode == 2                          # reply
arp.isgratuitous
arp.duplicate-address-detected || arp.duplicate-address-frame
arp.opcode == 2 && arp.src.proto_ipv4 == <gateway-ip>      # replies claiming to be gateway; check which MAC
eth.src == <mac>                          # trace one device
```

Method: build a **MAC↔IP table** (Statistics → Endpoints → Ethernet vs IPv4, or `tshark -Y arp -T fields -e arp.src.hw_mac -e arp.src.proto_ipv4 | sort -u`). Any MAC mapping to more than one IP, or an IP to more than one MAC, deserves investigation. Remember legitimate cases (routers doing proxy ARP, VRRP/HSRP virtual MACs, NIC teaming, VMs).

Other L2: **STP** (BPDU: rogue root bridge attacks), **LLDP/CDP** (leak device model, port, VLAN, management IP, useful for mapping), **VLAN hopping** (double 802.1Q tags), **MAC flooding** (huge number of source MACs), **DTP/VTP**.

## 7.2 IPv4/IPv6 and ICMP

### ICMP types (know these)

|Type|Code|Meaning|Analysis|
|---|---|---|---|
|0|0|Echo reply|Ping answer|
|3|0/1|Net/host unreachable|Routing/host down|
|3|3|**Port unreachable**|UDP port closed (UDP scan reply)|
|3|4|**Fragmentation needed & DF set**|MTU/PMTUD issue|
|3|9/10/13|Prohibited|Firewall rejecting|
|5|*|Redirect|MITM/redirect attacks|
|8|0|Echo request|Ping, ping sweep|
|11|0|TTL exceeded in transit|**Traceroute**|
|13/14||Timestamp request/reply|Recon/fingerprinting|
|17/18||Address mask|Obsolete recon|

```
icmp
icmp.type == 8 || icmp.type == 0
icmp.type == 3 && icmp.code == 3
icmp.type == 11
icmp.type == 5
icmp && frame.len > 150                   # unusually large ICMP → tunnel
icmp.data_len > 64
```

**ICMP tunnelling:** payload carries data (tools like `ptunnel`, `icmpsh`). Signs: ICMP echo with large/variable payload, payload not the standard pattern (Linux ping: incrementing bytes; Windows: `abcdefghijklmnop...`), steady bidirectional echo stream with data both ways, high rate. **Ping sweep:** one source → many dest IPs, echo requests, replies from live hosts. **Smurf:** echo to broadcast with spoofed source. **Ping of death:** oversized fragmented ICMP.

### ICMPv6 / IPv6 specifics

```
icmpv6.type == 133   # Router Solicitation
icmpv6.type == 134   # Router Advertisement  (who is sending RAs? rogue RA / mitm6)
icmpv6.type == 135   # Neighbor Solicitation (IPv6's ARP)
icmpv6.type == 136   # Neighbor Advertisement
ipv6.addr == fe80::/10
dhcpv6                # mitm6 attack uses rogue DHCPv6 + RA to become DNS server on Windows nets
```

Windows prefers IPv6 and queries DHCPv6 even in IPv4-only nets, so DHCPv6 replies from a non-infrastructure host are suspicious.

### Fragmentation

Evasion: tiny fragments, overlapping fragments (different reassembly on IDS vs host). Wireshark Expert flags _"Possible overlapping"_ items. Filter `ip.flags.mf == 1 || ip.frag_offset > 0`.

### TTL analysis

Group by `ip.src` and `ip.ttl`. A host's TTL should be consistent (±path changes). Mixed TTL values for one source IP can mean a **NAT** hiding multiple hosts, **spoofing**, or an inline device injecting packets.

## 7.3 UDP-based infrastructure protocols

### DHCP (UDP 67/68), "who is on the network"

Sequence: **Discover → Offer → Request → ACK** (DORA). Also Release, Inform, NAK. Rich metadata: client MAC, **hostname (opt 12)**, requested IP (opt 50), vendor class (opt 60, e.g. `MSFT 5.0`, `android-dhcp-`), parameter request list (opt 55, an OS fingerprint), client FQDN (opt 81), lease time, **DHCP server ID (opt 54)**, DNS server and router options.

```
dhcp
dhcp.option.dhcp == 5                       # ACKs (Wireshark 3+/4: message-type field)
dhcp.option.hostname
dhcp.option.vendor_class_id contains "MSFT"
dhcp.option.dhcp_server_id != <real-server>  # rogue server check
```

Use: map IP↔MAC↔hostname for every host (this is your "asset inventory"). Look for: multiple servers offering (rogue DHCP/MITM giving attacker as gateway/DNS), DHCP starvation (flood of Discover with random MACs), odd hostnames (`kali`, `DESKTOP-xxxx` default names, `pwn`).

### NTP (UDP 123)

Normal: clients sync to a few servers. Abuse: **amplification** (monlist), tunnelling. `ntp`. `ntp.mode`.

### SNMP (UDP 161/162)

v1/v2c send **community strings in cleartext** (`public`, `private`). `snmp.community`. Attackers walk MIBs to map the network. v3 supports auth/encryption.

### Syslog (UDP 514), TFTP (UDP 69; files in cleartext, exportable), SSDP (UDP 1900, discovery noise, DDoS reflection), mDNS (5353), LLMNR (5355), NBNS (137), WS-Discovery (3702).

### Local name resolution protocols (critical on Windows nets)

When DNS fails, Windows falls back to **LLMNR** (multicast `224.0.0.252`/`ff02::1:3`, UDP 5355) then **NBT-NS** (broadcast, UDP 137). An attacker (e.g. **Responder**) answers _every_ query claiming to be the host, so the victim authenticates (NTLM) to the attacker, who captures the NTLMv2 challenge-response.

```
llmnr
nbns
mdns
llmnr && dns.qry.name           # LLMNR reuses the DNS dissector fields, so add dns.qry.name as a column
```

Detect poisoning: LLMNR/NBNS **queries** from a client followed by **responses from a host that isn't the named host** (or from the same single host to many different queries), followed by SMB/HTTP NTLM authentication to that host. Misspelt share names (`\\fileservr`) trigger these queries. Enterprises should have LLMNR/NBT-NS disabled, so any is notable.

## 7.4 DNS (deep)

### How it works

Client → recursive resolver (UDP/TCP 53) → authoritative servers. Query has **QNAME, QTYPE, QCLASS**; response adds **answers, authority, additional**, flags (QR, AA, TC, RD, RA), **RCODE**, **TTL**, and a **Transaction ID**.

|QTYPE|Value|Notes|
|---|---|---|
|A / AAAA|1 / 28|IPv4 / IPv6 address|
|NS|2|nameservers|
|CNAME|5|alias|
|SOA|6|zone authority|
|PTR|12|reverse lookup|
|MX|15|mail|
|TXT|16|arbitrary text (SPF, DKIM, **common tunnelling/C2 channel**)|
|SRV|33|service location (AD uses `_ldap._tcp.dc._msdcs...`)|
|NULL|10|arbitrary data (tunnel tools)|
|ANY|255|amplification/recon|
|AXFR / IXFR|252 / 251|zone transfer (recon)|
|HTTPS/SVCB|65 / 64|service binding (ECH keys!)|

|RCODE|Meaning|Interpretation|
|---|---|---|
|0 NOERROR|OK (may still have zero answers = NODATA)||
|2 SERVFAIL|Resolver failure|DNSSEC problem, upstream outage|
|**3 NXDOMAIN**|Name does not exist|**DGA malware, typos, sinkholed/expired C2**|
|5 REFUSED|Server refuses|Closed resolver, zone transfer blocked|

### Normal expectations

Few query types (A/AAAA mostly, some HTTPS/PTR/SRV/MX), reasonable name lengths, repeat lookups governed by TTL, recognizable popular domains, mostly NOERROR.

### What to look for (and why)

1. **Volume per host**: outliers vs peers. (Endpoints stats with DNS filter, or tshark counts.)
2. **Unique names per second-level domain**: normal = a handful. Hundreds/thousands of unique subdomains under one domain = **tunnelling/exfil** (data encoded in labels, e.g. `4a6f686e.exfil.example.com`).
3. **Label/name length and entropy**: `dns.qry.name.len > 50` or labels near the 63-byte maximum. Base32/hex/base64-like labels. High-entropy random names = **DGA**.
4. **Record types**: TXT/NULL/CNAME-heavy conversations with a single domain.
5. **NXDOMAIN storms**: a host cycling through random names (DGA looking for the live C2).
6. **Beaconing**: same name queried at fixed intervals (note TTL: honouring TTL gives interval ≈ TTL, malware with short TTL records beacon accordingly). `frame.time_delta_displayed` after filtering one name.
7. **Fast flux / low TTL, many A records, rotating IPs** for one name.
8. **Answers that don't match expectation**: a well-known domain resolving to a private/unrelated IP (**DNS spoofing/poisoning**, split-horizon, or captive portal). Compare answer IP across clients.
9. **Responses without matching queries** (`dns.flags.response == 1 && !dns.response_to`): unsolicited responses = spoofing/amplification. Conversely, queries that never got an answer: `dns.flags.response == 0 && !dns.response_in`.
10. **Queries to unusual resolvers** (not the corporate DNS server): hardcoded 8.8.8.8/1.1.1.1 by malware or user. Count `ip.dst` of DNS queries.
11. **DoH/DoT bypass**: port 853 (DoT), HTTPS to known DoH providers (SNI `dns.google`, `cloudflare-dns.com`, `mozilla.cloudflare-dns.com`), `application/dns-message` content-type if decrypted. These hide DNS from this analysis.
12. **Reverse lookups (PTR)** sweeping sequential addresses = recon.
13. **Zone transfer (AXFR/IXFR) over TCP/53**: recon, `dns.qry.type == 252`.
14. **Large responses** (`dns.length`/`udp.length > 512` or EDNS0 large) and ANY queries: amplification. Spoofed-source queries cause a flood of responses to the victim.
15. **Suspicious TLDs / newly registered domains / dynamic DNS** (`.top`, `.xyz`, `.tk`, `duckdns.org`, `no-ip`): need threat-intel but are leads.
16. **Typosquats/lookalikes** (`micr0soft.com`, `rnicrosoft.com`).
17. **Internal names exposed** externally; AD discovery via SRV queries `_ldap._tcp`, `_kerberos._tcp` (normal for domain clients, recon from non-domain hosts).

### Filters

```
dns
dns.flags.response == 0                        # queries only (use for counting)
dns.flags.response == 1                        # responses
dns.flags.rcode == 3                           # NXDOMAIN
dns.flags.rcode != 0
dns.qry.type == 16                             # TXT
dns.qry.type == 10 || dns.qry.type == 255 || dns.qry.type == 252
dns.qry.name contains "example.com"
dns.qry.name.len > 50
dns.count.answers == 0 && dns.flags.response == 1       # empty answers (NODATA/NXDOMAIN)
dns.a == 1.2.3.4                               # who resolved to this IP
dns.resp.ttl < 60                              # low TTL (fast flux / C2)
dns.flags.truncated == 1                       # TC bit → client retries over TCP
dns.retransmission                             # repeated queries
dns.time > 1                                   # slow responses (seconds)
tcp.port == 53                                 # zone transfers or large answers
!(udp.port == 53 || tcp.port == 53) && dns     # DNS on non-standard port
(udp.port == 53 || tcp.port == 53) && !dns     # non-DNS on port 53 (tunnel without DNS format)
mdns || llmnr || nbns
```

### Quantification commands

```bash
tshark -r f.pcap -Y 'dns.flags.response==0' -T fields -e ip.src -e dns.qry.name | sort | uniq -c | sort -rn | head -50
tshark -r f.pcap -Y 'dns.flags.response==0' -T fields -e dns.qry.name | awk -F. '{n=NF; print $(n-1)"."$n}' | sort | uniq -c | sort -rn | head      # per parent domain (use public suffix list for co.uk etc.)
tshark -r f.pcap -Y 'dns.flags.response==0' -T fields -e dns.qry.name | awk '{print length($0), $0}' | sort -rn | head           # longest names
tshark -r f.pcap -Y 'dns.flags.rcode==3' -T fields -e ip.src -e dns.qry.name | sort | uniq -c | sort -rn | head
tshark -r f.pcap -Y 'dns.flags.response==1 && dns.a' -T fields -e dns.qry.name -e dns.a | sort -u
tshark -r f.pcap -Y 'dns.qry.type==16' -T fields -e ip.src -e dns.qry.name | sort | uniq -c | sort -rn
tshark -r f.pcap -Y 'dns' -T fields -e dns.txt                 # TXT payload content: decode base64/hex
```

**Decoding exfil:** extract the labels, strip the parent domain, concatenate in order (by frame/time), and try base64/base32/hex decode (CyberChef). Check for sequence/chunk markers in the first label.

**Interpretation discipline:** CDNs and security products generate long random subdomains legitimately (e.g. antivirus cloud lookups, `*.cloudfront.net`, tracking). Judge by _volume, uniqueness, entropy, and whether the parent domain is known_.

## 7.5 HTTP/1.1 (and HTTP/2 notes)

### Structure

```
GET /path?x=1 HTTP/1.1
Host: example.com
User-Agent: ...
Cookie: ...
Authorization: Basic base64(user:pass)

HTTP/1.1 200 OK
Server: ...
Content-Type: text/html
Content-Length: 1234
Set-Cookie: ...
Location: ...      (3xx redirects)

<body>
```

### What to examine

- **Host + URI + method + status + response size + content type** for every request: the web "access log" reconstructed from the wire. In columns: `http.host`, `http.request.uri`, `http.response.code`.
- **User-Agent**: default scripting/tool UAs (`curl/`, `python-requests/`, `Go-http-client/`, `Wget/`, `sqlmap`, `Nikto`, `Nmap Scripting Engine`, `masscan`, `gobuster`, `feroxbuster`, `WinHTTP`, empty UA, ancient browser strings, or UA with typos/mismatch to OS). Malware often hard-codes unusual or stale UAs. Group by UA per host.
- **Methods**: POST/PUT with large bodies (upload/exfil), `CONNECT` (proxying/tunnelling), `PROPFIND`/`OPTIONS` (WebDAV), `TRACE`.
- **Status codes**: bursts of 404 (directory brute force), 401/403 (auth brute force), 500 (injection errors), 301/302 chains (redirects, drive-by, phishing kits), 200 with strangely small/identical sizes (C2 beacons).
- **Content types & downloads**: `application/x-msdownload`, `application/octet-stream`, `application/zip`, `application/vnd.ms-office`, `.exe`, `.dll`, `.ps1`, `.js`, `.hta`, `.iso`, `.lnk`; then check _magic bytes_: an "image/jpeg" whose body starts with `MZ` is deception.
- **Headers**: `X-Forwarded-For`, `Referer` (traffic origin, phishing), `Cookie`/`Set-Cookie` (session tokens, sometimes carrying C2 data), custom headers (C2 frameworks), `Authorization`.
- **Request pattern**: identical URI repeated at fixed interval (beacon), randomised-looking URIs, base64 in query/body/cookies, long query strings.
- **Credentials**: HTTP Basic (`Authorization: Basic ...` → base64 decode), form POSTs to login pages (`password=`), tokens in URLs.

### Filters

```
http.request
http.request.method == "POST"
http.request.method in {"PUT" "DELETE" "CONNECT" "TRACE" "PROPFIND"}
http.response.code >= 400
http.response.code == 401 || http.response.code == 403
http.request.uri contains ".php" && http.request.method == "POST"
http.request.uri contains ".exe" || contains ".dll" || contains ".ps1" || contains ".zip"
http.host contains "pastebin" || http.host contains "transfer.sh"
http.user_agent contains "python" || http.user_agent contains "curl" || http.user_agent contains "sqlmap"
!http.user_agent                       # request without UA
http.content_type contains "octet-stream"
http.content_length > 1000000
http.authorization
http.cookie contains "session"
http.referer
http.location                         # redirect target
http.file_data contains "password"
http.request.full_uri
http.response_for.uri                 # map response → request
http.time > 5                         # slow server response
http2 / http3 (quic)
```

### Web attack signatures (in clear HTTP, or after TLS decryption)

|Attack|Look for|
|---|---|
|**SQL injection**|`'`, `%27`, `UNION SELECT`, `OR 1=1`, `--`, `sleep(`, `benchmark(`, `information_schema`, `xp_cmdshell`; error responses with SQL messages; time delays|
|**XSS**|`<script>`, `%3Cscript`, `onerror=`, `javascript:` in params|
|**LFI/path traversal**|`../`, `..%2f`, `%2e%2e/`, `/etc/passwd`, `C:\windows\win.ini`, `php://filter`|
|**RFI/SSRF**|URL params pointing to external or internal (169.254.169.254 metadata) URLs|
|**Command injection**|`;`, `|
|**Webshell**|POST to an unusual `.php/.aspx/.jsp` file; params like `cmd=`, `c=`, `exec=`; responses with command output (`uid=33(www-data)`), repeated requests to one file from one IP; `eval(`/base64 parameters|
|**Directory brute-forcing**|Hundreds of sequential 404s from one source with wordlist-like paths, fast rate|
|**Auth brute force**|Repeated POST to login with changing creds; 401/403/200 length changes mark success|
|**Log4Shell / JNDI**|`${jndi:ldap://` in any header/URI/body (case/obfuscation variants `${${lower:j}ndi:`)|
|**Shellshock**|`() { :;};` in headers|
|**Scanner usage**|UA `Nikto`, `sqlmap`, `Acunetix`, `Nessus`, paths like `/phpmyadmin/`, `/.git/`, `/wp-login.php`, `/admin`, `/server-status`|
|**File upload abuse**|multipart POST with `.php`/`.jsp` filename, `Content-Type: image/..` with PHP code|

Wireshark does not URL-decode URIs in filters, so also search the encoded forms (`%27`, `%20OR%20`, `%2e%2e`). In bulk, export URIs with tshark and decode with `python3 -c 'import sys,urllib.parse as u;[print(u.unquote(l.strip())) for l in sys.stdin]'`.

### HTTP/2 and HTTP/3

HTTP/2: binary framing, multiplexed streams over one TLS connection. In Wireshark when decrypted, filter `http2`, `http2.header.name == ":path"`, `http2.streamid`. Follow → HTTP/2 stream. **HTTP/3** runs over **QUIC (UDP/443)**, encrypted from the first flight, so you need keys for content (Part 8).

### HTTP-based C2 patterns

Fixed beacon interval (± jitter), consistent small GET/POST, same URI structure (`/api/v1/...`, `/jquery-3.3.1.min.js`-lookalikes), cookie or header-embedded blobs, uniform response sizes (tasking returns "no task" sized response), custom headers, domain fronting (SNI/Host mismatch), uncommon ports (8080, 8443). Frameworks commonly configurable ("malleable"), so rely on behaviour not fixed strings.

## 7.6 TLS/HTTPS (summary here, full in Part 8)

Look at metadata even if encrypted: SNI, JA3/JA4, certificate subject/issuer/validity/self-signed, TLS version/cipher suites, ALPN, handshake timing, session sizes, connection durations.

## 7.7 FTP, Telnet, rlogin, TFTP (cleartext legacy)

**FTP (21 control, 20 or dynamic data):** commands in cleartext.

```
ftp
ftp.request.command == "USER" || ftp.request.command == "PASS"
ftp.request.command in {"STOR" "RETR" "LIST" "CWD"}
ftp.response.code == 530            # login failed (brute force)
ftp.response.code == 230            # login success
ftp-data                            # file transfer connections
```

Passive mode: server tells client a port in reply `227 Entering Passive Mode (a,b,c,d,p1,p2)` where port = p1*256+p2; the data connection is separate (Wireshark links it automatically). STOR = upload (exfil), RETR = download. Anonymous FTP (`USER anonymous`). Files can be exported via Follow TCP stream on the data connection.

**Telnet (23):** keystrokes sent individually, often one character per packet in the clear, including passwords. Follow TCP Stream to read the session. Telnet to IoT devices is the Mirai-style infection vector. `telnet`.

**TFTP (69/UDP):** unauthenticated file transfer, used for device configs/firmware. `tftp`, Export Objects → TFTP.

## 7.8 Email: SMTP, POP3, IMAP

```
smtp, pop, imap
smtp.req.command == "MAIL" or "RCPT" or "DATA" or "AUTH"
smtp contains "AUTH LOGIN"            # credentials base64 (username then password on separate lines)
imap.request contains "LOGIN"
pop.request.command == "PASS"
imf                                   # Internet Message Format → email content; Export Objects → IMF
```

Look for: unencrypted credentials, mass sending from a workstation (spam bot: many RCPT/MAIL FROM to external MX), outbound SMTP (25) from non-mail servers, open-relay tests, **attachments** (base64 MIME parts: `Content-Disposition: attachment`; export via IMF, or decode base64 body), phishing headers (From/Reply-To/Return-Path mismatch, SPF/DKIM results in `Received-SPF`, `Authentication-Results`). STARTTLS upgrade (`STARTTLS` command then TLS) hides the rest.

## 7.9 SSH (22)

Encrypted after key exchange, but you can see: the **banner** (`SSH-2.0-OpenSSH_8.9`, client/server software and version, tooling like `libssh`, `paramiko`, `Go`, `PuTTY`), key exchange algorithms, session duration, bytes, packet size patterns. HASSH is a fingerprint of SSH client/server algorithm lists.

```
ssh
ssh.protocol                          # banners
ssh.kex.algorithms
```

Interpretation: many short SSH connections from one source = **brute force** (count per source: each attempt is a separate TCP conversation or several auth attempts per session; identical bytes/duration); a successful login typically has long duration and bytes. SSH tunnelling (port forwarding, SOCKS) looks like a long-lived session with bursts. Interactive typing shows many small packets with human timing (keystroke timing analysis), SCP/SFTP shows steady bulk.

## 7.10 SMB / CIFS (445), NetBIOS (139), and the Windows ecosystem

### SMB essentials

SMB2/3 over TCP 445. Sequence: Negotiate → Session Setup (NTLM or Kerberos auth) → Tree Connect (share) → Create/Open → Read/Write → Close → Tree Disconnect → Logoff. Key fields/filters:

```
smb || smb2
smb2.cmd == 0      # Negotiate
smb2.cmd == 1      # Session Setup
smb2.cmd == 3      # Tree Connect
smb2.cmd == 5      # Create (open file)
smb2.cmd == 8      # Read
smb2.cmd == 9      # Write
smb2.cmd == 6      # Close
smb2.cmd == 14     # Find (directory listing)
smb2.filename
smb2.tree                        # share path e.g. \\10.0.0.5\C$
smb2.nt_status != 0              # errors (STATUS_ACCESS_DENIED 0xc0000022, STATUS_LOGON_FAILURE 0xc000006d, STATUS_OBJECT_NAME_NOT_FOUND ...)
ntlmssp
ntlmssp.messagetype == 0x00000003        # NTLM Authenticate message (contains user/domain/host)
ntlmssp.auth.username
ntlmssp.auth.domain
ntlmssp.auth.hostname
smb2.sesid
dcerpc
```

Look for:

- **Admin shares** `\\host\ADMIN$`, `C$`, `IPC$`: lateral movement. **PsExec-style:** SMB write of an `.exe` into `ADMIN$` (e.g. `PSEXESVC.exe`), then `svcctl` (Service Control Manager over DCE/RPC via `\pipe\svcctl`) CreateService/StartService. **Named pipes** to watch: `\pipe\svcctl`, `atsvc`, `samr`, `lsarpc`, `srvsvc`, `winreg`, `spoolss`, `netlogon`, `drsuapi`, `epmapper`, `PSEXESVC`.
- **Workstation→workstation SMB** (rare in healthy enterprise networks).
- **Mass file reads** or mass renames/writes in short time (ransomware, data staging, `smb2.cmd == 5` with many distinct filenames). Rename extension patterns (`.locked`, `.encrypted`) in `smb2.filename`.
- **Authentication failures** (`STATUS_LOGON_FAILURE`) from one source across many accounts/hosts = password spraying/brute force; success after failures = compromise.
- **NTLM relay**: a host authenticating to an unexpected machine, which then authenticates onward with the same identity.
- **Anonymous/null session** access (`IPC$` with no creds) for enumeration (users, shares: `srvsvc`, `samr` calls).
- **Old SMBv1** (`smb` rather than `smb2`) = EternalBlue exploitation risk. Look for Trans2 anomalies, large crafted transactions, followed by shell connections.
- **File extraction:** File → Export Objects → SMB.

### NTLM authentication analysis

Type 1 Negotiate → Type 2 Challenge (server 8-byte challenge) → Type 3 Authenticate (username, domain, workstation, NT response). From a pcap you can reconstruct a crackable **NetNTLMv2** hash: `username::domain:ServerChallenge:NTProofStr:rest-of-NTLMv2-response`. Fields: `ntlmssp.ntlmserverchallenge`, `ntlmssp.ntlmv2_response.ntproofstr`, the response blob. Crack offline (hashcat mode **5600**) in authorised/CTF contexts. Key insight: **sniffed NTLM challenge-responses are credential material**, so pcaps containing them are sensitive.

### Kerberos (UDP/TCP 88)

```
kerberos
kerberos.msg_type == 10       # AS-REQ
kerberos.msg_type == 11       # AS-REP
kerberos.msg_type == 12       # TGS-REQ
kerberos.msg_type == 13       # TGS-REP
kerberos.msg_type == 30       # KRB-ERROR
kerberos.CNameString          # client principal (user/host$)
kerberos.SNameString          # service principal (krbtgt, cifs/host, host/..., ldap/...)
kerberos.realm
kerberos.etype == 23          # RC4-HMAC (weak; Kerberoasting prefers it)
kerberos.error_code           # 24 = pre-auth failed (bad password), 6 = client unknown, 25 = pre-auth required
```

Detections:

- **AS-REQ without pre-auth → AS-REP** for a user (AS-REP roasting; look for `kerberos.padata` absent and AS-REP returned with encrypted part).
- **Kerberoasting:** a single account issuing many TGS-REQs for _different service accounts' SPNs_ with **etype 23 (RC4)** in a short time, from a user who normally doesn't.
- **Brute force/spray:** many KRB-ERROR 24 (pre-auth failed) across usernames/hosts, or error 6 (unknown user) for username enumeration.
- **Golden/silver ticket anomalies:** TGS without preceding AS/TGT exchange visible, unusual lifetimes, RC4 for accounts that normally use AES.
- **Usernames and realm** leak from CNameString. Gives you the AD user inventory.
- Clock skew errors (`KRB_AP_ERR_SKEW` 37).

### LDAP (389/636/3268) and DCE/RPC

```
ldap
ldap.protocolOp == 3            # searchRequest
ldap.baseObject
ldap.filter contains "..."
ldap.bindRequest_element / ldap.simple   # simple bind: password in cleartext (LDAP not LDAPS)
dcerpc
dcerpc.cn_bind_to_uuid          # which RPC interface is being used
drsuapi                         # directory replication
```

- **LDAP recon (BloodHound/SharpHound/ldapdomaindump):** a burst of many LDAP searches from a workstation: `(objectClass=*)`, `(servicePrincipalName=*)`, `(sAMAccountType=805306368)` etc., pulling users/groups/computers/ACLs.
- **DCSync:** a _non-domain-controller_ calling `DRSUAPI` `DRSGetNCChanges` (opnum 3) to a DC (interface UUID `e3514235-4b06-11d1-ab04-00c04fc2dcd2`) = credential theft. Filter `drsuapi` and check source against the real DC list.
- **LDAP simple bind over 389** = credentials in cleartext.
- **Remote service creation, scheduled tasks** via DCE/RPC (`svcctl`, `atsvc`, `ITaskSchedulerService`), **WMI** (DCOM, RPC dynamic ports 49152+, `IWbemServices`), **WinRM** (TCP 5985/5986, HTTP/HTTPS SOAP; `http.request.uri == "/wsman"`), **RDP** (3389; `rdp`, `tpkt`, X.224 cookie `mstshash=<username>` often reveals the username in the first client packet, brute-force tools like Hydra/Crowbar produce many short RDP sessions).

### Lateral movement matrix (what each tool looks like on the wire)

|Technique|Ports|Wire clues|
|---|---|---|
|PsExec / SMBExec|445|ADMIN$ write, svcctl pipe, service create/start, short-lived named service|
|WMIExec|135 + high RPC|DCOM activation, `IWbemLevel1Login`, output via SMB read of a temp file|
|WinRM / PowerShell remoting|5985/5986|`/wsman` POST, SOAP XML (if not TLS), `Microsoft WinRM Client` UA|
|RDP|3389|X.224 connection request with `mstshash`, TLS upgrade, long sessions|
|SSH|22|Between Windows or unusual hosts|
|Scheduled task (`atsvc`, `ITaskSchedulerService`)|445/135|RPC calls creating tasks remotely|
|Pass-the-Hash|445|NTLM auth success with no preceding Kerberos or password-change, from unusual host for the account|
|Pass-the-Ticket|88/445|Kerberos TGS use without matching AS exchange on the wire|

## 7.11 RDP, VNC, remote access

**RDP (3389):** Connection request (X.224) includes `Cookie: mstshash=username`. Newer RDP uses TLS (CredSSP/NLA), so content is hidden unless keys are available. Metadata: duration, volume, clipboard/drive redirection sizes. External RDP exposed to the Internet gets constant brute-force. **VNC (5900):** RFB protocol, weak auth, plain framebuffer. `vnc`. Remote tools: TeamViewer, AnyDesk (SNI/DNS names), ScreenConnect, Splashtop, ngrok/cloudflared tunnels. Attackers abuse legitimate remote tools; look for new/rare remote-admin domains.

## 7.12 Databases

- **MySQL (3306)**: `mysql`. Handshake shows server version, auth plugin. Queries visible in cleartext if no TLS (`mysql.query`). Failed logins repeated = brute force.
- **PostgreSQL (5432)**: `pgsql`. **MSSQL/TDS (1433)**: `tds`, `xp_cmdshell` use, SQL auth credentials obfuscated (weakly). **Oracle TNS (1521)**, **MongoDB (27017)** (`mongo`, often unauthenticated), **Redis (6379)** (plaintext RESP protocol, unauthenticated Redis abused for RCE via CONFIG SET dir/dbfilename + SAVE), **Memcached (11211)** (UDP amplification), **Elasticsearch (9200)** (HTTP JSON). Look for: DB ports reachable from the Internet or from unexpected clients, bulk `SELECT` returning large result sets (data theft), `INTO OUTFILE`, `LOAD_FILE`, administrative commands.

## 7.13 VPN and tunnelling protocols

- **IPsec**: IKE (UDP 500/4500) then ESP (IP proto 50), content hidden but metadata visible (peers, SPIs, volume). `isakmp`, `esp`.
- **OpenVPN**: UDP/TCP 1194 (commonly), recognisable handshake opcodes. `openvpn`.
- **WireGuard**: UDP, fixed handshake message sizes (148 bytes initiation, 92 response), then data. `wg`.
- **GRE (47), IP-in-IP (4), 6in4 (41), Teredo (UDP 3544), L2TP (UDP 1701), PPTP (TCP 1723 + GRE)**: tunnels that bypass inspection. Protocol hierarchy showing GRE/Teredo in a place that doesn't use them is a flag.
- **Tor:** TLS-looking connections to relay IPs on 9001/9030/443, certificates with random-looking hostnames (`www.xxxxxxxx.net` style self-signed), fixed 512-byte cells (traffic sizes in multiples of ~586 bytes with TLS overhead). Compare destination IPs against the public Tor relay list (check Tor Project consensus/ExoneraTor).
- **Proxies/tunnel tools:** `chisel`, `ngrok`, `frp`, `reGeorg`, `Cloudflare Tunnel`, SOCKS (`socks`), HTTP `CONNECT`. SOCKS5 handshake bytes `05 01 00` / `05 00`.
- **DNS/ICMP/HTTP/SSH tunnels:** sections 7.4, 7.2, 7.5, 7.9.

## 7.14 Wireless (802.11) basics

Capture in **monitor mode** to see management/control frames.

```
wlan
wlan.fc.type_subtype == 0x08          # beacon
wlan.fc.type_subtype == 0x04          # probe request (devices leak SSIDs they've joined)
wlan.fc.type_subtype == 0x0c          # deauthentication (deauth flood = attack)
wlan.fc.type_subtype == 0x0a          # disassociation
eapol                                 # WPA/WPA2 4-way handshake (4 EAPOL-Key messages)
wlan.ssid, wlan.bssid
```

Evil twin: same SSID, different BSSID/vendor/channel/encryption. Deauth bursts precede handshake capture for offline cracking (`aircrack-ng`, `hashcat -m 22000` using `hcxpcapngtool` to convert). To decrypt WPA2 in Wireshark: _Preferences → Protocols → IEEE 802.11 → Decryption keys → wpa-pwd_ with `passphrase:SSID`, and the capture must include the full 4-way handshake for each client. WPA3/PMF and 802.1X enterprise need keys differently.

## 7.15 VoIP: SIP/RTP

`sip`, `rtp`, `rtcp`. **Telephony → VoIP Calls** reconstructs calls (From/To, state, duration). **RTP Player** plays audio (G.711 etc.). SIP brute force = many `REGISTER` with 401/403. Toll fraud, call interception. CTF: export RTP audio → listen.

## 7.16 Industrial/IoT (brief)

**Modbus/TCP (502)** `mbtcp`, **DNP3 (20000)**, **S7comm (102)**, **BACnet (UDP 47808)**, **EtherNet/IP (44818)**, **MQTT (1883/8883)** `mqtt`. Usually unauthenticated and unencrypted: look for write commands (Modbus function codes 5, 6, 15, 16 = writes), commands from non-engineering stations, scans of these ports.

## 7.17 USB and Bluetooth captures (CTF classics)

**USB (usbmon/USBPcap):** `usb`, `usb.capdata`, `usbhid.data`. HID keyboards send 8-byte reports; byte 2 holds the key scancode (mod bit 0x02/0x20 = shift). Extract with `tshark -r f.pcap -Y "usb.capdata && usb.src != host" -T fields -e usb.capdata` then map scancodes to characters (e.g. `04=a ... 1d=z, 1e-27 = 1-0`, `28=Enter`, `2c=Space`). Mouse: relative x/y deltas, redraw the path. Also mass-storage bulk transfers (file carving). **Bluetooth:** `bthci_cmd`, `btl2cap`, `btatt` (BLE GATT reads/writes, sometimes plaintext secrets).

## 7.18 QUIC / HTTP/3

UDP/443 (and 80). Initial packet is encrypted with keys derived from the connection ID (anyone can decrypt Initial, so Wireshark shows the ClientHello **SNI** from the Initial packet), but subsequent packets need keys (via SSLKEYLOGFILE). Filters: `quic`, `quic.long.packet_type`, `tls.handshake.extensions_server_name` (inside QUIC), `http3`. If your enterprise blocks QUIC, browsers fall back to TLS/TCP. A UDP/443 flow from a non-browser could be tunnelling.

## 7.19 Other services worth recognising

- **NFS** (2049), **RPC portmapper** (111), **rsync** (873), **X11** (6000+), **IRC** (6667, classic botnet C2: `irc`, `PRIVMSG`/`JOIN`/`NICK`), **BitTorrent** (policy/malware), **Telegram/Discord/Slack/Teams** (legit services abused for C2/exfil, identify by SNI), **Kubernetes API (6443)**, **etcd (2379)**, **Docker API (2375 unauthenticated)**, **RPC/Portmap**, **Syslog**, **RADIUS (1812/1813)** `radius`, **TACACS+ (49)**, **Netflow (2055)**, **Printer: LPD 515, JetDirect 9100, IPP 631**, **LDAP/AD ports 389/636/3268/3269**, **Global Catalog**, **Active Directory replication RPC**, **ICS**.
- **PCAP-over-the-wire:** GRE/ERSPAN/VXLAN (UDP 4789) encapsulation of mirrored traffic: Wireshark will show an outer + inner packet.

---

# Part 8: TLS, HTTPS and QUIC: analysing and decrypting encrypted traffic

## 8.1 Why this matters

Most traffic today is encrypted (90%+ of web traffic, plus C2, exfil, DoH). You must be able to (a) extract maximum value _without_ decrypting, and (b) decrypt properly when you legitimately have the means.

## 8.2 How a TLS handshake looks

### TLS 1.2 (cleartext handshake, certificate visible)

```
Client → ClientHello          (versions, random, session id, cipher suites, extensions: SNI, ALPN, groups, sig algs)
Server → ServerHello          (chosen version/cipher, random)
Server → Certificate          (chain, visible!)
Server → ServerKeyExchange    (ECDHE params, signed)   [absent for static RSA key exchange]
Server → ServerHelloDone
Client → ClientKeyExchange    (client DH share, or RSA-encrypted premaster)
Client → ChangeCipherSpec, Finished (encrypted)
Server → ChangeCipherSpec, Finished
        ...Application Data (record type 23)
```

### TLS 1.3 (1-RTT, mostly encrypted)

```
Client → ClientHello (+ key_share, supported_versions=1.3, SNI, ALPN, psk modes)
Server → ServerHello (+ key_share)   (appears as "TLS 1.3" via supported_versions extension; legacy record version still says 1.2)
Server → {EncryptedExtensions, Certificate, CertificateVerify, Finished}   ← ENCRYPTED
Client → {Finished}
        ...Application Data
```

Consequences in TLS 1.3: **server certificate is not visible** (encrypted), all key exchange is (EC)DHE (forward secrecy), so no "private key decryption". Still visible: ClientHello (SNI, cipher suites, extensions, ALPN, versions), ServerHello (cipher, version, key share group). **ECH** (Encrypted Client Hello) will hide the inner SNI (outer SNI is a "public name", e.g. Cloudflare's `cloudflare-ech.com`).

### Record layer content types

`tls.record.content_type`: **20** ChangeCipherSpec, **21** Alert, **22** Handshake, **23** Application Data, **24** Heartbeat.

## 8.3 What to extract WITHOUT decrypting (the metadata playbook)

|Observable|Filter / field|Why it matters|
|---|---|---|
|**SNI (server name)**|`tls.handshake.extensions_server_name`|Which site/service. Compare to DNS and IP. Missing SNI to an IP = suspicious (malware often connects by IP with no SNI, tools like `curl https://ip`)|
|**Client Hello fingerprint (JA3/JA4)**|`tls.handshake.ja3`, `tls.handshake.ja3_full`, `tls.handshake.ja4` (JA4 in newer Wireshark versions, check `tshark -G fields|grep -i ja4`)|
|**Server fingerprint (JA3S/JA4S)**|`tls.handshake.ja3s`|Identifies the server's TLS stack/config. A JA3+JA3S pair is a stronger signature for C2 servers|
|**TLS version/ciphers offered & chosen**|`tls.handshake.version`, `tls.handshake.extensions.supported_version`, `tls.handshake.ciphersuite`, `tls.handshake.type == 2`|Deprecated versions (SSLv3, TLS1.0/1.1), weak/export/NULL/RC4 ciphers, odd cipher lists|
|**ALPN**|`tls.handshake.extensions_alpn_str`|`h2`, `http/1.1`, `h3`, or custom protocol identifiers|
|**Certificate (TLS ≤1.2)**|`tls.handshake.type == 11`, `x509sat.uTF8String`, `x509sat.printableString`, `x509ce.dNSName`, `x509af.notBefore/notAfter` (names vary: add as column from details)|Subject/issuer/SAN, **self-signed** (issuer == subject), default values (`Internet Widgits Pty Ltd`, `localhost`, `Default Company Ltd`), very short/very long validity, freshly issued (Let's Encrypt on a brand-new domain), mismatched CN vs SNI, weird CN patterns (random strings), expired certs, same cert reused across many IPs|
|**Alerts**|`tls.alert_message.desc` (e.g. 40 handshake_failure, 42 bad_certificate, 48 unknown_ca, 70 protocol_version)|Client rejecting a cert = inspection proxy or MITM; failures show misconfig or tool pinning|
|**Session size/shape**|Conversations tab, I/O graph|Upload vs download byte ratio (exfil), long duration, **beaconing** (regular small exchanges), burst patterns|
|**Timing**|`frame.time_delta_displayed`, `tcp.time_delta`|Beacon interval, jitter, human vs machine|
|**Resumption**|session id/ticket (`tls.handshake.session_id`, `tls.handshake.extensions.pre_shared_key`)|Repeated resumed sessions between pair|
|**Destination**|`ip.dst`, `dns` lookup preceding|Reputation, ASN, hosting provider, geography|

### JA3 explained (so you understand it, not just use it)

JA3 = MD5 of a string built from ClientHello fields, in order: `TLSVersion,Ciphers,Extensions,EllipticCurves,EllipticCurvePointFormats` (comma-separated fields, each list dash-separated; GREASE values removed). Same client software → same JA3 regardless of destination. Limits: modern browsers randomise extension order (Chrome since ~v110), which breaks JA3 stability. **JA4** sorts values and splits into readable parts (protocol/version/SNI-flag/counts/ALPN + hashes of ciphers and extensions), designed to be stable and searchable. Use fingerprints as _hunting pivots_ (what else on the network speaks with this fingerprint?), not as proof. Threat-intel sources: abuse.ch SSLBL/JA3 lists, ja3er-like datasets, FoxIO JA4 database. A malware JA3 can equal a legitimate library's JA3 (e.g. Python requests), so combine with SNI/destination/behaviour.

### Practical metadata extraction with tshark

```bash
# Every TLS connection: time, client, server, SNI, JA3
tshark -r f.pcap -Y 'tls.handshake.type==1' -T fields -e frame.time -e ip.src -e ip.dst -e tls.handshake.extensions_server_name -e tls.handshake.ja3
# Count SNIs
tshark -r f.pcap -Y 'tls.handshake.type==1' -T fields -e tls.handshake.extensions_server_name | sort | uniq -c | sort -rn
# TLS ClientHellos with NO SNI (connect-by-IP)
tshark -r f.pcap -Y 'tls.handshake.type==1 && !tls.handshake.extensions_server_name' -T fields -e ip.src -e ip.dst -e tls.handshake.ja3
# JA3 per client (which apps run on each host?)
tshark -r f.pcap -Y 'tls.handshake.type==1' -T fields -e ip.src -e tls.handshake.ja3 | sort | uniq -c | sort -rn
# Certificates (TLS 1.2): subject/issuer names
tshark -r f.pcap -Y 'tls.handshake.type==11' -T fields -e ip.dst -e x509sat.uTF8String -e x509sat.printableString
# Negotiated versions
tshark -r f.pcap -Y 'tls.handshake.type==2' -T fields -e tls.handshake.version -e tls.handshake.extensions.supported_version | sort | uniq -c
```

(Field names occasionally change between versions. Verify with `tshark -G fields | grep -i <word>` or click the field in the GUI and read the status bar.)

### Detecting suspicious TLS (checklist)

1. Rare SNI/IP with periodic connections (beacon).
2. Connect-by-IP without SNI.
3. Self-signed or default-subject certificate on non-standard port (e.g. TLS on 4444/8443/1337).
4. Non-browser JA3 from a user workstation talking to rare destinations.
5. Domain-fronting: SNI says `legit.cdn.com`, but later HTTP `Host:` (if decrypted) says something else.
6. Certificates for hosts that don't match SNI.
7. TLS where TCP port isn't 443 (use `tls && !(tcp.port==443)`), or TLS on a protocol port like 53.
8. Very long sessions with low steady throughput (interactive C2).
9. High outbound byte ratio to cloud storage/pastebin/file-sharing SNI (mega.nz, transfer.sh, anonfiles, dropbox, drive, onedrive, discord cdn, telegram).
10. DoH to providers other than the corporate resolver.

## 8.4 Decryption: all the ways

TLS decryption requires **secrets** (session keys), never "breaking" the crypto. Options, from easiest to hardest:

### Method 1: SSLKEYLOGFILE (the standard, works for TLS 1.2, 1.3, QUIC)

The client application writes the session secrets to a file; Wireshark uses them to decrypt the capture. This is how you inspect your own browser/app traffic, malware sandbox traffic (if you can control the client), and CTF challenges that ship a key log.

**Generate:**

- Linux/macOS: `export SSLKEYLOGFILE=$HOME/sslkeys.log` then launch Chrome/Chromium/Edge(Chromium)/Firefox/curl from that same shell.
    - `curl` (with OpenSSL/NSS/GnuTLS builds supporting it): honours `SSLKEYLOGFILE`.
    - Python 3.8+: `ctx = ssl.create_default_context(); ctx.keylog_filename = "keys.log"` (the `requests` library needs the env var to be honoured via urllib3 on recent versions, or mount a custom adapter).
    - Go: `tls.Config{KeyLogWriter: f}`. Node.js: `--tls-keylog=keys.log`. Java: use an agent like **jSSLKeyLog**. .NET: set `SSLKEYLOGFILE` is supported on newer .NET for SslStream (check runtime). OpenSSL apps: callback `SSL_CTX_set_keylog_callback` (or env var if the app supports it).
- Windows: set a system/user env var `SSLKEYLOGFILE=C:\keys\ssl.log`, restart the browser. Windows' built-in Schannel (used by many native apps, PowerShell/.NET Framework, IE) does **not** support key logging.
- Mobile/apps/malware that don't support it: **Frida** scripts to hook `SSL_write/SSL_read`/key derivation, or run through a **MITM proxy** (Method 3).

**File format** (NSS key log), one line per secret:

```
CLIENT_RANDOM <64 hex client_random> <96 hex master_secret>                 # TLS ≤ 1.2
CLIENT_HANDSHAKE_TRAFFIC_SECRET <client_random> <secret>                     # TLS 1.3
SERVER_HANDSHAKE_TRAFFIC_SECRET <client_random> <secret>
CLIENT_TRAFFIC_SECRET_0 <client_random> <secret>
SERVER_TRAFFIC_SECRET_0 <client_random> <secret>
EXPORTER_SECRET <client_random> <secret>
```

The `client_random` ties each secret to a specific handshake in your capture (the ClientHello's random).

**Use in Wireshark:** `Edit → Preferences → Protocols → TLS → (Pre)-Master-Secret log filename → Browse`. Or right-click a TLS packet → Protocol Preferences. Reload the capture. **tshark:** `tshark -r f.pcap -o tls.keylog_file:keys.log -Y http -T fields -e http.host -e http.request.uri` **Embed keys in the pcapng** (portable, share capture + keys as one file): `editcap --inject-secrets tls,keys.log in.pcap out.pcapng`. Later _File → Export TLS Session Keys_ extracts them.

**Verify it worked:** the packet bytes pane shows an extra tab **"Decrypted TLS"**; packets previously "TLSv1.3 Application Data" are now dissected as `HTTP`, `HTTP2`, `DNS` (DoH) etc.; **Analyze → Follow → TLS Stream** shows plaintext.

**If it doesn't work:**

|Cause|Fix|
|---|---|
|Capture started after the handshake (missing ClientHello)|Wireshark can't map keys. Recapture so the full handshake is included|
|Key log lacks that session (different process/tool, or app doesn't log)|Make sure the _client doing the traffic_ logged the keys. Check the file contains lines with the same client_random as the ClientHello|
|Session resumption|Keys derive from earlier handshake secrets. You need those original secrets or recapture with resumption disabled|
|Wrong file path/permissions|Absolute path, readable|
|TLS on non-standard port|`Analyze → Decode As` → TCP port → TLS (Wireshark may not recognise it as TLS)|
|Traffic goes through another hop (proxy)|You're capturing proxy↔server, not client↔server. Capture the right leg and log keys at the right endpoint|
|QUIC/HTTP3|Same key log works, but QUIC needs a recent Wireshark (≥3.x/4.x support)|
|ECH|Inner ClientHello is encrypted. You still decrypt traffic with keys, but SNI isn't visible without them|

### Method 2: RSA private key (limited, legacy)

Works **only if** the session used **static RSA key exchange** (cipher suites `TLS_RSA_WITH_*`), **TLS ≤ 1.2**, and you have the **server's private key**. It does **not** work for (EC)DHE cipher suites (forward secrecy), which is nearly all modern traffic, and never for TLS 1.3. Setup: `Preferences → Protocols → TLS → RSA keys list → Edit → IP, Port, Protocol (e.g. http), Key file (.pem/.p12)`. Use case: CTFs giving `server.key`, old internal appliances. Check the negotiated cipher in ServerHello: if it contains `ECDHE`/`DHE`, this method won't work.

### Method 3: MITM / inspecting proxy (you control the client or can install a CA)

Tools: **mitmproxy/mitmweb/mitmdump**, **Burp Suite**, **OWASP ZAP**, **Fiddler**, **Charles**. The proxy terminates TLS from the client with a certificate signed by _its own CA_, which the client must trust, then opens a second TLS session to the server. You see plaintext HTTP in the tool (and can export HAR). Also mitmproxy can write a keylog (`SSLKEYLOGFILE=... mitmproxy`) for Wireshark. Issues: **certificate pinning** (apps reject the proxy CA; bypass with Frida/objection on mobile in a test lab), HSTS, mutual TLS. Only do on systems you own/are authorised to test. This is also how enterprise TLS inspection works, and why employees see "corporate CA" issuers.

### Method 4: Endpoint-side approaches

Hook the crypto library (Frida, `ssl_logger`, LD_PRELOAD `sslkeylog.so`, Windows ETW/Schannel tracing) or read memory. Debug flags: `-Djavax.net.debug=ssl:handshake` (shows handshake info, not Wireshark keylog format), Chrome `--ssl-key-log-file=file`.

### Method 5: Other decryptable protocols in Wireshark

|Protocol|What you need|
|---|---|
|**WPA/WPA2-PSK (802.11)**|passphrase + SSID, full 4-way handshake in the capture (`wpa-pwd`). Set in IEEE 802.11 prefs|
|**IPsec ESP**|SA parameters + keys (ESP preferences: "Attempt to detect/decode encrypted ESP payloads", SPI, algorithms, keys)|
|**SMB3 encrypted**|Session ID + session key / decryption keys (SMB2 preferences, "Secret session keys"); NTLM-derived keys possible if you know the password and captured auth|
|**Kerberos**|keytab file (Preferences → Protocols → KRB5, "try to decrypt Kerberos blobs") to read ticket contents and decrypt service traffic|
|**SSH**|Not decryptable from a pcap without hooking the endpoint (keys aren't logged by default)|
|**RDP (non-NLA, RC4 legacy)**|server private key / `rdp` TLS key, or TLS keylog for modern RDP|
|**IKE/ISAKMP**|SPI + keys (ISAKMP preferences)|
|**DoH/DoT**|Decrypt TLS (Method 1), then it appears as HTTP2 or DNS|
|**Zigbee/Bluetooth LE**|link keys|

## 8.5 After decrypting: continue as plain HTTP

Everything in 7.5 now applies. `http`, `http2`, `Export Objects → HTTP` (works on decrypted traffic), Follow → TLS stream, `http.request.full_uri`, etc.

## 8.6 Encrypted-traffic analysis without keys (traffic analysis proper)

Even without keys you can characterise behaviour:

- **Direction/size/time sequence** (e.g. request size 300B → response 5KB → idle) forms a _behavioural fingerprint_ of an application or C2 profile.
- **Beacon detection:** group by (src, dst, dport), compute inter-arrival times, check low variance (see 10.7 script). Jitter (e.g. ±10–30%) is added by C2 to evade, so look at _coefficient of variation_ and dominant interval peaks, and compare many connections' bytes (same-sized heartbeats).
- **Exfil detection:** outbound ≫ inbound over TLS to a rare host. Chunked uploads show regular large bursts of near-MTU packets.
- **Interactive session detection:** bidirectional small packets with human-like timing (SSH keystrokes, interactive C2 shell).
- **Session length and number:** thousands of short TLS sessions to one IP suggest a scanner/beacon polling.
- **Cert and certificate-chain reuse across IPs** (pivot on cert serial/fingerprint on Shodan/Censys/crt.sh).
- **Entropy of payload** (everything looks random in TLS, but plaintext protocols carrying encrypted/compressed blobs also show high entropy: wrongful use of port 80 for encrypted C2 shows as high-entropy HTTP body).

---

# Part 9: Extracting files and artifacts (carving)

## 9.1 Why

Packets carry files (malware drops, documents, images with hidden flags, stolen data). Extracting them lets you hash, scan, sandbox, and read them. It's often the proof of impact.

## 9.2 Methods (in order of ease)

1. **File → Export Objects → HTTP / SMB / IMF / TFTP / DICOM / FTP-DATA.** Wireshark reassembles and decodes (chunked encoding, gzip) for you. Save selected or _Save All_.
2. **Follow Stream → Show data as Raw → (select one direction) → Save as.** For custom protocols, or ones without an exporter. Save **only the direction that carries the file** (e.g. server→client = blue). Then strip protocol headers (HTTP headers end at `\r\n\r\n` = bytes `0d 0a 0d 0a`).
3. **tshark exporters:**

```bash
tshark -r f.pcap --export-objects http,./out_http
tshark -r f.pcap --export-objects smb,./out_smb
tshark -r f.pcap --export-objects imf,./out_mail
tshark -r f.pcap --export-objects tftp,./out_tftp
tshark -r f.pcap --export-objects dicom,./out_dicom
tshark -r f.pcap -q -z follow,tcp,raw,7          # raw hex of tcp.stream 7, convert with xxd -r -p
```

4. **tcpflow:** `tcpflow -r f.pcap -o flows/` writes each direction of each TCP flow into separate files (named `src.port-dst.port`). Add `-c` to print to console, `-e http` to extract HTTP bodies with its scanner plugins (depending on build).
5. **NetworkMiner (GUI):** automatically extracts files, images, credentials, sessions, hosts (OS fingerprints), DNS, parameters into tabs. Great for first-pass triage on a pcap (free edition handles pcap import).
6. **Zeek file extraction:** `zeek -r f.pcap` then `files.log`; with the `extract-all-files` policy (or `frameworks/files/extract-all`) it writes files to `extract_files/`. Zeek tracks SHA1/MD5 hashes of every file automatically in `files.log`.
7. **Signature-based carving:** `foremost -i f.pcap -o carved/` or `binwalk -e f.pcap` or `tcpxtract`. These scan raw bytes for file headers. They are hit-or-miss for reassembled/compressed/encoded content but good for CTFs.
8. **Suricata** file-store (`filestore` keyword / `file-store` output) for IDS-integrated extraction.

## 9.3 Manual carve of an HTTP download (Python, stdlib)

```python
# strip HTTP headers from a raw server->client stream dump
data = open("stream_raw.bin","rb").read()
i = data.find(b"\r\n\r\n")
hdr, body = data[:i].decode(errors="replace"), data[i+4:]
print(hdr)                     # check Content-Length, Transfer-Encoding: chunked, Content-Encoding: gzip
open("carved.bin","wb").write(body)
```

If `Transfer-Encoding: chunked`, body is chunk-prefixed (hex length + CRLF). Wireshark's Export Objects handles this. For manual: decode chunks. If `Content-Encoding: gzip`, run `gunzip`/`zcat`. If multiple responses share a stream (keep-alive), split per response.

## 9.4 Identify and verify what you extracted

```bash
sha256sum file ; file file ; xxd file | head ; strings -a -n 8 file | head -50
exiftool file                    # metadata (images, docs)
binwalk file                     # embedded files, entropy
```

Magic bytes (file signatures):

|Type|Hex|ASCII|
|---|---|---|
|PE (EXE/DLL/SYS)|`4D 5A`|`MZ`|
|ELF|`7F 45 4C 46`|`.ELF`|
|Mach-O|`CF FA ED FE` / `CA FE BA BE` (also Java class)||
|ZIP / DOCX / XLSX / JAR / APK|`50 4B 03 04`|`PK..`|
|RAR|`52 61 72 21 1A 07`|`Rar!`|
|7z|`37 7A BC AF 27 1C`|`7z..`|
|GZIP|`1F 8B 08`||
|BZIP2|`42 5A 68`|`BZh`|
|PDF|`25 50 44 46`|`%PDF`|
|PNG|`89 50 4E 47 0D 0A 1A 0A`|`.PNG`|
|JPEG|`FF D8 FF`||
|GIF|`47 49 46 38`|`GIF8`|
|OLE2 (legacy .doc/.xls/.msi)|`D0 CF 11 E0 A1 B1 1A E1`||
|RTF|`7B 5C 72 74 66`|`{\rtf`|
|Script||`#!/bin/`, `<script`, `powershell`, `FromBase64String`, `-enc`|
|LNK|`4C 00 00 00 01 14 02 00`||
|ISO|`43 44 30 30 31` at offset 0x8001|`CD001`|
|SQLite||`SQLite format 3`|
|pcap|`D4 C3 B2 A1` / `A1 B2 C3 D4`||
|pcapng|`0A 0D 0D 0A`||

Threat triage: hash lookup on VirusTotal/MalwareBazaar/Hybrid Analysis (look up the **hash**; don't upload sensitive files). Detonate in an isolated sandbox (CAPE, Any.Run, Joe Sandbox, or a local isolated VM with FakeNet-NG/INetSim). **Never run extracted samples on your host.** For Office files: `oledump.py`, `olevba`; PDFs: `pdfid`, `pdf-parser`; PE: `pestudio`, `die`, `capa`, `floss`.

## 9.5 Credentials in traffic

Where to look: `Tools → Credentials`, and filters from 7.7/7.8/7.5 (`ftp`, `telnet`, `pop`, `imap`, `smtp`, `http.authorization`, `http.request.method=="POST"` with `password=`), SNMP community strings, LDAP simple binds, **NTLMv2 hashes** (7.10), Kerberos AS-REP/TGS (roasting), Basic auth (base64 → `echo '...' | base64 -d`), session cookies/JWTs (`http.cookie`, `Authorization: Bearer`), API keys in URLs/headers, database logins, VoIP SIP digest (`sip.Authorization`). Treat all as sensitive. In reports, redact.

---

# Part 10: tshark in depth (the command-line power tool)

## 10.1 Why tshark

Reproducible, scriptable, fast, handles huge captures, pipes into `sort|uniq|awk|jq|python`. Use Wireshark to _explore_, tshark to _quantify and automate_.

## 10.2 Core options

```
-r <file>           read file
-i <if>             live capture      -D list interfaces
-f "<bpf>"          capture filter    -Y "<display filter>"   display filter
-w <file>           write packets     -F pcap|pcapng   output format
-c <n>              stop after n packets
-n                  no name resolution (use always)   -N <flags>  (e.g. -N n)
-q                  quiet (suppress packet printing, use with -z stats)
-V                  full packet detail    -O <proto>   details only for protocol(s)
-x                  hex+ASCII dump
-t ad|a|r|d|dd|e|u|ud   time format (ad = absolute date/time, r = relative to first, d = delta prev, e = epoch, ud = UTC date)
-T fields|json|ek|pdml|text|tabs|psml   output format
-e <field>          field to print (repeatable)  -E header=y -E separator=, -E quote=d -E occurrence=f|l|a  -E aggregator=;
-o <pref>:<value>   override preference (e.g. -o tls.keylog_file:keys.log, -o tcp.relative_sequence_numbers:FALSE, -o "gui.column.format:...")
-d tcp.port==8080,http   Decode As on the fly
-z <statistic>      statistics (see 10.4)
--export-objects <proto>,<dir>
-2                  two-pass analysis (needed for some filters/relations, e.g. -R, reassembly-dependent fields)
-s <snaplen>        capture snaplen
-b duration:N -b filesize:N -b files:N     ring buffer when capturing
-G fields|protocols|ftypes|values|decodes|plugins     glossary (field discovery!)
-j / -J <topfilter>  include only matching protocol tree in JSON (large captures)
```

Discover field names: `tshark -G fields | grep -i "ja3"` and `tshark -G protocols | grep -i smb`.

## 10.3 Extract fields (the workhorse pattern)

```bash
tshark -r f.pcap -Y 'http.request' -T fields -E header=y -E separator=, -E quote=d \
   -e frame.time -e ip.src -e ip.dst -e http.host -e http.request.method -e http.request.uri -e http.user_agent > http_requests.csv
```

Count/aggregate:

```bash
... -T fields -e <field> | sort | uniq -c | sort -rn | head -30
... -T fields -e ip.src -e ip.dst -e tcp.dstport | sort | uniq -c | sort -rn      # connection tuples
```

## 10.4 Statistics (-z) cheat list

```bash
tshark -r f.pcap -q -z io,phs                         # protocol hierarchy
tshark -r f.pcap -q -z conv,ip                        # IPv4 conversations   (conv,tcp / conv,udp / conv,eth / conv,ipv6)
tshark -r f.pcap -q -z endpoints,ip                   # endpoints            (endpoints,tcp / ,udp)
tshark -r f.pcap -q -z io,stat,60                     # packets & bytes per 60 s
tshark -r f.pcap -q -z io,stat,10,"ip.src==10.0.0.5","COUNT(dns)dns"    # intervals with filters
tshark -r f.pcap -q -z dns,tree                       # DNS stats (types, rcodes, top names)
tshark -r f.pcap -q -z http,tree                      # HTTP stats (codes, methods)
tshark -r f.pcap -q -z http_req,tree                  # request tree by host/URI
tshark -r f.pcap -q -z http_srv,tree                  # per-server stats
tshark -r f.pcap -q -z expert                         # expert info summary
tshark -r f.pcap -q -z hosts                          # IP→name table from captured DNS
tshark -r f.pcap -q -z dhcp,stat
tshark -r f.pcap -q -z credentials                    # cleartext credentials found (newer versions)
tshark -r f.pcap -q -z follow,tcp,ascii,12            # follow TCP stream 12 (ascii|hex|raw)
tshark -r f.pcap -q -z follow,udp,ascii,3
tshark -r f.pcap -q -z follow,tls,ascii,5             # decrypted TLS stream (with keylog)
tshark -r f.pcap -q -z smb,srt                        # SMB service response time
tshark -r f.pcap -q -z rpc,srt,100003,3               # (ONC-RPC example)
tshark -r f.pcap -q -z sip,stat / -z rtp,streams / -z voip,calls
```

## 10.5 One-liners for common investigations

```bash
# Capture overview
capinfos f.pcap
# Top talkers by bytes
tshark -r f.pcap -q -z conv,ip | head -40
# All unique external IPs contacted (filter out RFC1918)
tshark -r f.pcap -T fields -e ip.dst | sort -u | grep -vE '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|224\.|239\.|255\.)'
# Unique destination ports (non-standard port hunt)
tshark -r f.pcap -Y 'tcp.flags.syn==1 && tcp.flags.ack==0' -T fields -e tcp.dstport | sort -n | uniq -c | sort -rn
# SYN scan detection: sources by distinct destination ports contacted
tshark -r f.pcap -Y 'tcp.flags.syn==1 && tcp.flags.ack==0' -T fields -e ip.src -e ip.dst -e tcp.dstport | sort -u | awk '{c[$1]++} END{for(k in c) print c[k],k}' | sort -rn | head
# HTTP user agents per host
tshark -r f.pcap -Y 'http.user_agent' -T fields -e ip.src -e http.user_agent | sort | uniq -c | sort -rn
# POST requests with sizes
tshark -r f.pcap -Y 'http.request.method=="POST"' -T fields -e frame.number -e ip.src -e http.host -e http.request.uri -e http.content_length
# Per-conversation byte totals (the table isn't sorted by size: sort in Wireshark's Conversations window, or use Zeek conn.log, see Part 13)
tshark -r f.pcap -q -z conv,tcp | head -60
# Credentials FTP/Telnet-like
tshark -r f.pcap -Y 'ftp.request.command=="USER" || ftp.request.command=="PASS"' -T fields -e ip.src -e ftp.request.command -e ftp.request.arg
# Extract all URLs
tshark -r f.pcap -Y http.request -T fields -e http.request.full_uri | sort -u
# Hostnames from DHCP
tshark -r f.pcap -Y dhcp -T fields -e dhcp.hw.mac_addr -e dhcp.option.hostname -e dhcp.option.requested_ip_address | sort -u
# Kerberos usernames
tshark -r f.pcap -Y 'kerberos.CNameString' -T fields -e ip.src -e kerberos.CNameString -e kerberos.realm | sort | uniq -c | sort -rn
# NTLM identities
tshark -r f.pcap -Y 'ntlmssp.messagetype==0x00000003' -T fields -e ip.src -e ip.dst -e ntlmssp.auth.domain -e ntlmssp.auth.username -e ntlmssp.auth.hostname
# Packets with undissected payload (unknown protocols)
tshark -r f.pcap -Y 'data' -T fields -e ip.src -e ip.dst -e tcp.dstport -e udp.dstport | sort | uniq -c | sort -rn
# Search a string everywhere (case-insens) and list frames
tshark -r f.pcap -Y 'frame matches "(?i)flag\{"' -T fields -e frame.number -e ip.src -e ip.dst
# Dump payload of matching frames as text
tshark -r f.pcap -Y 'tcp.payload contains "password"' -T fields -e frame.number -e tcp.payload | xxd -r -p | strings
# Split capture into one file per TCP stream (bash)
for s in $(tshark -r f.pcap -T fields -e tcp.stream | sort -n | uniq); do tshark -r f.pcap -Y "tcp.stream==$s" -w stream_$s.pcap; done
```

## 10.6 JSON and Python

```bash
tshark -r f.pcap -Y http -T json | jq '.[]._source.layers.http'
tshark -r f.pcap -T ek > f.ndjson                  # Elasticsearch bulk format
```

**pyshark** (Python wrapper over tshark): `cap = pyshark.FileCapture('f.pcap', display_filter='dns')`. **scapy** (`rdpcap`) for crafting/parsing at the byte level. **dpkt** for lightweight parsing.

## 10.7 Beacon detection starter (Python, stdlib only)

```python
#!/usr/bin/env python3
# usage: tshark -r f.pcap -Y 'tcp.flags.syn==1 && tcp.flags.ack==0' -T fields -e frame.time_epoch -e ip.src -e ip.dst -e tcp.dstport | python3 beacon.py
import sys, statistics as st
from collections import defaultdict
t = defaultdict(list)
for line in sys.stdin:
    p = line.split()
    if len(p) < 4: continue
    ts, src, dst, port = float(p[0]), p[1], p[2], p[3]
    t[(src, dst, port)].append(ts)
rows = []
for k, v in t.items():
    if len(v) < 6: continue
    v.sort()
    d = [b - a for a, b in zip(v, v[1:])]
    mean = st.mean(d); sd = st.pstdev(d)
    cv = sd / mean if mean else 9
    rows.append((cv, len(v), mean, sd, k))
for cv, n, mean, sd, k in sorted(rows)[:25]:
    print(f"cv={cv:.2f} n={n:4d} mean={mean:8.1f}s sd={sd:7.1f}s  {k[0]} -> {k[1]}:{k[2]}")
```

Low coefficient of variation (cv < ~0.3) with many connections = candidate beacon. Jittered beacons have higher cv but a dominant mean. Always verify manually (NTP, update checkers, monitoring agents and telemetry are legitimate periodic traffic). The same idea works for DNS queries per name (swap the fields).

## 10.8 DNS entropy / long-label helper

```python
import sys, math, collections
def H(s):
    c = collections.Counter(s); n = len(s)
    return -sum(v/n*math.log2(v/n) for v in c.values())
for name in sys.stdin:
    name = name.strip()
    lab = name.split('.')[0]
    if len(lab) >= 12: print(f"{H(lab):.2f} {len(lab):3d} {name}")
```

High entropy (>3.5 for hex/base32-ish labels) plus length flags tunnelling/DGA candidates.

---

# Part 11: Threat patterns: what each attack looks like on the wire

Each entry: **signature → how to confirm → filter/command → false positives.**

## 11.1 Reconnaissance and scanning

|Technique|Signature|Confirm|False positives|
|---|---|---|---|
|**ARP sweep**|One host ARPs for many sequential local IPs|`arp.opcode==1` grouped by `arp.src.proto_ipv4`|Network scanners (inventory tools), DHCP conflict checks|
|**Ping sweep**|ICMP echo from one source to many destinations|`icmp.type==8` count distinct `ip.dst`|Monitoring|
|**TCP SYN scan**|Many SYN (no ACK) to many ports/hosts; RST,ACK from closed; SYN,ACK then RST from the scanner|`tcp.flags==0x002` per source/dst|Vulnerability scanners, load balancer health checks|
|**TCP connect scan**|Full handshakes to many ports, immediately closed|many conversations of 3–6 packets|Port probes by apps|
|**Stealth scans**|FIN-only (0x001), NULL (0x000), XMAS (0x029) flags|`tcp.flags == 0x029` etc.|Should not occur legitimately|
|**UDP scan**|UDP to many ports, ICMP port-unreachable replies|`icmp.type==3 && icmp.code==3`||
|**Service/version scan**|Probes with protocol-specific payloads (HTTP OPTIONS, SSH banner grabs, `GET /nmaplowercheck`, `/HNAP1`)|`http.request.uri contains "nmaplowercheck"`, UA `Nmap Scripting Engine`|Security tools|
|**OS fingerprinting**|Odd flag/option combinations, tiny windows, specific probe sequences|Compare SYN options vs normal OS||
|**Web dir busting**|High-rate 404s with wordlist paths|`http.response.code==404` per src|Broken crawlers|
|**DNS recon**|AXFR, PTR sweeps, subdomain brute force (many NXDOMAIN under one domain)|see 7.4||
|**AD enumeration**|Bursts of LDAP searches, SAMR/LSARPC enumerations, SRV lookups, null sessions|`ldap`, `samr`, `lsarpc` from workstation|Legit admin tools|
|Metrics to compute: _distinct destination ports per source in time window_ (vertical scan), _distinct destination hosts per source on one port_ (horizontal scan), _ratio of failed to successful connections_, _rate_. Wireshark: `Statistics → IPv4 → Destinations and Ports`, Conversations sorted by distinct entries, or the tshark awk in 10.5.||||

## 11.2 Credential attacks

- **Brute force/spray:** repeated auth attempts. SSH (many short sessions), FTP (`530`), HTTP login (401/403/POST repeats, response size differences), RDP (many X.224 sessions), SMB (`STATUS_LOGON_FAILURE`), Kerberos (`KRB-ERROR 24`), LDAP bind failures, SMTP AUTH failures, SIP REGISTER 401. **Spray** = one/few passwords across many accounts (look at usernames varying, low per-user count). Success indicator: different response/length/duration followed by new activity.
- **Credential sniffing:** cleartext protocols (7.7, 7.8, 7.5); `Tools → Credentials`.
- **LLMNR/NBT-NS/mDNS poisoning + NTLM capture:** see 7.3. Wire: name-resolution broadcast/multicast → unicast reply from an attacker's IP → SMB/HTTP NTLM auth to attacker. Also **WPAD** poisoning (`wpad` queries) and **mitm6** (rogue DHCPv6/RA).
- **NTLM relay:** victim authenticates to attacker, attacker authenticates to a target (SMB/LDAP/HTTP) using relayed messages. See the same NTLM messages repeated across two conversations with attacker in the middle; LDAP writes (e.g. RBCD attribute changes, adding computer accounts) from unexpected hosts.
- **Kerberoasting/AS-REP roasting/DCSync/Pass-the-hash/ticket:** see 7.10.
- **Password in URL or cookie reuse; session hijack:** same session cookie used from two IPs/UAs.

## 11.3 Exploitation and initial access

- **Exploit delivery over HTTP:** malformed requests, long strings (buffer overflows), unusual headers, encoded payloads, JNDI strings, serialised object markers (`rO0AB` base64 Java, `aced0005` hex), `<?php`, `%00`, `{{7*7}}` template injection probes, path traversal. Follow with an **unexpected outbound connection from the server** (reverse shell/staged download), which is the strongest confirmation.
- **EternalBlue (MS17-010):** SMBv1 Trans2 anomalies, large crafted SMB packets to 445, then shellcode callback. Look for SMBv1 negotiation to modern hosts.
- **Phishing/drive-by:** DNS for lookalike domain → HTTP/HTTPS GET → redirect chain (`302`) → download of `.zip/.iso/.js/.hta/.lnk/.docm` → execution → new outbound connections. Email path via SMTP/IMAP with attachment.
- **Reverse shell:** _victim initiates_ connection out to attacker on odd port (4444, 1337, 8080, 443); long-lived; payload shows shell text (`C:\Windows\system32>`, `$`, `uid=`, command echo) if cleartext. Follow TCP stream. Bind shell: attacker connects _into_ a high port on victim.
- **Staging/ingress tool transfer:** `certutil -urlcache`, `bitsadmin`, `powershell IEX (New-Object Net.WebClient).DownloadString(...)`, `curl|wget` UAs (`Microsoft BITS/`, `CertUtil URL Agent`, `WinHttp`) fetching `.exe/.ps1/.dll`.

## 11.4 Command and control (C2)

Behavioural features (works even encrypted): **periodic callbacks** (fixed interval ± jitter), **small, uniform request/response sizes**, **rare/new destination**, **long-lived or repeated connections**, **non-browser JA3/UA**, **DNS pattern (DGA/NXDOMAIN, TXT)**, **off-hours**, **same destination from multiple internal hosts** (propagation). Channels: HTTP(S), DNS, ICMP, custom TCP/UDP, SSH tunnels, IRC/Discord/Telegram/Slack/GitHub/Pastebin/Gist/Drive/Dropbox/Teams APIs (legit-looking), WebSockets, QUIC. See 7.4/7.5/8.3/10.7. Wire-level details for HTTP(S) C2: check **URI patterns**, **cookies carrying data**, **response size constant for "no tasking"**, **sudden larger response** (tasking/payload), **POST with encoded body** (results/exfil), **User-Agent constants**. Domain fronting: SNI vs Host mismatch (after decrypt). Redirectors/CDNs mean the IP is shared, so rely on SNI and cert.

## 11.5 Lateral movement

Internal-to-internal use of SMB (admin shares, svcctl), WMI/DCOM, WinRM, RDP, SSH, scheduled tasks, remote registry, DCOM, PowerShell remoting. **Graph the internal peers** (Conversations IPv4, filter both addresses private): a workstation connecting to dozens of internal hosts, or to a DC for replication, is a pivot. Use matrix in 7.10. Also **internal tunnelling/proxying** (SOCKS via compromised host, `chisel`).

## 11.6 Credential/data access and collection

Mass SMB reads/directory listings (`smb2.cmd==14` Find + many Create/Read), database `SELECT *` dumps, large LDAP dumps, archives created then transferred (`.zip/.7z/.rar` upload), email forwarding/IMAP mass fetch. **Staging server:** an internal host that receives lots of data from many hosts, then sends a large amount out.

## 11.7 Exfiltration

Signs: **outbound ≫ inbound**, large uploads to rare/cloud-storage hosts, **after-hours**, bursts of near-MTU packets in one direction, **many equal-sized chunks**, FTP `STOR`, HTTP `PUT/POST` with large `Content-Length`, SMTP with attachments, **DNS/ICMP tunnelling** (many unique labels, TXT, large payload echoes), **TLS to unusual hosts**, **cloud sync SNIs** (mega.nz, dropbox, drive.google, onedrive, box, wetransfer, transfer.sh, anonfiles, pastebin, discord/telegram CDN). Measure: bytes sent per (src,dst) in Conversations; baseline against that host's normal upload volume; check file magic in cleartext uploads; high entropy payloads in plaintext = encrypted/compressed archives.

## 11.8 Man-in-the-middle and spoofing

- **ARP poisoning:** see 7.1; plus **traffic from victim to gateway MAC = attacker MAC** (Ethernet dst differs from gateway's usual MAC), duplicate packets (victim→attacker→gateway) with _decremented TTL by 1_ (attacker forwarding).
- **DNS spoofing:** answer IP differs from the legitimate answer, or **two responses** to one query (race: first legit, second spoof, or inversely), response from a non-resolver IP, mismatched transaction IDs/ports.
- **Rogue DHCP/RA:** extra DHCP Offer or RA from an unexpected host. **ICMP redirect** (type 5). **STP** root takeover. **SSL stripping:** HTTPS links downgraded to HTTP, HSTS absent. **Evil twin** Wi-Fi. **TLS interception:** certificate issuer unexpected for well-known sites (new CA), alerts `unknown_ca`.
- **IP spoofing:** TTL/MSS/window inconsistent with the real host. For TCP, unfinished handshakes (spoofed SYN) or responses to sources that never sent requests (backscatter).

## 11.9 Denial of service

- **SYN flood:** huge number of SYN with no completions, often random/spoofed sources; server SYN,ACKs retransmit. `tcp.flags.syn==1 && tcp.flags.ack==0` rate in I/O graph.
- **UDP flood / amplification (DNS ANY, NTP monlist, SSDP, memcached, CLDAP):** large responses to a victim from many reflectors with no matching requests; look at sizes and source ports (53, 123, 1900, 11211, 389).
- **ICMP flood/Smurf**, **HTTP flood** (many GET to heavy URIs, Slowloris: many half-open requests with partial headers sent slowly; `http.request` with no end-of-headers and tiny packets at long intervals), **ACK/RST floods**, **application-layer DDoS**.
- Evidence: I/O Graph spikes, Conversations by packets, source IP distribution (spoofed = random distribution, botnet = many distinct), packet-size uniformity, TTL clusters.

## 11.10 Malware families' network behaviours (generic)

- **Ransomware:** key retrieval (HTTP/TOR/DNS), mass SMB file operations, shadow copy actions via RPC/WMI, ransom note drops (`README.txt`) written to many shares, preceded by exfil (double extortion).
- **Botnets (IRC/HTTP/P2P):** IRC commands, P2P UDP to many peers, DGA NXDOMAIN storms.
- **Banking trojans/infostealers:** POST of stolen data (browser creds, cookies, wallets) to C2, Telegram bot API (`api.telegram.org/bot<token>/sendDocument`), Discord webhooks (`discord.com/api/webhooks/`), SMTP/FTP exfil, `ipinfo.io`/`api.ipify.org` lookups of public IP (victim geolocation check, common stealer/loader behaviour).
- **Cryptominers:** Stratum protocol (`"method":"mining.subscribe"`, JSON-RPC over TCP, ports 3333/4444/5555/14444), pool domains.
- **Worms:** self-propagating scans (445, 3389, 22, 23), same exploit payload to many hosts.
- **Loaders:** small GET for second-stage; connectivity checks (`www.msftconnecttest.com`, `1.1.1.1`).

## 11.11 Insider and policy issues

Unapproved cloud storage, P2P, VPN/Tor use, shadow IT, plaintext credentials, outdated TLS, telemetry leaks, personal email upload.

---

# Part 12: Performance and troubleshooting analysis

Method: **isolate the layer** → **measure** → **locate** → **explain**.

## 12.1 Quick questions → tool

|Question|How|
|---|---|
|Is the network slow or the server?|Initial RTT (handshake) vs time-to-first-byte after request (`http.time`, `tcp.time_delta` on the response)|
|Is there packet loss?|`tcp.analysis.retransmission`, `duplicate_ack`, `lost_segment` rates, I/O graph overlay|
|Is DNS slow?|`dns.time`, Statistics → DNS service response time, failed queries/retries/timeouts to a dead resolver|
|Are connections failing?|SYN without SYN/ACK, RSTs, ICMP unreachable, `tcp.analysis.reused_ports`|
|Throughput low?|TCP Stream Graphs: throughput, window scaling, tcptrace. Check window scaling in SYN, bytes in flight vs window, RTT|
|MTU black hole?|Large packets with DF set, ICMP type 3 code 4, MSS values, stalls after handshake|
|TLS handshake slow?|Time between ClientHello and ServerHello/Finished, certificate chain size, OCSP/CRL fetches, DNS lookups for revocation|
|Slow SMB/DB/LDAP?|Statistics → Service Response Time per command|
|Jitter/VoIP quality?|Telephony → RTP Streams (jitter, loss), `rtp`|
|Is it the client app?|Zero-window from the client, or long gaps between requests with no network cause|
|Retransmissions on LAN vs WAN?|Capture at both ends and compare timestamps and IP ID|

## 12.2 Useful filters

```
tcp.analysis.flags && !tcp.analysis.window_update          # all problems
tcp.analysis.retransmission || tcp.analysis.fast_retransmission
tcp.analysis.zero_window || tcp.analysis.window_full
tcp.time_delta > 1                                          # >1 s gaps within a TCP stream (needs timestamps pref)
http.time > 2
dns.time > 0.5
frame.time_delta_displayed > 1
tcp.len == 0 && tcp.flags.ack == 1 && tcp.analysis.duplicate_ack
icmp.type == 3 && icmp.code == 4
```

**Where to measure:** capture **close to the client** and **close to the server**; compare. Time delta between packet leaving one point and arriving at the other = path delay. Loss between = appears as missing at the second point.

## 12.3 Interpreting TCP numbers

- **Throughput ≈ window / RTT.** 64 KB window at 100 ms RTT ≈ 5.2 Mbit/s no matter the link speed.
- **Retransmission rate** <1% fine, 1–3% noticeable, >3–5% serious.
- **RTO retransmit (timeout)** hurts far more than fast retransmit.
- **Delayed ACK (~40–200 ms)** + Nagle can cause 200 ms stalls for chatty request/response apps.
- **Zero window** repeating = receiver bottleneck. **Window full** = sender bounded by receiver window.

---

# Part 13: Other tools worth knowing

|Tool|Type|What it's for|Core usage|
|---|---|---|---|
|**Zeek** (ex-Bro)|Network analysis framework|Turns pcap into structured logs: `conn.log`, `dns.log`, `http.log`, `ssl.log`, `x509.log`, `files.log`, `smb_*.log`, `kerberos.log`, `ntlm.log`, `dhcp.log`, `notice.log`, `weird.log`, `pe.log`, `ssh.log`, `rdp.log`. Superb for hunting at scale|`zeek -r f.pcap` (then `zeek-cut`). Example: `zeek-cut id.orig_h id.resp_h id.resp_p duration orig_bytes resp_bytes < conn.log \| sort -k5 -n -r \| head`; DNS: `zeek-cut query qtype_name rcode_name < dns.log \| sort \| uniq -c \| sort -rn \| head`|
|**Suricata / Snort**|IDS/IPS|Rule-based detection; run a pcap through rules to get alerts + EVE JSON|`suricata -r f.pcap -l out/ -k none` then read `out/fast.log`, `eve.json` (`jq 'select(.event_type=="alert")'`). Update rules (ET Open) via `suricata-update`|
|**NetworkMiner**|GUI forensic tool|Auto-extracts hosts/OS, files, images, credentials, DNS, sessions, parameters|Open pcap, browse tabs|
|**tcpflow**|Stream reassembler|Reconstruct TCP flows to files|`tcpflow -r f.pcap -o out/`|
|**ngrep**|grep for network|Regex search live/pcap payloads|`ngrep -I f.pcap -q -W byline 'password\|flag' port 80`|
|**tcpreplay / tcprewrite**|Replay|Replay pcaps into a lab/IDS (rewrite IPs/MACs)|`tcpreplay -i eth1 --topspeed f.pcap`|
|**Scapy** (Python)|Packet crafting/parsing|Custom parsing, forging packets, protocol experiments|`from scapy.all import *; pkts=rdpcap('f.pcap'); pkts.summary()`|
|**Arkime (Moloch)**|Full-packet indexing|Searchable big PCAP store (sessions, tags, hunt)|Deploy with Elasticsearch/OpenSearch|
|**Security Onion**|Distro/NSM stack|Zeek + Suricata + Elastic + PCAP (Stenographer) + hunt UIs|Sensor/analyst platform|
|**RITA / AC-Hunter**|Beacon/threat analytics on Zeek logs|Beaconing, DNS tunnelling, long connections, blacklisted IPs|`rita import /path/zeek-logs dataset && rita show-beacons dataset`|
|**Brim/Zui**|Zeek+Zed GUI|Query pcaps quickly with a search language|Open pcap in app|
|**CyberChef**|Data decoding|base64/hex/XOR/gzip/decrypt/regex chains|Paste extracted blobs|
|**mitmproxy / Burp / ZAP / Fiddler**|Intercepting proxy|Decrypt/inspect/modify HTTP(S) of a client you control|See 8.4|
|**p0f**|Passive OS fingerprinting|Identify OS from SYN/SYN-ACK traits|`p0f -r f.pcap`|
|**nmap / masscan / zmap**|Scanners|Generate scan traffic in a lab to learn signatures. Also `nmap` NSE scripts|Capture while scanning your lab|
|**ssldump**|TLS handshake viewer|Quick handshake dump|`ssldump -r f.pcap`|
|**Argus, nfdump/NfSen, SiLK, pmacct**|Flow tools|Netflow/IPFIX summaries, long-term|Flow collection and queries|
|**termshark**|TUI Wireshark|Wireshark in terminal over SSH|`termshark -r f.pcap`|
|**Wireshark Lua / dissector plugins**|Extensibility|Custom dissectors for proprietary protocols|`Tools → Lua`|
|**Chaosreader, tcptrace, tcpstat, iftop/iptraf/bmon/nethogs**|Misc|Summaries, live bandwidth per host/process||
|**JA3/JA4 tools, HASSH**|Fingerprints|Client/server fingerprinting via Zeek/Arkime/Suricata plugins||
|**hcxpcapngtool, aircrack-ng, hashcat**|Wi-Fi/hash cracking|Crack captured WPA handshakes and NetNTLMv2 (authorised/CTF)|`hashcat -m 22000` / `-m 5600`|
|**Yara/capa/floss/pestudio/oletools**|Malware triage|Analyse extracted files||
|**Shodan/Censys/crt.sh/VirusTotal/AbuseIPDB/URLhaus/GreyNoise/ThreatFox**|Intel|Pivot on IPs, domains, hashes, JA3, certs|Look up _indicators_, not sensitive files|
|**Docker/containers `nsenter`, Linux `ip netns`, `ethtool`, `ss`, `netstat`, `lsof -i`**|Endpoint context|Map ports to processes while capturing|`ss -tulpn`|

### Quick Zeek workflow (high ROI)

```bash
mkdir z && cd z && zeek -C -r ../f.pcap local          # -C ignore checksums
zeek-cut ts id.orig_h id.resp_h id.resp_p proto service duration orig_bytes resp_bytes < conn.log | sort -k8 -n -r | head -20   # biggest uploads
zeek-cut id.orig_h query qtype_name rcode_name < dns.log | sort | uniq -c | sort -rn | head -30
zeek-cut id.orig_h host uri user_agent status_code < http.log | head
zeek-cut id.orig_h id.resp_h server_name ja3 ja3s < ssl.log | sort | uniq -c | sort -rn | head      # needs ja3 package in some versions
zeek-cut fuid tx_hosts rx_hosts mime_type filename sha1 < files.log
cat notice.log weird.log 2>/dev/null | head
```

`conn_state` in `conn.log`: `S0` SYN no reply, `REJ` rejected, `SF` normal, `RSTO/RSTR` reset by orig/resp, `S1`..., and `history` field letters (`ShADadFf`: S=SYN, h=SYN-ACK, A=ACK, D=data, F=FIN, R=RST, upper = originator, lower = responder). Very fast scanning/anomaly detection from `conn_state`.

### Quick Suricata workflow

```bash
suricata -r f.pcap -l out -k none -c /etc/suricata/suricata.yaml
jq -r 'select(.event_type=="alert")|[.timestamp,.src_ip,.dest_ip,.alert.signature]|@tsv' out/eve.json | sort | uniq -c | sort -rn | head
jq -r 'select(.event_type=="tls")|[.src_ip,.dest_ip,.tls.sni,.tls.ja3.hash]|@tsv' out/eve.json | sort | uniq -c | sort -rn | head
```

---

# Part 14: CTF-specific techniques

## 14.1 The CTF mindset

CTF pcaps are designed with **one or more hidden artefacts**: a flag in plain text, a file to extract, credentials to find, an encoded/encrypted blob, or a covert channel. Systematically cover _all layers_.

## 14.2 First 5 minutes

```bash
file f.pcap ; capinfos f.pcap
strings -a -n 6 f.pcap | grep -iE 'flag|ctf|htb|thm|picoctf|\{.*\}' | head
tshark -r f.pcap -q -z io,phs
tshark -r f.pcap -q -z conv,tcp ; tshark -r f.pcap -q -z conv,udp
tshark -r f.pcap -Y 'data' | head          # undissected payload
tshark -r f.pcap -q -z expert
```

Search variants: flag may be base64/hex/rot13/reversed/UTF-16/split across packets. Wireshark `Edit → Find Packet → String` with **Packet bytes** and **Narrow & Wide**.

## 14.3 Where flags/artefacts hide (checklist)

1. **Plaintext in streams:** Follow every TCP/UDP stream (iterate the `Stream:` selector).
2. **HTTP:** headers (custom `X-` headers), cookies, redirects, comments in HTML, hidden form fields, files via Export Objects, `robots.txt`, images (steganography: `steghide`, `zsteg`, `exiftool`, `binwalk`), basic-auth credentials (base64), POST bodies, JWTs.
3. **DNS:** TXT records, subdomain-encoded data (hex/base32/base64), query ordering, `dns.txt`.
4. **ICMP:** payload bytes of echo requests/replies (one char per packet; extract `icmp.data` → hex → ASCII, mind ordering by `icmp.seq`/time).
5. **FTP/Telnet/SMTP/POP/IMAP/TFTP:** credentials and transferred files, e-mail attachments.
6. **Credentials-for-decryption:** a password in one stream decrypts a zip/pdf/file in another (try it); TLS key log or RSA key provided in the challenge → decrypt (Part 8); WPA handshake + wordlist (rockyou) → crack; NTLMv2 hash → crack with hashcat 5600; Kerberos keytab.
7. **Protocol quirks as covert channels:** TCP **urgent pointer**, **initial sequence numbers**, **IP ID**, **TTL values**, **DSCP**, TCP window/reserved bits, source-port values, packet-length sequences (e.g. packet length = ASCII value), **timing** (inter-packet delays as bits), **flag sequences**, UDP payload sizes. Extract the field across packets with tshark `-e` and decode: `tshark -r f.pcap -Y 'icmp' -T fields -e ip.id | ...`.
8. **USB keyboard/mouse captures:** decode HID (7.17). **Bluetooth** audio/keystrokes. **Serial/I2C/SPI** captures converted to pcap.
9. **Audio/video:** RTP → Telephony → RTP Streams → Play/export; RTSP streams. **Images over HTTP/FTP:** carve.
10. **SMB/Windows:** files from shares, usernames, NTLM hashes, **Kerberos** details, registry/SAM dumps over RPC, PowerShell commands in `ScriptBlock`-like HTTP/WinRM payloads (base64 UTF-16LE `-enc`: decode with `base64 -d | iconv -f UTF-16LE -t UTF-8`).
11. **Malware-style pcaps:** identify the infection chain (which host, which download, which C2), answer questions like first malicious IP, user-agent, file hash, domain, C2 interval, decoded config. Hash exported files and use `strings`, VirusTotal (hash lookup), and sandbox.
12. **Mixed protocols over unusual ports:** `Decode As`; custom binary protocol → Follow stream in hex, look for headers/length fields/XOR keys (single-byte XOR brute force in CyberChef; known plaintext like `MZ`, `HTTP/1.1`, `GET` ).
13. **Compression/encoding layers:** gzip/zlib (`1f8b`, `78 9c`), base64 (A–Z a–z 0–9 + / =), hex, URL-encoding, `rot13`, `xor`, `RC4`; chain with CyberChef "Magic".
14. **Timestamps/metadata:** `frame.time` ordering, packet comments in pcapng, interface descriptions, capture file comments (`Statistics → Capture File Properties`).
15. **Deleted/fragmented content:** IP fragments (reassemble: Wireshark does automatically if enabled), out-of-order TCP (reassembly handles), retransmissions containing different data than the original (!) (compare seq-overlapping payloads, since attackers/CTF authors sometimes hide data there).

## 14.4 Typical CTF question patterns and the exact approach

|Question|Approach|
|---|---|
|"What is the attacker's IP?"|Conversations/Endpoints → scan traffic source, or the external IP receiving C2|
|"Which port was open?"|Scan source: SYN/ACK replies (`tcp.flags==0x012 && ip.src==victim`)|
|"What file was downloaded?"|Export Objects → HTTP, or `http.request.uri` list|
|"What credentials were used?"|FTP/HTTP basic/Telnet/SMTP follow stream, `Tools → Credentials`, NTLM|
|"What is the C2 domain?"|DNS queries by infected host preceding odd TCP/TLS conns; SNI; HTTP Host|
|"What is the malware's User-Agent?"|`http.user_agent` unique values per host|
|"What vulnerability was exploited?"|The anomalous request just before reverse shell/callback (URI, header)|
|"What is the first packet/time of X?"|Filter + `frame.time` (UTC), check timezone expectations|
|"How many requests/queries...?"|Display filter then status bar count (or tshark `|
|"What is the hostname/OS/user?"|DHCP, NBNS, Kerberos CName, SMB session setup, HTTP UA, TTL/SYN fingerprint|

---

# Part 15: The master workflow (follow this on any pcap)

## 15.1 Setup (2 min)

```bash
sha256sum f.pcap | tee f.pcap.sha256          # integrity
cp f.pcap work.pcap ; capinfos work.pcap       # metadata
# Wireshark: use "Analysis" profile (columns, UTC time, name resolution OFF for IPs)
```

Write the question list and what's already known.

## 15.2 Big picture (5–10 min)

1. Capture File Properties: duration, packets, drops, snaplen, link type.
2. **Protocol Hierarchy**: expected vs unexpected protocols, "Data", malformed.
3. **Conversations (IPv4, TCP, UDP)** sorted by bytes, packets, duration. Note top pairs, odd ports, long/short sessions, asymmetry.
4. **Endpoints**: top talkers, external IPs, geo/AS.
5. **I/O Graph**: spikes, periodicity, quiet periods.
6. **Expert Info**: errors/warnings summary.
7. **Resolved Addresses**: IP↔name map.

## 15.3 Identify actors and roles

Inventory table: IP, MAC, hostname, OS, user, role (client/server/DC/DNS/gateway/scanner/unknown), internal/external. Sources: DHCP, NBNS, Kerberos, SMB, HTTP UA, TTL, ARP, DNS SRV.

## 15.4 Establish baseline & choose hypotheses

What is "normal talk" here? Pick 3–5 hypotheses ranked by likelihood/impact from step 15.2 observations.

## 15.5 Protocol sweeps (always do all that exist in the capture)

Use Part 7 per-protocol list. Minimum sweep order:

1. **ARP/DHCP/ICMP/LLMNR/NBNS/mDNS** (L2/L3 + local discovery)
2. **DNS** (volume per host, unique names, types, rcodes, entropy, TXT, resolvers, answers)
3. **TCP scanning/flags** (SYN/RST patterns, odd flags, port spread)
4. **HTTP** (hosts, URIs, methods, UAs, status codes, downloads/uploads, auth)
5. **TLS** (SNI, JA3/JA4, certs, versions, no-SNI, odd ports, long sessions) → decrypt if keys exist
6. **Windows/AD**: SMB, Kerberos, NTLM, LDAP, DCE/RPC, WinRM, RDP
7. **Email/FTP/Telnet/SSH/SNMP/DB**
8. **Residual**: `!(known protocols)`, `data`, `_ws.malformed`, rare protocols/ports

## 15.6 Deep dive and verify

For each lead: Follow stream, read payload, extract objects, decode blobs, hash files, confirm with a _second independent signal_ (e.g. DNS + TLS + volume). Try to **disprove** it (is it a CDN, update service, monitoring?).

## 15.7 Pivot and timeline

For every IOC (IP, domain, URL, UA, JA3, hash, account, MAC): search across the capture (`ip.addr==`, `frame contains`, `dns.qry.name contains`, `tls.handshake.ja3 ==`). Add events to a timeline table:

|Time (UTC)|Frame(s)|Source → Dest|Protocol|Event|Evidence/Filter|ATT&CK|
|---|---|---|---|---|---|---|

Typical chain order: recon → delivery/exploit → execution/download → C2 → credential access → discovery → lateral → collection → exfil → cleanup.

## 15.8 Reporting

Include: **scope & method**, **capture details & hash**, **executive summary** (what happened, impact, confidence), **timeline**, **findings** (each with evidence: frame numbers, filter, screenshot, extracted artefact hash), **IOCs** (IPs, domains, URLs, UAs, JA3/JA4, hashes, file names, accounts), **affected assets**, **ATT&CK mapping**, **limitations** (encryption, capture gaps, assumptions), **recommendations** (block/contain, reset credentials, patch, segment, logging/detection improvements, disable LLMNR/NBT-NS/SMBv1, enforce SMB signing, restrict egress, DNS monitoring, deploy TLS inspection or JA3/JA4 alerting). Provide filtered evidence pcaps and the exact commands to reproduce.

## 15.9 When you find nothing

Say so with scope: "No indicators of X observed in the provided capture (Y hours, Z hosts), excluding encrypted payloads." Then list what would increase confidence (keys, host logs, longer capture, other vantage points). A clean result is still a result, but a dishonest "all clear" is worse than "inconclusive".

---

# Part 16: Cheat sheets and reference tables

## 16.1 Common ports (know these, then hunt exceptions)

|Port|Service|Port|Service|
|---|---|---|---|
|20/21|FTP data/control|123/udp|NTP|
|22|SSH/SCP/SFTP|135|MS RPC endpoint mapper|
|23|Telnet|137-139|NetBIOS (NS/DGM/SSN)|
|25 / 465 / 587|SMTP / SMTPS / submission|143 / 993|IMAP / IMAPS|
|53|DNS (udp/tcp)|161/162 udp|SNMP / traps|
|67/68 udp|DHCP|389 / 636|LDAP / LDAPS|
|69 udp|TFTP|443|HTTPS (also QUIC udp)|
|80|HTTP|445|SMB|
|88|Kerberos|500 / 4500 udp|IKE / NAT-T|
|110 / 995|POP3 / POP3S|514 udp|Syslog|
|1433|MSSQL|515/631/9100|LPD / IPP / JetDirect|
|1521|Oracle|1723|PPTP|
|3306|MySQL|1812/1813|RADIUS|
|3389|RDP|1900 udp|SSDP/UPnP|
|5353 udp|mDNS|2049|NFS|
|5355 udp|LLMNR|5432|PostgreSQL|
|5900|VNC|5985 / 5986|WinRM HTTP / HTTPS|
|6379|Redis|6667/6697|IRC / IRC-TLS|
|8080/8443/8000/8888|Alt HTTP(S)|9001/9030|Tor relay/dir|
|27017|MongoDB|3128 / 1080|Squid proxy / SOCKS|
|4444/1337/31337/5555|Classic backdoor/C2/Metasploit defaults, miners|11211|Memcached|
|47808 udp|BACnet|502 / 102 / 20000|Modbus / S7 / DNP3|
|49152-65535|Windows dynamic RPC / ephemeral|2375/2376|Docker API|

## 16.2 TCP flags

|Flags|Hex|Meaning|
|---|---|---|
|SYN|0x002|Open request|
|SYN,ACK|0x012|Open accepted|
|ACK|0x010|Acknowledge|
|PSH,ACK|0x018|Data push|
|FIN,ACK|0x011|Close|
|RST|0x004|Abort|
|RST,ACK|0x014|Reject / closed port|
|NULL|0x000|Scan|
|FIN|0x001|Scan|
|XMAS (FIN,PSH,URG)|0x029|Scan|
|SYN,FIN|0x003|Invalid (evasion/scan)|
|CWR/ECE|0x080/0x040|Congestion notification|

## 16.3 HTTP status quick map

1xx info · **200** OK · 204 no content · 206 partial · **301/302/307/308** redirects · 304 not modified · **400** bad request · **401** auth required/failed · **403** forbidden · **404** not found · 405 method not allowed · 408 timeout · 413 too large · 429 rate-limited · **500** server error · 502/503/504 gateway/unavailable/timeouts.

## 16.4 Wireshark filter quick sheet

```
# Scope
ip.addr==X | ip.src==X | ip.dst==X | eth.addr==M | tcp.port==N | tcp.stream==N | udp.stream==N
frame.time >= "YYYY-MM-DD HH:MM:SS" && frame.time <= "..."
# Noise reduction
!arp && !mdns && !ssdp && !llmnr && !nbns && !dhcp && !stp && !lldp && !icmpv6
tcp.len>0                                  # skip pure ACKs
!tcp.analysis.flags                        # hide TCP problems
# Scans
tcp.flags.syn==1 && tcp.flags.ack==0 | tcp.flags==0x014 | tcp.flags==0x029 | tcp.flags==0x000
icmp.type==8 | icmp.type==3 && icmp.code==3
# DNS
dns.flags.response==0 | dns.flags.rcode==3 | dns.qry.type==16 | dns.qry.name.len>50 | dns.qry.name contains "x"
# HTTP
http.request | http.request.method=="POST" | http.response.code>=400 | http.user_agent contains "x" | http.host contains "x"
http.request.uri contains "x" | http.content_type contains "x" | http.file_data contains "x"
# TLS
tls.handshake.type==1 | tls.handshake.extensions_server_name contains "x" | tls.handshake.type==11 | tls.alert_message
tls && !(tcp.port==443) | tls.handshake.ja3 == "<hash>"
# Windows
smb2 | smb2.cmd==5 | smb2.filename contains "x" | ntlmssp | kerberos | ldap | dcerpc | drsuapi | rdp
# Cleartext creds
ftp.request.command=="PASS" | telnet | http.authorization | pop.request.command=="PASS" | smtp contains "AUTH"
# Unknown/odd
data | _ws.malformed | _ws.expert.severity==error | !(tcp.port in {80 443 53 22 25 445 3389})
# Search
frame contains "str" | frame matches "(?i)regex" | tcp.payload contains "str" | tcp.payload[0:2]==4d:5a
```

## 16.5 tcpdump quick sheet

```bash
tcpdump -D                                  # interfaces
tcpdump -i eth0 -nn -s0 -w out.pcap         # capture
tcpdump -nn -r f.pcap -tttt                 # read with dates
tcpdump -nn -r f.pcap 'host X and port 80'  # filter on read
tcpdump -nn -A -r f.pcap 'tcp port 80'      # ASCII payload
tcpdump -nn -X -r f.pcap                    # hex+ASCII
tcpdump -nn -e -r f.pcap arp                # with MACs
tcpdump -i eth0 -C 100 -W 10 -w ring.pcap   # ring buffer
tcpdump -nn 'tcp[tcpflags]==tcp-syn'        # SYN only
tcpdump -nn 'tcp[tcpflags] & tcp-rst != 0'  # RSTs
tcpdump -nn 'icmp[icmptype]==8'             # pings
tcpdump -nn 'udp port 53'                   # DNS
tcpdump -nn 'greater 1400'                  # big packets
tcpdump -nn -r f.pcap -w sub.pcap 'host X'  # carve a subset
```

## 16.6 DNS / ICMP / TLS-alert numeric cheats

- DNS types: A1 NS2 CNAME5 SOA6 PTR12 MX15 TXT16 AAAA28 SRV33 NULL10 HTTPS65 IXFR251 AXFR252 ANY255. RCODE: 0 NOERROR, 1 FORMERR, 2 SERVFAIL, 3 NXDOMAIN, 4 NOTIMP, 5 REFUSED.
- ICMP: 0 echo reply, 3 unreachable (0 net,1 host,3 port,4 frag-needed), 5 redirect, 8 echo, 11 TTL exceeded.
- TLS alerts: 10 unexpected_message, 20 bad_record_mac, 40 handshake_failure, 42 bad_certificate, 44 certificate_revoked, 45 expired, 46 unknown, 48 unknown_ca, 70 protocol_version, 80 internal_error, 90 user_canceled, 112 unrecognized_name.
- TLS versions: 0x0301 TLS1.0, 0x0302 TLS1.1, 0x0303 TLS1.2 (also record-version for 1.3), 0x0304 TLS1.3 (in supported_versions).
- Windows event ↔ wire: Logon type 3 ≈ SMB/RPC network logon (NTLM/Kerberos), type 10 ≈ RDP.
- Initial TTL guess: observed TTL → round up to 32/64/128/255; (hops = initial − observed).

## 16.7 Useful tshark `-e` fields (verify names for your version with `tshark -G fields`)

`frame.number frame.time_epoch frame.len ip.src ip.dst ip.ttl ip.id tcp.srcport tcp.dstport tcp.stream tcp.flags tcp.seq tcp.ack tcp.window_size tcp.len tcp.payload udp.srcport udp.dstport udp.length dns.qry.name dns.qry.type dns.a dns.aaaa dns.cname dns.txt dns.flags.rcode http.host http.request.uri http.request.full_uri http.request.method http.user_agent http.cookie http.set_cookie http.response.code http.content_type http.content_length http.file_data tls.handshake.extensions_server_name tls.handshake.ja3 tls.handshake.ja3s tls.handshake.version tls.handshake.ciphersuite smb2.filename smb2.cmd ntlmssp.auth.username ntlmssp.auth.domain kerberos.CNameString kerberos.SNameString kerberos.etype dhcp.option.hostname dhcp.hw.mac_addr arp.src.hw_mac arp.src.proto_ipv4 icmp.type icmp.code icmp.data ftp.request.command ftp.request.arg smtp.req.parameter usb.capdata`

---

# Part 17: Pitfalls, legal and ethical notes

## 17.1 Common analyst mistakes

1. Starting at packet 1 instead of statistics.
2. Trusting port numbers or protocol labels.
3. Counting responses as queries (use `dns.flags.response==0`, `http.request`).
4. Misreading `ip.addr != x` semantics (older versions) and relying on `contains` for split-across-packets strings.
5. Forgetting that **name resolution** can leak your analysis to attackers.
6. Treating retransmissions/bad checksums from capture offload as attacks.
7. Ignoring time zones and clock skew when merging sources.
8. Concluding "benign" because it's a famous domain, or "malicious" because it's rare.
9. Not checking _directions_ (who initiated), asymmetry, and the sequence of events.
10. Overlooking encrypted DNS/QUIC/VPN paths that bypass your visibility.
11. Failing to record the filters/commands used. Findings must be reproducible.
12. Running extracted files on the host machine.
13. Not validating tooling output: tshark/Wireshark dissector quirks vary by version. Verify in the hex.
14. Over-filtering during capture (data lost forever).
15. Neglecting to correlate with host/logs/threat intel.

## 17.2 Legal and ethical rules

- Capture and analyse **only networks you own or are explicitly authorised to monitor**. Wiretap, interception and privacy laws (Kenya's Data Protection Act 2019 and Computer Misuse and Cybercrimes Act, GDPR, ECPA/Wiretap Act in the US, and equivalents) can make unauthorised capture a crime.
- Pcaps contain **personal data and credentials**. Minimise, protect (encrypt at rest), restrict access, redact when sharing, define retention.
- Cracking captured credentials or decrypting traffic is only appropriate in **authorised engagements, labs, or CTFs**.
- For bug bounty/pentest, stay within the scope document. Document consent.
- Practise on legal material: **Malware-Traffic-Analysis.net** exercises, **Wireshark sample captures (wiki.wireshark.org/SampleCaptures)**, **CTF pcaps (picoCTF, HTB Sherlocks/challenges, TryHackMe network rooms such as Wireshark 101/Traffic Analysis, BlueTeamLabs Online, CyberDefenders, Netresec capture file collection, PacketTotal sample sets)**, and your own isolated lab (Kali + victim VMs, capture while running nmap, Hydra, Responder, Metasploit, ncat reverse shells, `dnscat2`/`iodine` tunnels, so you learn exactly what attacks look like on the wire).

## 17.3 Recommended practice path

1. Capture your own browsing; read DNS → TCP handshake → TLS → HTTP/2. Decrypt with `SSLKEYLOGFILE`.
2. Run nmap (SYN, connect, UDP, `-A`) at a lab VM and study each scan's signature.
3. Brute-force a lab SSH/FTP/HTTP login with Hydra; identify it in Conversations, Expert Info, I/O graph.
4. Run Responder in a lab and trigger LLMNR; capture NTLMv2 and the poisoning sequence.
5. Set up a DNS tunnel (`iodine`/`dnscat2`) and compare against normal DNS stats.
6. Do 10 malware-traffic-analysis exercises, writing a one-page report for each.
7. Re-run the same pcaps through Zeek and Suricata and compare to your manual findings.
8. Automate your standard triage with a tshark/Zeek script (so the first 10 minutes are one command).

---

_End of guide. Treat it as a living document: add your own filters, lab observations, and false-positive lists as you learn each environment's baseline._