package com.learningpal.repository;

import com.learningpal.entity.FeedbackRating;
import com.learningpal.entity.Topic;
import com.learningpal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRatingRepository extends JpaRepository<FeedbackRating, Long> {

    Optional<FeedbackRating> findByStudentAndTopic(User student, Topic topic);

    Optional<FeedbackRating> findByStudentIdAndTopicId(Long studentId, Long topicId);

    List<FeedbackRating> findByStudent(User student);

    List<FeedbackRating> findByStudentId(Long studentId);

    List<FeedbackRating> findByTopicId(Long topicId);

    List<FeedbackRating> findByStudentIn(Collection<User> students);

    @Query("SELECT r FROM FeedbackRating r WHERE r.student.id IN :studentIds")
    List<FeedbackRating> findByStudentIdIn(@Param("studentIds") Collection<Long> studentIds);

    @Query("SELECT r FROM FeedbackRating r WHERE r.student.institution.id = :institutionId")
    List<FeedbackRating> findByStudentInstitutionId(@Param("institutionId") Long institutionId);

    @Query("SELECT r FROM FeedbackRating r WHERE r.student.id IN :studentIds AND r.topic.subject.id = :subjectId")
    List<FeedbackRating> findByStudentIdInAndSubjectId(@Param("studentIds") Collection<Long> studentIds, @Param("subjectId") Long subjectId);
}
