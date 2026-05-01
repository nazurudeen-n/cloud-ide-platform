\# 🚀 Cloud IDE Platform (Kubernetes-Based)



\## 📘 Overview



This project implements a \*\*minimal cloud IDE platform\*\* that provisions isolated development environments on demand using Kubernetes.



Each workspace:



\* Runs as an independent Kubernetes pod

\* Provides browser-based VS Code using `code-server`

\* Has persistent storage (PVC)

\* Is isolated via resource limits and network policies



The focus of this implementation is \*\*correctness, isolation, and simplicity\*\*, rather than production-scale complexity.



\---



\## Architecture



\### High-Level Flow



```

Client (API Request)

&#x20;       ↓

Node.js Control Plane (Express API)

&#x20;       ↓

Kubernetes API

&#x20;       ↓

Workspace Pod (code-server)

&#x20;       ↓

Persistent Volume (PVC)

```



\---



\##  Tech Stack



\* \*\*Backend:\*\* Node.js (Express)

\* \*\*Container Runtime:\*\* code-server (VS Code in browser)

\* \*\*Orchestration:\*\* Kubernetes (Kind cluster)

\* \*\*Kubernetes Client:\*\* @kubernetes/client-node



\---



\##  Features Implemented



\###  Workspace Lifecycle Management



\* Create workspace via API (`POST /workspace`)

\* List all workspaces (`GET /workspace`)

\* Delete workspace (`DELETE /workspace/:id`)



\---



\###  Persistent Storage



\* Each workspace gets a \*\*dedicated PVC\*\*

\* Mounted at `/home/coder`

\* Data persists across pod restarts



\---



\###  Resource Isolation



Each workspace pod has defined limits:



```yaml

requests:

&#x20; cpu: 200m

&#x20; memory: 256Mi



limits:

&#x20; cpu: 500m

&#x20; memory: 512Mi

```



This ensures:



\* No single workspace can consume excessive resources

\* Fair resource distribution across users



\---



\###  Network Isolation



Implemented using Kubernetes \*\*NetworkPolicy\*\*:



\* Denies all ingress and egress traffic

\* Blocks:



&#x20; \* Pod-to-pod communication

&#x20; \* External internet access



\*\*Validation:\*\*



```bash

curl google.com

```



Result:



```

Could not resolve host

```



This confirms network isolation is enforced.



\---



\##  Testing \& Validation



\###  CPU Stress Test



Executed inside the container:



```bash

yes > /dev/null

```



\*\*Observation:\*\*



\* Container remained stable

\* No crash or restart

\* CPU usage constrained by Kubernetes limits



\*\*Conclusion:\*\*

CPU limits are correctly enforced.



\---



\###  Memory / Disk Behavior Test



Executed:



```bash

dd if=/dev/zero of=bigfile bs=10M count=200

```



\*\*Result:\*\*



\* Successfully wrote \~2GB file

\* No OOMKilled event



\*\*Analysis:\*\*



\* Operation was \*\*disk-bound\*\*, not memory-bound

\* Data was written to PVC (storage), not RAM



\*\*Conclusion:\*\*



\* Memory limits were not triggered because workload did not consume RAM

\* System correctly allows disk operations while still enforcing CPU limits



\---



\###  Network Isolation Test



Inside container:



```bash

curl google.com

```



\*\*Result:\*\*



```

Could not resolve host

```



\*\*Conclusion:\*\*



\* External network access successfully blocked

\* NetworkPolicy is effective



\---



\##  Security \& Isolation Summary



| Layer   | Implementation              |

| ------- | --------------------------- |

| Compute | CPU \& Memory limits         |

| Network | NetworkPolicy (deny all)    |

| Storage | Isolated PVC per workspace  |

| Runtime | Dedicated pod per workspace |



\---



\##  Design Decisions \& Tradeoffs



| Decision              | Reason                   | Tradeoff                |

| --------------------- | ------------------------ | ----------------------- |

| Node.js control plane | Simplicity \& familiarity | Limited scalability     |

| code-server           | Quick browser IDE        | Less customization      |

| Kind cluster          | Lightweight local setup  | Not production-grade    |

| No authentication     | Faster implementation    | Not secure for real use |

| Port-forwarding       | Simplicity               | Not scalable            |



\---



\##  Scaling Strategy (Future)



To make this production-ready:



\* Add \*\*Ingress Controller\*\* for external access

\* Use \*\*Load Balancer\*\* for API scaling

\* Implement \*\*Horizontal Pod Autoscaling (HPA)\*\*

\* Use \*\*managed storage (EBS / GCP PD)\*\*

\* Introduce \*\*multi-tenant namespaces\*\*



\---



\##  Failure Scenarios



| Scenario        | Behavior                       |

| --------------- | ------------------------------ |

| Pod crash       | Kubernetes restarts pod        |

| Node failure    | Pod rescheduled                |

| API failure     | Existing workspaces unaffected |

| Storage failure | Potential data loss            |



\---



\##  Future Improvements



\* Authentication \& user sessions

\* Workspace auto-expiry / cleanup

\* Monitoring (Prometheus + Grafana)

\* Resource quotas per user

\* Snapshot \& restore functionality

\* Multi-user isolation via namespaces



\---



\##  How to Run



\### 1. Start Kubernetes cluster



```bash

kind create cluster

```



\---



\### 2. Install dependencies



```bash

npm install

```



\---



\### 3. Start API server



```bash

node app.js

```



\---



\### 4. Create workspace



```bash

curl -X POST http://localhost:3000/workspace

```



\---



\### 5. Access workspace



```bash

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



\---



\##  Final Summary



This project demonstrates:



\* Dynamic Kubernetes resource provisioning

\* Isolated development environments

\* Persistent storage per workspace

\* Resource and network isolation

\* System behavior under stress



The implementation focuses on \*\*core platform fundamentals\*\*, showing how a cloud IDE can be built using Kubernetes primitives.



\---

