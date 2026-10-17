---
created: 2025-11-09
modified: 2025-11-09
---


## msDS-AllowedToDelegateTo

[[Delegation#**2. Kerberos Constrained Delegation (KCD)**]]
The `msDS-AllowedToDelegateTo` attribute in Active Directory is a multi-valued Unicode string that specifies the service principal names (SPNs) of services to which a user or computer account is allowed to perform Kerberos constrained delegation (KCD) on behalf of other users. This attribute is used to define the specific services on a target computer that the source account can impersonate any user to authenticate with, provided the source account has the `TRUSTED_TO_AUTH_FOR_DELEGATION` flag set in its `UserAccountControl` attribute.

Also be aware of the `SENSITIVE_AND_CANNOT_DELEGATE` (Account is sensitive and cannot be delegated) and other computed flags; those block delegation even if other bits are set.

Also this flag `NOT_DELEGATED` under the `userAccountControl` denies other user from delegating the user. This would be something like.

```bash
userAccountControl: NORMAL_ACCOUNT; DONT_EXPIRE_PASSWORD; NOT_DELEGATED
```

Finally is the user you are trying to delegate to is in the `Protected user Group` delegation to that user is prohibited

[[Groups#Protected users Group]]

In this case this user cannot delegate any users. First because the `msDS-AllowedToDelegateTo` is empty and second the user is 'not trusted for delegation'

```powershell
*Evil-WinRM* PS C:\Users\nathan.aadam\Documents> Get-ADUser -Identity mark.bbond -Properties msDS-AllowedToDelegateTo,TrustedForDelegation,TrustedToAuthForDelegation | Format-List msDS-AllowedToDelegateTo,TrustedForDelegation,TrustedToAuthForDelegation


msDS-AllowedToDelegateTo   : {}
TrustedForDelegation       : False
TrustedToAuthForDelegation : False
```

From linux we can check at the `userAccountCOntrol` to identify if the user has the `TRUSTED_TO_AUTH_FOR_DELEGATION` flag set in its `UserAccountControl` attribute.

```bash
bloodyAD -u 'mirage-service' -k -d mirage.htb --host dc01.mirage.htb get object mark.bbond --attr userAccountControl

distinguishedName: CN=mark.bbond,OU=Users,OU=Support,OU=IT_Staff,DC=mirage,DC=htb
userAccountControl: NORMAL_ACCOUNT; DONT_EXPIRE_PASSWORD
```


## servicePrincipalName

Having write privileges to the `servicePrincipalName` attribute lets us add an SPN to a user account; once an SPN is present we can request a service ticket (TGS) for that SPN and perform **Kerberoasting**—extracting the TGS for offline cracking to try to recover the service account’s password (or NTLM-equivalent) if the account uses a crackable key.

## userPrincipalName

If you can modify `userPrincipalName`, you can align a target account’s UPN with a privileged account or with the identity expected by a vulnerable certificate template; when an AD CS template permits enrollment based solely on the requested UPN, the CA may issue a certificate asserting that identity. Possession of that certificate allows authentication as the targeted identity (e.g., via PKINIT or client cert auth), so this is a high-impact attack but depends on specific AD CS/template misconfigurations.

## msDS-AllowedToActOnBehalfOfOtherIdentity

[[Delegation#**3. Resource Based Constrained Delegation (RBCD)**]]
The `msDS-AllowedToActOnBehalfOfOtherIdentity` attribute enables **Resource-Based Constrained Delegation (RBCD)** by storing a list of principals (users, computers, or groups) that are permitted to delegate credentials to the account - meaning if you control this attribute on a target computer or service account, you can configure it to allow a compromised account you control to impersonate any user (including administrators) when connecting to that service, effectively granting you privileged access through delegation attacks.

Also if the flag `NOT_DELEGATED` is set in the target's `userAccountControl` attribute we wont be able to impersonate the target account. You can check this in two ways:

- From linux 
```bash
bloodyAD -u 'mirage-service' -k -d mirage.htb --host dc01.mirage.htb get object Administrator --attr userAccountControl  

distinguishedName: CN=Administrator,CN=Users,DC=mirage,DC=htb
userAccountControl: NORMAL_ACCOUNT; DONT_EXPIRE_PASSWORD; NOT_DELEGATED
```

- from windows 

```powershell
*Evil-WinRM* PS C:\Users\nathan.aadam\Documents> $u = Get-ADUser administrator -Properties userAccountControl
*Evil-WinRM* PS C:\Users\nathan.aadam\Documents> ($u.userAccountControl -band 0x100000) -ne 0 
True
*Evil-WinRM* PS C:\Users\nathan.aadam\Documents> 
```

True means `NOT_DELEGATED` flag is set

https://www.ired.team/offensive-security-experiments/active-directory-kerberos-abuse/resource-based-constrained-delegation-ad-computer-object-take-over-and-privilged-code-execution

https://www.hackingarticles.in/domain-escalation-resource-based-constrained-delegation/

