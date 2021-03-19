#!/usr/bin/env node

import path from'path'
import sade from 'sade'

import build from './lib/build'
import { logger, watch, serve } from './utils'

type ProductionBuild = ({}: { indir: string, outdir: string }) => Promise<void>

const buildProduction: ProductionBuild = async ({
    indir: input, outdir: output,
}) => {
    process.env.NODE_ENV = 'production'

    logger.wait('building...')

    try {
        await build(input, output)

        logger.done('built files to %o', output)
    } catch (err) {
        logger.error('failed building', err)
    }
}

type DevelopmentBuild =
    ({}: { indir: string, outdir: string, port: string }) => Promise<void>

const buildDevelopment: DevelopmentBuild = async ({
    indir: input, outdir: output, port,
}) => {
    process.env.NODE_ENV = 'development'

    try {
        const actualPort = Number(process.env.PORT || port)
        await serve(output, actualPort)

        logger.ready('dev server listening on http://localhost:%o', actualPort)
    } catch (err) {
        logger.error('failed starting dev server', err)

        return
    }

    watch('.', async () => {
        logger.wait('building...')

        try {
            await build(input, output)

            logger.done('built changes')
        } catch (err) {
            logger.error(`failed building`, err)
        }
    }, { ignore: [ 'node_modules', path.normalize(output) ] })
}

const dhow = sade('dhow')

dhow.version(require('../package.json').version)
    .option(
        '-i, --indir',
        'Sets the directory where files will be read from',
        'pages',
    )

dhow.command('build')
    .describe('Compiles your pages for deployment')
    .action(buildProduction)
    .option(
        '-o, --outdir',
        'Sets the directory where files will be built to',
        'out',
    )
    .example('build -i src/pages -o build')

dhow.command('dev')
    .describe('Rebuilds your pages on change and hosts them locally')
    .action(buildDevelopment)
    .option(
        '-o, --outdir',
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
