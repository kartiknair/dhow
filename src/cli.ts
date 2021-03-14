#!/usr/bin/env node

import sade from 'sade'

import build from './build'

const dhow = sade('dhow')

// Weird naming because `ìn` is reserved
const buildProduction = async ({ from = 'src', out = 'out' }) => {
    process.env.NODE_ENV = 'production'

    console.log('Building...')

    try {
        await build(from, out)

        console.log('Built files to ' + out)
    } catch (err) {
        console.error(err)
    }
}

dhow.command('build')
    .describe('Build static files')
    .action(buildProduction)
    .option(
        '-o, --out',
        'Change output directory of your `build` command. (defaults to `./out`)'
    )

dhow.parse(process.argv)
