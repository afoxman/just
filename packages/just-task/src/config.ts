import * as fs from 'fs';
import * as path from 'path';

import { argv } from './option';
import { resolve } from './resolve';
import { mark, logger } from 'just-task-logger';
import { enableTypeScript } from './enableTypeScript';
import yargsParser = require('yargs-parser');

export function resolveConfigFile(args: yargsParser.Arguments): string | null {

  for (const entry of [args.config, './just.config.js', './just-task.js', './just.config.ts', args.defaultConfig]) {
    const configFile = resolve(entry);
    if (configFile) {
      return configFile;
    }
  }

  return null;
}

export function readConfig(): void {
  // uses a separate instance of yargs to first parse the config (without the --help in the way) so we can parse the configFile first regardless
  const configFile = resolveConfigFile(argv());

  mark('registry:configModule');

  if (configFile && fs.existsSync(configFile)) {
    const ext = path.extname(configFile);
    if (ext === '.ts' || ext === '.tsx') {
      // TODO: add option to do typechecking as well
      enableTypeScript({ transpileOnly: true });
    }

    try {
      const configModule = require(configFile);
      if (typeof configModule === 'function') {
        configModule();
      }
    } catch (e) {
      logger.error(`Invalid configuration file: ${configFile}`);
      logger.error(`Error: ${e.stack || e.message || e}`);
      process.exit(1);
    }
  } else {
    logger.error(
      `Cannot find config file "${configFile}".`,
      `Please create a file called "just.config.js" in the root of the project next to "package.json".`,
    );
  }

  logger.perf('registry:configModule');
}
