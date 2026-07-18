# Recap AI

AI-powered meeting transcription and summarization system with speaker diarization, live transcription, and an agentic Q&A assistant.

Upload a meeting recording and Recap AI will transcribe it, identify who's speaking, generate a summary with action items and decisions, and let you search or ask questions about what was discussed — powered by an LLM agent that decides when to look things up.

---

## Features

- **Transcription + Speaker Diarization** — converts audio to text and separates speakers using WhisperX and pyannote
- **Speaker Name Inference** — an LLM reads the transcript and infers real names (e.g. "Mark", "Jane") in place of generic `SPEAKER_00` / `SPEAKER_01` labels, based on context in the conversation
- **Summarization** — generates a concise summary, action items, and decisions for each meeting
- **Keyword Search** — quickly find any line in a transcript containing a specific word or phrase
- **Agentic Q&A** — ask natural-language questions about a meeting; the LLM decides whether to search the transcript before answering, using tool-calling
- **Live Transcription** — real-time, in-browser transcription from your microphone via WebSockets
- **Persistent Storage** — meetings are stored in SQLite, so data survives server restarts
- **REST API** — full FastAPI backend with 8 endpoints covering upload, retrieval, search, Q&A, and deletion
- **Web Frontend** — a clean, tabbed interface for uploading meetings, browsing past meetings, and interacting with each one

---

## Tech Stack

**Backend**
- Python, FastAPI, Uvicorn
- WhisperX — speech-to-text transcription
- pyannote.audio — speaker diarization
- Groq API (Llama 3.3 70B) — summarization, speaker-name inference, and agentic tool-calling
- SQLite — persistent storage
- WebSockets — live transcription streaming

**Frontend**
- HTML, CSS, vanilla JavaScript (no framework/build step)
- Fetch API for REST calls
- MediaRecorder API + WebSockets for live transcription

---

## Architecture Overview

```
Audio File
    │
    ▼
WhisperX (transcription) ──► pyannote (diarization)
    │
    ▼
Raw transcript (SPEAKER_00 / SPEAKER_01 + text)
    │
    ▼
Groq LLM ──► summary, action items, decisions, speaker name guesses
    │
    ▼
SQLite (persisted by meeting ID)
    │
    ▼
FastAPI endpoints ──► Frontend (transcript / summary / search / ask)
```

For live transcription, a WebSocket streams short audio chunks from the browser to the server, where each chunk is transcribed independently with WhisperX and the result is sent back and appended to the live view.

The agentic Q&A flow uses Groq's tool-calling: when a question is asked, the LLM can call a `search_transcript` tool to look up relevant lines before composing its final answer, rather than answering from assumption.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/upload` | Upload an audio file, returns a `meeting_id` |
| GET | `/meetings` | List all stored meeting IDs |
| GET | `/meetings/{id}/transcript` | Get transcript (named speakers by default; `?named=false` for raw labels) |
| GET | `/meetings/{id}/summary` | Get summary, action items, decisions, and speaker name mapping |
| GET | `/meetings/{id}/search?keyword=...` | Keyword search across the transcript |
| POST | `/meetings/{id}/ask?question=...` | Ask the agent a question about the meeting |
| DELETE | `/meetings/{id}` | Delete a meeting and its data |
| WS | `/ws/live-transcribe` | WebSocket endpoint for live, chunked transcription |

---

## Setup

### Prerequisites
- Python 3.10+
- FFmpeg installed and on your PATH
- A free [Groq API key](https://console.groq.com)
- A free [Hugging Face token](https://huggingface.co/settings/tokens) (for pyannote diarization models)

### Installation

```bash
git clone https://github.com/Malik-basit011/recap-ai.git
cd recap-ai

python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

### Environment variables

Create a `.env` file in the project root:

```
GROQ_API_KEY=your_groq_key_here
HF_TOKEN=your_huggingface_token_here
```

### Run the backend

```bash
uvicorn my_api:app --reload
```

The API will be available at `http://127.0.0.1:8000`, with interactive docs at `http://127.0.0.1:8000/docs`.

### Run the frontend

Open `frontend/index.html` directly in a browser (Chrome recommended for microphone access on the live transcription page).

---

## Known Limitations

- **Speaker diarization accuracy** depends on audio quality and how distinctly speakers' voices differ; short or fast back-and-forth exchanges can occasionally be mislabeled.
- **Speaker name inference** is an LLM best-effort guess based on conversational context (e.g. names spoken aloud), not true speaker identification — it can be inconsistent on ambiguous audio.
- **Live transcription** processes audio in fixed-length chunks (~10 seconds); sentences that span a chunk boundary may be transcribed less accurately than the same audio processed as a complete file through the standard upload flow.
- **In-memory model loading** — WhisperX and diarization models are loaded once at server startup, which requires enough RAM to hold them; this affects deployment options on free-tier hosting.
- **No authentication** — meetings are not currently tied to individual users; this is a single-user/demo-scale application.

---

## Possible Future Improvements

- Replace keyword search with vector/embedding-based semantic search for more flexible Q&A
- Add user accounts and authentication
- Dockerize the application for consistent deployment
- Deploy to a cloud host with sufficient RAM for the ML models
- Export meeting summaries to PDF/Markdown
- Support batch upload of multiple audio files

---

## Author

Abdul Basit Mehboob
[GitHub](https://github.com/Malik-basit011) · [Portfolio](https://abdulbasitmehboob.netlify.app)