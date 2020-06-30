const Dhow = require('../src/jsx-runtime.cjs')
const { startService } = require('esbuild')

test('fragment and nested fragments should return children as array', async (done) => {
    const service = await startService()

    try {
        const parsed = await service.transform(
            `<div>
    <p>Hello fragments!</p>
    {[1, 2, 3, 4].map((item) => (
        <>
            <p>
                <small>just another item</small>
            </p>
            <p>{item}</p>
            <div>
                <p>What about even more nesting</p>
                <>
                    <span>Hello! I'm very deeply nested</span>
                </>
            </div>
        </>
    ))}
</div>`,
            {
                loader: 'jsx',
                jsxFactory: 'Dhow.el',
                jsxFragment: 'Dhow.fragment',
            }
        )

        const actualResult = `<div><p>Hello fragments!</p><p><small>just another item</small></p><p>1</p><div><p>What about even more nesting</p><span>Hello! I'm very deeply nested</span></div><p><small>just another item</small></p><p>2</p><div><p>What about even more nesting</p><span>Hello! I'm very deeply nested</span></div><p><small>just another item</small></p><p>3</p><div><p>What about even more nesting</p><span>Hello! I'm very deeply nested</span></div><p><small>just another item</small></p><p>4</p><div><p>What about even more nesting</p><span>Hello! I'm very deeply nested</span></div></div>`

        const evaluated = new Function('Dhow', 'return ' + parsed.js)
        expect(evaluated(Dhow).outerHTML).toBe(actualResult)
        done()
    } catch (err) {
        done(err)
    } finally {
        service.stop()
    }
})
