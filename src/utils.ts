import util from 'util'
import chalk from 'chalk'

const createLogger = (name: string, color: chalk.ChalkFunction) => {
    const prefix = color(name) + ' - '

    return (format: string, ...args: any[]) => console.log(
        prefix + util.formatWithOptions({ colors: true }, format, ...args)
    )
}

const createErrorLogger = (name: string) => {
    const prefix = chalk.red(name) + ' - '

    return (message: string, err: Error) => console.error(
        prefix + message + '\n' + chalk.gray(err.stack)
    )
}

export const logger = {
    ready: createLogger('ready', chalk.gray),
    wait: createLogger('wait', chalk.magenta),
    done: createLogger('done', chalk.cyan),
    error: createErrorLogger('error'),
}
