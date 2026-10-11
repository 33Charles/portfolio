---
created: 2025-10-30
modified: 2025-10-30
---

## COM
https://www.synacktiv.com/publications/dissecting-dcom-partie-1
The **Component Object Model (COM)** is Microsoft’s architectural framework that defines a standard way for software components to interact, regardless of the programming language they were written in or when they were developed. It provides a binary-level contract through interfaces, identified by globally unique identifiers (GUIDs), which allow applications to create and use reusable components without needing to know their internal implementation. COM objects can be implemented as in-process DLLs, out-of-process executables, or even remotely via DCOM, and are registered in the Windows Registry so the system knows how to locate and instantiate them.

To understand COM (and therefore all COM-based technologies), it is crucial to understand that it is not an object-oriented language but a standard. Nor does COM specify how an application should be structured; language, structure, and implementation details are left to the application developer. Rather, COM specifies an object model and programming requirements that enable COM objects (also called COM components, or sometimes simply _objects_) to interact with other objects. These objects can be within a single process, in other processes, and can even be on remote computers. They can be written in different languages, and they may be structurally quite dissimilar, which is why COM is referred to as a _binary standard_; a standard that applies after a program has been translated to binary machine code.

COM defines the essential nature of a COM object. In general, a software object is made up of a set of data and the functions that manipulate the data. A COM object is one in which access to an object's data is achieved exclusively through one or more sets of related functions. These function sets are called _interfaces_, and the functions of an interface are called _methods_. Further, COM requires that the only way to gain access to the methods of an interface is through a pointer to the interface.

Besides specifying the basic binary object standard, COM defines certain basic interfaces that provide functions common to all COM-based technologies, and it provides a small number of functions that all components require. COM also defines how objects work together over a distributed environment and has added security features to help provide system and component integrity.

The COM specification provides all of the fundamental concepts that enable cross-platform software reuse:

- A binary standard for function calls between components.
- A provision for strongly-typed groupings of functions into interfaces.
- A base interface that provides polymorphism, feature discovery, and object lifetime tracking.
- A mechanism that uniquely identifies components and their interfaces.
- A component loader that creates component instances from a deployment.

COM has a number of parts that work together to enable the creation of applications that are built from reusable components:

- A _host system_ that provides a run-time environment that conforms to the COM specification.
- _Interfaces_ that define feature contracts, and _components_ that implement interfaces.
- _Servers_ that provide components to the system, and _clients_ that use the features provided by components.
- A _registry_ that tracks where components are deployed on local and remote hosts.
- A _Service Control Manager_ that locates components on local and remote hosts and connects servers to clients.
- A _structured storage_ protocol that defines how to navigate the contents of files on the host's file system.

### Objects and Interfaces

A COM object exposes its features through as  **_interface_**, which is a collection of member functions. A COM interfce defines the expected behavior and responsibilties of a component, and it specifies a strongly-types contract that provides a small set of related operations. All communiaction among COM components occur through interfaces, and all services offered by a component are exposed through its interface. A caller can access only the interface member functions. Internal state is unavailable to a caller unless it is exposed in the interface.

Interfaces are strongly typed. Every interface has its own unique interface identifier, named an IID, which eliminates collisions that could occur with human-readable names. The IID is a globally unique identifier (GUID), which is the same as the Universally Unique ID (UUID) defined by the Open Software Foundation (OSF) Distributed Computing Environment (DCE). When you create a new interface, you must create a new identifier for that interface. When a caller uses an interface, it must use the unique identifier. This explicit identification improves robustness by eliminating naming conflicts that would result in run-time failure.

When you implement an interface, your class must provide an implementation for every function in the interface. If the class has no work to do in an interface function, the implementation may be a single return statement.

A COM class is identified by using a unique 128-bit Class ID (CLSID) that associates a class with a particular deployment in the file system, which for Windows is a DLL or EXE. A CLSID is a GUID, which means that no other class has the same CLSID. The use of unique class identifiers prevents name collisions among classes. For example, two different vendors can write a class named CStack, but both classes have a unique CLSID, so any possibility of a collision is avoided.

To learn more about COM click [here](https://learn.microsoft.com/en-us/windows/win32/com/component-object-model--com--portal) 
Checkout about the most basic COM attacks, [[Windows Registry#COM Hijacking]]

> [!summary]
> **COM is a binary standard for reusable software components.** It's not a language but a set of rules that allows code written in different languages to interact seamlessly. Components communicate through strictly defined **interfaces**, hiding their internal implementation.
> 
> The Windows **Registry** acts as a directory, using unique **GUIDs** to locate components. The most important GUIDs are:
> 
> - **CLSID (Class ID):** A unique identifier for a **COM Class** (the actual implementation in a DLL or EXE).
> - **IID (Interface ID):** A unique identifier for an **interface** (the group of functions a class implements).
> 
> A client only needs to know a component's **CLSID** to ask the system to create it. The system consults the registry to find the executable file for that CLSID, loads it, and returns a pointer to the requested interface, allowing the client to use the component without knowing where it is or how it was built.


## DCOM

**DCOM (Distributed Component Object Model)** is COM extended for networked (remote) activation and invocation. It uses the COM runtime plus Microsoft RPC (MS-RPC) to marshal calls between machines; the RPC Endpoint Mapper (TCP 135) is used for initial endpoint negotiation, after which dynamic RPC ports or named pipes may be used.

At its heart, **DCOM (Distributed Component Object Model)** is a technology that allows software components to communicate with each other across a network. It's an extension of **COM (Component Object Model)**,which enables this communication _on a single machine_.
### How DCOM works

1. Client requests a COM class (CLSID) and asks for remote activation.
2. COM runtime on the client marshals the call into an MS-RPC request.
3. The request goes to the server machine’s RPC Endpoint Mapper (TCP 135) which helps locate the service’s endpoint.
4. The server’s RPC runtime receives and unmarshals the call and hands it to the server COM runtime (rpcss / COM Service) which locates the implementation and creates the object.
5. The COM component executes the requested method and returns results via RPC back to the client.
6. The client’s COM runtime unmarshals the reply; the client application is unaware the object ran remotely.

> Note: RPC endpoint negotiation means DCOM traffic can switch from TCP 135 to a dynamic TCP port or to named pipes (over SMB), depending on configuration.

### Technical clarifications about authentication, protocol, and attacks

- **Authentication levels:** DCOM/RPC supports different RPC authentication levels (None → Connect → Packet → Packet Integrity → Packet Privacy). These determine whether and how credentials are sent and integrity/privacy protections applied.

- **Credential flow:** DCOM activations commonly authenticate using NTLM or Kerberos. Some attacks coerce or relay these authentications; the exact abuse pattern depends on whether the target authenticates to the attacker or whether authentication tokens are relayed.

- **Protocol confusion specifics:** MS-RPC is a complex protocol family — it can run over multiple transports (TCP, named pipes, HTTP in some cases). This multiplexing is what Potato-style attacks manipulate (by controlling how/where authentication occurs).

- **Remote vs local activation:** DCOM remote activation uses RPC to create objects on a remote host. However, many Potato-style LPEs target _local_ COM/DCOM activation flows, coercing privileged local services to authenticate (or perform privileged actions) to the attacker — not always purely remote DCOM calls.

#### Attacks & misuse 

- **DCOM privilege escalation (Potato family):** These attacks generally coerce a higher-privileged service or COM activation to send credentials or perform an operation that yields privilege (ie NTLM relay, forced authentication, or command execution). They exploit RPC/DCOM activation behavior, AppID/RunAs configurations, or misused COM interfaces. 

- **Remote code execution & lateral movement:** DCOM can be an RCE vector if a remotely-exposed COM interface is vulnerable. It can also facilitate living-off-the-land remote execution via legitimate COM objects (e.g., remote `MMC`/`Shell` objects), but that depends on available interfaces and permissions.

- **Misconfigured Launch/Access ACLs:** Overly permissive ACLs for DCOM objects allow low-privileged principals to remotely instantiate privileged objects or activate them locally — this is a common LPE/lateral vector.

### The Three primary abuse cases

#### Lateral Movement & Remote Execution

This is the direct abuse of DCOM's intended functionality: executing code remotely.

**Mechanism:** Instantiate a COM object on a remote machine that has methods capable of code execution (e.g., `MMC20.Application`'s `ExecuteShellCommand`, `ShellWindows`' `ShellExecute`).

**Requirements:**

- **Network Access:** Ability to communicate with the target on port 135 (RPC Endpoint Mapper) and the subsequent dynamic port.

 - **Credentials:** Credentials for a user with permission to remotely activate the object and call the method. This often requires local administrator privileges on the target.

**Why it's powerful:** It's a pure Living-off-the-Land (LOLBin) technique. You are using `mmc.exe` or `explorer.exe` on the remote host to run your payload, leaving no malicious service behind and blending in with normal administrative traffic.

example of a poershell command

```powershell
# Trigger calc.exe on remote machine 192.168.1.10
$com = [activator]::CreateInstance([type]::GetTypeFromProgID("MMC20.Application", "192.168.1.10"))
$com.Document.ActiveView.ExecuteShellCommand("c:\windows\system32\calc.exe", $null, $null, "7")
```

#### Privilege Escalation via Authentication Coercion (The "Potato" Family)

This is more sophisticated and exploits the _authentication flow_ of DCOM/RPC, not just its methods.

**Mechanism:** Force a privileged system component (like a service running as `SYSTEM` or a logged-in Domain Admin) to authenticate to an RPC/DCOM server that you control. This is the core of attacks like **JuicyPotato**, **PrintSpoofer**, and **RemotePotato0**.

**Requirements:**

- **Initial Foothold:** A low-privileged shell on the target.

- **Specific Privilege:** Often the `SeImpersonatePrivilege` (common for service accounts), which allows you to impersonate the token of the connecting high-privileged entity.

- **Protocol Manipulation:** Tricking the system into sending an authentication request to your controlled endpoint instead of the intended one. This often involves manipulating the network stack (e.g., claiming to host a server on `localhost`).

**Why it's powerful:** It turns a low-integrity process into a `SYSTEM` or Domain Admin process by stealing their authentication token via NTLM relay or Kerberos ticket forgery.

**Key Technical Insight :** The attacker acts as a **malicious DCOM/RPC server**. They abuse the DCOM architecture to make a privileged client connect to them. They then **relay** that authentication to a target service (like the local KDC on port 88) to forge a high-privileged ticket or to the local system over a named pipe to impersonate the user.

> [!NOTE]
> Sometimes you dont need to have `SeImpersonatePrivilege`, you just need to force a user to auntheticate to a server you control which can result to you having the user's Ticket, NTLM hash or even clear text credentials

#### Exploiting Misconfigured Permissions

This attacks the security descriptors (ACLs) you mentioned, which govern who can launch and access DCOM objects.

**Mechanism:** The `LaunchPermission` and `AccessPermission` for a DCOM object's `AppID` in the registry are misconfigured, granting low-privileged users (e.g., `Authenticated Users`, `Everyone`) the right to activate powerful objects.

 **Requirements:**

- **Writeable Registry Paths:** Ability to query the registry and find these misconfigurations.

- **No Admin Needed:** If the permissions are weak, you don't need admin rights to exploit them; you can activate the object directly.

**Why it's powerful:** It provides a direct path to privilege escalation or code execution without needing to coerce authentication or have admin credentials. You simply use the powerful object you were incorrectly given access to.

### The Registry's Role in DCOM
 For DCOM to work, the system must know _where_ to find the remote object.
- **AppID Key:** A DCOM application is registered under `HKEY_CLASSES_ROOT\AppID\{APPID-GUID}`.
- **RemoteServerName:** This value under the `AppID` key can specify the remote computer name where the object should be activated. If this is set, any request for that CLSID will be directed to that remote machine.
- **Launch Permissions:** `HKEY_CLASSES_ROOT\AppID\{APPID-GUID}\LaunchPermission` defines _who_ is allowed to request the activation of this object remotely. This is a crucial security descriptor.
- **Access Permissions:** `HKEY_CLASSES_ROOT\AppID\{APPID-GUID}\AccessPermission` defines _who_ is allowed to call methods on the object after it's created.

## OLE (Object Linking and Embedding)

**OLE** is a technology built _on top of COM_ that allows documents to contain embedded or linked content from different applications (e.g., an Excel spreadsheet inside a Word document). For red teamers, this is a classic attack vector for **client-side attacks** via weaponized documents (like phishing attachments), where malicious code is executed when a user opens a file.

---

### 1. What is OLE? The Core Concept

OLE was Microsoft's solution to create "compound documents." Its two main features are:

- **Embedding:** Storing a copy of one document (e.g., a chart) entirely inside another (e.g., a report).

- **Linking:** Storing a reference to an external document inside another. Changes to the external file are reflected in the container document.

The classic example is double-clicking an Excel chart inside a Word document; Word's menu bar seamlessly changes to Excel's, allowing you to edit the chart in-place.

### 2. The Fundamental Connection: OLE Runs on COM

This is the most important part. **OLE is not a separate technology; it is a set of specifications and standards implemented _using COM objects_.**

- The embedded chart in a Word document is, at its core, a **COM object**.

- The interaction between Word and Excel to edit that chart happens through **COM interfaces**.

- When you open a document with an embedded object, the container application (Word) uses COM to activate the server application (Excel) and retrieve the necessary interfaces to display and edit the object.

### 3. The Red Teaming Perspective: Attack Surface

OLE introduces a massive attack surface because it allows files to instruct applications to load and execute complex, external code components. This is exploited in several ways:

#### A. Weaponized Documents (Phishing)

This is the most common and practical use of OLE for initial access.

- **Mechanism:** A malicious document (e.g., `.doc`, `.ppt`, `.xls`) is crafted to contain an embedded OLE object. This object can be designed to exploit a vulnerability in the host application (e.g., Word) or the server application (e.g., Excel) when it's activated.

- **Execution Flow:**
    
    1. User opens a malicious `.docx` file.
        
    2. Word parses the file and sees an embedded OLE object.
        
    3. Word uses COM to activate the object handler.
        
    4. A vulnerability in the parsing or activation code is triggered, leading to arbitrary code execution.
        
- **Why it's effective:** It bypasses many user awareness defenses. A document seems less suspicious than an executable (.exe).

#### B. Monikers and Scriptlet Attacks

This is a more advanced technique that abuses the OLE subsystem itself.

- **Monikers:** A moniker is a COM object that acts as a "smart name." It doesn't represent the data itself, but it knows how to _get_ the data. For example, a URL moniker knows how to download a file from the internet.

- **Exploitation:** An attacker can embed a special moniker in a document that points to a remote, malicious script or COM object. When the document is opened, the moniker is activated, and it retrieves and executes the remote payload.
    
    - **Example:** The **Scriptlet Moniker** attack (`scrobj.dll`) allows an attacker to embed a reference to a remote JavaScript or VBScript file. Upon opening, the document fetches and executes the script, providing a powerful way to get code execution without a traditional exploit.

#### C. DDE (Dynamic Data Exchange) Attacks

While not strictly OLE, DDE is its predecessor and is often grouped with it. It was a popular attack vector a few years ago.

- **Mechanism:** DDE is a message-passing protocol for inter-process communication. Microsoft Office retained support for DDE for backward compatibility.

- **Attack:** A malicious document can contain a DDE field that forces the application (e.g., Word) to execute a system command.
    
    - **Example Field:** `DDEAUTO c:\windows\system32\cmd.exe "/k whoami"`
        
- **Why it worked:** It wasn't a vulnerability but a feature abuse. It didn't require macros to be enabled, making it a stealthy way to execute commands.

### 4. Key Takeaways for Operations

1. **Initial Access Vector:** OLE is a premier mechanism for **client-side attacks**. Phishing campaigns heavily rely on weaponized OLE documents.

2. **Persistence & Execution:** OLE objects can be used for **execution** without dropping traditional files, acting as a LOLBin/LOLScript technique.

3. **Defense Evasion:** Malicious documents can be highly obfuscated, making them difficult for static antivirus solutions to detect. Behavioral analysis is required to catch the actual execution chain (e.g., `winword.exe` spawning `cmd.exe`).

4. **Tooling:** Framework's like **Empire**, **Cobalt Strike**, and **MSFVenom** have modules to generate malicious OLE documents for phishing.

