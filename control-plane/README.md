# 🚀 Cloud IDE Platform (Kubernetes-Based)

## 📘 Overview

This project implements a **minimal cloud IDE platform** that provisions isolated development environments on demand using Kubernetes.

Each workspace:

* Runs as an independent Kubernetes pod
* Provides browser-based VS Code using `code-server`
* Has persistent storage using Persistent Volume Claims (PVC)
* Is isolated via resource limits and network policies

The goal is to demonstrate **practical system design, Kubernetes usage, and isolation**, while keeping the implementation simple and functional.

---

## 🏗️ Architecture

### High-Level Flow

```
Client (API Request)
        ↓
Node.js Control Plane (Express API)
        ↓
Kubernetes API
        ↓
Workspace Pod (code-server)
        ↓
Persistent Volume (PVC)
```

---

### Components

**1. Node.js Control Plane**

* REST API to manage workspaces
* Uses `@kubernetes/client-node`
* Handles create, list, and delete operations

---

**2. Kubernetes (Kind Cluster)**

* Manages container lifecycle
* Provides scheduling and isolation
* Runs workspace pods

---

**3. Workspace Container**

* Image: `codercom/code-server`
* Browser-based VS Code environment
* One container per workspace

---

**4. Persistent Storage**

* Each workspace gets a dedicated PVC
* Mounted at `/home/coder`
* Ensures data persists across restarts

---

## ⚙️ Features

### ✅ Workspace Management

* Create workspace via API (`POST /workspace`)
* List all workspaces (`GET /workspace`)
* Delete workspace (`DELETE /workspace/:id`)

---

### 💾 Persistent Storage

* Each workspace has isolated storage
* Data survives pod restarts

---

### 🔐 Resource Isolation

Each workspace pod has defined limits:

```yaml
requests:
  cpu: 200m
  memory: 256Mi

limits:
  cpu: 500m
  memory: 512Mi
```

This ensures fair resource usage and prevents abuse.

---

### 🌐 Network Isolation

* Implemented using Kubernetes NetworkPolicy
* Blocks external internet access and inter-pod communication

---

## 🧪 Testing & Validation

### 🔥 CPU Stress Test

Command executed inside container:

```
yes > /dev/null
```

**Observation:**

* Container remained stable
* CPU usage constrained by limits

---

### 💾 Disk / Memory Behavior Test

Command:

```
dd if=/dev/zero of=bigfile bs=10M count=200
```

**Observation:**

* Successfully wrote ~2GB file
* No OOMKilled event

**Analysis:**

* Operation was disk-bound (PVC), not memory-bound
* Memory limits require RAM-intensive workloads to trigger OOM

---

### 🌐 Network Test

```
curl google.com
```

**Result:**

```
Could not resolve host
```

**Conclusion:**

* NetworkPolicy successfully blocks external access

---

## 📡 API Endpoints

### Create Workspace

```
POST /workspace
```

Response:

```json
{
  "id": "abc123",
  "message": "Workspace created"
}
```

---

### List Workspaces

```
GET /workspace
```

---

### Delete Workspace

```
DELETE /workspace/:id
```

---

## 🛠️ How to Run

### 1. Start Kubernetes cluster

```
kind create cluster
```

---

### 2. Install dependencies

```
npm install
```

---

### 3. Start server

```
node app.js
```

---

### 4. Create workspace

```
curl -X POST http://localhost:3000/workspace
```

---

### 5. Access workspace

```
kubectl port-forward pod/workspace-<id> 8080:8080
```

Open in browser:

```
http://localhost:8080
```

Password:

```
admin123
```

---

## 🔐 Security & Isolation

| Layer   | Implementation              |
| ------- | --------------------------- |
| Compute | CPU & Memory limits         |
| Network | NetworkPolicy (deny all)    |
| Storage | Dedicated PVC per workspace |
| Runtime | One pod per workspace       |

---

## ⚖️ Design Decisions

| Decision      | Reason                       |
| ------------- | ---------------------------- |
| Node.js       | Simplicity and familiarity   |
| Kind cluster  | Lightweight local Kubernetes |
| code-server   | Fast browser-based IDE setup |
| Minimal scope | Focus on core functionality  |

---

## ⚠️ Limitations

* No authentication or user management
* Single-node cluster (Kind)
* No autoscaling
* No ingress (uses port-forwarding)

---

## 🚀 Future Improvements

* Add authentication (JWT or OAuth)
* Implement autoscaling (HPA)
* Multi-tenant namespace isolation
* Workspace auto-timeout / cleanup
* Monitoring (Prometheus + Grafana)

---

## 💥 Failure Handling

| Scenario     | Behavior                       |
| ------------ | ------------------------------ |
| Pod crash    | Restarted by Kubernetes        |
| Node failure | Pod rescheduled                |
| API failure  | Existing workspaces unaffected |

---

## 📊 Summary

This project demonstrates:

* Dynamic Kubernetes resource provisioning
* Isolated development environments
* Persistent storage per workspace
* Resource and network isolation

The implementation focuses on **clarity, correctness, and practical design**, rather than production complexity.

---

## 🧠 Implementation Gaps & Design Approach

Due to time constraints, some production-grade features are not fully implemented. However, their design and approach are outlined below.

---

## 🔐 Authentication & Authorization (Design)

A production system would implement **JWT-based authentication with asymmetric keys (RS256)**.

### Flow:

* User authenticates via identity provider (OIDC or custom auth)
* Control plane verifies JWT signature using public key
* Each request is authorized against the workspace ID

### Key Points:

* Tokens are short-lived
* Refresh tokens handled securely
* Key rotation supported via JWKS endpoint

### Security:

* No reliance on shared secrets
* Every request validated (not just edge-level)

---

## 🔁 Reconciliation Loop (Design)

A background controller ensures **desired state = actual state**.

### Responsibilities:

* Detect missing pods for active workspaces → recreate
* Detect orphan pods → delete
* Sync PVC state with workspace records

### Example Scenarios:

* Pod deleted manually → recreated
* DB says running but pod missing → fixed
* Pod exists but no DB record → cleaned

### Implementation Approach:

* Periodic job (every 10–30 seconds)
* Compare Kubernetes state vs control-plane state
* Apply corrective actions

---

## 📊 Observability (Design)

A production-ready system would include:

### Logging

* Structured JSON logs
* Request IDs propagated across services

### Metrics (Prometheus)

* Workspace provisioning latency
* Active workspace count
* Error rates
* Resource usage

### Tracing (OpenTelemetry)

* End-to-end tracing of workspace creation

### Dashboard (Grafana)

* System health overview
* Resource saturation indicators

---

## ⏱️ Idle Detection & Auto-Reclamation (Design)

Workspaces should be automatically stopped after inactivity.

### Definition of Idle:

* No file changes
* No terminal input
* No active processes

### Flow:

1. Track last activity timestamp
2. If idle > 30 minutes:

   * Notify user (grace period)
   * Persist state
   * Stop workspace

### Benefit:

* Reduces resource usage
* Prevents cost leakage

---

## 💾 Backup & Restore Strategy (Design)

Persistence is handled via PVC, but backups are required for durability.

### Approach:

* Periodic snapshots of volumes
* Store in external storage (S3/GCS)

### Restore Flow:

* Create new PVC from snapshot
* Attach to new pod
* Resume workspace

### Guarantees:

* RPO: up to last snapshot interval (e.g., 5–10 min)
* RTO: few seconds to reattach and start pod

---

## 🌐 Workspace URL & Access (Design)

Each workspace should have a **unique, unguessable URL**.

### Example:

```id="7o2m3a"
https://workspace-<random-id>.domain.com
```

### Implementation:

* Use ingress controller
* Map subdomain → specific pod/service
* Secure routing via TLS

---

## ⚠️ Failure Scenarios & Handling

### S1 — Node Failure

* Pods rescheduled on another node
* PVC reattached
* User experiences short downtime

---

### S2 — Compromised Workspace

* Isolation prevents access to:

  * Other pods
  * Control plane
* NetworkPolicy blocks lateral movement

---

### S3 — Traffic Spike

* API becomes bottleneck first
* Solution:

  * Horizontal scaling
  * Queue-based provisioning

---

### S4 — Forced Patch (CVE)

* Rolling restart of pods
* Persist data via PVC
* No data loss

---

### S5 — Control Plane Failure

* Running workspaces unaffected
* New requests may fail temporarily

---

### S6 — Data Loss Claim

* Investigate:

  * PVC state
  * Logs
  * Pod restarts
* Observability required for root cause

---

### S7 — Noisy Neighbor

* Resource limits prevent impact
* Disk IO limits recommended

---

### S8 — State Mismatch

* Reconciliation loop detects:

  * Missing pod → recreate
  * Orphan pod → delete

---

## 🏭 Production Readiness Considerations

### Secrets Management

* Use Kubernetes Secrets or external vault
* Rotate regularly

---

### Image Security

* Use trusted base images
* Scan for vulnerabilities
* Pin image versions

---

### Backpressure Handling

* Rate limit API requests
* Queue workspace creation
* Reject excess load gracefully

---

### Multi-AZ Deployment

* Distribute nodes across zones
* Storage must support multi-zone

---

### Cost Considerations

* Scale down idle workspaces
* Use autoscaling
* Optimize resource allocation

---

### Data Deletion

* Delete PVC on workspace removal
* Ensure no residual data

---

### On-Call Readiness

* Alerts:

  * High failure rate
  * Resource exhaustion
* Runbooks for common issues

---
