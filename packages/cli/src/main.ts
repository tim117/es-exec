#!/usr/bin/env node
import start, { ESExecOptions } from '@es-exec/api';
import { loadModule, logger, setEnv } from '@es-exec/utils';
import { resolve } from 'path';
import { inspect } from 'util';
import { CliResult, createEsRunOptions, run } from './cli.js';

async function main() {
  const cliResult = run();
  // We want to start by overriding the
  setEnv(cliResult.env ?? {});
  let configModule;
  if (cliResult.config) {
    configModule = await loadModule<ESExecOptions>(
      cliResult.config,
      cliResult.verbose,
    );
    if (cliResult.verbose) {
      if (configModule) {
        logger.info(`Found configuration module at ${cliResult.config}.`);
        console.log(inspect(configModule));
      } else {
        logger.warn(
          `No es-start configuration found at ${resolve(cliResult.config)}.` +
            'Check your config path.',
        );
      }
    }
  }
  // The cli result should override the values in the specified configuration
  // file.
  const options: CliResult & ESExecOptions = {
    ...cliResult,
    ...configModule,
    // TODO: Determine if the expected behavior would be to override or to only
    // use the values specified int the cli.
    //
    // Combine the environment variables from the sepcified configurations.
    env: { ...configModule?.env, ...cliResult.env } as NodeJS.ProcessEnv,
  };
  if (cliResult.verbose) {
    logger.info('The following options were found: ');
    console.log(inspect(options));
  }
  // Set process.env based on the combined env value.
  setEnv(options.env ?? {});
  await start(createEsRunOptions(options));
}
main().catch((error) => console.error(error));
