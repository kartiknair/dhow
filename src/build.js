const {
    join,
    resolve,
    posix: { join: posixJoin, normalize: posixNormalize },
    dirname,
} = require('path')
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

async function build(indir, outdir) {
    require('dotenv').config()

    const basedir = resolve(outdir)

    // Clear the require cache
    for (const file of Object.keys(require.cache)) {
        if (file.startsWith(basedir)) {
            delete require.cache[file]
        }
    }

    document.body.childNodes = []
    document.body.innerHTML = ''
    document.head.childNodes = []
    document.head.innerHTML = ''

    // Start the esbuild child process once
    const service = await startService()
    const jsFiles = fg.sync(posixJoin(indir, '/**/*.js'))

    const services = jsFiles.map((file) => {
        ensureFileSync(join(basedir, file))

        return service.build({
            entryPoints: [file],
            outfile: join(basedir, file),
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
        if (existsSync(resolve('public'))) copySync(resolve('public'), basedir)

        const cssFiles = fg.sync(posixJoin(outdir, '/**/*.css'))

        let postcssPlugins = null

        if (existsSync(resolve('postcss.config.js'))) {
            const postcssConfig = require(resolve('postcss.config.js'))
            postcssPlugins = postcssConfig.plugins
        }

        if (postcssPlugins && postcssPlugins !== null) {
            const cssProcessor = postcss(postcssPlugins)

            for (let file of cssFiles) {
                const filePath = resolve(file)
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

        let pages = fg.sync(posixJoin(outdir, indir, '/**/*.js'))

        if (pages.includes(posixJoin(outdir, indir, '/_document.js'))) {
            const customDocument = require(join(
                basedir,
                indir,
                '_document.js'
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
                (page) => page !== posixJoin(outdir, indir, '_document.js')
            )
        } else {
            const containerDiv = document.createElement('div')
            containerDiv.className += 'dhow'
            document.body.appendChild(containerDiv)
        }

        for (let page of pages) {
            const fileExports = require(resolve(page))

            const filePath = posixNormalize(page)
                .split('/')
                .slice(1 + posixNormalize(indir).split('/').length)
                .join('/')
                .slice(0, -3)

            if (typeof fileExports.default === 'function') {
                if (typeof fileExports.getPaths === 'function') {
                    const paths = await fileExports.getPaths()

                    for (let path of paths) {
                        const props = fileExports.getProps
                            ? await fileExports.getProps(path)
                            : {}

                        writePageDOM(
                            fileExports.default(props),
                            fileExports.Head ? fileExports.Head(props) : [],
                            join(basedir, dirname(filePath), path, 'index.html')
                        )
                    }
                } else {
                    const props = fileExports.getProps
                        ? await fileExports.getProps()
                        : {}

                    writePageDOM(
                        fileExports.default(props),
                        fileExports.Head ? fileExports.Head(props) : [],
                        join(
                            basedir,
                            filePath.endsWith('index') ? '' : filePath,
                            'index.html'
                        )
                    )
                }
            } else
                throw `Default export from a file in ${indir} must be a funtion`
        }
    } finally {
        removeSync(join(basedir, indir))

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

module.exports = build
