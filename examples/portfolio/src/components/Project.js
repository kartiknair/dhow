import Dhow from 'dhow'

const Project = ({ data: { title, description, image, image_alt, color } }) => (
    <a class="project" style={{ backgroundColor: `#${color}` }}>
        <img src={image} alt={image_alt} />
        <div class="text">
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    </a>
)

export default Project
