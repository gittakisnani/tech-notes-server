require('dotenv').config()
const express = require('express');
const path = require('path')
const { logger, logEvents } = require('./middleware/logger')
const errorHandler = require('./middleware/errorHanlder')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const connectDB = require('./config/dbConn');
const mongoose = require('mongoose');

const corsOptions = require('./config/corsOptions')
const app = express()


const PORT = process.env.PORT || 3500;

console.log(process.env.NODE_ENV);

connectDB()


app.use(logger)

app.use(cors(corsOptions))

app.use(express.json())


app.use(cookieParser())


app.use('/', express.static(path.join(__dirname, 'public')))

app.use('/', require('./routes/root'))
app.use('/auth', require('./routes/authRoute'))
app.use('/users', require('./routes/usersRoute'))
app.use('/notes', require('./routes/notesRoute'))

app.all('*', (req, res) => {
    res.status(404);
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    } else if (req.accepts('json')) {
        res.sendFile({ 'message': '404 Not Found' })
    } else {
        res.type('txt').send('404 Not Found')
    }
})

app.use(errorHandler)

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`))
})

mongoose.connection.on('error', (error) => {
    console.log(error);
    logEvents(`${error.no}\t${error.code}\t${error.syscall}\t${error.hostname}`, 'mongoErrLog.log')
})