const express = require('express');
const router = express.Router();
const axios = require('axios');
const tableauHelper = require('./tableau-helper');

//  REST API endpoint for authenticating to Tableau
router.post('/auth', async (req, res) => {

    try {
        //  Get the login credentails from the POST request
        let tableauUrl = req.body.tableauUrl,
            siteName = req.body.siteName ? req.body.siteName : '',
            patName = req.body.pat.name,
            patSecret = req.body.pat.secret;

        //  Make sure all parameters are supplied
        if (!tableauUrl) {
            res.send( { error: "Error: parameter 'tableauUrl' not provided" } );
            return;
        } else if (!patName) {
            res.send( { error: "Error: parameter 'pat.name' not provided" } );
            return;
        } else if (!patSecret) {
            res.send( { error: "Error: parameter 'pat.secret' not provided" } );
            return;
        }

        //  Get the tableau server/online details
        let tableauLogin = await tableauHelper.login(url=tableauUrl, siteName=siteName, patName=patName, patSecret=patSecret);

        //  All went well, send a response
        res.send(tableauLogin)
    } catch (error) {
        console.log(error)
        res.send({
            error: error
        })
    }
})

//  REST API endpoint for searching Tableau for dashboards
router.post('/search', async (req, res) => {

    try {
        //  Get the login credentails from the POST request
        let tableauUrl = req.body.tableauUrl,
            token = req.body.token,
            searchTerm = req.body.searchTerm;

        //  Make sure all parameters are supplied
        if (!tableauUrl) {
            res.send( { error: "Error: parameter 'tableauUrl' not provided" } );
            return;
        } else if (!token) {
            res.send( { error: "Error: parameter 'token' not provided" } );
            return;
        } else if (!searchTerm) {
            res.send( { error: "Error: parameter 'searchTerm' not provided" } );
            return;
        }

        //  Get the tableau server/online details
        let dashboards = await tableauHelper.search(searchTerm=searchTerm, url=tableauUrl, token=token);

        //  All went well, send a response
        res.send(dashboards)
    } catch (error) {
        console.log(error)
        res.send({
            error: error
        })
    }
})

//  REST API endpoint for searching Tableau for dashboards
router.post('/getDashboard', async (req, res) => {

    try {
        //  Get the login credentails from the POST request
        let tableauUrl = req.body.tableauUrl,
            token = req.body.token,
            siteId = req.body.siteId,
            dashboardId = req.body.dashboardId;

        //  Make sure all parameters are supplied
        if (!tableauUrl) {
            res.send( { error: "Error: parameter 'tableauUrl' not provided" } );
            return;
        } else if (!token) {
            res.send( { error: "Error: parameter 'token' not provided" } );
            return;
        } else if (!siteId) {
            res.send( { error: "Error: parameter 'siteId' not provided" } );
            return;
        } else if (!dashboardId) {
            res.send( { error: "Error: parameter 'dashboardId' not provided" } );
            return;
        }

        //  Get the tableau server/online details
        let image = await tableauHelper.getDashboard(dashboardId=dashboardId, url=tableauUrl, siteId=siteId, token=token);

        //  All went well, just forward the response from Tableau
        res.set('Content-Type', 'image/png')
        res.send(image);

    } catch (error) {
        console.log(error)
        res.send({
            error: error
        })
    }
})

module.exports = router;