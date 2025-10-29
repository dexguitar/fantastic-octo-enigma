# Kubernetes Deployment Guide

Complete guide to deploy the Document Processing System to a local Kubernetes cluster using Colima.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Starting Colima Kubernetes Cluster](#starting-colima-kubernetes-cluster)
3. [Deploying the Application](#deploying-the-application)
4. [Verifying the Deployment](#verifying-the-deployment)
5. [Testing the Application](#testing-the-application)
6. [Accessing Services](#accessing-services)
7. [Troubleshooting](#troubleshooting)
8. [Cleaning Up](#cleaning-up)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Colima** - Container runtime with Kubernetes support

   ```bash
   brew install colima
   ```

2. **Docker CLI**

   ```bash
   brew install docker
   ```

3. **kubectl** - Kubernetes command-line tool

   ```bash
   brew install kubectl
   ```

4. **jq** - JSON processor (for testing)
   ```bash
   brew install jq
   ```

### System Requirements

- **CPU**: 6+ cores recommended
- **Memory**: 12GB+ RAM recommended
- **Disk**: 20GB+ free space
- **OS**: macOS (tested on darwin 24.6.0)

---

## Starting Colima Kubernetes Cluster

### Step 1: Start Colima with Kubernetes

Start Colima with sufficient resources for the application:

```bash
colima start --kubernetes --cpu 6 --memory 12
```

**Expected Output:**

```
time="..." level=info msg="starting colima"
time="..." level=info msg="runtime: docker+k3s"
...
time="..." level=info msg="done"
```

**Important Notes:**

- This command will take 30-60 seconds to complete
- 6 CPUs and 12GB RAM are required to run all services comfortably
- If you need to adjust resources later, stop Colima and restart with different values

### Step 2: Verify Cluster is Running

```bash
kubectl cluster-info
```

**Expected Output:**

```
Kubernetes control plane is running at https://127.0.0.1:...
CoreDNS is running at https://127.0.0.1:.../api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
```

Check Colima status:

```bash
colima status
```

**Expected Output:**

```
INFO[0000] colima is running
INFO[0000] arch: aarch64
INFO[0000] runtime: docker+k3s
INFO[0000] kubernetes: v1.31.2+k3s1
```

---

## Deploying the Application

The deployment is fully automated via a single script.

### Step 1: Navigate to the k8s Directory

```bash
cd /path/to/fantastic-octo-enigma/k8s
```

### Step 2: Run the Deploy Script

```bash
./deploy.sh
```

The script will automatically:

1. ✅ Build the Docker image
2. ✅ Create the Kubernetes namespace
3. ✅ Deploy PostgreSQL database
4. ✅ Run database migrations
5. ✅ Deploy Zookeeper
6. ✅ Deploy Kafka
7. ✅ Deploy Kafka UI
8. ✅ Deploy API Gateway (2 replicas)
9. ✅ Deploy Image Service (2 replicas)
10. ✅ Deploy Text Service (2 replicas)

**Expected Output:**

```
======================================
Deploying to Kubernetes
======================================
[INFO] Kubernetes cluster is accessible
[INFO] Building Docker image...
...
[INFO] Database migrations completed successfully
...
======================================
Deployment Complete!
======================================

Services are accessible at:
  - API Gateway: http://localhost:30000
  - API Documentation: http://localhost:30000/api-docs
  - Kafka UI: http://localhost:30080
```

**Deployment Time:** Approximately 2-3 minutes

---

## Verifying the Deployment

### Step 1: Check All Pods are Running

```bash
kubectl get pods -n document-processing
```

**Expected Output:**

```
NAME                            READY   STATUS    RESTARTS   AGE
api-gateway-xxx-xxx             1/1     Running   0          2m
api-gateway-xxx-xxx             1/1     Running   0          2m
image-service-xxx-xxx           1/1     Running   0          2m
image-service-xxx-xxx           1/1     Running   0          2m
kafka-xxx-xxx                   1/1     Running   0          2m
kafka-ui-xxx-xxx                1/1     Running   0          2m
postgres-xxx-xxx                1/1     Running   0          3m
text-service-xxx-xxx            1/1     Running   0          2m
text-service-xxx-xxx            1/1     Running   0          2m
zookeeper-xxx-xxx               1/1     Running   0          2m
```

**All pods should show:**

- `READY`: 1/1
- `STATUS`: Running
- `RESTARTS`: 0 (or low number)

### Step 2: Verify Database Tables Were Created

```bash
kubectl exec -n document-processing deployment/postgres -- \
  psql -U admin -d document_processing -c "\dt"
```

**Expected Output:**

```
             List of relations
 Schema |       Name        | Type  | Owner
--------+-------------------+-------+-------
 public | documents         | table | admin
 public | schema_migrations | table | admin
(2 rows)
```

### Step 3: Check Services are Accessible

```bash
kubectl get svc -n document-processing
```

**Expected Output:**

```
NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
api-gateway     NodePort    10.x.x.x        <none>        3000:30000/TCP   3m
image-service   ClusterIP   10.x.x.x        <none>        3001/TCP         3m
kafka           ClusterIP   10.x.x.x        <none>        9092/TCP         3m
kafka-ui        NodePort    10.x.x.x        <none>        8080:30080/TCP   3m
postgres        ClusterIP   10.x.x.x        <none>        5432/TCP         3m
text-service    ClusterIP   10.x.x.x        <none>        3002/TCP         3m
zookeeper       ClusterIP   10.x.x.x        <none>        2181/TCP         3m
```

---

## Testing the Application

### Test 1: API Health Check

```bash
curl -s http://localhost:30000/api/documents | jq .
```

**Expected Output:**

```json
[]
```

This confirms the API is running and can connect to the database.

### Test 2: Create a Text Document

```bash
curl -X POST http://localhost:30000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Document",
    "type": "text",
    "content": "This is a test document to verify the system is working."
  }' | jq .
```

**Expected Output:**

```json
{
  "id": "uuid-here",
  "name": "Test Document",
  "type": "text",
  "status": "processing",
  "keywords": [],
  "createdAt": "2025-10-26T...",
  "updatedAt": "2025-10-26T..."
}
```

**Note:** Status will be `"processing"` initially.

### Test 3: Wait and Check Processing Result

Wait 10 seconds for the text service to process the document:

```bash
sleep 10
```

Then retrieve the document (use the ID from Test 2):

```bash
curl -s http://localhost:30000/api/documents/{document-id} | jq .
```

**Expected Output:**

```json
{
  "id": "uuid-here",
  "name": "Test Document",
  "type": "text",
  "status": "completed",
  "keywords": [],
  "createdAt": "2025-10-26T...",
  "updatedAt": "2025-10-26T...",
  "result": {
    "analysis": "Text analysis complete",
    "keywords": ["sample", "document", "text"],
    "language": "English",
    "sentiment": {
      "label": "neutral",
      "score": "0.45"
    },
    "statistics": {
      "wordCount": 123,
      "sentenceCount": 10,
      "characterCount": 789,
      "paragraphCount": 2
    },
    "processingTime": "1.23s"
  }
}
```

**✅ Success Indicators:**

- Status changed from `"processing"` to `"completed"`
- `result` object contains analysis data
- Keywords were extracted
- Sentiment analysis completed

### Test 4: Create an Image Document

```bash
curl -X POST http://localhost:30000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Image",
    "type": "image",
    "content": "https://example.com/test-image.jpg"
  }' | jq .
```

Wait 10 seconds and retrieve to verify image processing works similarly.

---

## Accessing Services

### API Gateway

**URL:** http://localhost:30000

**Available Endpoints:**

- `GET /api/documents` - List all documents
- `POST /api/documents` - Create a new document
- `GET /api/documents/:id` - Get a specific document
- `PUT /api/documents/:id` - Update a document
- `DELETE /api/documents/:id` - Delete a document
- `GET /api/documents/:id/result` - Get processing result

**API Documentation:**

- Swagger UI: http://localhost:30000/api-docs (if configured)

### Kafka UI

**URL:** http://localhost:30080

Use Kafka UI to:

- View Kafka topics
- Monitor messages
- Check consumer groups
- Inspect broker configuration

**Default Topics:**

- `document-image-processing`
- `document-text-processing`
- `document-processing-results`

---

## Troubleshooting

### Issue 1: Pods Not Starting

**Symptom:**

```bash
kubectl get pods -n document-processing
# Shows pods in Pending or CrashLoopBackOff
```

**Solution:**

1. Check pod details:

   ```bash
   kubectl describe pod <pod-name> -n document-processing
   ```

2. Check logs:

   ```bash
   kubectl logs <pod-name> -n document-processing
   ```

3. Common issues:
   - **Insufficient resources:** Increase Colima resources
   - **Image pull issues:** Check Docker image was built
   - **Configuration errors:** Verify ConfigMap and Secrets

### Issue 2: Kafka Not Starting

**Symptom:** Kafka pod in CrashLoopBackOff or Error state

**Solution:**

1. Check Kafka logs:

   ```bash
   kubectl logs -n document-processing deployment/kafka --tail=100
   ```

2. Verify Zookeeper is running:

   ```bash
   kubectl get pods -n document-processing | grep zookeeper
   ```

3. Check resources:

   ```bash
   kubectl describe node | grep -A 10 "Allocated resources"
   ```

4. If resources are insufficient:
   ```bash
   colima stop
   colima start --kubernetes --cpu 8 --memory 16
   cd k8s && ./deploy.sh
   ```

### Issue 3: Database Connection Errors

**Symptom:** API returns database connection errors

**Solution:**

1. Check PostgreSQL is running:

   ```bash
   kubectl get pods -n document-processing | grep postgres
   ```

2. Test database connection:

   ```bash
   kubectl exec -n document-processing deployment/postgres -- \
     psql -U admin -d document_processing -c "SELECT 1;"
   ```

3. Check if migrations ran:

   ```bash
   kubectl logs -n document-processing -l job-name=db-migration
   ```

4. If tables don't exist, check migration logs for errors

### Issue 4: API Returns 500 Errors

**Symptom:** API requests return Internal Server Error

**Solution:**

1. Check API Gateway logs:

   ```bash
   kubectl logs -n document-processing deployment/api-gateway --tail=100
   ```

2. Check if all init containers completed:

   ```bash
   kubectl get pods -n document-processing -o wide
   ```

3. Verify environment variables:
   ```bash
   kubectl describe pod <api-gateway-pod> -n document-processing | grep -A 20 "Environment:"
   ```

### Issue 5: Documents Stuck in "Processing"

**Symptom:** Documents remain in `"processing"` status

**Solution:**

1. Check Kafka is running:

   ```bash
   kubectl get pods -n document-processing | grep kafka
   ```

2. Check text/image service logs:

   ```bash
   kubectl logs -n document-processing deployment/text-service
   kubectl logs -n document-processing deployment/image-service
   ```

3. Verify Kafka topics exist:
   - Open http://localhost:30080
   - Check for topics: `document-text-processing`, `document-image-processing`

### General Debugging Commands

```bash
# View all resources
kubectl get all -n document-processing

# Check events
kubectl get events -n document-processing --sort-by='.lastTimestamp'

# Get detailed pod info
kubectl describe pod <pod-name> -n document-processing

# View logs with timestamps
kubectl logs -n document-processing <pod-name> --timestamps=true

# Follow logs in real-time
kubectl logs -n document-processing <pod-name> -f

# Check resource usage
kubectl top pods -n document-processing
kubectl top nodes
```

---

## Cleaning Up

### Option 1: Delete the Namespace (Recommended)

This removes all application resources but keeps Colima running:

```bash
kubectl delete namespace document-processing
```

**Wait for namespace deletion:**

```bash
kubectl get namespace document-processing
# Should show "NotFound" after 30-60 seconds
```

### Option 2: Use the Destroy Script

```bash
cd k8s
./destroy.sh
```

This script:

- Deletes all deployments
- Removes services
- Cleans up PVCs
- Removes the namespace

### Option 3: Stop Colima Completely

To stop the entire Kubernetes cluster:

```bash
colima stop
```

To restart later:

```bash
colima start --kubernetes --cpu 6 --memory 12
```

### Option 4: Delete Colima VM

To completely remove Colima and start fresh:

```bash
colima delete
```

**Warning:** This will delete all images, containers, and volumes!

---

## Appendix: Architecture Overview

### Components

**Infrastructure Layer:**

- PostgreSQL (Database)
- Zookeeper (Coordination service)
- Kafka (Message broker)
- Kafka UI (Monitoring)

**Application Layer:**

- API Gateway (2 replicas) - REST API
- Image Service (2 replicas) - Image processing
- Text Service (2 replicas) - Text analysis

### Data Flow

```
1. Client → API Gateway (POST /api/documents)
   ↓
2. API Gateway → PostgreSQL (Save document, status: "pending")
   ↓
3. API Gateway → Kafka (Publish message to topic)
   ↓
4. Kafka → Processing Service (Text/Image Service consumes message)
   ↓
5. Processing Service → Process document
   ↓
6. Processing Service → PostgreSQL (Update document, status: "completed")
   ↓
7. Client → API Gateway (GET /api/documents/:id) → Retrieve results
```

### Network Configuration

**External Access (NodePort):**

- API Gateway: Port 30000 → 3000
- Kafka UI: Port 30080 → 8080

**Internal Access (ClusterIP):**

- PostgreSQL: postgres:5432
- Kafka: kafka:9092
- Zookeeper: zookeeper:2181
- Image Service: image-service:3001
- Text Service: text-service:3002

### Resource Allocation

| Service       | CPU Request | CPU Limit | Memory Request | Memory Limit | Replicas |
| ------------- | ----------- | --------- | -------------- | ------------ | -------- |
| API Gateway   | 100m        | 200m      | 128Mi          | 256Mi        | 2        |
| Image Service | 100m        | 200m      | 128Mi          | 256Mi        | 2        |
| Text Service  | 100m        | 200m      | 128Mi          | 256Mi        | 2        |
| Kafka         | 500m        | 1000m     | 512Mi          | 1Gi          | 1        |
| Zookeeper     | 250m        | 500m      | 256Mi          | 512Mi        | 1        |
| PostgreSQL    | 250m        | 500m      | 256Mi          | 512Mi        | 1        |
| Kafka UI      | 100m        | 200m      | 128Mi          | 256Mi        | 1        |

**Total:** ~2 CPUs, ~2.5GB RAM

---

## Appendix: Quick Reference

### Essential Commands

```bash
# Deploy application
cd k8s && ./deploy.sh

# Check deployment status
kubectl get pods -n document-processing

# View logs
kubectl logs -n document-processing deployment/api-gateway -f

# Test API
curl http://localhost:30000/api/documents

# Clean up
kubectl delete namespace document-processing

# Restart Colima with more resources
colima stop
colima start --kubernetes --cpu 8 --memory 16
```

### Utility Scripts

Located in `k8s/utils/`:

```bash
# Check status
./k8s/utils/status.sh

# View logs
./k8s/utils/logs.sh <service-name>

# Get shell access
./k8s/utils/shell.sh <service-name>

# Test API
./k8s/utils/test-api.sh
```

---

## Summary

**Deployment Steps:**

1. ✅ Install prerequisites (Colima, kubectl, Docker CLI)
2. ✅ Start Colima: `colima start --kubernetes --cpu 6 --memory 12`
3. ✅ Deploy application: `cd k8s && ./deploy.sh`
4. ✅ Wait 2-3 minutes for all pods to be ready
5. ✅ Test API: `curl http://localhost:30000/api/documents`
6. ✅ Create and process documents

**Time to Deploy:** 2-3 minutes  
**Services Deployed:** 10 pods across 7 services  
**Database Tables:** Automatically created via migrations  
**Kafka Topics:** Automatically created on startup

**✅ Everything is fully automated!**

---

## Next Steps

After successful deployment:

1. **Monitor the cluster:**
   - Check Kafka UI: http://localhost:30080
   - View pod logs regularly
   - Monitor resource usage: `kubectl top pods -n document-processing`

2. **Scale services:**

   ```bash
   kubectl scale deployment/api-gateway --replicas=3 -n document-processing
   ```

3. **Update application:**

   ```bash
   # Rebuild image
   docker build -t document-processing-app:latest .

   # Restart deployments
   kubectl rollout restart deployment -n document-processing
   ```

4. **Backup database:**
   ```bash
   kubectl exec -n document-processing deployment/postgres -- \
     pg_dump -U admin document_processing > backup.sql
   ```

---

**Deployment Guide Version:** 1.0  
**Last Updated:** October 26, 2025  
**Tested On:** macOS (darwin 24.6.0) with Colima + K3s
