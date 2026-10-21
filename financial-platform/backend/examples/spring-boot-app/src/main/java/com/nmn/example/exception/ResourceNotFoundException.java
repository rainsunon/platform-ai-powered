package com.nmn.example.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends AppException {

  public ResourceNotFoundException(String resourceName, Object id) {
    super(resourceName + " not found with id: " + id, HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND");
  }
}
