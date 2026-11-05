package com.learningpal.repository;

import com.learningpal.entity.GapValidationLabel;
import com.learningpal.entity.ValidationSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GapValidationLabelRepository extends JpaRepository<GapValidationLabel, Long> {

    Optional<GapValidationLabel> findByStudentIdAndTopicIdAndSource(Long studentId, Long topicId, ValidationSource source);

    List<GapValidationLabel> findByStudentId(Long studentId);

    List<GapValidationLabel> findByTopicId(Long topicId);

    List<GapValidationLabel> findBySource(ValidationSource source);

    long countBySource(ValidationSource source);

    @Modifying
    @Query("DELETE FROM GapValidationLabel g WHERE g.student.email LIKE :emailPattern")
    void deleteByStudentEmailLike(@Param("emailPattern") String emailPattern);
}

