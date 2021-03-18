#!/usr/bin/env node

import path from'path'
import sade from 'sade'
import sirv from 'sirv'
import polka from 'polka'
import chokidar from 'chokidar'

import build from './lib/build'
import { logger } from './utils'

const dhow = sade('dhow')

dhow.version(require('../package.json').version)
    .option(
        '-i, --input',
        'Sets the directory where files will be read from',
        'pages',
    )

type ProductionBuild = ({}: { input: string, output: string }) => Promise<void>

const buildProduction: ProductionBuild = async ({ input, output }) => {
    process.env.NODE_ENV = 'production'

    logger.wait('building...')

    try {
        await build(input, output)

        logger.done('built files to %o', output)
    } catch (err) {
        logger.error('failed building', err)
    }
}

const startDevServer = async (port: number, directory: string) => {
    const serveStatic = sirv(directory, { dev: true })

    try {
        await polka().use(serveStatic).listen(port)

        logger.ready('server listening on http://localhost:%o', port)
    } catch (err) {
        logger.error(`couldn't start development server`, err)
    }
}

type DevelopmentBuild =
    ({}: { input: string, output: string, port: string }) => Promise<void>

const buildDevelopment: DevelopmentBuild = async ({ input, output, port }) => {
    process.env.NODE_ENV = 'development'

    const actualPort = Number(process.env.PORT || port)

    await startDevServer(actualPort, output)

    const saneOutput = path.normalize(output)
    const watcher = chokidar.watch('.', {
        ignoreInitial: true,
        ignored: (path: string) => path.startsWith(saneOutput)
            || path.startsWith('node_modules')
    })

    const tryBuild = async () => {
        logger.wait('building...')

        try {
            await build(input, output)

            logger.done('built changes')
        } catch (err) {
            logger.error(`failed building`, err)
        }
    }

    watcher.on('all', tryBuild)
    watcher.on('ready', tryBuild)
}

dhow.command('build')
    .describe('Compiles your pages for deployment')
    .action(buildProduction)
    .option(
        '-o, --output',
        'Sets the directory where files will be built to',
        'out',
    )
    .example('build -i src/pages -o build')

dhow.command('dev')
    .describe('Rebuilds your pages on change and hosts them locally')
    .action(buildDevelopment)
    .option(
        '-o, --output',
        'Sets the directory where files will be built to',
        '.dhow',
    )
    .option(
        '-p, --port',
        'Sets the port where your files will be served on, this may be overridden '
            + 'with the environment variable PORT',
        '3000',
    )
    .example('dev -p 3001')
    .example('dev -i src/pages -o build')

dhow.parse(process.argv)
