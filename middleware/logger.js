const fs = require('fs')
const fsPromises = require('fs').promises
const { format } = require('date-fns')
const path = require('path');
const { v4: uuid } = require('uuid')



const logEvents = async (message, logFileName) => {
    const date = format(new Date, 'yyyyMMdd\tHH:mm:ss');
    const logItem = `${date}\t${uuid()}\t${message}\n`

    try {
        if(!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
            await fsPromises.mkdir(path.join(__dirname, '..', 'logs'))
        }

        await fsPromises.appendFile(path.join(__dirname, '..', 'logs', logFileName), message)
    } catch(err) {
        console.log(err)
    }
}


const logger = (req, res, next) => {
    logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, 'reqLog.log')
    console.log(`${req.method} ${req.path}`)
    next()
}

module.exports = { logger, logEvents}