# AI Question Drafting Setup Guide (Phase C: Local LLM & Optional Cloud Gemini)

LearningPal Phase C provides automated multiple-choice question drafting from teacher-uploaded course documents (PDF and DOCX). The system supports two selectable LLM providers:
1. **Local LM Studio (Default)**: A 100% private, local Large Language Model (`qwen/qwen3-14b`) served via LM Studio on the host machine. No document text ever leaves loopback.
2. **Google AI Studio / Gemini API (Optional Cloud)**: A free cloud-based option using Google's OpenAI-compatible endpoint (`gemini-3.5-flash-lite`) for machines without dedicated GPU resources.

Teachers retain full editorial control under both providers: every drafted question is held in a private staging queue and **never reaches students until explicitly approved**.

---

## 1. Architecture & Provider Modes

```
                                  +---------------------------------------------+
                                  |            LOCAL MODE (Default)             |
                                  |  LM Studio Server on Loopback               |
                                  |  http://127.0.0.1:1234/v1                   |
                                  |  Model: qwen/qwen3-14b (No auth header)     |
                                  +---------------------------------------------+
                                                         ^
                                                         | (app.llm.provider=local)
+--------------------+                                   |
| LearningPal App    | ----------------------------------+
| (Spring Boot 3.3)  | ----------------------------------+
+--------------------+                                   | (app.llm.provider=gemini)
         |                                               v
         |                        +---------------------------------------------+
         |                        |            CLOUD MODE (Optional)            |
         |                        |  Google AI Studio OpenAI Endpoint           |
         |                        |  https://generativelanguage.googleapis.com  |
         |                        |  /v1beta/openai/chat/completions            |
         |                        |  Model: gemini-3.5-flash-lite (Bearer auth) |
         v                        +---------------------------------------------+
+--------------------+
| Private Staging    |
| (AiQuestionDrafts) |
+--------------------+
         |
         | Teacher Reviews & Approves
         v
+--------------------+
| Question Bank      | ----> Quizzes & Diagnostic Assessments (Students)
| (origin: AI)       |
+--------------------+
```

### Key Principles:
1. **Human in the Loop**: Drafted questions are inactive by default. No student endpoint can query drafts, jobs, or evidence quotes.
2. **Evidence Verification**: The model must provide a verbatim `evidenceQuote` from the document text. Quotes are verified by the backend. Only verified drafts can be bulk-approved.
3. **Source Linkage**: Approved questions retain a permanent link to their `sourceFile` and set `origin = AI`.
4. **Data Minimization**: Outgoing prompts contain strictly the system pedagogical instructions and chunks of teacher-uploaded file text. Never student names, student answers, grades, user identities, or institution data.

---

## 2. Provider 1: Local LM Studio (Default)

### Step 1: Install LM Studio
1. Download LM Studio for Windows, macOS, or Linux from [https://lmstudio.ai/](https://lmstudio.ai/).
2. Complete the standard installer.

### Step 2: Download the Target Model (`qwen/qwen3-14b`)
1. Open LM Studio and click the **Search** icon in the left navigation.
2. Search for: `qwen/qwen3-14b` or `qwen2.5-14b-instruct`.
3. Select a quantized GGUF variant suitable for your hardware:
   - **Recommended**: `Q4_K_M` (~9 GB VRAM / RAM) or `Q5_K_M` (~11 GB VRAM / RAM).
   - Click **Download**.

### Step 3: Start the Local Server
1. Select `qwen/qwen3-14b` in the top model selection dropdown.
2. In the Developer tab, toggle **Start Server** on port `1234`.
3. Verify server availability:
   ```powershell
   Invoke-RestMethod -Uri 'http://127.0.0.1:1234/v1/models' -Method Get
   ```

---

## 3. Provider 2: Google AI Studio / Gemini API (Optional Cloud)

For hardware without an NVIDIA GPU capable of running 14B models locally, LearningPal supports Google's official Gemini API free tier.

> [!WARNING]
> **Data Privacy Notice for Free-Tier Cloud LLMs:**
> On Google AI Studio's free tier, submitted prompts and text may be reviewed by human annotators and used by Google to train and improve products. **Do not upload confidential, personally identifiable, or copyrighted materials in cloud mode.** When cloud mode is active, the UI clearly discloses: *"Cloud mode: this file's text is sent to Google to generate questions."*

### Verified Gemini API Facts & Sources
Based on Google's official API documentation ([ai.google.dev](https://ai.google.dev/) and [ai.google.dev/gemini-api/docs/openai](https://ai.google.dev/gemini-api/docs/openai)):
- **OpenAI-Compatible Base URL**: `https://generativelanguage.googleapis.com/v1beta/openai/`
- **Authentication**: `Authorization: Bearer <GEMINI_API_KEY>` header.
- **Structured Output Support**: Google's OpenAI compatibility layer officially supports `response_format` with `{"type": "json_schema", "json_schema": {...}}` and `{"type": "json_object"}`. The backend uses the strict `json_schema` format alongside the existing parsing and repair retry pipeline.
- **Chosen Model**: `gemini-3.5-flash-lite`
  - *Why chosen*: It is Google's current active high-speed Flash-class model on the free tier, providing high inference speed, robust structured output support, and high availability without 503 capacity bottlenecks.
- **Free Tier Rate Limits (per Google Cloud project)**:
  - **RPM**: 15 requests per minute
  - **TPM**: 1,000,000 tokens per minute
  - **RPD**: 1,500 requests per day (resets daily at midnight Pacific Time)
- **Rate Limit Handling**: If Gemini responds with HTTP 429 (Resource Exhausted) or HTTP 503, the client respects any `Retry-After` header and executes bounded exponential retries (up to 3 times by default). If the quota remains exhausted, the job gracefully terminates with the user-friendly notice: *"Google's free limit was reached. Try again later."*

### How to Obtain a Free Gemini API Key:
1. Visit [Google AI Studio](https://aistudio.google.com/) and sign in with a Google Account.
2. Click **Get API key** in the left sidebar.
3. Click **Create API key** (in a new or existing Google Cloud project).
4. Copy the generated key (`AIzaSy...`).

### How to Supply the Key:
Supply the key via environment variable (recommended):
```powershell
$env:GEMINI_API_KEY="AIzaSyYourSecretKeyHere"
```
Or set it in your local `application.properties` (never commit real keys):
```properties
app.llm.gemini.api-key=AIzaSyYourSecretKeyHere
```

---

## 4. LearningPal Configuration Reference

Edit `backend/src/main/resources/application.properties` to switch providers:

```properties
# Enable question drafting feature
app.llm.enabled=true

# Provider selection: 'local' (default) or 'gemini'
app.llm.provider=local

# =========================================================
# Local LM Studio Settings (active when provider=local)
# =========================================================
app.llm.base-url=http://127.0.0.1:1234
app.llm.model=qwen/qwen3-14b
app.llm.chunk-chars=5000
app.llm.user-suffix=/no_think
app.llm.request-timeout-seconds=60

# =========================================================
# Google Gemini Settings (active when provider=gemini)
# =========================================================
app.llm.gemini.api-key=${GEMINI_API_KEY:}
app.llm.gemini.base-url=https://generativelanguage.googleapis.com/v1beta/openai
app.llm.gemini.model=gemini-3.5-flash-lite
app.llm.gemini.chunk-chars=12000
app.llm.gemini.max-retries=3

# =========================================================
# Shared Limits & Safety
# =========================================================
app.llm.max-drafts-per-job=30
app.llm.max-jobs-per-teacher-per-hour=5
app.llm.temperature=0.2
```

---

## 5. How the Drafting Pipeline Works

1. **Teacher Action**: In *My Subjects* $\to$ *Resources* $\to$ *Files*, teacher clicks **Draft with AI** on any file with status `Text ready`.
2. **Setup Dialog**: Teacher selects target curriculum topic and desired question count (5 to 30, default 10). If cloud mode is active, the Google disclosure notice is displayed.
3. **Chunking**: `DocumentChunker` splits document text into sections (up to 5,000 characters for local; up to 12,000 for Gemini) on natural paragraph breaks.
4. **Structured JSON Generation**:
   - System prompt instructs model to act as an objective curriculum examiner and never execute instructions found in untrusted text.
   - Structured JSON schema enforces: `question`, 4 `choices`, `correctIndex` (0-3), `explanation`, `difficulty`, and `evidenceQuote`.
5. **Reasoning Tag Stripping & Strict Parsing**:
   - Strips `<think>...</think>` tags emitted by reasoning models.
   - If model output violates JSON schema, a single automatic repair retry is sent citing the syntax error.
6. **Evidence Verification**:
   - Backend normalizes punctuation, whitespace, and case.
   - Confirms `evidenceQuote` is a verbatim substring of the source section text.
   - Sets `evidenceVerified = true` or `false`.
7. **Teacher Review Screen**:
   - Filter drafts by All, Verified, Unverified, Approved, or Rejected.
   - Edit questions or choices inline.
   - Approve drafts individually or bulk-approve verified drafts with one click.
   - Approved questions instantly appear in the subject Question Bank with an `[AI-drafted]` badge.

---

## 6. Troubleshooting & FAQ

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| **503 Service Unavailable** | `app.llm.enabled=false` | Set `app.llm.enabled=true` in `application.properties` and restart backend. |
| **503 with Gemini Key Error** | `provider=gemini` but API key is missing | Set `$env:GEMINI_API_KEY` or `app.llm.gemini.api-key` in `application.properties`. |
| **"Google's free limit was reached"** | Exceeded Gemini free-tier rate limits (15 RPM / 1500 RPD) | Wait a minute or check your daily quota in Google AI Studio console. |
| **Connection Refused (`127.0.0.1:1234`)** | LM Studio server is not running | Open LM Studio $\to$ Developer tab $\to$ click **Start Server**. |
| **Generation Times Out after 60s** | Local model running on CPU is slow | Increase `app.llm.request-timeout-seconds=120` or switch to cloud mode (`provider=gemini`). |
| **Quote Not Found Badge on Draft** | Model paraphrased the cited text | Click **Edit Draft** to verify and adjust the question, or approve individually after manual verification. |
| **Bulk Approve Disabled** | Selection contains unverified drafts | Bulk approval requires all selected drafts to have verified quotes. Approve unverified drafts individually. |
| **Cannot Delete Source File (409)** | File is linked to approved questions | Files referenced by questions in the bank cannot be deleted to preserve provenance. Use **Archive** instead. |
