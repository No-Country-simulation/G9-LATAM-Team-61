package com.g9_latam_team_61.backend.client;

public class MlServiceTimeoutException extends RuntimeException {
    public MlServiceTimeoutException(String mensaje) {
        super(mensaje);
    }
}
