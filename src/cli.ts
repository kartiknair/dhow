#!/usr/bin/env node

import path from'path'
import sade from 'sade'
import { WebSocketServer } from 'ws'

import build from './lib/build'
import { head } from './lib/head'
import { VNode } from './lib/jsx-runtime'
import { logger, watch, serve } from './utils'

type ProductionBuild = ({}: { indir: string, outdir: string }) => Promise<void>

const buildProduction: ProductionBuild = async ({
    indir: input, outdir: output,
}) => {
    process.env.NODE_ENV = 'production'

    logger.wait('building')

    try {
        await build(input, output)

        logger.done('built files to %o', output)
    } catch (err) {
        logger.error('failed building', err)
    }
}

type DevelopmentBuild = (
    {}: {
        indir: string, outdir: string, port: string, 'disable-cache': boolean,
    }
) => Promise<void>

const buildDevelopment: DevelopmentBuild = async ({
    indir: input, outdir: output, port, 'disable-cache': disableCache
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

    const wss = new WebSocketServer({ port: 29231 })

    watch('.', async (changeType: string, changePath: string) => {
        const allowedTypes = [ 'ready', 'add', 'change', 'unlink' ]
        if (!allowedTypes.includes(changeType)) {
            return
        }

        logger.wait('building')

        head.static = [
            new VNode('script', [], [`
                const socket = new WebSocket('ws://localhost:29231')

                socket.addEventListener('message', (event) => {
                    if (event.data === 'reload') {
                        window.location.reload()
                    }
                })
            `])
        ]

        try {
            // Pretend that it's always the first build if caching is disabled
            const initial = changeType === 'ready' || disableCache

            await build(input, output, {
                initial,
                changes: initial ? [] : [{
                    type: changeType, path: path.resolve(changePath)
                }],
            })

            logger.done('built changes')
        } catch (err) {            
            logger.error(`failed building`, err)
        }

        for (const client of wss.clients) {
            client.send('reload')
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
    .option(
        '--disable-cache',
        'Disables caching of built files.',
    )
    .example('dev -p 3001')
    .example('dev -i src/pages -o build')

dhow.parse(process.argv)
