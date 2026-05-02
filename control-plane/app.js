const express = require("express");
const { v4: uuidv4 } = require("uuid");
const k8s = require("@kubernetes/client-node");
const NAMESPACE = process.env.NAMESPACE || "default";
const PASSWORD = process.env.WORKSPACE_PASSWORD || "admin123";

const app = express();
app.use(express.json());

// Load Kubernetes config
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

// CREATE WORKSPACE (with PVC + resource limits)
app.post("/workspace", async (req, res) => {
  const id = uuidv4().replace(/[^a-z0-9]/g, "").substring(0, 8);

  const pvcName = `pvc-${id}`;
  const podName = `workspace-${id}`;

  try {
    console.log("Creating PVC...");

    // 1. Create PVC
    await k8sApi.createNamespacedPersistentVolumeClaim({
      namespace: NAMESPACE,
      body: {
        metadata: {
          name: pvcName,
        },
        spec: {
          accessModes: ["ReadWriteOnce"],
          resources: {
            requests: {
              storage: "1Gi",
            },
          },
        },
      },
    });

    console.log("Creating Pod...");

    // 2. Create Pod
    await k8sApi.createNamespacedPod({
      namespace: NAMESPACE,
      body: {
        metadata: {
          name: podName,
          labels: { app: "workspace" },
        },
        spec: {
          containers: [
            {
              name: "code-server",
              image: "codercom/code-server:latest",
              ports: [{ containerPort: 8080 }],
              env: [
      {
        name: "PASSWORD",
        value: PASSWORD,
                },
              ],

              // ADDED HERE (RESOURCE LIMITS)
              resources: {
                requests: {
                  cpu: "200m",
                  memory: "256Mi",
                },
                limits: {
                  cpu: "500m",
                  memory: "512Mi",
                },
              },

              volumeMounts: [
                {
                  name: "workspace-storage",
                  mountPath: "/home/coder",
                },
              ],
            },
          ],
          volumes: [
            {
              name: "workspace-storage",
              persistentVolumeClaim: {
                claimName: pvcName,
              },
            },
          ],
        },
      },
    });

    res.json({
      id,
      message: "Workspace with persistence + limits created",
    });

  } catch (err) {
    console.error("FULL ERROR:", err.body || err);
    res.status(500).json({
  error: "Workspace creation failed",
  details: err.body || err.message
});
  }
});

// LIST WORKSPACES
app.get("/workspace", async (req, res) => {
  try {
    const pods = await k8sApi.listNamespacedPod(NAMESPACE);

    const workspaces = pods.body.items
      .filter(p => p.metadata.name.startsWith("workspace-"))
      .map(p => ({
        name: p.metadata.name,
        status: p.status.phase,
      }));

    res.json(workspaces);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error listing workspaces");
  }
});

// DELETE WORKSPACE
app.delete("/workspace/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await k8sApi.deleteNamespacedPod(`workspace-${id}`, NAMESPACE);
    await k8sApi.deleteNamespacedPersistentVolumeClaim(`pvc-${id}`, NAMESPACE);

    res.send("Workspace deleted");
  } catch (err) {
    console.error(err);
    res.status(500).send("Delete failed");
  }
});

// START SERVER
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});