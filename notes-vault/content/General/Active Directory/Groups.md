---
created: 2025-11-10
modified: 2025-11-10
---

## Protected users Group

In Active Directory (AD), the concept of "**protected objects**" is managed through specific security mechanisms. The **`AdminSDHolder`** object, located in the System container of every domain, serves as a template for the security descriptors applied to protected accounts and groups. This object holds the Access Control List (ACL) that is propagated to members of protected groups by the `SD Propagator process`, which runs on the `PDC emulator` every hour by default. The purpose of this process is to ensure that protected objects maintain their specific, restrictive permissions, which remain even if the objects are moved within AD.

The Protected Users group is a built-in security group introduced with Windows Server 2012 R2 designed to enhance the security of high-privilege accounts by enforcing stricter authentication policies. When a user is added to this group, several security restrictions are automatically applied:
- Kerberos Ticket-Granting Ticket (TGT) caching is disabled, 
- NTLM authentication is blocked, 
- only AES encryption is allowed for Kerberos pre-authentication, 
- delegation is prohibited, 
- and the user ticket lifetime is limited to a maximum of 4 hours. 

These measures significantly reduce the risk of credential theft from attacks like Pass-the-Hash and Pass-the-Ticket.

## Certificate Service DCOM Access group

The Certificate Service DCOM Access group is a built-in local security group in Active Directory that grants the necessary permissions for users and computers to connect to and enroll for certificates from a Certification Authority (CA) via DCOM. This group is automatically created when the Active Directory Certificate Services (ADCS) role is installed on a server. It is specifically designed to allow authenticated users to perform certificate enrollment through the Windows Client Certificate Enrollment Protocol (MS-WCCE).

The group is populated by the NT AUTHORITY\Authenticated Users identity group, which represents every domain user account that can successfully log on to the domain. This ensures that all authenticated users have the ability to request certificates from the CA. The group has a well-known SID/RID of S-1-5-32--574.

The group is granted both Local and Remote Activation permissions on the DCOM server for the CertSrv Request application, which is a critical aspect of its function. This allows authenticated users to remotely activate the DCOM object, which impersonates the SYSTEM account, thereby providing a high-privilege context for the certificate enrollment process. This configuration, while necessary for functionality, has been identified as a potential vector for exploitation, such as in the ADCSCoercePotato attack, where a low-privileged user can coerce the CA server to authenticate against a remote listener to capture and relay credentials.

Administrative tasks related to this group include verifying its membership and permissions. It is essential to ensure that the group is correctly configured in the Component Services administrative tool, with the Certificate Service DCOM Access group granted both Local Access and Remote Access permissions under Access Permissions, and both Local Activation and Remote Activation permissions under Launch and Activation Permissions. The group should also be present in the list of groups with these permissions. Furthermore, the EnableDCOM registry value on the CA server must be set to Y to allow DCOM access.

The group is created as a built-in local group on the server where the ADCS role is installed, and its scope is not dependent on the server's role as a domain controller or member server. However, its membership and the overall configuration can be influenced by Group Policy settings, particularly those related to DCOM access restrictions and unauthenticated RPC client restrictions.

To learn more about the exploitation check this out ... https://decoder.cloud/2024/02/26/hello-im-your-adcs-server-and-i-want-to-authenticate-against-you/

