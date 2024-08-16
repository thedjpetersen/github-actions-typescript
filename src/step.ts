interface RunStepInterface {
  id?: string;
  if?: string;
  name?: string;
  run: string;
  "working-directory"?: string;
  shell?: "bash" | "pwsh" | "python" | "sh" | "cmd" | "powershell";
  env?: {
    [key: string]: string;
  };
  "continue-on-error"?: boolean;
  "timeout-minutes"?: number;
}

interface UsesStepInterface {
  if?: string;
  name?: string;
  uses: string;
  with?: {
    [key: string]: any;
    args?: string;
    entrypoint?: string;
  };
  env?: {
    [key: string]: string | number | boolean;
  };
  "continue-on-error"?: boolean;
  "timeout-minutes"?: number;
}

abstract class BaseStep {
  if?: string;
  name?: string;
  env?: {
    [key: string]: string;
  };
  "continue-on-error"?: boolean;
  "timeout-minutes"?: number;

  constructor(config: Partial<BaseStep>) {
    Object.assign(this, config);
  }
}

export class RunStep extends BaseStep implements RunStepInterface {
  run: string;
  "working-directory"?: string;
  shell?: "bash" | "pwsh" | "python" | "sh" | "cmd" | "powershell";

  constructor(config: RunStepInterface) {
    super(config);
    this.run = config.run;
    this["working-directory"] = config["working-directory"];
    this.shell = config.shell;
    this.validate();
  }

  validate() {
    if (!this.run) {
      throw new Error("The 'run' property must have a value.");
    }
    if (
      this.shell &&
      !["bash", "pwsh", "python", "sh", "cmd", "powershell"].includes(
        this.shell
      )
    ) {
      throw new Error(
        `Invalid shell specified: ${this.shell}. Allowed values are: 'bash', 'pwsh', 'python', 'sh', 'cmd', 'powershell'.`
      );
    }
  }
}

export class UsesStep extends BaseStep implements UsesStepInterface {
  uses: string;
  with?: {
    [key: string]: any;
    args?: string;
    entrypoint?: string;
  };

  constructor(config: UsesStepInterface) {
    super(config);
    this.uses = config.uses;
    this.with = config.with;
    this.validate();
  }

  validate() {
    if (!this.uses) {
      throw new Error("The 'uses' property must have a value.");
    }
  }
}
