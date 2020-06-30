import Dhow from 'dhow'

const Project = ({ name, image, description }) => (
    <div
        class="project"
        style={`background-image: 
                    linear-gradient(rgba(0, 0, 0, 0.5), 
                    rgba(0, 0, 0, 0.5)),
                    url(${image});`}
    >
        <h4>{name}</h4>
        <p>{description}</p>
    </div>
)

export default Project
