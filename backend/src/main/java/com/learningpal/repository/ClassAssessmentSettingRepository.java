package com.learningpal.repository;

import com.learningpal.entity.Assessment;
import com.learningpal.entity.ClassAssessmentSetting;
import com.learningpal.entity.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassAssessmentSettingRepository extends JpaRepository<ClassAssessmentSetting, Long> {
    Optional<ClassAssessmentSetting> findByClassEntityAndAssessment(ClassEntity classEntity, Assessment assessment);
    Optional<ClassAssessmentSetting> findByClassEntityIdAndAssessmentId(Long classId, Long assessmentId);
    List<ClassAssessmentSetting> findByClassEntity(ClassEntity classEntity);
}

