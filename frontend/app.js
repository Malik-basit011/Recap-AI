const API_BASE = "http://127.0.0.1:8000";

const views = {
    upload: document.getElementById("uploadView"),
    meetings: document.getElementById("meetingsView"),
    detail: document.getElementById("detailView"),
    live: document.getElementById("liveView"),
};

const navButtons = {
    upload: document.getElementById("navUpload"),
    meetings: document.getElementById("navMeetings"),
    live: document.getElementById("navLive"),
};

let currentMeetingId = null;

function showView(name) {
    Object.entries(views).forEach(([key, el]) => {
        el.classList.toggle("hidden", key !== name);
    });
    Object.entries(navButtons).forEach(([key, btn]) => {
        btn.classList.toggle("active", key === name);
    });
}

// --- Navigation ---
navButtons.upload.onclick = () => showView("upload");
navButtons.meetings.onclick = () => {
    showView("meetings");
    loadMeetings();
};
navButtons.live.onclick = () => showView("live");
document.getElementById("backFromLive").onclick = () => showView("upload");
document.getElementById("backFromDetail").onclick = () => {
    showView("meetings");
    loadMeetings();
};

// --- Upload ---
document.getElementById("uploadBtn").onclick = async () => {
    const fileInput = document.getElementById("audioFile");
    const statusEl = document.getElementById("uploadStatus");

    if (!fileInput.files.length) {
        statusEl.innerText = "Please choose a file first.";
        return;
    }

    statusEl.innerText = "Uploading and processing... this may take a minute.";

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    try {
        const response = await fetch(`${API_BASE}/upload`, {
            method: "POST",
            body: formData,
        });
        const data = await response.json();
        statusEl.innerText = `Done! Meeting ID: ${data.meeting_id}`;
    } catch (err) {
        statusEl.innerText = "Upload failed. Is the server running?";
    }
};

// --- Meetings List ---
async function loadMeetings() {
    const listEl = document.getElementById("meetingsList");
    listEl.innerHTML = "<li>Loading...</li>";

    try {
        const response = await fetch(`${API_BASE}/meetings`);
        const data = await response.json();

        listEl.innerHTML = "";
        if (data.meeting_ids.length === 0) {
            listEl.innerHTML = "<li>No meetings yet. Upload one to get started.</li>";
            return;
        }

        data.meeting_ids.forEach((id) => {
            const li = document.createElement("li");
            li.innerText = id;
            li.onclick = () => openMeeting(id);
            listEl.appendChild(li);
        });
    } catch (err) {
        listEl.innerHTML = "<li>Failed to load meetings.</li>";
    }
}

// --- Meeting Detail ---
function openMeeting(meetingId) {
    currentMeetingId = meetingId;
    document.getElementById("detailTitle").innerText = `Meeting: ${meetingId}`;
    showView("detail");
    switchTab("transcript");
    loadTranscript();
}

function switchTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tab === tabName);
    });
    document.querySelectorAll(".tab-content").forEach((el) => {
        el.classList.toggle("hidden", el.id !== `tab-${tabName}`);
    });
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.onclick = () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
        if (tab === "transcript") loadTranscript();
        if (tab === "summary") loadSummary();
    };
});

async function loadTranscript() {
    const el = document.getElementById("transcriptOutput");
    el.innerText = "Loading transcript...";
    try {
        const response = await fetch(`${API_BASE}/meetings/${currentMeetingId}/transcript`);
        const data = await response.json();
        el.innerText = data.segments
            .map((seg) => `${seg.speaker}: ${seg.text}`)
            .join("\n");
    } catch (err) {
        el.innerText = "Failed to load transcript.";
    }
}

async function loadSummary() {
    const el = document.getElementById("summaryOutput");
    el.innerText = "Loading summary...";
    try {
        const response = await fetch(`${API_BASE}/meetings/${currentMeetingId}/summary`);
        const data = await response.json();
        el.innerText =
            `Summary:\n${data.summary}\n\n` +
            `Action Items:\n${data.action_items.length ? data.action_items.join("\n") : "None"}\n\n` +
            `Decisions:\n${data.decisions.length ? data.decisions.join("\n") : "None"}`;
    } catch (err) {
        el.innerText = "Failed to load summary.";
    }
}

document.getElementById("searchBtn").onclick = async () => {
    const keyword = document.getElementById("searchInput").value.trim();
    const el = document.getElementById("searchOutput");
    if (!keyword) return;

    el.innerText = "Searching...";
    try {
        const response = await fetch(
            `${API_BASE}/meetings/${currentMeetingId}/search?keyword=${encodeURIComponent(keyword)}`
        );
        const data = await response.json();
        el.innerText = data.result;
    } catch (err) {
        el.innerText = "Search failed.";
    }
};

document.getElementById("askBtn").onclick = async () => {
    const question = document.getElementById("askInput").value.trim();
    const el = document.getElementById("askOutput");
    if (!question) return;

    el.innerText = "Thinking...";
    try {
        const response = await fetch(
            `${API_BASE}/meetings/${currentMeetingId}/ask?question=${encodeURIComponent(question)}`,
            { method: "POST" }
        );
        const data = await response.json();
        el.innerText = data.answer;
    } catch (err) {
        el.innerText = "Failed to get an answer.";
    }
};