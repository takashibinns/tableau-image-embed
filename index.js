const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const port = process.env.PORT || 8080

app.use(bodyParser.json());

//  Server static files
app.use(express.static('public'));

//  Define API routes
const routeAuth = require('./backend/router');
app.use('/api', routeAuth);

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));