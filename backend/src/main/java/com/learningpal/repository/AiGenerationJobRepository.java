package com.learningpal.repository;

import com.learningpal.entity.AiGenerationJob;
import com.learningpal.entity.AiJobStatus;
import com.learningpal.entity.ResourceFile;
import com.learningpal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

@Repository
public interface AiGenerationJobRepository extends JpaRepository<AiGenerationJob, Long> {
    List<AiGenerationJob> findByTeacherOrderByCreatedAtDesc(User teacher);
    List<AiGenerationJob> findBySubjectIdOrderByCreatedAtDesc(Long subjectId);
    List<AiGenerationJob> findByTeacherAndSubjectIdOrderByCreatedAtDesc(User teacher, Long subjectId);
    List<AiGenerationJob> findBySourceFileOrderByCreatedAtDesc(ResourceFile sourceFile);
    List<AiGenerationJob> findByStatusIn(Collection<AiJobStatus> statuses);

    long countByTeacherAndStatusIn(User teacher, Collection<AiJobStatus> statuses);
    long countByTeacherAndCreatedAtAfter(User teacher, Instant after);

    @Modifying
    @Query("DELETE FROM AiGenerationJob j WHERE j.sourceFile = :sourceFile")
    void deleteBySourceFile(@Param("sourceFile") ResourceFile sourceFile);
}
