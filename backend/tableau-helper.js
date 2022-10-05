const axios = require('axios');

//  Placeholders for shared variables
const apiVersion = '3.15';

//  Generate headers for API calls
const getHeaders = function(token=null) {
    let headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    if (token) {
        headers['X-Tableau-Auth'] = token;
    }
    return headers;
}

//  Base URL for Tableau Server/Cloud
const getBaseUrl = (siteId) => {
    //  REST API calls have a different base url, depending on what site is being used
    if (siteId && siteId.length>0){
        //  Using a named site
        return `${tableauBaseUrl}/api/${tableauApiVersion}/sites/${siteId}`;
    } else {
        //  Using the default site
        return `${tableauBaseUrl}/api/${tableauApiVersion}`;
    }
}

//  Safely get properties of a JSON object
function getProps(fn, defaultVal) {
    try {
      return fn();
    } catch (e) {
      return defaultVal;
    }
}

//  Make API call asynchronously
const sendRequest = async (options) => {

    try {
        let response = await axios(options);
        return response.data;
    } catch (error) {
        const msg = `Error: Tableau threw an error while making a REST API call`
        console.log(msg)
        let errorData = getProps(error.response.data.error, {'detail': msg})
        console.log(error.response)
        return {
            'error': errorData
        }
    }
}

//  Define a class that
const TableauHelper =
 {
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

        //  Handle the response
        if (response.error){
            return response.error;
        } else {
            // Get the api token and site id
            const token = response.credentials.token;
            const siteId = response.credentials.site.id;

            // Return the complete data object
            return {
                'token': token,
                'siteId': siteId
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

        //  Handle the response
        if (response.error){
            return response.error;
        } else {

            // Return only views that have a type of 'dashboard'
            return response.hits.items.filter(view => view.content.sheetType==='dashboard')
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

        //  Handle the response
        if (response.error){
            return response.error;
        } else {
            return `data:image/png;base64,${response.toString('base64')}`;
        }
    }
}


module.exports = TableauHelper;