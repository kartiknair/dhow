import path from 'path'
import glob from 'fast-glob'
import * as fse from 'fs-extra'
import * as esbuild from 'esbuild'

import { head } from './head'
import { createElement, Component, Props } from './jsx-runtime'

const DefaultDocument = (
    createElement('html', { lang: 'en' },
        createElement('head', {},
            createElement('meta', { charset: 'utf-8' })
        ),
        createElement('body', {})
    )
)

const DefaultWrapper = (props: Props = {}) => (
    createElement(props.Component, props.pageProps)
)

const buildJsFile = async (fromFile: string, toFile: string) => {
    return esbuild.build({
        entryPoints: [ fromFile ],
        outfile: toFile,

        // Make sure we can run the built files later
        format: 'cjs',
        platform: 'node',
        // ...without depending on being able to import stuff at runtime
        bundle: true,

        // Support JSX
        loader: { '.js': 'jsx' },
        jsxFactory: 'Dhow.createElement',
        jsxFragment: 'Dhow.Fragment',
        // ...and inject the relevant import into every file
        external: [ 'dhow' ],
        inject: [ path.join(__dirname, '/import-shim.js') ],
    })
}

type Page = {
    default: Component,
    getPaths?: () => Promise<string[]>,
    getProps: (path?: string) => Promise<Props>,
}

const readPage = (filePath: string) => {
    try {
        const pageModule = require(filePath)
        const page: Page = {
            default: pageModule.default,
            getPaths: pageModule.getPaths || undefined,
            getProps: pageModule.getProps || (async () => ({})),
        }

        if (typeof page.default !== 'function') {
            throw new Error('does not `export default` a function')
        }

        if (typeof page.getProps !== 'function') {
            throw new Error('has an invalid `getProps` export')
        }

        if (page.getPaths && typeof page.getPaths !== 'function') {
            throw new Error('has an invalid `getPaths` export')
        }

        page.getProps = page.getProps || (() => {})

        return page
    } catch (err) {
        throw new Error(`Malformed page (${filePath}): ${err.message}`)
    }
}

const readComponentLike = (filePath: string) => {
    try {
        const componentModule = require(filePath)
        const component: Component = componentModule.default

        if (typeof component !== 'function') {
            throw new Error('default export is not a function')
        }

        return component
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            return null
        }

        throw new Error(`Malformed component (${filePath}): ${err.message}`)
    }
}

const getDocument = (pagesPath: string) => {
    const custom = readComponentLike(path.join(pagesPath, '_document.js'))

    if (custom) {
        return custom()
    }

    return DefaultDocument
}

const getWrapper = (pagesPath: string) => {
    const custom = readComponentLike(path.join(pagesPath, '_app.js'))

    if (custom) {
        return custom
    }

    return DefaultWrapper
}

const buildPages = async (fromPath: string, toPath: string) => {
    // Set up a staging directory where temporary .js files will be built into
    const stagingPath = path.join(toPath, '.staging')
    await fse.ensureDir(stagingPath)

    // Build all .js files (pages) to staging (JSX -> regular JS)
    const jsFilePaths = await glob(path.join(fromPath, '**/*.js'))

    await Promise.all(
        jsFilePaths.map((filePath) => buildJsFile(
            filePath,
            path.join(stagingPath, filePath.slice(fromPath.length)),
        ))
    )

    // Set up the document (VNode tree) into which built html will be inserted
    const document = getDocument(stagingPath)
    const documentEntry = document.find({ id: 'dhow' }) || document.find({ type: 'body' })
    const documentHead = document.find({ type: 'head' })

    if (!documentEntry) {
        throw new Error('Invalid document, no entry point found.')
    }

    if (!documentHead) {
        throw new Error('Invalid document, no head found.')
    }

    // Get the component which will wrap all pages 
    const Wrapper = getWrapper(stagingPath)

    // Get the paths to all pages (all .js files in staging)
    const pagePaths = (await glob(path.join(stagingPath, '**/*.js')))
        .map((p) => path.parse(p))
        .filter((p) => p.name !== '_document' && p.name !== '_app')

    for (const pagePath of pagePaths) {
        const parsedPagePath = path.format(pagePath)
        const pageDir = pagePath.dir.slice(stagingPath.length)

        const page = readPage(parsedPagePath)

        // Compute all routes (all folders where a .html file will eventually 
        // be generated to
        const routePaths = page.getPaths ? (
            (await page.getPaths()).map((p) => path.join(pageDir, p))
        ) : (
            [ pagePath.name === 'index' ? pageDir : pagePath.name ]
        )

        for (const routePath of routePaths) {
            // Strip the previously prepended pageDir from the routePath since 
            // getProps expects the values that were returned from getPaths
            const props = await page.getProps(routePath.slice(pageDir.length))
            const html = createElement(Wrapper, {
                Component: page.default, pageProps: props
            }).toString()

            documentEntry.children = [ html ]

            if (head.contents) {
                documentHead.children.push(...head.contents)

                head.contents = []
            }

            const htmlPath = path.join(toPath, routePath, 'index.html')
            fse.outputFile(htmlPath, document.toString())
        }
    }

    await fse.remove(stagingPath)
}

const build = async (from: string, to: string) => {
    const fromPath = path.resolve(from)
    const toPath = path.resolve(to)

    if (fromPath === toPath) {
        throw new Error('The input and output directories must not be the same.')
    }

    // Ensure `toPath` points to an empty directory
    await fse.remove(toPath);
    await fse.ensureDir(toPath);

    // Build pages from `from` to `to`
    buildPages(fromPath, toPath)

    // Copy public folder contents to `to`
    fse.copy('./public/', toPath)

    // Process CSS inside `to`
}

export default build
