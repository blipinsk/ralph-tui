/**
 * ABOUTME: Tests for the PermissionDenialDetector.
 * Tests permission denial detection patterns for Claude Code agent output.
 */

import { describe, test, expect } from 'bun:test';
import { PermissionDenialDetector } from '../../src/engine/permission-denial-detector.js';

describe('PermissionDenialDetector', () => {
  const detector = new PermissionDenialDetector();

  describe('detect', () => {
    describe('Claude permission request patterns', () => {
      test('detects Claude wants to run command', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Claude wants to run: git commit -m "test"',
        });

        // then
        expect(result.isBlocked).toBe(true);
        expect(result.operation).toBe('bash command');
        expect(result.blockedCommand).toBe('git commit -m "test"');
      });

      test('detects Claude wants to execute command', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Claude wants to execute: npm install lodash',
        });

        // then
        expect(result.isBlocked).toBe(true);
        expect(result.operation).toBe('bash command');
        expect(result.blockedCommand).toBe('npm install lodash');
      });

      test('detects Claude wants to write file', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Claude wants to write to: /path/to/file.ts',
        });

        // then
        expect(result.isBlocked).toBe(true);
        expect(result.operation).toBe('file modification');
        expect(result.blockedCommand).toBe('/path/to/file.ts');
      });

      test('detects Claude wants to create file', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Claude wants to create: /path/to/new-file.ts',
        });

        // then
        expect(result.isBlocked).toBe(true);
        expect(result.operation).toBe('file modification');
      });

      test('detects Claude wants to modify file', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Claude wants to modify: /path/to/existing.ts',
        });

        // then
        expect(result.isBlocked).toBe(true);
        expect(result.operation).toBe('file modification');
      });

      test('detects Claude wants to edit file', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Claude wants to edit: /path/to/file.ts',
        });

        // then
        expect(result.isBlocked).toBe(true);
        expect(result.operation).toBe('file edit');
        expect(result.blockedCommand).toBe('/path/to/file.ts');
      });
    });

    describe('generic permission patterns', () => {
      test('detects waiting for permission', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'waiting for permission before executing',
        });

        // then
        expect(result.isBlocked).toBe(true);
        expect(result.operation).toBe('operation');
      });

      test('detects waiting for user permission', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'waiting for user permission',
        });

        // then
        expect(result.isBlocked).toBe(true);
      });

      test('detects waiting for approval', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'waiting for approval from user',
        });

        // then
        expect(result.isBlocked).toBe(true);
      });

      test('detects requires user confirmation', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'This operation requires user confirmation',
        });

        // then
        expect(result.isBlocked).toBe(true);
        expect(result.operation).toBe('user confirmation');
      });

      test('detects requires input', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'This action requires input from the user',
        });

        // then
        expect(result.isBlocked).toBe(true);
      });
    });

    describe('interactive prompt patterns', () => {
      test('detects press Y to continue', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Press [Y] to continue or [N] to cancel',
        });

        // then
        expect(result.isBlocked).toBe(true);
        expect(result.operation).toBe('interactive prompt');
      });

      test('detects type enter to proceed', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Type enter to proceed',
        });

        // then
        expect(result.isBlocked).toBe(true);
        expect(result.operation).toBe('interactive prompt');
      });

      test('detects press y to confirm', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'press y to confirm',
        });

        // then
        expect(result.isBlocked).toBe(true);
      });
    });

    describe('JSONL permission type detection', () => {
      test('detects permission type in JSONL', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: '{"type": "permission", "action": "write"}',
        });

        // then
        expect(result.isBlocked).toBe(true);
        expect(result.operation).toBe('permission request');
      });
    });

    describe('agent filtering', () => {
      test('ignores non-Claude agents', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Claude wants to run: git push',
          agentId: 'opencode',
        });

        // then
        expect(result.isBlocked).toBe(false);
      });

      test('detects for Claude agent explicitly', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Claude wants to run: git push',
          agentId: 'claude',
        });

        // then
        expect(result.isBlocked).toBe(true);
      });

      test('detects when agentId is not specified', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Claude wants to run: git push',
        });

        // then
        expect(result.isBlocked).toBe(true);
      });

      test('recognizes claude-code as Claude agent (case-insensitive)', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Claude wants to run: git push',
          agentId: 'claude-code',
        });

        // then
        expect(result.isBlocked).toBe(true);
      });

      test('recognizes Claude-3 as Claude agent (case-insensitive)', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Claude wants to run: git push',
          agentId: 'Claude-3',
        });

        // then
        expect(result.isBlocked).toBe(true);
      });

      test('recognizes CLAUDE_AGENT as Claude agent (case-insensitive)', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Claude wants to run: git push',
          agentId: 'CLAUDE_AGENT',
        });

        // then
        expect(result.isBlocked).toBe(true);
      });

      test('recognizes my-claude-bot as Claude agent', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Claude wants to run: git push',
          agentId: 'my-claude-bot',
        });

        // then
        expect(result.isBlocked).toBe(true);
      });
    });

    describe('false positive prevention', () => {
      test('does not trigger for normal output', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Running tests... All tests passed.',
        });

        // then
        expect(result.isBlocked).toBe(false);
      });

      test('does not trigger for code containing permission words', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'function checkPermission() { return true; }',
        });

        // then
        expect(result.isBlocked).toBe(false);
      });

      test('does not trigger for empty output', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: '',
        });

        // then
        expect(result.isBlocked).toBe(false);
      });

      test('does not trigger for normal git output', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'git status: On branch main, nothing to commit',
        });

        // then
        expect(result.isBlocked).toBe(false);
      });

      test('does not trigger for past-tense "was waiting for permission"', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'The agent was waiting for permission earlier',
        });

        // then
        expect(result.isBlocked).toBe(false);
      });

      test('does not trigger for past-tense "were waiting for permission"', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'The processes were waiting for permission to proceed',
        });

        // then
        expect(result.isBlocked).toBe(false);
      });

      test('does not trigger for past-tense "had been waiting for approval"', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'It had been waiting for approval before timing out',
        });

        // then
        expect(result.isBlocked).toBe(false);
      });

      test('does not trigger for past-tense "was waiting for input"', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'The process was waiting for input when it crashed',
        });

        // then
        expect(result.isBlocked).toBe(false);
      });

      test('does not trigger for mid-sentence Claude mentions', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'I noticed that Claude wants to run commands often',
        });

        // then
        expect(result.isBlocked).toBe(false);
      });

      test('does not trigger for quoted text about Claude wanting to run', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'The user said "Claude wants to run" but that was just an example',
        });

        // then
        expect(result.isBlocked).toBe(false);
      });
    });

    describe('blocked indicator patterns', () => {
      test('detects waiting for input', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Process is waiting for input',
        });

        // then
        expect(result.isBlocked).toBe(true);
        expect(result.operation).toBe('blocked operation');
      });

      test('detects awaiting response', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'awaiting response from user',
        });

        // then
        expect(result.isBlocked).toBe(true);
      });

      test('detects paused for confirmation', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Execution paused for confirmation',
        });

        // then
        expect(result.isBlocked).toBe(true);
      });
    });

    describe('message extraction', () => {
      test('extracts message around matched pattern at line start', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Some prefix.\nClaude wants to run: git commit -m "test"\nSome suffix.',
        });

        // then
        expect(result.isBlocked).toBe(true);
        expect(result.message).toContain('Claude wants to run');
      });

      test('truncates very long messages', () => {
        // given - Claude wants to run must be at start of line for detection
        const longOutput = 'A'.repeat(100) + '\nClaude wants to run: git push ' + 'B'.repeat(200);

        // when
        const result = detector.detect({
          stdout: longOutput,
        });

        // then
        expect(result.isBlocked).toBe(true);
        expect(result.message!.length).toBeLessThanOrEqual(153); // 150 + "..."
      });

      test('provides default message for fallback patterns', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'waiting for input',
        });

        // then
        expect(result.isBlocked).toBe(true);
        expect(result.message).toBeDefined();
      });
    });

    describe('command extraction', () => {
      test('extracts command from run pattern', () => {
        // given -> no additional preconditions

        // when
        const result = detector.detect({
          stdout: 'Claude wants to run: npm run test --coverage',
        });

        // then
        expect(result.blockedCommand).toBe('npm run test --coverage');
      });

      test('truncates very long commands with ellipsis within 100-char limit', () => {
        // given
        const longCommand = 'a'.repeat(150);

        // when
        const result = detector.detect({
          stdout: `Claude wants to run: ${longCommand}`,
        });

        // then
        // Ellipsis is part of the 100-char limit, not appended after
        expect(result.blockedCommand!.length).toBe(100);
        expect(result.blockedCommand!.endsWith('...')).toBe(true);
      });

      test('provides full command for accessibility when truncated', () => {
        // given
        const longCommand = 'a'.repeat(150);

        // when
        const result = detector.detect({
          stdout: `Claude wants to run: ${longCommand}`,
        });

        // then
        expect(result.fullBlockedCommand).toBe(longCommand);
        expect(result.fullBlockedCommand!.length).toBe(150);
      });

      test('truncated and full commands match when under limit', () => {
        // given
        const shortCommand = 'npm run test';

        // when
        const result = detector.detect({
          stdout: `Claude wants to run: ${shortCommand}`,
        });

        // then
        expect(result.blockedCommand).toBe(shortCommand);
        expect(result.fullBlockedCommand).toBe(shortCommand);
      });
    });
  });
});
