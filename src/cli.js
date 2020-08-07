#!/usr/bin/env node

const { join } = require('path')
const fg = require('fast-glob')
const {
    copySync,
    readFileSync,
    ensureFileSync,
    writeFileSync,
    removeSync,
    existsSync,
} = require('fs-extra')
const { startService } = require('esbuild')
const document = require('min-document')
const postcss = require('postcss')
const chokidar = require('chokidar')
const ora = require('ora')
const sirv = require('sirv')
const polka = require('polka')
const chalk = require('chalk')

const onWatchMode =
    process.argv.includes('-w') || process.argv.includes('--watch')
const cwd = process.cwd()
const outDir = onWatchMode ? '__dhow__' : 'out'
const baseDir = join(cwd, outDir)
const srcDir = join(cwd, 'src')

// Async wrapper
async function build() {
    // Clear the require cache
    for (const file of Object.keys(require.cache)) {
        if (file.startsWith(baseDir)) {
            delete require.cache[file]
        }
    }

    document.body.childNodes = []
    document.head.childNodes = []

    // Start the esbuild child process once
    const service = await startService()
    const jsFiles = fg.sync('src/pages/**/*.js')

    const services = jsFiles.map((file) => {
        ensureFileSync(join(baseDir, file))

        return service.build({
            entryPoints: [file],
            outfile: join(baseDir, file),
            bundle: true,
            platform: 'node',
            format: 'cjs',
            loader: {
                '.js': 'jsx',
            },
            jsxFactory: 'Dhow.el',
            jsxFragment: 'Dhow.fragment',
        })
    })

    try {
        if (existsSync(join(srcDir, 'public')))
            copySync(join(srcDir, 'public'), baseDir)

        const cssFiles = fg.sync(`${outDir}/**/*.css`)

        let postcssPlugins = []

        if (existsSync(join(cwd, 'postcss.config.js'))) {
            const postcssConfig = require(join(cwd, 'postcss.config.js'))
            postcssPlugins = postcssConfig.plugins
        }

        if (!postcssPlugins === []) {
            const cssProcessor = postcss(postcssPlugins)

            for (let file of cssFiles) {
                const filePath = join(cwd, file)
                const result = await cssProcessor.process(
                    readFileSync(filePath),
                    {
                        from: filePath,
                    }
                )
                writeFileSync(filePath, result.css)
            }
        }

        await Promise.all(services)

        let pages = fg.sync(`${outDir}/src/pages/**/*.js`)

        if (pages.includes(`${outDir}/src/pages/_document.js`)) {
            const customDocument = require(join(
                baseDir,
                './src/pages/_document.js'
            )).default()

            const bodyEl = customDocument.getElementsByTagName('body')[0]
            const headEl = customDocument.getElementsByTagName('head')[0]

            Object.entries(customDocument._attributes[null]).forEach(
                ([key, value]) => {
                    document
                        .getElementsByTagName('html')[0]
                        .setAttribute(key, value.value.toString())
                }
            )

            // Have to use Array.from for `min-document` specific reasons
            Array.from(bodyEl.childNodes).forEach((childNode) => {
                document.getElementsByTagName('body')[0].appendChild(childNode)
            })

            Array.from(headEl.childNodes).forEach((childNode) => {
                document.getElementsByTagName('head')[0].appendChild(childNode)
            })

            pages = pages.filter(
                (page) => page !== `${outDir}/src/pages/_document.js`
            )
        } else {
            const containerDiv = document.createElement('div')
            containerDiv.className += 'dhow'
            document.body.appendChild(containerDiv)
        }

        for (let page of pages) {
            const fileExports = require(join(cwd, `./${page}`))

            let filePath = page.split('/').slice(3).join('/')
            filePath = filePath.slice(0, filePath.length - 3)

            if (typeof fileExports.default === 'function') {
                if (typeof fileExports.getPaths === 'function') {
                    filePath = join(
                        baseDir,
                        filePath.split('/').slice(0, -1).join('/')
                    )

                    const paths = await fileExports.getPaths()

                    for (let path of paths) {
                        const props = fileExports.getProps
                            ? await fileExports.getProps(path)
                            : {}

                        writePageDOM(
                            fileExports.default(props),
                            fileExports.Head ? fileExports.Head(props) : [],
                            join(filePath, `${path}/index.html`)
                        )
                    }
                } else {
                    if (filePath.endsWith('index')) filePath = ''
                    filePath = join(baseDir, `${filePath}/index.html`)

                    const props = fileExports.getProps
                        ? await fileExports.getProps()
                        : {}

                    writePageDOM(
                        fileExports.default(props),
                        fileExports.Head ? fileExports.Head(props) : [],
                        filePath
                    )
                }
            } else
                throw 'Default export from a file in src/pages must be a funtion'
        }
    } finally {
        removeSync(join(baseDir, 'src'))
        // The child process can be explicitly killed when it's no longer needed
        service.stop()
    }
}

function writePageDOM(pageDOM, pageHead, path) {
    const rootEl = document.getElementsByClassName('dhow')[0]
    const headEl = document.getElementsByTagName('head')[0]

    rootEl.appendChild(pageDOM)

    for (let node of pageHead) {
        headEl.appendChild(node)
    }

    ensureFileSync(path)
    writeFileSync(path, `<!DOCTYPE html>` + document.documentElement.toString())

    rootEl.removeChild(pageDOM)
    for (let node of pageHead) {
        headEl.removeChild(node)
    }
}

// The actual CLI
if (onWatchMode) {
    console.log('On watch mode')

    const watcher = chokidar.watch('./src', {
        ignoreInitial: true,
    })

    const spinner = ora('Building...')

    const buildWithSpinner = async () => {
        spinner.start()

        try {
            await build()
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

        const assets = sirv(baseDir, {
            dev: true,
        })

        polka()
            .use(assets)
            .listen(3000, (err) => {
                if (err) throw err
                console.log(
                    `Dev server is live on: ${chalk.cyan(
                        'https://localhost:3000'
                    )}\n`
                )
            })
    })

    function exitHandler() {
        watcher.close()
        removeSync(baseDir)
        process.exit(0)
    }

    process.on('exit', exitHandler)
    process.on('SIGINT', exitHandler)
    process.on('SIGUSR1', exitHandler)
    process.on('SIGUSR2', exitHandler)
    process.on('uncaughtException', exitHandler)
} else {
    console.log('Building production build')
    build()
}
