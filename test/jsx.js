const { expect } = require('chai')
const Dhow = require('../src/jsx-runtime.js')
const { startService } = require('esbuild')

describe('JSX Runtime', function () {
    before(async function () {
        this.service = await startService()
        this.transform = (str) =>
            this.service.transform(str, {
                loader: 'jsx',
                jsxFactory: 'Dhow.el',
                jsxFragment: 'Dhow.fragment',
            })
    })

    it('processes fragments by returning their children', async function () {
        const parsed = await this.transform(
            `
return (
    <div>
        <p>Hello fragments!</p>
        <>
            <p>
                <small>just another item</small>
            </p>
            <p>helo</p>
            <div>
                <p>What about even more nesting</p>
                <>
                    <span>Hello! I'm very deeply nested</span>
                </>
            </div>
        </>
    </div>
)`
        )

        const evaluated = new Function('Dhow', parsed.js)
        const actualResult = `<div><p>Hello fragments!</p><p><small>just another item</small></p><p>helo</p><div><p>What about even more nesting</p><span>Hello! I'm very deeply nested</span></div></div>`
        expect(evaluated(Dhow).toString()).to.equal(actualResult)
    })

    it('sets innerHTML of node using the `html` prop', async function () {
        const parsed = await this.transform(
            `return <div html={\`<p>Hello there!</p><h3>This is pretty neat!</h3>\`}></div>`
        )

        const evaluated = new Function('Dhow', parsed.js)
        const actualResult = `<div><p>Hello there!</p><h3>This is pretty neat!</h3></div>`
        expect(evaluated(Dhow).toString()).to.equal(actualResult)
    })

    it('directly translates the `style` prop to an html style string', async function () {
        const parsed = await this.transform(
            `let myColor = 'red';
            return <div style={{color: myColor, backgroundColor: 'red'}}><p style="color: green;">I have regular styling</p></div>`
        )

        const evaluated = new Function('Dhow', parsed.js)
        const actualResult = `<div style="color:red;background-color:red"><p style="color: green;">I have regular styling</p></div>`
        expect(evaluated(Dhow).toString()).to.equal(actualResult)
    })

    after(async function () {
        this.service.stop()
    })
})
