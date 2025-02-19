// Variable zur Speicherung der standardmäßig eingebundenen PDF
let defaultPdfUrl = '/mnt/data/Klausurtermine KL.11 2.Halbjahr 24-25.pdf';  // URL der PDF, die du bereitgestellt hast

// Bei Seitenaufruf die Auswahl der PDF-Quelle und Kurse verwalten
document.addEventListener("DOMContentLoaded", function() {
    // Anzeigen/Verstecken des PDF-Upload-Bereichs basierend auf der Auswahl
    document.querySelectorAll('input[name="pdfSource"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'upload') {
                document.getElementById('uploadSection').style.display = 'block';
            } else {
                document.getElementById('uploadSection').style.display = 'none';
            }
        });
    });

    // Lädt die gespeicherten Kurse aus den Cookies
    loadSelectedCourses();
});

// Funktion zum Abrufen der ausgewählten Kurse
function getSelectedCourses() {
    const selectedOptions = document.getElementById('courseSelect').selectedOptions;
    const selectedValues = Array.from(selectedOptions).map(option => option.value);
    return selectedValues;
}

// Funktion zum Verarbeiten der PDF und zum Filtern der Klausurtermine
document.getElementById('processButton').addEventListener('click', function() {
    const courses = getSelectedCourses();
    const pdfSource = document.querySelector('input[name="pdfSource"]:checked').value;
    const progressBar = document.getElementById('pdfProgress'); // Progressbar

    let pdfDocument = null;

    // Bestimme die Quelle der PDF
    if (pdfSource === 'upload') {
        const fileInput = document.getElementById('pdfFile').files[0];
        if (!fileInput) {
            alert('Bitte wählen Sie eine PDF-Datei aus.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const typedarray = new Uint8Array(event.target.result);
            // PDF laden
            loadAndProcessPDF(typedarray, courses, progressBar);
        };
        reader.readAsArrayBuffer(fileInput);
    } else {
        // Lade die Standard-PDF
        fetch(defaultPdfUrl).then(response => response.arrayBuffer()).then(data => {
            const typedarray = new Uint8Array(data);
            loadAndProcessPDF(typedarray, courses, progressBar);
        });
    }
});

// Funktion zum Laden und Verarbeiten der PDF
function loadAndProcessPDF(pdfArray, courses, progressBar) {
    pdfjsLib.getDocument(pdfArray).promise.then(function(pdf) {
        let pagesPromises = [];
        const totalPages = pdf.numPages;
        progressBar.value = 0; // Fortschrittsleiste auf 0 setzen

        // Durch alle Seiten der PDF iterieren
        for (let i = 1; i <= totalPages; i++) {
            pagesPromises.push(pdf.getPage(i).then(function(page) {
                return page.getTextContent().then(function(textContent) {
                    progressBar.value = (i / totalPages) * 100; // Fortschrittsanzeige aktualisieren
                    return textContent.items.map(item => item.str).join(' ');
                });
            }));
        }

        // Alle Seiteninhalte abwarten und verarbeiten
        Promise.all(pagesPromises).then(function(pagesText) {
            const fullText = pagesText.join(' ');
            filterExamDates(fullText, courses);
            progressBar.value = 100; // Fortschrittsleiste bei 100% setzen
        });
    });
}

// Funktion zum Filtern und Anzeigen der Klausurtermine
function filterExamDates(text, courses) {
    const examDatesList = document.getElementById('examDates');
    examDatesList.innerHTML = ''; // Liste leeren

    let foundAny = false;

    courses.forEach(course => {
        // Nur das Kürzel des Kurses nehmen (z.B. BIO1) und Regex verwenden
        const courseName = course.split(' ')[0];
        // Sucht nach Kurs und extrahiert das Datum im Format TT.MM.JJJJ
        const regex = new RegExp(`${courseName}[^\\n]*?(\\d{1,2}\\.\\d{1,2}\\.\\d{4})`, 'gi');
        
        let match;
        while ((match = regex.exec(text)) !== null) {
            foundAny = true;
            const listItem = document.createElement('li');
            listItem.textContent = `Kurs: ${course}, Klausurtermin: ${match[1]}`;
            examDatesList.appendChild(listItem);
        }
    });

    if (!foundAny) {
        const noMatchItem = document.createElement('li');
        noMatchItem.textContent = 'Keine Klausurtermine für die ausgewählten Kurse gefunden.';
        examDatesList.appendChild(noMatchItem);
    }
}

// Funktion zum Laden der gespeicherten Kursauswahl aus den Cookies
function loadSelectedCourses() {
    const selectedCourses = getCookie('selectedCourses');
    if (selectedCourses) {
        const selectedValues = selectedCourses.split(',');
        const selectElement = document.getElementById('courseSelect');
        Array.from(selectElement.options).forEach(option => {
            if (selectedValues.includes(option.value)) {
                option.selected = true;
            }
        });
    }
}

// Funktion zum Setzen von Cookies
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Funktion zum Abrufen von Cookies
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}