package com.csit321g2.codebuds.learningpal.controller;

import com.csit321g2.codebuds.learningpal.dto.QuestionRequest;
import com.csit321g2.codebuds.learningpal.entity.Question;
import com.csit321g2.codebuds.learningpal.entity.Topic;
import com.csit321g2.codebuds.learningpal.exception.ResourceNotFoundException;
import com.csit321g2.codebuds.learningpal.repository.QuestionRepository;
import com.csit321g2.codebuds.learningpal.repository.TopicRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionRepository questionRepository;
    private final TopicRepository topicRepository;

    public QuestionController(QuestionRepository questionRepository, TopicRepository topicRepository) {
        this.questionRepository = questionRepository;
        this.topicRepository = topicRepository;
    }

    @GetMapping
    public ResponseEntity<List<Question>> getAllQuestions(@RequestParam(required = false) Long topicId) {
        if (topicId != null) {
            return ResponseEntity.ok(questionRepository.findByTopicId(topicId));
        }
        return ResponseEntity.ok(questionRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Question> getQuestionById(@PathVariable Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + id));
        return ResponseEntity.ok(question);
    }

    @PostMapping
    public ResponseEntity<Question> createQuestion(@RequestBody QuestionRequest request) {
        Question question = new Question();
        question.setText(request.getText());
        question.setExplanation(request.getExplanation());
        question.setType(request.getType());
        question.setDifficulty(request.getDifficulty());
        question.setPoints(request.getPoints());

        if (request.getTopicId() != null) {
            Topic topic = topicRepository.findById(request.getTopicId())
                    .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + request.getTopicId()));
            question.setTopic(topic);
        }

        if (request.getChoices() != null) {
            question.setChoices(request.getChoices());
        }

        Question saved = questionRepository.save(question);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Question> updateQuestion(@PathVariable Long id, @RequestBody QuestionRequest request) {
        Question existing = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + id));

        if (request.getText() != null) {
            existing.setText(request.getText());
        }
        if (request.getExplanation() != null) {
            existing.setExplanation(request.getExplanation());
        }
        if (request.getType() != null) {
            existing.setType(request.getType());
        }
        if (request.getDifficulty() != null) {
            existing.setDifficulty(request.getDifficulty());
        }
        if (request.getPoints() != null) {
            existing.setPoints(request.getPoints());
        }
        if (request.getTopicId() != null) {
            Topic topic = topicRepository.findById(request.getTopicId())
                    .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + request.getTopicId()));
            existing.setTopic(topic);
        }
        if (request.getChoices() != null) {
            existing.getChoices().clear();
            existing.getChoices().addAll(request.getChoices());
        }

        Question saved = questionRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        if (!questionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Question not found with id: " + id);
        }
        questionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
