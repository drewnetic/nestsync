#!/usr/bin/env node

import chalk from 'chalk';
import * as chokidar from 'chokidar';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

import { analyzeProject } from '@nestsync/analyzer';
import {
  AxiosPlugin,
  emitTypeScriptSdk,
  FetchPlugin,
  ReactQueryPlugin,
} from '@nestsync/emitter-ts';

const program = new Command();

program
  .name('nest-sync')
  .description('Type-Safe TypeScript SDK Generator for NestJS (DTOs must be classes)')
  .version('1.0.0', '-v, --version', 'Output the current version')
  .requiredOption('-i, --input <path>', 'Path to the NestJS source folder (e.g., ./src)')
  .requiredOption(
    '-o, --output <path>',
    'Output file path for the generated SDK (e.g., ./client/sdk.gen.ts)',
  )
  .option('-c, --client <type>', 'HTTP client to generate (axios, fetch, or react-query)', 'axios')
  .option('-w, --watch', 'Watch for file changes and regenerate automatically', false);

program.parse(process.argv);
const options = program.opts();

function getPlugin(clientName: string) {
  switch (clientName.toLowerCase()) {
    case 'fetch':
      return FetchPlugin;
    case 'axios':
      return AxiosPlugin;
    case 'react-query':
      return ReactQueryPlugin;
    default:
      console.warn(
        chalk.yellow(`⚠️ Client '${clientName}' not recognized. Using 'axios' as default.`),
      );
      return AxiosPlugin;
  }
}

function generateSdk() {
  console.log(chalk.blue(`\n🔄 [${new Date().toLocaleTimeString()}] Starting SDK generation...`));

  try {
    const sourceGlob = path.join(process.cwd(), options.input, '**/*.controller.ts');
    const outputFile = path.join(process.cwd(), options.output);
    const plugin = getPlugin(options.client);

    const ir = analyzeProject(sourceGlob);

    const sdkCode = emitTypeScriptSdk(ir, plugin);

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, sdkCode);

    console.log(chalk.green(`✅ SDK generated successfully using [${plugin.name.toUpperCase()}]!`));
    console.log(chalk.gray(`📂 Saved at: ${outputFile}`));
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(chalk.red(`❌ Error during generation:`), error.message);
    } else {
      console.error(chalk.red(`❌ Unknown error during generation:`), error);
    }
  }
}

if (options.watch) {
  console.log(chalk.cyan(`👀 Starting NestSync in Watch Mode...`));

  generateSdk();

  // Transforma o input num caminho ABSOLUTO do seu sistema (C:\Users\...)
  const watchTarget = path.resolve(process.cwd(), options.input);

  const watcher = chokidar.watch(watchTarget, {
    ignored: /(^|[/\\])\../,
    persistent: true, // Isso obriga o Node a manter o terminal aberto
    ignoreInitial: true,
  });

  let timeout: NodeJS.Timeout;

  watcher.on('all', (event, filePath) => {
    if (!filePath.endsWith('.ts')) return;

    const normalizedFilePath = path.resolve(filePath).replace(/\\/g, '/');
    const normalizedOutputPath = path.resolve(process.cwd(), options.output).replace(/\\/g, '/');

    if (normalizedFilePath === normalizedOutputPath) return;

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      console.log(chalk.gray(`\n📝 File changed (${event}): ${path.basename(filePath)}`));
      generateSdk();
    }, 300);
  });
} else {
  generateSdk();
}
