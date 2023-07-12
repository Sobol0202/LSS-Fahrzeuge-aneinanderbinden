// ==UserScript==
// @name         LSS-Fahrzeuge aneinanderbinden
// @namespace    https://www.leitstellenspiel.de/
// @version      2.7
// @description  Bindet Fahrzeuge aneinander und setzt automatisch die Checkbox, wenn das andere ausgewählt wird.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

// Funktion zum Lesen der vorhandenen Fahrzeuge über die API
async function getVehicles() {
  const response = await fetch('https://www.leitstellenspiel.de/api/vehicles');
  const data = await response.json();
  //  console.log('API-Antwort:', data); // Konsolenausgabe der API-Antwort
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
  const existingPairs = loadIDPairs();
  const boundVehicle = existingPairs.find(
    (pair) => pair.fahrzeug1ID === vehicleID || pair.fahrzeug2ID === vehicleID
  );

  if (boundVehicle) {
    const boundVehicleID =
      boundVehicle.fahrzeug1ID === vehicleID ? boundVehicle.fahrzeug2ID : boundVehicle.fahrzeug1ID;
    const boundVehicleText = document.createElement('span');
    const boundVehicleCaption = await getCaptionByID(boundVehicleID);
    boundVehicleText.textContent = `Dieses Fahrzeug ist gebunden an das Fahrzeug: ${boundVehicleCaption}`;
    inputContainer.appendChild(boundVehicleText);

    boundVehicleText.addEventListener('click', () => {
      const confirmDisconnect = confirm('Soll die Verbindung wirklich getrennt werden?');

      if (confirmDisconnect) {
        const updatedPairs = existingPairs.filter((pair) => pair !== boundVehicle);
        localStorage.setItem('vehiclePairs', JSON.stringify(updatedPairs));
        alert('Die Verbindung wurde getrennt.');
        window.location.reload();
      }
    });
  } else {
    const vehicle2IDInput = document.createElement('input');
    vehicle2IDInput.type = 'text';
    vehicle2IDInput.id = 'vehicle2ID';
    vehicle2IDInput.name = 'vehicle2ID';
    vehicle2IDInput.setAttribute('list', 'vehicleList');

    const vehicleList = document.createElement('datalist');
    vehicleList.id = 'vehicleList';

    const saveButton = document.createElement('button');
    saveButton.id = 'saveButton';
    saveButton.textContent = 'Speichern';

    inputContainer.appendChild(document.createTextNode('An dieses Fahrzeug fest ankoppeln: '));
    inputContainer.appendChild(vehicle2IDInput);
    inputContainer.appendChild(document.createElement('br'));
    inputContainer.appendChild(vehicleList);
    inputContainer.appendChild(document.createElement('br'));
    inputContainer.appendChild(saveButton);

    saveButton.addEventListener('click', async () => {
      const vehicle2ID = vehicle2IDInput.value.trim();

      if (vehicle2ID) {
        const vehicles = await getVehicles();
        const filteredVehicles = vehicles.filter((vehicle) => {
          const vehicleID = vehicle.id.toString();
          const vehicleCaption = vehicle.caption.toLowerCase();
          return vehicleID.includes(vehicle2ID) || vehicleCaption.includes(vehicle2ID);
        });

        if (filteredVehicles.length > 0) {
          const selectedVehicle = filteredVehicles[0];
          saveIDPair(vehicleID, selectedVehicle.id.toString());
          alert('ID-Paar erfolgreich gespeichert!');
          vehicle2IDInput.value = '';
        } else {
          alert('Fahrzeug-ID existiert nicht!');
        }
      } else {
        alert('Bitte gib eine Fahrzeug-ID ein!');
      }
    });

    // Laden der ID-Paare aus dem Local Storage
    const existingPairs = loadIDPairs();

    // Vorschläge für Fahrzeug-IDs anzeigen
    vehicle2IDInput.addEventListener('input', async () => {
      const vehicles = await getVehicles();
      vehicleList.innerHTML = '';

      const userInput = vehicle2IDInput.value.trim().toLowerCase();

      vehicles.forEach((vehicle) => {
        const option = document.createElement('option');
        const vehicleID = vehicle.id.toString();
        const vehicleCaption = vehicle.caption;

        if (vehicleID.includes(userInput) || vehicleCaption.toLowerCase().includes(userInput)) {
          option.value = vehicleID;
          option.textContent = `${vehicleCaption} (${vehicleID})`;
          vehicleList.appendChild(option);
        }
      });
    });
  }

  document.body.appendChild(inputContainer);
}

// Hilfsfunktion zum Abrufen der Caption anhand der ID
async function getCaptionByID(vehicleID) {
  const response = await fetch(`https://www.leitstellenspiel.de/api/vehicles/${vehicleID}`);
  const data = await response.json();
  return data.caption;
}
