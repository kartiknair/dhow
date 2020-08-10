const document = require('min-document')

const createElement = (tag, props, ...children) => {
    if (typeof tag === 'function') return tag(props, ...children)
    const element = document.createElement(tag)

    Object.entries(props || {}).forEach(([name, value]) => {
        if (name === 'html') element.innerHTML = value
        else if (name === 'class') element.className += value.toString()
        else if (name === 'style' && typeof value === 'object') {
            const styleString = Object.entries(value)
                .map(
                    ([k, v]) =>
                        `${k.replace(
                            /[A-Z]/g,
                            (m) => '-' + m.toLowerCase()
                        )}:${v.toString()}`
                )
                .join(';')

            element.setAttribute('style', styleString)
        } else element.setAttribute(name, value.toString())
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

const Head = (props, ...children) => {
    // TODO: Don't use a global variable
    global.headContents = children
    return false
}

module.exports = {
    el: createElement,
    fragment: createFragment,
    Head,
}
