import path from 'path'
import glob from 'fast-glob'
import * as fse from 'fs-extra'
import * as esbuild from 'esbuild'

import { debug, BuildOptions } from './build'

import { head } from './head'
import { createElement, Component, Props } from './jsx-runtime'

// This file modifies process.env with keys of the format `__DHOW_${NAME}`
// since pages may need certain information in special cases. (Pages are 
// built/executed in the same scope as the code in this file.)

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
        external: [ '@fsoc/dhow' ],
        inject: [ path.join(__dirname, '/import-shim.js') ],
    })
}

type Page = {
    default: Component,
    getPaths?: () => Promise<string[]>,
    getProps: (path?: string) => Promise<Props>,
}

const readPage = (filePath: string) => {
    // Ensure that code is always re-run since it might have changed since the 
    // last time this was called
    delete require.cache[require.resolve(filePath)]

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
        delete require.cache[require.resolve(filePath)];

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

const getLocalDependencies = async (filePath: string) => {
    const content = await fse.readFile(filePath, 'utf8')
    const lines = content.split('\n')
    const dependencies: string[] = []

    for (const line of lines) {
        if (!line.trim().startsWith('import')) {
            continue
        }

        const normalizedLine = line.replace('"', '\'').replace('`', '\'')
        const dependency = normalizedLine.substring(
            normalizedLine.indexOf('\'') + 1,
            normalizedLine.lastIndexOf('\''),
        )

        if (dependency[0] !== '.') {
            continue
        }

        const parsedFilePath = path.parse(filePath)

        dependencies.push(path.resolve(
            parsedFilePath.dir,
            dependency.endsWith('.js') ? dependency : dependency + '.js'
        ))
    }

    return dependencies
}

const pagesCache: { [path: string]: {
    routePaths: string[],
    localDependencies: string[],
} } = {}

export const buildPages = async (
    fromPath: string, toPath: string, options: BuildOptions
) => {
    // Handle deletions of pages
    for (const change of options.changes) {
        if (change.type !== 'unlink' || !change.path.startsWith(fromPath)) {
            continue
        }

        const cachedPaths = pagesCache[change.path].routePaths

        if (!cachedPaths.length) {
            debug('page path cache did not contain expected path %o', change.path)

            continue
        }

        for (const cachedPath of cachedPaths) {
            await fse.remove(cachedPath)

            debug('removed cached path %o', cachedPath)
        }
    }

    // Trigger a page rebuild if a dependency of the page changed
    for (const change of options.changes) {
        for (const pagePath of Object.keys(pagesCache)) {
            if (pagesCache[pagePath]?.localDependencies.includes(change.path)) {
                options.changes.push({ type: 'change', path: pagePath })
            }
        }
    }

    const stagingPath = path.join(toPath, '.staging')
    await fse.ensureDir(stagingPath)

    process.env.__DHOW_STAGING_PATH = stagingPath

    // Build all .js files (pages) to staging (JSX -> regular JS)
    const jsFilePaths = options.initial ? (
        await glob(path.join(fromPath, '**/*.js').replace(/\\/g, '/'))
    ) : (
        options.changes
            .filter((c) => c.type !== 'unlink' && c.path.startsWith(fromPath))
            .map((change) => change.path)
    )

    if (!jsFilePaths.length) {
        debug('skipping page building since there are no new files to build')

        return
    } else {
        debug('building js files %o', jsFilePaths)
    }

    debug('getting local dependencies of js files')

    for (const filePath of jsFilePaths) {
        if (!pagesCache[filePath]) {
            pagesCache[filePath] = {
                routePaths: [], // This will be set later on
                localDependencies: [],
            }
        }

        pagesCache[filePath].localDependencies =
            await getLocalDependencies(filePath)

        debug('local dependencies of %o are %o', filePath.slice(fromPath.length),
            pagesCache[filePath].localDependencies)
    }

    debug('transpiling js files to %o', stagingPath)

    const jsBuildResults = await Promise.all(
        jsFilePaths.map((filePath) => buildJsFile(
            filePath,
            path.join(stagingPath, filePath.slice(fromPath.length)),
        ))
    )

    for (const result of jsBuildResults) {
        for (const warning of result.warnings) {
            debug('%o', warning)
        }
    }

    // Set up the document (VNode tree) into which built html will be inserted
    const document = getDocument(stagingPath)
    const documentEntry = document.find({ id: 'dhow' })
        || document.find({ type: 'body' })
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
    const pagePaths = await glob(path.join(stagingPath, '**/*.js').replace(/\\/g, '/'))

    debug('building pages at the paths %o', pagePaths)

    for (const pagePath of pagePaths) {
        const parsedPagePath = path.parse(pagePath)

        process.env.__DHOW_PAGE_PATH = pagePath
        process.env.__DHOW_PAGE_DIR = parsedPagePath.dir

        if ([ '_app', '_document' ].includes(parsedPagePath.name)) {
            continue
        }

        const pageDir = parsedPagePath.dir.slice(stagingPath.length)

        const page = readPage(pagePath)

        // Make sure to save the paths as they were provided to be able to pass
        // them to the component as-is
        const origPagePaths = page.getPaths ? await page.getPaths() : []
        // Compute all routes (all folders where a .html file will eventually 
        // be generated to
        const routePaths = origPagePaths.length ? (
            origPagePaths.map((p) => pageDir + path.sep + p)
        ) : (
            [ parsedPagePath.name === 'index' ? pageDir : parsedPagePath.name ]
        )

        // The `cacheKey` is really just the path of the original .js file
        const cacheKey = path.join(fromPath, pagePath.slice(stagingPath.length))
        if (!pagesCache[cacheKey]) {
            pagesCache[cacheKey] = { routePaths: [], localDependencies: [] }
        }

        for (let i = 0; i < routePaths.length; i++) {
            const routePath = process.platform === 'win32'
                ? routePaths[i].replace('\\', '/')
                : routePaths[i]

            process.env.__DHOW_ROUTE_PATH = routePath

            const props = await page.getProps(origPagePaths[i] || routePath)
            const html = createElement(Wrapper, {
                Component: page.default, pageProps: props
            }).toString()

            documentEntry.children = [ html ]

            if (head.contents) {
                documentHead.children.push(...head.contents)

                head.contents = []
            }

            const htmlPath = path.join(toPath, routePath, 'index.html')
            await fse.outputFile(htmlPath, document.toString())

            if (!pagesCache[cacheKey].routePaths.includes(htmlPath)) {
                pagesCache[cacheKey].routePaths.push(htmlPath)
            }
        }
    }

    await fse.remove(stagingPath)
}
