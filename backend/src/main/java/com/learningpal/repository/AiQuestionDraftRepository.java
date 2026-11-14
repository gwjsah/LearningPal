package com.learningpal.repository;

import com.learningpal.entity.AiDraftStatus;
import com.learningpal.entity.AiGenerationJob;
import com.learningpal.entity.AiQuestionDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface AiQuestionDraftRepository extends JpaRepository<AiQuestionDraft, Long> {
    List<AiQuestionDraft> findByJobOrderByIdAsc(AiGenerationJob job);
    List<AiQuestionDraft> findByJobAndStatus(AiGenerationJob job, AiDraftStatus status);
    long countByJob(AiGenerationJob job);
    long countByJobAndStatus(AiGenerationJob job, AiDraftStatus status);

    @Modifying
    @Query("DELETE FROM AiQuestionDraft d WHERE d.job = :job")
    void deleteByJob(@Param("job") AiGenerationJob job);

    @Modifying
    @Query("DELETE FROM AiQuestionDraft d WHERE d.job IN :jobs")
    void deleteByJobIn(@Param("jobs") Collection<AiGenerationJob> jobs);
}
