declare module "node:child_process/promises" {
  import type { ObjectEncodingOptions } from "node:child_process";

  interface ExecOutput {
    stdout: string;
    stderr: string;
  }

  interface ExecOptions {
    cwd?: string | URL | undefined;
    env?: NodeJS.ProcessEnv | undefined;
    encoding?: BufferEncoding | undefined;
    shell?: string | undefined;
    signal?: AbortSignal | undefined;
    maxBuffer?: number | undefined;
    killSignal?: NodeJS.Signals | number | undefined;
    timeout?: number | undefined;
    uid?: number | undefined;
    gid?: number | undefined;
    windowsHide?: boolean | undefined;
    stdio?: "pipe" | "ignore" | "inherit" | readonly StdioOption[] | undefined;
  }

  type StdioOption = "pipe" | "ignore" | "inherit" | number | undefined | null;

  export function exec(command: string): Promise<ExecOutput>;
  export function exec(
    command: string,
    options: ExecOptions | undefined | null
  ): Promise<ExecOutput>;
}
