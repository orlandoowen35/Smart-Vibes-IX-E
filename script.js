// 1. FADE IN & HEADER EFFECT
const observerOptions = { threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
    });
}, observerOptions);

document.querySelectorAll(".fade-in").forEach((section) => observer.observe(section));

window.addEventListener("scroll", () => {
    document.getElementById("mainHeader").classList.toggle("scrolled", window.scrollY > 50);
});

// 2. MOTIVASI
const quotes = [
    "Langkah kecil hari ini adalah awal perubahan besar.",
    "Belajar bukan tentang cepat, tapi tentang konsisten.",
    "Masa depanmu ditentukan oleh apa yang kamu lakukan hari ini.",
    "Fokuslah pada proses, hasil akan mengikuti.",
    "Jangan berhenti saat lelah, berhentilah saat selesai."
];

document.getElementById("motivateBtn").addEventListener("click", () => {
    const text = document.getElementById("quoteText");
    const random = Math.floor(Math.random() * quotes.length);
    text.style.opacity = 0;
    setTimeout(() => {
        text.textContent = `"${quotes[random]}"`;
        text.style.opacity = 1;
    }, 300);
});

// 3. NOTES RICH TEXT
const noteEditor = document.getElementById("noteInput");
let notes = JSON.parse(localStorage.getItem("smartNotes")) || [];

function formatNote(command, value = null) {
    noteEditor.focus();
    document.execCommand(command, false, value);
}

function addNote() {
    const title = document.getElementById("noteTitle");
    const content = noteEditor.innerHTML.trim();
    const plainText = noteEditor.textContent.trim();

    if (!title.value.trim() || !plainText) {
        alert("Isi judul dan konten catatan!");
        return;
    }

    notes.push({
        id: Date.now(),
        title: title.value.trim(),
        content
    });

    saveNotes();
    renderNotes();

    title.value = "";
    noteEditor.innerHTML = "";
}

function renderNotes() {
    const container = document.getElementById("notesContainer");
    container.innerHTML = "";

    notes.forEach((note) => {
        const div = document.createElement("div");
        div.className = "note-item";
        div.innerHTML = `
            <div class="note-header" onclick="toggleNote(${note.id})">
                <span><strong>${escapeHtml(note.title)}</strong></span>
                <button onclick="deleteNote(event, ${note.id})" class="btn-del"><i class="fas fa-trash"></i></button>
            </div>
            <div id="content-${note.id}" class="note-content">
                ${normalizeNoteContent(note.content)}
            </div>
        `;
        container.appendChild(div);
    });
}

function toggleNote(id) {
    const content = document.getElementById(`content-${id}`);
    content.classList.toggle("open");
}

function deleteNote(event, id) {
    event.stopPropagation();
    notes = notes.filter((note) => note.id !== id);
    saveNotes();
    renderNotes();
}

function saveNotes() {
    localStorage.setItem("smartNotes", JSON.stringify(notes));
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function normalizeNoteContent(content) {
    const hasHtmlTag = /<[^>]+>/.test(content);
    return hasHtmlTag ? content : escapeHtml(content).replace(/\n/g, "<br>");
}

// 4. TO-DO LIST (TARGET)
function addTodo() {
    const input = document.getElementById("todoInput");
    if (!input.value.trim()) return;

    const li = document.createElement("li");
    li.style.cssText = "background:rgba(255,255,255,0.05); padding:12px; margin-bottom:8px; border-radius:10px; display:flex; justify-content:space-between; border-left:4px solid var(--accent); align-items:center; gap:12px;";
    li.innerHTML = `<span>${escapeHtml(input.value.trim())}</span><button onclick="this.parentElement.remove()" class="btn-del"><i class="fas fa-trash"></i></button>`;
    document.getElementById("todoList").appendChild(li);
    input.value = "";
}

// 5. CUSTOM TIMER
let timerDuration = Number(localStorage.getItem("focusTimerSeconds")) || 25 * 60;
let timeLeft = timerDuration;
let timerId = null;
let audioContext;

function setTimerTheme(state) {
    const timerBox = document.querySelector(".pomodoro-box");
    if (!timerBox) return;
    timerBox.classList.remove("timer-ready", "timer-running", "timer-paused", "timer-finished");
    timerBox.classList.add(`timer-${state}`);
}

function formatStudyTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];

    if (hours) parts.push(`${hours} jam`);
    if (minutes) parts.push(`${minutes} menit`);
    if (!hours && !minutes && seconds) parts.push(`${seconds} detik`);

    return parts.join(" ");
}

function updateTimerMessage(text) {
    const message = document.getElementById("timerMessage");
    if (message) message.textContent = text;
}

function getInputDuration() {
    const hours = Number(document.getElementById("timerHours").value);
    const minutes = Number(document.getElementById("timerMinutes").value);
    const seconds = Number(document.getElementById("timerSeconds").value);
    const invalidTime = [hours, minutes, seconds].some((value) => !Number.isInteger(value) || value < 0);
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

    if (invalidTime || minutes > 59 || seconds > 59 || totalSeconds <= 0 || totalSeconds > 24 * 3600) {
        return null;
    }

    return totalSeconds;
}

function applyTimerSetting() {
    const totalSeconds = getInputDuration();

    if (!totalSeconds) {
        alert("Masukkan waktu yang valid ya.");
        syncTimerInputs(timerDuration);
        return;
    }

    pauseTimer();
    timerDuration = totalSeconds;
    timeLeft = totalSeconds;
    localStorage.setItem("focusTimerSeconds", String(timerDuration));
    syncTimerInputs(timerDuration);
    updateTimerMessage(`Timer siap untuk ${formatStudyTime(timerDuration)}. Tinggal tekan start.`);
    setTimerTheme("ready");
}

function startTimer() {
    if (timerId) return;
    const totalSeconds = getInputDuration();

    if (!totalSeconds) {
        alert("Masukkan waktu yang valid ya.");
        syncTimerInputs(timerDuration);
        return;
    }

    if (timeLeft === timerDuration) {
        timerDuration = totalSeconds;
        timeLeft = totalSeconds;
        localStorage.setItem("focusTimerSeconds", String(timerDuration));
    }

    updateTimerMessage(`Fokus dimulai. Kamu belajar selama ${formatStudyTime(timerDuration)}.`);
    setTimerTheme("running");

    timerId = setInterval(() => {
        timeLeft -= 1;
        syncTimerInputs(timeLeft);

        if (timeLeft <= 0) {
            pauseTimer();
            syncTimerInputs(timerDuration);
            updateTimerMessage(`Hebat! Kamu berhasil fokus selama ${formatStudyTime(timerDuration)}.`);
            setTimerTheme("finished");
            playAlarm();
            alert("Waktu fokus habis! Kerja bagus, waktunya istirahat sebentar.");
            resetTimer();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerId);
    timerId = null;
    if (timeLeft > 0) {
        updateTimerMessage("Timer dijeda dulu. Kalau siap, lanjutkan lagi ya.");
        setTimerTheme("paused");
    }
}

function resetTimer() {
    pauseTimer();
    timerDuration = 0;
    timeLeft = 0;
    localStorage.setItem("focusTimerSeconds", "0");
    syncTimerInputs(0);
    updateTimerMessage("Timer direset ke 00:00:00. Kamu bisa isi waktu baru kapan saja.");
    setTimerTheme("ready");
}

function syncTimerInputs(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    document.getElementById("timerHours").value = hours;
    document.getElementById("timerMinutes").value = String(minutes).padStart(2, "0");
    document.getElementById("timerSeconds").value = String(seconds).padStart(2, "0");
}

function playAlarm() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContext) audioContext = new AudioCtx();
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const notes = [988, 988, 1175, 1175, 1319, 1319, 1175, 1175];
    const startTime = audioContext.currentTime;

    notes.forEach((note, index) => {
        const noteStart = startTime + (index * 0.18);
        const noteEnd = noteStart + 0.12;

        [note, note / 2].forEach((frequency, layerIndex) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = layerIndex === 0 ? "square" : "triangle";
            oscillator.frequency.setValueAtTime(frequency, noteStart);

            gainNode.gain.setValueAtTime(0.001, noteStart);
            gainNode.gain.exponentialRampToValueAtTime(layerIndex === 0 ? 0.12 : 0.06, noteStart + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, noteEnd);

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.start(noteStart);
            oscillator.stop(noteEnd);
        });
    });
}

// 6. GAYA BELAJAR QUIZ
let selectedType = "";

function selectOption(btn, type) {
    document.querySelectorAll(".opt").forEach((opt) => opt.classList.remove("selected"));
    btn.classList.add("selected");
    selectedType = type;
}

function calculateResult() {
    const resultDiv = document.getElementById("quizResult");
    if (!selectedType) {
        alert("Pilih salah satu pilihan dulu!");
        return;
    }

    let message = "";
    if (selectedType === "visual") {
        message = "Tipe Visual: Kamu cocok belajar dengan mind map, video, infografis, dan coretan penuh warna!";
    } else if (selectedType === "auditori") {
        message = "Tipe Auditori: Kamu lebih cepat paham lewat mendengarkan penjelasan langsung, podcast, atau berdiskusi.";
    } else if (selectedType === "kinestetik") {
        message = "Tipe Kinestetik: Kamu tipe learning by doing. Coba belajar sambil praktik langsung atau berjalan.";
    }

    resultDiv.innerHTML = message;
    resultDiv.style.display = "block";
}

// 7. CALENDAR SCHEDULE
const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const today = new Date();
let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = formatDateKey(today);
let schedules = JSON.parse(localStorage.getItem("studyScheduleCalendar")) || {};

function renderCalendar() {
    const grid = document.getElementById("calendarGrid");
    const label = document.getElementById("calendarMonthLabel");
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();

    label.textContent = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
    grid.innerHTML = "";

    for (let i = 0; i < startOffset; i += 1) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-cell calendar-empty";
        grid.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDays; day += 1) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateKey = formatDateKey(date);
        const button = document.createElement("button");
        const daySchedules = schedules[dateKey] || [];
        const isSelected = dateKey === selectedDate;
        const isToday = dateKey === formatDateKey(today);

        button.type = "button";
        button.className = "calendar-cell";
        if (isSelected) button.classList.add("selected");
        if (isToday) button.classList.add("today");
        if (daySchedules.length) button.classList.add("has-schedule");

        button.innerHTML = `
            <span class="calendar-date-number">${day}</span>
            <span class="calendar-task-count">${daySchedules.length ? `${daySchedules.length} tugas` : ""}</span>
        `;

        button.addEventListener("click", () => {
            selectedDate = dateKey;
            document.getElementById("scheduleDate").value = dateKey;
            renderCalendar();
            renderSelectedDateTasks();
        });

        grid.appendChild(button);
    }
}

function renderSelectedDateTasks() {
    const title = document.getElementById("selectedDateTitle");
    const taskContainer = document.getElementById("selectedDateTasks");
    const tasks = schedules[selectedDate] || [];

    title.textContent = formatDateLabel(selectedDate);
    taskContainer.innerHTML = "";

    if (!tasks.length) {
        taskContainer.innerHTML = '<p class="empty-state">Belum ada tugas di tanggal ini.</p>';
        return;
    }

    tasks
        .slice()
        .sort((a, b) => a.time.localeCompare(b.time))
        .forEach((task) => {
            const item = document.createElement("div");
            item.className = "task-item";
            item.innerHTML = `
                <div>
                    <strong>${escapeHtml(task.task)}</strong>
                    <p>${escapeHtml(task.time)}</p>
                </div>
                <button type="button" class="btn-del" onclick="deleteSchedule('${selectedDate}', ${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            taskContainer.appendChild(item);
        });
}

function addSchedule(event) {
    event.preventDefault();

    const dateInput = document.getElementById("scheduleDate");
    const taskInput = document.getElementById("scheduleTask");
    const timeInput = document.getElementById("scheduleTime");

    const date = dateInput.value;
    const task = taskInput.value.trim();
    const time = timeInput.value;

    if (!date || !task || !time) {
        alert("Isi tanggal, tugas, dan waktu dulu ya.");
        return;
    }

    if (!schedules[date]) schedules[date] = [];
    schedules[date].push({
        id: Date.now(),
        task,
        time
    });

    saveSchedules();
    selectedDate = date;
    currentMonth = new Date(`${date}T00:00:00`);
    renderCalendar();
    renderSelectedDateTasks();
    event.target.reset();
    document.getElementById("scheduleDate").value = selectedDate;
}

function deleteSchedule(date, id) {
    schedules[date] = (schedules[date] || []).filter((task) => task.id !== id);
    if (!schedules[date].length) delete schedules[date];
    saveSchedules();
    renderCalendar();
    renderSelectedDateTasks();
}

function saveSchedules() {
    localStorage.setItem("studyScheduleCalendar", JSON.stringify(schedules));
}

function changeMonth(step) {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + step, 1);
    renderCalendar();
}

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDateLabel(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

// LOAD DATA
window.onload = () => {
    renderNotes();

    syncTimerInputs(timerDuration);
    setTimerTheme("ready");
    updateTimerMessage(timerDuration > 0
        ? `Timer siap untuk ${formatStudyTime(timerDuration)}. Tinggal tekan start.`
        : "Set waktu belajarmu dulu, lalu tekan start.");
    ["timerHours", "timerMinutes", "timerSeconds"].forEach((id) => {
        document.getElementById(id).addEventListener("input", () => {
            if (timerId) return;
            const totalSeconds = getInputDuration();
            if (!totalSeconds) {
                updateTimerMessage("Masukkan jam, menit, atau detik yang valid dulu ya.");
                return;
            }
            timerDuration = totalSeconds;
            timeLeft = totalSeconds;
            localStorage.setItem("focusTimerSeconds", String(timerDuration));
            updateTimerMessage(`Timer siap untuk ${formatStudyTime(timerDuration)}. Tinggal tekan start.`);
            setTimerTheme("ready");
        });
    });

    document.getElementById("scheduleDate").value = selectedDate;
    document.getElementById("scheduleForm").addEventListener("submit", addSchedule);
    renderCalendar();
    renderSelectedDateTasks();
};

// HAMBURGER MENU
const menu = document.querySelector("#mobile-menu");
const navLinks = document.querySelector(".nav-container");

menu.addEventListener("click", () => {
    menu.classList.toggle("is-active");
    navLinks.classList.toggle("active");
});

document.querySelectorAll(".nav-container a").forEach((link) => {
    link.addEventListener("click", () => {
        menu.classList.remove("is-active");
        navLinks.classList.remove("active");
    });
});
