# RedLab — Network Security & Attack Rules Catalog

This catalog details the 8 deterministic network security and attack surface rules implemented in RedLab's Python security engine. Every rule evaluates declared device configurations, running services, network interfaces, and graph topologies to flag vulnerabilities, explain attack risks, and provide actionable remediation guidance.

---

## Summary of Core Rules

| Rule ID | Title | Default Severity | Category | Target Resource |
| :--- | :--- | :--- | :--- | :--- |
| `FIREWALL_DEFAULT_ALLOW` | Firewall Default Inbound Policy Allows Traffic | Critical | Perimeter Security | Firewall |
| `SERVER_UNPROTECTED_DIRECT_WAN` | Server Exposed Directly to External WAN | Critical | Perimeter Security | Server |
| `SERVER_PLAINTEXT_PORT` | Unencrypted Plaintext Network Service Running | Medium | Service Hardening | Server |
| `FIREWALL_PERMISSIVE_ANY_PORT` | Permissive Firewall Rule Permits Any Source IP | High | Perimeter Security | Firewall |
| `HOST_EXPOSED_MANAGEMENT_PORT` | Sensitive Management Service Exposed to External Access | High | Service Hardening | Server / PC |
| `ROUTER_INSECURE_DIRECT_ROUTE` | WAN Router Lacks Network Address Translation (NAT) | High | Network Architecture | Router |
| `SWITCH_DEFAULT_VLAN_EXPOSURE` | Switch Operating on Unsegmented Default VLAN | Low | Network Segmentation | Switch |
| `HOST_MISSING_DEFAULT_GATEWAY` | Endpoint Host Missing Default Gateway | Low | Host Configuration | PC / Server |

---

## Detailed Rule Specifications

### 1. `FIREWALL_DEFAULT_ALLOW`: Firewall Default Inbound Policy Allows Traffic
- **Condition:** A firewall node has `default_policy: "allow"` or `default_policy: "permit"`.
- **Severity:** `Critical`
- **Category:** `Perimeter Security`
- **Rationale:** A perimeter firewall configured to default-allow acts as an open gateway. In the event of missing or misconfigured specific rules, all unsolicited external traffic, port scans, and ingress attacks reach internal systems unimpeded.
- **Remediation:**
  1. Change the firewall `default_policy` to `"deny"`.
  2. Implement an explicit whitelist of required inbound ports and authorized source IPs.

---

### 2. `SERVER_UNPROTECTED_DIRECT_WAN`: Server Exposed Directly to External WAN
- **Condition:** A server node is connected directly (or via a pure Layer 2 switch) to an `external_network` node without an intervening stateful firewall.
- **Severity:** `Critical`
- **Category:** `Perimeter Security`
- **Rationale:** Servers placed directly on the untrusted WAN edge without a firewall are directly reachable by internet adversaries. Attackers can perform TCP SYN port scanning, banner grabbing, and zero-day exploitation against exposed daemons.
- **Remediation:**
  1. Insert an inline firewall node between the external WAN and the internal server or switch.
  2. Configure inbound firewall rules to restrict traffic to only necessary application ports from authorized sources.

---

### 3. `SERVER_PLAINTEXT_PORT`: Unencrypted Plaintext Network Service Running
- **Condition:** A server node runs listening services on known unencrypted protocols:
  - Telnet (Port 23)
  - FTP (Port 21)
  - HTTP (Port 80)
- **Severity:** `Medium`
- **Category:** `Service Hardening`
- **Rationale:** Cleartext network protocols transmit credentials, session tokens, and application data without cryptographic integrity or confidentiality. Adversaries performing packet capture or man-in-the-middle attacks can inspect and hijack sessions.
- **Remediation:**
  1. Replace unencrypted services with secure equivalents:
     - Telnet (23) $\rightarrow$ SSH (22)
     - FTP (21) $\rightarrow$ SFTP / SCP (22) or FTPS
     - HTTP (80) $\rightarrow$ HTTPS (443) with TLS encryption.

---

### 4. `FIREWALL_PERMISSIVE_ANY_PORT`: Permissive Firewall Rule Permits Any Source IP
- **Condition:** A firewall node contains an inbound rule with `action: "allow"`, `source: "0.0.0.0/0"` or `source: "*"`, and `dest_port` targeting sensitive management or internal ports (e.g., 22, 23, 3389, 3306, 5432, 27017, or all ports `0-65535` / `*`).
- **Severity:** `High` (Critical for database ports or all-ports)
- **Category:** `Perimeter Security`
- **Rationale:** Authorizing wildcard source addresses on sensitive administration or persistence ports exposes internal endpoints to automated vulnerability scanning, brute-force attacks, and direct compromise.
- **Remediation:**
  1. Restrict the rule's `source` IP/CIDR to authorized administrator or VPN subnets (e.g., `10.0.0.0/24` or `192.168.1.0/24`).
  2. Avoid open `*` or `0-65535` port ranges on allow rules.

---

### 5. `HOST_EXPOSED_MANAGEMENT_PORT`: Sensitive Management Service Exposed
- **Condition:** A host or server runs administrative management daemons (SSH port 22, Telnet port 23, RDP port 3389) without firewall inspection or restricted access.
- **Severity:** `High`
- **Category:** `Service Hardening`
- **Rationale:** Remote administration ports exposed across broad network segments are high-value targets for brute force, dictionary attacks, and credential stuffing.
- **Remediation:**
  1. Restrict management access to dedicated management jump-boxes / bastion subnets.
  2. Enforce strict firewall ACLs so that only trusted management IP ranges can initiate connections to administrative ports.

---

### 6. `ROUTER_INSECURE_DIRECT_ROUTE`: WAN Router Lacks Network Address Translation (NAT)
- **Condition:** A router node is directly connected to an `external_network` WAN edge but has `nat_enabled: false`.
- **Severity:** `High`
- **Category:** `Network Architecture`
- **Rationale:** Without Network Address Translation (NAT) enabled at the internet boundary, internal private IP space is exposed or unrouteable, and external hosts can attempt direct routing into internal subnets.
- **Remediation:**
  1. Enable NAT on the boundary router (`nat_enabled: true`).
  2. Configure internal private subnets (RFC 1918) behind the NAT-enabled router.

---

### 7. `SWITCH_DEFAULT_VLAN_EXPOSURE`: Switch Operating on Unsegmented Default VLAN
- **Condition:** A Layer 2 switch operates with `default_vlan: 1` and has multiple attached hosts without VLAN segmentation.
- **Severity:** `Low`
- **Category:** `Network Segmentation`
- **Rationale:** Operating all endpoints inside the default VLAN 1 creates a flat Layer 2 broadcast domain. An attacker who compromises a single endpoint can sniff broadcast traffic, perform ARP poisoning / spoofing, and easily pivot to other systems.
- **Remediation:**
  1. Configure dedicated segmented VLANs for different security zones (e.g., VLAN 10 for Servers, VLAN 20 for Workstations, VLAN 99 for Management).
  2. Disable or isolate default VLAN 1 for production traffic.

---

### 8. `HOST_MISSING_DEFAULT_GATEWAY`: Endpoint Host Missing Default Gateway
- **Condition:** A host (PC or Server) has configured static IP interfaces but `default_gateway` is empty or missing.
- **Severity:** `Low`
- **Category:** `Host Configuration`
- **Rationale:** While the host can communicate within its local subnet, it cannot reach external routers, DNS servers, or out-of-subnet resources. In security architectures, missing default gateways can cause routing asymmetry and log delivery failure.
- **Remediation:**
  1. Configure the `default_gateway` field with the IP address of the local subnet router interface.
