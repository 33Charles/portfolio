#kerberosRelayOverSMB

> [!NOTE]
> The AD CS service  by default vulnerable to relay attacks since it does not enforce signing with HTTP.

## Introduction

Kerberos authentication relay over SMB was long considered impossible due to the strict binding of service principal names (SPNs) and the requirement for encryption or signing in most environments. However, researchers like James Forshaw discovered a clever workaround using the Windows API function `CredMarshalTargetInfo`. 

### CredMarshalTargetInfo

In his blogpost, James Forshaw showed that when an SMB client builds the SPN from the service class and name, the [SecMakeSPNEx2](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-secmakespnex2) method is called. For the hostname `dc-02` and service class `cifs`, the returned SPN will look like the following:

```
cifs/dc-021UWhRCAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAdc-01BAAAA
```

The `SecMakeSPNEx2` function makes a call to the API function [`CredMarshalTargetInfo`](https://learn.microsoft.com/en-us/windows/win32/api/ntsecpkg/nf-ntsecpkg-credmarshaltargetinfo). This API takes a list of target information in a [`CREDENTIAL_TARGET_INFORMATION`](https://learn.microsoft.com/en-us/windows/win32/api/wincred/ns-wincred-credential_target_informationw) structure, marshals it using Base64 encoding and appends it to the end of the real SPN.

This function allows us to embed a specially crafted, Base64-encoded blob into a DNS hostname. When a client resolves this long, unusual name—such as `dc-021UWhRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYBAAAA`—and initiates an SMB connection, the Windows SMB client automatically calls `CredUnmarshalTargetInfo` to parse the suffix. The client then strips away the marshaled portion, reconstructing the original SPN (e.g., `cifs/dc-01`) before requesting a Kerberos ticket from the domain controller. As a result, the KDC issues a legitimate ticket for the real domain controller, even though the client is connecting to the attacker's machine. This enables the attacker to receive and relay a valid Kerberos AP-REQ message without triggering SPN mismatches or DNS conflicts.

The primary purpose of the **CredMarshalTargetInfo trick** is to **bypass DNS name conflicts** while **coercing victims to request Kerberos tickets for high-value, real services** like a domain controller . For example, when we wants to relay authentication from a compromised workstation to the Active Directory Certificate Services (ADCS) web endpoint to obtain a Domain Controller certificate. We cannot simply add a DNS A-record for `dc-02` because it already points to the legitimate domain controller. Instead, we generate the minimal 44-character marshaled blob using `CredMarshalTargetInfo` with a dummy target name, resulting in `1UWhRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYBAAAA`. We then prepend the real short name (`dc-02`) and register `dc-021UWhRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYBAAAA` in DNS pointing to our relay server. When a coercion tool like PetitPotam forces the compromised machine (eg `web-01`) to connect to this long name, the client resolves it to the attacker’s IP, connects via SMB, and—thanks to the unmarshaling logic—requests a ticket for `cifs/dc-02`. Our relay tool (`krbrelayx`) captures this ticket and forwards it to the ADCS HTTP interface, which accepts unsigned Kerberos by default, granting a certificate for the machine account (eg `web-01$`) that can be used to request a TGT. ie with the certificate we can be able to extract the machine account's NT hash which can be used to forge sliver tickets, for example a ticket for administrator for SPN eg `cifs/web-01.domain.local`. With the administrator ticket we can dump hashes in `web-01` and perform more privileged attackers.


> [!question]
> Yeah I can't help but ask .. if we can coerce authentication from `web-01` to `dc-02` and end up fully compromising `web-01` how about we coerce authentication from `dc-02` to `dc-02`. Will we end up having a certificate for `dc-02` machine account, `dc-02$` ? 
> 
> **Only on unpatched, poorly hardened systems — not after Microsoft’s June 2025 patch.** In labs prior to patching you could coerce a host to authenticate to itself (a “reflective” or loopback relay) and, in some scenarios, obtain machine certificates or SYSTEM on that host; CVE-2025-33073 re-enabled these reflective-relay behaviors for both NTLM and Kerberos until Microsoft fixed the SMB client logic in June 2025. [Microsoft Security Response Center+1](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2025-33073?utm_source=chatgpt.com)
> 
> **Reflective relay** is when an attacker forces a Windows host to initiate authentication to a malicious SMB endpoint and then **reflects** or **relays** the captured authentication back at the originating host (or to another accepting service) so that the host’s own credentials are abused against itself. This differs from a straight relay (victim → attacker → third service) because the victim’s auth is used in a loopback/reflective way against the victim. In practice this can yield local SYSTEM execution (NTLM reflection) or certificate/TGT abuse (Kerberos relay to ADCS) in environments that do not enforce signing or other protections.
> 
> Further reading:
> https://www.guidepointsecurity.com/blog/the-birth-and-death-of-loopyticket/
> https://blog.redteam-pentesting.de/2025/reflective-kerberos-relay-attack/
> https://www.synacktiv.com/en/publications/ntlm-reflection-is-dead-long-live-ntlm-reflection-an-in-depth-analysis-of-cve-2025


This technique succeeds because **Windows clients trust the marshaled target info suffix** and **automatically normalize the SPN** before Kerberos processing. Tools like `krbrelayx` and `KrbRelay-SMBServer` exploit this by implementing full SMB Kerberos negotiation, extracting the AP-REQ from the `SESSION_SETUP` request, and relaying it to HTTP, LDAP, or other services that do not enforce signing. The beauty lies in its simplicity: no man-in-the-middle on DNS, no DHCPv6 spoofing—just one DNS record and any coercion method (PetitPotam, DFSCoerce, PrinterBug). Defenders can mitigate this by enabling SMB and Kerberos signing, monitoring DNS for names containing `1UWhR`, and requiring signing on sensitive services like ADCS. But in unhardened environments, this trick turns a low-privilege foothold into domain dominance in under a minute.

Reference
https://www.synacktiv.com/en/publications/relaying-kerberos-over-smb-using-krbrelayx


You can also read [[Relaying Kerberos over DNS]]

