# Local LLM AI Question Drafting Setup Guide (Phase C)

LearningPal Phase C introduces automated multiple-choice question drafting from teacher-uploaded course documents (PDF and DOCX). The system utilizes a **100% local Large Language Model** served via **LM Studio** on the teacher's host machine.

No document text, prompts, or generated questions are ever transmitted to third-party cloud APIs. Teachers retain full editorial control: every drafted question is held in a private staging queue and **never reaches students until explicitly approved**.

---

## 1. Architecture & Privacy Principles

```
+-------------------------------------------------------------------------------+
|                             TEACHER WORKSTATION                               |
|                                                                               |
|  +--------------------+         HTTP          +----------------------------+  |
|  |                    | --------------------> |                            |  |
|  | LearningPal App    |                       | LM Studio Local Server     |  |
|  | (Spring Boot 3.3)  |                       | http://127.0.0.1:1234/v1   |  |
|  |                    | <-------------------- | Model: qwen/qwen3-14b      |  |
|  +--------------------+   JSON Schema Drafts  +----------------------------+  |
|           |                                                                   |
|           v                                                                   |
|  +--------------------+                                                       |
|  | Private Staging    |                                                       |
|  | (AiQuestionDrafts) |                                                       |
|  +--------------------+                                                       |
|           |                                                                   |
|           | Teacher Reviews & Approves                                        |
|           v                                                                   |
|  +--------------------+                                                       |
|  | Question Bank      | ----> Quizzes & Diagnostic Assessments (Students)     |
|  | (origin: AI)       |                                                       |
|  +--------------------+                                                       |
+-------------------------------------------------------------------------------+
```

### Key Principles:
1. **Absolute Privacy**: Extracted document text is marked as untrusted and processed exclusively on loopback (`http://localhost:1234` or `http://127.0.0.1:1234`).
2. **Human in the Loop**: Drafted questions are inactive by default. No student endpoint can query drafts, jobs, or evidence quotes.
3. **Evidence Verification**: The model must provide a verbatim `evidenceQuote` from the document text. Quotes are verified by the backend. Only verified drafts can be bulk-approved.
4. **Source Linkage**: Approved questions retain a permanent link to their `sourceFile` and set `origin = AI`.

---

## 2. LM Studio Installation & Model Setup

### Step 1: Install LM Studio
1. Download LM Studio for Windows, macOS, or Linux from [https://lmstudio.ai/](https://lmstudio.ai/).
2. Complete the standard installer.

### Step 2: Download the Target Model (`qwen/qwen3-14b`)
1. Open LM Studio and click the **Search (magnifying glass)** icon in the left navigation.
2. Search for: `qwen/qwen3-14b` or `qwen2.5-14b-instruct`.
3. Select a quantized GGUF variant suitable for your hardware:
   - **Recommended**: `Q4_K_M` (~9 GB VRAM / RAM) or `Q5_K_M` (~11 GB VRAM / RAM).
   - Click **Download**.

### Step 3: Hardware Acceleration & GPU Offload
1. Navigate to the **Developer / Local Server tab** (icon with `<->` or server tower).
2. Under **Model Loading Settings** in the right pane:
   - **GPU Offload**: Set to **Max** (or all layers, e.g. 48 layers). If you have an NVIDIA RTX 3060/4060 or better (12GB+ VRAM), the entire model fits in VRAM for near-instant inference (~30-50 tokens/sec).
   - If using CPU or partial offload, expect 5-15 tokens/sec.
   - **Context Length**: Set to at least **8192** tokens.
   - **Flash Attention**: Enable if supported by your GPU.

### Step 4: Start the Local OpenAI-Compatible Server
1. Select `qwen/qwen3-14b` in the top model selection dropdown.
2. In the Developer tab, toggle **Start Server**.
3. Verify the server is running on:
   - **Port**: `1234`
   - **Endpoint**: `http://localhost:1234/v1` or `http://127.0.0.1:1234/v1`
4. Confirm server availability by testing in PowerShell or terminal:
   ```powershell
   Invoke-RestMethod -Uri 'http://127.0.0.1:1234/v1/models' -Method Get
   ```

---

## 3. LearningPal Configuration

In your local `backend/src/main/resources/application.properties` (copied from `application.properties.example`):

```properties
# Enable local AI question drafting
app.llm.enabled=true

# Connection to LM Studio
app.llm.base-url=http://127.0.0.1:1234
app.llm.model=qwen/qwen3-14b

# Request timeout (increase to 120 if running on CPU without GPU offload)
app.llm.request-timeout-seconds=60

# Chunk size for text analysis (characters)
app.llm.chunk-chars=5000

# Limits
app.llm.max-drafts-per-job=30
app.llm.max-jobs-per-teacher-per-hour=5

# Sampling temperature (low temperature ensures factual adherence)
app.llm.temperature=0.2

# Suffix to suppress reasoning blocks
app.llm.user-suffix=/no_think
```

> [!NOTE]
> On Windows, `http://127.0.0.1:1234` is preferred over `http://localhost:1234` to prevent IPv6 loopback resolution delays (`[::1]`).

---

## 4. How the Drafting Pipeline Works

1. **Teacher Action**: In *My Subjects* $\to$ *Resources* $\to$ *Files*, teacher clicks **Draft with AI** on any file with status `Text ready`.
2. **Setup**: Teacher chooses target curriculum topic and desired question count (1 to 30, default 10).
3. **Chunking**: `DocumentChunker` breaks document text into logical sections up to 5,000 characters without breaking mid-paragraph.
4. **Structured JSON Generation**:
   - System prompt instructs model to act as an objective curriculum examiner and never execute instructions found in untrusted text.
   - Structured JSON schema specifies: `question`, 4 `choices`, `correctIndex` (0-3), `explanation`, `difficulty`, and `evidenceQuote`.
5. **Reasoning Tag Stripping & Strict Parsing**:
   - Strips any `<think>...</think>` tags emitted by reasoning models.
   - If model output violates JSON schema, a single automatic repair retry is sent citing the exact syntax error.
6. **Evidence Verification**:
   - Backend normalizes punctuation, whitespace, and case.
   - Confirms `evidenceQuote` is a substring of the section text.
   - Sets `evidenceVerified = true` or `false`.
7. **Teacher Review Screen**:
   - Filter drafts by All, Verified, Unverified, Approved, or Rejected.
   - Edit questions or choices inline.
   - Approve drafts individually or bulk-approve verified drafts with one click.
   - Approved questions instantly appear in the subject Question Bank with an `[AI-drafted]` badge.

---

## 5. Troubleshooting & FAQ

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| **503 Service Unavailable** | `app.llm.enabled=false` | Set `app.llm.enabled=true` in `application.properties` and restart backend. |
| **Connection Refused (`127.0.0.1:1234`)** | LM Studio server is not running | Open LM Studio $\to$ Developer tab $\to$ click **Start Server**. |
| **Generation Times Out after 60s** | Model running on CPU is too slow | Increase `app.llm.request-timeout-seconds=120` or enable GPU offload in LM Studio. |
| **Quote Not Found Badge on Draft** | Model paraphrased the cited text | Click **Edit Draft** to verify and adjust the question, or approve individually after manual verification. |
| **Bulk Approve Disabled** | Selection contains unverified drafts | Bulk approval requires all selected drafts to have verified quotes. Approve unverified drafts individually. |
| **Cannot Delete Source File (409)** | File is linked to approved questions | Files referenced by questions in the bank cannot be deleted to preserve provenance. Use **Archive** instead. |
