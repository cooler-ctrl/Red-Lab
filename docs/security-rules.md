# RedLab — Security Rules Catalog (V1.0)

This catalog details the initial 10 deterministic security rules implemented in RedLab's Python security engine. Every rule evaluates declared infrastructure properties and graph topologies to flag security misconfigurations, explain their risk, and provide actionable remediation guidance.

---

## Summary of Core Rules

| Rule ID | Title | Default Severity | Category | Target Resource |
| :--- | :--- | :--- | :--- | :--- |
| `S3_PUBLIC_ACCESS` | Publicly Accessible S3 Bucket | High | Storage | S3 Bucket |
| `S3_UNENCRYPTED` | Unencrypted S3 Bucket | Medium | Storage | S3 Bucket |
| `SG_OVERLY_PERMISSIVE` | Overly Permissive Security Group | High / Critical | Networking | Security Group |
| `RDS_PUBLIC_ACCESS` | Publicly Accessible Database | High / Critical | Database | RDS Database |
| `RDS_UNENCRYPTED` | Unencrypted Database | Medium | Database | RDS Database |
| `IAM_OVERLY_PERMISSIVE` | Overly Permissive IAM Role | High / Critical | Identity | IAM Role |
| `EC2_PUBLIC_EXPOSURE` | EC2 Instance with Public Exposure | High | Compute | EC2 Instance |
| `EC2_MISSING_IAM_ROLE` | EC2 Instance Missing IAM Role | Low | Compute | EC2 Instance |
| `SUBNET_PUBLIC_ROUTING` | Public Subnet with Internet Routing | Low | Networking | Subnet |
| `RESOURCE_MISSING_SG` | Resource Missing Security Group | Medium | Networking | EC2 / RDS |

---

## Detailed Rule Specifications

### 1. `S3_PUBLIC_ACCESS`: Publicly Accessible S3 Bucket
- **Condition:** An S3 bucket has `public_access: true` AND `block_public_access: false`.
- **Severity:** `High`
- **Rationale:** Objects inside the bucket are directly reachable over the internet. Attackers can crawl and exfiltrate customer documents, backups, credentials, or proprietary source code.
- **Remediation:**
  1. Enable S3 Block Public Access at both the bucket and account level.
  2. Review bucket policies and ACLs to ensure public principal (`"Principal": "*"`) is disallowed.
  3. Enforce IAM authentication for internal applications consuming bucket objects.

---

### 2. `S3_UNENCRYPTED`: Unencrypted S3 Bucket
- **Condition:** An S3 bucket has `encryption: false`.
- **Severity:** `Medium`
- **Rationale:** Without server-side encryption enabled at rest, data stored on physical disks is vulnerable if hardware is decommissioned improperly or accessed out-of-band. Violates compliance frameworks such as HIPAA, PCI-DSS, and SOC 2.
- **Remediation:**
  1. Turn on default encryption with SSE-S3 (AES-256) or SSE-KMS.
  2. Require encrypted uploads via bucket policy condition `"s3:x-amz-server-side-encryption": "aws:kms"`.

---

### 3. `SG_OVERLY_PERMISSIVE`: Overly Permissive Security Group
- **Condition:** An inbound security group rule specifies source `0.0.0.0/0`, `::/0`, or `*` matching sensitive ports:
  - Port 22 (SSH): `High`
  - Port 3389 (RDP): `High`
  - Ports 3306 (MySQL), 5432 (Postgres), 1433 (MSSQL), 27017 (Mongo): `Critical`
  - All Ports (`0-65535` or `-1`): `Critical`
  - Ports 80, 443 (HTTP/HTTPS): Not flagged (legitimate public web traffic)
- **Rationale:** Exposing management or storage ports to the public internet invites automated port scanners, credential stuffing, brute-force dictionary attacks, and zero-day exploitation.
- **Remediation:**
  1. Restrict management ports (22, 3389) to specific administrator IP CIDRs (e.g. `203.0.113.4/32`) or route through an AWS Client VPN.
  2. For databases, never accept `0.0.0.0/0`. Authorize only the security group of the web/application tier (e.g., `sg-app`).

---

### 4. `RDS_PUBLIC_ACCESS`: Publicly Accessible Database
- **Condition:** An RDS database has `publicly_accessible: true`.
  - Severity escalates from `High` to `Critical` if an attached security group also permits `0.0.0.0/0`.
- **Rationale:** Relational databases store high-value structured business data and should reside exclusively in private subnets. Public IPs make databases vulnerable to distributed denial of service and direct brute force.
- **Remediation:**
  1. Disable `publicly_accessible` on the RDS instance.
  2. Move database instances into private subnets without public internet routes.
  3. Require database connections to originate through backend workloads or internal bastions.

---

### 5. `RDS_UNENCRYPTED`: Unencrypted Database
- **Condition:** An RDS database has `encryption: false`.
- **Severity:** `Medium`
- **Rationale:** Data stored on database storage volumes, automated backups, read replicas, and system snapshots remain unencrypted on disk.
- **Remediation:**
  1. Enable KMS encryption when provisioning RDS instances.
  2. For existing unencrypted databases, create a snapshot, copy the snapshot with encryption enabled, and restore the new encrypted database instance.

---

### 6. `IAM_OVERLY_PERMISSIVE`: Overly Permissive IAM Role
- **Condition:** An IAM role attached policy contains wildcard permissions:
  - Wildcard action `*` and wildcard resource `*`: `Critical` (full account administrator).
  - Wildcard service permissions like `iam:*` or `AdministratorAccess`: `High`.
- **Rationale:** Violates the principle of least privilege. If an attacker gains initial execution on a workload assuming this role, they can access any resource, create rogue IAM accounts, or delete the entire environment.
- **Remediation:**
  1. Scrutinize policy actions and replace `*` with specific required APIs (e.g., `s3:GetObject`).
  2. Scope resources to specific Amazon Resource Names (ARNs) rather than `*`.

---

### 7. `EC2_PUBLIC_EXPOSURE`: EC2 Instance with Public Exposure
- **Condition:** An EC2 instance has `public_ip: true` AND an attached security group that allows unrestricted inbound access (`0.0.0.0/0`) on sensitive management ports (e.g. 22 or 3389).
- **Severity:** `High`
- **Rationale:** The combination of a public IP and open firewall ports directly exposes the server's OS login surface to internet scanning bots.
- **Remediation:**
  1. Disable public IP assignment if the workload does not serve internet clients directly.
  2. Place instances in private subnets behind an Application Load Balancer (ALB).
  3. Use AWS Systems Manager (SSM) Session Manager for SSH-less terminal access.

---

### 8. `EC2_MISSING_IAM_ROLE`: EC2 Instance Missing IAM Role
- **Condition:** An EC2 instance has no `iam_role_id` configured.
- **Severity:** `Low`
- **Rationale:** When workloads lack an attached instance profile, developers often resort to hardcoding static AWS Access Keys in configuration files or environment variables, resulting in high risk of credential leaks.
- **Remediation:**
  1. Create a dedicated IAM role for the instance.
  2. Attach the role via an instance profile.
  3. Allow AWS SDKs to automatically fetch rotating temporary credentials from the Instance Metadata Service (IMDSv2).

---

### 9. `SUBNET_PUBLIC_ROUTING`: Public Subnet with Internet Routing
- **Condition:** A subnet has `is_public: true` and its parent VPC is connected to an Internet Gateway (`internet_gateway`).
- **Severity:** `Low` (Informational)
- **Rationale:** Public subnets are expected for edge components (ALBs, NAT gateways), but teams must verify that database and internal application workloads are not accidentally placed inside them.
- **Remediation:**
  1. Confirm that only public-facing load balancers or bastion hosts are stationed in this subnet.
  2. Maintain separate private subnets for application and database tiers.

---

### 10. `RESOURCE_MISSING_SG`: Resource Missing Security Group
- **Condition:** An EC2 or RDS resource has no security groups attached (either via config property or visual `attaches` edges).
- **Severity:** `Medium`
- **Rationale:** Without an explicit security group, the resource defaults to the VPC default security group or lacks explicit network firewall boundaries.
- **Remediation:**
  1. Provision a purpose-built security group for the resource tier.
  2. Explicitly bind the security group to the compute or database node.
