package com.learningpal.repository;

import com.learningpal.entity.Answer;
import com.learningpal.entity.Attempt;
import com.learningpal.entity.AttemptStatus;
import com.learningpal.entity.Question;
import com.learningpal.entity.Topic;
import com.learningpal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {
    List<Answer> findByAttempt(Attempt attempt);
    List<Answer> findByAttemptId(Long attemptId);
    Optional<Answer> findByAttemptIdAndQuestionId(Long attemptId, Long questionId);
    boolean existsByQuestion(Question question);
    long countByQuestion(Question question);

    @Query("SELECT a FROM Answer a WHERE a.attempt.student = :student AND a.question.topic = :topic AND a.attempt.status = :status ORDER BY a.attempt.submittedAt DESC, a.id DESC")
    List<Answer> findStudentTopicAnswers(@Param("student") User student, @Param("topic") Topic topic, @Param("status") AttemptStatus status);

    @Query("SELECT a FROM Answer a WHERE a.attempt.student = :student AND a.attempt.classId = :classId AND a.question.topic = :topic AND a.attempt.status = :status ORDER BY a.attempt.submittedAt DESC, a.id DESC")
    List<Answer> findStudentClassTopicAnswers(
            @Param("student") User student,
            @Param("classId") Long classId,
            @Param("topic") Topic topic,
            @Param("status") AttemptStatus status
    );

    @Query("SELECT a FROM Answer a WHERE a.attempt.student.id = :studentId AND a.attempt.classId = :classId AND a.attempt.status = :status ORDER BY a.attempt.submittedAt ASC, a.id ASC")
    List<Answer> findStudentClassAnswers(
            @Param("studentId") Long studentId,
            @Param("classId") Long classId,
            @Param("status") AttemptStatus status
    );
}

