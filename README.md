# Dhow

> **Note**: this is a work in progress

JSX-powered SSG for Node.js. Write logic like React with a directory-structure like Next.js but generate plain HTML.

## What it does

Dhow is basically a transpiler. It takes a `.js` file like this:

```jsx
import Dhow from 'dhow'

const Home = () => (
    <main>
        <h3>This is my home</h3>
        <p>On the internet obviously</p>
    </main>
)

export const Head = () => (
    <>
        <title>Home page</title>
    </>
)

export default Home
```

and converts it into a static HTML file like this:

```html
<!DOCTYPE html>
<html>
    <head>
        <title>Home page</title>
    </head>
    <body>
        <div class="dhow">
            <main>
                <h3>This is my home</h3>
                <p>On the internet obviously</p>
            </main>
        </div>
    </body>
</html>
```

You can also export an (optionally) async `getProps` function from your file to fetch data. This will be run during build time & the props that it returns will be passed to your `Head` component & default component.

```jsx
import Dhow from 'dhow'
import fetch from 'node-fetch'

const Home = ({ posts }) => (
    <main>
        <h1>All the blog posts</h1>
        <ul>
            {posts.map((post) => (
                <li>
                    <h3>{post.title}</h3>
                </li>
            ))}
        </ul>
    </main>
)

export const Head = () => (
    <>
        <title>Blog Posts</title>
    </>
)

export const getProps = async () => {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts')
    const data = await res.json()
    return { posts: data }
}

export default Home
```

To generate multiple files using a single `.js` file you can export an (optionally) async `getPaths` function from your file. It should return an array of strings. Each of them will replace your filename in the end result. Each of the paths will also be passed to your `getProps` function if you do export one.

```jsx
import Dhow from 'dhow'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'
import marked from 'marked'

const Post = ({
    post: {
        content,
        data: { title, date, description },
    },
}) => (
    <article>
        <h2>{title}</h2>
        <p>
            <small>{new Date(date).toDateString()}</small>
        </p>
        <p>{description}</p>
        <h4>―</h4>
        <div html={content}></div>
    </article>
)

export const Head = ({
    post: {
        data: { title, description },
    },
}) => (
    <>
        <title>{title}</title>
        <meta name="description" content={description} />
    </>
)

export const getPaths = async () => {
    const files = await readdir('./content')
    return files.map((path) => path.slice(0, path.length - 3))
}

export const getProps = async (slug) => {
    let post = await readFile(join('./content', `${slug}.md`), 'utf-8')
    post = matter(post)
    post.content = marked(post.content)
    return { post }
}

export default Post
```
