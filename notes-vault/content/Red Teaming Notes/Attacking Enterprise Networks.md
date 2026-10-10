
We are given a scenario and the scope 

|**External Testing**|**Internal Testing**|
|---|---|
|10.129.x.x ("external" facing target host)|172.16.8.0/23|
|*.inlanefreight.local (all subdomains)|172.16.9.0/23|
||INLANEFREIGHT.LOCAL (Active Directory domain)|
# External Testing
## External Information Gathering

### Port scan with Nmap
Start with an Nmap scan we are provided with the external facing host's ip address 

```bash
sudo nmap -Pn -sCV -p- --min-rate 1000 -T2 -oN 10.129.229.147-port-scan 10.129.229.147             
[sudo] password for darklight: 
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-04 12:51 EAT
Warning: 10.129.229.147 giving up on port because retransmission cap hit (10).
Stats: 0:01:32 elapsed; 0 hosts completed (1 up), 1 undergoing SYN Stealth Scan
SYN Stealth Scan Timing: About 57.58% done; ETC: 12:53 (0:01:08 remaining)
Nmap scan report for 10.129.229.147
Host is up (0.46s latency).
Not shown: 65524 closed tcp ports (reset)
PORT     STATE SERVICE  VERSION
21/tcp   open  ftp      vsftpd 3.0.3
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_-rw-r--r--    1 0        0              38 May 30  2022 flag.txt
| ftp-syst: 
|   STAT: 
| FTP server status:
|      Connected to ::ffff:10.10.16.31
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      At session startup, client count was 1
|      vsFTPd 3.0.3 - secure, fast, stable
|_End of status
22/tcp   open  ssh      OpenSSH 8.2p1 Ubuntu 4ubuntu0.5 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 71:08:b0:c4:f3:ca:97:57:64:97:70:f9:fe:c5:0c:7b (RSA)
|   256 45:c3:b5:14:63:99:3d:9e:b3:22:51:e5:97:76:e1:50 (ECDSA)
|_  256 2e:c2:41:66:46:ef:b6:81:95:d5:aa:35:23:94:55:38 (ED25519)
25/tcp   open  smtp     Postfix smtpd
|_smtp-commands: ubuntu, PIPELINING, SIZE 10240000, VRFY, ETRN, STARTTLS, ENHANCEDSTATUSCODES, 8BITMIME, DSN, SMTPUTF8, CHUNKING
53/tcp   open  domain   (unknown banner: 1337_HTB_DNS)
| fingerprint-strings: 
|   DNSVersionBindReqTCP: 
|     version
|     bind
|_    1337_HTB_DNS
| dns-nsid: 
|_  bind.version: 1337_HTB_DNS
80/tcp   open  http     Apache httpd 2.4.41 ((Ubuntu))
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-title: Inlanefreight
110/tcp  open  pop3     Dovecot pop3d
|_ssl-date: TLS randomness does not represent time
|_pop3-capabilities: UIDL AUTH-RESP-CODE RESP-CODES SASL STLS PIPELINING TOP CAPA
| ssl-cert: Subject: commonName=ubuntu
| Subject Alternative Name: DNS:ubuntu
| Not valid before: 2022-05-30T17:15:40
|_Not valid after:  2032-05-27T17:15:40
111/tcp  open  rpcbind  2-4 (RPC #100000)
| rpcinfo: 
|   program version    port/proto  service
|   100000  2,3,4        111/tcp   rpcbind
|   100000  2,3,4        111/udp   rpcbind
|   100000  3,4          111/tcp6  rpcbind
|_  100000  3,4          111/udp6  rpcbind
143/tcp  open  imap     Dovecot imapd (Ubuntu)
| ssl-cert: Subject: commonName=ubuntu
| Subject Alternative Name: DNS:ubuntu
| Not valid before: 2022-05-30T17:15:40
|_Not valid after:  2032-05-27T17:15:40
|_imap-capabilities: Pre-login more SASL-IR ENABLE capabilities post-login listed ID OK have IMAP4rev1 LOGINDISABLEDA0001 IDLE LITERAL+ STARTTLS LOGIN-REFERRALS
|_ssl-date: TLS randomness does not represent time
993/tcp  open  ssl/imap Dovecot imapd (Ubuntu)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=ubuntu
| Subject Alternative Name: DNS:ubuntu
| Not valid before: 2022-05-30T17:15:40
|_Not valid after:  2032-05-27T17:15:40
|_imap-capabilities: AUTH=PLAINA0001 SASL-IR ENABLE more listed post-login ID OK have capabilities Pre-login IMAP4rev1 LITERAL+ IDLE LOGIN-REFERRALS
995/tcp  open  ssl/pop3 Dovecot pop3d
|_pop3-capabilities: UIDL AUTH-RESP-CODE RESP-CODES USER SASL(PLAIN) PIPELINING TOP CAPA
| ssl-cert: Subject: commonName=ubuntu
| Subject Alternative Name: DNS:ubuntu
| Not valid before: 2022-05-30T17:15:40
|_Not valid after:  2032-05-27T17:15:40
|_ssl-date: TLS randomness does not represent time
8080/tcp open  http     Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Support Center
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-open-proxy: Proxy might be redirecting requests
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port53-TCP:V=7.95%I=7%D=9/4%Time=68B961C5%P=x86_64-pc-linux-gnu%r(DNSVe
SF:rsionBindReqTCP,39,"\x007\0\x06\x85\0\0\x01\0\x01\0\0\0\0\x07version\x0
SF:4bind\0\0\x10\0\x03\xc0\x0c\0\x10\0\x03\0\0\0\0\0\r\x0c1337_HTB_DNS");
Service Info: Host:  ubuntu; OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 427.47 seconds                                                  
```

From the ouptput we identify that port 53 is open, which is responsible for answering DNS queries.  Beside it we get the answer to our first question.

### DNS zone transfer 

Since we have identified that port 53 is open, let's try a DNS Zone Transfer to see if we can enumerate any valid subdomains for further exploration and expand our testing scope. We know from the scoping sheet that the primary domain is **`INLANEFREIGHT.LOCAL`**, so let's see what we can find.

#### Using dig

```bash
dig axfr @10.129.229.147 inlanefreight.local

 <<>> DiG 9.20.11-4+b1-Debian <<>> axfr @10.129.229.147 inlanefreight.local
; (1 server found)
;; global options: +cmd
inlanefreight.local.	86400	IN	SOA	ns1.inlanfreight.local. dnsadmin.inlanefreight.local. 21 604800 86400 2419200 86400
inlanefreight.local.	86400	IN	NS	inlanefreight.local.
inlanefreight.local.	86400	IN	A	127.0.0.1
blog.inlanefreight.local. 86400	IN	A	127.0.0.1
careers.inlanefreight.local. 86400 IN	A	127.0.0.1
dev.inlanefreight.local. 86400	IN	A	127.0.0.1
flag.inlanefreight.local. 86400	IN	TXT	"HTB{DNs_ZOn3_Tr@nsf3r}"
gitlab.inlanefreight.local. 86400 IN	A	127.0.0.1
ir.inlanefreight.local.	86400	IN	A	127.0.0.1
status.inlanefreight.local. 86400 IN	A	127.0.0.1
support.inlanefreight.local. 86400 IN	A	127.0.0.1
tracking.inlanefreight.local. 86400 IN	A	127.0.0.1
vpn.inlanefreight.local. 86400	IN	A	127.0.0.1
inlanefreight.local.	86400	IN	SOA	ns1.inlanfreight.local. dnsadmin.inlanefreight.local. 21 604800 86400 2419200 86400
;; Query time: 232 msec
;; SERVER: 10.129.229.147#53(10.129.229.147) (TCP)
;; WHEN: Thu Sep 04 12:53:44 EAT 2025
;; XFR size: 14 records (messages 1, bytes 448)

```

#### Using host

```bash
host -l inlanefreight.local 10.129.229.147
Using domain server:
Name: 10.129.229.147
Address: 10.129.229.147#53
Aliases: 

inlanefreight.local name server inlanefreight.local.
inlanefreight.local has address 127.0.0.1
blog.inlanefreight.local has address 127.0.0.1
careers.inlanefreight.local has address 127.0.0.1
dev.inlanefreight.local has address 127.0.0.1
gitlab.inlanefreight.local has address 127.0.0.1
ir.inlanefreight.local has address 127.0.0.1
status.inlanefreight.local has address 127.0.0.1
support.inlanefreight.local has address 127.0.0.1
tracking.inlanefreight.local has address 127.0.0.1
vpn.inlanefreight.local has address 127.0.0.1
```

#### Using dnsrecon

```bash
 dnsrecon -d inlanefreight.local -t axfr -n 10.129.229.147
[*] Checking for Zone Transfer for inlanefreight.local name servers
[*] Resolving SOA Record
[-] Exception "The DNS operation timed out." while resolving SOA record.
[-] Error while resolving SOA while using 10.129.229.147 as nameserver.
[*] Resolving NS Records
[*] NS Servers found:
[+] 	 NS inlanefreight.local 127.0.0.1
[*] Removing any duplicate NS server IP Addresses...
[*]  
[*] Trying NS server 127.0.0.1
[-] Zone Transfer Failed for 127.0.0.1!
[-] Port 53 TCP is being filtered

```


The zone transfer works, and we find 9 additional subdomains. In a real-world engagement, if a DNS Zone Transfer is not possible, we could enumerate subdomains in many ways. The [DNSDumpster.com](https://dnsdumpster.com/) website is a quick bet.

Lets add the subdomains to our /etc/hosts file 

```bash
cat subdomains.dump | awk '{print $1}'| tail -n +2 | tr  '\n' ' ' 
inlanefreight.local blog.inlanefreight.local careers.inlanefreight.local dev.inlanefreight.local gitlab.inlanefreight.local ir.inlanefreight.local status.inlanefreight.local support.inlanefreight.local tracking.inlanefreight.local vpn.inlanefreight.local                                                                                                                                         
┌──(darklight㉿jinx)-[~/Documents/ctf/htb/academy]
└─$ echo '10.129.229.147 inlanefreight.local blog.inlanefreight.local careers.inlanefreight.local dev.inlanefreight.local gitlab.inlanefreight.local ir.inlanefreight.local status.inlanefreight.local support.inlanefreight.local tracking.inlanefreight.local vpn.inlanefreight.local' | sudo tee -a /etc/hosts
[sudo] password for darklight: 
10.129.203.101 inlanefreight.local blog.inlanefreight.local careers.inlanefreight.local dev.inlanefreight.local gitlab.inlanefreight.local ir.inlanefreight.local status.inlanefreight.local support.inlanefreight.local tracking.inlanefreight.local vpn.inlanefreight.local

```
### VHost Discovery

```bash
ffuf -u http://10.129.229.147 -w /usr/share/wordlists/SecLists/Discovery/DNS/namelist.txt -H "HOST: FUZZ.inlanefreight.local" -fs 15157 -c 

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://10.129.229.147
 :: Wordlist         : FUZZ: /usr/share/wordlists/SecLists/Discovery/DNS/namelist.txt
 :: Header           : Host: FUZZ.inlanefreight.local
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
 :: Filter           : Response size: 15157
________________________________________________

blog                    [Status: 200, Size: 8708, Words: 1509, Lines: 232, Duration: 3824ms]
careers                 [Status: 200, Size: 51806, Words: 22041, Lines: 732, Duration: 3443ms]
dev                     [Status: 200, Size: 2048, Words: 643, Lines: 74, Duration: 3310ms]
gitlab                  [Status: 302, Size: 113, Words: 5, Lines: 1, Duration: 554ms]
ir                      [Status: 200, Size: 28548, Words: 2885, Lines: 210, Duration: 1797ms]
monitoring              [Status: 200, Size: 56, Words: 3, Lines: 4, Duration: 823ms]
[SNIP]
```

We have one vhost (monitoring) that was not part of the results from the DNS zone transfer.
Add it to our hosts file.

## Service Enumeration & Exploitation

From our nmap result we had this ports open 

```bash
21/tcp   open  ftp      vsftpd 3.0.3
22/tcp   open  ssh      OpenSSH 8.2p1 Ubuntu 4ubuntu0.5 (Ubuntu Linux; protocol 2.0)
25/tcp   open  smtp     Postfix smtpd
53/tcp   open  domain   (unknown banner: 1337_HTB_DNS)
80/tcp   open  http     Apache httpd 2.4.41 ((Ubuntu))
110/tcp  open  pop3     Dovecot pop3d
111/tcp  open  rpcbind  2-4 (RPC #100000)
143/tcp  open  imap     Dovecot imapd (Ubuntu)
993/tcp  open  ssl/imap Dovecot imapd (Ubuntu)
995/tcp  open  ssl/pop3 Dovecot pop3d
8080/tcp open  http     Apache httpd 2.4.41 ((Ubuntu))
```

### FTP 

From our initial nmap scan we know that the FTP server allows anonymous authentication.

```bash
ftp 10.129.40.67            
Connected to 10.129.40.67.
220 (vsFTPd 3.0.3)
Name (10.129.40.67:darklight): anonymous
331 Please specify the password.
Password: 
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
229 Entering Extended Passive Mode (|||44590|)
150 Here comes the directory listing.
-rw-r--r--    1 0        0              38 May 30  2022 flag.txt
226 Directory send OK.
ftp>
```

we just have one file.

We also have the version of the FTP server `vsftpd 3.0.3`, we can look for known exploit for this specific version.

```bash
 searchsploit vsftpd 3.0.3
-------------------------------------------- ---------------------------------
 Exploit Title                              |  Path
-------------------------------------------- ---------------------------------
vsftpd 3.0.3 - Remote Denial of Service     | multiple/remote/49719.py
-------------------------------------------- ---------------------------------
Shellcodes: No Results
```

we just have one exploit but it wouldn't be apropriate to exploit this in a pentest engagement.
We could check for exploit such as FTP bounce attack but we need to know the internal network infrastruture to expploit this ..
https://www.geeksforgeeks.org/computer-networks/what-is-ftp-bounce-attack/

### SMTP 

SMTP is interesting. In a real-world assessment, we could use a website such as [MXToolbox](https://mxtoolbox.com/) or the tool `dig` to enumerate MX Records.

from our nmap scan we get a lsi of comands we can run.

```bash
25/tcp   open  smtp     Postfix smtpd
|_smtp-commands: ubuntu, PIPELINING, SIZE 10240000, VRFY, ETRN, STARTTLS, ENHANCEDSTATUSCODES, 8BITMIME, DSN, SMTPUTF8, CHUNKING
```

We can use `VRFY` to enumarate valid users.

```bash
telnet 10.129.40.67 25                            
Trying 10.129.40.67...
Connected to 10.129.40.67.
Escape character is '^]'.
V220 ubuntu ESMTP Postfix (Ubuntu)
VRFY www-data
502 5.5.2 Error: command not recognized
VRFY www-data
252 2.0.0 www-data
VRFY root
252 2.0.0 root
VRFY yisdf  
550 5.1.1 <yisdf>: Recipient address rejected: User unknown in local recipient table
VRFY john
550 5.1.1 <john>: Recipient address rejected: User unknown in local recipient table
```

This could potentially be leveraged to gather a list of users we could use to mount a password brute-forcing attack against the FTP and SSH services and perhaps others. Though this is relatively low-risk, it's worth noting down as a `Low` finding for our report as our clients should reduce their external attack surface as much as possible.

We could attempt to enumerate more users with a tool such as [smtp-user-enum](https://github.com/pentestmonkey/smtp-user-enum) to drive the point home and potentially find more users. It's typically not worth spending much time brute-forcing authentication for externally-facing services. This could cause a service disruption, so even if we can make a user list, we can try a few weak passwords and move on.

The `POP3` protocol can also be used for enumerating users depending on how it is set up. We can try to enumerate system users with the `USER` command again, and if the server replies with `+OK`, the user exists on the system. This doesn't work for us. Probing port 995, the SSL/TLS port for POP3 doesn't yield anything either.

We'd want to look further at the client's email implementation in a real-world assessment. If they are using Office 365 or on-prem Exchange, we may be able to mount a password spraying attack that could yield access to email inboxes or potentially the internal network if we can use a valid email password to connect over VPN. We may also come across an Open Relay, which we could possibly abuse for Phishing by sending emails as made-up users or spoofing an email account to make an email look official and attempt to trick employees into entering credentials or executing a payload. Phishing is out of scope for this particular assessment and likely will be for most External Penetration Tests, so this type of vulnerability would be worth confirming and reporting if we come across it, but we should not go further than simple validation without checking with the client first. However, this could be extremely useful on a full-scope red team assessment.

```bash
nmap -p25 -Pn --script smtp-open-relay 10.129.40.67
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-04 21:33 EAT
Nmap scan report for inlanefreight.local (10.129.40.67)
Host is up (0.31s latency).

PORT   STATE SERVICE
25/tcp open  smtp
|_smtp-open-relay: Server doesn't seem to be an open relay, all tests failed

Nmap done: 1 IP address (1 host up) scanned in 52.40 seconds

```

### rpcbind

The `rpcbind` service which should not be exposed externally, so we could write up a `Low` finding for `Unnecessary Exposed Services` or similar. This port can be probed to fingerprint the operating system or potentially gather information about available services. We can try to probe it with the [rpcinfo](https://linux.die.net/man/8/rpcinfo) command or Nmap.

```bash
rpcinfo 10.129.40.67
   program version netid     address                service    owner
    100000    4    tcp6      ::.0.111               portmapper superuser
    100000    3    tcp6      ::.0.111               portmapper superuser
    100000    4    udp6      ::.0.111               portmapper superuser
    100000    3    udp6      ::.0.111               portmapper superuser
    100000    4    tcp       0.0.0.0.0.111          portmapper superuser
    100000    3    tcp       0.0.0.0.0.111          portmapper superuser
    100000    2    tcp       0.0.0.0.0.111          portmapper superuser
    100000    4    udp       0.0.0.0.0.111          portmapper superuser
    100000    3    udp       0.0.0.0.0.111          portmapper superuser
    100000    2    udp       0.0.0.0.0.111          portmapper superuser
    100000    4    local     /run/rpcbind.sock      portmapper superuser
    100000    3    local     /run/rpcbind.sock      portmapper superuser
```

Nothing useful.

### http

on port 8080 and 80 we have web services running. 
We know there are likely multiple web applications based on the subdomain and vhost enumeration we performed earlier. So, let's move on to web. We still don't have a foothold or much of anything aside from a handful of medium and low-risk findings. In modern environments, we rarely see externally exploitable services like a vulnerable FTP server or similar that will lead to remote code execution (RCE). Never say never, though. We have seen crazier things, so it is always worth exploring every possibility. Most organizations we face will be most susceptible to attack through their web applications as these often present a vast attack surface, so we'll typically spend most of our time during an External Penetration test enumerating and attacking web applications.

## Web Enumeration & Exploitation

Based on the task that am required to perform in order to complete this section, I have decide that i will continue with this module once am comfortable with web exploitation.

I don't know how long it's been exactly maybe 2 or 4 weeks but i think i have covered most things in web exploitation even though i deviated from just learning web exploitation and started solving boot-to-root challenges and a studied a bit of SOC. Anyway here we are, ready to resume this module. 

We will move one subdomain at a time, but we will start with the main domain.

### inlanefreight.local

We get a contact form at `inlanefreight.local/contact.html `but nothing important about it.

![[Pasted image 20251011180555.png]]

Directory fuzzing i get this:

```bash
images
css
fonts
monitoring
```

I'm redirected to this page `http://inlanefreight.local/monitoring/login.php`

We need a `username` and `password` to authenticate. Basic `SQLi` fails. Trying arbitrary endpoints such as `register.php` i get `404` seems we can not register. Moving to the subdomains 

### blog.inlanefreight.local

![[Pasted image 20251011182250.png]]

At the bottom of the page we know the technology used on the site, `Drupal` but we don't know the exact version.

```bash
user                    [Status: 302, Size: 414, Words: 60, Lines: 12, Duration: 451ms]
themes                  [Status: 301, Size: 337, Words: 20, Lines: 10, Duration: 466ms]
modules                 [Status: 301, Size: 338, Words: 20, Lines: 10, Duration: 386ms]
node                    [Status: 200, Size: 8708, Words: 1509, Lines: 232, Duration: 194ms]
Search                  [Status: 302, Size: 418, Words: 60, Lines: 12, Duration: 645ms]
sites                   [Status: 301, Size: 336, Words: 20, Lines: 10, Duration: 715ms]
Contact                 [Status: 200, Size: 12494, Words: 1787, Lines: 269, Duration: 450ms]
core                    [Status: 301, Size: 335, Words: 20, Lines: 10, Duration: 170ms]
profiles                [Status: 301, Size: 339, Words: 20, Lines: 10, Duration: 786ms]
User                    [Status: 302, Size: 414, Words: 60, Lines: 12, Duration: 272ms]
Template                [Status: 403, Size: 289, Words: 20, Lines: 10, Duration: 308ms]
SEARCH                  [Status: 302, Size: 418, Words: 60, Lines: 12, Duration: 342ms]
Repository              [Status: 403, Size: 289, Words: 20, Lines: 10, Duration: 242ms]
CONTACT                 [Status: 200, Size: 12494, Words: 1787, Lines: 269, Duration: 265ms]
```


At `/user` we have the following options

![[Pasted image 20251013112933.png]]

When creating an account i get this.

![[Pasted image 20251013113142.png]]

the term `site administrator` gives that there is an admin page in the web application. From our directory enumeration we have some `403` status code but nothing looks like a path for admin

Testing `/admin` i get this 

![[Pasted image 20251013113527.png]]

Trying to use `TRACE` as `HTTP` method i get status code `405`.  Basic `SQLi` tests on login form and forgot password form gives nothing.

Moving to the next subdomain.

### careers.inlanefreight.local

![[Pasted image 20251013114842.png]]

Based on the nav bar we can see that we have some paths. 

Created an account successfully and logged in. I was then redirected to  `http://careers.inlanefreight.local/profile?id=9`. Looking at how the url is formed this points to a potential IDOR vulnerability. 

Changing the `id` to `1` i get access to `James'` profile 

![[Pasted image 20251013115403.png]]

At `id` 4 we get the flag 

![[Pasted image 20251013115716.png]]

Moving to the next subdomain

### dev.inlanefreight.local

At the root directory we have a login form 

![[Pasted image 20251013120116.png]]

Interacting with the page i get `200` status code but nothing happens am still getting the same page.

![[Pasted image 20251013120307.png]]

Directory enumeration i get this 

```bash
.hta.php                [Status: 403, Size: 288, Words: 20, Lines: 10, Duration: 148ms]
.htaccess.php           [Status: 403, Size: 288, Words: 20, Lines: 10, Duration: 148ms]
.htaccess               [Status: 403, Size: 288, Words: 20, Lines: 10, Duration: 149ms]
.hta                    [Status: 403, Size: 288, Words: 20, Lines: 10, Duration: 149ms]
.htpasswd               [Status: 403, Size: 288, Words: 20, Lines: 10, Duration: 151ms]
.htpasswd.php           [Status: 403, Size: 288, Words: 20, Lines: 10, Duration: 4947ms]
css                     [Status: 301, Size: 332, Words: 20, Lines: 10, Duration: 144ms]
images                  [Status: 301, Size: 335, Words: 20, Lines: 10, Duration: 283ms]
index.php               [Status: 200, Size: 2048, Words: 643, Lines: 74, Duration: 278ms]
index.php               [Status: 200, Size: 2048, Words: 643, Lines: 74, Duration: 236ms]
js                      [Status: 301, Size: 331, Words: 20, Lines: 10, Duration: 187ms]
server-status           [Status: 403, Size: 288, Words: 20, Lines: 10, Duration: 206ms]
upload.php              [Status: 200, Size: 14, Words: 2, Lines: 2, Duration: 157ms]
uploads                 [Status: 301, Size: 336, Words: 20, Lines: 10, Duration: 143ms]
```


i went on to access to access `upload.php.` Getting `403` as expected.

![[Pasted image 20251014134520.png]]

Enumerating supported methods by changing the `http` method from `POST` to `OPTIONS`

![[Pasted image 20251013200709.png]]

`TRACK` is supported, using as the `HTTP` method i get this 

![[Pasted image 20251013200809.png]]

There is an addition header, `X-Custom-IP-Authorization: 172.18.0.1` this could enable us to be authorized to access the page.





We are in we are not getting any `unathorized` message.



