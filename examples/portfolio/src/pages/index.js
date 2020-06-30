import Dhow from 'dhow'
import Project from '../../components/Project.js'

const Home = () => (
    <main>
        <div class="landing">
            Hey there, my name is Kartik Nair. I'm a developer & designer
            building modern and accessible web applications.
        </div>
        <div class="projects">
            <Project
                name="Cool"
                image="/bla.png"
                description="Awesome project"
            />
        </div>
    </main>
)

export const Head = () => <></>

export default Home
