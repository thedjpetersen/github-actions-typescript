import { RunStep, UsesStep } from "./step";

interface JobInterface {
  name: string;
  environment?: string;
  needs?: string | string[];
  permissions?:
    | {
        actions?: "read" | "write" | "none";
        checks?: "read" | "write" | "none";
        contents?: "read" | "write" | "none";
        deployments?: "read" | "write" | "none";
        discussions?: "read" | "write" | "none";
        "id-token"?: "read" | "write" | "none";
        issues?: "read" | "write" | "none";
        packages?: "read" | "write" | "none";
        pages?: "read" | "write" | "none";
        "pull-requests"?: "read" | "write" | "none";
        "repository-projects"?: "read" | "write" | "none";
        "security-events"?: "read" | "write" | "none";
        statuses?: "read" | "write" | "none";
      }
    | "write-all"
    | "read-all";
  "runs-on": string | string[];
  outputs?: {
    [key: string]: string;
  };
  env?: {
    [key: string]: string;
  };
  defaults?: {
    run?: {
      shell?: "bash" | "pwsh" | "python" | "sh" | "cmd" | "powershell";
      "working-directory"?: string;
    };
  };
  if?: string;
  steps?: (RunStep | UsesStep)[];
  "timeout-minutes"?: number;
  // Currently not supporting the strategy interface can change this in the future
  // strategy?: StrategyInterface;
  "continue-on-error"?: boolean;
  container?: {
    image: string;
    credentials?: {
      username: string;
      password: string;
    };
    env?: {
      [key: string]: string;
    };
    ports?: number[];
    volumes?: string[];
    options?: string;
  };
  services?: {
    [key: string]: {
      image: string;
      credentials?: {
        username: string;
        password: string;
      };
      env?: {
        [key: string]: string;
      };
      ports?: number[];
      volumes?: string[];
      options?: string;
    };
  };
  uses?: string;
  with?: {
    [key: string]: any;
  };
  secrets?: {
    [key: string]: string;
  };
  concurrency?: {
    group: string;
    "cancel-in-progress": boolean;
  };
}

export class Job implements JobInterface {
  steps: (RunStep | UsesStep)[];
  public name: string;
  public environment?: string;
  public needs?: string | string[];
  public permissions?: {
    actions?: "read" | "write" | "none";
    checks?: "read" | "write" | "none";
    contents?: "read" | "write" | "none";
    deployments?: "read" | "write" | "none";
    discussions?: "read" | "write" | "none";
    "id-token"?: "read" | "write" | "none";
    issues?: "read" | "write" | "none";
    packages?: "read" | "write" | "none";
    pages?: "read" | "write" | "none";
    "pull-requests"?: "read" | "write" | "none";
    "repository-projects"?: "read" | "write" | "none";
    "security-events"?: "read" | "write" | "none";
    statuses?: "read" | "write" | "none";
  };
  public "runs-on": string | string[];
  public outputs?: { [key: string]: string };
  public env?: { [key: string]: string };
  public defaults?: {
    run?: {
      shell?: "bash" | "pwsh" | "python" | "sh" | "cmd" | "powershell";
      "working-directory"?: string;
    };
  };
  public if?: string;
  public "timeout-minutes"?: number;
  public "continue-on-error"?: boolean;
  public container?: {
    image: string;
    credentials?: {
      username: string;
      password: string;
    };
    env?: { [key: string]: string };
    ports?: number[];
    volumes?: string[];
    options?: string;
  };
  public services?: {
    [key: string]: {
      image: string;
      credentials?: {
        username: string;
        password: string;
      };
      env?: { [key: string]: string };
      ports?: number[];
      volumes?: string[];
      options?: string;
    };
  };
  public uses?: string;
  public with?: { [key: string]: any };
  public secrets?: {
    [key: string]: string;
  };
  public concurrency?: {
    group: string;
    "cancel-in-progress": boolean;
  };

  constructor(config: JobInterface) {
    Object.assign(this, config);
    this.steps = this.steps || [];
    this.validate();
  }

  addStep(step: RunStep | UsesStep) {
    if (!this.steps) {
      this.steps = [];
    }
    this.steps.push(step);
  }

  validate() {
    if (!this["runs-on"]) {
      throw new Error("The 'runs-on' property is required for a job.");
    }

    if (this.container && !this.container.image) {
      throw new Error(
        "The 'image' property is required when specifying a container."
      );
    }

    if (this.services) {
      Object.values(this.services).forEach((service) => {
        if (!service.image) {
          throw new Error("The 'image' property is required for each service.");
        }
      });
    }

    if (this.steps) {
      this.steps.forEach((step) => {
        if (step instanceof RunStep) {
          step.validate();
        } else if (step instanceof UsesStep) {
          step.validate();
        }
      });
    }
  }
}
