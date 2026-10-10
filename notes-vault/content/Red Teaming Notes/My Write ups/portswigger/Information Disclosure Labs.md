## Information disclosure on debug page

Checking at `/sitemap.xml` and `/robots.txt` i didnt find the path to the debug page.

Back in burpsuite under site map i get this

![[Pasted_image_20250910083037.png]]

made a request the page 
![[Pasted_image_20250910083144.png]]

Instead of scrolling down the page we could utilize the search bar in repeater tab. FOrward the request to repeater 

![[Pasted_image_20250910083302.png]]

### Information disclosure due to insecure configuration

makign a request to `/admin` we get unathorized 

![[Pasted_image_20250910091129.png]]

changing the header method from GET to TRACE i get this.

![[Pasted_image_20250910091226.png]]

Take note of the `X-Custom-IP-Authorization: 102.208.170.144` header. 
the ip in the header is my public IPv4
```bash
curl -4 ifconfig.me
102.208.170.144  
```

also in we were getting this when trying to access the admin page.

![[Pasted_image_20250910091403.png]]

so maybe we change the header to point to `127.0.0.1`

and now we are authorized to access `/admin`.

![[Pasted_image_20250910091535.png]]

### Version control history

we identify the `.git` directory 
![[Pasted_image_20250917123244.png]]

Net we need to download the directory to our machine. I used [git dumper](https://github.com/arthaud/git-dumper) in this case 

```bash
 python3 git_dumper.py https://0a59007e03c726a28228152400160018.web-security-academy.net ../
Warning: Destination '../' is not empty
[-] Testing https://0a59007e03c726a28228152400160018.web-security-academy.net/.git/HEAD [200]
[-] Testing https://0a59007e03c726a28228152400160018.web-security-academy.net/.git/ [200]
[-] Fetching common files
[-] Fetching https://0a59007e03c726a28228152400160018.web-security-academy.net/.gitignore [404]
[-] https://0a59007e03c726a28228152400160018.web-security-academy.net/.gitignore responded with status code 404
[-] Fetching https://0a59007e03c726a28228152400160018.web-security-academy.net/.git/COMMIT_EDITMSG [200]
[-] Fetching https://0a59007e03c726a28228152400160018.web-security-academy.net/.git/hooks/post-commit.sample [404]
[-] https://0a59007e03c726a28228152400160018.web-security-academy.net/.git/hooks/post-commit.sample responded with status code 404
[-] Fetching https://0a59007e03c726a28228152400160018.web-security-academy.net/.git/description [200]
[-] Fetching https://0a59007e03c726a28228152400160018.web-security-academy.net/.git/hooks/applypatch-msg.sample [200]
[-] Fetching https://0a59007e03c726a28228152400160018.web-security-academy.net/.git/hooks/commit-msg.sample [200]
[-] Fetching https://0a59007e03c726a28228152400160018.web-security-academy.net/.git/hooks/post-receive.sample [404]
[-] https://0a59007e03c726a28228152400160018.web-security-academy.net/.git/hooks/post-receive.sample responded with status code 404
[-] Fetching https://0a59007e03c726a28228152400160018.web-security-academy.net/.git/hooks/post-update.sample [200]
[-] Fetching https://0a59007e03c726a28228152400160018.web-security-academy.net/.git/hooks/pre-commit.sample [200]
[-] Fetching https://0a59007e03c726a28228152400160018.web-security-academy.net/.git/hooks/pre-applypatch.sample [200]
[-] Fetching https://0a59007e03c726a28228152400160018.web-security-academy.net/.git/hooks/pre-push.sample [200]
[-] Fetching https://0a59007e03c726a28228152400160018.web-security-academy.net/.git/hooks/pre-receive.sample [200]
[-] Fetching https://0a59007e03c726a28228152400160018.web-security-academy.net/.git/hooks/pre-rebase.sample [200]

[ SNIP ]
```

Tried to perfom a simple search to identify crendentials but not successfull but i got the commit hashes

```grep -Rni --exclude-dir=.git -e 'password' -e 'passwd' -e 'secret' -e 'apikey' -e 'api_key' -e 'token' -e 'aws' -e 'ssh-rsa' .
./hooks/fsmonitor-watchman.sample:11:# The hook is passed a version (currently 2) and last update token
./hooks/fsmonitor-watchman.sample:12:# formatted as a string and outputs to stdout a new update token and
./hooks/fsmonitor-watchman.sample:13:# all files that have been modified since the update token. Paths must
./hooks/fsmonitor-watchman.sample:19:my ($version, $last_update_token) = @ARGV;
./hooks/fsmonitor-watchman.sample:22:# print STDERR "$0 $version $last_update_token\n";
./hooks/fsmonitor-watchman.sample:83:	# changed since $last_update_token but not from the .git folder.
./hooks/fsmonitor-watchman.sample:90:	if (substr($last_update_token, 0, 1) eq "c") {
./hooks/fsmonitor-watchman.sample:91:		$last_update_token = "\"$last_update_token\"";
./hooks/fsmonitor-watchman.sample:92:		$last_update_line = qq[\n"since": $last_update_token,];
./hooks/fsmonitor-watchman.sample:151:		$last_update_token = $o->{clock};
./COMMIT_EDITMSG:1:Remove admin password from config
./logs/HEAD:2:7d0883576b367a852155e695abf0c384d189005f 051756ef3722bc51173bfa2d66428db3e5ef40ab Carlos Montoya <carlos@carlos-montoya.net> 1758100070 +0000	commit: Remove admin password from config
./logs/refs/heads/master:2:7d0883576b367a852155e695abf0c384d189005f 051756ef3722bc51173bfa2d66428db3e5ef40ab Carlos Montoya <carlos@carlos-montoya.net> 1758100070 +0000	commit: Remove admin password from config

```

`commit: Remove admin password from config` this points us to where the password is. in git every commit contains file or part of the file that was added or removed `(ie diff of the old file and the new file after modification)` .. in this case git will show us which password was removed from the config file.

```bash
git show 051756ef3722bc51173bfa2d66428db3e5ef40ab   
commit 051756ef3722bc51173bfa2d66428db3e5ef40ab (HEAD -> master)
Author: Carlos Montoya <carlos@carlos-montoya.net>
Date:   Tue Jun 23 14:05:07 2020 +0000

    Remove admin password from config

diff --git a/admin.conf b/admin.conf
index c600873..21d23f1 100644
--- a/admin.conf
+++ b/admin.conf
@@ -1 +1 @@
-ADMIN_PASSWORD=bqrvkzyqd9rdamd5re2u
+ADMIN_PASSWORD=env('ADMIN_PASSWORD')
```

