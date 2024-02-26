import { createElement, Fragment, VNode } from './jsx-runtime'

export const head = {
    static: <VNode[]>[],
    _contents: <VNode[]>[],

    get contents() {
        return [ ...this.static, ...this._contents ]
    },

    set contents(contents: VNode[]) {
        this._contents.push(...contents)
    },

    reset() {
        this._contents = []
    }
}

export const Head = ({ children }: { children: VNode[] }) => {
    head.contents = children

    return createElement(Fragment, {})
}
