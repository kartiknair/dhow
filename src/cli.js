#!/usr/bin/env node

import { join } from 'path'
import fg from 'fast-glob'
import fse from 'fs-extra'
import esbuild from 'esbuild'
import document from 'min-document'
import postcss from 'postcss'
import cssnano from 'cssnano'
import autoprefixer from 'autoprefixer'
import chokidar from 'chokidar'
import ora from 'ora'
// import StaticServer from 'static-server'
import { createServer } from './server.js'

const {
    copySync,
    readFileSync,
    ensureFileSync,
    writeFileSync,
    removeSync,
    existsSync,
} = fse
const { startService } = esbuild

const onWatchMode =
    process.argv.includes('-w') || process.argv.includes('--watch')
const cwd = process.cwd()
const outDir = onWatchMode ? '__dhow__' : 'out'
const baseDir = join(cwd, outDir)
const srcDir = join(cwd, 'src')
let randomQuery = 0 // Used to invalidate dynamic import cache

// Async wrapper
async function build() {
    document.body.childNodes = []
    document.head.childNodes = []

    const spinner = ora('Building...').start()
    // Random enough for this purpose
    randomQuery = Math.floor(Math.random() * 10000000)

    // Start the esbuild child process once
    const service = await startService()
    const jsFiles = fg.sync('src/**/*.js')

    const services = jsFiles.map((file) => {
        ensureFileSync(join(baseDir, file))
        return service.transform(readFileSync(file), {
            loader: 'jsx',
            jsxFactory: 'Dhow.el',
            jsxFragment: 'Dhow.fragment',
        })
    })

    try {
        if (existsSync(join(srcDir, 'public')))
            copySync(join(srcDir, 'public'), baseDir)

        const cssFiles = fg.sync(`${outDir}/**/*.css`)
        const processor = postcss([autoprefixer, cssnano])

        for (let file of cssFiles) {
            const filePath = join(cwd, file)
            const result = await processor.process(readFileSync(filePath), {
                from: filePath,
            })
            writeFileSync(filePath, result.css)
        }

        const compiled = await Promise.all(services)
        compiled.forEach(async (file, index) => {
            const filePath = join(baseDir, jsFiles[index])
            writeFileSync(filePath, file.js)
        })

        let pages = fg.sync(`${outDir}/src/pages/**/*.js`)

        if (pages.includes(`${outDir}/src/pages/_document.js`)) {
            const customDocumentExports = await import(
                join(
                    'file:///',
                    baseDir,
                    `./src/pages/_document.js?randomQueryString=${randomQuery}`
                )
            )

            const htmlEl = customDocumentExports.default()

            const bodyEl = htmlEl.getElementsByTagName('body')[0]
            const headEl = htmlEl.getElementsByTagName('head')[0]

            Object.entries(htmlEl._attributes[null]).forEach(([key, value]) => {
                document
                    .getElementsByTagName('html')[0]
                    .setAttribute(key, value.value.toString())
            })

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
        }

        for (let page of pages) {
            const fileExports = await import(
                join(
                    'file:///',
                    cwd,
                    `./${page}?randomQueryString=${randomQuery}`
                )
            )

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

        spinner.succeed('Built successfully...')
    } catch (err) {
        spinner.fail(err)
        console.error(err)
        process.exit(1)
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

    watcher.on('change', build)
    watcher.on('add', build)
    watcher.on('ready', async () => {
        await build()
        const server = createServer()
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
