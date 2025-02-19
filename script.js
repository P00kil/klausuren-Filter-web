document.getElementById('processButton').addEventListener('click', function() {
    const courses = document.getElementById('courses').value.split(',').map(course => course.trim());
    const pdfFile = document.getElementById('pdfFile').files[0];

    if (!pdfFile || !courses.length) {
        alert("Bitte geben Sie Kurse ein und wählen Sie eine PDF-Datei.");
        return;
    }

    // Dummy-Daten zur Darstellung der Ergebnisse (in einer realen App wird hier die PDF analysiert)
    const dummyExamDates = [
        { course: 'Kurs1', date: '20.01.2025' },
        { course: 'Kurs2', date: '22.01.2025' },
        { course: 'Kurs3', date: '25.01.2025' }
    ];

    const examDatesList = document.getElementById('examDates');
    examDatesList.innerHTML = '';  // Clear previous results

    dummyExamDates.forEach(item => {
        if (courses.includes(item.course)) {
            const li = document.createElement('li');
            li.textContent = `Kurs: ${item.course} - Klausur am ${item.date}`;
            examDatesList.appendChild(li);
        }
    });
});