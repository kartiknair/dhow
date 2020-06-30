const Dhow = require('../src/jsx-runtime.cjs')
const { startService } = require('esbuild')

test('setting the html property should set the innerHTML of a node', async (done) => {
    const service = await startService()

    try {
        const parsed = await service.transform(
            `return <div html={\`<p>Hello there!</p><h3>This is pretty neat!</h3>\`}></div>`,
            {
                loader: 'jsx',
                jsxFactory: 'Dhow.el',
                jsxFragment: 'Dhow.fragment',
            }
        )

        const actualResult = `<div><p>Hello there!</p><h3>This is pretty neat!</h3></div>`

        const evaluated = new Function('Dhow', parsed.js)
        expect(evaluated(Dhow).toString()).toBe(actualResult)
        done()
    } catch (err) {
        done(err)
    } finally {
        service.stop()
    }
})
