# HTB Sherlock — Baggage (ShellBags) Write-up

**Author:** Charles Mwangi Kamau (D4SEIN) **Category:** DFIR / Windows registry forensics **Focus:** ShellBags, RecentDocs, UserAssist, registry transaction logs

> Note: HTB asks that write-ups of active challenges are not published publicly. Share this only if the Sherlock is retired, or keep it private.

## 1. Scenario

This Sherlock provides an opportunity to analyze ShellBag artifacts. ShellBags show folder access by a specific user, access to network shares, and navigation of archive file contents. That information helps identify data access, data staging, and exfiltration attempts.

### Tasks

|#|Question|
|---|---|
|1|What was the name of the archive file downloaded by the compromised account?|
|2|What was the name of the utility brought in by the attacker to search for sensitive data?|
|3|When was the VPN folder accessed by the attacker?|
|4|What was the name of the directory containing the victim's passwords?|
|5|What is the UNC path of the network share the attacker accessed?|
|6|When is the dam construction planned?|
|7|What was the name of the archive file present on the network share?|
|8|When was the archive file from the network share accessed?|
|9|What is the full path of the staging folder?|
|10|When was the exfiltration archive file accessed?|

### Final answers (all times UTC)

|#|Answer|
|---|---|
|1|`1.zip`|
|2|Everything (`Everything-1.4.1.1028.x64`)|
|3|`2025-09-03 07:31:05`|
|4|`OnePassword MasterPass`|
|5|`\\Prod-ns-2\prodshare`|
|6|`2027`|
|7|`Dam Construction Engineer Plans.zip`|
|8|`2025-09-03 07:34:04`|
|9|`C:\Users\steve\Pictures\a`|
|10|`2025-09-03 07:34:30`|


## 2. Evidence

The download is `Baggage.zip`, protected with the standard Sherlock password `hacktheblue`.

```bash
mkdir extract && cd extract
unzip -P hacktheblue ../Baggage.zip
```

The folder `C` is a **KAPE** collection using the `RegistryHivesUser` target:

```
.
├── Users
│   ├── admin
│   │   ├── AppData/Local/Microsoft/Windows/UsrClass.dat (+ .LOG1, .LOG2)
│   │   ├── NTUSER.DAT, ntuser.dat.LOG1, ntuser.dat.LOG2
│   ├── Default
│   │   └── NTUSER.DAT (+ .LOG1, .LOG2)
│   └── steve
│       ├── AppData/Local/Microsoft/Windows/UsrClass.dat (+ .LOG1, .LOG2)
│       └── NTUSER.DAT, ntuser.dat.LOG1, ntuser.dat.LOG2
└── Windows/System32/config
    └── DEFAULT (+ .LOG1, .LOG2)
```

There is no `SYSTEM`, `SOFTWARE` or `SAM`, so everything is in the **user** hives.

### KAPE logs

Two extra files sit next to `C`: `*_ConsoleLog.txt` and `*_CopyLog.csv`. The console log shows the collection context:

```
[2025-09-03 00:53:01.3218732 | INF] Command line:   --tsource C: --tdest C:\Windows\Temp\artifacts --tflush --target RegistryHivesUser --gui
[2025-09-03 00:53:01.3218732 | INF] System info: Machine name: PROD-WORKSTATIO, 64-bit: true, User: admin OS: "Windows10" (10.0.22621)
...
[2025-09-03 00:53:04.9950536 | INF]   Deferring C:\Users\admin\NTUSER.DAT due to IOException...
[2025-09-03 00:53:05.2141109 | INF]   Deferring C:\Users\steve\NTUSER.DAT due to IOException...
```

Key points:

- The collection ran as **admin** (the responder), on `PROD-WORKSTATIO`.
- The log shows local time `00:53`, while `CopyLog.csv` says `07:53` UTC. The machine is UTC-7. The registry itself always stores UTC, so **every answer here is UTC**.
- Live hives were "deferred" (locked), which is why the **transaction logs matter**.

The hive hashes are in `CopyLog.csv` (column `SourceFileSha1`).

---

## 3. Background: what ShellBags are

When a user browses a folder in Explorer, Windows records the folder in the registry so it can remember window size and view settings. The records survive after the folder or drive is gone.

|Hive|Key|
|---|---|
|`UsrClass.dat`|`Local Settings\Software\Microsoft\Windows\Shell\BagMRU` and `...\Bags`|
|`NTUSER.DAT`|`Software\Microsoft\Windows\Shell\BagMRU` (network and some desktop items)|

How the data is laid out:

- Each subkey number under `BagMRU` is one folder level, so a path is a chain of nested keys.
- Each key holds values named `0, 1, 2...` (the child items, stored as binary **shell items**) and `MRUListEx` (the order the children were used, most recent first).
- Zip files are browsed like folders, so their **contents** appear as shell items too.

### Timestamps

|Type|Where it comes from|
|---|---|
|**Last Interacted**|Registry **key last-write time**. For the item at MRU position 0, use the **parent** key's last write.|
|Created / Modified / Accessed|FAT timestamps stored **inside** the file shell item (extension block `0xBEEF0004`, 2-second resolution)|

> This rule is what resolved Tasks 3, 8 and 10. Details are in Section 8.

## 4. Setup and tooling

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install "regipy[full]" click
python -c "import pyfwsi; print('pyfwsi ok')"   # needed for shellbag parsing
# Eric Zimmerman tools (dotnet): rla.dll (Registry Log Analyzer), SBECmd, Registry Explorer
```

First problems I hit:

- **`ModuleNotFoundError: click`** was fixed with `pip install click`.
- **`pyfwsi` missing**: the regipy shellbag plugin printed this error until I installed `regipy[full]`.
- **Lowercase log names.** `ntuser.dat.LOG1` sits next to `NTUSER.DAT`. Replay tools match the log by exact name on Linux, so rename them if a tool ignores them:

```bash
for u in admin steve; do
  d=Users/$u
  mv $d/ntuser.dat.LOG1 $d/NTUSER.DAT.LOG1
  mv $d/ntuser.dat.LOG2 $d/NTUSER.DAT.LOG2
done
```

---

## 5. Step 1 — Replay the transaction logs

A hive from a live system is "dirty": recent changes sit in `.LOG1` and `.LOG2` and not in the main file. Replay them first.

### Eric Zimmerman's `rla` (NTUSER.DAT)  https://ericzimmerman.github.io/

```
$ dotnet rla.dll -f Users/admin/NTUSER.DAT --out clean/admin
Two transaction logs found. Determining primary log...
Primary log: Users/admin/NTUSER.DAT.LOG2, secondary log: Users/admin/NTUSER.DAT.LOG1
Replaying log file: Users/admin/NTUSER.DAT.LOG2
Replaying log file: Users/admin/NTUSER.DAT.LOG1
At least one transaction log was applied. Sequence numbers have been updated to 0x00D7. New Checksum: 0xCB4BAFFC
	Saving updated hive to clean/admin/__NTUSER.DAT

$ dotnet rla.dll -f Users/steve/NTUSER.DAT --out clean/steve
...
At least one transaction log was applied. Sequence numbers have been updated to 0x004D. New Checksum: 0xCB5A2FF3
	Saving updated hive to clean/steve/__NTUSER.DAT
```

> `rla` writes **`__NTUSER.DAT`** (double-underscore prefix). Use that file from here on.

### regipy replay for `UsrClass.dat` (Linux)

```bash
B=extract/Baggage/C/Users/steve/AppData/Local/Microsoft/Windows
ls -l $B
```

```
-rw-r--r-- 1 root root 2621440 UsrClass.dat
-rw-r--r-- 1 root root       0 UsrClass.dat.LOG1      <-- empty
-rw-r--r-- 1 root root  393216 UsrClass.dat.LOG2
```

`LOG1` is **0 bytes**, so supplying it as the primary or secondary log makes regipy fail:

```
RegistryRecoveryException: The transaction log vector magic was not expected: b''
```

The fix is to replay `LOG2` alone:

```bash
regipy-process-transaction-logs $B/UsrClass.dat -p $B/UsrClass.dat.LOG2 -o clean/steve_UsrClass_r.dat
```

```
INFO:regipy.recovery:Recovered 52 pages from primary transaction log
Recovered 52 dirty pages. Restored hive is at .../clean/steve_UsrClass_r.dat
```

Steve's `NTUSER.DAT` was replayed the same way (`-p ntuser.dat.LOG2 -s ntuser.dat.LOG1`) and recovered 171 dirty pages.

---

## 6. Step 2 — Find which account is compromised

### Quick string sweep of the cleaned NTUSER hives

Registry strings are UTF-16LE, so `-el` is required:

```bash
$ strings -a -el clean/steve/__NTUSER.DAT | grep -iE '\.(zip|rar|7z|ext)'
1.zip
1.zip
.zip
Dam Construction Engineer Plans.zip
Dam Construction Engineer Plans.zip
zDam Construction Engineer Plans.zip
a.zip
a.zip

$ strings -a -el clean/admin/__NTUSER.DAT | grep -iE '\.(zip|rar|7z|ext)'
.zip
```

Steve's hive has the archive activity, and admin's has nothing.

### regipy plugins on steve's NTUSER.DAT

```bash
$ regipy-plugins-run clean/steve/__NTUSER.DAT -o steve_ntuser.json
Loaded 75 plugins
ERROR:regipy.plugins.ntuser.wsl:Registry key not found ... Lxss
ERROR:regipy.plugins.ntuser.winrar:Could not find winrar_plugin plugin data at: \SOFTWARE\WinRAR\ArcHistory
...
Finished: 12/75 plugins matched the hive type
```

Most `ERROR` lines just mean "that key does not exist". The WinRAR errors tell us **WinRAR was never used**.

TypedPaths:

```json
{
  "last_write": "2025-09-03T07:34:52.410762+00:00",
  "entries": [
    { "url1": "\\\\Prod-ns-2\\prodshare" },
    { "url2": "Documents" }
  ]
}
```

UserAssist (selected rows):

|Program|Last run (UTC)|
|---|---|
|Microsoft Teams|2025-09-03 07:24:21|
|Microsoft Edge|2025-09-03 07:25:08|
|File Explorer.lnk|2025-09-03 07:32:52|
|`...\Temp\Temp1_Everything-1.4.1.1028.x64.zip\everything.exe`|present|

The Everything entry means the tool was launched **from inside a zip opened in Explorer**, which unpacks to `Temp1_<zipname>`.

### The admin hive is not the attacker

Admin's `UsrClass.dat` also shows browsing of `C:\Users\steve\Documents\...` and the share, so I compared timestamps.

|Source|Time range|Meaning|
|---|---|---|
|admin ShellBags|`07:08` – `07:23`|scenario setup before the attacker session|
|admin ShellBags (after log replay)|`07:49` (`C:\Windows\Temp`)|KAPE collection staging|
|steve ShellBags|`07:25` onward, starting right after Edge launched at `07:25:08`|**the attacker session**|

Conclusion: **steve is the compromised account.**

---

## 7. Step 3 — Parse the ShellBags

### Attempt 1: regipy plugin (partially useful)

```bash
regipy-plugins-run clean/steve_UsrClass_r.dat -o clean/steve_usrclass_r.json
```

It gives the folder tree, but zip contents show as `<UNKNOWN: 0x00>`:

```
My Computer\Downloads\1.zip
My Computer\Downloads\1.zip\<UNKNOWN: 0x00>
My Computer\Pictures\a.zip\<UNKNOWN: 0x00>\<UNKNOWN: 0x00>
```

The cause is that **regipy trims binary values to 128 bytes** by default, which cuts off the shell items. Pass `trim_values=False`:

```python
for v in k.iter_values(trim_values=False, max_len=10**7):
    ...
```

### Attempt 2: decode raw shell items with `pyfwsi`

`fwsi.py` walks `BagMRU`, decodes every shell item, and prints the names and the FAT timestamps:

```python
import sys, datetime, pyfwsi
from regipy.registry import RegistryHive

h = RegistryHive(sys.argv[1])
root = r'\Local Settings\Software\Microsoft\Windows\Shell\BagMRU'

def ts(x):
    return (datetime.datetime(1601,1,1) + datetime.timedelta(microseconds=x//10)).isoformat()

def desc(b):
    out = []
    il = pyfwsi.item_list(); il.copy_from_byte_stream(b)
    for it in il.items:
        d = {'cls': type(it).__name__}
        for a in ('name', 'modification_time', 'file_attribute_flags',
                  'network_location', 'location', 'shell_folder_identifier'):
            try:
                v = getattr(it, a)
                if v is not None: d[a] = v
            except Exception: pass
        d['ext'] = []
        for e in it.extension_blocks:
            ed = {}
            for a in ('long_name', 'creation_time', 'access_time'):
                try:
                    v = getattr(e, a)
                    if v: ed[a] = v
                except Exception: pass
            d['ext'].append(ed)
        out.append(d)
    return out

def walk(path, depth):
    k = h.get_key(path)
    print('  '*depth + f"[{path.split(chr(92))[-1]}] lw={ts(k.header.last_modified)}")
    for v in k.iter_values(trim_values=False, max_len=10**7):
        if v.name.isdigit():
            b = v.value
            b = bytes.fromhex(b) if isinstance(b, str) else b
            print('  '*depth + f'  #{v.name} {desc(b)}')
    for s in k.iter_subkeys():
        walk(path + '\\' + s.name, depth + 1)

walk(root, 0)
```

### Resulting tree (steve, `UsrClass.dat`, after log replay)

Key last-write times are UTC.

```
BagMRU
├─ [1] My Computer                                           lw 07:37:42
│   ├─ Downloads                                             lw 07:26:18
│   │   └─ 1.zip  (created 07:25:48, modified/accessed 07:26:04)
│   │       └─ [compressed] 1                                lw 07:26:23
│   ├─ Documents                                             lw 07:31:05
│   │   ├─ OnePassword MasterPass   (key lw 07:28:49)
│   │   ├─ Engineers Tab            (key lw 07:29:34)
│   │   └─ OT Station 3 internal VPN (key lw 07:31:05)
│   └─ Pictures                                              lw 07:34:30
│       ├─ a            (created 07:33:16, key lw 07:34:02)
│       └─ a.zip        (created 07:34:24, modified/accessed 07:34:26, key lw 07:34:32)
│           └─ [compressed] a
│               ├─ Engineers Tab                             lw 07:34:34
│               ├─ OnePassword MasterPass                    lw 07:34:35
│               └─ OT Station 3 internal VPN                 lw 07:34:37
├─ [2] Shared Documents Folder (User's Files)
│   └─ AppData\Local\Temp                                    lw 07:34:40
│       ├─ Temp1_1.zip\1\Everything-1.4.1.1028.x64.zip       (created 07:15:24, key lw 07:28:17)
│       └─ Temp1_a.zip\a\Dam Construction Engineer Plans.zip (created/modified/accessed 2024-02-16 12:35:02, key lw 07:34:40)
└─ [3] Computers and Devices
    └─ Prod-ns-2
        └─ \\Prod-ns-2\prodshare                             lw 07:32:23
            └─ Construction 2027  (created 07:00:26, accessed 07:21:46, key lw 07:34:04)
```

### NTUSER.DAT supplements

RecentDocs for `.zip` (MRU order, most recent first):

```
RecentDocs\.zip   lw 2025-09-03T07:32:41.712845
MRU [1, 0]
  1  Dam Construction Engineer Plans.zip
  0  1.zip
```

BagMRU in NTUSER also records the share and `Construction 2027`, at `07:32:27` to `07:32:41`.

---

## 8. Step 4 — Answers, one by one

### Task 1 — Archive downloaded by the compromised account: `1.zip`

- `Downloads\1.zip` exists in steve's ShellBags.
- It was **created 07:25:48**, about 40 seconds after Edge was launched at 07:25:08 (UserAssist).
- It contains `Everything-1.4.1.1028.x64.zip`, so it is the attacker's delivery archive.

(An early lead I considered was that the Dam zip or the Everything zip was the "downloaded" archive. Both were wrong because ShellBags place them elsewhere. The Downloads folder entry is the proof of download.)

### Task 2 — Utility used to search for sensitive data: **Everything**

- `Temp1_1.zip\1\Everything-1.4.1.1028.x64.zip` shows the tool was extracted from `1.zip` at 07:28:17.
- UserAssist records `...Temp1_Everything-1.4.1.1028.x64.zip\everything.exe`, so it was actually run.
- Everything (voidtools) is an instant file-name search tool.

### Task 3 — VPN folder accessed: `2025-09-03 07:31:05`

`Documents` has MRU order `[2, 1, 0]`, so the VPN folder (item 2) is the most recent. Its key last-write and its parent's are both `07:31:05.130697`.

```
Documents MRU = [2, 1, 0]
  0 OnePassword MasterPass       lw 07:28:49
  1 Engineers Tab                lw 07:29:34
  2 OT Station 3 internal VPN    lw 07:31:05   <- answer
```

The folder's own FAT access time (07:11:50) is a pre-attack timestamp, which is why it is not the answer.

### Task 4 — Directory with the victim's passwords: `OnePassword MasterPass`

It sits in `Documents`, was browsed first (07:28:49), and was later staged into `Pictures\a`.

### Task 5 — UNC path: `\\Prod-ns-2\prodshare`

It appears in three places:

- steve's `UsrClass.dat` network location shell item (key lw 07:32:23);
- steve's `NTUSER.DAT` BagMRU;
- TypedPaths (`\\Prod-ns-2\prodshare`).

### Task 6 — Dam construction planned: `2027`

The only folder browsed on the share is `Construction 2027`. This answer comes from the folder name, as the zip's contents are not visible in the registry.

### Task 7 — Archive on the network share: `Dam Construction Engineer Plans.zip`

Reasons:

- RecentDocs `.zip` lists it as the most recently opened zip (07:32:41), right after the share was browsed at 07:32:23.
- Its FAT timestamps are from **2024-02-16**, which means it was copied (preserving the original dates) rather than created by the attacker.
- It is the only archive in the staged `a` folder that did not come from the user's Documents.

### Task 8 — Archive from the share accessed: `2025-09-03 07:34:04`

This one needed several attempts. They are listed because they teach the rule.

|Attempt|Value|Result|
|---|---|---|
|Dam zip last-interacted inside `Temp1_a.zip\a`|07:34:40|rejected (this is the staging copy)|
|RecentDocs `.zip` key time|07:32:41|rejected|
|Parent-key rule on **`Construction 2027`** in the share|**07:34:04**|**accepted**|

The share-side ShellBag only holds the containing folder, `Construction 2027`. Its key last-write is `07:34:04.095502`. The question is asking for the attacker's interaction with the share's archive, which is recorded as that folder entry.

### Task 9 — Staging folder: `C:\Users\steve\Pictures\a`

- `Pictures` is identified by its known-folder GUID `24ad3ad4-a569-4530-98e1-ab02f9417aa8`.
- `a` was **created at 07:33:16**, just before the share browsing finished.
- It holds copies of the three Documents folders (`Engineers Tab`, `OnePassword MasterPass`, `OT Station 3 internal VPN`) plus the dam zip.

Known-folder GUID check:

```python
import uuid
g = str(uuid.UUID(bytes_le=item_bytes[4:20]))
# 1 -> d3162b92-9365-467a-956b-92703aca08af  = Documents
# 2 -> 24ad3ad4-a569-4530-98e1-ab02f9417aa8  = Pictures
```

### Task 10 — Exfiltration archive accessed: `2025-09-03 07:34:30`

The exfil archive is `Pictures\a.zip` (created 07:34:24). Compute the MRU order for each key:

```python
# mru.py excerpt
mru = vals['MRUListEx']
order = [struct.unpack('<I', mru[i:i+4])[0] for i in range(0, len(mru), 4)]
```

Output for the Pictures branch:

```
2 lw=2025-09-03T07:34:30.081864 MRU=[1, 0, 4294967295]
  0 lw=2025-09-03T07:34:02.579734   <- folder "a"
  1 lw=2025-09-03T07:34:32.626130   <- a.zip
```

`a.zip` is **MRU position 0** in `Pictures`, so by the ShellBags Explorer rule its Last Interacted time is the **parent** key's last write: `07:34:30.081864`. The item's own key time (07:34:32) and its FAT access time (07:34:26) are decoys. Task 10 was accepted on this value.

> Task 3 happened to match under the "own key" and "parent key" readings only because the VPN folder was both the newest node and position 0.

---

## 9. Attack timeline (UTC)

|Time|Event|Source|
|---|---|---|
|07:24:21|Teams launched|UserAssist|
|07:25:08|**Edge launched**|UserAssist|
|07:25:48|`Downloads\1.zip` created|ShellBags|
|07:26:04|`1.zip` opened|ShellBag FAT time|
|07:28:17|`Everything-1.4.1.1028.x64.zip` extracted to `Temp\Temp1_1.zip`|ShellBags|
|07:28:49|`OnePassword MasterPass` folder browsed|ShellBags|
|07:29:34|`Engineers Tab` browsed|ShellBags|
|07:31:05|`OT Station 3 internal VPN` browsed (Task 3)|ShellBags|
|07:32:23|`\\Prod-ns-2\prodshare` accessed|ShellBags|
|07:32:41|Dam zip opened (RecentDocs)|NTUSER|
|07:33:16|Staging folder `Pictures\a` created|ShellBag FAT time|
|07:34:04|`Construction 2027` interaction (Task 8)|ShellBags|
|07:34:24|`a.zip` created|ShellBag FAT time|
|07:34:30|`a.zip` last interacted (Task 10)|ShellBags|
|07:34:34–37|Staged folders browsed inside `a.zip`|ShellBags|
|07:34:40|Dam zip extracted to `Temp1_a.zip\a`|ShellBags|
|07:49–07:53|Responder (admin) runs KAPE|KAPE logs|

Attack story: the attacker got a zip into steve's Downloads, extracted and ran Everything to find files, and browsed steve's password and VPN folders. They then visited the production share, copied the sensitive folders plus the dam plans into `Pictures\a`, compressed that into `a.zip`, and reviewed it before exfiltration.

---

## 10. Lessons learned and pitfalls

1. **Replay transaction logs before parsing.** Live-collected hives are dirty. Use `rla` or `regipy-process-transaction-logs`.
2. **Empty log files** (here `LOG1` was 0 bytes) crash replay when passed as an input. Check sizes first and pass only the valid log.
3. **Log filenames are case-sensitive on Linux.** `ntuser.dat.LOG1` will not match `NTUSER.DAT`.
4. **regipy trims binary values to 128 bytes.** This is why zip contents showed as `<UNKNOWN: 0x00>`. Use `trim_values=False`.
5. **ShellBag "Last Interacted" is a key last-write time**, taken from the **parent** key for the MRU-position-0 item. FAT times stored inside a file item are a different timestamp.
6. **Copying preserves old timestamps.** The dam zip showed 2024 dates inside the attacker's staging area, so those dates describe the original file.
7. **Do not trust the first plausible archive name.** The "downloaded" archive was the one in `Downloads`, not the one that looked most interesting.
8. **KAPE logs show local time** while the registry is UTC. Work in UTC.
9. **Check the other user's hive and its timestamps** before deciding who is compromised.

---

## 11. Tools and references

- Eric Zimmerman tools: `rla` (Registry Log Analyzer), SBECmd, ShellBags Explorer, Registry Explorer, RECmd.
- regipy (`regipy-process-transaction-logs`, `regipy-plugins-run`), `libfwsi` / `pyfwsi`.
- KAPE (collection tool that produced the evidence).
- SANS Windows Forensic Analysis poster for artifact meanings.