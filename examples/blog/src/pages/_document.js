import Dhow from 'dhow'

const Document = () => (
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            />

            <link rel="stylesheet" href="/styles/main.css" />
        </head>
        <body>
            <div id="dhow"></div>
            <script
                html={`
                window.onload = function () {
                    document.querySelectorAll('a').forEach((link) => {
                        if (link.host === window.location.host)
                            link.setAttribute('data-internal', true)
                        else link.setAttribute('data-external', true)
                    })
                }
            `}
            ></script>
        </body>
    </html>
)

export default Document
