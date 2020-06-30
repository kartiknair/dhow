#!/usr/bin/env node

const {
    readFileSync,
    mkdirSync,
    writeFileSync,
    copySync,
    existsSync,
    removeSync,
    ensureFileSync,
} = require('fs-extra')
const { join } = require('path')
const fg = require('fast-glob')
const babel = require('@babel/core')
const { Document } = require('nodom')
const chokidar = require('chokidar')
const postcss = require('postcss')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')

const BASE_DIRECTORY =
    process.argv.includes('-w') || process.argv.includes('--watch')
        ? '__dhow__'
        : 'build'

const workingDirectory = join(process.cwd(), BASE_DIRECTORY)

const build = function () {
    const document = new Document()

    if (existsSync(workingDirectory)) removeSync(workingDirectory)
    mkdirSync(workingDirectory)

    if (existsSync(join(process.cwd(), 'src/public'))) {
        copySync(join(process.cwd(), 'src/public'), workingDirectory)
    }

    /* Minify & prefix all CSS files */
    const processor = postcss([autoprefixer, cssnano])
    const styleFiles = fg.sync(`${workingDirectory}/**/*.css`)

    for (let file of styleFiles) {
        processor
            .process(join(process.cwd(), readFileSync(file)))
            .then((result) => {
                writeFileSync(join(process.cwd(), file), result.css)
            })
    }

    copySync(join(process.cwd(), 'src'), join(workingDirectory, 'src'))

    const pages = fg.sync([`${BASE_DIRECTORY}/src/pages/**/*.js`], {
        dot: true,
    })

    for (let page of pages) {
        const currentContent = readFileSync(join(process.cwd(), page), 'utf-8')
        const compiledContent = babel.transform(currentContent, {
            plugins: [
                [
                    '@babel/plugin-transform-react-jsx',
                    {
                        runtime: 'automatic',
                        importSource: 'dhow',
                    },
                ],
                '@babel/plugin-transform-modules-commonjs',
            ],
        })

        writeFileSync(join(process.cwd(), page), compiledContent.code)
    }

    if (existsSync(join(workingDirectory, 'src/pages/_document.js'))) {
        const documentExports = require(join(
            workingDirectory,
            'src/pages/_document.js'
        ))
        const htmlEl = documentExports.default()

        htmlEl.querySelector('head').childNodes.forEach((node) => {
            document.head.appendChild(node)
        })

        Object.entries(htmlEl.attributes).forEach(([key, val]) => {
            document.querySelector('html').setAttribute(key, val.toString())
        })

        pages.splice(
            pages.indexOf(`${BASE_DIRECTORY}/src/pages/_document.js`),
            1
        )
    }

    for (let page of pages) {
        const moduleExports = require(join(process.cwd(), page))

        if (moduleExports.paths && moduleExports.getProps) {
            moduleExports.paths.forEach((path) => {
                const props = moduleExports.getProps(path)

                let pathForFile = page.split('/').slice(3).join('/')
                pathForFile = join(pathForFile, '../') + path + '.html'

                writePageDOM(
                    document,
                    moduleExports.default(props),
                    moduleExports.Head(props),
                    join(process.cwd(), BASE_DIRECTORY, pathForFile)
                )
            })
        } else {
            let pathForFile = page.split('/').slice(3).join('/')
            pathForFile =
                pathForFile.substring(0, pathForFile.length - 3) + '.html'

            const props = moduleExports.getProps ? moduleExports.getProps() : {}

            writePageDOM(
                document,
                moduleExports.default(props),
                moduleExports.Head(props),
                join(process.cwd(), BASE_DIRECTORY, pathForFile)
            )
        }
    }

    removeSync(join(process.cwd(), `${BASE_DIRECTORY}/src`))
}

function writePageDOM(document, pageDOM, pageHead, path) {
    const headEl = document.querySelector('head')
    console.log('Wrote to: ', path)

    document.querySelector('body').appendChild(pageDOM)

    for (let node of pageHead) {
        headEl.appendChild(node)
    }

    ensureFileSync(path)
    writeFileSync(path, document.documentElement.outerHTML)

    document.querySelector('body').removeChild(pageDOM)
    for (let node of pageHead) {
        headEl.removeChild(node)
    }
}

if (process.argv.includes('-w') || process.argv.includes('--watch')) {
    console.log('On watch mode')
    require('live-server').start({
        port: 3000,
        host: '0.0.0.0',
        root: '__dhow__',
        open: true,
    })

    chokidar.watch('src/**/*').on('all', () => {
        console.log('rebuilding...')
        for (const path in require.cache) {
            if (path.endsWith('.js')) {
                delete require.cache[path]
            }
        }
        build()
        console.log('done rebuilding!')
    })

    process.stdin.resume()

    function exitHandler() {
        removeSync(join(process.cwd(), '__dhow__'))
        process.exit()
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
