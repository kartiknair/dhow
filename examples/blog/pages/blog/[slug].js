import Dhow from 'dhow'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'
import marked from 'marked'
import prism from 'prismjs'

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
        <script src="https://cdnjs.cloudflare.com/ajax/libs/cloudinary-core/2.3.0/cloudinary-core-shrinkwrap.min.js"></script>
        <script
            html={`
            const cl = cloudinary.Cloudinary.new({ cloud_name: "kartiknair" })
            cl.responsive()
        `}
        ></script>
    </article>
)

export const Head = ({
    post: {
        data: { title, description },
    },
}) => (
    <>
        <title>{title} - Kartik Nair</title>
        <meta name="description" content={description} />
        <link rel="stylesheet" href="/styles/prism.css" />
    </>
)

export const getPaths = async () => {
    const files = await readdir('./content')
    return files.map((path) => path.slice(0, path.length - 3))
}

export const getProps = async (slug) => {
    let post = await readFile(join('./content', `${slug}.md`), 'utf-8')
    post = matter(post)

    const renderer = new marked.Renderer()
    renderer.image = (href, title, text) => {
        return `<img data-src="https://res.cloudinary.com/kartiknair/image/upload/w_auto,c_scale,dpr_auto/${href}" loading="lazy" alt="${text}" class="cld-responsive" />`
    }

    marked.setOptions({
        renderer,
        highlight: function (code, lang) {
            if (prism.languages[lang]) {
                return prism.highlight(code, prism.languages[lang], lang)
            } else {
                return code
            }
        },
    })

    post.content = marked(post.content)
    return { post }
}

export default Post
