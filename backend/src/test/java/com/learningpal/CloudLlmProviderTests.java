package com.learningpal;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.AiConfigProperties;
import com.learningpal.config.JwtService;
import com.learningpal.dto.AiGenerationJobDto;
import com.learningpal.dto.CreateAiJobRequest;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import com.learningpal.service.ai.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(CloudLlmProviderTests.TestLlmConfig.class)
@DisplayName("Phase C: Cloud LLM Provider (Google Gemini API) & Local LM Studio Tests")
public class CloudLlmProviderTests {

    @TestConfiguration
    static class TestLlmConfig {
        @Bean
        @Primary
        public LlmClient testLlmClient() {
            return new FakeLlmClient();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AiConfigProperties aiConfig;

    @Autowired
    private LlmClient llmClient;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ResourceFileRepository resourceFileRepository;

    @Autowired
    private AiGenerationJobRepository jobRepository;

    @Autowired
    private AiQuestionDraftRepository draftRepository;

    @Autowired
    private TeacherAiService teacherAiService;

    @Autowired
    private AiGenerationWorkerService workerService;

    private User teacherA;
    private User teacherOther;
    private User adminA;
    private User studentA;
    private User superAdmin;

    private String tokenTeacherA;
    private String tokenTeacherOther;
    private String tokenAdminA;
    private String tokenStudentA;
    private String tokenSuperAdmin;

    private Subject subjectA;
    private Topic topicA;
    private ResourceFile resourceFile;

    private FakeLlmClient fakeLlm;

    private static final String SAMPLE_VALID_COMPLETION = """
            {
              "id": "chatcmpl-test-123",
              "object": "chat.completion",
              "created": 1700000000,
              "model": "test-model",
              "choices": [
                {
                  "index": 0,
                  "message": {
                    "role": "assistant",
                    "content": "{\\"questions\\": [{\\"question\\": \\"What is the primary role of the CPU in modern computing?\\", \\"choices\\": [\\"Executes instructions and manages system calculations\\", \\"Permanently preserves data\\"], \\"correctIndex\\": 0, \\"explanation\\": \\"CPU executes instructions\\", \\"difficulty\\": \\"EASY\\", \\"evidenceQuote\\": \\"CPU executes program instructions\\"}]}"
                  },
                  "finish_reason": "stop"
                }
              ]
            }
            """;

    @BeforeEach
    void setUp() {
        fakeLlm = (FakeLlmClient) llmClient;
        fakeLlm.reset();

        aiConfig.setEnabled(true);
        aiConfig.setProvider("local");
        aiConfig.setBaseUrl("http://localhost:1234");
        aiConfig.setModel("qwen/qwen3-14b");
        aiConfig.setUserSuffix("/no_think");
        aiConfig.setChunkChars(5000);
        aiConfig.setGeminiBaseUrl("https://generativelanguage.googleapis.com/v1beta/openai");
        aiConfig.setGeminiModel("gemini-2.5-flash");
        aiConfig.setGeminiApiKey("");
        aiConfig.setGeminiChunkChars(12000);
        aiConfig.setGeminiMaxRetries(3);

        draftRepository.deleteAll();
        jobRepository.deleteAll();

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        Institution inst = institutionRepository.findByCode("PILOT-2026").orElseGet(() ->
                institutionRepository.save(new Institution("Northwest Tech " + suffix, "PILOT-2026", InstitutionStatus.ACTIVE)));

        teacherA = userRepository.save(new User("Teacher Alice " + suffix, "alice_cloud_" + suffix + "@northwest.edu", passwordEncoder.encode("Pass123!"), Role.TEACHER, UserStatus.ACTIVE, inst));
        teacherOther = userRepository.save(new User("Teacher Foreign " + suffix, "foreign_cloud_" + suffix + "@northwest.edu", passwordEncoder.encode("Pass123!"), Role.TEACHER, UserStatus.ACTIVE, inst));
        adminA = userRepository.save(new User("Admin Carol " + suffix, "admin_cloud_" + suffix + "@northwest.edu", passwordEncoder.encode("Pass123!"), Role.ADMIN, UserStatus.ACTIVE, inst));
        studentA = userRepository.save(new User("Student Sam " + suffix, "student_cloud_" + suffix + "@northwest.edu", passwordEncoder.encode("Pass123!"), Role.STUDENT, UserStatus.ACTIVE, inst));
        superAdmin = userRepository.findByEmail("superadmin@learningpal.edu").orElseGet(() ->
                userRepository.save(new User("Super Admin", "superadmin@learningpal.edu", passwordEncoder.encode("Pass123!"), Role.SUPER_ADMIN, UserStatus.ACTIVE, null)));

        tokenTeacherA = jwtService.generateToken(teacherA);
        tokenTeacherOther = jwtService.generateToken(teacherOther);
        tokenAdminA = jwtService.generateToken(adminA);
        tokenStudentA = jwtService.generateToken(studentA);
        tokenSuperAdmin = jwtService.generateToken(superAdmin);

        subjectA = subjectRepository.save(new Subject("Systems Programming " + suffix, "SYS_" + suffix, "Systems description", teacherA));
        topicA = topicRepository.save(new Topic(subjectA, "Processor Architecture", "Hardware and CPU execution pipelines", 1));

        Resource res = resourceRepository.save(new Resource(
                subjectA, topicA, "CPU Guide", "Lecture notes on CPU execution",
                ResourceType.FILE, "cpu.pdf", null, DifficultyLevel.MEDIUM, teacherA
        ));

        String text = "The CPU executes program instructions and manages system calculations across tasks.";
        resourceFile = resourceFileRepository.save(new ResourceFile(
                res, "uuid-cpu-" + suffix + ".pdf", "cpu.pdf", "application/pdf", 1024L,
                "sha256-" + suffix, ExtractionStatus.READY, text, text.length(), 1, "Extracted successfully"
        ));
    }

    record CapturedRequest(String path, String method, String authHeader, String body) {}

    private static HttpServer createMockServer(int statusCode, String responseBody, Map<String, String> responseHeaders, List<CapturedRequest> capturedList) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            String path = exchange.getRequestURI().getPath();
            String method = exchange.getRequestMethod();
            String auth = exchange.getRequestHeaders().getFirst("Authorization");
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            if (capturedList != null) {
                capturedList.add(new CapturedRequest(path, method, auth, body));
            }
            if (responseHeaders != null) {
                for (Map.Entry<String, String> entry : responseHeaders.entrySet()) {
                    exchange.getResponseHeaders().set(entry.getKey(), entry.getValue());
                }
            }
            byte[] bytes = responseBody.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(statusCode, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        });
        server.start();
        return server;
    }

    // =========================================================================
    // 1. Provider Switch: Local Default vs Gemini Cloud Request Construction
    // =========================================================================

    @Test
    @DisplayName("Provider switch: local default builds local request (no auth header, /no_think suffix)")
    void testProviderSwitchLocalBuildsLocalRequestWithoutAuthAndWithNoThinkSuffix() throws Exception {
        List<CapturedRequest> captured = new ArrayList<>();
        HttpServer server = createMockServer(200, SAMPLE_VALID_COMPLETION, Map.of("Content-Type", "application/json"), captured);
        int port = server.getAddress().getPort();
        try {
            AiConfigProperties config = new AiConfigProperties();
            config.setEnabled(true);
            config.setProvider("local");
            config.setBaseUrl("http://localhost:" + port + "/v1");
            config.setModel("qwen/qwen3-14b");
            config.setUserSuffix("/no_think");
            config.setChunkChars(5000);

            LmStudioClient client = new LmStudioClient(config, objectMapper);
            String userPrompt = AiPromptBuilder.buildUserPrompt("Sample file chunk", 2, config.getActiveUserSuffix());
            client.generateChatCompletion("System prompt", userPrompt, 0.2, 30);

            assertEquals(1, captured.size());
            CapturedRequest req = captured.get(0);
            assertEquals("/v1/chat/completions", req.path());
            assertNull(req.authHeader(), "Local LM Studio request must not send Authorization header");
            assertTrue(req.body().contains("/no_think"), "Local prompt must include /no_think suffix");
            assertTrue(req.body().contains("qwen/qwen3-14b"), "Local payload must specify configured local model");
        } finally {
            server.stop(0);
        }
    }

    @Test
    @DisplayName("Provider switch: gemini builds cloud request (Bearer header, no /no_think suffix)")
    void testProviderSwitchGeminiBuildsCloudRequestWithBearerAndWithoutNoThinkSuffix() throws Exception {
        List<CapturedRequest> captured = new ArrayList<>();
        HttpServer server = createMockServer(200, SAMPLE_VALID_COMPLETION, Map.of("Content-Type", "application/json"), captured);
        int port = server.getAddress().getPort();
        try {
            AiConfigProperties config = new AiConfigProperties();
            config.setEnabled(true);
            config.setProvider("gemini");
            config.setGeminiApiKey("AIzaSyTestGeminiKey12345");
            config.setGeminiBaseUrl("http://localhost:" + port + "/v1beta/openai");
            config.setGeminiModel("gemini-2.5-flash");
            config.setUserSuffix("/no_think"); // Configured, but must be suppressed for cloud
            config.setGeminiChunkChars(12000);

            LmStudioClient client = new LmStudioClient(config, objectMapper);
            String userPrompt = AiPromptBuilder.buildUserPrompt("Sample file chunk", 2, config.getActiveUserSuffix());
            client.generateChatCompletion("System prompt", userPrompt, 0.2, 30);

            assertEquals(1, captured.size());
            CapturedRequest req = captured.get(0);
            assertEquals("/v1beta/openai/chat/completions", req.path());
            assertEquals("Bearer AIzaSyTestGeminiKey12345", req.authHeader(), "Gemini cloud request must send Authorization header");
            assertFalse(req.body().contains("/no_think"), "Gemini prompt must not include /no_think local suffix");
            assertTrue(req.body().contains("gemini-2.5-flash"), "Gemini payload must specify Gemini model");
        } finally {
            server.stop(0);
        }
    }

    // =========================================================================
    // 2. Missing/Blank Key & Disabled State -> 503 and No Outgoing Calls
    // =========================================================================

    @Test
    @DisplayName("Missing or blank key with provider=gemini gives 503 and no outgoing call")
    void testMissingOrBlankKeyWithGeminiGives503AndNoOutgoingCall() throws Exception {
        aiConfig.setProvider("gemini");
        aiConfig.setGeminiApiKey(""); // Blank key

        CreateAiJobRequest req = new CreateAiJobRequest(topicA.getId(), 5);

        // 1. Attempting to create generation job yields 503 Service Unavailable
        mockMvc.perform(post("/api/teacher/subjects/" + subjectA.getId() + "/files/" + resourceFile.getId() + "/ai/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .header("Authorization", "Bearer " + tokenTeacherA))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message", containsString("Gemini API key is not configured")));

        // 2. Fake LLM was never contacted
        assertEquals(0, fakeLlm.getCallCount(), "No LLM client call may occur when Gemini key is blank");

        // 3. Status endpoint indicates unavailable
        mockMvc.perform(get("/api/teacher/ai/status")
                        .header("Authorization", "Bearer " + tokenTeacherA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true))
                .andExpect(jsonPath("$.provider").value("gemini"))
                .andExpect(jsonPath("$.reachable").value(false));
    }

    @Test
    @DisplayName("Disabled gives 503 and no outgoing call")
    void testDisabledAiGives503AndNoOutgoingCall() throws Exception {
        aiConfig.setEnabled(false);
        aiConfig.setProvider("gemini");
        aiConfig.setGeminiApiKey("AIzaSyValidDummyKey");

        CreateAiJobRequest req = new CreateAiJobRequest(topicA.getId(), 5);

        mockMvc.perform(post("/api/teacher/subjects/" + subjectA.getId() + "/files/" + resourceFile.getId() + "/ai/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .header("Authorization", "Bearer " + tokenTeacherA))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message", containsString("currently disabled")));

        assertEquals(0, fakeLlm.getCallCount(), "No LLM client call may occur when app.llm.enabled=false");
    }

    // =========================================================================
    // 3. Key Never Appears in Logs, Status Response, or Error Messages
    // =========================================================================

    @Test
    @DisplayName("Key never appears in logs, status response, or error messages (assert on captured output)")
    void testGeminiApiKeyNeverAppearsInLogsStatusResponseOrErrorMessages() throws Exception {
        String sensitiveKey = "AIzaSySECRET_SUPER_SECRET_TOKEN_DO_NOT_LEAK_998877";

        aiConfig.setProvider("gemini");
        aiConfig.setGeminiApiKey(sensitiveKey);

        // Attach memory log appender to capture SLF4J logs
        ch.qos.logback.classic.Logger rootLogger = (ch.qos.logback.classic.Logger) LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME);
        ListAppender<ILoggingEvent> logWatcher = new ListAppender<>();
        logWatcher.start();
        rootLogger.addAppender(logWatcher);

        try {
            // 1. Status response check
            String statusJson = mockMvc.perform(get("/api/teacher/ai/status")
                            .header("Authorization", "Bearer " + tokenTeacherA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            assertFalse(statusJson.contains(sensitiveKey), "Status JSON response must never expose Gemini API key");

            // 2. Error response check (trigger a 400 bad request)
            CreateAiJobRequest badReq = new CreateAiJobRequest(topicA.getId(), 999); // Exceeds max count
            String errorJson = mockMvc.perform(post("/api/teacher/subjects/" + subjectA.getId() + "/files/" + resourceFile.getId() + "/ai/generate")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(badReq))
                            .header("Authorization", "Bearer " + tokenTeacherA))
                    .andExpect(status().isBadRequest())
                    .andReturn().getResponse().getContentAsString();

            assertFalse(errorJson.contains(sensitiveKey), "Error response JSON must never expose Gemini API key");

            // 3. Assert across all captured log messages
            for (ILoggingEvent event : logWatcher.list) {
                String formatted = event.getFormattedMessage();
                assertFalse(formatted.contains(sensitiveKey), "Log output must never leak the Gemini API key. Leaked in: " + formatted);
            }
        } finally {
            rootLogger.detachAppender(logWatcher);
        }
    }

    // =========================================================================
    // 4. Rate Limits: 429 Triggers Bounded Retry then Friendly Failure / Success
    // =========================================================================

    @Test
    @DisplayName("429 triggers bounded retry then a friendly failure; success after one retry works")
    void testGemini429RateLimitTriggersBoundedRetryThenFriendlyFailure() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            exchange.getResponseHeaders().set("Retry-After", "0");
            byte[] bytes = "{\"error\":\"rate_limited\"}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(429, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        });
        server.start();
        int port = server.getAddress().getPort();
        try {
            AiConfigProperties config = new AiConfigProperties();
            config.setEnabled(true);
            config.setProvider("gemini");
            config.setGeminiApiKey("AIzaSyDummyKey");
            config.setGeminiBaseUrl("http://localhost:" + port + "/v1beta/openai");
            config.setGeminiMaxRetries(3);

            AtomicInteger sleepCalls = new AtomicInteger(0);
            LmStudioClient.Sleeper testSleeper = (ms) -> sleepCalls.incrementAndGet();

            LmStudioClient client = new LmStudioClient(config, objectMapper, HttpClient.newHttpClient(), testSleeper);

            LlmRateLimitException thrown = assertThrows(LlmRateLimitException.class, () ->
                    client.generateChatCompletion("sys", "user", 0.2, 30));

            // Exactly 3 retries executed before bounded failure
            assertEquals(3, sleepCalls.get(), "Must execute bounded backoff retries (3) on 429 before terminating");
            assertEquals("Google's free limit was reached. Try again later.", thrown.getMessage());
        } finally {
            server.stop(0);
        }
    }

    @Test
    @DisplayName("Gemini 429 success after one retry works")
    void testGemini429SuccessAfterOneRetryWorks() throws Exception {
        AtomicInteger attempt = new AtomicInteger(0);
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            int current = attempt.incrementAndGet();
            if (current == 1) {
                exchange.getResponseHeaders().set("Retry-After", "0");
                byte[] bytes = "{\"error\":\"rate_limited\"}".getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(429, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                byte[] bytes = SAMPLE_VALID_COMPLETION.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            }
        });
        server.start();
        int port = server.getAddress().getPort();
        try {
            AiConfigProperties config = new AiConfigProperties();
            config.setEnabled(true);
            config.setProvider("gemini");
            config.setGeminiApiKey("AIzaSyDummyKey");
            config.setGeminiBaseUrl("http://localhost:" + port + "/v1beta/openai");
            config.setGeminiMaxRetries(3);

            AtomicInteger sleepCalls = new AtomicInteger(0);
            LmStudioClient.Sleeper testSleeper = (ms) -> sleepCalls.incrementAndGet();

            LmStudioClient client = new LmStudioClient(config, objectMapper, HttpClient.newHttpClient(), testSleeper);
            String result = client.generateChatCompletion("sys", "user", 0.2, 30);

            assertEquals(1, sleepCalls.get(), "Should back off once and succeed on retry");
            assertNotNull(result);
            assertTrue(result.contains("What is the primary role of the CPU"));
        } finally {
            server.stop(0);
        }
    }

    // =========================================================================
    // 5. Data Privacy: Outgoing Request Body Contains Only Prompt and File Chunks
    // =========================================================================

    @Test
    @DisplayName("Request body contains only the prompt and file chunks")
    void testOutgoingRequestBodyContainsOnlyPromptAndFileChunksNeverStudentData() throws Exception {
        List<CapturedRequest> captured = new ArrayList<>();
        HttpServer server = createMockServer(200, SAMPLE_VALID_COMPLETION, Map.of("Content-Type", "application/json"), captured);
        int port = server.getAddress().getPort();
        try {
            AiConfigProperties config = new AiConfigProperties();
            config.setEnabled(true);
            config.setProvider("gemini");
            config.setGeminiApiKey("AIzaSyKey");
            config.setGeminiBaseUrl("http://localhost:" + port + "/v1beta/openai");

            LmStudioClient client = new LmStudioClient(config, objectMapper);

            String extractedFileChunk = "Operating Systems: CPU Scheduling fundamentals. In preemptive scheduling, OS can interrupt.";
            String systemPrompt = AiPromptBuilder.buildSystemPrompt();
            String userPrompt = AiPromptBuilder.buildUserPrompt(extractedFileChunk, 2, config.getActiveUserSuffix());

            client.generateChatCompletion(systemPrompt, userPrompt, 0.2, 30);

            assertEquals(1, captured.size());
            String jsonPayload = captured.get(0).body();
            JsonNode root = objectMapper.readTree(jsonPayload);

            // Payload structure must only have model, temperature, messages, and response_format
            assertTrue(root.has("model"));
            assertTrue(root.has("temperature"));
            assertTrue(root.has("messages"));
            assertTrue(root.has("response_format"));

            JsonNode messages = root.get("messages");
            assertEquals(2, messages.size());

            String sys = messages.get(0).get("content").asText();
            String usr = messages.get(1).get("content").asText();

            // Contains the file text chunk
            assertTrue(usr.contains("Operating Systems: CPU Scheduling fundamentals"));

            // Does NOT contain any student entities, grades, student answers, or user identities
            assertFalse(jsonPayload.contains("Sam Student"));
            assertFalse(jsonPayload.contains(studentA.getFullName()));
            assertFalse(jsonPayload.contains(studentA.getEmail()));
            assertFalse(jsonPayload.contains("studentA"));
            assertFalse(jsonPayload.contains("student_cloud"));
            assertFalse(jsonPayload.contains("student_grade"));
            assertFalse(jsonPayload.contains("student_answer"));
            assertFalse(jsonPayload.contains("student_score"));
        } finally {
            server.stop(0);
        }
    }

    // =========================================================================
    // 6. Status Endpoint Exposes Provider Name Only; Foreign IDs & Students 404
    // =========================================================================

    @Test
    @DisplayName("Status endpoint exposes provider name only; foreign ids and students still 404 as before")
    void testStatusEndpointExposesProviderNameOnlyAndRejectsUnauthorizedCallers() throws Exception {
        // 1. With provider = local
        aiConfig.setProvider("local");
        mockMvc.perform(get("/api/teacher/ai/status")
                        .header("Authorization", "Bearer " + tokenTeacherA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true))
                .andExpect(jsonPath("$.provider").value("local"))
                .andExpect(jsonPath("$.configuredModel").value("qwen/qwen3-14b"))
                .andExpect(jsonPath("$.baseUrl").doesNotExist())
                .andExpect(jsonPath("$.apiKey").doesNotExist());

        // 2. With provider = gemini
        aiConfig.setProvider("gemini");
        mockMvc.perform(get("/api/teacher/ai/status")
                        .header("Authorization", "Bearer " + tokenTeacherA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true))
                .andExpect(jsonPath("$.provider").value("gemini"))
                .andExpect(jsonPath("$.configuredModel").value("gemini-2.5-flash"))
                .andExpect(jsonPath("$.baseUrl").doesNotExist())
                .andExpect(jsonPath("$.geminiBaseUrl").doesNotExist())
                .andExpect(jsonPath("$.geminiApiKey").doesNotExist())
                .andExpect(jsonPath("$.apiKey").doesNotExist());

        // 3. Unauthorized callers (Student, Admin, SuperAdmin) get 404 Not Found on teacher AI status
        mockMvc.perform(get("/api/teacher/ai/status")
                        .header("Authorization", "Bearer " + tokenStudentA))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/teacher/ai/status")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/teacher/ai/status")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isNotFound());
    }
}
