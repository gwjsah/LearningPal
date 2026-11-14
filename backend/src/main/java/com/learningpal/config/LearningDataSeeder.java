package com.learningpal.config;

import com.learningpal.entity.*;
import com.learningpal.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Seeds pilot curriculum data for "Introduction to Programming: C Language Basics"
 * if the database is currently empty.
 * Controlled by 'app.seed.enabled' (default true).
 */
@Component
@Order(2)
public class LearningDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(LearningDataSeeder.class);

    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;
    private final QuestionRepository questionRepository;
    private final ChoiceRepository choiceRepository;
    private final AssessmentRepository assessmentRepository;
    private final AssessmentQuestionRepository assessmentQuestionRepository;
    private final ResourceRepository resourceRepository;
    private final InstitutionRepository institutionRepository;
    private final ClassEntityRepository classEntityRepository;
    private final UserRepository userRepository;
    private final com.learningpal.service.JoinCodeGenerator joinCodeGenerator;
    private final boolean seedEnabled;

    public LearningDataSeeder(
            SubjectRepository subjectRepository,
            TopicRepository topicRepository,
            QuestionRepository questionRepository,
            ChoiceRepository choiceRepository,
            AssessmentRepository assessmentRepository,
            AssessmentQuestionRepository assessmentQuestionRepository,
            ResourceRepository resourceRepository,
            InstitutionRepository institutionRepository,
            ClassEntityRepository classEntityRepository,
            UserRepository userRepository,
            com.learningpal.service.JoinCodeGenerator joinCodeGenerator,
            @Value("${app.seed.enabled:true}") boolean seedEnabled) {
        this.subjectRepository = subjectRepository;
        this.topicRepository = topicRepository;
        this.questionRepository = questionRepository;
        this.choiceRepository = choiceRepository;
        this.assessmentRepository = assessmentRepository;
        this.assessmentQuestionRepository = assessmentQuestionRepository;
        this.resourceRepository = resourceRepository;
        this.institutionRepository = institutionRepository;
        this.classEntityRepository = classEntityRepository;
        this.userRepository = userRepository;
        this.joinCodeGenerator = joinCodeGenerator;
        this.seedEnabled = seedEnabled;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedEnabled) {
            log.info("Learning data seeding disabled by configuration (app.seed.enabled=false).");
            return;
        }

        if (subjectRepository.count() > 0) {
            log.info("Learning curriculum data already exists. Skipping pilot seeder.");
            return;
        }

        log.info("Seeding pilot curriculum: Introduction to Programming: C Language Basics...");

        // 1. Subject
        Subject subject = subjectRepository.save(new Subject(
                "C_PROG_INTRO",
                "Introduction to Programming: C Language Basics",
                "Fundamental concepts of computer programming using the C language, covering data types, operators, I/O, control flow, loops, and modular functions."
        ));

        // 2. Topics (in strict specified order)
        Topic topic1 = topicRepository.save(new Topic(subject, "Variables and Data Types", "Fundamental data representations, memory sizing, integer division, and standard type specifiers.", 1));
        Topic topic2 = topicRepository.save(new Topic(subject, "Operators and Expressions", "Arithmetic, relational, logical operators, precedence, short-circuit evaluation, and assignment semantics.", 2));
        Topic topic3 = topicRepository.save(new Topic(subject, "Input and Output (printf/scanf)", "Standard I/O stream processing, format specifiers, precision modifiers, and buffer behavior.", 3));
        Topic topic4 = topicRepository.save(new Topic(subject, "Conditional Statements (if/else/switch)", "Decision-making structures, boolean semantics, dangling else resolution, and switch-case fall-through.", 4));
        Topic topic5 = topicRepository.save(new Topic(subject, "Loops (for/while/do-while)", "Iteration constructs, loop control statements (break/continue), bounds checking, and boundary conditions.", 5));
        Topic topic6 = topicRepository.save(new Topic(subject, "Functions", "Modular program organization, call-by-value parameter passing, scope, prototypes, and static variables.", 6));

        List<Topic> topics = List.of(topic1, topic2, topic3, topic4, topic5, topic6);

        // 3. Questions and Choices
        List<Question> topic1Questions = seedTopic1Questions(topic1);
        List<Question> topic2Questions = seedTopic2Questions(topic2);
        List<Question> topic3Questions = seedTopic3Questions(topic3);
        List<Question> topic4Questions = seedTopic4Questions(topic4);
        List<Question> topic5Questions = seedTopic5Questions(topic5);
        List<Question> topic6Questions = seedTopic6Questions(topic6);

        // 4. Topic Quizzes
        seedTopicQuiz(subject, topic1, "Variables & Data Types Quiz", "Diagnostic quiz evaluating understanding of C types, specifiers, and division truncation.", topic1Questions);
        seedTopicQuiz(subject, topic2, "Operators & Expressions Quiz", "Diagnostic quiz covering operator precedence, increment behavior, and logical expressions.", topic2Questions);
        seedTopicQuiz(subject, topic3, "Input & Output Quiz", "Diagnostic quiz testing standard printf/scanf formatting and pointer requirements.", topic3Questions);
        seedTopicQuiz(subject, topic4, "Conditional Statements Quiz", "Diagnostic quiz evaluating branching logic, switch fall-through, and equality checks.", topic4Questions);
        seedTopicQuiz(subject, topic5, "Loops Quiz", "Diagnostic quiz assessing for, while, do-while loops, and boundary control.", topic5Questions);
        seedTopicQuiz(subject, topic6, "Functions Quiz", "Diagnostic quiz testing parameter pass-by-value, prototypes, and variable lifetime.", topic6Questions);

        // 5. Comprehensive Diagnostic Quiz (3 questions from each of the 6 topics = 18 total)
        Assessment diagnostic = assessmentRepository.save(new Assessment(
                subject,
                "Comprehensive Diagnostic Assessment",
                "Holistic diagnostic assessment covering all 6 foundational topics of C programming to identify specific strengths and learning gaps.",
                AssessmentStatus.PUBLISHED,
                null
        ));

        List<Question> diagnosticQuestions = new ArrayList<>();
        // Select 3 questions from each topic (covering easy, medium, and hard)
        diagnosticQuestions.addAll(topic1Questions.subList(0, 3));
        diagnosticQuestions.addAll(topic2Questions.subList(0, 3));
        diagnosticQuestions.addAll(topic3Questions.subList(0, 3));
        diagnosticQuestions.addAll(topic4Questions.subList(0, 3));
        diagnosticQuestions.addAll(topic5Questions.subList(0, 3));
        diagnosticQuestions.addAll(topic6Questions.subList(0, 3));

        for (int i = 0; i < diagnosticQuestions.size(); i++) {
            assessmentQuestionRepository.save(new AssessmentQuestion(diagnostic, diagnosticQuestions.get(i), i + 1));
        }

        // 6. Resources (1 NOTE + 1 PRACTICE per topic = 12 total)
        seedResources(subject, topics);

        // 7. Pilot Class (Section A under Pilot University)
        Institution pilot = institutionRepository.findByCode("PILOT-2026")
                .orElseGet(() -> institutionRepository.save(new Institution("Pilot University", "PILOT-2026", InstitutionStatus.ACTIVE)));

        if (!classEntityRepository.findFirstByInstitutionAndSubject(pilot, subject).isPresent()) {
            User teacher = userRepository.findFirstByInstitutionAndRoleAndStatus(pilot, Role.TEACHER, UserStatus.ACTIVE).orElse(null);
            String joinCode = joinCodeGenerator.generateUniqueCode(pilot, classEntityRepository);
            classEntityRepository.save(new ClassEntity(pilot, subject, teacher, "Section A", joinCode));
            log.info("Pilot curriculum class seeded: Section A with join code '{}'.", joinCode);
        }

        log.info("Pilot curriculum seeded successfully: 1 Subject, 6 Topics, {} Questions, {} Choices, 7 Assessments, {} Resources.",
                questionRepository.count(), choiceRepository.count(), resourceRepository.count());
    }

    private void seedTopicQuiz(Subject subject, Topic topic, String title, String description, List<Question> questions) {
        Assessment quiz = assessmentRepository.save(new Assessment(
                subject,
                title,
                description,
                AssessmentStatus.PUBLISHED,
                null
        ));
        for (int i = 0; i < questions.size(); i++) {
            assessmentQuestionRepository.save(new AssessmentQuestion(quiz, questions.get(i), i + 1));
        }
    }

    private Question createMCQ(Topic topic, String text, String explanation, DifficultyLevel difficulty,
                               String choiceA, String choiceB, String choiceC, String choiceD, String correctLabel) {
        Question question = questionRepository.save(new Question(
                topic,
                QuestionType.MCQ,
                text,
                explanation,
                difficulty,
                1.0,
                null
        ));

        choiceRepository.save(new Choice(question, "A", choiceA, "A".equalsIgnoreCase(correctLabel)));
        choiceRepository.save(new Choice(question, "B", choiceB, "B".equalsIgnoreCase(correctLabel)));
        choiceRepository.save(new Choice(question, "C", choiceC, "C".equalsIgnoreCase(correctLabel)));
        choiceRepository.save(new Choice(question, "D", choiceD, "D".equalsIgnoreCase(correctLabel)));

        return question;
    }

    private List<Question> seedTopic1Questions(Topic topic) {
        List<Question> list = new ArrayList<>();

        list.add(createMCQ(topic,
                "What is the correct format specifier to print a standard signed int variable in C using printf?",
                "In C, %d or %i outputs a signed decimal integer. %f is for floating-point values, %c is for single characters, and %s is for null-terminated character strings. Misconception: Novices often mistakenly think %d stands for double.",
                DifficultyLevel.EASY,
                "%f", "%d", "%c", "%s", "B"));

        list.add(createMCQ(topic,
                "What is the value of 'result' after executing this C code?\n\nint a = 7;\nint b = 2;\nint result = a / b;",
                "In C, dividing two integers truncates any fractional portion toward zero. 7 / 2 produces 3, not 3.5. Misconception: Beginners assume the fractional part is preserved or rounded up.",
                DifficultyLevel.EASY,
                "3.5", "4", "3", "1", "C"));

        list.add(createMCQ(topic,
                "What is printed by the following C program?\n\n#include <stdio.h>\nint main() {\n    char ch = 'A';\n    printf(\"%d\", ch + 2);\n    return 0;\n}",
                "Character literals in C are represented by integer ASCII values ('A' is 65). Adding 2 yields 67. Because the %d specifier is used, it prints the integer 67 instead of character 'C'. Misconception: Expecting the letter 'C' due to ignoring the %d integer specifier.",
                DifficultyLevel.MEDIUM,
                "C", "67", "A2", "Compilation Error", "B"));

        list.add(createMCQ(topic,
                "In standard C (C99 and later), which of the following is guaranteed regarding sizeof(char)?",
                "By definition in the ISO C standard, sizeof(char) is always guaranteed to be exactly 1 byte. Misconception: Students familiar with Java assume char is 2 bytes for 16-bit Unicode.",
                DifficultyLevel.MEDIUM,
                "It is guaranteed to be exactly 1", "It depends on 32-bit vs 64-bit architecture", "It is always 2 bytes (16 bits)", "It is 4 bytes", "A"));

        list.add(createMCQ(topic,
                "What will be printed by the following code on a system with standard IEEE 754 floats?\n\n#include <stdio.h>\nint main() {\n    float f = 5 / 2;\n    printf(\"%.2f\", f);\n    return 0;\n}",
                "The expression 5 / 2 involves two integer literals, evaluating to integer 2. That integer is then converted to float 2.0f upon assignment. Misconception: Believing that assigning to a float variable forces the right-hand division to execute in floating-point.",
                DifficultyLevel.HARD,
                "2.50", "3.00", "2.25", "2.00", "D"));

        list.add(createMCQ(topic,
                "What happens when attempting to compile and execute the following C code?\n\n#include <stdio.h>\nint main() {\n    const int x = 10;\n    int y = x++;\n    printf(\"%d\", y);\n    return 0;\n}",
                "A variable qualified as const is read-only. The post-increment operator (x++) attempts to modify x, resulting in a compilation error. Misconception: Assuming const variables can be modified via post-increment or that the error is deferred to runtime.",
                DifficultyLevel.HARD,
                "Prints 10", "Prints 11", "Compilation error: cannot increment read-only variable x", "Undefined behavior at runtime", "C"));

        return list;
    }

    private List<Question> seedTopic2Questions(Topic topic) {
        List<Question> list = new ArrayList<>();

        list.add(createMCQ(topic,
                "What is the value of 'c' after executing this code snippet?\n\nint a = 5;\nint b = 10;\nint c = a + b * 2;",
                "Multiplication (*) has higher precedence than addition (+), so b * 2 evaluates first (20), followed by 5 + 20 = 25. Misconception: Evaluating strictly left-to-right yields (5 + 10) * 2 = 30.",
                DifficultyLevel.EASY,
                "30", "20", "15", "25", "D"));

        list.add(createMCQ(topic,
                "What is the fundamental difference between 'x = 5' and 'x == 5' in C?",
                "The single equals sign (=) assigns the value on the right to the variable on the left. The double equals sign (==) compares two values for equality, returning 1 (true) or 0 (false). Misconception: Accidental assignment inside if conditions (if (x = 5)) is a notorious beginner bug.",
                DifficultyLevel.EASY,
                "x = 5 assigns 5 to x, while x == 5 compares x with 5", "They are identical in modern C compilers", "x = 5 compares values and x == 5 assigns values", "x == 5 allocates memory for 5", "A"));

        list.add(createMCQ(topic,
                "What is the output of the following C program?\n\n#include <stdio.h>\nint main() {\n    int a = 5;\n    int b = ++a;\n    int c = a++;\n    printf(\"%d %d %d\", a, b, c);\n    return 0;\n}",
                "++a is pre-increment: a becomes 6, then assigned to b (b=6). a++ is post-increment: current value of a (6) is assigned to c (c=6), then a increments to 7. Final values: a=7, b=6, c=6. Misconception: Confusing the timing of value evaluation between prefix and postfix increment.",
                DifficultyLevel.MEDIUM,
                "7 6 6", "6 6 6", "7 5 6", "7 6 5", "A"));

        list.add(createMCQ(topic,
                "What will be printed by this code due to short-circuit evaluation?\n\n#include <stdio.h>\nint main() {\n    int x = 0;\n    int y = 5;\n    if (x && ++y) {\n        y += 10;\n    }\n    printf(\"%d\", y);\n    return 0;\n}",
                "In a logical AND (&&) expression, if the left operand is false (0), the remaining operand is never evaluated (short-circuited). Since x is 0, ++y never runs, leaving y as 5. Misconception: Expecting all sub-expressions inside parentheses to always be executed.",
                DifficultyLevel.MEDIUM,
                "16", "6", "5", "15", "C"));

        list.add(createMCQ(topic,
                "What does the modulus operator (%) do in C, and what is the result of '17 % 5'?",
                "The modulus operator returns the remainder of integer division. 17 divided by 5 is 3 with a remainder of 2 (5 * 3 + 2 = 17). Misconception: Mistaking % for percentage calculation or floating-point division.",
                DifficultyLevel.HARD,
                "Returns the quotient: 3", "Returns the percentage: 3.4", "Returns the remainder of integer division: 2", "Raises 17 to the power of 5", "C"));

        list.add(createMCQ(topic,
                "What is the output of the following C snippet utilizing the conditional ternary operator?\n\n#include <stdio.h>\nint main() {\n    int a = 10, b = 20;\n    int max = (a > b) ? a : b;\n    printf(\"%d\", max);\n    return 0;\n}",
                "The condition (10 > 20) evaluates to false (0), so the expression resolves to the value after the colon, which is b (20). Misconception: Assuming ternary operators return boolean flags rather than evaluating the chosen branch value.",
                DifficultyLevel.HARD,
                "10", "20", "1", "0", "B"));

        return list;
    }

    private List<Question> seedTopic3Questions(Topic topic) {
        List<Question> list = new ArrayList<>();

        list.add(createMCQ(topic,
                "Why does scanf require the address-of operator (&) for fundamental variables like 'scanf(\"%d\", &num);'?",
                "C passes function arguments by value. To allow scanf to write data into the caller's variable, it requires a pointer to the variable's memory address. Misconception: Believing & is an optional syntax or merely an integer indicator.",
                DifficultyLevel.EASY,
                "To tell C to format the input as decimal", "Because scanf needs the memory address of the variable to store the parsed input into it", "It indicates that num is a global variable", "It is optional in C99 and later", "B"));

        list.add(createMCQ(topic,
                "What is the format specifier used to read or print a single char in C?",
                "%c reads or writes a single character. %s is for null-terminated strings, and %d is for signed integers. Misconception: Using %s to read a single char, which can cause memory corruption because strings expect a null terminator.",
                DifficultyLevel.EASY,
                "%c", "%s", "%d", "%str", "A"));

        list.add(createMCQ(topic,
                "What is the output of this printf statement?\n\n#include <stdio.h>\nint main() {\n    double pi = 3.14159265;\n    printf(\"%.3f\", pi);\n    return 0;\n}",
                "The specifier %.3f formats the number to 3 decimal places with standard mathematical rounding. Since the fourth digit is 5, 3.1415... rounds up to 3.142. Misconception: Assuming printf strictly truncates without rounding (expecting 3.141).",
                DifficultyLevel.MEDIUM,
                "3.14", "3.141", "3.1415", "3.142", "D"));

        list.add(createMCQ(topic,
                "When reading a string using 'scanf(\"%s\", str);' where char str[50];, what happens if the user enters 'Hello World'?",
                "The %s format specifier in scanf stops reading at the first whitespace character (space, tab, newline). Therefore, str only contains 'Hello'. fgets() must be used to read entire lines with spaces. Misconception: Assuming %s reads until the Enter key.",
                DifficultyLevel.MEDIUM,
                "str contains 'Hello World'", "str contains 'Hello', because %s stops reading at whitespace", "A runtime buffer overflow always occurs", "str contains 'World'", "B"));

        list.add(createMCQ(topic,
                "What value does printf return upon successful execution in C?",
                "According to the C standard library specification, printf returns the total count of characters successfully written to the output stream. Misconception: Most beginners believe printf has a void return type or always returns 0 or 1.",
                DifficultyLevel.HARD,
                "Always 0", "Always 1", "The number of characters successfully printed", "A pointer to the stdout stream", "C"));

        list.add(createMCQ(topic,
                "Given this C snippet:\n\n#include <stdio.h>\nint main() {\n    int x = 42;\n    printf(\"%5d\", x);\n    return 0;\n}\n\nWhat does the format specifier '%5d' specify?",
                "A number directly preceding the specifier designates the minimum field width. If the printed data is shorter than the width (42 is 2 characters), it is right-aligned and padded with leading spaces (3 spaces + 42). Misconception: Confusing minimum field width (%5d) with decimal precision (%.5d).",
                DifficultyLevel.HARD,
                "Multiplies x by 5 before printing", "Prints 5 identical copies of 42", "Formats x to 5 decimal places", "Right-aligns the number within a minimum field width of 5 characters, padded with spaces", "D"));

        return list;
    }

    private List<Question> seedTopic4Questions(Topic topic) {
        List<Question> list = new ArrayList<>();

        list.add(createMCQ(topic,
                "In C, which of the following values is evaluated as boolean FALSE in conditional expressions?",
                "In C, integer 0 evaluates to false. ANY non-zero integer (including negative numbers like -1 or -100) evaluates to true. Misconception: Many students believe negative numbers evaluate to false.",
                DifficultyLevel.EASY,
                "-1", "Any negative number", "0", "1", "C"));

        list.add(createMCQ(topic,
                "What is printed by the following C code?\n\n#include <stdio.h>\nint main() {\n    int x = 0;\n    if (x = 5) {\n        printf(\"True\");\n    } else {\n        printf(\"False\");\n    }\n    return 0;\n}",
                "The statement if (x = 5) performs assignment, not comparison. The assignment expression evaluates to 5, which is non-zero (true), causing the if branch to execute. Misconception: Believing it tests whether x equals 5.",
                DifficultyLevel.EASY,
                "False", "True", "Compilation Error", "Nothing", "B"));

        list.add(createMCQ(topic,
                "What is printed by this switch statement?\n\n#include <stdio.h>\nint main() {\n    int day = 2;\n    switch (day) {\n        case 1: printf(\"Mon \");\n        case 2: printf(\"Tue \");\n        case 3: printf(\"Wed \");\n        default: printf(\"End\");\n    }\n    return 0;\n}",
                "In C switch statements, execution enters at case 2 ('Tue ') and falls through all subsequent cases because there are no break statements, printing 'Tue Wed End'. Misconception: Forgetting that switch cases fall through automatically without explicit break.",
                DifficultyLevel.MEDIUM,
                "Tue ", "Tue Wed End", "Tue Wed ", "Mon Tue Wed End", "B"));

        list.add(createMCQ(topic,
                "Consider the classic dangling-else problem:\n\n#include <stdio.h>\nint main() {\n    int a = 1, b = 0;\n    if (a > 0)\n        if (b > 0)\n            printf(\"X\");\n    else\n        printf(\"Y\");\n    return 0;\n}\n\nWhat does this print?",
                "In C syntax, an else clause always associates with the nearest unmatched preceding if statement. Despite the misleading indentation, the else belongs to if (b > 0). Since a > 0 is true and b > 0 is false, it prints 'Y'. Misconception: Relying on visual indentation instead of compiler parsing rules.",
                DifficultyLevel.MEDIUM,
                "Y", "Nothing", "X", "Compilation Error", "A"));

        list.add(createMCQ(topic,
                "Which of the following expressions CANNOT be used as a case label in a C switch statement?",
                "Switch case labels in C must be compile-time integer constant expressions (such as char, int, or enum). Floating-point literals (like 2.5f) are explicitly prohibited. Misconception: Expecting switch statements to support floating-point values or arbitrary variables.",
                DifficultyLevel.HARD,
                "'A'", "3 + 2", "float x = 2.5f", "10", "C"));

        list.add(createMCQ(topic,
                "What is printed by the following code?\n\n#include <stdio.h>\nint main() {\n    int x = 10;\n    if (x > 5)\n        ;\n    {\n        printf(\"Hello\");\n    }\n    return 0;\n}",
                "The semicolon immediately following if (x > 5) acts as an empty null statement. The following block { printf(\"Hello\"); } is an independent compound statement that always executes regardless of the condition. Misconception: Not realizing that an accidental semicolon decouples the block from the if check.",
                DifficultyLevel.HARD,
                "Nothing", "Compilation error on semicolon", "Undefined behavior", "Hello", "D"));

        return list;
    }

    private List<Question> seedTopic5Questions(Topic topic) {
        List<Question> list = new ArrayList<>();

        list.add(createMCQ(topic,
                "How many times does the body of this loop execute?\n\nint count = 0;\nfor (int i = 0; i < 5; i++) {\n    count++;\n}",
                "The loop variable i takes the sequential values 0, 1, 2, 3, and 4. When i reaches 5, the condition 5 < 5 is false, yielding exactly 5 iterations. Misconception: Off-by-one errors (thinking 0 to < 5 means 4 iterations).",
                DifficultyLevel.EASY,
                "4 times", "5 times", "6 times", "0 times", "B"));

        list.add(createMCQ(topic,
                "How is a do-while loop fundamentally different from a while loop in C?",
                "A while loop tests its condition before entering the body (entry-controlled), while a do-while loop evaluates its condition at the bottom (exit-controlled), guaranteeing at least one execution. Misconception: Assuming all loop types evaluate their condition before any statements execute.",
                DifficultyLevel.EASY,
                "A do-while loop never executes if the condition is false", "A do-while loop is guaranteed to execute its body at least once before checking the condition", "A do-while loop only works with integer counters", "A do-while loop cannot use break", "B"));

        list.add(createMCQ(topic,
                "What is printed by this loop?\n\n#include <stdio.h>\nint main() {\n    int i = 1;\n    while (i <= 5) {\n        if (i == 3) {\n            break;\n        }\n        printf(\"%d \", i);\n        i++;\n    }\n    return 0;\n}",
                "When i reaches 3, the break statement terminates the while loop immediately before printing 3 or incrementing i. Therefore, only '1 2 ' are printed. Misconception: Confusing break (exits entire loop) with continue (skips to next iteration).",
                DifficultyLevel.MEDIUM,
                "1 2 3 ", "1 2 4 5 ", "1 2 ", "1 2 3 4 5 ", "C"));

        list.add(createMCQ(topic,
                "What is the final value of sum in this snippet?\n\n#include <stdio.h>\nint main() {\n    int sum = 0;\n    for (int i = 0; i < 4; i++) {\n        if (i == 2) continue;\n        sum += i;\n    }\n    printf(\"%d\", sum);\n    return 0;\n}",
                "The loop iterates through i = 0, 1, 2, 3. When i is 2, continue skips sum += i. Thus sum = 0 + 1 + 3 = 4. Misconception: Adding all numbers (0+1+2+3=6) without accounting for the continue jump.",
                DifficultyLevel.MEDIUM,
                "4", "3", "6", "1", "A"));

        list.add(createMCQ(topic,
                "What will be printed by the following do-while loop?\n\n#include <stdio.h>\nint main() {\n    int x = 1;\n    do {\n        printf(\"%d \", x);\n        x += 2;\n    } while (x < 5);\n    return 0;\n}",
                "Iteration 1: prints '1 ', x becomes 3; condition (3 < 5) is true. Iteration 2: prints '3 ', x becomes 5; condition (5 < 5) is false. Loop finishes. Output is '1 3 '. Misconception: Expecting 5 to be printed before the condition check terminates the loop.",
                DifficultyLevel.HARD,
                "1 3 5 ", "1 3 5 7 ", "1 ", "1 3 ", "D"));

        list.add(createMCQ(topic,
                "Consider this loop:\n\n#include <stdio.h>\nint main() {\n    unsigned char c;\n    int iterations = 0;\n    for (c = 0; c < 255; c++) {\n        iterations++;\n    }\n    printf(\"%d\", iterations);\n    return 0;\n}\n\nWhat does this print?",
                "The loop increments c from 0 through 254 (255 iterations). When c becomes 255, the condition (255 < 255) is false, so it terminates after 255 iterations. (Note: if the condition were c <= 255, it would be an infinite loop because 255 + 1 wraps to 0). Misconception: Generalizing that any loop with unsigned char wrapping is automatically infinite.",
                DifficultyLevel.HARD,
                "255", "256", "Infinite loop", "Compilation error", "A"));

        return list;
    }

    private List<Question> seedTopic6Questions(Topic topic) {
        List<Question> list = new ArrayList<>();

        list.add(createMCQ(topic,
                "In C, how are arguments passed to functions by default?",
                "C is strictly a pass-by-value language. Arguments passed into functions are copied; modifications to local parameter copies do not alter the caller's variables unless explicit pointers are passed. Misconception: Believing C supports pass-by-reference natively without pointers.",
                DifficultyLevel.EASY,
                "By reference", "By value", "By pointer", "By name", "B"));

        list.add(createMCQ(topic,
                "What is a function prototype in C and why is it used?",
                "A function prototype declares the function's name, return type, and parameter list before its definition, enabling the compiler to validate argument types and counts at call sites. Misconception: Confusing a declaration with code generation or memory allocation.",
                DifficultyLevel.EASY,
                "It allocates heap memory for the function before main executes", "It tells the compiler the function's name, return type, and parameter types before its definition", "It marks the function as private to the current file", "It is only required when implementing recursive functions", "B"));

        list.add(createMCQ(topic,
                "What is printed by this program?\n\n#include <stdio.h>\nvoid swap(int a, int b) {\n    int temp = a;\n    a = b;\n    b = temp;\n}\nint main() {\n    int x = 10, y = 20;\n    swap(x, y);\n    printf(\"%d %d\", x, y);\n    return 0;\n}",
                "Because parameters are passed by value, swap operates on isolated local copies of x and y. The original variables in main remain unchanged as '10 20'. Misconception: Believing a swap function without pointer dereferencing can mutate the caller's values.",
                DifficultyLevel.MEDIUM,
                "20 10", "0 0", "10 20", "Compilation Error", "C"));

        list.add(createMCQ(topic,
                "What does the return statement do in a function whose return type is void?",
                "In a void function, 'return;' serves as an early exit command, returning control immediately to the caller without supplying a value. Misconception: Believing void functions cannot contain any return statements or must return 0.",
                DifficultyLevel.MEDIUM,
                "return; is illegal in void functions", "Exits the function immediately without returning a value", "It must return 0", "It restarts execution from the top of the function", "B"));

        list.add(createMCQ(topic,
                "What is printed by the following code with a static local variable?\n\n#include <stdio.h>\nvoid counter() {\n    static int count = 0;\n    count++;\n    printf(\"%d \", count);\n}\nint main() {\n    counter();\n    counter();\n    counter();\n    return 0;\n}",
                "A static local variable is initialized once and retains its value between successive function calls across the program's lifetime. Calling counter() 3 times increments count from 0 to 1, 2, and 3, printing '1 2 3 '. Misconception: Assuming local variables always re-initialize to 0 on every call.",
                DifficultyLevel.HARD,
                "1 1 1 ", "1 2 3 ", "0 1 2 ", "Compilation Error", "B"));

        list.add(createMCQ(topic,
                "What is the output of this recursive function?\n\n#include <stdio.h>\nint mystery(int n) {\n    if (n <= 1) return 1;\n    return n * mystery(n - 1);\n}\nint main() {\n    printf(\"%d\", mystery(4));\n    return 0;\n}",
                "This computes factorial: 4 * mystery(3) = 4 * 3 * mystery(2) = 4 * 3 * 2 * 1 = 24. Misconception: Confusing factorial multiplication with recursive addition (which would yield 10).",
                DifficultyLevel.HARD,
                "4", "10", "12", "24", "D"));

        return list;
    }

    private void seedResources(Subject subject, List<Topic> topics) {
        // Topic 1
        resourceRepository.save(new Resource(
                subject, topics.get(0),
                "Understanding C Data Types, Format Specifiers, and Truncation",
                "Core rules for integer, character, and floating-point variable storage in C.",
                ResourceType.NOTE,
                "In C, variables represent named memory locations allocated according to their data type. Standard integer types like int store whole numbers, while float and double represent real numbers with varying precision. A critical rule in C arithmetic is that dividing two integers always performs truncation toward zero, discarding any fractional portion regardless of the receiving variable's type. For example, writing 'float f = 5 / 2;' stores 2.0 because the division finishes before assignment. To preserve fractional results, cast at least one operand to a float, such as '5.0 / 2'. Characters (char) are stored as small 1-byte integers corresponding to their ASCII encodings.",
                null, DifficultyLevel.EASY, null
        ));
        resourceRepository.save(new Resource(
                subject, topics.get(0),
                "Fixing Integer Division in Temperature Conversion",
                "Debug a Fahrenheit to Celsius formula that produces 0.",
                ResourceType.PRACTICE,
                "A student wrote 'float celsius = (5 / 9) * (fahrenheit - 32);' to convert temperature, but celsius always evaluates to 0.0 regardless of the input temperature. Identify why this happens and rewrite the expression to compute the accurate Celsius value.\n\nHint: Look closely at 5 / 9. Both 5 and 9 are integer literals. What happens during integer division when the numerator is smaller than the denominator?",
                null, DifficultyLevel.MEDIUM, null
        ));

        // Topic 2
        resourceRepository.save(new Resource(
                subject, topics.get(1),
                "Operator Precedence, Short-Circuiting, and Side Effects in C",
                "How C evaluates mathematical and logical expressions.",
                ResourceType.NOTE,
                "C expressions are evaluated based on operator precedence and associativity rules. Multiplicative operators (*, /, %) possess higher precedence than additive operators (+, -), meaning multiplication executes before addition unless overridden by parentheses. Logical operators (&& and ||) exhibit short-circuit evaluation: evaluation halts as soon as the outcome is guaranteed. In 'expr1 && expr2', if expr1 is false (0), expr2 is never evaluated, which means any increment or function calls inside expr2 will not occur. Additionally, remember that '=' performs assignment while '==' performs comparison; writing 'if (x = 5)' assigns 5 to x and evaluates to true.",
                null, DifficultyLevel.MEDIUM, null
        ));
        resourceRepository.save(new Resource(
                subject, topics.get(1),
                "Predicting Prefix vs Postfix Increment",
                "Trace variable state through compound expressions.",
                ResourceType.PRACTICE,
                "Trace the values of variables a, b, and result after executing the following lines:\n```c\nint a = 3;\nint b = 4;\nint result = (++a) * (b--);\n```\nWhat are the final values of a, b, and result?\n\nHint: Prefix ++a increments before producing its value for the multiplication, whereas postfix b-- provides its current value to the multiplication before decrementing.",
                null, DifficultyLevel.HARD, null
        ));

        // Topic 3
        resourceRepository.save(new Resource(
                subject, topics.get(2),
                "Mastering Standard I/O: Format Specifiers and Buffer Nuances",
                "Proper usage of printf and scanf in C programs.",
                ResourceType.NOTE,
                "Standard input and output in C rely on the <stdio.h> library functions printf and scanf. printf formats data for terminal display using format specifiers like %d for integers, %f for floats, and %c for characters. Field widths like %5d right-align numbers within 5 character slots, while precision specifiers like %.2f round decimals. Conversely, scanf reads formatted keyboard input and requires the memory address of destination variables, which is why fundamental types require the & operator (e.g., scanf(\"%d\", &val)). When reading strings with %s, scanf stops reading at the first whitespace character, making fgets() the standard alternative for multi-word input.",
                null, DifficultyLevel.EASY, null
        ));
        resourceRepository.save(new Resource(
                subject, topics.get(2),
                "Safe Numeric and Character Input",
                "Preventing common scanf pitfalls with trailing newlines.",
                ResourceType.PRACTICE,
                "When reading an integer followed immediately by a character using 'scanf(\"%d\", &num);' and 'scanf(\"%c\", &ch);', the character scanf often seems to be skipped entirely. Explain why this happens and how to fix it.\n\nHint: Pressing the Enter key after typing a number leaves a newline character '\\n' sitting in the standard input buffer. How can you tell scanf to ignore leading whitespace before reading a character?",
                null, DifficultyLevel.MEDIUM, null
        ));

        // Topic 4
        resourceRepository.save(new Resource(
                subject, topics.get(3),
                "Branching Logic in C: If/Else Ladders and Switch Semantics",
                "Making decisions with conditionals, switch statements, and fall-through.",
                ResourceType.NOTE,
                "Conditional statements steer program execution based on truth values. In C, there is no separate native boolean type prior to C99's <stdbool.h>; the integer value 0 represents false, and any non-zero value represents true. When chaining conditional logic, the 'dangling else' rule specifies that an else always binds to the nearest unmatched preceding if within the same block scope. Switch statements provide efficient multi-way branching against integer constant expressions. Unlike high-level languages, C switch cases fall through sequentially to following cases unless interrupted by an explicit break; statement, making break essential for isolated branch execution.",
                null, DifficultyLevel.MEDIUM, null
        ));
        resourceRepository.save(new Resource(
                subject, topics.get(3),
                "Refactoring Nested Conditions into a Switch",
                "Rewrite an error code dispatcher cleanly.",
                ResourceType.PRACTICE,
                "Given a status code integer 'code' ranging from 1 to 4, write a C switch statement that prints 'OK' for 1, 'WARNING' for 2 or 3, and 'ERROR' for 4. Any other code should print 'UNKNOWN'.\n\nHint: You can intentionally use case fall-through to handle both 2 and 3 with a single block of code before a break statement.",
                null, DifficultyLevel.EASY, null
        ));

        // Topic 5
        resourceRepository.save(new Resource(
                subject, topics.get(4),
                "Iteration in C: Entry-Controlled vs Exit-Controlled Loops",
                "Choosing between for, while, and do-while loops.",
                ResourceType.NOTE,
                "Loops enable repeated execution of code blocks while a given condition remains true. A for loop packages initialization, test condition, and step increment into a single readable header, making it ideal for counting iterations. A while loop checks its condition at the entry point; if the condition is initially false, the loop body never executes. In contrast, a do-while loop is exit-controlled and tests its condition after executing the body, ensuring the body runs at least once. Control flow within loops can be altered using break to exit immediately, or continue to skip the remainder of the current iteration and proceed to the next step.",
                null, DifficultyLevel.EASY, null
        ));
        resourceRepository.save(new Resource(
                subject, topics.get(4),
                "Fixing an Infinite Loop from Off-by-One Bounds",
                "Diagnose a loop that runs forever due to unsigned integer wrapping.",
                ResourceType.PRACTICE,
                "Analyze the following code:\n```c\nfor (unsigned int i = 10; i >= 0; i--) {\n    printf(\"%u \", i);\n}\n```\nWhy does this loop never terminate, and how can you correct it?\n\nHint: An unsigned int can never hold a negative value. What happens when i = 0 and i-- is executed?",
                null, DifficultyLevel.HARD, null
        ));

        // Topic 6
        resourceRepository.save(new Resource(
                subject, topics.get(5),
                "Modular C: Pass-by-Value, Function Scope, and Static Lifetime",
                "Designing reusable functions and understanding parameter mechanisms.",
                ResourceType.NOTE,
                "Functions break complex programs into small, testable, and reusable building blocks. In C, all function parameters are passed by value, meaning the function receives independent copies of the caller's arguments. As a consequence, modifying a parameter inside a function has no effect on the original argument in the calling function. To allow a function to modify a caller's variable, the caller must pass the variable's address (a pointer). Function prototypes declare the name, return type, and parameter list before main, enabling the compiler to validate calls. Local variables declared with the static keyword persist across function calls, preserving their state throughout program execution.",
                null, DifficultyLevel.MEDIUM, null
        ));
        resourceRepository.save(new Resource(
                subject, topics.get(5),
                "Designing a Safe Swap Function",
                "Implement an in-place variable swap using pointers.",
                ResourceType.PRACTICE,
                "Write the function prototype and definition for 'void swap(int *a, int *b)' that correctly interchanges the values stored in two integer variables located in main.\n\nHint: Dereference the pointers using the * operator to read and write the values at the memory addresses passed in from the caller.",
                null, DifficultyLevel.MEDIUM, null
        ));
    }
}

