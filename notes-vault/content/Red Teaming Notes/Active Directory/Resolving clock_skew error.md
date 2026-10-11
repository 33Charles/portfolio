---
created: 2026-09-22
modified: 2026-09-22
---

Sometimes you run a command and you get this error  `KRB_AP_ERR_SKEW (CLOCK SKEW TOO GREAT)` and if you were keen enough in your nmap output you had something like this.

```bash
|_clock-skew: 8h00m09s
```

This will make m commands run in the error : **KRB_AP_ERR_SKEW (CLOCK SKEW TOO GREAT)**
which happens when the **client and server system times are not synchronized**, typically differing by **more than 5 minutes** (default in most Kerberos implementations).
Kerberos is time-sensitive. It relies on timestamps in tickets and authentication to prevent **replay attacks**. If your system time is off, the authentication fails with that error.

To resolve this we can run either commands :
```bash
ntpdate [TARGET_IP]
```

If this does not work... try disabling auto time sync .. it is probably resetting you time after synchronizing it with your target

```bash
faketime "$(ntpdate -q [TARGET_IP] | cut -d ' ' -f 1,2)" \
COMMAND YOU WANT TO RUN
```

Since we know the `clock-skew` value we can also use this:

```bash
faketime -f '+8h' \
COMMAND YOU WANT TO RUN
```
