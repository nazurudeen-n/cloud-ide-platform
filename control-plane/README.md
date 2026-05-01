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