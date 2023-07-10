// ==UserScript==
// @name         LSS-Fahrzeuge aneinanderbinden
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @description  Bindet Fahrzeuge andeinander und setzt automatisch die Checkbox wenn das andere ausgewählt wird.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

// Konfiguration
const fahrzeugPaare = [
  {
    fahrzeug1ID: '13869604', // Hier Fahrzeug 1 ID eintragen
    fahrzeug2ID: '13913866', // Hier Fahrzeug 2 ID eintragen
  },
  {
    fahrzeug1ID: '1', // Hier Fahrzeug 1 ID des nächsten Paares eintragen
    fahrzeug2ID: '15', // Hier Fahrzeug 2 ID des nächsten Paares eintragen
  },
  // Weitere Fahrzeugpaare können nach Bedarf hinzugefügt werden
];

// Funktion zum Überprüfen der Checkboxen der Fahrzeuge und Auslösen des "change" Events
function syncCheckboxes() {
  fahrzeugPaare.forEach(fahrzeugPaar => {
    const checkbox1 = document.getElementById('vehicle_checkbox_' + fahrzeugPaar.fahrzeug1ID);
    const checkbox2 = document.getElementById('vehicle_checkbox_' + fahrzeugPaar.fahrzeug2ID);

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
