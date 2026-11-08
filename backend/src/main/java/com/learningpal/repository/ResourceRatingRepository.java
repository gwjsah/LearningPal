package com.learningpal.repository;

import com.learningpal.entity.Resource;
import com.learningpal.entity.ResourceRating;
import com.learningpal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRatingRepository extends JpaRepository<ResourceRating, Long> {

    Optional<ResourceRating> findByStudentAndResource(User student, Resource resource);

    Optional<ResourceRating> findByStudentIdAndResourceId(Long studentId, Long resourceId);

    List<ResourceRating> findByStudent(User student);

    List<ResourceRating> findByStudentId(Long studentId);

    List<ResourceRating> findByResourceId(Long resourceId);

    List<ResourceRating> findByStudentIn(Collection<User> students);

    @Query("SELECT r FROM ResourceRating r WHERE r.student.id IN :studentIds")
    List<ResourceRating> findByStudentIdIn(@Param("studentIds") Collection<Long> studentIds);

    @Query("SELECT r FROM ResourceRating r WHERE r.student.institution.id = :institutionId")
    List<ResourceRating> findByStudentInstitutionId(@Param("institutionId") Long institutionId);

    @Query("SELECT r FROM ResourceRating r WHERE r.student.id IN :studentIds AND r.resource.topic.subject.id = :subjectId")
    List<ResourceRating> findByStudentIdInAndSubjectId(@Param("studentIds") Collection<Long> studentIds, @Param("subjectId") Long subjectId);
}
