
This well-renowned concept is being applied in cybersecurity solutions to improve the effectiveness of Cyber threat intelligence **(CTI)**, threat hunting and incident response.

The **Pyramid of Pain**, created by David J. Bianco, is a foundational concept in blue teaming and threat detection. It illustrates the relative value and impact of different types of **Indicators of Compromise (IOCs)** that defenders can detect and act upon. Each level of the pyramid represents a different kind of indicator, showing how much “pain” it causes an attacker when defenders block or detect based on that indicator. The higher up the pyramid, the more difficult it becomes for the attacker to adapt, and the more meaningful the detection is for defenders.

### Hash Values

At the base of the pyramid are **hash values**, which represent unique fingerprints of files such as malware or scripts. Detecting malicious hashes is straightforward but causes very little pain to attackers. They can easily evade detection by recompiling, packing, or slightly modifying their files to produce new hashes. While hashes are useful for quick, short-term detection, they offer minimal long-term defensive value.

### IP Addresses

Above hashes are **IP addresses**. Blocking known malicious IPs can interrupt ongoing attacks but provides only temporary protection, since attackers can quickly switch to new IPs using proxies, VPNs, or content delivery networks. IP-based detections are most effective when combined with contextual information such as domains, behavior, and timing.

### Domain Names

The next level, **domain names**, offers a more durable indicator. While attackers can register new domains, doing so requires additional effort and time. Domains often remain associated with specific campaigns or infrastructure, making them more useful for identifying and tracking malicious activity. Blue teams should monitor for newly registered domains, lookalike domains, and algorithmically generated ones (DGAs), which are common in malware campaigns. Attackers usually hide the malicious domains under URL shorteners.   A URL Shortener is a tool that creates a short and unique URL that will redirect to the specific website specified during the initial step of setting up the URL Shortener link. The attackers normally use the following URL-shortening services to generate malicious links:

### Host and Network atifacts

Moving higher, **network and host artifacts** refer to the observable traces attackers leave behind on systems or networks. These include registry keys, file paths, mutex names, scheduled tasks, unique user-agent strings, or beaconing patterns. Detecting these artifacts causes significant pain to attackers because such elements are often hard-coded into their tools and operational workflows. Modifying them requires development effort and testing, disrupting their attack chain. This level provides much stronger and more resilient detection capabilities for defenders.

### Tools

The next tier, **tools**, represents the utilities attackers rely on to execute their operations, such as Mimikatz, Cobalt Strike, or Impacket. Detecting or blocking these tools forces attackers to re-engineer, replace, or modify them—actions that are costly and time-consuming. Rather than relying solely on file signatures, defenders can focus on behavioral detections, such as identifying suspicious memory access patterns or command execution chains, to uncover the use of these tools even if they are obfuscated or renamed.

### TTPs

At the top of the pyramid are **tactics, techniques, and procedures (TTPs)**, which describe the attacker’s overall methods and behavior patterns. These include specific techniques like credential dumping, lateral movement, or persistence mechanisms, as outlined in frameworks such as **MITRE ATT&CK**. Detecting TTPs causes the greatest pain to attackers because it targets their methodology rather than their tools or infrastructure. Changing TTPs often requires rethinking their entire approach, making this level the most powerful and enduring form of detection.

In essence, the **Pyramid of Pain** teaches defenders to move beyond simple indicators like hashes and IPs toward higher-level behavioral detections. The more a detection targets an attacker’s inherent techniques, the more resilient and strategic a defense becomes. Lower-level indicators are valuable for quick response and containment, but focusing on artifacts, tools, and TTPs builds long-term security maturity.