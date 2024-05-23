
const express = require('express')
const connectSSI = require('connect-ssi')
const app = express()
const docRoot = __dirname + '/public'

app.set('port', 3000)

app.use(connectSSI({
    baseDir: docRoot,
    ext: '.html'
}));

app.use(express.logger('dev'))
app.use(express.compress())
app.use(express.static(docRoot))

app.listen(app.get('port'), function() {
    console.log('Server listening on port %s', app.get('port'))
});
