import Dhow, { Head } from 'dhow'

const Home = () => (
    <main>
        <Head>
            <title>Hello Tailwind</title>
            <link rel="stylesheet" href="/main.css" />
        </Head>
        <h1 class="text-xl">Hello Tailwind</h1>
        <p>Dhow static site with PostCSS + Tailwind!</p>
    </main>
)

export default Home
