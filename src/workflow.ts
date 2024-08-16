import fs from "fs/promises";
import path from "path";

import yaml from "js-yaml";
import { Job } from "./job";
import { RunStep, UsesStep } from "./step";

type EventType =
  | string
  | string[]
  | {
      [event: string]: {
        types?: string[];
        branches?: string[];
        "branches-ignore"?: string[];
        paths?: string[];
        "paths-ignore"?: string[];
      };
    };

interface DefaultsInterface {
  run?: {
    shell?: "bash" | "pwsh" | "python" | "sh" | "cmd" | "powershell";
    "working-directory"?: string;
  };
}

interface ConcurrencyInterface {
  group: string;
  "cancel-in-progress": boolean;
}

interface WorkflowInterface {
  name?: string;
  on: EventType;
  env?: {
    [name: string]: string;
  };
  defaults?: DefaultsInterface;
  concurrency?: string | ConcurrencyInterface;
}

export class Workflow implements WorkflowInterface {
  filename: string;
  name?: string;
  "on": EventType;
  env?: {
    [name: string]: string;
  };
  defaults?: DefaultsInterface;
  concurrency?: string | ConcurrencyInterface;
  jobs: {
    [jobId: string]: Job;
  };

  constructor(filename, config: WorkflowInterface) {
    this.validateConfig(config);
    this.filename = filename;
    this.name = config.name;
    this.on = config.on;
    this.env = config.env;
    this.defaults = config.defaults;
    this.concurrency = config.concurrency;
  }

  private validateConfig(config: WorkflowInterface) {
    if (!config.on) {
      throw new Error(
        "The 'on' property is required in the workflow configuration."
      );
    }

    if (typeof config.on === "object") {
      for (const event in config.on) {
        const eventConfig = config.on[event];
        if (eventConfig.types && !Array.isArray(eventConfig.types)) {
          throw new Error(
            `The 'types' property for event '${event}' must be an array.`
          );
        }
        if (eventConfig.branches && !Array.isArray(eventConfig.branches)) {
          throw new Error(
            `The 'branches' property for event '${event}' must be an array.`
          );
        }
        if (
          eventConfig["branches-ignore"] &&
          !Array.isArray(eventConfig["branches-ignore"])
        ) {
          throw new Error(
            `The 'branches-ignore' property for event '${event}' must be an array.`
          );
        }
        if (eventConfig.paths && !Array.isArray(eventConfig.paths)) {
          throw new Error(
            `The 'paths' property for event '${event}' must be an array.`
          );
        }
        if (
          eventConfig["paths-ignore"] &&
          !Array.isArray(eventConfig["paths-ignore"])
        ) {
          throw new Error(
            `The 'paths-ignore' property for event '${event}' must be an array.`
          );
        }
      }
    }

    if (config.defaults && config.defaults.run && config.defaults.run.shell) {
      const allowedShells: string[] = [
        "bash",
        "pwsh",
        "python",
        "sh",
        "cmd",
        "powershell",
      ];
      if (!allowedShells.includes(config.defaults.run.shell)) {
        throw new Error(
          `Invalid shell specified in defaults.run.shell. Allowed values are: ${allowedShells.join(
            ", "
          )}.`
        );
      }
    }
  }

  addJob(options: { id: string; job: Job }) {
    if (!this.jobs) {
      this.jobs = {};
    }
    this.jobs[options.id] = options.job;
  }
  toYaml = () => {
    const workflowObject: any = {};

    if (this.name) {
      workflowObject.name = this.name;
    }
    workflowObject.on = this.on;
    if (this.env) {
      workflowObject.env = this.env;
    }
    if (this.defaults) {
      workflowObject.defaults = this.defaults;
    }
    if (this.concurrency) {
      workflowObject.concurrency = this.concurrency;
    }
    workflowObject.jobs = {};

    for (const jobId in this.jobs) {
      const job = this.jobs[jobId];
      const jobObject: any = {};

      if (job.name) {
        jobObject.name = job.name;
      }
      if (job.needs) {
        jobObject.needs = job.needs;
      }
      if (job.permissions) {
        jobObject.permissions = job.permissions;
      }
      jobObject["runs-on"] = job["runs-on"];
      if (job.outputs) {
        jobObject.outputs = job.outputs;
      }
      if (job.env) {
        jobObject.env = job.env;
      }
      if (job.defaults) {
        jobObject.defaults = job.defaults;
      }
      if (job.if) {
        jobObject.if = job.if;
      }
      if (job.steps) {
        jobObject.steps = job.steps.map((step) => {
          const stepObject: any = {};
          if (step.if) {
            stepObject.if = step.if;
          }
          if (step.name) {
            stepObject.name = step.name;
          }
          if (step instanceof RunStep) {
            stepObject.run = (step as RunStep).run;
            if (step["working-directory"]) {
              stepObject["working-directory"] = step["working-directory"];
            }
            if (step.shell) {
              stepObject.shell = step.shell;
            }
          } else if (step instanceof UsesStep) {
            stepObject.uses = step.uses;
            if (step.with) {
              stepObject.with = step.with;
            }
          }
          if (step.env) {
            stepObject.env = step.env;
          }
          if (step["continue-on-error"]) {
            stepObject["continue-on-error"] = step["continue-on-error"];
          }
          if (step["timeout-minutes"]) {
            stepObject["timeout-minutes"] = step["timeout-minutes"];
          }
          return stepObject;
        });
      }
      if (job["timeout-minutes"]) {
        jobObject["timeout-minutes"] = job["timeout-minutes"];
      }
      if (job["continue-on-error"]) {
        jobObject["continue-on-error"] = job["continue-on-error"];
      }
      if (job.container) {
        jobObject.container = job.container;
      }
      if (job.services) {
        jobObject.services = job.services;
      }
      if (job.uses) {
        jobObject.uses = job.uses;
      }
      if (job.with) {
        jobObject.with = job.with;
      }
      if (job.secrets) {
        jobObject.secrets = job.secrets;
      }
      if (job.concurrency) {
        jobObject.concurrency = job.concurrency;
      }

      workflowObject.jobs[jobId] = jobObject;
    }

    return yaml.dump(workflowObject, { lineWidth: -1 });
  };

  async writeToFile() {
    const yamlContent = this.toYaml();
    const workflowsDir = path.join(process.cwd(), ".github", "workflows");
    const filePath = path.join(workflowsDir, this.filename);

    try {
      // Create the .github/workflows directory if it doesn't exist
      await fs.mkdir(workflowsDir, { recursive: true });

      // Add the autogenerated comment at the top of the YAML content
      const comment =
        "# This file is autogenerated. Do not modify manually.\n\n";
      const contentWithComment = comment + yamlContent;

      // Write the YAML content with the comment to the file
      await fs.writeFile(filePath, contentWithComment, "utf-8");
    } catch (error) {
      console.error(`Error writing workflow file: ${error.message}`);
      throw error;
    }
  }
}
