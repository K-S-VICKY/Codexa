import express from "express";
import fs from "fs";
import yaml from "yaml";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { KubeConfig, AppsV1Api, CoreV1Api, NetworkingV1Api } from "@kubernetes/client-node";

const app = express();
app.use(express.json());
app.use(cors());

const kubeconfig = new KubeConfig();
kubeconfig.loadFromDefault();
kubeconfig.setCurrentContext("AKS-CodexaApp2"); 
const coreV1Api = kubeconfig.makeApiClient(CoreV1Api);
const appsV1Api = kubeconfig.makeApiClient(AppsV1Api);
const networkingV1Api = kubeconfig.makeApiClient(NetworkingV1Api);

// Updated utility function to handle multi-document YAML files
const readAndParseKubeYaml = (filePath: string, replId: string): Array<any> => {
    console.log("Attempting to read file at:", filePath);
    console.log("File exists:", fs.existsSync(filePath));
    console.log("Current working directory:", process.cwd());
    console.log("__dirname:", __dirname);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const docs = yaml.parseAllDocuments(fileContent).map((doc) => {
        let docString = doc.toString();
        const regex = new RegExp(`service_name`, 'g');
        docString = docString.replace(regex, replId);
        console.log(docString);
        return yaml.parse(docString);
    });
    return docs;
};

// Add helper function to wait for pod readiness
const waitForPodReady = async (namespace: string, labelSelector: string, timeoutMs: number = 300000): Promise<boolean> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
        try {
            const response = await coreV1Api.listNamespacedPod(namespace, undefined, undefined, undefined, undefined, labelSelector);
            const pods = response.body.items;
            
            if (pods.length === 0) {
                console.log("No pods found yet, waiting...");
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }
            
            const pod = pods[0];
            const podStatus = pod.status?.phase;
            const containerStatuses = pod.status?.containerStatuses || [];
            
            console.log(`Pod ${pod.metadata?.name} status: ${podStatus}`);
            
            if (podStatus === 'Running') {
                const allContainersReady = containerStatuses.every(status => status.ready);
                if (allContainersReady) {
                    console.log(`Pod ${pod.metadata?.name} is ready!`);
                    return true;
                }
                console.log("Pod is running but containers not ready yet...");
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error: any) {
            console.error("Error checking pod status:", error instanceof Error ? error.message : String(error));
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    return false;
};

// Add helper function to check service health
const checkServiceHealth = async (serviceUrl: string, timeoutMs: number = 60000): Promise<boolean> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
        try {
            const response = await fetch(`${serviceUrl}/health`, { 
                method: 'GET'
            });
            if (response.ok) {
                console.log(`Service at ${serviceUrl} is healthy!`);
                return true;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log(`Service health check failed, retrying... (${errorMessage})`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    return false;
};

app.post("/start", async (req, res) => {
    const { userId, replId } = req.body; // Assume a unique identifier for each user
    const namespace = "default"; // Assuming a default namespace, adjust as needed

    try {
        const servicePath = path.resolve(__dirname, "../service.yaml");
        console.log("Looking for service.yaml at:", servicePath);
        const kubeManifests = readAndParseKubeYaml(servicePath, replId);
        
        // Create resources
        for (const manifest of kubeManifests) {
            switch (manifest.kind) {
                case "Deployment":
                    try {
                        await appsV1Api.createNamespacedDeployment(namespace, manifest);
                        console.log(`Deployment ${manifest.metadata.name} created successfully`);
                    } catch (error: any) {
                        if (error.statusCode === 409) {
                            console.log(`Deployment ${manifest.metadata.name} already exists, skipping...`);
                        } else {
                            throw error;
                        }
                    }
                    break;
                case "Service":
                    try {
                        await coreV1Api.createNamespacedService(namespace, manifest);
                        console.log(`Service ${manifest.metadata.name} created successfully`);
                    } catch (error: any) {
                        if (error.statusCode === 409) {
                            console.log(`Service ${manifest.metadata.name} already exists, skipping...`);
                        } else {
                            throw error;
                        }
                    }
                    break;
                case "Ingress":
                    try {
                        await networkingV1Api.createNamespacedIngress(namespace, manifest);
                        console.log(`Ingress ${manifest.metadata.name} created successfully`);
                    } catch (error: any) {
                        if (error.statusCode === 409) {
                            console.log(`Ingress ${manifest.metadata.name} already exists, skipping...`);
                        } else {
                            throw error;
                        }
                    }
                    break;
                default:
                    console.log(`Unsupported kind: ${manifest.kind}`);
            }
        }
        
        // Wait for pod to be ready
        console.log("Waiting for pod to be ready...");
        const podReady = await waitForPodReady(namespace, `app=${replId}`, 300000); // 5 minute timeout
        
        if (!podReady) {
            throw new Error("Pod failed to become ready within timeout");
        }
        
        // Check service health
        console.log("Checking service health...");
        const serviceHealthy = await checkServiceHealth(`http://${replId}.davish.tech`, 60000); // 1 minute timeout
        
        if (!serviceHealthy) {
            console.log("Service health check failed, but pod is ready. Proceeding...");
        }
        
        console.log("Environment is ready for connections!");
        res.status(200).send({ 
            message: "Resources created successfully", 
            ready: true,
            socketUrl: `ws://${replId}.davish.tech`
        });
    } catch (error) {
        console.error("Failed to create resources", error);
        res.status(500).send({ message: "Failed to create resources" });
    }
});

const port = process.env.PORT || 3002;
app.listen(port, () => {
    console.log(process.env.S3_BUCKET);
    console.log(`Listening on port: ${port}`);
});
