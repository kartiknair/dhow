import { test } from 'uvu'
import assert from 'uvu/assert'

import { createElement, Fragment, VNode, Component } from '../src/jsx-runtime'

test('build a single node from a single jsx element', () => {
    assert.equal((
        createElement('div', {})
    ), (
        new VNode('div', {}, [])
    ))

    assert.equal((
        createElement(Fragment, {})
    ), (
        new VNode(Fragment, {}, [])
    ))

    assert.equal((
        createElement('div', { className: 'some-name' })
    ), (
        new VNode('div', { className: 'some-name' }, [])
    ))
})

test('build html from a single jsx element', () => {
    assert.equal((
        createElement('div', {})
    ).toString(), (
        '<div></div>'
    ))

    assert.equal((
        createElement(Fragment, {})
    ).toString(), (
        ''
    ))

    assert.equal((
        createElement('div', { className: 'some-name' })
    ).toString(), (
        '<div class="some-name"></div>'
    ))
})

test('build an html element with styles from a jsx element', () => {
    assert.equal((
        createElement('div', { style: {
            color: 'red',
            padding: '12px',
        } })
    ).toString(), (
        '<div style="color: red; padding: 12px;"></div>'
    ))
})

const Tree = () => (
    createElement(Fragment, {},
        createElement('header', {},
            createElement('h1', {},
                'A title.'
            ),
        ),
        createElement('main', {},
            createElement('p', {},
                'First paragraph.'
            ),
            createElement('p', {},
                'Second paragraph.'
            ),
            createElement(Fragment, {},
                createElement('div', {},
                    createElement('div', {},
                        'Some deep nesting.',
                    ),
                ),
            ),
        ),
    )
)

const TreeNodes = (
    new VNode(Fragment, {}, [
        new VNode('header', {}, [
            new VNode('h1', {}, [
                'A title.'
            ])
        ]),
        new VNode('main', {}, [
            new VNode('p', {}, [
                'First paragraph.'
            ]),
            new VNode('p', {}, [
                'Second paragraph.'
            ]),
            new VNode(Fragment, {}, [
                new VNode('div', {}, [
                    new VNode('div', {}, [
                        'Some deep nesting.'
                    ])
                ])
            ])
        ])
    ])
)

test('build a tree of nodes from a tree of jsx elements', () => {
    assert.equal((
        Tree()
    ), (
        TreeNodes
    ))
})

test('build html from a tree of jsx elements', () => {
    assert.equal((
        Tree()
    ).toString(), (
        '<header><h1>A title.</h1></header><main><p>First paragraph.</p><p>Second paragraph.</p><div><div>Some deep nesting.</div></div></main>'
    ))
})

const Wrapper: Component = ({ className, children }) => (
    createElement('div', { className },
        createElement('p', {},
            'Content inside wrapper.'
        ),
        ...children,
    )
)

test('build a tree of nodes from a component', () => {
    assert.equal((
        createElement(Tree, {})
    ), (
        TreeNodes
    ))

    assert.equal((
        createElement(Wrapper, { className: 'some-class' },
            createElement('p', {},
                'First child paragraph.',
            ),
            createElement('p', {},
                'Second child paragraph.',
            ),
        )
    ), (
        new VNode('div', { className: 'some-class' }, [
            new VNode('p', {}, [ 'Content inside wrapper.' ]),
            new VNode('p', {}, [ 'First child paragraph.' ]),
            new VNode('p', {}, [ 'Second child paragraph.' ]),
        ])
    ))
})

test('build html from a component', () => {
    assert.equal((
        createElement(Tree, {})
    ).toString(), (
        // This is fine because we already tested that Tree().toString() is 
        // correct.
        Tree().toString()
    ))

    assert.equal((
        createElement(Wrapper, { className: 'some-class' },
            createElement('p', {},
                'First child paragraph.',
            ),
            createElement('p', {},
                'Second child paragraph.',
            ),
        )
    ).toString(), (
        '<div class="some-class"><p>Content inside wrapper.</p><p>First child paragraph.</p><p>Second child paragraph.</p></div>'
    ))
})

test.run()
