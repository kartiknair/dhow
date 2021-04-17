export const Fragment = Symbol('fragment')

// Not much sense in locking this down further since it's unlikely that any end
// user will ever see the typings anyways and we're just passing this stuff through
type Attributes = { [key: string]: any }
export type Props = Attributes

export const createElement = (
    type: VNode['type'] | Component,
    props: Props = {},
    ...children: VNode['children']
): VNode => {
    if (typeof type === 'function') {
        return type({ children, ...props })
    }

    return new VNode(type, props, children)
}

export class VNode {
    static styleToString(style: CSSStyleDeclaration) {
        const cssifyKey = (key: string) =>
            key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())

        return Object.entries(style).map(([ key, value ]) => (
            `${cssifyKey(key)}: ${value.toString()};`
        )).join(' ')
    }

    type
    children: (VNode | string)[]
    attributes: Attributes

    constructor(
        type: keyof HTMLElementTagNameMap | typeof Fragment,
        attributes: Attributes,
        // The VNode[] case happens with the special children prop
        children: (VNode[] | VNode | string)[],
    ) {
        this.type = type
        this.children = []
        this.attributes = attributes || {}

        for (const child of children) {
            if (Array.isArray(child)) {
                this.children.push(createElement(Fragment, undefined, ...child))
            } else {
                this.children.push(child)
            }
        }
    }

    toString(): string {
        let contentString = this.children.map((c) => (
            Array.isArray(c) ? c.map((c) => c.toString).join('') : c.toString()
        )).join('')

        if (this.type === Fragment) {
            return contentString
        }

        if (this.attributes.className) {
            this.attributes.class = (this.attributes.class || '')
                + this.attributes.className

            delete this.attributes.className
        }

        if (typeof this.attributes.style === 'object') {
            this.attributes.style =  VNode.styleToString(this.attributes.style)
        }

        if (this.attributes.html) {
            contentString = this.attributes.html

            delete this.attributes.html
        }

        const attributesString = Object.entries(this.attributes)
            .map(([ key, value ]) => ` ${key}="${value}"`).join(' ')
        
        return `<${this.type}${attributesString}>${contentString}</${this.type}>`
    }

    find({ id = '', type }: { id?: string, type?: VNode['type'] }): VNode | null {
        if (this.attributes.id === id) {
            return this
        }

        if (this.type === type) {
            return this
        }

        for (const child of this.children) {
            if (typeof child === 'string' || Array.isArray(child)) {
                continue
            }

            const found = child.find({ id, type })
            if (found) {
                return found
            }
        }

        return null
    }
}

export type Component = ((props?: Props) => VNode)
