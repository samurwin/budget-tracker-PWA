// variable to hold connection
let db;

// establish connection 
const request = indexedDB.open('budget-tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;

    // create object store
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;

    // if online, send data to api
    if (navigator.onLine) {
        uploadTransaction();
    };
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    // create transaction
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    // access objectStore
    const transactionObjectStore = transaction.objectStore('new_transaction');
    // add record to objectStore
    transactionObjectStore.add(record);
};

function uploadTransaction() {
    // open transaction
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    //access objectStore
    const transactionObjectStore = transaction.objectStore('new_transaction');
    // get all records
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function() {
        // if there is data in indexedDB send to api
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                };
                // open transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                const transactionObjectStore = transaction.objectStore('new_transaction');
                // clear objectStore
                transactionObjectStore.clear();

                alert('All saved transactions have been submitted!');
            })
            .catch(err => console.log(err));
        }
    };
}

// listen for app coming back online 
window.addEventListener('online', uploadTransaction);