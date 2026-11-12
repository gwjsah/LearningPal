package com.csit321g2.codebuds.learningpal.controller;

import com.csit321g2.codebuds.learningpal.entity.Topic;
import com.csit321g2.codebuds.learningpal.exception.ResourceNotFoundException;
import com.csit321g2.codebuds.learningpal.repository.TopicRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/topics")
public class TopicController {

    private final TopicRepository topicRepository;

    public TopicController(TopicRepository topicRepository) {
        this.topicRepository = topicRepository;
    }

    @GetMapping
    public ResponseEntity<List<Topic>> getAllTopics() {
        return ResponseEntity.ok(topicRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Topic> getTopicById(@PathVariable Long id) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + id));
        return ResponseEntity.ok(topic);
    }

    @PostMapping
    public ResponseEntity<Topic> createTopic(@RequestBody Topic topic) {
        Topic saved = topicRepository.save(topic);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Topic> updateTopic(@PathVariable Long id, @RequestBody Topic updatedTopic) {
        Topic existing = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + id));

        if (updatedTopic.getName() != null) {
            existing.setName(updatedTopic.getName());
        }
        if (updatedTopic.getDescription() != null) {
            existing.setDescription(updatedTopic.getDescription());
        }
        if (updatedTopic.getDisplayOrder() != null) {
            existing.setDisplayOrder(updatedTopic.getDisplayOrder());
        }
        if (updatedTopic.getStatus() != null) {
            existing.setStatus(updatedTopic.getStatus());
        }

        Topic saved = topicRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTopic(@PathVariable Long id) {
        if (!topicRepository.existsById(id)) {
            throw new ResourceNotFoundException("Topic not found with id: " + id);
        }
        topicRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
