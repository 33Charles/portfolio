In cybersecurity the term **"kill chain** is used to describe the methodology/path attackers such as hackers and APT s use to approach and intrude a target.

Threat modelling, in a cybersecurity context, is a series of steps to ultimately improve the security of a system. Threat modelling is about identifying risk and essentially boils down to:

1. Identifying what systems and applications need to be secured and what function they serve in the environment. For example, is the system critical to normal operations, and is a system holding sensitive information like payment info or addresses?
2. Assessing what vulnerabilities and weaknesses these systems and applications may have and how they could be potentially exploited
3. Creating a plan of action to secure these systems and applications from the vulnerabilities highlighted
4. Putting in policies to prevent these vulnerabilities from occurring again where possible (for example, implementing a software development life cycle (SDLC) for an application or training employees on phishing awareness).

The UKC can encourage threat modelling as the UKC framework helps identify potential attack surfaces and how these systems may be exploited.

STRIDE, DREAD and CVSS (to name a few) are all frameworks specifically used in threat modelling.

### Introducing UKC

The _Unified Kill Chain (UKC) is an evolution of earlier [[Cyber Kill Chain]] models_, addressing key limitations of traditional frameworks, such as the Lockheed Martin Cyber Kill Chain.
The _UKC defines_ **_18 attack phases_**, grouped into **three overarching stages**:
- In
- Through
- out

| #   | Attack Phase           | Description                                                                                  |
| --- | ---------------------- | -------------------------------------------------------------------------------------------- |
| 1   | Reconnaissance         | Researching, identifying, and selecting targets using active or passive reconnaissance.      |
| 2   | Weaponization          | Preparatory activities aimed at setting up the infrastructure required for the attack.       |
| 3   | Delivery               | Techniques resulting in the transmission of a weaponized object to the targeted environment. |
| 4   | Social Engineering     | Techniques aimed at manipulating people to perform unsafe actions.                           |
| 5   | Exploitation           | Techniques to exploit vulnerabilities in systems that may result in code execution.          |
| 6   | Persistence            | Actions or changes to a system that give an attacker long-term access.                       |
| 7   | Defense Evasion        | Techniques used to evade detection or bypass defenses.                                       |
| 8   | Command & Control (C2) | Techniques that allow attackers to communicate with compromised systems.                     |
| 9   | Pivoting               | Tunneling traffic through a compromised system to reach other internal systems.              |
| 10  | Discovery              | Techniques that allow attackers to gain knowledge about systems and networks.                |
| 11  | Privilege Escalation   | Techniques that provide attackers with higher-level permissions.                             |
| 12  | Execution              | Techniques resulting in the execution of attacker-controlled code on systems.                |
| 13  | Credential Access      | Techniques used to obtain or manipulate authentication credentials.                          |
| 14  | Lateral Movement       | Techniques that enable attackers to move horizontally to other systems.                      |
| 15  | Collection             | Techniques used to identify and gather data prior to exfiltration.                           |
| 16  | Exfiltration           | Techniques that result in or assist with the removal of data from a target network.          |
| 17  | Impact                 | Techniques aimed at manipulating, interrupting, or destroying systems or data.               |
| 18  | Objectives             | The strategic goals or intended outcomes of the attack campaign.                             |


> [!tip]
> Use this table together with the **MITRE ATT&CK mappings** to connect each phase to real-world techniques, detections, and mitigations.  . This pairing provides both strategic overview and tactical detail for threat hunting and defense planning.

#### **1. In (Initial Foothold)**

Focuses on breaching the organizational perimeter to gain initial access.

- **Key Phases**:
    - Reconnaissance
    - Resource Development
    - Delivery
    - Social Engineering
    - Exploitation
    - Persistence
    - Defense Evasion
    - Command & Control
- **Example**:
    An attacker performs phishing (Social Engineering) to deliver malware (Exploitation) that establishes a Command & Control channel.

#### **2. Through (Network Propagation)**

Involves activities to escalate privileges and move laterally across the network.

- **Key Phases**:
    - Discovery
    - Privilege Escalation
    - Credential Access
    - Lateral Movement
    - Execution
    - Pivoting
- **Example**:
    Attackers use stolen credentials (Credential Access) to escalate privileges (Privilege Escalation) and pivot to other systems.

#### **3. Out (Actions on Objectives)**

Covers activities for achieving the attacker's final goals, such as exfiltration or system impact.

- **Key Phases**:
    - Collection
    - Exfiltration
    - Impact
    - Objectives
- **Example**:
    Data is exfiltrated (Exfiltration) from compromised servers, or ransomware disrupts operations (Impact).

