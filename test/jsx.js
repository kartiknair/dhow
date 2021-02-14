const { test } = require('uvu')
const assert = require('uvu/assert')
const Dhow = require('../src/jsx-runtime.js')

test('process JSX fragments by returning their children', () => {
    assert.equal(
        Dhow.el(
            'div',
            null,
            Dhow.el('p', null, 'Hello fragments!'),
            Dhow.el(
                Dhow.fragment,
                null,
                Dhow.el('p', null, Dhow.el('small', null, 'just another item')),
                Dhow.el('p', null, 'helo'),
                Dhow.el(
                    'div',
                    null,
                    Dhow.el('p', null, 'What about even more nesting'),
                    Dhow.el(
                        Dhow.fragment,
                        null,
                        Dhow.el('span', null, "Hello! I'm very deeply nested")
                    )
                )
            )
        ).toString(),
        `<div><p>Hello fragments!</p><p><small>just another item</small></p><p>helo</p><div><p>What about even more nesting</p><span>Hello! I'm very deeply nested</span></div></div>`
    )
})

test('set InnerHTML of a node using the `html` prop', () => {
    assert.equal(
        Dhow.el('div', {
            html: `<p>Hello there!</p><h3>This is pretty neat!</h3>`,
        }).toString(),
        `<div><p>Hello there!</p><h3>This is pretty neat!</h3></div>`
    )
})

test('translates `style` prop to a string if set as an object', () => {
    let myColor = 'red'

    assert.equal(
        Dhow.el(
            'div',
            {
                style: {
                    color: myColor,
                    backgroundColor: 'red',
                },
            },
            Dhow.el(
                'p',
                {
                    style: 'color: green;',
                },
                'I have regular styling'
            )
        ).toString(),
        `<div style="color:${myColor};background-color:red"><p style="color: green;">I have regular styling</p></div>`
    )
})

test.run()
