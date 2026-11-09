package com.learningpal.repository;

import com.learningpal.entity.Resource;
import com.learningpal.entity.ResourceFile;
import com.learningpal.entity.ResourceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceFileRepository extends JpaRepository<ResourceFile, Long> {

    Optional<ResourceFile> findByResource(Resource resource);

    Optional<ResourceFile> findByResourceId(Long resourceId);

    Optional<ResourceFile> findByStorageKey(String storageKey);

    @Query("SELECT rf FROM ResourceFile rf WHERE rf.resource.subject.id = :subjectId ORDER BY rf.uploadedAt DESC")
    List<ResourceFile> findBySubjectId(@Param("subjectId") Long subjectId);

    @Query("SELECT rf FROM ResourceFile rf WHERE rf.resource.subject.id = :subjectId AND rf.resource.status = :status ORDER BY rf.uploadedAt DESC")
    List<ResourceFile> findBySubjectIdAndStatus(@Param("subjectId") Long subjectId, @Param("status") ResourceStatus status);

    @Query("SELECT COALESCE(SUM(rf.sizeBytes), 0) FROM ResourceFile rf WHERE rf.resource.createdBy.id = :teacherId AND rf.resource.status = :status")
    long sumActiveBytesByTeacherId(@Param("teacherId") Long teacherId, @Param("status") ResourceStatus status);

    @Query("SELECT COUNT(rf) > 0 FROM ResourceFile rf WHERE rf.resource.subject.id = :subjectId AND rf.sha256 = :sha256 AND rf.resource.status = :status")
    boolean existsBySubjectIdAndSha256AndStatus(
            @Param("subjectId") Long subjectId,
            @Param("sha256") String sha256,
            @Param("status") ResourceStatus status);

    void deleteByResource(Resource resource);
}
