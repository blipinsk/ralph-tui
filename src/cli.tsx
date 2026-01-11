#!/usr/bin/env node
/**
 * ABOUTME: CLI entry point for the Ralph TUI application.
 * Initializes the OpenTUI renderer and renders the main App component.
 */

import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import { App } from './tui/index.js';

/**
 * Main entry point
 */
async function main(): Promise<void> {
  // Create the OpenTUI CLI renderer
  const renderer = await createCliRenderer({
    // Exit on Ctrl+C (we also handle 'q' and Escape in the App)
    exitOnCtrlC: true,
  });

  // Create the React root and render the App
  const root = createRoot(renderer);
  root.render(<App />);
}

// Run the main function
main().catch((error: unknown) => {
  console.error('Failed to start Ralph TUI:', error);
  process.exit(1);
});
