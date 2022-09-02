import { createElement, Fragment, VNode } from './jsx-runtime'

export const head = {
    _contents: <VNode[]>[],

    get contents() {
        return this._contents
    },

    set contents(contents: VNode[]) {
        this._contents = contents
    },

    reset() {
        this._contents = []
    }
}

export const Head = ({ children }: { children: VNode[] }) => {
    head.contents = children

    return createElement(Fragment, {})
}
