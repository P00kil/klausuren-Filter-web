// PDF.js Worker setzen
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js";

// Standard-PDF URL
let defaultPdfUrl = "https://drive.google.com/uc?export=download&id=1t16FiZ0Zd4jDlCeoy8pPn_y9XTeJ1VYf";

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('input[name="pdfSource"]').forEach(radio => {
        radio.addEventListener("change", function () {
            document.getElementById("uploadSection").style.display = this.value === "upload" ? "block" : "none";
        });
    });

    document.getElementById("processButton").addEventListener("click", function (event) {
        event.preventDefault();
        processPDF();
    });

    loadSelectedCourses();
});

// Funktion zum Abrufen der ausgewählten Kurse
function getSelectedCourses() {
    return Array.from(document.querySelectorAll("input[type='checkbox']:checked")).map(input => input.value);
}

// PDF verarbeiten
function processPDF() {
    const courses = getSelectedCourses();
    const pdfSource = document.querySelector('input[name="pdfSource"]:checked').value;
    const progressBar = document.getElementById("pdfProgress");

    if (courses.length === 0) {
        alert("Bitte wähle mindestens einen Kurs aus!");
        return;
    }

    progressBar.value = 0;

    if (pdfSource === "upload") {
        const fileInput = document.getElementById("pdfFile").files[0];
        if (!fileInput) {
            alert("Bitte wählen Sie eine PDF-Datei aus.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
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
}

// Funktion zum Laden & Verarbeiten der PDF
function loadAndProcessPDF(pdfArray, courses, progressBar) {
    pdfjsLib.getDocument(pdfArray).promise.then(pdf => {
        let pagesPromises = [];
        const totalPages = pdf.numPages;
        progressBar.value = 10;

        for (let i = 1; i <= totalPages; i++) {
            pagesPromises.push(
                pdf.getPage(i).then(page =>
                    page.getTextContent().then(textContent => {
                        progressBar.value = (i / totalPages) * 100;
                        return textContent.items.map(item => item.str).join(" ");
                    })
                )
            );
        }

        Promise.all(pagesPromises).then(pagesText => {
            let fullText = pagesText.join(" ").replace(/\s+/g, " ").trim();

            console.log("Extrahierter PDF-Text:", fullText);

            filterExamDates(fullText, courses);
            progressBar.value = 100;
        });
    }).catch(error => {
        console.error("Fehler beim Verarbeiten der PDF:", error);
        alert("Fehler beim Verarbeiten der PDF. Bitte versuchen Sie es erneut.");
    });
}

// Klausurtermine filtern & anzeigen
function filterExamDates(text, courses) {
    const examDatesList = document.getElementById("examDates");
    examDatesList.innerHTML = "";

    let foundAny = false;

    courses.forEach(course => {
        const courseName = course.split(" ")[0];
        const regex = new RegExp(`${courseName}\s*[\/\-]\s*.*?(\d{1,2}\.\d{1,2}\.\d{4})`, "gi");

        let match;
        while ((match = regex.exec(text)) !== null) {
            foundAny = true;
            const listItem = document.createElement("li");
            listItem.textContent = `Kurs: ${course}, Klausurtermin: ${match[1]}`;
            examDatesList.appendChild(listItem);
        }
    });

    if (!foundAny) {
        const noMatchItem = document.createElement("li");
        noMatchItem.textContent = "Keine Klausurtermine für die ausgewählten Kurse gefunden.";
        examDatesList.appendChild(noMatchItem);
    }
}
