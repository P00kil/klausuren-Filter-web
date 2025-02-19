// Variable zur Speicherung der standardmäßig eingebundenen PDF
let defaultPdfUrl = 'https://drive.google.com/uc?export=download&id=1t16FiZ0Zd4jDlCeoy8pPn_y9XTeJ1VYf';

// Bei Seitenaufruf die Auswahl der PDF-Quelle und Kurse verwalten
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('input[name="pdfSource"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.getElementById('uploadSection').style.display = this.value === 'upload' ? 'block' : 'none';
        });
    });

    loadSelectedCourses();
});

// Funktion zum Abrufen der ausgewählten Kurse
function getSelectedCourses() {
    const selectedOptions = document.getElementById('courseSelect').selectedOptions;
    return Array.from(selectedOptions).map(option => option.value);
}

// Funktion zum Verarbeiten der PDF und zum Filtern der Klausurtermine
document.getElementById('processButton').addEventListener('click', function() {
    const courses = getSelectedCourses();
    const pdfSource = document.querySelector('input[name="pdfSource"]:checked').value;
    const progressBar = document.getElementById('pdfProgress');

    if (pdfSource === 'upload') {
        const fileInput = document.getElementById('pdfFile').files[0];
        if (!fileInput) {
            alert('Bitte wählen Sie eine PDF-Datei aus.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const typedarray = new Uint8Array(event.target.result);
            loadAndProcessPDF(typedarray, courses, progressBar);
        };
        reader.readAsArrayBuffer(fileInput);
    } else {
        fetch(defaultPdfUrl)
            .then(response => response.arrayBuffer())
            .then(data => {
                const typedarray = new Uint8Array(data);
                loadAndProcessPDF(typedarray, courses, progressBar);
            })
            .catch(error => console.error("Fehler beim Laden der Standard-PDF:", error));
    }
});

// Funktion zum Laden und Verarbeiten der PDF
function loadAndProcessPDF(pdfArray, courses, progressBar) {
    pdfjsLib.getDocument(pdfArray).promise.then(function(pdf) {
        let pagesPromises = [];
        const totalPages = pdf.numPages;
        progressBar.value = 0;

        for (let i = 1; i <= totalPages; i++) {
            pagesPromises.push(pdf.getPage(i).then(function(page) {
                return page.getTextContent().then(function(textContent) {
                    progressBar.value = (i / totalPages) * 100;
                    return textContent.items.map(item => item.str).join(' ');
                });
            }));
        }

        Promise.all(pagesPromises).then(function(pagesText) {
            let fullText = pagesText.join(' ');

            // Debugging: Zeige den extrahierten Text an
            console.log("Extrahierter PDF-Text:", fullText);

            // Text bereinigen
            fullText = fullText.replace(/\s+/g, ' ').trim();
            
            filterExamDates(fullText, courses);
            progressBar.value = 100;
        });
    }).catch(error => console.error("Fehler beim Verarbeiten der PDF:", error));
}

// Funktion zum Filtern und Anzeigen der Klausurtermine
function filterExamDates(text, courses) {
    const examDatesList = document.getElementById('examDates');
    examDatesList.innerHTML = ''; 

    let foundAny = false;

    courses.forEach(course => {
        const courseName = course.split(' ')[0];
        const regex = new RegExp(`${courseName}\\s*\\/\\s*[^\\n]*?(\\d{1,2}\\.\\d{1,2}\\.\\d{4})`, 'gi');

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