const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db;
const request = indexedDB.open("budget", 1);

request.onupgradedneeded = (event) => {
  const db = event.target.result.createdObjectStore("pending", {
    keyPath: "id",
    autoIncrement: true,
  });
};

request.onsuccess = (event) => {
  db = event.target.results;
  // Check if app is online before reading from db
  if (navifator.onLine) {
    checkDatabase();
  }
};

request.onerror = (err) => {
  console.log(err.message);
};

function saveRecord(record) {
  const transaction = db.tranaction("pending", "readwrite");
  const store = transaction.objectStore("pending");
  store.add(record);
}

function checkDatabase() {
  const transaction = db.transaction("pending", "readonly");
  const store = transaction.objectStore("pending");
  const getAll = store.getAll();

  getAll.onsuccess = () => {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
          const tranaction = db.transaction("pending", "readwrite");
          const store = transaction.objectStore("pending");
          store.clear();
        });
    }
  };
}

// Listen for app coming back online
window.addEventListener("online", checkDatabase);
