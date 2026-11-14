#!/usr/bin/env node

import { spawn } from 'node:child_process';

interface Check {
    readonly args: readonly string[];
    readonly command: string;
    readonly name: string;
}

const checks: readonly Check[] = [
    { args: ['run', 'fmt'], command: 'pnpm', name: 'format' },
    { args: ['run', 'lint'], command: 'pnpm', name: 'lint' },
    { args: ['run', 'typecheck'], command: 'pnpm', name: 'typecheck' },
    { args: ['run', 'test'], command: 'pnpm', name: 'test:unit' },
    { args: ['run', 'test:e2e'], command: 'pnpm', name: 'test:e2e' }
];

function runCheck({ name, command, args }: Check): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            env: process.env,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data: Buffer) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data: Buffer) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            if (code === 0) {
                console.log(`✓ ${name}`);
                resolve();
                return;
            }

            console.error(`\n✗ ${name} failed with exit code ${code}\n`);

            if (stdout.trim()) {
                console.error('stdout:');
                console.error(stdout);
            }

            if (stderr.trim()) {
                console.error('stderr:');
                console.error(stderr);
            }

            reject(new Error(`${name} failed`));
        });

        child.on('error', reject);
    });
}

try {
    for (const check of checks) {
        await runCheck(check);
    }

    console.log('\n✓ all checks passed');
} catch {
    process.exit(1);
}
