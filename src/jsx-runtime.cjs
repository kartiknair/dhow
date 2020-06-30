const { Document } = require('nodom')
const document = new Document()

const createElement = (tag, props, ...children) => {
    if (typeof tag === 'function') return tag(props, ...children)
    const element = document.createElement(tag)

    Object.entries(props || {}).forEach(([name, value]) => {
        if (name === 'html') element.innerHTML = value
        else element.setAttribute(name, value.toString())
    })

    children.forEach((child) => {
        appendChild(element, child)
    })

    return element
}

const appendChild = (parent, child) => {
    if (Array.isArray(child))
        child.forEach((nestedChild) => appendChild(parent, nestedChild))
    else
        parent.appendChild(
            child.nodeType ? child : document.createTextNode(child)
        )
}

const createFragment = (props, ...children) => {
    return children
}

const Dhow = {
    el: createElement,
    fragment: createFragment,
}

module.exports = Dhow
