package com.learningpal.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response payload returned upon successful signup or login.
 * For students: token is populated and user is ACTIVE.
 * For teachers during signup: token is null and message explains awaiting admin approval.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private String token;
    private UserDto user;
    private String message;

    public AuthResponse() {
    }

    public AuthResponse(String token, UserDto user, String message) {
        this.token = token;
        this.user = user;
        this.message = message;
    }

    public AuthResponse(String token, UserDto user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public UserDto getUser() {
        return user;
    }

    public void setUser(UserDto user) {
        this.user = user;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

