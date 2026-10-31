package com.learningpal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class LearningPalApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String studentToken;
    private static String adminToken;
    private static Long pendingTeacherId;

    @Test
    @Order(1)
    void scenario1_studentSignupReturnsToken() throws Exception {
        String payload = """
            {
              "fullName": "Alex Rivera",
              "email": "alex.student@learningpal.edu",
              "password": "Password123",
              "role": "STUDENT"
            }
            """;

        MvcResult result = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.email", is("alex.student@learningpal.edu")))
                .andExpect(jsonPath("$.user.role", is("STUDENT")))
                .andExpect(jsonPath("$.user.status", is("ACTIVE")))
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(result.getResponse().getContentAsString());
        studentToken = jsonNode.get("token").asText();
    }

    @Test
    @Order(2)
    void scenario2_weakPasswordRejectedWith400() throws Exception {
        String payload = """
            {
              "fullName": "Weak Password User",
              "email": "weak@learningpal.edu",
              "password": "passwordonly",
              "role": "STUDENT"
            }
            """;

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Password needs at least one letter and one number")));
    }

    @Test
    @Order(3)
    void scenario3_teacherSignupReturnsNoToken() throws Exception {
        String payload = """
            {
              "fullName": "Maria Santos",
              "email": "maria.teacher@learningpal.edu",
              "password": "TeacherPass123",
              "role": "TEACHER"
            }
            """;

        MvcResult result = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.user.email", is("maria.teacher@learningpal.edu")))
                .andExpect(jsonPath("$.user.status", is("PENDING")))
                .andExpect(jsonPath("$.message", containsString("An admin needs to approve your teacher account")))
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(result.getResponse().getContentAsString());
        pendingTeacherId = jsonNode.get("user").get("id").asLong();
    }

    @Test
    @Order(4)
    void scenario4_teacherLoginBeforeApprovalReturns403() throws Exception {
        String payload = """
            {
              "email": "maria.teacher@learningpal.edu",
              "password": "TeacherPass123"
            }
            """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", is("Your teacher account is awaiting admin approval")));
    }

    @Test
    @Order(5)
    void scenario5_adminLoginAndApproveTeacher() throws Exception {
        // Step A: Admin Login using seed credentials
        String adminLoginPayload = """
            {
              "email": "admin@learningpal.edu",
              "password": "AdminPass123"
            }
            """;

        MvcResult adminLoginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(adminLoginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.role", is("ADMIN")))
                .andReturn();

        JsonNode adminJson = objectMapper.readTree(adminLoginResult.getResponse().getContentAsString());
        adminToken = adminJson.get("token").asText();

        // Step B: List pending teachers
        mockMvc.perform(get("/api/admin/teachers/pending")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].email", is("maria.teacher@learningpal.edu")));

        // Step C: Approve the teacher
        mockMvc.perform(post("/api/admin/teachers/" + pendingTeacherId + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Teacher account approved successfully")));
    }

    @Test
    @Order(6)
    void scenario6_teacherLoginAfterApprovalSucceeds() throws Exception {
        String payload = """
            {
              "email": "maria.teacher@learningpal.edu",
              "password": "TeacherPass123"
            }
            """;

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.status", is("ACTIVE")))
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(result.getResponse().getContentAsString());
        String teacherToken = jsonNode.get("token").asText();

        // Verify teacher can hit teacher ping
        mockMvc.perform(get("/api/teacher/ping")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Teacher role authorization confirmed")));
    }

    @Test
    @Order(7)
    void scenario7_studentTokenCallingAdminEndpointReturns403() throws Exception {
        mockMvc.perform(get("/api/admin/teachers/pending")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", is("You do not have permission to access this resource")));
    }
}
