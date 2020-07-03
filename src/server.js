/**
 * Simple express sever
 * Copyright (c) 2014, marlun78
 * MIT License, https://gist.github.com/marlun78/bd0800cf5e8053ba9f83
 *
 * Assumes this folder structure
 * /public
 * /server
 *
 * Express: http://expressjs.com
 */

import express from 'express'

export function createServer() {
    const HOST = process.env.HOST || '127.0.0.1'
    const PORT = process.env.PORT || 3000
    const app = express()
    app.use(express.static('__dhow__'))

    const server = app.listen(PORT, HOST, () =>
        console.log('Dhow dev server listening at http://localhost:3000')
    )

    return server
}
