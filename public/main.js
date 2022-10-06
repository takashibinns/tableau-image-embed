
//  Define our web app as a module
const MyApp = () => {

    /****************************************************************/
    /*  MyApp manipulates HTML elements from index.html             */
    /*  The below constants, define the IDs of specific elements    */
    /****************************************************************/

    //  Step 1: Configuration
    const section1 = {
        input: 'cb1',
        form: 'configForm',
        button: 'saveConfigButton'
    }
    //  Step 2: Select a dashboard
    const section2 = {
        input: 'cb2',
        form: 'searchForm',
        image: 'loading',
        button: 'searchButton',
        tableBody: 'dashboardList'
    }
    //  Step 3: Display dashboard as image
    const section3 = {
        input: 'cb3',
        title: 'dashboardName',
        img: 'dashboardImage'
    }
    //  Modal popup window
    const modal = {
        container: 'modal-popup',
        title: 'modal-title',
        message: 'modal-message',
        background: 'modal-bg'
    }

    /******************************************************************/
    /*  MyApp persists data in the browser's local storage            */
    /*  The below code relates to getting data in/out of localStorage */
    /******************************************************************/

    //  Define the keys for storing data
    const storage = {
        formData: 'config',
        sessionData: 'session'
    }

    //  Helper function to store config data in localStorage
    const setStorage = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    }

    //  Helper function to retrieve config data from localStorage
    const getStorage = (key) => {
        return(JSON.parse(localStorage.getItem(key)))
    }

    //  Helper function to clear a key pair form localStorage
    const delStorage = (key) => {
        localStorage.removeItem(key)
    }

    /****************************************************************/
    /*  Modal popups functions                                      */
    /****************************************************************/

    //  Function to show a message in a modal window
    const showModal = (title, message, color) => {

        //  Set the title
        let mTitle = document.getElementById(modal.title);
        mTitle.innerText = title
        
        //  Set the message
        let mMessage = document.getElementById(modal.message);
        mMessage.innerText = message;

        //  Show the modal window
        let mModal = document.getElementById(modal.container);
        mModal.classList.add('open');
    }

    //  Function to hide the modal window
    const hideModal = () => {
        
        //  Hide  the modal window
        let mModal = document.getElementById(modal.container);
        mModal.classList.remove('open');
    }

    /****************************************************************/
    /*  Helper functions                                            */
    /****************************************************************/

    //  Helper function to generate headers for Fetch
    const getHeaders = (isImage=false) => {
        let myHeaders = new Headers();
        if (isImage) {
            myHeaders.append('Content-Type', 'img/png');
        } else {
            myHeaders.append('Accept', 'application/json');
            myHeaders.append('Content-Type', 'application/json');
        }
        return myHeaders;
    }

    //  Helper function to derive the URL for a given dashboard
    const getDashboardLink = (view) => {
        
        //  Need to get the tableau URL
        let config = getStorage(storage.formData);

        //  URL is slightly different, when using the default site (tableau server only)
        if (config.siteName.length > 0) {
            return `${config.tableauUrl}/#/site/${config.siteName}/views/${view.content.path}`
        } else {
            return `${config.tableauUrl}/#/views/${view.content.path}`
        }
    }

    //  Helper function to clear an HTML element's children
    const removeAllChildNodes = (parent) => {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }

    /****************************************************************/
    /*  Event handler functions                                     */
    /****************************************************************/

    //  OnClick of Section 1's save button
    const saveConfig = async (event) => {

        //  Stop the default behavior of form submissions
        event.preventDefault();

        //  Get the inputs from the form
        let formData = new FormData(document.getElementById(section1.form));
        const data  = {
            tableauUrl: formData.get('tableauUrl'),
            siteName: formData.get('siteName'),
            pat: {
                name: formData.get('patName'),
                secret: formData.get('patSecret')
            }
        }
        
        //  Authenticate to Tableau
        let response = await fetch('/api/auth', { method:'post', body: JSON.stringify(data), headers:getHeaders() })
        let results = await response.json();

        //  Handle errors
        if (response.status !== 200) {
            //  This web app returned a status other than OK
            showModal(title='Step 1: Authentication', message=response.statusText);
        } else if (results.error){
            //  There was a problem communicating with Tableau's REST API
            showModal(title='Step 1: Authentication', message=results.error)
        } else {
            /*  Successful API call                 */

            //  Store the form & session data in localstorage
            setStorage(storage.formData, data);
            setStorage(storage.sessionData, results)

            //  Open the next section
            let section2radio = document.getElementById(section2.input);
            section2radio.checked = true;
        }        
    }

    //  OnClick of Section 2's search button
    const search = async (event) => {

        //  Stop the default behavior of form submissions
        event.preventDefault();

        //  Show the loading image
        let loading = document.getElementById('loading');
        loading.className = 'active';

        //  Fetch data stored in local storage
        let config = getStorage(storage.formData);
        let session = getStorage(storage.sessionData);

        //  Get the inputs from the form
        let formData = new FormData(document.getElementById(section2.form));
        const data  = {
            tableauUrl: config.tableauUrl,
            searchTerm: formData.get('searchBar'),
            token: session.token
        }
        
        //  Use the Content Exploration API
        let response = await fetch('/api/search', {method:'post',body: JSON.stringify(data), headers:getHeaders()})
        let results = await response.json();

        //  Handle errors
        if (response.status !== 200) {
            //  This web app returned a status other than OK
            showModal(title='Step 2: Select a Dashboard', message=response.statusText);
        } else if (results.error){
            //  There was a problem communicating with Tableau's REST API
            showModal(title='Step 2: Select a Dashboard', message=results.error)
        } else {

            /*  Successful API call                 */

            //  Clear out any old list
            let table = document.getElementById(section2.tableBody);
            removeAllChildNodes(table);

            //  Populate a new list, based on the search results
            results.forEach(view => {
                
                //  Create the HTML elements for each column
                let c1 = document.createElement('td');
                c1.textContent = view.content.title;
                let c2 = document.createElement('td');
                c2.textContent = view.content.containerName;
                let c3 = document.createElement('td');
                c3.textContent = view.content.ownerName;

                //  Create the HTML element for the whole row
                let row = document.createElement('tr');
                row.appendChild(c1);
                row.appendChild(c2);
                row.appendChild(c3);
                row.attributes['dashboardId'] = view.content.luid;
                row.attributes['dashboardTitle'] = view.content.title;
                row.attributes['link'] = getDashboardLink(view);
                row.onclick = selectDashboard;

                //  Append the row to the table
                table.appendChild(row)
            });
        }

        //  Hide the loading image
        loading.className = '';
    }

    //  OnClick of Section 2's dashboards list
    const selectDashboard = async (event) => {

        //  Show the loading image
        let loading = document.getElementById('loading');
        loading.className = 'active';

        //  Fetch data stored in local storage
        let config = getStorage(storage.formData);
        let session = getStorage(storage.sessionData);

        //  Get the ID of the selected dashboard
        let row = event.target.parentNode;
        const dashboardId= row.attributes['dashboardId'];
        const dashboardTitle= row.attributes['dashboardTitle'];
        const dashboardLink= row.attributes['link'];
        if (!dashboardId){
            console.log("Error: no dashboard id found for this view")
            return;
        }

        //  Use the REST API to fetch the dashboard as an image
        const data  = {
            tableauUrl: config.tableauUrl,
            siteId: session.siteId,
            dashboardId: dashboardId,
            token: session.token
        }
        
        //  Use the Content Exploration API
        let response = await fetch('/api/getDashboard', {method:'post',body: JSON.stringify(data), headers:getHeaders()})
        let results = await response.text();

        //  Handle errors
        if (response.status !== 200) {
            //  This web app returned a status other than OK
            showModal(title='Step 3: Display dashboard as Image', message=response.statusText);
        } else if (results.error){
            //  There was a problem communicating with Tableau's REST API
            showModal(title='Step 3: Display dashboard as Image', message=results.error)
        } else {

            /*  Successful API call                 */

            //  Populate the image in Section 3' <img>
            let section3image = document.getElementById(section3.img);
            section3image.src = results;

            //  Add click handler, so users get sent to the full version of the dashboard
            section3image.onclick = (event) => {
                window.open(dashboardLink,'_blank');
            }
            section3image.style.cursor = 'pointer';

            //  Populate the dashboard's title
            let section3title = document.getElementById(section3.title);
            section3title.innerText = dashboardTitle;

            //  Open section 3
            let section3radio = document.getElementById(section3.input);
            section3radio.checked = true;
        }

        //  Hide the loading image
        loading.className = '';
    }

    /****************************************************************/
    /*  Public functions to expose                                  */
    /****************************************************************/
    return {

        //  Function to run when the web app first loads
        init: () => {

            //  Open the first section
            let section1radio = document.getElementById(section1.input);
            section1radio.checked = true;

            //  Add event handler for saving the config
            let section1form= document.getElementById(section1.form);
            section1form.onsubmit = saveConfig;

            //  Add event handler for saving the config
            let section2form= document.getElementById(section2.form);
            section2form.onsubmit = search;

            //  Add event handler for closing the modal window
            let modalBackground= document.getElementById(modal.background);
            modalBackground.onclick = hideModal;

            //  Clear any saved info from a previes session
            delStorage(storage.sessionData)

            //  Retrieve any settings from local storage
            let storedSettings = getStorage(storage.formData);
            if (storedSettings){
                //  User has filled out this form (section 1) before, populate values from localStorage
                let form = document.getElementById(section1.form);
                form.elements['tableauUrl'].value = storedSettings.tableauUrl;
                form.elements['siteName'].value = storedSettings.siteName;
                form.elements['patName'].value = storedSettings.pat.name;
                form.elements['patSecret'].value = storedSettings.pat.secret;
            }
        }
    }
}