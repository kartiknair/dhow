import { Head } from '@fsoc/dhow';

const posts = [
    {
        title: 'Hello World!',
        slug: 'hello-world',
        date: '2022-09-12',
        content: 'This is the first post.'
    },
    {
        title: 'Another Post',
        slug: 'another-post',
        date: '2022-10-12',
        content: 'Another post, just to be sure'
    }
]

const Post = ({ title, date, content }) => {
    return (<>
        <Head>
            <title>{title}</title>
        </Head>

        <h1>{title}</h1>

        <p>Published {date}</p>

        <p>{content}</p>
    </>);
}

export default Post

export const getProps = (slug) => {
    return posts.filter((p) => p.slug == slug)[0]
}

export const getPaths = () => posts.map((p) => p.slug)
