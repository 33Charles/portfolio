---
created: 2026-03-13
modified: 2026-03-13
---

The challenge is Linux-based with medium difficulty.  
  
The description reveals the port where the web application is running:  
  
`http://10.66.189.36:3000`  
  
Checking the technologies in use we get:

![[Pasted image 20260310190809.png]]

On Dec 2025 we next.js and React have had impactful CVEs such as the `React2Shell`. Since our application runs on react we can test that first.

The exploit script can found [here](https://github.com/sammwyy/R2SAE)

The web application is vulnerable to `React2Shell`

![[Pasted image 20260310205236.png]]

we get a shell as daniel and can run `python3` as root.

![[Pasted image 20260310205341.png]]

We just need to spawn a new shell as root  using `python3` by running 

```shell
sudo /usr/bin/python3 -c 'import pty;pty.spawn("/bin/sh")'
```


