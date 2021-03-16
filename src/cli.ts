#!/usr/bin/env node

import path from'path'
import sade from 'sade'
import sirv from 'sirv'
import polka from 'polka'
import chokidar from 'chokidar'

import build from './build'

// This file is broken at the moment.
// TODO: Write custom logger, communicating progress to the user via spinners
//       is pointless because everything is so fast anyways
//       Should have wait, sucess, info and a special error printer that
//       recognises special errors
//       Use printf-like formatting and native format for colored output
// TODO: Write a custom error class to be able to distinguish custom and "internal"
//       errors
// TODO: Fix development server

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

    // 'Building...'

    try {
        await build(input, output)

        // 'Built files to ' + output
    } catch (err) {
        // 'Failed building' 

        console.error(err)
    }
}

type DevelopmentBuild =
    ({}: { input: string, output: string, port: string }) => Promise<void>

const buildDevelopment: DevelopmentBuild = async ({ input, output, port }) => {
    process.env.NODE_ENV = 'development'

    const saneOutput = path.normalize(output)
    const watcher = chokidar.watch('.', {
        ignoreInitial: true,
        ignored: (path: string) => path.startsWith(saneOutput)
    })

    serverSpinner.start('Starting development server...')

    const actualPort = process.env.PORT || Number(port)

    polka().use(sirv(input, { dev: true })).listen(actualPort, (err: Error) => {
        if (err) {
            serverSpinner.fail(`Couldn't start development server`)

            console.error(err)
        } else {
            serverSpinner.succeed('Development server listening on '
                + 'http://localhost:' + actualPort)
        }
    })

    watcher.on('change', async () => {
        buildSpinner.start('Building...')

        try {
            await build(input, output)

            buildSpinner.succeed('Built changes')
        } catch (err) {
            buildSpinner.fail(`Couldn't build`)

            console.error(err)
        }
    })
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
