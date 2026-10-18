# RedLab — Security Requirements & Sandbox Isolation Specifications

RedLab is a cloud security simulation platform. Because users configure security parameters, simulate attacks, and may eventually execute validation scripts, strict security controls are required to protect the host machine and ensure the safety of students and educational institutions.

---

## 1. Core Security Tenets

1. **Local Self-Contained Simulation:**
   - RedLab operates entirely within local software boundaries.
   - **DO NOT** make calls to real AWS cloud APIs (e.g. `boto3` invoking real accounts).
   - **DO NOT** transmit simulated topologies or credentials to external third-party services.
2. **Deterministic Evaluation:**
   - Threat models and attack chains are evaluated mathematically against in-memory graph topologies and configuration attributes.
3. **Zero Secrets in Code:**
   - No passwords, API keys, private certificates, or production `.env` files may ever be committed to the repository.

---

## 2. Custom Script Execution Threat Model (Milestone 5)

Allowing arbitrary user-submitted Python or Bash scripts introduces high-severity attack vectors:
- **Host Compromise:** Escaping container or process boundaries to access host files, kernel memory, or system daemons.
- **Credential Theft:** Attempting to query AWS Instance Metadata Service (`169.254.169.254`) or environment variables on the host.
- **Resource Exhaustion (DoS):** Fork bombs, CPU-spinning loops, or allocating massive RAM to crash the host operating system.
- **Network Abuse:** Using the RedLab server as an unauthorized proxy, port-scanner, or botnet participant.

---

## 3. Defense-in-Depth Sandbox Isolation Requirements

To mitigate these threats, custom script execution **must satisfy all six layers of isolation**:

```
┌──────────────────────────────────────────────────────────┐
│ Layer 6: Watchdog & Hard Execution Timers (Max 10s)      │
├──────────────────────────────────────────────────────────┤
│ Layer 5: Cgroups v2 Resource Quotas (100MB RAM, 0.5 CPU) │
├──────────────────────────────────────────────────────────┤
│ Layer 4: Network Namespace Lockdown (--network none)     │
├──────────────────────────────────────────────────────────┤
│ Layer 3: Read-Only Root Filesystem & No SUID             │
├──────────────────────────────────────────────────────────┤
│ Layer 2: Linux Capabilities Dropped (CAP_DROP ALL)       │
├──────────────────────────────────────────────────────────┤
│ Layer 1: Unprivileged Non-Root User (UID 65534 / nobody) │
└──────────────────────────────────────────────────────────┘
```

### Layer 1: Unprivileged Execution
- Scripts must execute as an unprivileged user (UID `65534` or dedicated sandbox user `1000:1000`).
- The `root` account inside the container must be disabled or mapped to an unprivileged namespace.

### Layer 2: Linux Capability Stripping
- All Linux capabilities must be dropped: `--cap-drop=ALL`.
- The container must enforce `--security-opt=no-new-privileges` to prevent privilege escalation via setuid binaries.

### Layer 3: Filesystem Isolation & Ephemeral Scratch
- The container root filesystem must be mounted strictly **read-only** (`--read-only`).
- A single temporary scratch directory may be mounted for script execution:
  - Mounted with `noexec,nosuid,nodev` options where possible.
  - Sized at a maximum of 50 MB via tmpfs.
  - Automatically wiped immediately upon execution termination.

### Layer 4: Strict Network Namespace Lockdown
- Sandboxes execute with `--network none` by default.
- If network simulation is enabled, the container attaches to an isolated software bridge with:
  - **Explicit DROP** for `169.254.169.254` (AWS IMDS link-local address).
  - **Explicit DROP** for host loopback (`127.0.0.1` / `::1`) and local LAN subnets (`192.168.0.0/16`, `10.0.0.0/8`, `172.16.0.0/12`).
  - **Explicit DROP** for all outbound internet traffic unless an isolated mock gateway is specifically provisioned.

### Layer 5: Resource Quotas (Cgroups v2)
- **Memory:** Capped at 128 MB RAM (hard limit; out-of-memory killer triggered if exceeded).
- **CPU:** Throttled to 0.5 CPU cores (50% single-core allocation).
- **Process / Thread Limit:** `--pids-limit=64` to instantly neutralize fork bombs.

### Layer 6: Watchdog Timers
- Every execution is bounded by an asynchronous watchdog timer.
- Default timeout: **10 seconds** (maximum configurable: 30 seconds).
- When the timer expires, the process receives `SIGKILL` and container teardown is enforced.

---

## 4. Input Sanitization & Web Application Security

1. **Parameter Validation:**
   - All REST API endpoints must validate payloads using Pydantic v2 schemas.
   - String fields must enforce minimum and maximum length bounds (`min_length=1, max_length=200`).
2. **Output Encoding:**
   - Terminal stream output must be sanitized to eliminate ANSI escape injection vulnerabilities.
3. **Cross-Origin Resource Sharing (CORS):**
   - In production, CORS must be locked down to the exact domain origin serving the frontend application.
4. **Rate Limiting:**
   - Simulation and scan endpoints must enforce rate limits (e.g. 10 scans per minute per IP) to prevent denial of service.

---

## 5. Security Checklist for Code Reviews

Reviewers must reject any PR that:
- [ ] Executes shell commands using `shell=True` without array argument separation.
- [ ] Hardcodes test credentials, tokens, or private keys.
- [ ] Weakens sandbox cgroup limits or container security flags.
- [ ] Bypasses Pydantic schema validation.
- [ ] Introduces dependencies with known High or Critical CVEs.
