package com.learningpal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.JwtService;
import com.learningpal.dto.ReassignTeacherRequest;
import com.learningpal.dto.SubmitAttemptRequest;
import com.learningpal.entity.*;
import com.learningpal.exception.ResourceNotFoundException;
import com.learningpal.repository.*;
import com.learningpal.service.TenantAccess;
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

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Isolation Matrix & Cross-Tenant / Cross-User Security Tests")
public class IsolationMatrixTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TenantAccess tenantAccess;

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
    private AssessmentRepository assessmentRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private InterventionRepository interventionRepository;

    @Autowired
    private StudentTopicMasteryRepository studentTopicMasteryRepository;

    @Autowired
    private GapValidationLabelRepository gapValidationLabelRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ResourceFileRepository resourceFileRepository;

    @Autowired
    private com.learningpal.service.TeacherFileService teacherFileService;

    @Autowired
    private com.learningpal.service.StudentClassService studentClassService;

    private Institution instA;
    private Institution instB;

    private User adminA;
    private User adminB;

    private User teacherA1;
    private User teacherA2;
    private User teacherB1;

    private User studentA1;
    private User studentA2;
    private User studentB1;

    private Subject subject;
    private Assessment assessment;

    private ClassEntity classA1;
    private ClassEntity classA2;
    private ClassEntity classB1;

    private Attempt attemptA2;
    private Attempt attemptB1;

    private String tokenAdminA;
    private String tokenTeacherA1;
    private String tokenStudentA1;

    @BeforeEach
    void setUp() {
        resourceFileRepository.deleteAll();
        resourceRepository.deleteAll();
        gapValidationLabelRepository.deleteAll();
        studentTopicMasteryRepository.deleteAll();
        interventionRepository.deleteAll();
        answerRepository.deleteAll();
        attemptRepository.deleteAll();
        enrollmentRepository.deleteAll();
        classEntityRepository.deleteAll();

        // 1. Setup Institutions
        instA = institutionRepository.findByCode("PILOT-2026").orElseGet(() ->
                institutionRepository.save(new Institution("Campus Alpha", "PILOT-2026", InstitutionStatus.ACTIVE)));
        instB = institutionRepository.findByCode("METRO-2026").orElseGet(() ->
                institutionRepository.save(new Institution("Campus Beta", "METRO-2026", InstitutionStatus.ACTIVE)));

        // 2. Setup Subject & Assessment (use seeded or create)
        subject = subjectRepository.findAll().stream().findFirst().orElseGet(() ->
                subjectRepository.save(new Subject("Intro to Computer Science", "CS101", "Foundation course"))
        );
        assessment = assessmentRepository.findBySubjectAndStatus(subject, AssessmentStatus.PUBLISHED).stream().findFirst().orElseGet(() ->
                assessmentRepository.save(new Assessment(
                        subject,
                        "Comprehensive Diagnostic Assessment",
                        "Diagnostic quiz",
                        AssessmentStatus.PUBLISHED,
                        null
                ))
        );

        // 3. Setup Institution A Users
        adminA = getOrCreateUser("iso.admin.a@pilot.edu", Role.ADMIN, UserStatus.ACTIVE, instA);
        teacherA1 = getOrCreateUser("iso.teacher.a1@pilot.edu", Role.TEACHER, UserStatus.ACTIVE, instA);
        teacherA2 = getOrCreateUser("iso.teacher.a2@pilot.edu", Role.TEACHER, UserStatus.ACTIVE, instA);
        studentA1 = getOrCreateUser("iso.student.a1@pilot.edu", Role.STUDENT, UserStatus.ACTIVE, instA);
        studentA2 = getOrCreateUser("iso.student.a2@pilot.edu", Role.STUDENT, UserStatus.ACTIVE, instA);

        // 4. Setup Institution B Users
        adminB = getOrCreateUser("iso.admin.b@metro.edu", Role.ADMIN, UserStatus.ACTIVE, instB);
        teacherB1 = getOrCreateUser("iso.teacher.b1@metro.edu", Role.TEACHER, UserStatus.ACTIVE, instB);
        studentB1 = getOrCreateUser("iso.student.b1@metro.edu", Role.STUDENT, UserStatus.ACTIVE, instB);

        // 5. Setup Classes
        classA1 = classEntityRepository.save(new ClassEntity(instA, subject, teacherA1, "Section A1", "SEC0A1"));
        classA2 = classEntityRepository.save(new ClassEntity(instA, subject, teacherA2, "Section A2", "SEC0A2"));
        classB1 = classEntityRepository.save(new ClassEntity(instB, subject, teacherB1, "Section B1", "SEC0B1"));

        // 6. Enrollments
        enrollmentRepository.save(new Enrollment(studentA1, classA1));
        enrollmentRepository.save(new Enrollment(studentA2, classA2));
        enrollmentRepository.save(new Enrollment(studentB1, classB1));

        // 7. Attempts
        attemptA2 = attemptRepository.save(new Attempt(studentA2, assessment, 1));
        attemptA2.setClassId(classA2.getId());
        attemptRepository.save(attemptA2);

        attemptB1 = attemptRepository.save(new Attempt(studentB1, assessment, 1));
        attemptB1.setClassId(classB1.getId());
        attemptRepository.save(attemptB1);

        // JWT Tokens
        tokenAdminA = jwtService.generateToken(adminA);
        tokenTeacherA1 = jwtService.generateToken(teacherA1);
        tokenStudentA1 = jwtService.generateToken(studentA1);
    }

    private User getOrCreateUser(String email, Role role, UserStatus status, Institution inst) {
        User u = userRepository.findByEmail(email).orElseGet(() ->
                new User("Test " + role, email, passwordEncoder.encode("password123"), role, status, inst)
        );
        u.setInstitution(inst);
        u.setStatus(status);
        u.setRole(role);
        return userRepository.save(u);
    }

    // =========================================================================
    // Part 1.3: Central Rule: canTeacherAccessStudentData
    // =========================================================================

    @Test
    @DisplayName("Central rule: may this teacher see this student's learning data (owner yes, another teacher no, foreign inst no, not enrolled no)")
    void testCanTeacherAccessStudentDataRule() {
        // 1. Owner teacher: YES
        assertTrue(tenantAccess.canTeacherAccessStudentData(teacherA1, studentA1, enrollmentRepository),
                "Owner teacher must have access to enrolled student's data");
        assertDoesNotThrow(() -> tenantAccess.requireTeacherCanAccessStudentData(teacherA1, studentA1, enrollmentRepository));

        // 2. Another teacher in same institution: NO
        assertFalse(tenantAccess.canTeacherAccessStudentData(teacherA2, studentA1, enrollmentRepository),
                "Teacher A2 does not own studentA1's class and must NOT have access");
        assertThrows(ResourceNotFoundException.class, () ->
                tenantAccess.requireTeacherCanAccessStudentData(teacherA2, studentA1, enrollmentRepository));

        // 3. Another institution teacher: NO
        assertFalse(tenantAccess.canTeacherAccessStudentData(teacherB1, studentA1, enrollmentRepository),
                "Teacher B1 from another institution must NOT have access");
        assertThrows(ResourceNotFoundException.class, () ->
                tenantAccess.requireTeacherCanAccessStudentData(teacherB1, studentA1, enrollmentRepository));

        // 4. Student not enrolled in teacher's classes: NO
        assertFalse(tenantAccess.canTeacherAccessStudentData(teacherA1, studentA2, enrollmentRepository),
                "Student A2 is not enrolled in any class owned by Teacher A1");
        assertThrows(ResourceNotFoundException.class, () ->
                tenantAccess.requireTeacherCanAccessStudentData(teacherA1, studentA2, enrollmentRepository));

        // 5. Archived class: owner teacher STILL retains access to past data
        classA1.setStatus(ClassStatus.ARCHIVED);
        classEntityRepository.save(classA1);
        assertTrue(tenantAccess.canTeacherAccessStudentData(teacherA1, studentA1, enrollmentRepository),
                "Owner teacher must retain access to student records in archived classes");
    }

    // =========================================================================
    // Part 1.2: Isolation Matrix - Table-Driven Refusal Verification (404 Not Found)
    // =========================================================================

    @Test
    @DisplayName("Admin Endpoints Isolation: Foreign IDs return 404 Not Found")
    void testAdminEndpointsRefuseForeignIds() throws Exception {
        Long foreignTeacherId = teacherB1.getId();
        Long foreignUserId = studentB1.getId();
        Long foreignClassId = classB1.getId();

        // 1. POST /api/admin/teachers/{id}/approve
        mockMvc.perform(post("/api/admin/teachers/" + foreignTeacherId + "/approve")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isNotFound());

        // 2. POST /api/admin/teachers/{id}/reject
        mockMvc.perform(post("/api/admin/teachers/" + foreignTeacherId + "/reject")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isNotFound());

        // 3. POST /api/admin/users/{id}/deactivate
        mockMvc.perform(post("/api/admin/users/" + foreignUserId + "/deactivate")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isNotFound());

        // 4. POST /api/admin/users/{id}/reactivate
        mockMvc.perform(post("/api/admin/users/" + foreignUserId + "/reactivate")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isNotFound());

        // 5. PUT /api/admin/classes/{id}/teacher
        mockMvc.perform(put("/api/admin/classes/" + foreignClassId + "/teacher")
                        .header("Authorization", "Bearer " + tokenAdminA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ReassignTeacherRequest(teacherA1.getId()))))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Teacher Endpoints Isolation: Other teacher's class or foreign institution class returns 404")
    void testTeacherEndpointsRefuseForeignIds() throws Exception {
        Long otherTeacherClassId = classA2.getId();
        Long foreignInstClassId = classB1.getId();

        for (Long unauthorizedClassId : List.of(otherTeacherClassId, foreignInstClassId)) {
            // 1. GET /api/teacher/classes/{id}
            mockMvc.perform(get("/api/teacher/classes/" + unauthorizedClassId)
                            .header("Authorization", "Bearer " + tokenTeacherA1))
                    .andExpect(status().isNotFound());

            // 2. PUT /api/teacher/classes/{id}/archive
            mockMvc.perform(put("/api/teacher/classes/" + unauthorizedClassId + "/archive")
                            .header("Authorization", "Bearer " + tokenTeacherA1))
                    .andExpect(status().isNotFound());

            // 3. POST /api/teacher/classes/{id}/regenerate-code
            mockMvc.perform(post("/api/teacher/classes/" + unauthorizedClassId + "/regenerate-code")
                            .header("Authorization", "Bearer " + tokenTeacherA1))
                    .andExpect(status().isNotFound());

            // 4. PUT /api/teacher/classes/{id}/enrollment
            mockMvc.perform(put("/api/teacher/classes/" + unauthorizedClassId + "/enrollment")
                            .header("Authorization", "Bearer " + tokenTeacherA1)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"open\": false}"))
                    .andExpect(status().isNotFound());

            // 5. GET /api/teacher/classes/{id}/roster
            mockMvc.perform(get("/api/teacher/classes/" + unauthorizedClassId + "/roster")
                            .header("Authorization", "Bearer " + tokenTeacherA1))
                    .andExpect(status().isNotFound());

            // 6. GET /api/teacher/classes/{id}/overview
            mockMvc.perform(get("/api/teacher/classes/" + unauthorizedClassId + "/overview")
                            .header("Authorization", "Bearer " + tokenTeacherA1))
                    .andExpect(status().isNotFound());

            // 7. GET /api/teacher/classes/{id}/students/{studentId}
            mockMvc.perform(get("/api/teacher/classes/" + unauthorizedClassId + "/students/" + studentA1.getId())
                            .header("Authorization", "Bearer " + tokenTeacherA1))
                    .andExpect(status().isNotFound());

            // 8. GET /api/teacher/classes/{id}/interventions
            mockMvc.perform(get("/api/teacher/classes/" + unauthorizedClassId + "/interventions")
                            .header("Authorization", "Bearer " + tokenTeacherA1))
                    .andExpect(status().isNotFound());

            // 9. Validation Lab endpoints (foreign teacher or foreign institution -> 404)
            mockMvc.perform(get("/api/teacher/classes/" + unauthorizedClassId + "/validation/students")
                            .header("Authorization", "Bearer " + tokenTeacherA1))
                    .andExpect(status().isNotFound());

            mockMvc.perform(get("/api/teacher/classes/" + unauthorizedClassId + "/validation/students/" + studentA1.getId())
                            .header("Authorization", "Bearer " + tokenTeacherA1))
                    .andExpect(status().isNotFound());

            mockMvc.perform(put("/api/teacher/classes/" + unauthorizedClassId + "/validation/students/" + studentA1.getId() + "/topics/1")
                            .header("Authorization", "Bearer " + tokenTeacherA1)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"label\": \"WEAK\"}"))
                    .andExpect(status().isNotFound());

            mockMvc.perform(get("/api/teacher/classes/" + unauthorizedClassId + "/validation/report")
                            .header("Authorization", "Bearer " + tokenTeacherA1))
                    .andExpect(status().isNotFound());

            mockMvc.perform(get("/api/teacher/classes/" + unauthorizedClassId + "/validation/export")
                            .header("Authorization", "Bearer " + tokenTeacherA1))
                    .andExpect(status().isNotFound());
        }
    }

    @Test
    @DisplayName("Student Endpoints Isolation: Non-enrolled class, foreign subject, or another student's attempt returns 404")
    void testStudentEndpointsRefuseForeignIds() throws Exception {
        Long otherSectionClassId = classA2.getId();
        Long foreignInstClassId = classB1.getId();
        Long nonEnrolledSubjectId = 99999L;
        Long otherStudentAttemptId = attemptA2.getId();
        Long foreignInstAttemptId = attemptB1.getId();

        // 1. GET /api/student/classes/{id} for class student is not enrolled in
        mockMvc.perform(get("/api/student/classes/" + otherSectionClassId)
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/student/classes/" + foreignInstClassId)
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isNotFound());

        // 2. GET /api/student/classes/resolve-by-subject/{subjectId}
        mockMvc.perform(get("/api/student/classes/resolve-by-subject/" + nonEnrolledSubjectId)
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isNotFound());

        // 3. GET /api/student/attempts/{attemptId}/result for another student's attempt
        mockMvc.perform(get("/api/student/attempts/" + otherStudentAttemptId + "/result")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/student/attempts/" + foreignInstAttemptId + "/result")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isNotFound());

        // 5. POST /api/student/attempts/{attemptId}/submit for another student's attempt
        SubmitAttemptRequest submitReq = new SubmitAttemptRequest(List.of());
        mockMvc.perform(post("/api/student/attempts/" + otherStudentAttemptId + "/submit")
                        .header("Authorization", "Bearer " + tokenStudentA1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReq)))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/student/attempts/" + foreignInstAttemptId + "/submit")
                        .header("Authorization", "Bearer " + tokenStudentA1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReq)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Collection Endpoints Isolation: Listing endpoints never leak foreign tenant records")
    void testCollectionEndpointsDoNotLeakForeignTenantRecords() throws Exception {
        // Admin A lists users: should only contain Campus Alpha users
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].email", hasItem("iso.admin.a@pilot.edu")))
                .andExpect(jsonPath("$[*].email", hasItem("iso.teacher.a1@pilot.edu")))
                .andExpect(jsonPath("$[*].email", not(hasItem("iso.admin.b@metro.edu"))))
                .andExpect(jsonPath("$[*].email", not(hasItem("iso.teacher.b1@metro.edu"))));

        // Admin A lists classes: should only contain Campus Alpha classes
        mockMvc.perform(get("/api/admin/classes")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItem("Section A1")))
                .andExpect(jsonPath("$[*].name", hasItem("Section A2")))
                .andExpect(jsonPath("$[*].name", not(hasItem("Section B1"))));

        // Teacher A1 lists classes: should only contain Teacher A1's classes
        mockMvc.perform(get("/api/teacher/classes")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItem("Section A1")))
                .andExpect(jsonPath("$[*].name", not(hasItem("Section A2"))))
                .andExpect(jsonPath("$[*].name", not(hasItem("Section B1"))));

        // Student A1 lists classes: should only contain Section A1
        mockMvc.perform(get("/api/student/classes")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].sectionName", hasItem("Section A1")))
                .andExpect(jsonPath("$[*].sectionName", not(hasItem("Section A2"))))
                .andExpect(jsonPath("$[*].sectionName", not(hasItem("Section B1"))));
    }

    @Test
    @DisplayName("Validation Lab Role & Tenant Isolation: Student and SuperAdmin refused; Admin report scoped to institution")
    void testValidationLabSecurityAndIsolation() throws Exception {
        // 1. Student token calling teacher validation -> 403
        mockMvc.perform(get("/api/teacher/classes/" + classA1.getId() + "/validation/students")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isForbidden());

        // 2. Student token calling admin validation report -> 403
        mockMvc.perform(get("/api/admin/validation/report")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isForbidden());

        // 3. Super Admin token calling teacher validation -> 403
        User superAdmin = userRepository.findByEmail("superadmin@learningpal.edu").orElseGet(() ->
                userRepository.save(new User("Super Admin", "superadmin@learningpal.edu", "pass", Role.SUPER_ADMIN, UserStatus.ACTIVE, null))
        );
        String superToken = jwtService.generateToken(superAdmin);
        mockMvc.perform(get("/api/teacher/classes/" + classA1.getId() + "/validation/students")
                        .header("Authorization", "Bearer " + superToken))
                .andExpect(status().isForbidden());

        // 4. Admin report is strictly scoped to Admin's institution
        mockMvc.perform(get("/api/admin/validation/report")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.institutionName").value(instA.getName()));
    }

    @Test
    @DisplayName("Measurement Tools Security & Multi-Tenant Isolation")
    void testMeasurementToolsSecurityAndIsolation() throws Exception {
        // 1. Student token calling teacher ratings summary -> 403
        mockMvc.perform(get("/api/teacher/classes/" + classA1.getId() + "/ratings-summary")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isForbidden());

        // 2. Student token calling admin ratings summary -> 403
        mockMvc.perform(get("/api/admin/ratings/summary")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isForbidden());

        // 3. Student token calling admin survey summary -> 403
        mockMvc.perform(get("/api/admin/survey/summary")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isForbidden());

        // 4. Teacher A1 accessing another teacher's class ratings summary (same institution) -> 404
        mockMvc.perform(get("/api/teacher/classes/" + classA2.getId() + "/ratings-summary")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isNotFound());

        // 5. Teacher A1 accessing foreign institution class ratings summary -> 404
        mockMvc.perform(get("/api/teacher/classes/" + classB1.getId() + "/ratings-summary")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isNotFound());

        // 6. Admin A summaries are scoped to institution A
        mockMvc.perform(get("/api/admin/ratings/summary")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/survey/summary")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("File Resources Multi-Tenant & Role Security Isolation")
    void testFileResourcesSecurityAndIsolation() throws Exception {
        // Additional JWT tokens for role isolation testing
        String tokenTeacherA2 = jwtService.generateToken(teacherA2);
        String tokenTeacherB1 = jwtService.generateToken(teacherB1);
        String tokenStudentA2 = jwtService.generateToken(studentA2);
        String tokenStudentB1 = jwtService.generateToken(studentB1);
        User superAdmin = userRepository.findByEmail("superadmin@learningpal.edu").orElseGet(() ->
                userRepository.save(new User("Super Admin", "superadmin@learningpal.edu", "pass", Role.SUPER_ADMIN, UserStatus.ACTIVE, null))
        );
        String tokenSuperAdmin = jwtService.generateToken(superAdmin);

        // Subject owned by Teacher A1
        Subject teacherA1Subject = subjectRepository.save(
                new Subject("Teacher A1 Private Subject", "TA101", "Private Notes", teacherA1)
        );

        // Active class for Teacher A1
        ClassEntity activeClassA1 = classEntityRepository.save(
                new ClassEntity(instA, teacherA1Subject, teacherA1, "Section A1 Active", "ACTV01")
        );
        enrollmentRepository.save(new Enrollment(studentA1, activeClassA1));

        // Archived class for Teacher A1
        ClassEntity archivedClassA1 = classEntityRepository.save(
                new ClassEntity(instA, teacherA1Subject, teacherA1, "Section A1 Archived", "ARCH01")
        );
        archivedClassA1.setStatus(ClassStatus.ARCHIVED);
        classEntityRepository.save(archivedClassA1);
        enrollmentRepository.save(new Enrollment(studentA1, archivedClassA1));

        // Active file resource belonging to Teacher A1's subject
        Resource activeResource = resourceRepository.save(new Resource(
                teacherA1Subject,
                null,
                "Lecture Guide",
                "Study notes",
                ResourceType.FILE,
                "notes.pdf",
                null,
                DifficultyLevel.EASY,
                teacherA1
        ));
        ResourceFile activeFile = resourceFileRepository.save(new ResourceFile(
                activeResource,
                "uuid-storage-active.pdf",
                "notes.pdf",
                "application/pdf",
                1024L,
                "sha256-active-file",
                ExtractionStatus.READY,
                "Sample text",
                100,
                1,
                "Extracted successfully"
        ));

        // Archived file resource belonging to Teacher A1's subject
        Resource archivedResource = new Resource(
                teacherA1Subject,
                null,
                "Archived Guide",
                "Old notes",
                ResourceType.FILE,
                "old_notes.pdf",
                null,
                DifficultyLevel.EASY,
                teacherA1
        );
        archivedResource.setStatus(ResourceStatus.ARCHIVED);
        archivedResource = resourceRepository.save(archivedResource);
        ResourceFile archivedFile = resourceFileRepository.save(new ResourceFile(
                archivedResource,
                "uuid-storage-archived.pdf",
                "old_notes.pdf",
                "application/pdf",
                512L,
                "sha256-archived-file",
                ExtractionStatus.READY,
                "Old text",
                50,
                1,
                "Extracted successfully"
        ));

        // 1. Student token calling teacher files list -> 403 Forbidden
        mockMvc.perform(get("/api/teacher/subjects/" + teacherA1Subject.getId() + "/files")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isForbidden());

        // 2. Admin token calling teacher files list -> 403 Forbidden
        mockMvc.perform(get("/api/teacher/subjects/" + teacherA1Subject.getId() + "/files")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isForbidden());

        // 3. Teacher token calling student class download endpoint -> 404 Not Found
        mockMvc.perform(get("/api/student/classes/" + activeClassA1.getId() + "/files/" + activeFile.getId() + "/download")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isNotFound());

        // 4. Download access returns 404 for: another teacher in same institution (Teacher A2)
        mockMvc.perform(get("/api/teacher/files/" + activeFile.getId() + "/download")
                        .header("Authorization", "Bearer " + tokenTeacherA2))
                .andExpect(status().isNotFound());

        // 5. Download access returns 404 for: teacher in another institution (Teacher B1)
        mockMvc.perform(get("/api/teacher/files/" + activeFile.getId() + "/download")
                        .header("Authorization", "Bearer " + tokenTeacherB1))
                .andExpect(status().isNotFound());

        // 6. Download access returns 404 for: unenrolled student (Student A2)
        mockMvc.perform(get("/api/student/classes/" + activeClassA1.getId() + "/files/" + activeFile.getId() + "/download")
                        .header("Authorization", "Bearer " + tokenStudentA2))
                .andExpect(status().isNotFound());

        // 7. Download access returns 404 for: cross-institution student (Student B1)
        mockMvc.perform(get("/api/student/classes/" + activeClassA1.getId() + "/files/" + activeFile.getId() + "/download")
                        .header("Authorization", "Bearer " + tokenStudentB1))
                .andExpect(status().isNotFound());

        // 8. Download access returns 404 for: student in an ARCHIVED class
        mockMvc.perform(get("/api/student/classes/" + archivedClassA1.getId() + "/files/" + activeFile.getId() + "/download")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isNotFound());

        // 9. Download access returns 404 for: student requesting an ARCHIVED file
        mockMvc.perform(get("/api/student/classes/" + activeClassA1.getId() + "/files/" + archivedFile.getId() + "/download")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isNotFound());

        // 10. STEP 0: Download and text-preview endpoints return 404 for ADMIN & SUPER_ADMIN at the HTTP level (same as nonexistent ID, not 403)
        mockMvc.perform(get("/api/teacher/files/" + activeFile.getId() + "/download")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/teacher/files/" + activeFile.getId() + "/download")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/teacher/files/" + activeFile.getId() + "/text-preview")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/teacher/files/" + activeFile.getId() + "/text-preview")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/student/classes/" + activeClassA1.getId() + "/files/" + activeFile.getId() + "/download")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/student/classes/" + activeClassA1.getId() + "/files/" + activeFile.getId() + "/download")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isNotFound());
    }
}
