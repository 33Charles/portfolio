---
created: 2026-10-10
modified: 2026-10-10
---


#### Sherlock Scenario

```
Your organization, Alliance, recently set up a SIEM in the environment for better visibility and coverage. However, due to a lack of administrative staff and poor security hygiene, the environment is in disarray. The logging configuration is broken in some areas, logs are being overwritten, and new log sources are being added to the SIEM only gradually, creating a significant visibility gap.

Spawn the VM and wait around 1-2 minutes for the ELK services to start. Then either by connecting to the HTB VPN or using pwnbox, access the SIEM using (http://ip:5601/)

The credentials for SIEM are elastic:hacktheblue

You have been given a threat hunt hypothesis as your first task.

Hypothesis: A threat actor has established persistence on one or more hosts within the environment by creating or modifying a scheduled task with a name designed to blend in with legitimate Windows tasks. Given the degraded logging posture, the task may have gone undetected and could be actively executing a malicious payload.
```


The first thing to do is to change the timeline to the last 5 years since this is a CTF environment.

![[Pasted image 20261005092325.png]]

Next is to check what os types are present.

![[Pasted image 20261005092508.png]]


Next we check the `event.dataset` field. `event.dataset` is a field that tells you **which log source an event came from**. Think of it as the label on each log saying "I'm from the syslog file" or "I'm from the auth log".

![[Pasted image 20261005092618.png]]

##### Windows sources

- `system.security` : the Windows Security event log. It records logons (4624/4625), process creation (4688), and scheduled task creation or change (4698/4702). **This is your main source for the hypothesis.**
- `windows.powershell` : the classic PowerShell log. It shows when a PowerShell engine started and what host application ran it. It's useful if a task launches `powershell.exe`.
- `system.system` : the Windows System log, with service installs, service start/stop, driver and boot events. It can show a malicious service or a Task Scheduler service event.
- `system.application` : the Windows Application log, with application errors and messages. It's usually low value, but can show a crashing payload.

##### Linux sources

- `system.syslog`: the Linux general system log. Cron and systemd write their messages here, so it's your main source for Linux scheduled tasks.
- `auditd.log`: the Linux audit log. It records process execution, file changes and syscalls. If auditing is configured, it can show who edited a crontab or created a timer.
- `system.auth`: the Linux authentication log (logins, sudo, SSH). It tells you who did something and from where. It's not in this view's top values, but it exists in our data.

##### SIEM noise (ignore for the hunt)

- `elastic_agent.fleet_server` : logs from the Fleet Server, which manages the agents. It's SIEM plumbing.
- `elastic_agent.filebeat` : the log shipper's own status messages.
- `elastic_agent.metricbeat`: the metrics collector's own status messages.
- `elastic_agent` : the Elastic Agent's own general log.

##### Other 

More datasets are hidden in this slice. Click `event.dataset`, then **Visualize**, to see them all.

![[Pasted image 20261005095217.png]]

`windows.sysmon_operational` (139k): Sysmon. It records process creation (event 1), file creation (11) and registry changes (12/13/14), whether or not Windows auditing was enabled. That matters because the scenario says logging is broken.

Since the scenario talks about a schedule task creation or modification, we could filter for EbentIDs

- **4698** : A scheduled task was created
- **4702**: A scheduled task was updated
- **4699**: task deleted
- **4700**: task enabled
- **4701**: task disabled

```kql
event.dataset : "system.security" and event.code : ("4698" or "4699" or "4700" or "4701" or "4702")
```

With that I get no results, maybe because the logging configuration was broken.

![[Pasted image 20261005101640.png]]


Next we just run  `event.dataset : "system.security"`, then click `event.code` in the sidebar.

![[Pasted image 20261005102131.png]]

`EventId:4688` is for process creation.

Our next query is to filter for process `schtasks.exe` which is used to manage scheduled tasks.

```kql
event.dataset : "system.security" and event.code : "4688" and process.name : "schtasks.exe"
```

![[Pasted image 20261005104840.png]]

```shell
schtasks /create /tn "FileArchiveJob" /tr "cmd /c C:\Scripts\filearchiverjob.bat" /sc monthly /d 27 /st 18:00 /ru SYSTEM /f
```

we locate a scheduled task that runs once every month with `system` privileges.  More analysis on the task reveals nothing interesting. MOre info about the task is that the file, `C:\Scripts\filearchiverjob.bat` was created by the administrator and also the scheduling of the task was done by the administrator.

Next query we will get all entries for process `schtasks.exe`  then filter out `FileArchiveJob` task.

```kql
process.name : "schtasks.exe" and process.command_line : *create* and not process.command_line : *FileArchiveJob*
```

And we get no entries

![[Pasted image 20261005110732.png]]

