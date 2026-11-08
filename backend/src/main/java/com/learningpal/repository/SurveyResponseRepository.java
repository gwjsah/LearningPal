package com.learningpal.repository;

import com.learningpal.entity.SurveyResponse;
import com.learningpal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SurveyResponseRepository extends JpaRepository<SurveyResponse, Long> {

    Optional<SurveyResponse> findByUserAndSurveyVersion(User user, String surveyVersion);

    boolean existsByUserAndSurveyVersion(User user, String surveyVersion);

    List<SurveyResponse> findByUser(User user);

    @Query("SELECT r FROM SurveyResponse r JOIN FETCH r.answers WHERE r.user.institution.id = :institutionId")
    List<SurveyResponse> findByUserInstitutionIdWithAnswers(@Param("institutionId") Long institutionId);

    @Query("SELECT r FROM SurveyResponse r WHERE r.user.institution.id = :institutionId")
    List<SurveyResponse> findByUserInstitutionId(@Param("institutionId") Long institutionId);
}
