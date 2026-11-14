package com.learningpal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.JwtService;
import com.learningpal.dto.CreateClassRequest;
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
import org.springframework.test.web.servlet.MvcResult;

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
    private AssessmentQuestionRepository assessmentQuestionRepository;

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
    private TopicRepository topicRepository;

    @Autowired
    private QuestionRepository questionRepository;

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

    // =========================================================================
    // Part 7: Audit Fix & Isolation Matrix Regression Tests
    // =========================================================================

    @Test
    @DisplayName("FINDING-001 / Matrix: POST /api/teacher/classes enforces subject ownership and institution boundaries")
    void testCreateClassSubjectIsolation() throws Exception {
        // Teacher A1 creates private subject
        Subject privateSubjA = subjectRepository.save(new Subject("PRIV_A1_" + System.nanoTime(), "Private A1", "Desc", teacherA1));
        Subject privateSubjB = subjectRepository.save(new Subject("PRIV_B1_" + System.nanoTime(), "Private B1", "Desc", teacherB1));

        String tokenTeacherA2 = jwtService.generateToken(teacherA2);
        String tokenTeacherB1 = jwtService.generateToken(teacherB1);

        CreateClassRequest reqA1 = new CreateClassRequest(privateSubjA.getId(), "Sec A1 New");

        // 1. Teacher A2 (same institution, different owner) gets 404
        mockMvc.perform(post("/api/teacher/classes")
                        .header("Authorization", "Bearer " + tokenTeacherA2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqA1)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Resource not found")));

        // 2. Teacher B1 (foreign institution) gets 404
        mockMvc.perform(post("/api/teacher/classes")
                        .header("Authorization", "Bearer " + tokenTeacherB1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqA1)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Resource not found")));

        // 3. Nonexistent subject id gets 404 with identical message
        CreateClassRequest reqNonExistent = new CreateClassRequest(999999L, "Sec Phantom");
        mockMvc.perform(post("/api/teacher/classes")
                        .header("Authorization", "Bearer " + tokenTeacherA1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqNonExistent)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Resource not found")));

        // 4. Owner teacher (Teacher A1) succeeds with 201 Created
        mockMvc.perform(post("/api/teacher/classes")
                        .header("Authorization", "Bearer " + tokenTeacherA1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqA1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Sec A1 New")));

        // 5. Seed subject (owner == null) succeeds for teacher in any institution
        CreateClassRequest reqSeed = new CreateClassRequest(subject.getId(), "Sec Seed Subj");
        mockMvc.perform(post("/api/teacher/classes")
                        .header("Authorization", "Bearer " + tokenTeacherA1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqSeed)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Sec Seed Subj")));
    }

    @Test
    @DisplayName("FINDING-002 / Matrix: GET /api/student/assessments returns only published assessments for active enrolled classes")
    void testStudentAssessmentCatalogIsolation() throws Exception {
        String tokenStudentB1 = jwtService.generateToken(studentB1);

        // Student A1 is enrolled in Active Class A1 (which has `subject` with `assessment`)
        mockMvc.perform(get("/api/student/assessments")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", hasItem(assessment.getId().intValue())));

        // Create an assessment in Institution B for subject B
        Subject subjB = subjectRepository.save(new Subject("SUBJ_B_" + System.nanoTime(), "Subj B", "Desc", teacherB1));
        Assessment assmB = assessmentRepository.save(new Assessment(subjB, "Assessment B", "Desc", AssessmentStatus.PUBLISHED, teacherB1));

        // Student A1 must NOT see Assessment B (cross-institution & unenrolled)
        mockMvc.perform(get("/api/student/assessments")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", not(hasItem(assmB.getId().intValue()))));

        // Create a private subject and assessment for Teacher A1 in Institution A
        Subject privateSubjA1 = subjectRepository.save(new Subject("PRIV_A1_CAT_" + System.nanoTime(), "Priv Subj A1", "Desc", teacherA1));
        Assessment assmPrivA1 = assessmentRepository.save(new Assessment(privateSubjA1, "Private Assessment A1", "Desc", AssessmentStatus.PUBLISHED, teacherA1));
        ClassEntity activeClassPrivA1 = classEntityRepository.save(new ClassEntity(instA, privateSubjA1, teacherA1, "Sec Priv A1", "SEC_PA1"));
        enrollmentRepository.save(new Enrollment(studentA1, activeClassPrivA1));

        // Student A1 can see assmPrivA1
        mockMvc.perform(get("/api/student/assessments")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", hasItem(assmPrivA1.getId().intValue())));

        // Student B1 (Institution B) must NOT see assmPrivA1
        mockMvc.perform(get("/api/student/assessments")
                        .header("Authorization", "Bearer " + tokenStudentB1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", not(hasItem(assmPrivA1.getId().intValue()))));

        // Archived class enrollment does not qualify:
        ClassEntity archivedClass = classEntityRepository.save(new ClassEntity(instA, subjB, teacherA1, "Archived Sec", "ARCH1"));
        archivedClass.setStatus(ClassStatus.ARCHIVED);
        classEntityRepository.save(archivedClass);
        enrollmentRepository.save(new Enrollment(studentA1, archivedClass));

        Assessment assmArch = assessmentRepository.save(new Assessment(subjB, "Archived Quiz", "Desc", AssessmentStatus.PUBLISHED, teacherA1));
        mockMvc.perform(get("/api/student/assessments")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", not(hasItem(assmArch.getId().intValue()))));
    }

    @Test
    @DisplayName("FINDING-003 / Matrix: Student assessment attempt and subject endpoints return 404 without leaking subject name")
    void testStudentAssessmentAttemptAndSubjectIsolation() throws Exception {
        String tokenStudentB1 = jwtService.generateToken(studentB1);

        Subject privateSubjA = subjectRepository.save(new Subject("PRIV_SUBJ_A_" + System.nanoTime(), "Private A", "Desc", teacherA1));
        Assessment privateAssmA = assessmentRepository.save(new Assessment(privateSubjA, "Private Quiz A", "Desc", AssessmentStatus.PUBLISHED, teacherA1));

        // Foreign institution or unenrolled attempt start returns 404 Resource not found
        mockMvc.perform(post("/api/student/assessments/" + privateAssmA.getId() + "/attempts")
                        .header("Authorization", "Bearer " + tokenStudentB1))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Resource not found")));

        // Nonexistent assessment returns 404 with identical message
        mockMvc.perform(post("/api/student/assessments/999999/attempts")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Resource not found")));

        // Subject assessments: foreign student gets 404
        mockMvc.perform(get("/api/student/subjects/" + privateSubjA.getId() + "/assessments")
                        .header("Authorization", "Bearer " + tokenStudentB1))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Resource not found")));

        // Subject progress: foreign student gets 404
        mockMvc.perform(get("/api/student/subjects/" + privateSubjA.getId() + "/progress")
                        .header("Authorization", "Bearer " + tokenStudentB1))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Resource not found")));

        // Topic progress: create topic on private subject
        Topic topicOnPriv = topicRepository.save(new Topic(privateSubjA, "Topic On Priv", "Desc", 1));
        mockMvc.perform(get("/api/student/progress/topics/" + topicOnPriv.getId())
                        .header("Authorization", "Bearer " + tokenStudentB1))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Resource not found")));
    }

    @Test
    @DisplayName("Matrix: Student progress and subjects list scoped strictly to caller")
    void testStudentProgressAndSubjectsScoped() throws Exception {
        // GET /api/student/progress -> 200
        mockMvc.perform(get("/api/student/progress")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isOk());

        // GET /api/student/subjects -> 200
        mockMvc.perform(get("/api/student/subjects")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Matrix: Unscoped resource completion enforces institution boundaries and returns 404 on invalid ID")
    void testUnscopedResourceCompletionIsolation() throws Exception {
        Topic topicA = topicRepository.findBySubjectOrderByDisplayOrderAsc(subject).get(0);
        Resource resA = resourceRepository.save(new Resource(subject, topicA, "Res A " + System.nanoTime(), "Desc", ResourceType.LINK, null, "https://example.com/resA", DifficultyLevel.EASY, teacherA1));

        // Student A1 completes resource
        mockMvc.perform(post("/api/student/resources/" + resA.getId() + "/complete")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isOk());

        // Student A1 un-completes resource
        mockMvc.perform(delete("/api/student/resources/" + resA.getId() + "/complete")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isOk());

        // Nonexistent resource -> 404
        mockMvc.perform(post("/api/student/resources/999999/complete")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Resource not found")));

        mockMvc.perform(delete("/api/student/resources/999999/complete")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Resource not found")));
    }

    @Test
    @DisplayName("Matrix: SuperAdmin endpoints require ROLE_SUPER_ADMIN (403 for non-superadmin)")
    void testSuperAdminRoleIsolation() throws Exception {
        User superAdmin = userRepository.findByEmail("superadmin@learningpal.edu").orElseGet(() ->
                userRepository.save(new User("Super Admin", "superadmin@learningpal.edu", passwordEncoder.encode("pass"), Role.SUPER_ADMIN, UserStatus.ACTIVE, null))
        );
        String tokenSuperAdmin = jwtService.generateToken(superAdmin);

        // Student, Teacher, Admin tokens -> 403
        mockMvc.perform(get("/api/super/institutions")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/super/institutions")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/super/institutions")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isForbidden());

        // Super Admin succeeds
        mockMvc.perform(get("/api/super/institutions")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isOk());

        // POST /api/super/institutions: Student/Teacher/Admin -> 403
        long suffix = System.nanoTime();
        String instPayload = "{\"name\":\"New Inst " + suffix + "\",\"code\":\"INST_" + suffix + "\",\"adminFullName\":\"Adm Full Name\",\"adminEmail\":\"adm_" + suffix + "@inst.edu\",\"adminPassword\":\"Password123!\"}";
        mockMvc.perform(post("/api/super/institutions")
                        .header("Authorization", "Bearer " + tokenTeacherA1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(instPayload))
                .andExpect(status().isForbidden());

        // Super Admin succeeds -> 201
        mockMvc.perform(post("/api/super/institutions")
                        .header("Authorization", "Bearer " + tokenSuperAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(instPayload))
                .andExpect(status().isCreated());

        // POST /api/super/admins non-superadmin -> 403
        mockMvc.perform(post("/api/super/admins")
                        .header("Authorization", "Bearer " + tokenTeacherA1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Matrix: GET teacher subject question and quiz endpoints enforce subject ownership and institution")
    void testTeacherSubjectContentIsolation() throws Exception {
        Subject subjA = subjectRepository.save(new Subject("SUBJ_CONT_" + System.nanoTime(), "Content Subj", "Desc", teacherA1));
        Topic topicA = topicRepository.save(new Topic(subjA, "Content Topic", "Desc", 1));
        Question questionA = questionRepository.save(new Question(topicA, QuestionType.MCQ, "What is X?", "Explanation", DifficultyLevel.EASY, 1.0, teacherA1));
        Assessment quizA = assessmentRepository.save(new Assessment(subjA, "Content Quiz", "Quiz Desc", AssessmentStatus.DRAFT, teacherA1));

        String tokenTeacherB1 = jwtService.generateToken(teacherB1);
        String tokenTeacherA2 = jwtService.generateToken(teacherA2);

        // 1. Teacher A1 (owner) can view question and quiz -> 200
        mockMvc.perform(get("/api/teacher/subjects/" + subjA.getId() + "/questions/" + questionA.getId())
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(questionA.getId().intValue())));

        mockMvc.perform(get("/api/teacher/subjects/" + subjA.getId() + "/quizzes/" + quizA.getId())
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(quizA.getId().intValue())));

        // 2. Teacher A2 (same institution, different owner) -> 404
        mockMvc.perform(get("/api/teacher/subjects/" + subjA.getId() + "/questions/" + questionA.getId())
                        .header("Authorization", "Bearer " + tokenTeacherA2))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/teacher/subjects/" + subjA.getId() + "/quizzes/" + quizA.getId())
                        .header("Authorization", "Bearer " + tokenTeacherA2))
                .andExpect(status().isNotFound());

        // 3. Teacher B1 (foreign institution) -> 404
        mockMvc.perform(get("/api/teacher/subjects/" + subjA.getId() + "/questions/" + questionA.getId())
                        .header("Authorization", "Bearer " + tokenTeacherB1))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/teacher/subjects/" + subjA.getId() + "/quizzes/" + quizA.getId())
                        .header("Authorization", "Bearer " + tokenTeacherB1))
                .andExpect(status().isNotFound());

        // 4. Nonexistent question or quiz -> 404
        mockMvc.perform(get("/api/teacher/subjects/" + subjA.getId() + "/questions/999999")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/teacher/subjects/" + subjA.getId() + "/quizzes/999999")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Matrix: Enumeration & Essay CRUD, grading, and quiz-taking payloads enforce ownership and hide answer keys/rubrics")
    void testQuestionTypesAndRubricIsolation() throws Exception {
        Subject subjA = subjectRepository.save(new Subject("SUBJ_QT_" + System.nanoTime(), "QT Subj", "Desc", teacherA1));
        Topic topicA = topicRepository.save(new Topic(subjA, "QT Topic", "Desc", 1));
        ClassEntity clsA = classEntityRepository.save(new ClassEntity(instA, subjA, teacherA1, "QT Class", "QTISO1"));
        enrollmentRepository.save(new Enrollment(studentA1, clsA));

        String tokenTeacherB1 = jwtService.generateToken(teacherB1);
        String tokenTeacherA2 = jwtService.generateToken(teacherA2);
        String tokenStudentB1 = jwtService.generateToken(studentB1);

        String enumBody = """
                {
                  "topicId": %d,
                  "type": "ENUMERATION",
                  "text": "What is 2+2?",
                  "explanation": "Basic arithmetic",
                  "difficulty": "EASY",
                  "points": 1.0,
                  "acceptedAnswers": ["4", "four"]
                }
                """.formatted(topicA.getId());

        // Cross-teacher & student cannot create enumeration question on subjA
        mockMvc.perform(post("/api/teacher/subjects/" + subjA.getId() + "/questions")
                        .header("Authorization", "Bearer " + tokenTeacherA2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(enumBody))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/teacher/subjects/" + subjA.getId() + "/questions")
                        .header("Authorization", "Bearer " + tokenTeacherB1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(enumBody))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/teacher/subjects/" + subjA.getId() + "/questions")
                        .header("Authorization", "Bearer " + tokenStudentA1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(enumBody))
                .andExpect(status().isForbidden());

        // Owner creates enumeration and essay questions
        MvcResult enumRes = mockMvc.perform(post("/api/teacher/subjects/" + subjA.getId() + "/questions")
                        .header("Authorization", "Bearer " + tokenTeacherA1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(enumBody))
                .andExpect(status().isCreated())
                .andReturn();
        Long enumId = objectMapper.readTree(enumRes.getResponse().getContentAsString()).get("id").asLong();

        String essayBody = """
                {
                  "topicId": %d,
                  "type": "ESSAY",
                  "text": "Explain recursion.",
                  "explanation": "Base case stops infinite calls.",
                  "difficulty": "MEDIUM",
                  "rubricCriteria": [
                    { "name": "Base case", "description": "Termination", "maxPoints": 3 }
                  ]
                }
                """.formatted(topicA.getId());
        MvcResult essayRes = mockMvc.perform(post("/api/teacher/subjects/" + subjA.getId() + "/questions")
                        .header("Authorization", "Bearer " + tokenTeacherA1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(essayBody))
                .andExpect(status().isCreated())
                .andReturn();
        Long essayId = objectMapper.readTree(essayRes.getResponse().getContentAsString()).get("id").asLong();
        Long critId = objectMapper.readTree(essayRes.getResponse().getContentAsString())
                .get("rubricCriteria").get(0).get("id").asLong();

        // Publish quiz with both questions
        Assessment quiz = assessmentRepository.save(new Assessment(subjA, "QT Iso Quiz", "Desc", AssessmentStatus.PUBLISHED, teacherA1));
        assessmentQuestionRepository.save(new AssessmentQuestion(quiz, questionRepository.findById(enumId).orElseThrow(), 1));
        assessmentQuestionRepository.save(new AssessmentQuestion(quiz, questionRepository.findById(essayId).orElseThrow(), 2));

        // Student starts attempt: payload MUST NOT contain acceptedAnswers or rubricCriteria
        MvcResult startRes = mockMvc.perform(post("/api/student/assessments/" + quiz.getId() + "/attempts")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.questions[0].acceptedAnswers").doesNotExist())
                .andExpect(jsonPath("$.questions[1].rubricCriteria").doesNotExist())
                .andReturn();
        Long attemptId = objectMapper.readTree(startRes.getResponse().getContentAsString()).get("attemptId").asLong();

        mockMvc.perform(post("/api/student/attempts/" + attemptId + "/submit")
                        .header("Authorization", "Bearer " + tokenStudentA1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "answers": [
                                  { "questionId": %d, "textAnswer": "four" },
                                  { "questionId": %d, "textAnswer": "A function calling itself" }
                                ] }
                                """.formatted(enumId, essayId)))
                .andExpect(status().isOk());

        // Student result before grading: no rubricScores and no ESSAY model-answer explanation (SEC2-004)
        mockMvc.perform(get("/api/student/attempts/" + attemptId + "/result")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questionReviews[1].rubricScores", hasSize(0)))
                .andExpect(jsonPath("$.questionReviews[1].explanation").value(org.hamcrest.Matchers.nullValue()));

        // Another student cannot view studentA1's result -> 404
        mockMvc.perform(get("/api/student/attempts/" + attemptId + "/result")
                        .header("Authorization", "Bearer " + tokenStudentB1))
                .andExpect(status().isNotFound());

        // Foreign teacher cannot grade essay -> 404
        Long essayAnsId = objectMapper.readTree(mockMvc.perform(get("/api/teacher/classes/" + clsA.getId() + "/attempts/" + attemptId)
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString())
                .get("answers").get(1).get("answerId").asLong();

        String gradeBody = """
                { "teacherComment": "Good", "rubricScores": [{ "criterionId": %d, "points": 3 }] }
                """.formatted(critId);
        mockMvc.perform(put("/api/teacher/classes/" + clsA.getId() + "/attempts/" + attemptId + "/answers/" + essayAnsId + "/grade")
                        .header("Authorization", "Bearer " + tokenTeacherA2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(gradeBody))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/teacher/classes/" + clsA.getId() + "/attempts/" + attemptId + "/answers/" + essayAnsId + "/grade")
                        .header("Authorization", "Bearer " + tokenTeacherB1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(gradeBody))
                .andExpect(status().isNotFound());

        // Owner grades essay -> student now sees explanation
        mockMvc.perform(put("/api/teacher/classes/" + clsA.getId() + "/attempts/" + attemptId + "/answers/" + essayAnsId + "/grade")
                        .header("Authorization", "Bearer " + tokenTeacherA1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(gradeBody))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/student/attempts/" + attemptId + "/result")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questionReviews[1].explanation", is("Base case stops infinite calls.")));
    }

    @Test
    @DisplayName("SEC2-005/006/008: 404 on SUPER_ADMIN deactivate & foreign topicId, 403 on non-teacher ai-suggest & SUPER_ADMIN validation report")
    void testSecurityAudit2ZeroLeakageAndMatrixAlignment() throws Exception {
        // SEC2-005: Admin probing SUPER_ADMIN user ID on deactivate gets 404 (not 400)
        User superAdmin = userRepository.save(new User(
                "Platform Super",
                "super_" + System.nanoTime() + "@platform.edu",
                passwordEncoder.encode("Pass123!"),
                Role.SUPER_ADMIN,
                UserStatus.ACTIVE,
                null
        ));
        String tokenSuperAdmin = jwtService.generateToken(superAdmin);

        mockMvc.perform(post("/api/admin/users/" + superAdmin.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isNotFound());

        // SEC2-006: Teacher submitting validation label with foreign topicId gets 404 (not 400)
        Subject foreignSubject = subjectRepository.save(new Subject("FOR_SUB_" + System.nanoTime(), "Foreign", "Desc", teacherB1));
        Topic foreignTopic = topicRepository.save(new Topic(foreignSubject, "Foreign Topic", "Desc", 1));

        mockMvc.perform(put("/api/teacher/classes/" + classA1.getId() + "/validation/students/" + studentA1.getId() + "/topics/" + foreignTopic.getId())
                        .header("Authorization", "Bearer " + tokenTeacherA1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "label": "WEAK", "note": "Test" }
                                """))
                .andExpect(status().isNotFound());

        // SEC2-008: Non-teachers get 403 on /ai-suggest, SUPER_ADMIN gets 403 on /api/admin/validation/report
        mockMvc.perform(post("/api/teacher/classes/" + classA1.getId() + "/attempts/" + attemptA2.getId() + "/answers/1/ai-suggest")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/teacher/classes/" + classA1.getId() + "/attempts/" + attemptA2.getId() + "/answers/1/ai-suggest")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/validation/report")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isForbidden());
    }

    @Test
    void testSuperAdminUserManagementIsolation() throws Exception {
        User superAdmin = userRepository.findByEmail("superadmin@learningpal.edu").orElseGet(() ->
                userRepository.save(new User("Super Admin", "superadmin@learningpal.edu", passwordEncoder.encode("pass"), Role.SUPER_ADMIN, UserStatus.ACTIVE, null))
        );
        String tokenSuperAdmin = jwtService.generateToken(superAdmin);

        // Non-SUPER_ADMIN roles are strictly blocked with 403 Forbidden
        for (String nonSuperToken : List.of(tokenStudentA1, tokenTeacherA1, tokenAdminA)) {
            mockMvc.perform(get("/api/super/users")
                            .header("Authorization", "Bearer " + nonSuperToken))
                    .andExpect(status().isForbidden());
            mockMvc.perform(post("/api/super/users/" + studentA1.getId() + "/deactivate")
                            .header("Authorization", "Bearer " + nonSuperToken))
                    .andExpect(status().isForbidden());
            mockMvc.perform(post("/api/super/users/" + studentA1.getId() + "/reactivate")
                            .header("Authorization", "Bearer " + nonSuperToken))
                    .andExpect(status().isForbidden());
        }

        // SUPER_ADMIN can list and filter platform users
        mockMvc.perform(get("/api/super/users")
                        .param("role", "STUDENT")
                        .param("institutionId", String.valueOf(instA.getId()))
                        .param("search", studentA1.getEmail())
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value(studentA1.getEmail()));

        // Refuses deactivating SUPER_ADMIN (400) and returns 404 on nonexistent user
        mockMvc.perform(post("/api/super/users/" + superAdmin.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/super/users/999999/deactivate")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isNotFound());

        // SUPER_ADMIN can deactivate and reactivate a tenant user
        mockMvc.perform(post("/api/super/users/" + studentA1.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/super/users/" + studentA1.getId() + "/reactivate")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isOk());
    }

    @Test
    void testAssessmentSubmissionsRosterIsolation() throws Exception {
        String tokenTeacherA2 = jwtService.generateToken(teacherA2);
        String tokenTeacherB1 = jwtService.generateToken(teacherB1);
        String url = "/api/teacher/classes/" + classA1.getId() + "/assessments/" + assessment.getId() + "/submissions";

        // Owner teacher receives 200 with enrolled students roster
        mockMvc.perform(get(url)
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assessmentId").value(assessment.getId()))
                .andExpect(jsonPath("$.totalEnrolled").isNumber())
                .andExpect(jsonPath("$.submissions").isArray());

        // Foreign teacher in same institution -> 404
        mockMvc.perform(get(url)
                        .header("Authorization", "Bearer " + tokenTeacherA2))
                .andExpect(status().isNotFound());

        // Foreign teacher in different institution -> 404
        mockMvc.perform(get(url)
                        .header("Authorization", "Bearer " + tokenTeacherB1))
                .andExpect(status().isNotFound());

        // Nonexistent / foreign assessment ID -> 404
        mockMvc.perform(get("/api/teacher/classes/" + classA1.getId() + "/assessments/999999/submissions")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isNotFound());

        // Student / Admin roles -> 403
        mockMvc.perform(get(url)
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(url)
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isForbidden());
    }
}
