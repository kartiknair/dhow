#!/usr/bin/env node

const { resolve } = require('path')
const chokidar = require('chokidar')
const ora = require('ora')
const sirv = require('sirv')
const polka = require('polka')
const chalk = require('chalk')
const sade = require('sade')
const build = require('./build')

const cli = sade('dhow')

cli.version('2.0.0').option(
    '-i, --indir',
    'Change input directory for your files. (defaults to `./pages`)'
)

cli.command('dev')
    .describe('Start the dev server, & rebuilds static files on file change')
    .action(dhowDev)
    .option(
        '-d, --devdir',
        'Change directory where your temporary development builds are stored. (defaults to `./__dhow__`)'
    )
    .option(
        '-p, --port',
        'Change port for `dev server`. (defaults to process.env.PORT or `3000`)'
    )

cli.command('build')
    .describe('Build production ready static files')
    .action(dhowProd)
    .option(
        '-o, --outdir',
        'Change output directory of your `build` command. (defaults to `./out`)'
    )

cli.parse(process.argv)

function dhowDev({ indir = 'pages', devdir = '__dhow__', port = 3000 }) {
    process.env.NODE_ENV = 'development'

    const watcher = chokidar.watch('.', {
        ignoreInitial: true,
        ignored: (path) => path.startsWith(devdir),
    })

    const spinner = ora('Building...')

    const buildWithSpinner = async () => {
        spinner.start()

        try {
            await build(indir, devdir)
            spinner.succeed('Built successfully...')
        } catch (err) {
            spinner.fail(err)
            console.error(err)
        }
    }

    watcher.on('change', async () => await buildWithSpinner())
    watcher.on('add', async () => await buildWithSpinner())
    watcher.on('ready', async () => {
        await buildWithSpinner()

        const assets = sirv(resolve(devdir), {
            dev: true,
        })

        polka()
            .use(assets)
            .listen(process.env.PORT || port, (err) => {
                if (err) throw err
                console.log(
                    `Dev server is live on: ${chalk.cyan(
                        `https://localhost:${process.env.PORT || port}`
                    )}\n`
                )
            })
    })

    function exitHandler() {
        watcher.close()
        process.exit(0)
    }

    process.on('exit', exitHandler)
    process.on('SIGINT', exitHandler)
    process.on('SIGUSR1', exitHandler)
    process.on('SIGUSR2', exitHandler)
    process.on('uncaughtException', exitHandler)
}

function dhowProd({ indir = 'pages', outdir = 'out' }) {
    removeSync(outdir)

    process.env.NODE_ENV = 'production'

    console.log('Building production build')

    build(indir, outdir)
}
