# SST/Pulumi SurrealDB on TiKV Challenge — Solution & Reference Architecture

> Fully automated infrastructure deployment for **SurrealDB on a distributed TiKV cluster** hosted on **Amazon EKS** using **SST** and **Pulumi**, integrated with an event-driven **Hono** web service.

---

## 🏆 Solution Overview

This solution fulfills all requirements of the challenge:
1. **Infrastructure as Code:**
   - **Pulumi / SST v3 Engine (`surrealdb.ts`):** Provisions an Amazon EKS cluster with dedicated node groups (`pd`, `tikv`, `tidb`), installs the **TiDB Operator v1.6.1**, converges a `TidbCluster` custom resource with persistent EBS storage (`gp3`), installs the Kong Ingress controller, and deploys **SurrealDB v2.2.2** connecting to TiKV at `tikv://basic-pd.tidb-cluster:2379`.
   - **SST v2 Stack (`src/EksStack.ts` & `sst.config.ts`):** Complete CDK-based multi-AZ VPC, EKS cluster, node groups, and SST Serverless API construct hosting the Hono service.
2. **Hono Web Service (`examples/hono-service/index.ts`):**
   - High-performance Hono API connecting to SurrealDB over WebSocket RPC.
   - Dual-runtime compatibility: runs locally via Node/tsx or as an AWS Lambda handler via `hono/aws-lambda`.
   - Endpoints: `GET /health`, `POST /users`, and `GET /users`.
3. **Full Documentation (`docs/DEPLOYMENT.md`):**
   - Step-by-step setup and environment configuration.
   - Mermaid architecture diagrams.
   - Sample successful deployment logs and verification commands.
   - Production troubleshooting and teardown instructions.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Deploy Infrastructure
```bash
# Option A: Via SST v2
pnpm run deploy --stage prod

# Option B: Via Pulumi / SST v3
pulumi up
```

### 3. Run Hono Service
```bash
cd examples/hono-service
pnpm install
pnpm run dev
```

For detailed deployment guides, logs, and architecture diagrams, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## 📜 License
MIT
