// ==UserScript==
// @name         LSS-Fahrzeuge aneinanderbinden
// @namespace    https://www.leitstellenspiel.de/
// @version      2.0
// @description  Bindet Fahrzeuge andeinander und setzt automatisch die Checkbox wenn das andere ausgewählt wird.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

// Funktion zum Lesen der vorhandenen Fahrzeuge über die API
async function getVehicles() {
  const response = await fetch('https://www.leitstellenspiel.de/api/vehicles');
  const data = await response.json();
  return data;
}

// Funktion zum Speichern der ID-Paare im Local Storage
function saveIDPair(fahrzeug1ID, fahrzeug2ID) {
  const existingPairs = JSON.parse(localStorage.getItem('vehiclePairs')) || [];
  existingPairs.push({ fahrzeug1ID, fahrzeug2ID });
  localStorage.setItem('vehiclePairs', JSON.stringify(existingPairs));
}

// Funktion zum Laden der ID-Paare aus dem Local Storage
function loadIDPairs() {
  const existingPairs = JSON.parse(localStorage.getItem('vehiclePairs')) || [];
  return existingPairs;
}

// Funktion zum Überprüfen der Checkboxen der Fahrzeuge und Auslösen des "change" Events
function syncCheckboxes() {
  const vehiclePairs = loadIDPairs();
  vehiclePairs.forEach(async (pair) => {
    const checkbox1 = document.getElementById('vehicle_checkbox_' + pair.fahrzeug1ID);
    const checkbox2 = document.getElementById('vehicle_checkbox_' + pair.fahrzeug2ID);

    if (checkbox1 && checkbox2) {
      if (checkbox1.checked && !checkbox2.checked) {
        checkbox2.checked = true; // Checkbox 2 auswählen
        checkbox2.dispatchEvent(new Event('change', { bubbles: true })); // "change" Event auslösen
      } else if (!checkbox1.checked && checkbox2.checked) {
        checkbox1.checked = true; // Checkbox 1 auswählen
        checkbox1.dispatchEvent(new Event('change', { bubbles: true })); // "change" Event auslösen
      }
    }
  });
}

// Überwachung der Checkboxen bei Änderungen
document.addEventListener('change', syncCheckboxes);

// Überwachung der Checkboxen bei Aktualisierungen durch das System
setInterval(syncCheckboxes, 1000); // Überprüfung alle 1 Sekunde (kann angepasst werden)

// Überprüfung der URL und Einfügen der Fahrzeug-ID-Eingabefelder
const urlRegex = /https:\/\/www.leitstellenspiel.de\/vehicles\/(\d+)\/edit/;
const match = window.location.href.match(urlRegex);

if (match) {
  const vehicleID = match[1];

  const inputContainer = document.createElement('div');
  inputContainer.innerHTML = `
    <label for="vehicle2ID">An dieses Fahrzeug fest ankoppeln:</label>
    <input type="text" id="vehicle2ID" name="vehicle2ID" list="vehicleList">
    <datalist id="vehicleList"></datalist>
    <button id="saveButton">Speichern</button>
  `;

  document.body.appendChild(inputContainer);

  const saveButton = document.getElementById('saveButton');
  saveButton.addEventListener('click', async () => {
    const vehicle2IDInput = document.getElementById('vehicle2ID');
    const vehicle2ID = vehicle2IDInput.value.trim();

    if (vehicle2ID) {
      const vehicles = await getVehicles();
      const vehicleIDs = vehicles.map((vehicle) => vehicle.id.toString());
      const vehicleCaptions = vehicles.map((vehicle) => vehicle.caption);

      if (vehicleIDs.includes(vehicle2ID) || vehicleCaptions.includes(vehicle2ID)) {
        saveIDPair(vehicleID, vehicle2ID);
        alert('ID-Paar erfolgreich gespeichert!');
        vehicle2IDInput.value = '';
      } else {
        alert('Fahrzeug-ID existiert nicht!');
      }
    } else {
      alert('Bitte gib eine Fahrzeug-ID ein!');
    }
  });

  // Vorschläge für Fahrzeug-IDs anzeigen
  const vehicle2IDInput = document.getElementById('vehicle2ID');
  vehicle2IDInput.addEventListener('input', async () => {
    const vehicles = await getVehicles();
    const vehicleList = document.getElementById('vehicleList');
    vehicleList.innerHTML = '';

    const userInput = vehicle2IDInput.value.trim().toLowerCase();

    vehicles.forEach((vehicle) => {
      const option = document.createElement('option');
      const vehicleID = vehicle.id.toString();
      const vehicleCaption = vehicle.caption.toLowerCase();

      if (vehicleID.includes(userInput) || vehicleCaption.includes(userInput)) {
        option.value = vehicleID;
        option.textContent = `${vehicleCaption} (${vehicleID})`;
        vehicleList.appendChild(option);
      }
    });
  });
}
