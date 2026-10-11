---
created: 2025-09-04
modified: 2025-09-04
---

#intoduction
[[Active Directory Challenges]]

I just want to have a brief introduction about AD. We will get into details as we move on.
## Overview

Active directory (AD) is a distributed, hierarchical structure that allow for centralized management of an organization's resources including users, computers, groups, network devices, file shares, group policies, servers, workstations and trusts.

## AD terminology

Let's have brief defination of the terms that we will come across.

- **Object** : This refers to any resource present within an AD environment. This includes users, computers, domain controllers, printers etc
- **Domain** : A domain is a logical group of objects such as users, OUs , computers, groups etc. Domains can operate entirely independent of one another or be connected via trust relationships.
- **Forest** : Forest is a collection of AD domains. It is the top-most container and contains all AD objects including domains, ou, users, groups, GPOs etc.
- **GUID (Global Unique Identifier)** : It is a unique value assigned when a domain user or group is created. it is stored in the *ObjectGUID* attribute and is unique across the enterprise.
- **Security Principal** : It is an entity that can be granted permissions to access network resources. Security principals can be users, groups, computers etc. Each security principal is assigned a **Security identifier (SID)** which is a unique value used to identify it in the domain. 
- **Security identifier (SID)**:  which is a unique value used to identify it in the domain. 
- **Distiquished Name (DN)** : It is a unique identifier in AD or LDAP. It is used to reference and locate objects with the AD structure. eg *CN=John CN=Doe OU=Users DC=MyDomain DC=com*
- **sAMAccountName** : It is the user's logon name and is unique among all security principal within the domain.
- **Global Catalog** : Is a domain controller that store copies of all objects in an AD forest or domain. The GC stores a full copy of all objects in the current domain and partial copy of objects in another domain in the forest.
- **Replication** : Replication happens in AD when AD objects are updated and transfered from one DC to another. This ensures that changes are synchronized with all other DCs in a forest , helping create a backup incase one Dc fails.
- **Service Principal Name (SPN)** : A SPN uniquely identifies a service instance. They are used in kerberos authentication to associate an instance of a service with a logon  account, allowing client applications to authenticate an account without needing to know the account name.
- **Group Policy Object (GPO)** : GPO are virtual collections of policy settings. They can be applied to all users and computers in a domain or defined more granularly at OU level.
- **Access Control List (ACL)** : An ACL is an ordered list of ACEs that apply to an object.
- **Access Control Entries (ACE):** Each ACE in ACL identifies a trustee (user or computer account or logon session) and list the access rights that are allowed, denied or audited for that given trustee.
- **Discretionary Acess Control List (DACL)** : DACLs define which security principles are granted or denied to an object. It contains a list of ACEs. When a process tries to access an securable object, the system checks the ACEs in the object's DACL to determine whether or not to grant access. If an object does not have a DACL, then system will grant full access to the everyone but if the object has a DACL and the DACl has no ACE entries then the system will deny all access attempts.ACEs in the DACL are checked in sequence untill a match is found that allows the requested rights or until access is denied.
- **System Access Control Lists (SACL)** : Allows for administrators to log access attempts that are made to a securable objects. ACEs specify the types of access attempts that cause the system to generate a record in the security event log.
- **Full Qualified Domain Name (FQDN)** : It is the complete name for a specific computer or host. It is written with the hostname and domain name in the format *[host name].[domain name].[tld]* eg jinx.Mydomain.com
- **AD Recycle BIn** : When the AD recyle bin is enabled, any deleted objects are preserved for a period of time, facilitating restoration if needed. The biggest advantage of AD recycle bin is that most of deleted object's attributes are preserved which makes it easier to fully restore a deleted object to its previous state.
- **SYSVOL** : The SYSVOL folder or share stores copies of public files in the domain such as system policies, Group policy setting , logon and logoff scripts and often contains other types of scriptes that are executed to perform various tasks in the AD environment.
- **NTDS.DIT** : The NTDS.DIT file can be considered the heart of AD. It is stored in a DC at *C:\Windows\NTDS*  and is a database that stores AD data such as information about users and group objects, group membership and most important to attackers and penetration testers, the password hashes of all users in the domain. If the setting *Store Password With Reversible Encryption* is enables, then NTDS.DIT will also store clear text passwords for all users created or who change their password after this policy was set. 
- **Organizational Unit (OU)** Is a conatiner in AD used to store similar objects for ease of administration eg HR ou, IT OU etc
-  **Privilege Attribute Certificate (PAC)** is a data structure that Active Directory embeds inside Kerberos tickets (both TGTs and TGSs) to carry a user’s full authorization details. You can think of it as the Kerberos equivalent of a Windows access token: it contains the user’s SID, group memberships, any SIDHistory values, logon times, and delegation information, all of which Windows services use to decide what the user can and cannot access. The Domain Controller (KDC) generates the PAC when it issues a ticket and signs it with the KRBTGT key so its integrity can be verified. When a service like CIFS, LDAP, or WinRM receives a Kerberos ticket, it extracts the PAC, validates the signature, and builds a local access token from its contents. This means that the PAC is the real “authority” in determining a user’s effective rights in the domain: if the PAC says you’re in Domain Admins or Enterprise Admins, Windows will treat you as such. Because of this, attacks like Golden Tickets, Silver Tickets, and SIDHistory injection all revolve around forging or tampering with the PAC—if you can generate one with a valid KRBTGT signature and add whatever SIDs you want, services across the domain will trust it completely.

### Trusts

A trust is used to estbalish forest-forest of domain-domain authentication allowing users to access resouces in another domain outside the domain that thei account reside in.
A trust creates a link between the authentication systems of two domain.

Trusts can be transitive or non-transitive:
- A transitive trust means that trust is extended to objects that the child domain trusts
- In non-transtive trust, only the child domain itself is trusted

Trust can also be set to be one-way or two way (bidirectional)
- In bidirectional trusts, users from both trusting domains can access resources
- In one-way trusts, only users in the trusted domain can access resources in a trusting domain. The direction of trust is opposite to the direction of access.

#### Types of Trusts
**Parent-Child** : Domains with the same forest. The child domain has a two way transitive trust with the parent domain.
**Cross-link** : Trust between child domains.
**External** : A non-transtive trust between two separate domains in separate forests which are not already joined by a forest trust.
**Tree-root** : A two way transitive trust between a forest root domain and a new tree root domain.
**Forest** : A Transitive trust between two forest root domains.
[[trust.canvas|trust]]

## Kerberos, DNS, LDAP, MSRPC, NTLM

### Kerberos

Kerberos is a computer-network authentication protocol that works on the basis of tickets to allow nodes communicating over non-secure network to prove their identity to one another in a secure manner. It uses port 88 for UDP and TCP by default.

Kerberos is a stateless authentication protocol based on tickets intead of trasmitting passwords over the network.
As part of Active Directory Domain Services (AD DS), DCs have a keberos Key Distribution Center (KDC) that issues tickets. 

When a user initiates a login request to a system, the client requests a ticket from the **KDC** by sending a **AS-REQ** and ecrypting the timestamp of the request with the user's password hash. The KDC attempts to decrypt the timestamp usign the user's password hash (keeps a record of the users password/ password hash). It the KDC decrypts the timestamp, it then creates the **Ticket Granting Ticket (TGT)** and tranmits it to the user **AS-REP**.
The user then presents the its **TGT** to the KDC to request a **Ticket Granting Service (TGS)**, **TGS-REQ**. The KDC verifies the TGT and if valid issues the **TGS** , **TGS-REP** for accessing the specified service in the **TGS-REQ** . The TGS is encrypted with the service's NTLM hash.
Finnaly the user requests access to the required service by presenting the TGS to the service which decrypts it with its password hash. If the entire process completes appropriately, the user us granted access to the requested service or application.

[[kerberos authenticaton process.canvas|kerberos authenticaton process]]

### DNS

Active Directory Domain Services (AD DS) uses DNS to allow clients (workstations, servers and other systems that communicate with the domain) to locate the domain contoller and for domain contoller the host directory services to communicate amng themselves.
DNS is used to reslove host names to ip address in internal networks and the internet and uses TCP and UDP port 53.

Forward DNS lookup -> used to retrieve the DC's ip address in a domain.
Reverse DNS lookup -> Used to obtain the DNS name of a host in  usign the ip address.

### LDAP (Lightweight Directory Access Protocol)

LDAP is an open-source and cross platform protocol used for authentication against various directory serrvices such as AD.
LDAP uses port 389 and LDAP over SSL (LDAPS) communicates over port 636.

AD stores user account information and security information such as passwords and facilitates sharing this information with other devices in the network. LDAP is a language applications use to communicate with other servers that provide directory services. In other words , LDAP is how systems in the network environment "speak" to AD.

An LDAP session begins by first connecting to an LDAP server, also known as a **Directory System Agent.** The DC in AD actively listens for LDAP queries such as security authentication requests. 

[[LDAP.canvas|LDAP]]

> LDAP provides a way to access and query various directory services.

#### AD LDAP Authentication

LDAP is set up to authenticate credentials against AD using a "**BIND**" operation to set the authentication state for LDAP session. There are two types of LDAP authentication :
1. **Simple Authentication** : This includes anonymous authentication (unauthenticated authentication) and username/password authentication. Simple authentication means that a username and password create a **BIND** request to authenticate to the LDAP server.
2. **SASL AUthentication (Simple Authentication and Security Layer** : SASL users other authentication services such as kerberos to **BIND** to LDAP server and then uses this authentication service (kerberos in this example) to authenticate to LDAP.

The LDAP server uses the LDAP protocol to send an LDAP message to the authorization service which initiates a series of challenge/response messages resulting in etiher successfull authentication. SASL can provide additional security due to separation of authentication methods from application protocols.

### MSRPC

MSRPC is a microsoft's implementation of Remote Procedure Call (RPC) an interprocess communication technique used for client-server model applications. Windows syatems use MSRPC to access systems in AD using the four key RPC interfaces :
1. LSARPC 
2. NETLOGON
3. SAMR
4. DRSUAPI

#### LSARPC

LSARPC is a set of RPC calls to the **Local Security Authority (LSA)** system which manages the local security policy on a computer, contols audit policy, and provides interactive authentication services. LSARPC is used to perform management on domain security policies. 

##### How it works
When a user attempts to logon to the system by entering a username and password in the logon dialog box, the logon process invokes the LSA which passes the user's credentials to the **Security Account Manager (SAM)** which manages the account informatin stored in the local SAM database.

The SAM compares the user's credentials to determine whether the user is authorized to access the system. If it finds the user account information in the SAM database the SAM authenticates to the user by creatign a logon sesson and returning the security identifier (SID)  of the user and the SIDs of the global groups the user is a member of to the LSA.

The LSA then grants the user a access token that contains the user's individual and group SIDs and their rights, this enables the user to access resources that she or he has permissions to.

##### LSA and Active Directory

In a domain environment, the Local security Authority (LSA) plays a crucial role in facilitating network logons through its interactions with  AD. 

When a user tries to logon to a domain joined computer, the LSA communicates with the domain controller (DC) to authenticate the user's credentials against the AD database. This process involves the use of kerberos authentication protocol where the LSA acts as a client requesting access on behalf of the user.

The LSA sends a request to the Key Distribution Center (KDC) service running on the DC, including a Ticket Grating TIcket (TGT) request encrypted with the use's password hash. If the credential are are verified and are valid, the KDC issues a TGT and session keys too user's system. The LSA then uses this TGT to request access tokens for accessing resources within the doman , effectively managing the user's session and enforcing security policies as defined by AD.

#### NETLOGON
Netlogon is a windows process used to authenticate users and other services in the domain environment. It is a service that continuously runs in the background.
#### SAMR
Remote SAM (SAMR) provides management functionality for the domain account database, storing info about users and groups.

#### DRSUAPI

DRSUAPI is a microsoft API thet implements the director replication service (DRS) remote protocol which is used to perform replication-related tasks across domain controllers in a multi-DC environment. Attackers can utilize DRSUAPI to create a copy of NTDS.dit file to retrieve password hashes foll all accounts in the domain which can be used to perform **pass-the-hash** attacks to access more systems or crack the hashes to ibtain cleartext passwords.

### NTLM Authentication

NT Lan Manager (NTLM) hashes are used in modern windows systems. It is a challenge-response authentication protocol and users three messages to authenticate.
A client first sends a **NEGOTIATE-MESSAGE** to the server whose response is a **CHALLENGE-MESSAGE** to verify the client's identity. Lastly the client responds with an **AUTHENTICATE_MESSAGE**
This hashes are stored in the SAM database or the NTDS.DIT database file on a domain controller. The protocol has two hashed password values to choose from to perform authentication, the LM and the NT hash which is the MD4 hash of the little-endian UTF_16 value of the password.

## Local Privileges

**SeRemoteInteractiveLogonRight** : This privilege could give our target user the right to logon on to a  host via RDP.

**SeBackupPrivilege** : This grants a user the ablity to create system backups and could be used to obtain copies of sensitive system files that can be used to retrieve passwords such as the SAM and SYSTEM registry hive and the NTDS.DIT AD database file.

**SeDebugPrivilege** : This allow a user to debug and adjust the memory of processes. With this privilege attackers could utilize a tool such as Mimikatz to read the memory space of the Local Syatem Authority  (LSASS) process and obtain any credentials stored in memory. 

**SeImpersonatePrivilege** : This allows a user to impersonate a token of a privileged account such as NT Authority\System. This could be leveraged with a tool such as juicypotato.

**Se LoadDriverPrivilege** : A user with this priilege can load and unload device drivers that could potentially be used to escalate privileges or compromise a system.

**SeTakenOwnershipPrivilege** : This allows a process  to take ownership of an object. At its most basic level, we could use this privilege to gain access to a file or a file on a share that was otherwise nt accessible to us.

### Group Managed Service Account (gMSA)

