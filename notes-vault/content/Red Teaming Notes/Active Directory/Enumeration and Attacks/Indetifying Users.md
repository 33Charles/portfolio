---
created: 2025-11-05
modified: 2025-11-05
---

After running nmap scan to identify the domain names and the domain controller and possibly the services running in the host and their version , we will need to gain a foothold in the target.
Sometimes the client will provide us will the initial credentials that we will use to start our AD enumeration with but at times we are just given  *"All the best"*, in this case will need to find a way to establish a foothold in the domain by either obtaining clear text credentials or an NTLM password hash for a user, a SYSTEM shell on a domain-joined host, or a shell in the context of a domain user account.
Obtaining valid user with credentials is critical in the early stages of an internal penetration testing because is opens many opportunities to perform valid further enumeration and even attacks.

### username harvesting

We can use a tool such as **linkedin2username** to scrape data from a company's linkedin page and create a various mashups of usernames eg *flast, first.last, f.last etc*

#### Kerbrute - Internal AD Username Enumeration

**Kerbrute** can be a stealthier option for domain account enumeration. It takes advantage of the fact that kerberos pre-authentication failures often not trigger logs or alerts. kerbrute often works in conjunction with a list of usernames to determine if any username in the list is a valid user in the domain.
> The username list we get from **linkedin2username** tool when performing passive username enumeration could be of great help here, but there are also already made username files out there can come in handy at this stage.

Lets interact will **kerbrute tool**

```bash
kerbrute --help

    __             __               __     
   / /_____  _____/ /_  _______  __/ /____ 
  / //_/ _ \/ ___/ __ \/ ___/ / / / __/ _ \
 / ,< /  __/ /  / /_/ / /  / /_/ / /_/  __/
/_/|_|\___/_/  /_.___/_/   \__,_/\__/\___/                                        

Version: dev (9cfb81e) - 08/09/25 - Ronnie Flathers @ropnop

This tool is designed to assist in quickly bruteforcing valid Active Directory accounts through Kerberos Pre-Authentication.
It is designed to be used on an internal Windows domain with access to one of the Domain Controllers.
Warning: failed Kerberos Pre-Auth counts as a failed login and WILL lock out accounts

Usage:
  kerbrute [command]

Available Commands:
  bruteforce    Bruteforce username:password combos, from a file or stdin
  bruteuser     Bruteforce a single user''s password from a wordlist
  help          Help about any command
  passwordspray Test a single password against a list of users
  userenum      Enumerate valid domain usernames via Kerberos
  version       Display version info and quit

Flags:
      --dc string          The location of the Domain Controller (KDC) to target. If blank, will lookup via DNS
      --delay int          Delay in millisecond between each attempt. Will always use single thread if set
  -d, --domain string      The full domain to use (e.g. contoso.com)
      --downgrade          Force downgraded encryption type (arcfour-hmac-md5)
      --hash-file string   File to save AS-REP hashes to (if any captured), otherwise just logged
  -h, --help               help for kerbrute
  -o, --output string      File to write logs to. Optional.
      --safe               Safe mode. Will abort if any user comes back as locked out. Default: FALSE
  -t, --threads int        Threads to use (default 10)
  -v, --verbose            Log failures and errors

Use "kerbrute [command] --help" for more information about a command.

```

The tool can be used for other purposes other than user enumeration:

```bash
Available Commands:
  bruteforce    Bruteforce username:password combos, from a file or stdin
  bruteuser     Bruteforce a single user''s password from a wordlist
  help          Help about any command
  passwordspray Test a single password against a list of users
  userenum      Enumerate valid domain usernames via Kerberos
  version       Display version info and quit
```

In this section we are only inrerested in **userenum**

```bash
kerbrute userenum --help  

    __             __               __     
   / /_____  _____/ /_  _______  __/ /____ 
  / //_/ _ \/ ___/ __ \/ ___/ / / / __/ _ \
 / ,< /  __/ /  / /_/ / /  / /_/ / /_/  __/
/_/|_|\___/_/  /_.___/_/   \__,_/\__/\___/                                        

Version: dev (9cfb81e) - 08/09/25 - Ronnie Flathers @ropnop

Will enumerate valid usernames from a list by constructing AS-REQs to requesting a TGT from the KDC.
If no domain controller is specified, the tool will attempt to look one up via DNS SRV records.
A full domain is required. This domain will be capitalized and used as the Kerberos realm when attempting the bruteforce.
Valid usernames will be displayed on stdout.

Usage:
  'kerbrute userenum [flags] <username_wordlist>'

Flags:
  -h, --help   help for userenum

Global Flags:
      --dc string          The location of the Domain Controller (KDC) to target. If blank, will lookup via DNS
      --delay int          Delay in millisecond between each attempt. Will always use single thread if set
  -d, --domain string      The full domain to use (e.g. contoso.com)
      --downgrade          Force downgraded encryption type (arcfour-hmac-md5)
      --hash-file string   File to save AS-REP hashes to (if any captured), otherwise just logged
  -o, --output string      File to write logs to. Optional.
      --safe               Safe mode. Will abort if any user comes back as locked out. Default: FALSE
  -t, --threads int        Threads to use (default 10)
  -v, --verbose            Log failures and errors
  
```

I don't have a target i mind, but let's assume that we have a target with this details.

> domain -> contoso.com
> domain controller -> dc01.contoso.com

our kerbrute command would be :

```bash
kerbrute userenum -d contoso.com --dc dc01.contoso.com <username worlist> 
```

This will give us a list of validated username which we can use in password spraying attacks.


#### Identifying Potential Vulnerabilities

The local system account NT AUTHORITY\SYSTEM is a built-in account in Windows operatingsystems. It has the highest level of access in the OS and is used to run most Windowsservices. It is also very common for third-party services to run in the context of this accountby default. A SYSTEM account on a domain-joined host will be able to enumerate Active Directory by impersonating the computer account, which is essentially just another kind of user account. Having SYSTEM-level access within a domain environment is nearly equivalent to having a domain user account.

There are several ways to gain SYSTEM-level access on a host, including but not limited to:
- Remote Windows exploits such as **MS08-067, EternalBlue, or BlueKeep.**
- Abusing a service running in the context of the SYSTEM account , or abusing the service account SeImpersonate privileges using **Juicy Potato**. This type of attack is possible on older Windows OS' but not always possible with Windows Server 2019.
- Local privilege escalation flaws in Windows operating systems such as the Windows 10
- Task Scheduler 0-day.Gaining admin access on a domain-joined host with a local account and using Psexec to launch a SYSTEM cmd window
By gaining SYSTEM-level access on a domain-joined host, you will be able to perform
actions such as, but not limited to:
- Enumerate the domain using built-in tools or offensive tools such as BloodHound and PowerView.
- Perform Kerberoasting / ASREPRoasting attacks within the same domain.
- Run tools such as Inveigh to gather Net-NTLMv2 hashes or perform SMB relay attacks.
- Perform token impersonation to hijack a privileged domain user account.
- Carry out ACL attacks.

### Let's Find a User

Having a acquired a valid list of users in the domain, we need to proceed to get a valid password fro any of the users to start credentialed enumeration in the domain. 
Password bruteforcing maybe a consideration only and only if the password policy doesn't lockout accounts after a number of failed logon attempts of which most of the times that is not the case.

We will hunt for a domain user account using techniques such as **LLMNR/NBT-NS Poisoning**and **password spraying**. These attacks are great ways to gain a foothold but must be exercised with caution and an understanding of the tools and techniques. We will perform these actions with the goal of acquiring valid cleartext credentials for a domain user account, thereby granting us a foothold in the domain to begin the next phase of enumeration from a credentialed standpoint.

#### LLMNR/NBT-NS Poisoning - from Linux

##### LLMNR & NBT-NS Primer

**Link-Local Multicast Name Resolution (LLMNR)** and **NetBIOS Name Service (NBT-NS)** are Microsoft Windows components that serve as alternate methods of host identification that can be used when DNS fails. If a machine attempts to resolve a host but DNS resolution
fails, typically, the machine will try to ask all other machines on the local network for the
correct host address via LLMNR. LLMNR is based upon the Domain Name System (DNS)
format and allows hosts on the same local link to perform name resolution for other hosts. It
uses port 5355 over UDP natively. If LLMNR fails, the NBT-NS will be used. NBT-NS
identifies systems on a local network by their NetBIOS name. NBT-NS utilizes port 137 over
UDP.

The kicker here is that when LLMNR/NBT-NS are used for name resolution, ANY host on the
network can reply. This is where we come in with Responder to poison these requests. With
network access, we can spoof an authoritative name resolution source ( in this case, a host
that's supposed to belong in the network segment ) in the broadcast domain by responding
to LLMNR and NBT-NS traffic as if they have an answer for the requesting host. This
poisoning effort is done to get the victims to communicate with our system by pretending thatour rogue system knows the location of the requested host. If the requested host requiresname resolution or authentication actions, we can capture the NetNTLM hash and subject itto an offline brute force attack in an attempt to retrieve the cleartext password. The captured authentication request can also be relayed to access another host or used against a different protocol (such as LDAP) on the same host. LLMNR/NBNS spoofing combined with a lack of SMB signing can often lead to administrative access on hosts within a domain. 

Quick Example - LLMNR/NBT-NS Poisoning
Let's walk through a quick example of the attack flow at a very high level
1. A host attempts to connect to the print server at \\print01.inlanefreight.local, but accidentally types in \\printer01.inlanefreight.local.
2. The DNS server responds, stating that this host is unknown.
3. The host then broadcasts out to the entire local network asking if anyone knows the location of \\printer01.inlanefreight.local.
4. The attacker (us with Responder running) responds to the host stating that it is the \\printer01.inlanefreight.local that the host is looking for.
5. The host believes this reply and sends an authentication request to the attacker with a username and NTLMv2 password hash.
6. This hash can then be cracked offline or used in an SMB Relay attack if the right conditions exist.

Several tools can be used to attempt LLMNR & NBT-NS poisoning:

**Responder** : Responder is a purpose-built tool to poison LLMNR, NBT-NS, and MDNS,
with many different functions.
**Inveigh** : Inveigh is a cross-platform MITM platform that can be used for spoofing and poisoning attacks.

##### Responder

```bash
responder --help                
                                         __
  .----.-----.-----.-----.-----.-----.--|  |.-----.----.
  |   _|  -__|__ --|  _  |  _  |     |  _  ||  -__|   _|
  |__| |_____|_____|   __|_____|__|__|_____||_____|__|
                   |__|

           NBT-NS, LLMNR & MDNS Responder 3.1.5.0

  To support this project:
  Github -> https://github.com/sponsors/lgandx
  Paypal  -> https://paypal.me/PythonResponder

  Author: Laurent Gaffie (laurent.gaffie@gmail.com)
  To kill this script hit CTRL-C

Usage: responder -I eth0 -w -d
or:
responder -I eth0 -wd

Options:
  --version             show program''s version number and exit
  -h, --help            show this help message and exit
  -A, --analyze         Analyze mode. This option allows you to see NBT-NS,
                        BROWSER, LLMNR requests without responding.
  -I eth0, --interface=eth0
                        Network interface to use, you can use 'ALL' as a
                        wildcard for all interfaces
  -i 10.0.0.21, --ip=10.0.0.21
                        Local IP to use (only for OSX)
  -6 2002:c0a8:f7:1:3ba8:aceb:b1a9:81ed, --externalip6=2002:c0a8:f7:1:3ba8:aceb:b1a9:81ed
                        Poison all requests with another IPv6 address than
                        Responder''s one.
  -e 10.0.0.22, --externalip=10.0.0.22
                        Poison all requests with another IP address than
                        Responder''s one.
  -b, --basic           Return a Basic HTTP authentication. Default: NTLM
  -d, --DHCP            Enable answers for DHCP broadcast requests. This
                        option will inject a WPAD server in the DHCP response.
                        Default: False
  -D, --DHCP-DNS        This option will inject a DNS server in the DHCP
                        response, otherwise a WPAD server will be added.
                        Default: False
  -w, --wpad            Start the WPAD rogue proxy server. Default value is
                        False
  -u UPSTREAM_PROXY, --upstream-proxy=UPSTREAM_PROXY
                        Upstream HTTP proxy used by the rogue WPAD Proxy for
                        outgoing requests (format: host:port)
  -F, --ForceWpadAuth   Force NTLM/Basic authentication on wpad.dat file
                        retrieval. This may cause a login prompt. Default:
                        False
  -P, --ProxyAuth       Force NTLM (transparently)/Basic (prompt)
                        authentication for the proxy. WPAD doesnot need to be
                        ON. This option is highly effective. Default: False
  -Q, --quiet           Tell Responder to be quiet, disables a bunch of
                        printing from the poisoners. Default: False
  --lm                  Force LM hashing downgrade for Windows XP/2003 and
                        earlier. Default: False
  --disable-ess         Force ESS downgrade. Default: False
  -v, --verbose         Increase verbosity.
  -t 1e, --ttl=1e       Change the default Windows TTL for poisoned answers.
                        Value in hex (30 seconds = 1e). use '-t random' for
                        random TTL

```


As shown , the **-A** flag puts us into analyze mode, allowing us to see NBT-NS, BROWSER, and LLMNR requests in the environment without poisoning any responses. We must always supply either an interface or an IP. 
Some common options we'll typically want to use are **-wf**; this will start the WPAD rogue proxy server, ~~while **-f** will attempt to fingerprint the remote host operating system and version.~~ We can use the -v flag for increased verbosity if we are running into issues, but this will lead to a lot of additional data printed to the console. Other options such as **-F** and **-P** can be used to force NTLM or Basic authentication and force proxy authentication, but may cause a login prompt, so they should be used sparingly. The use of the -w flag utilizes the built-in WPAD proxy server. This can be highly effective, especially in large organizations, because it will capture all HTTP requests by any users that launch Internet Explorer if the browser has Auto-detect settings enabled.

``` bash
sudo responder -I eth0 -w
                                         __
  .----.-----.-----.-----.-----.-----.--|  |.-----.----.
  |   _|  -__|__ --|  _  |  _  |     |  _  ||  -__|   _|
  |__| |_____|_____|   __|_____|__|__|_____||_____|__|
                   |__|

           NBT-NS, LLMNR & MDNS Responder 3.1.5.0

  To support this project:
  Github -> https://github.com/sponsors/lgandx
  Paypal  -> https://paypal.me/PythonResponder

  Author: Laurent Gaffie (laurent.gaffie@gmail.com)
  To kill this script hit CTRL-C

[+] You donot have an IPv6 address assigned.

[+] Poisoners:
    LLMNR                      [ON]
    NBT-NS                     [ON]
    MDNS                       [ON]
    DNS                        [ON]
    DHCP                       [OFF]
    
SNIP
```

Starting responder with the option above , Responder will listen and answer any requests it sees on the wire. If you are successful and manage to capture a hash, Responder will print it out on screen and write it to a log file per host located in the `/usr/share/responder/logs`
directory.

Typically we should start Responder and let it run for a while in a tmux window while we
perform other enumeration tasks to maximize the number of hashes that we can obtain.

> [!NOTE]
>  NTLMv2 can't be used in pass-the-hash attacks, meaning we have to attempt to crack them offline.

ldapsearch -x -H ldap://10.211.11.10 -b "dc=tryhackme,dc=loc" "(objectClass=User)" | grep sAMAccountName

or 

ldapsearch -x -H ldap://10.211.11.10 -b "dc=tryhackme,dc=loc" "(objectClass=person)" | grep sAMAccountName
