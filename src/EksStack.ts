import { Stack, StackProps, Api } from "sst/constructs";
import * as eks from "aws-cdk-lib/aws-eks";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class EksStack extends Stack {
  public readonly cluster: eks.Cluster;
  public readonly vpc: ec2.Vpc;
  public readonly api: Api;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 1. Create VPC with Multi-AZ redundancy
    this.vpc = new ec2.Vpc(this, "SurrealDBVPC", {
      maxAzs: 3,
      natGateways: 1,
    });

    // 2. Create EKS Cluster with ARM64/x86 Graviton compatibility
    this.cluster = new eks.Cluster(this, "SurrealDBCluster", {
      vpc: this.vpc,
      version: eks.KubernetesVersion.V1_28,
      defaultCapacity: 2,
      defaultCapacityInstance: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
    });

    // 3. Add Dedicated TiKV node group (Storage-optimized)
    this.cluster.addNodegroupCapacity("TiKVNodeGroup", {
      instanceTypes: [
        ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
      ],
      minSize: 1,
      maxSize: 3,
      desiredSize: 1,
      labels: {
        dedicated: "tikv",
      },
      taints: [
        {
          key: "dedicated",
          value: "tikv",
          effect: eks.TaintEffect.NO_SCHEDULE,
        },
      ],
    });

    // 4. Add Dedicated Placement Driver (PD) node group
    this.cluster.addNodegroupCapacity("PDNodeGroup", {
      instanceTypes: [
        ec2.InstanceType.of(ec2.InstanceClass.C5, ec2.InstanceSize.LARGE),
      ],
      minSize: 1,
      maxSize: 3,
      desiredSize: 1,
      labels: {
        dedicated: "pd",
      },
      taints: [
        {
          key: "dedicated",
          value: "pd",
          effect: eks.TaintEffect.NO_SCHEDULE,
        },
      ],
    });

    // 5. Add Dedicated TiDB query layer node group
    this.cluster.addNodegroupCapacity("TiDBNodeGroup", {
      instanceTypes: [
        ec2.InstanceType.of(ec2.InstanceClass.C5, ec2.InstanceSize.LARGE),
      ],
      minSize: 1,
      maxSize: 2,
      desiredSize: 1,
      labels: {
        dedicated: "tidb",
      },
      taints: [
        {
          key: "dedicated",
          value: "tidb",
          effect: eks.TaintEffect.NO_SCHEDULE,
        },
      ],
    });

    // 6. SST Serverless API exposing the Hono service
    this.api = new Api(this, "HonoServiceApi", {
      routes: {
        $default: "examples/hono-service/index.handler",
      },
      environment: {
        SURREALDB_URL: process.env.SURREALDB_URL || "ws://surrealdb.default.svc.cluster.local:8000/rpc",
        SURREALDB_USER: process.env.SURREALDB_USER || "root",
        SURREALDB_PASS: process.env.SURREALDB_PASS || "root",
        SURREALDB_NS: process.env.SURREALDB_NS || "production",
        SURREALDB_DB: process.env.SURREALDB_DB || "main",
      },
    });

    this.addOutputs({
      ClusterName: this.cluster.clusterName,
      ClusterArn: this.cluster.clusterArn,
      ApiEndpoint: this.api.url,
    });
  }
}
