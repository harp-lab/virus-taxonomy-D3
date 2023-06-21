
// Create the ICTV namespace if it doesn't already exist.
if (!window.ICTV) { window.ICTV = {}; }

window.ICTV.SearchPanel = function (resultSelectionCallback_, resultsSelector_, searchPanelSelector_, taxonomyURL_) {

    // Maintain a copy of "this" to avoid scope ambiguity.
    const self = this;

    // The current release will be set when a release is selected.
    this.currentRelease = null;

    // This prefix will be added to all error messages.
    this.errorPrefix = "Error in SearchPanel:";

    // Validate the parameters and populate member variables.
    if (typeof(resultSelectionCallback_) === undefined) { throw new Error(`${this.errorPrefix} Invalid result selection callback parameter`); }
    this.resultSelectionCallback = resultSelectionCallback_;

    if (!resultsSelector_) { throw new Error(`${this.errorPrefix} Invalid results selector parameter`); }
    this.resultsSelector = resultsSelector_;
    
    if (!searchPanelSelector_) { throw new Error(`${this.errorPrefix} Invalid search panel selector parameter`); }
    this.searchPanelSelector = searchPanelSelector_;

    if (!taxonomyURL_) { throw new Error(`${this.errorPrefix} Invalid taxonomy URL parameter`); }
    this.taxonomyURL = taxonomyURL_;

    // Define the collection of DOM elements.
    this.elements = {
        clearButton: HTMLButtonElement,
        includeAllReleases: HTMLInputElement,
        resultsPanel: HTMLElement,
        searchButton: HTMLButtonElement,
        searchPanel: HTMLElement,
        searchText: HTMLInputElement
    }


    // Clear the search text, uncheck  "include all releases", and clear the results panel.
    this.clearSearch = async () => {
        self.elements.includeAllReleases.checked = false;
        self.elements.resultsPanel.innerHTML = "";
        self.elements.searchText.value = "";
    }

    // Create, display, and throw an error with the message provided.
    this.createError = (message_) => {
        const entireMessage = `${self.errorPrefix} ${message_}`;
        alert(entireMessage);
        throw new Error(entireMessage);
    }

    // Return the display text parameter and a spinner icon.
    this.getSpinnerHTML = (displayText_) => {
        return `<i class="fa fa-spinner fa-spin spinner-icon"></i> <span class="spinner-message">${displayText_}</span>`;
    }

    // Initialize the object
    this.initialize = async () => {

        // Initialize the collection of DOM Elements.
        self.elements = {
            clearButton: null,
            includeAllReleases: null,
            resultsPanel: null,
            searchButton: null,
            searchPanel: null,
            searchText: null
        }

        //------------------------------------------------------------------------------------------------------
        // Search panel
        //------------------------------------------------------------------------------------------------------
        self.elements.searchPanel = document.querySelector(self.searchPanelSelector);
        if (!self.elements.searchPanel) { return self.createError("Invalid search panel element"); }

        // The HTML to add to the search panel.
        const html = 
            `<div class="input-group search-controls">
                <input type="text" class="form-control search-text" placeholder="Search taxonomy..." />
                <button class="btn search-button"><i class="fa fa-search"></i> Search</button>
                <button class="btn clear-button"><i class="fa fa-times"></i> Reset</button>
            </div>
            <div class="all-releases-row">
                <input type="checkbox" class="include-all-releases" />
                <label>Include all ICTV releases</label></div>
            </div>`;

        self.elements.searchPanel.innerHTML = html;

        //------------------------------------------------------------------------------------------------------
        // Clear/reset button
        //------------------------------------------------------------------------------------------------------
        self.elements.clearButton = document.querySelector(`${self.searchPanelSelector} .clear-button`);
        if (!self.elements.clearButton) { return self.createError("Invalid clear button element"); }

        self.elements.clearButton.addEventListener("click", async () => {
            await self.clearSearch();
            return;
        })

        //------------------------------------------------------------------------------------------------------
        // "Include all releases" checkbox
        //------------------------------------------------------------------------------------------------------
        self.elements.includeAllReleases = document.querySelector(`${self.searchPanelSelector} .include-all-releases`);
        if (!self.elements.includeAllReleases) { return self.createError("Invalid include all releases element"); }

        self.elements.includeAllReleases.addEventListener("keypress", async (event_) => {
            if (event_.key === "Enter") {
                event_.preventDefault();
                event_.stopPropagation();

                await self.search();
            }
            return true;
        })

        //------------------------------------------------------------------------------------------------------
        // Results panel
        //------------------------------------------------------------------------------------------------------
        self.elements.resultsPanel = document.querySelector(self.resultsSelector);
        if (!self.elements.resultsPanel) { return self.createError("Invalid results panel element"); }

        //------------------------------------------------------------------------------------------------------
        // Search button
        //------------------------------------------------------------------------------------------------------
        self.elements.searchButton = document.querySelector(`${self.searchPanelSelector} .search-button`);
        if (!self.elements.searchButton) { return self.createError("Invalid search button element"); }

        self.elements.searchButton.addEventListener("click", async () => {
            await self.search();
            return;
        })

        //------------------------------------------------------------------------------------------------------
        // Search text
        //------------------------------------------------------------------------------------------------------
        self.elements.searchText = document.querySelector(`${self.searchPanelSelector} .search-text`);
        if (!self.elements.searchText) { return self.createError("Invalid search text element"); }

        // Pressing the enter key while the focus is on the search field is the same as clicking the search button.
        self.elements.searchText.addEventListener("keypress", async (event_) => {
            if (event_.key === "Enter") {
                event_.preventDefault();
                event_.stopPropagation();

                // Perform the search
                await self.search();
            }
            return true;
        })

        // Put focus on the search text.
        self.elements.searchText.focus();
    }


    // Search for the user-provided text and display the results.
    this.search = async () => {

        // Get the search text entered by the user.
        let searchText = self.elements.searchText.value;
        if (!searchText) { alert("Please enter search text"); return false; }

        // Should we include all releases or just the current release?
        const includeAllReleases = self.elements.includeAllReleases.checked;
        
        // Disable the search and reset buttons.
        self.elements.searchButton.disabled = true;
        self.elements.clearButton.disabled = true;

        // Clear the search results and display the spinner.
        self.elements.resultsPanel.innerHTML = self.getSpinnerHTML("Searching...");

        // TODO: make sure the results panel is visible!
        
        // Perform the search by calling the taxonomy web service.
        const response = await jQuery.ajax({
            dataType: "json",
            processData: true,
            type: "POST",
            url: self.taxonomyURL,
            data: {
                action_code: "search_taxonomy",
                include_all_releases: includeAllReleases,
                msl_release: self.currentRelease,
                search_text: searchText
            },
            success: (data_) => {
                console.log("in success data = ", data_)
                return data_;
            }
        });

        // Re-enable the clear and search buttons.
        self.elements.clearButton.disabled = false;
        self.elements.searchButton.disabled = false;
        

        let resultCount = 0;

        // Generate HTML for the search results table.
        let html =
            `<table class="search-results-table cell-border compact stripe">
                <thead>
                    <tr class="header-row">
                        <th data-orderable="false"></th>
                        <th>Release</th>
                        <th>Rank</th>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody>`;  

        if (response && response.searchResults) {
            response.searchResults.forEach((searchResult_) => {
                html +=
                    `<tr>
                        <td class="view-ctrl">
                            <button class="slim-btn view-search-result-ctrl"
                                data-id="${searchResult_.taxnodeID}" 
                                data-lineage="${searchResult_.lineage}" 
                                data-release="${searchResult_.treeName}">View</button>
                        </td>
                        <td class="release-name">${searchResult_.treeName}</td>
                        <td class="level-name">${searchResult_.levelName}</td>
                        <td class="result-html">${searchResult_.lineageHTML}</td>
                    </tr>`;
                    
                resultCount += 1;
            });
        }

        html += "</tbody></table>";

        if (resultCount < 1) { html = "No results"; }
        
        // Display the search results HTML.
        self.elements.resultsPanel.innerHTML = html;
        
        // Add a click event handler to the results panel.
        self.elements.resultsPanel.addEventListener("click", async (event_) => {

            // Get the closest button Element to the target Element.
            const buttonEl = event_.target.closest("button");
            if (!buttonEl) { return; }
            
            event_.preventDefault();
            event_.stopPropagation();

            // Get the button's lineage attribute.
            const lineage = buttonEl.getAttribute("data-lineage");
            if (!lineage) { return self.createError("Invalid lineage"); }

            const releaseNumber = buttonEl.getAttribute("data-release");
            if (!releaseNumber) { return self.createError("Invalid releaseNumber attribute"); }

            // Pass the lineage and release number to the result selection callback.
            self.resultSelectionCallback(lineage, releaseNumber);

            return false;
        })

        // Convert the table into a DataTable instance.
        jQuery(`${self.resultsSelector} .search-results-table`).DataTable({
            dom: "ltip",
            "order": [], // No ordering is applied by DataTables during initialisation.
            searching: false
        });
           
    }

}
