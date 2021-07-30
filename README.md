This is a rewrite of [kartiknair/dhow](https://github.com/kartiknair/dhow), written because I ran into some issues that were hard to debug and was missing some features.

From the original `README`:

>JSX-powered SSG for Node.js. Write logic like React with a directory-structure like Next.js but generate plain HTML with no client side JS.

I tried to keep this brief since it's mostly for my own convenience and because I hope to get the code changes merged into upstream at some point.

## Getting Started

The interface to the `dhow` command is

```
$ npx @fsoc/dhow --help
  Usage
    $ dhow <command> [options]

  Available Commands
    build    Compiles your pages for deployment
    dev      Rebuilds your pages on change and hosts them locally

  For more info, run any command with the `--help` flag
    $ dhow build --help
    $ dhow dev --help

  Options
    -i, --indir      Sets the directory where files will be read from  (default pages)
    -v, --version    Displays current version
    -h, --help       Displays this message
```

By default, dhow expects a directory structure like

```
├── pages
│   ├── about.js
│   └── index.js
└── public
    └── dhow.jpg
```

and, given the above, generates a directory like

```
out
├── about
│   └── index.html
├── dhow.jpg
└── index.html
```

which can be statically hosted using any webserver. The content of the public directory is simply copied over, the JavaScript files in the pages directory are transpiled to HTML and then copied to an appropiate location based on the file path.

Pages (the JavaScript files in the pages directory) are expected to export a function which returns JSX.

```js
const Home = () => (<>
    <img src={'/dhow.jpg'} alt={'Dhow'} />

    <p>
        JSX-powered SSG for Node.js. Write logic like React with a directory-structure like Next.js but generate plain HTML with no client side JS.
    </p>
</>)

export default Home
```

## Built time data fetching

In addition to the required default export, pages can export the (optionally async) function `getProps`, which can be used to dynamicaly fetch content at build time. Its return value is passed to the default-exported function.

```js
export default ({ buildTime }) => (<>
    <p>
        This page was built on <time datetime={buildTime.toISOString()}>
            {buildTime.toDateString()}
        </time>.
    </p>
</>)

export const getProps = async () => ({
    buildTime: new Date()
})
```

## Dynamic pages

By default each page is mapped to a route, determined by its file path. One can map a single page to multiple routes by wrapping its file name in brackets, like `pages/post/[pid].js`.

In order to define the possible routes, a page can export the (optionally async) function `getPaths`, which is expected to return an array of strings. The file name is thus ignored and replaced with each item in the returned array.

```js
export default ({ content }) => (<>
    <p>
        {content}
    </p>
</>)

const data = {
    'about': /* ... */,
    'contact': /* ... */,
    'privacy': /* ... */,
}

export const getProps = async (slug) => ({
    content: data[slug]
})

export const getPaths = async () => Object.keys(data)
```

As can be seen in the example above, each item in the returned array is also passed to `getProps` (if it was exported).

## Custom `App` and `Document`

Analogous to NextJS, one can override the default `App` or `Document` through providing an `_app.js` or `_document.js` in the pages directory.

The `App` is a wrapper around every page, it receives the component that is default exported from every page and the result of the `getProps` function (`undefined` if it was not exported).

```js
const App = ({ Component, pageProps = {} }) => (<>
    <Component {...pageProps} />

    <Footer />
</>)

export default App
```

The `Document` is the actual DOM tree into which the built HTML of every page will be inserted, it should, at minimum, include

```js
const Document = () => (<>
    <html>
        <head>
        </head>

        <body>
            {/* Pages will get inserted here. */}
        </body>
    </html>
</>);

export default Document;
```

Note that, if provided, this is a complete replacement of the internal default tree (which looks like the above).

## Modifying the `head` content

A `Head` component is exported which can be used to modify the contents of the document head on a per-page basis.

```js
import { Head } from '@fsoc/dhow'

export default () => (<>
    <Head>
        <title>Page title</title>
    </Head>
</>)
```

It's fine to have multiple `Head`s in one document, but note that (unlike NextJS, for example) the content of the `Head` will be _appended_ to what is already in it (i. e. what was provided in `Document` or `App`).

## Debugging and miscellaneous

A number of internal variables are exposed through `process.env` for the consumption of pages.

- `__DHOW_STAGING_PATH` the absolute path to the internal staging folder
- `__DHOW_PAGE_PATH` the absolute path to the internal page file corresponding to the current file
- `__DHOW_PAGE_DIR` the absolute path to the directory in which the current page file is in, for convenience
- `__DHOW_ROUTE_PATH` the name of the current route, this is the path to which the `index.html` file which is generated for the current page will be written to, relative to the output directory

[Debug](https://github.com/visionmedia/debug) is used to provide debug logs, enable it through setting the environment variable `DEBUG=dhow:*`.

## CSS

CSS is processed using PostCSS, `dhow` will attempt to read a `postcss.config.js` file from the root of the project and pass it to PostCSS. If none is found, nothing is passed through.
