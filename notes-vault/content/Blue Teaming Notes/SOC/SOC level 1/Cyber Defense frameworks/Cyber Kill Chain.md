The **Cyber Kill Chain** is a framework developed by **Lockheed Martin** to describe the stages of a cyberattack from an attacker’s initial planning to achieving their objective. It helps defenders understand how attacks unfold and identify opportunities to detect, disrupt, or stop an adversary at each stage. The model consists of **seven stages**, each representing a critical phase in the attacker’s operation. By analyzing and defending against each phase, blue teams can build layered defenses and respond more effectively to intrusions.

### Reconnaissance

The first stage is **Reconnaissance**, where attackers gather information about their target. This can include public data, network information, employee names, email addresses, or exposed assets. The attacker’s goal is to understand the environment and identify potential weaknesses to exploit later. Defenders can detect or mitigate this stage through monitoring external scanning activity, controlling information exposure, and using deception techniques to mislead or log reconnaissance attempts.

### Weaponization

Next is **Weaponization**, in which attackers create or prepare their malicious tools. This usually involves crafting an exploit, embedding malware into a payload, or developing a phishing attachment. The attacker combines a **remote access mechanism** (like a trojan or backdoor) with a **delivery method**. This stage typically happens outside the victim’s network, making it difficult to detect directly, but threat intelligence and sandbox analysis can help identify known payloads before delivery.

### Delivery

The **Delivery** phase is where the attacker transmits the weaponized payload to the target environment. Common delivery methods include phishing emails, malicious links, infected USB drives, or drive-by downloads from compromised websites. Defenders can intervene here by using secure email gateways, antivirus scanning, URL filtering, and user awareness training to reduce the likelihood of successful delivery.

## Exploitation

Once the payload reaches the target, the next phase is **Exploitation**. In this stage, the malicious code is triggered, exploiting a vulnerability or tricking the user into executing the payload. This is where the attacker gains initial access. Defenders can detect and prevent exploitation by patching vulnerabilities, enforcing application control, using intrusion detection systems, and monitoring for abnormal execution behaviors.

### Installation 

Following exploitation, the **Installation** phase begins. The attacker installs a persistent backdoor or implant to maintain access to the system. This could involve creating registry keys, scheduled tasks, or system services. Blue teams can detect this phase through endpoint monitoring, integrity checking, and behavioral analysis tools that track persistence mechanisms and system changes.

### C2

The sixth stage is **Command and Control (C2)**, where the compromised system connects back to the attacker’s infrastructure for further instructions. This communication allows the attacker to control the victim system remotely. Defenders can detect and disrupt C2 traffic by monitoring for unusual outbound connections, beaconing patterns, or anomalous DNS requests, and by using network segmentation to limit external communication.

### Actions on objectives (Exfiltration)

Finally, the **Actions on Objectives** phase represents the attacker achieving their ultimate goal. This can vary depending on the intent — data theft, ransomware deployment, system destruction, or lateral movement to other hosts. Detecting this stage requires strong internal visibility, including user behavior analytics, file integrity monitoring, and alert correlation across systems. Stopping the attacker before or during this phase minimizes the damage.

In summary, the **Cyber Kill Chain** provides defenders with a structured way to think like attackers and identify where to intervene. Early detection—particularly during reconnaissance, delivery, or exploitation—reduces the chance of a full compromise. The model also highlights the importance of **defense-in-depth**, where multiple security controls work together across different stages to delay, detect, and defeat attacks.
