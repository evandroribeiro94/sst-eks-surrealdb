import { SSTConfig } from "sst";
import { EksStack } from "./src/EksStack";

export default {
  config(_input) {
    return {
      name: "sst-eks-surrealdb",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(EksStack);
  },
} satisfies SSTConfig;
