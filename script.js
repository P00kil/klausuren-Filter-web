// Funktion zum Abrufen der ausgewählten Kurse aus der Dropdown-Liste
function getSelectedCourses() {
    const selectedOptions = document.getElementById('courseSelect').selectedOptions;
    const selectedValues = Array.from(selectedOptions).map(option => option.value);
    return selectedValues;
}

// Funktion zum Verarbeiten der PDF und zum Filtern der Klausurtermine
document.getElementById('processButton').addEventListener('click', function() {
    const courses = getSelectedCourses();
    const fileInput = document.getElementById('pdfFile').files[0];
    const progressBar = document.getElementById('pdfProgress'); // Progressbar

    if (!fileInput) {
        alert('Bitte wählen Sie eine PDF-Datei aus.');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
        const typedarray = new Uint8Array(event.target.result);

        // PDF laden
        pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
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
    };

    reader.readAsArrayBuffer(fileInput);
});

// Funktion zum Filtern und Anzeigen der Klausurtermine
function filterExamDates(text, courses) {
    const examDatesList = document.getElementById('examDates');
    examDatesList.innerHTML = ''; // Liste leeren

    let foundAny = false;

    courses.forEach(course => {
        const regex = new RegExp(course, 'gi');
        const matches = text.match(regex);

        if (matches) {
            foundAny = true;
            const listItem = document.createElement('li');
            listItem.textContent = `Klausurtermin für ${course}: ${matches.join(', ')}`;
            examDatesList.appendChild(listItem);
        }
    });

    if (!foundAny) {
        const noMatchItem = document.createElement('li');
        noMatchItem.textContent = 'Keine Klausurtermine für die ausgewählten Kurse gefunden.';
        examDatesList.appendChild(noMatchItem);
    }
}
