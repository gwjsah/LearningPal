package com.learningpal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.DatabaseMigrationRunner;
import com.learningpal.config.JwtService;
import com.learningpal.dto.CreateInstitutionRequest;
import com.learningpal.dto.ReassignTeacherRequest;
import com.learningpal.dto.SignupRequest;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import com.learningpal.service.JoinCodeGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Multi-Institution & Classroom Architecture Tests")
public class MultiInstitutionTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private ClassEntityRepository classEntityRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JoinCodeGenerator joinCodeGenerator;

    @Autowired
    private DatabaseMigrationRunner migrationRunner;

    // Test fixtures
    private Institution instA;
    private Institution instB;

    private User adminA;
    private String adminAToken;

    private User adminB;
    private String adminBToken;

    private User superAdmin;
    private String superAdminToken;

    private User teacherA1;
    private User teacherA2;
    private User teacherB1;

    private ClassEntity classA;
    private ClassEntity classB;
    private Subject subject;

    @BeforeEach
    void setUp() {
        // Clear previous state for test isolation
        subject = subjectRepository.findByCode("C_PROG_INTRO").orElseGet(() ->
                subjectRepository.save(new Subject("C_PROG_INTRO", "C Programming", "Basics"))
        );

        instA = institutionRepository.findByCode("ALPHA-2026").orElseGet(() ->
                institutionRepository.save(new Institution("Alpha Academy", "ALPHA-2026", InstitutionStatus.ACTIVE))
        );

        instB = institutionRepository.findByCode("BETA-2026").orElseGet(() ->
                institutionRepository.save(new Institution("Beta College", "BETA-2026", InstitutionStatus.ACTIVE))
        );

        adminA = userRepository.findByEmail("admin.alpha@learningpal.edu").orElseGet(() ->
                userRepository.save(new User("Admin Alpha", "admin.alpha@learningpal.edu", passwordEncoder.encode("Password123!"), Role.ADMIN, UserStatus.ACTIVE, instA))
        );
        adminAToken = jwtService.generateToken(adminA);

        adminB = userRepository.findByEmail("admin.beta@learningpal.edu").orElseGet(() ->
                userRepository.save(new User("Admin Beta", "admin.beta@learningpal.edu", passwordEncoder.encode("Password123!"), Role.ADMIN, UserStatus.ACTIVE, instB))
        );
        adminBToken = jwtService.generateToken(adminB);

        superAdmin = userRepository.findByEmail("superadmin.test@learningpal.edu").orElseGet(() ->
                userRepository.save(new User("Platform Super Admin", "superadmin.test@learningpal.edu", passwordEncoder.encode("Password123!"), Role.SUPER_ADMIN, UserStatus.ACTIVE, null))
        );
        superAdminToken = jwtService.generateToken(superAdmin);

        teacherA1 = userRepository.findByEmail("teacher.a1@alpha.edu").orElseGet(() ->
                userRepository.save(new User("Teacher A1", "teacher.a1@alpha.edu", passwordEncoder.encode("Password123!"), Role.TEACHER, UserStatus.ACTIVE, instA))
        );

        teacherA2 = userRepository.findByEmail("teacher.a2@alpha.edu").orElseGet(() ->
                userRepository.save(new User("Teacher A2", "teacher.a2@alpha.edu", passwordEncoder.encode("Password123!"), Role.TEACHER, UserStatus.ACTIVE, instA))
        );

        teacherB1 = userRepository.findByEmail("teacher.b1@beta.edu").orElseGet(() ->
                userRepository.save(new User("Teacher B1", "teacher.b1@beta.edu", passwordEncoder.encode("Password123!"), Role.TEACHER, UserStatus.ACTIVE, instB))
        );

        classA = classEntityRepository.findByInstitutionAndJoinCode(instA, "ALPH01").orElseGet(() ->
                classEntityRepository.save(new ClassEntity(instA, subject, teacherA1, "Alpha Section 1", "ALPH01"))
        );

        classB = classEntityRepository.findByInstitutionAndJoinCode(instB, "BETA01").orElseGet(() ->
                classEntityRepository.save(new ClassEntity(instB, subject, teacherB1, "Beta Section 1", "BETA01"))
        );
    }

    // =========================================================================
    // 1. Two-Institution Isolation Tests
    // =========================================================================

    @Test
    @DisplayName("Admin A cannot view, approve, reject, deactivate, or reassign anything in Institution B (returns 404)")
    void testTenantIsolationCrossInstitutionReturns404() throws Exception {
        // Create a pending teacher in Institution B
        User pendingTeacherB = userRepository.findByEmail("pending.b@beta.edu").orElseGet(() ->
                userRepository.save(new User("Pending B", "pending.b@beta.edu", passwordEncoder.encode("Password123!"), Role.TEACHER, UserStatus.PENDING, instB))
        );

        // 1. Admin A listing pending teachers should NOT see pendingTeacherB
        mockMvc.perform(get("/api/admin/teachers/pending")
                        .header("Authorization", "Bearer " + adminAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].email", not(hasItem("pending.b@beta.edu"))));

        // 2. Admin A trying to approve Teacher B returns 404
        mockMvc.perform(post("/api/admin/teachers/" + pendingTeacherB.getId() + "/approve")
                        .header("Authorization", "Bearer " + adminAToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Entity not found")));

        // 3. Admin A trying to reject Teacher B returns 404
        mockMvc.perform(post("/api/admin/teachers/" + pendingTeacherB.getId() + "/reject")
                        .header("Authorization", "Bearer " + adminAToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Entity not found")));

        // 4. Admin A trying to deactivate User B returns 404
        mockMvc.perform(post("/api/admin/users/" + teacherB1.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminAToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Entity not found")));

        // 5. Admin A trying to reassign Class B returns 404
        ReassignTeacherRequest reassignReq = new ReassignTeacherRequest(teacherA1.getId());
        mockMvc.perform(put("/api/admin/classes/" + classB.getId() + "/teacher")
                        .header("Authorization", "Bearer " + adminAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reassignReq)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Entity not found")));

        // 6. Admin A trying to assign Teacher B into Class A returns 404
        ReassignTeacherRequest crossTeacherReq = new ReassignTeacherRequest(teacherB1.getId());
        mockMvc.perform(put("/api/admin/classes/" + classA.getId() + "/teacher")
                        .header("Authorization", "Bearer " + adminAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(crossTeacherReq)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Entity not found")));
    }

    @Test
    @DisplayName("Admin cannot deactivate self (400) or a SUPER_ADMIN (404 zero-leakage)")
    void testAdminCannotDeactivateSelfOrSuperAdmin() throws Exception {
        // Self
        mockMvc.perform(post("/api/admin/users/" + adminA.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminAToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("You cannot deactivate your own account")));

        // Super Admin (foreign/platform account -> uniform 404)
        mockMvc.perform(post("/api/admin/users/" + superAdmin.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminAToken))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // 2. Signup & Institution Gating Tests
    // =========================================================================

    @Test
    @DisplayName("Signup: valid institution code creates student ACTIVE immediately with JWT token")
    void testStudentSignupWithValidCode() throws Exception {
        SignupRequest request = new SignupRequest(
                "Fresh Student Alpha",
                "student.fresh@alpha.edu",
                "Password123!",
                Role.STUDENT,
                "ALPHA-2026"
        );

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.status", is("ACTIVE")))
                .andExpect(jsonPath("$.user.institutionCode", is("ALPHA-2026")));
    }

    @Test
    @DisplayName("Signup: valid institution code creates teacher PENDING with no JWT token")
    void testTeacherSignupWithValidCode() throws Exception {
        SignupRequest request = new SignupRequest(
                "Fresh Teacher Alpha",
                "teacher.fresh@alpha.edu",
                "Password123!",
                Role.TEACHER,
                "alpha-2026" // lowercase should normalize
        );

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.user.status", is("PENDING")))
                .andExpect(jsonPath("$.message", containsString("An admin needs to approve your teacher account")));
    }

    @Test
    @DisplayName("Signup: unknown or inactive institution code returns generic 400 Bad Request")
    void testSignupWithInvalidOrInactiveCode() throws Exception {
        // Unknown code
        SignupRequest reqUnknown = new SignupRequest(
                "Test Student",
                "test.unknown@school.edu",
                "Password123!",
                Role.STUDENT,
                "DOES_NOT_EXIST_CODE"
        );
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqUnknown)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Invalid institution code")));

        // Inactive institution
        Institution inactiveInst = institutionRepository.save(new Institution("Inactive School", "INACTIVE-2026", InstitutionStatus.INACTIVE));
        SignupRequest reqInactive = new SignupRequest(
                "Test Student 2",
                "test.inactive@school.edu",
                "Password123!",
                Role.STUDENT,
                "INACTIVE-2026"
        );
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqInactive)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Invalid institution code")));
    }

    @Test
    @DisplayName("Signup: attempt to sign up as ADMIN or SUPER_ADMIN is rejected with 400")
    void testAdminAndSuperAdminSignupRejected() throws Exception {
        SignupRequest reqAdmin = new SignupRequest(
                "Fake Admin",
                "fake.admin@school.edu",
                "Password123!",
                Role.ADMIN,
                "ALPHA-2026"
        );
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqAdmin)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Public signup is only available for STUDENT or TEACHER roles")));

        SignupRequest reqSuper = new SignupRequest(
                "Fake Super",
                "fake.super@school.edu",
                "Password123!",
                Role.SUPER_ADMIN,
                "ALPHA-2026"
        );
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqSuper)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Public signup is only available for STUDENT or TEACHER roles")));
    }

    @Test
    @DisplayName("Signup: duplicate email returns 409 Conflict")
    void testDuplicateEmailRejected() throws Exception {
        SignupRequest dupReq = new SignupRequest(
                "Duplicate Person",
                "teacher.a1@alpha.edu",
                "Password123!",
                Role.STUDENT,
                "ALPHA-2026"
        );
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dupReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", is("An account with this email already exists")));
    }

    // =========================================================================
    // 3. User Deactivation & Lifecycle Tests
    // =========================================================================

    @Test
    @DisplayName("Deactivated user cannot log in and token immediately stops working")
    void testDeactivatedUserLoginAndTokenRevocation() throws Exception {
        User student = userRepository.findByEmail("deact.student@alpha.edu").orElseGet(() ->
                userRepository.save(new User("Deact Student", "deact.student@alpha.edu", passwordEncoder.encode("Password123!"), Role.STUDENT, UserStatus.ACTIVE, instA))
        );
        String studentToken = jwtService.generateToken(student);

        // Deactivate via Admin A
        mockMvc.perform(post("/api/admin/users/" + student.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("deactivated successfully")));

        // Attempt login -> 403 Forbidden
        String loginPayload = "{\"email\":\"deact.student@alpha.edu\",\"password\":\"Password123!\"}";
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("account has been deactivated")));

        // Previous JWT token must be rejected by filter (401)
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Deactivating a teacher preserves their classes, and class can be reassigned to active teacher")
    void testDeactivateTeacherPreservesClassAndSupportsReassignment() throws Exception {
        User departingTeacher = userRepository.findByEmail("departing.teacher@alpha.edu").orElseGet(() ->
                userRepository.save(new User("Departing Teacher", "departing.teacher@alpha.edu", passwordEncoder.encode("Password123!"), Role.TEACHER, UserStatus.ACTIVE, instA))
        );
        ClassEntity cls = classEntityRepository.save(new ClassEntity(instA, subject, departingTeacher, "Departing Section", "DEP001"));

        // Admin deactivates departing teacher
        mockMvc.perform(post("/api/admin/users/" + departingTeacher.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminAToken))
                .andExpect(status().isOk());

        // Class must still exist and be intact
        ClassEntity savedCls = classEntityRepository.findById(cls.getId()).orElseThrow();
        assertEquals("Departing Section", savedCls.getName());

        // Reassign class to Teacher A2 (Active in same institution)
        ReassignTeacherRequest reassign = new ReassignTeacherRequest(teacherA2.getId());
        mockMvc.perform(put("/api/admin/classes/" + cls.getId() + "/teacher")
                        .header("Authorization", "Bearer " + adminAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reassign)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("successfully reassigned to Teacher A2")));

        ClassEntity updatedCls = classEntityRepository.findById(cls.getId()).orElseThrow();
        assertEquals(teacherA2.getId(), updatedCls.getTeacher().getId());
    }

    // =========================================================================
    // 4. Super Admin Tests
    // =========================================================================

    @Test
    @DisplayName("Super Admin endpoints are refused with 403 for other roles (Student, Teacher, Admin)")
    void testSuperAdminEndpointsRefusedForOtherRoles() throws Exception {
        User student = userRepository.findByEmail("student.fresh@alpha.edu").orElseGet(() ->
                userRepository.save(new User("Fresh Student", "student.fresh@alpha.edu", passwordEncoder.encode("Password123!"), Role.STUDENT, UserStatus.ACTIVE, instA))
        );
        String studentToken = jwtService.generateToken(student);
        String teacherToken = jwtService.generateToken(teacherA1);

        // Student -> 403
        mockMvc.perform(get("/api/super/institutions")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        // Teacher -> 403
        mockMvc.perform(get("/api/super/institutions")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isForbidden());

        // Institution Admin -> 403
        mockMvc.perform(get("/api/super/institutions")
                        .header("Authorization", "Bearer " + adminAToken))
                .andExpect(status().isForbidden());

        // Super Admin -> 200 OK
        mockMvc.perform(get("/api/super/institutions")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))));
    }

    @Test
    @DisplayName("Super Admin creates institution and its initial ADMIN in one transaction; rejects duplicates")
    void testSuperAdminCreatesInstitutionAndAdmin() throws Exception {
        CreateInstitutionRequest req = new CreateInstitutionRequest(
                "Pacific State University",
                "PACIFIC-2026",
                "Dean Robert Lee",
                "r.lee@pacific.edu",
                "PacificPass123!"
        );

        MvcResult res = mockMvc.perform(post("/api/super/institutions")
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Pacific State University")))
                .andExpect(jsonPath("$.code", is("PACIFIC-2026")))
                .andExpect(jsonPath("$.admin.email", is("r.lee@pacific.edu")))
                .andExpect(jsonPath("$.admin.role", is("ADMIN")))
                .andExpect(jsonPath("$.admin.status", is("ACTIVE")))
                .andReturn();

        // Verify admin exists in DB with institution link
        User dean = userRepository.findByEmail("r.lee@pacific.edu").orElseThrow();
        assertNotNull(dean.getInstitution());
        Institution deanInst = institutionRepository.findById(dean.getInstitution().getId()).orElseThrow();
        assertEquals("PACIFIC-2026", deanInst.getCode());

        // Duplicate institution code rejected with 409
        CreateInstitutionRequest dupReq = new CreateInstitutionRequest(
                "Pacific Duplicate",
                "PACIFIC-2026",
                "Other Dean",
                "other.dean@pacific.edu",
                "PacificPass123!"
        );
        mockMvc.perform(post("/api/super/institutions")
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dupReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Institution code already exists")));
    }

    // =========================================================================
    // 5. Database Migration Idempotence Test
    // =========================================================================

    @Test
    @DisplayName("Migration runner runs cleanly on existing data and running twice changes nothing")
    void testMigrationRunnerIdempotence() {
        // Run migration first time
        migrationRunner.run();

        Institution pilot = institutionRepository.findByCode("PILOT-2026").orElseThrow();
        assertEquals("Pilot University", pilot.getName());

        long unassignedUsersCount = userRepository.findByInstitutionIsNullAndRoleNot(Role.SUPER_ADMIN).size();
        assertEquals(0, unassignedUsersCount, "All non-super users should belong to an institution");

        // Run migration second time
        migrationRunner.run();

        long unassignedUsersSecondCount = userRepository.findByInstitutionIsNullAndRoleNot(Role.SUPER_ADMIN).size();
        assertEquals(0, unassignedUsersSecondCount, "Second run should be idempotent and change nothing");
    }
}
