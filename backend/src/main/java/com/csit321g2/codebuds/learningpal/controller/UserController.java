package com.csit321g2.codebuds.learningpal.controller;

import com.csit321g2.codebuds.learningpal.dto.UserDto;
import com.csit321g2.codebuds.learningpal.entity.User;
import com.csit321g2.codebuds.learningpal.entity.UserStatus;
import com.csit321g2.codebuds.learningpal.exception.ResourceNotFoundException;
import com.csit321g2.codebuds.learningpal.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userRepository.findAll().stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return ResponseEntity.ok(UserDto.fromEntity(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @RequestBody UserDto updateDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (updateDto.getFullName() != null) {
            user.setFullName(updateDto.getFullName());
        }
        if (updateDto.getStatus() != null) {
            user.setStatus(updateDto.getStatus());
        }

        User updated = userRepository.save(user);
        return ResponseEntity.ok(UserDto.fromEntity(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
