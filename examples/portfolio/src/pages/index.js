import Dhow from 'dhow'
import Project from '../components/Project.js'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

const Home = ({ projects }) => (
    <main>
        <div class="landing">
            <h1>
                Hi! I’m Kartik Nair, a software engineer and designer. I build
                user friendly web applications & tooling for developers
            </h1>
        </div>
        <div class="projects">
            {projects.map((project) => (
                <Project data={project.data} />
            ))}
        </div>
    </main>
)

export const Head = () => (
    <>
        <title>Kartik Nair</title>
    </>
)

export const getProps = () => {
    let projects = readdirSync('projects')
    projects = projects.map((post) => {
        const content = readFileSync(join('projects', post))
        return { ...matter(content), path: post.slice(0, post.length - 3) }
    })

    projects = projects.sort((a, b) => b.data.date - a.data.date)
    return { projects }
}

export default Home
