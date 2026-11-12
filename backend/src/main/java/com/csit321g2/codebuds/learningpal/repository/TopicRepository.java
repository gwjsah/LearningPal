package com.csit321g2.codebuds.learningpal.repository;

import com.csit321g2.codebuds.learningpal.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {
    List<Topic> findAllByOrderByDisplayOrderAsc();
}
