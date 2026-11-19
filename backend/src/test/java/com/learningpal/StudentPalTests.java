package com.learningpal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StudentPalTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void studentSignupDefaultsAndCustomPalPersistAcrossMeAndPatch() throws Exception {
        // 1. Default Pal on signup (Pip / sticky / yellow)
        String defaultSignup = """
            {
              "fullName": "Default Pal Student",
              "email": "pal.default@student.edu",
              "password": "Password123",
              "role": "STUDENT",
              "institutionCode": "PILOT-2026"
            }
            """;

        MvcResult defaultRes = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(defaultSignup))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.palName").value("Pip"))
                .andExpect(jsonPath("$.user.palStyle").value("sticky"))
                .andExpect(jsonPath("$.user.palColor").value("yellow"))
                .andExpect(jsonPath("$.user.palEnabled").value(true))
                .andExpect(jsonPath("$.user.palQuietInQuiz").value(true))
                .andExpect(jsonPath("$.user.palAccessory").value("none"))
                .andReturn();

        JsonNode defaultJson = objectMapper.readTree(defaultRes.getResponse().getContentAsString());
        String token = defaultJson.get("token").asText();

        // 2. PATCH /api/student/pal updates style, color, name, visibility toggles, and accessory
        String updatePayload = """
            {
              "palName": "Mochi",
              "palStyle": "shiba",
              "palColor": "mint",
              "palEnabled": true,
              "palQuietInQuiz": false,
              "palAccessory": "crown"
            }
            """;

        mockMvc.perform(patch("/api/student/pal")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.palName").value("Mochi"))
                .andExpect(jsonPath("$.palStyle").value("shiba"))
                .andExpect(jsonPath("$.palColor").value("mint"))
                .andExpect(jsonPath("$.palEnabled").value(true))
                .andExpect(jsonPath("$.palQuietInQuiz").value(false))
                .andExpect(jsonPath("$.palAccessory").value("crown"));

        // 3. PATCH /api/auth/profile updates display name
        mockMvc.perform(patch("/api/auth/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Maya Santos\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Maya Santos"));

        // 4. Persisted on GET /api/auth/me (cross-device sync)
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Maya Santos"))
                .andExpect(jsonPath("$.palName").value("Mochi"))
                .andExpect(jsonPath("$.palStyle").value("shiba"))
                .andExpect(jsonPath("$.palColor").value("mint"))
                .andExpect(jsonPath("$.palEnabled").value(true))
                .andExpect(jsonPath("$.palQuietInQuiz").value(false))
                .andExpect(jsonPath("$.palAccessory").value("crown"));

        // 5. Invalid pal style or accessory rejected with 400
        mockMvc.perform(patch("/api/student/pal")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"palName\":\"Mochi\",\"palStyle\":\"dragon\",\"palColor\":\"mint\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(patch("/api/student/pal")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"palName\":\"Mochi\",\"palStyle\":\"shiba\",\"palColor\":\"mint\",\"palAccessory\":\"jetpack\"}"))
                .andExpect(status().isBadRequest());

        // 5. Control characters in palName rejected with 400
        mockMvc.perform(patch("/api/student/pal")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"palName\":\"Mochi\\nInjected\",\"palStyle\":\"shiba\",\"palColor\":\"mint\"}"))
                .andExpect(status().isBadRequest());

        // 6. Unauthenticated PATCH /api/student/pal rejected with 401
        mockMvc.perform(patch("/api/student/pal")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isUnauthorized());
    }
}
