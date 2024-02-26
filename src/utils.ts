import util from 'util'
import sirv from 'sirv'
import polka from'polka'
import chalk from 'chalk'
import chokidar from 'chokidar'

const createLogger = (name: string, color: chalk.ChalkFunction) => {
    const prefix = color(name) + ' - '

    return (format: string, ...args: any[]) => console.log(
        prefix + util.formatWithOptions({ colors: true }, format, ...args)
    )
}

const createErrorLogger = (name: string) => {
    const prefix = chalk.red(name) + ' - '

    return (message: string, err: any) => (
        console.error(prefix + message + '\n'
            + chalk.gray(err instanceof Error ? err.stack : err))
    )
}

export const logger = {
    ready: createLogger('ready', chalk.gray),
    wait: createLogger('wait', chalk.magenta),
    done: createLogger('done', chalk.cyan),
    warn: createLogger('warn', chalk.yellow),
    error: createErrorLogger('error'),
}

export const watch = (
    watchPath: string, callback: (...args: any[]) => any,
    options: { ignore: string[] } = { ignore: [] }
) => {
    const watcher = chokidar.watch(watchPath, {
        ignoreInitial: true,
        ignored: (path: string) =>
            options.ignore.filter((i) => path.startsWith(i)).length !== 0,
    })

    watcher.on('all', callback)
    watcher.on('ready', (path: string) => callback('ready', path))
}

export const serve = async (directory: string, port: number) => {
    const serveStatic = sirv(directory, { dev: true })

    await polka().use(serveStatic).listen(port)
}
