package com.g9_latam_team_61.backend.client;

import org.springframework.http.HttpStatusCode;

public class MlValidationException extends RuntimeException {
    private final HttpStatusCode statusCode;

    public MlValidationException(String message) {
        super(message);
        this.statusCode = null;
    }

    public MlValidationException(String message, HttpStatusCode statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public HttpStatusCode getStatusCode() {
        return statusCode;
    }
}
