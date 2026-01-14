/**
 * ABOUTME: Factory Droid agent plugin implementation.
 * Runs the droid CLI in non-interactive mode for Ralph task execution.
 */

import { BaseAgentPlugin } from '../base.js';
import type {
  AgentPluginMeta,
  AgentPluginFactory,
  AgentFileContext,
  AgentExecuteOptions,
} from '../types.js';
import { buildDroidCommandArgs } from './commandBuilder.js';
import { DROID_DEFAULT_COMMAND } from './config.js';
import { DroidAgentConfigSchema, type DroidReasoningEffort } from './schema.js';

export class DroidAgentPlugin extends BaseAgentPlugin {
  readonly meta: AgentPluginMeta = {
    id: 'droid',
    name: 'Factory Droid',
    description: 'Factory Droid AI coding assistant CLI',
    version: '1.0.0',
    author: 'Factory',
    defaultCommand: DROID_DEFAULT_COMMAND,
    supportsStreaming: true,
    supportsInterrupt: true,
    supportsFileContext: false,
    supportsSubagentTracing: true,
    structuredOutputFormat: 'jsonl',
  };

  private model?: string;
  private reasoningEffort?: DroidReasoningEffort;
  private skipPermissions = false;
  private enableTracing = true;

  override async initialize(config: Record<string, unknown>): Promise<void> {
    await super.initialize(config);

    const parsed = DroidAgentConfigSchema.safeParse({
      model: config.model,
      reasoningEffort: config.reasoningEffort,
      skipPermissions: config.skipPermissions,
      enableTracing: config.enableTracing,
    });

    if (!parsed.success) {
      return;
    }

    if (typeof parsed.data.model === 'string' && parsed.data.model.length > 0) {
      this.model = parsed.data.model;
    }

    if (parsed.data.reasoningEffort) {
      this.reasoningEffort = parsed.data.reasoningEffort;
    }

    this.skipPermissions = parsed.data.skipPermissions;
    if (this.skipPermissions) {
      console.warn('[droid] Skip permissions mode enabled; running with --skip-permissions-unsafe');
    }

    this.enableTracing = parsed.data.enableTracing;
    if (!this.enableTracing) {
      this.meta.supportsSubagentTracing = false;
    }
  }

  protected buildArgs(
    prompt: string,
    _files?: AgentFileContext[],
    options?: AgentExecuteOptions
  ): string[] {
    const cwd = options?.cwd ?? process.cwd();
    return buildDroidCommandArgs({
      prompt,
      cwd,
      model: this.model,
      reasoningEffort: this.reasoningEffort,
      skipPermissions: this.skipPermissions,
      enableTracing: this.enableTracing && options?.subagentTracing === true,
    });
  }
}

const createDroidAgent: AgentPluginFactory = () => new DroidAgentPlugin();

export default createDroidAgent;
