const axios = require('axios');
const { json } = require('body-parser');

//  Placeholders for shared variables
const apiVersion = '3.15';

//  Generate headers for API calls to Tableau
const getHeaders = (token=null) => {
    let headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    if (token) {
        headers['X-Tableau-Auth'] = token;
    }
    return headers;
}

//  Make API call asynchronously
const sendRequest = async (options) => {

    //  Try to make the API call
    try {
        let response = await axios(options);
        return response.data;
    } catch (error) {

        //  API call failed, let's look for more details
        let msg = 'Error: Tableau threw an error while making a REST API call';
        try {
            //  Tableau should return an error message in the payload's response
            console.log(error.response.data);
            msg = error.response.data.error.summary + ': ' + error.response.data.error.detail;
        } catch {
            //  We got back a data structure that we weren't expecting, log the entire response
            console.log('Error: Could not parse error message returned from API call')
            console.log(JSON.stringify(error))
        }

        //  Return the error message, to display for the end user
        return {
            "error": msg
        }
    }
}

//  Define a class that handles making the Tableau REST API calls
const TableauHelper = {

    //  Authenticate to Tableau Cloud/Server
    login: async (url, siteName, patName, patSecret) => {

        //  Login URL & payload
        const config = {
            method: 'POST',
            url: `${url}/api/${apiVersion}/auth/signin`,
            headers: getHeaders(),
            data: {
                "credentials": {
                    "personalAccessTokenName": patName,
                    "personalAccessTokenSecret": patSecret,
                    "site": {
                        "contentUrl": siteName
                    }
                }
            }
        }

        //  Make the API call
        let response = await sendRequest(config);

        //  Check for errors
        if (response.error){
            return response;
        } else {

            // Return the api token & site id
            return {
                'token': response.credentials.token,
                'siteId': response.credentials.site.id
            }
        }
    },

    //  Query Tableau for a dashboard, using Search API
    search: async (searchTerm, url, token) => {

        // URL & payload
        const config = {
            method: 'GET',
            url: `${url}/api/-/search?terms=${searchTerm}&filter=type:eq:view`,
            headers: getHeaders(token)
        }

        //  Make the API call
        let response = await sendRequest(config);

        //  Check for errors
        if (response.error){
            return response;
        } else {

            // Return only views that have a type of 'dashboard'
            try {
                return response.hits.items.filter(view => view.content.sheetType==='dashboard')
            } catch (error) {
                //  We got results back from the API, but not in the structure we expected
                console.log(error)
                console.log(JSON.stringify(response))
                //  Return an empty list for now...
                return []
            }
        }

    },

    //  Retrieve the image for a given Dashboard ID
    getDashboard: async (dashboardId, url, siteId, token) => {
        
        // URL & payload
        const config = {
            method: 'GET',
            responseType: 'arraybuffer',
            url: `${url}/api/${apiVersion}/sites/${siteId}/views/${dashboardId}/image?resolution=high`,
            headers: getHeaders(token)
        }

        //  Make the API call
        let response = await sendRequest(config);

        //  Check for errors
        if (response.error){
            return response;
        } else {
            //  Convert the arraybuffer to base64, and specify that this is PNG data
            return `data:image/png;base64,${response.toString('base64')}`;
        }
    }
}

module.exports = TableauHelper;