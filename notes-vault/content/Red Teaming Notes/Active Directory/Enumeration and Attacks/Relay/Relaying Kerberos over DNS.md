---
created: 2025-10-31
modified: 2025-10-31
---

#kerberosRelayOverDNS

Tools used : `krbrelayx` and` mitm6`
## Introduction

Kerberos relay over DNS leverages Windows’ dynamic DNS behavior to convert routine hostname updates into a powerful authentication primitive: by coercing a client to perform a GSS-TSIG (TKEY) update to an attacker-controlled DNS endpoint, an on-link attacker can capture the client’s AP-REQ (the service ticket + authenticator) and attempt to reuse that Kerberos context against other domain services. What looks like a simple DNS interaction on the wire—an SOA probe followed by a TKEY carrying a GSS blob—becomes a gateway to lateral movement and privilege escalation when combined with SPN canonicalization and permissive endpoints (e.g., AD CS, WinRM, SMB). The rest of these notes explains the packet-level flow, the two historical barriers (integrity-triggered LDAP signing and dns/SPN specificity), how modern research bypasses them, concrete attack targets, and practical mitigations.

## DNS Dynamic Update

Windows clients in an Active Directory environment automatically attempt to register their hostnames via dynamic DNS updates, governed by RFC 3645. When a machine like `WORKSTATION01.corp.local` boots, it queries its configured DNS server with an SOA record for its own FQDN and follows up with a TKEY record to perform GSS-TSIG authentication if needed. An attacker running **mitm6** on the same (V)LAN can impersonate the primary DNS server by responding to DHCPv6 Router Advertisements and NDP Neighbor Solicitations, tricking the client into directing its update to the attacker’s IP. The attacker then refuses the initial unsigned update with an NXDOMAIN response, prompting the client to fall back to Kerberos-based authentication.

At this point, the client constructs a **TGS-REQ** for the service principal name `dns/fake-dns.corp.local` and embeds the resulting **AP-REQ** inside the TKEY additional data. The authenticator within this AP-REQ includes GSS-API context flags, and in the case of Windows dynamic updates, the **integrity** bit is always set. For example, the raw GSS-API flags octet might appear as `0x3C`, which breaks down in binary to `00111100`—indicating **Confidentiality**, **Integrity**, **Sequence**, and **Replay** protection are all requested. This integrity flag becomes the first major roadblock when attempting to relay the ticket.

Key packet: TKEY query (GSS-API)

```
Query: victim-pc.corp.local IN SOA
TKEY: 
  Algorithm: gss-tsig
  Key: <GSS-API blob>
    → AP-REQ
      → Authenticator (with flags)
      → Ticket (encrypted to DNS server’s krbtgt hash)
```

## Relay Barriers

#### LDAP Integrity Enforcement

Historically, relaying this ticket to LDAP on a domain controller failed because Windows maps the presence of the integrity flag to mandatory LDAP signing. Once the DC accepts the relayed AP-REQ and completes the bind, every subsequent LDAP message—such as a `SearchRequest` or `ModifyRequest`—must include a valid cryptographic signature (MIC) computed using the session key embedded in the service ticket. Since the relay attacker never decrypts the ticket (it is encrypted with the DNS server’s long-term key), the session key remains inaccessible, and the attacker cannot produce valid signatures. The connection stalls immediately after the bind, rendering traditional LDAP-based privilege escalation impossible.

#### SPN specificity

The second obstacle, SPN specificity, arises because the victim client explicitly requests a Kerberos service ticket for `dns/fake-dns.corp.local` — an SPN tied to the DNS service class. In Active Directory, only computer accounts running the DNS Server role (typically a few domain controllers) register this SPN. You can verify this with `setspn -Q dns/dc01.corp.local`, which returns a match on the DC’s object, but `setspn -Q dns/workstation01.corp.local` returns nothing, as workstations never host the DNS service. This restriction meant the relayed ticket could only be used against those few DNS-enabled hosts, severely limiting the attack surface and rendering the technique impractical in most environments.


## Bypassing the Relay Barriers

#### AD CS Ignoring GSS Integrity Enforcement

**AD CS (Active Directory Certificate Services)** serves as a high-value target that accepts Kerberos authentication without enforcing per-message signing, even when the client’s AP-REQ includes the integrity flag. The CA’s **RPC and HTTP enrollment interfaces**—such as `ICertPassage`, `ICertRequestD`, and the web enrollment endpoint `/certsrv`—operate under the CA server’s computer account (typically running as SYSTEM on a domain controller). These interfaces **validate the Kerberos service ticket strictly for identity and authorization**: they confirm the ticket is encrypted to the CA’s account, not expired, and that the requesting principal has enrollment permissions based on certificate templates.

Crucially, **AD CS does not require GSS-API Message Integrity Codes (MICs) on each subsequent RPC or HTTP request**, unlike LDAP, which mandates signed messages when the integrity flag is present. This means that even though the client requested integrity protection in the original TKEY authenticator (e.g., GSS-API flags 0x3C), the CA does **not** demand cryptographic signatures on calls like `ICertRequestD::Request()` or web enrollment POSTs. As a result, **a relayed AP-REQ—captured from the DNS update—can fully drive certificate issuance**.

#### SPN Canonicalization

Second, Kerberos **service class canonicalization**—documented by James Forshaw—reveals that the `dns` service class implicitly maps to the generic `HOST` class during ticket validation. This means a ticket requested for `dns/dc01.corp.local` is also valid for `HOST/dc01.corp.local`, and crucially, **every domain-joined computer account** automatically registers `HOST/<fqdn>` SPNs upon joining the domain. For instance, `WORKSTATION01` has `HOST/WORKSTATION01` and `HOST/WORKSTATION01.corp.local` by default, as does `FILESERVER02` with `HOST/FILESERVER02.corp.local`. Other service classes exhibit similar behavior: `cifs/share01.corp.local` maps to `HOST/share01.corp.local`, and `http/web01.corp.local` maps to `HOST/web01.corp.local`. This mapping explodes the relay surface from a few DNS servers to **every machine in the domain**.

```bash
dns/<name>      →    HOST/<name>
cifs/<name>     →    HOST/<name>
http/<name>     →    HOST/<name>
msdfs/<name>    →    HOST/<name>
...
```

With these insights, the full attack chain becomes devastatingly simple. The attacker uses **krbrelayx.py** to capture the AP-REQ from the TKEY query and immediately forwards it to a chosen target. If a vulnerable CA is present, the command `krbrelayx.py -t https://ca.corp.local --adcs --template VulnWebEnrollment` triggers certificate enrollment and yields a domain admin certificate. Alternatively, relaying to `WinRM` on any workstation (`winrm/workstation01.corp.local`) grants a `SYSTEM` shell, since WinRM accepts the `HOST/` ticket and does not require signing by default. Even SMB relaying works if channel signing is disabled: `smb://fileserver01.corp.local` accepts the relayed ticket and allows file operations as the client machine.

> [!summary]
> In summary, what once appeared as two insurmountable walls—**mandatory LDAP signing due to the integrity flag** and **SPN confinement to DNS servers**—are now bypassed entirely. The integrity flag no longer blocks relaying because **AD CS ignores per-message signing**, and the `dns/` SPN limitation vanishes because **Kerberos maps it to `HOST/`**, a universal SPN present on every computer account. The result is a near-universal privilege escalation vector in modern Active Directory environments, requiring only network access and no user interaction.


Reference:
https://dirkjanm.io/relaying-kerberos-over-dns-with-krbrelayx-and-mitm6/

You can also read:
[[Relaying Kerberos over SMB using krbrelayx]]
