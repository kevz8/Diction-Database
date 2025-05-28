/*
 * These functions below are for various webpage functionalities. 
 * Each function serves to process data on the frontend:
 *      - Before sending requests to the backend.
 *      - After receiving responses from the backend.
 * 
 * To tailor them to your specific needs,
 * adjust or expand these functions to match both your 
 *   backend endpoints 
 * and 
 *   HTML structure.
 * 
 */


// This function checks the database connection and updates its status on the frontend.
async function checkDbConnection() {
    const statusElem = document.getElementById('dbStatus');
    const loadingGifElem = document.getElementById('loadingGif');

    const response = await fetch('/check-db-connection', {
        method: "GET"
    });

    // Hide the loading GIF once the response is received.
    loadingGifElem.style.display = 'none';
    // Display the statusElem's text in the placeholder.
    statusElem.style.display = 'inline';

    response.text()
    .then((text) => {
        statusElem.textContent = text;
    })
    .catch((error) => {
        statusElem.textContent = 'connection timed out';  // Adjust error handling if required.
    });
}

// Fetches data from the demotable and displays it.
async function fetchAndDisplayWords () {
    const tableElement = document.getElementById('demotable');
    const tableBody = tableElement.querySelector('tbody');

    const response = await fetch('/dictionary', {
        method: 'GET'
    });

    const responseData = await response.json();
    const demotableContent = responseData.data;

    // Always clear old, already fetched data before new fetching process.
    if (tableBody) {
        tableBody.innerHTML = '';
    }

    demotableContent.forEach(user => {
        const row = tableBody.insertRow();
        user.forEach((field, index) => {
            const cell = row.insertCell(index);
            cell.textContent = field;
        });
    });
}

// Fetches data from the demotable and displays it.
async function fetchAndDisplayLanguages () {
    const tableLElement = document.getElementById('languageTable');
    const tableLBody = tableLElement.querySelector('tbody');

    const response = await fetch('/language', {
        method: 'GET'
    });

    const responseData = await response.json();
    const languageContent = responseData.data;

    // Always clear old, already fetched data before new fetching process.
    if (tableLBody) {
        tableLBody.innerHTML = '';
    }

    languageContent.forEach(user => {
        const row = tableLBody.insertRow();
        user.forEach((languageContext, index) => {
            const cell2 = row.insertCell(index);
            cell2.textContent = languageContext;
        });
    });
}

// This function resets or initializes the demotable.
async function resetDictionary() {
    const response = await fetch("/initiate-dictionary", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('resetResultMsg');
        messageElement.textContent = "Dictionary initiated successfully!";
        fetchTableData();
    } else {
        alert("Error initiating table!");
    }
}

// // Inserts new records into the demotable.
// async function insertWord(event) {
//     event.preventDefault();

//     const spelling = document.getElementById('insertId').value;

//     const response = await fetch('/insert-word', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             spelling: spelling
//         })
//     });

//     const responseData = await response.json();
//     const messageElement = document.getElementById('insertResultMsg');

//     if (responseData.success) {
//         messageElement.textContent = "Word inserted successfully!";
//         fetchTableData();
//     } else {
//         messageElement.textContent = "Error inserting word!";
//     }
// }

// Finds and returns definition of a word
async function findDefinition(event) {
    event.preventDefault();
    const messageElement = document.getElementById('tables');
    const word = document.getElementById('wordId').value?.trim()?.toLowerCase() || '';
    if (typeof word !== 'string' || word.trim().length >= 100) { // check length of word
        messageElement.textContent = "Invalid input!";
        return;
    }
    const response = await fetch('/find-definition', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            word: word
        })
    });

    const responseData = await response.json();


    if (responseData.success) {
        messageElement.innerHTML = `<table border='1'><thead><tr><th>Word</th><th>Definition</th></tr></thead><tr><td>${word}</td><td>${responseData.definition}</td></tr></table>`;
    } else {
        messageElement.textContent = "Definition not found!";
    }
}

async function searchWords(event) {
    event.preventDefault();
    const messageElement = document.getElementById('tables');
    const queries = [];

    for (let i = 1; i < 4; i++) {
        const attribute = document.getElementById('attribute' + i).value;
        let operation = null;
        if (i !== 3) {
            operation = document.getElementById('operation' + i).value;
        }
        const value = document.getElementById('value' + i).value.trim();
        if (value) {
            if (attribute === 'Num_characters' && isNaN(Number(value))) {
                messageElement.textContent = "Invalid input! Only numbers are accepted.";
                return;
            }
            if (attribute === 'Num_characters' && !isNaN(Number(value)) && (value <= 0)) {
                messageElement.textContent = "Invalid input! Number must be 1 or larger.";
                return;
            }
            queries.push({attribute, operation, value});
        }
    }

    const response = await fetch('/search-words', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            queries: queries
        })
    });

    const responseData = await response.json();

    if (responseData.success) {
        messageElement.innerHTML = "<table border='1'><thead><tr><th>Word</th></tr></thead>" + responseData.words.map(row => `<tr><td>${row[0]}</td></tr>`).join('') + '</table>';
    } else {
        messageElement.textContent = "Words not found!";
    }
}

async function deleteWord(event) {
    event.preventDefault();

    const word = document.getElementById("deleteOldName").value?.trim()?.toLowerCase();

    const response = await fetch('/delete-word', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            word: word
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('deleteNameResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Successfully deleted word!";
        fetchTableData();
    } else {
        messageElement.textContent = "Error deleting word!";
    }
}

// Updates names in the demotable.
async function addContext(event) {
    event.preventDefault();

    const word = document.getElementById('context1').value?.trim()?.toLowerCase();
    const sentence = document.getElementById('context2').value?.trim();
    const sentenceSource = document.getElementById('context3').value?.trim();
    const definition = document.getElementById('context4').value?.trim();
    const lexicalCategory = document.getElementById('context5').value?.trim();
    const region = document.getElementById('context6').value?.trim();
    const ethnicGroups = document.getElementById('context7').value?.trim();
    const languageFamily = document.getElementById('context8').value?.trim();
    const wordOrder = document.getElementById('context9').value?.trim();
    const language = document.getElementById('context10').value?.trim();
    const ancestor = document.getElementById('context11').value?.trim();

    const response = await fetch('/add-context', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            word: word,
            sentence: sentence,
            sentenceSource: sentenceSource,
            definition: definition,
            lexicalCategory: lexicalCategory,
            region: region,
            ethnicGroups: ethnicGroups,
            languageFamily: languageFamily,
            wordOrder: wordOrder,
            language: language,
            ancestor: ancestor
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('contextWordMsg');

    if (responseData.success) {
        messageElement.textContent = "Successfully added context!";
        fetchTableData();
    } else {
        messageElement.textContent = "Error: Make sure a valid Language and Language Ancestor is used!";
    }
}

async function updateLanguageContext(event) {
    event.preventDefault();

    const key = document.getElementById('updateOldName')?.value.trim();
    const updateAttribute = document.getElementById('updateSelect').value;
    const newData = document.getElementById('updateNewName')?.value.trim();

    const response = await fetch('/update-language-context', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            key: key,
            updateAttribute: updateAttribute,
            newData: newData
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('updateNameResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Successfully updated Language context!";
        fetchTableData();
    } else {
        if (updateAttribute === 'Ancestor') {
            messageElement.textContent = "Error: Make sure you inputted a valid language and language ancestor!";
        } else {
            messageElement.textContent = "Error: Make sure you input a valid language!";
        }
    }
}

// Fetch langauges in the table.
async function getLanguageContext(attribute) {

    const response = await fetch('/language-context', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            attribute: attribute
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('tables');

    if (responseData.success) {
        if (attribute === 'Name') {
            messageElement.innerHTML = '<table border="1"><thead><tr><th>Language</th></tr></thead>' + responseData.data.map(row => `<tr><td>${row[0]}</td></tr>`).join('') + '</table>';
        } else if (attribute === 'DISTINCT Word_order') {
            messageElement.innerHTML = '<table border="1"><thead><tr><th>Word Order</th></tr></thead>' + responseData.data.map(row => `<tr><td>${row[0]}</td></tr>`).join('') + '</table>';
        } else if (attribute === 'DISTINCT Ancestor') {
            messageElement.innerHTML = '<table border="1"><thead><tr><th>Ancestor</th></tr></thead>' + responseData.data.map(row => `<tr><td>${row[0]}</td></tr>`).join('') + '</table>';
        } else if (attribute === 'DISTINCT Word_order, Ancestor') {
            messageElement.innerHTML = '<table border="1"><thead><tr><th>Word Order</th><th>Ancestor</th></tr></thead>' + responseData.data.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`).join('') + '</table>';
        } else if (attribute === 'Name, Word_order') {
            messageElement.innerHTML = '<table border="1"><thead><tr><th>Language</th><th>Word Order</th></tr></thead>' + responseData.data.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`).join('') + '</table>';
        } else if (attribute === 'Name, Ancestor') {
            messageElement.innerHTML = '<table border="1"><thead><tr><th>Language</th><th>Ancestor</th></tr></thead>' + responseData.data.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`).join('') + '</table>';
        } else {
            messageElement.innerHTML = '<table border="1"><thead><tr><th>Language</th><th>Word Order</th><th>Ancestor</th></tr></thead>' + responseData.data.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join('') + '</table>';
        }
    } else {
        messageElement.textContent = "Error retrieving data";
    }
}

// Counts rows in the demotable.
// Modify the function accordingly if using different aggregate functions or procedures.
async function countDemotable() {
    const response = await fetch("/count-demotable", {
        method: 'GET'
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('tables');

    if (responseData.success) {
        messageElement.innerHTML = '<table border="1"><thead><tr><th>Language</th><th>Length</th></tr></thead>' + responseData.data.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`).join('') + '</table>';
    } else {
        alert("Error in retrieving values!");
    }
}

async function countDemotable1() {
    const response = await fetch("/count-demotable1", {
        method: 'GET'
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('tables');

    if (responseData.success) {
        messageElement.innerHTML = '<table border="1"><thead><tr><th>Language</th><th>Average Length</th></tr></thead>' + responseData.data.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`).join('') + '</table>';
    } else {
        alert("Error in retrieving values!");
    }
}

async function countDemotable2() {
    const response = await fetch("/count-demotable2", {
        method: 'GET'
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('tables');

    if (responseData.success) {
        messageElement.innerHTML = '<table border="1"><thead><tr><th>Language</th></tr></thead>' + responseData.data.map(row => `<tr><td>${row[0]}</td></tr>`).join('') + '</table>';
    } else {
        alert("Error in retrieving values!");
    }
}

async function divisionTable() {
    const response = await fetch("/division-table", {
        method: 'GET'
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('tables');

    if (responseData.success) {
        messageElement.innerHTML = '<table border="1"><thead><tr><th>Language</th></thead>' + responseData.data.map(row => `<tr><td>${row[0]}</td></tr>`).join('') + '</table>';
    } else {
        alert("Error in retrieving values!");
    }
}

// ---------------------------------------------------------------
// Initializes the webpage functionalities.
// Add or remove event listeners based on the desired functionalities.
window.onload = function() {
    checkDbConnection();
    fetchTableData();
    document.getElementById("resetDemotable").addEventListener("click", resetDictionary);
    // document.getElementById("insertDemotable").addEventListener("submit", insertWord);
    document.getElementById("wordDefinition").addEventListener("submit", findDefinition);
    document.getElementById("selectDemotable").addEventListener("submit", searchWords);
    document.getElementById("deleteNameDemotable").addEventListener("submit", deleteWord);
    document.getElementById("contextWord").addEventListener("submit", addContext);
    document.getElementById("updataNameDemotable").addEventListener("submit", updateLanguageContext)
    document.getElementById("onlyLanguage").addEventListener("click", () => getLanguageContext('Name'));
    document.getElementById("onlyAncestor").addEventListener("click", () => getLanguageContext('DISTINCT Ancestor'));
    document.getElementById("onlyWordOrder").addEventListener("click", () => getLanguageContext('DISTINCT Word_order'));
    document.getElementById("ancestorWordOrder").addEventListener("click", () => getLanguageContext('DISTINCT Word_order, Ancestor'));
    document.getElementById("wordOrder").addEventListener("click", () => getLanguageContext('Name, Word_order'));
    document.getElementById("ancestor").addEventListener("click", () => getLanguageContext('Name, Ancestor'));
    document.getElementById("all").addEventListener("click", () => getLanguageContext('Name, Word_order, Ancestor'));
    document.getElementById("countDemotable").addEventListener("click", () => countDemotable());
    document.getElementById("countDemotable1").addEventListener("click", () => countDemotable1());
    document.getElementById("countDemotable2").addEventListener("click", () => countDemotable2());
    document.getElementById("divisionTable").addEventListener("click", () => divisionTable());
};

// General function to refresh the displayed table data. 
// You can invoke this after any table-modifying operation to keep consistency.
function fetchTableData() {
    fetchAndDisplayWords();
    fetchAndDisplayLanguages ()
}
