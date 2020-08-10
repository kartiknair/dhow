import Dhow, { Head } from 'dhow'
import matter from 'gray-matter'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const App = ({ posts }) => (
    <article>
        <Head>
            <title>Kartik Nair's Blog</title>
            <meta
                name="description"
                content="A blog about development, design, and the process of getting better at them"
            />
        </Head>
        <h4>Kartik Nair</h4>
        <p>
            Hey there, I'm Kartik Nair. I like creating and writing about
            websites. I write about design, development & the process of
            becoming better at them. Wanna get in touch or just learn more about
            me? Check out <a href="/about">the about page</a>:
        </p>
        <ul class="posts-list">
            {posts.map((post) => (
                <li>
                    <a href={`/blog/${post.path}`}>{post.data.title}</a>
                </li>
            ))}
        </ul>
        <style>{`
            .posts-list {
                list-style: none;
                margin-left: 0;
            }

            .posts-list li {
                padding: 0.25rem 0;
            }

            .posts-list li::before {
                content: "→";
                font-size: 1.1rem;
                margin-right: 1rem;
                color: var(--primary);
            }
        `}</style>
    </article>
)

export const getProps = () => {
    let posts = readdirSync('./content')
    posts = posts.map((post) => {
        const content = readFileSync(join('./content', post))
        return { ...matter(content), path: post.slice(0, post.length - 3) }
    })
    posts = posts.sort((a, b) => b.data.date - a.data.date)
    return { posts }
}

export default App
