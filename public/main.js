
//  Define our web app as a module
const MyApp = () => {

    //  Constants from index.html
    const section1 = {
        input: 'cb1',
        form: 'configForm',
        button: 'saveConfigButton'
    }
    const section2 = {
        input: 'cb2',
        form: 'searchForm',
        image: 'loading',
        button: 'searchButton',
        tableBody: 'dashboardList'
    }
    const section3 = {
        input: 'cb3',
        title: 'dashboardName',
        img: 'dashboardImage'
    }
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

    //  Helper function to clear an HTML element's children
    const removeAllChildNodes = (parent) => {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }

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

        //  Store the form & session data in localstorage
        setStorage(storage.formData, data);
        setStorage(storage.sessionData, results)

        //  Open the next section
        let section2radio = document.getElementById(section2.input);
        section2radio.checked = true;
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
            row.onclick = selectDashboard;

            //  Append the row to the table
            table.appendChild(row)
        });

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

        //  Populate the image in Section 3' <img>
        let section3image = document.getElementById(section3.img);
        section3image.src = results;

        //  Populate the dashboard's title
        let section3title = document.getElementById(section3.title);
        section3title.innerText = dashboardTitle;

        //  Hide the loading image
        loading.className = '';

        //  Open section 3
        let section3radio = document.getElementById(section3.input);
        section3radio.checked = true;
    }

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

            //  Clear any saved info from a previes session
            delStorage(storage.sessionData)

            //  Retrieve any settings from local storage
            let storedSettings = getStorage(storage.formData);
            if (storedSettings){
                //  Populate the form in section 1
                let form = document.getElementById(section1.form);
                form.elements['tableauUrl'].value = storedSettings.tableauUrl;
                form.elements['siteName'].value = storedSettings.siteName;
                form.elements['patName'].value = storedSettings.pat.name;
                form.elements['patSecret'].value = storedSettings.pat.secret;
            }
        }
    }
}