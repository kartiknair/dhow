import Dhow from 'dhow'

const Project = ({ data: { title, description, image, image_alt, color } }) => (
    <a
        class="project"
        style={{ backgroundColor: `#${color}` }}
        data-aos="fade-up"
        data-aos-delay="400"
    >
        <img src={image} alt={image_alt} />
        <div class="text">
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    </a>
)

export default Project
