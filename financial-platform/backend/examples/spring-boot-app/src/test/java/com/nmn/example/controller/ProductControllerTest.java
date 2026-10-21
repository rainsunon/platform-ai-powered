package com.nmn.example.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.nmn.example.dto.response.ProductResponse;
import com.nmn.example.exception.GlobalExceptionHandler;
import com.nmn.example.exception.ResourceNotFoundException;
import com.nmn.example.service.ProductService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ProductController.class)
@Import(GlobalExceptionHandler.class)
class ProductControllerTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @MockBean private ProductService productService;

  @Test
  @DisplayName("returns 200 with product body when product exists")
  @WithMockUser
  void getById_whenProductExists_returns200() throws Exception {
    ProductResponse response =
        new ProductResponse(1L, "Widget", "A fine widget", new BigDecimal("9.99"), true, null, null);
    given(productService.getById(1L)).willReturn(response);

    mockMvc
        .perform(get("/api/v1/products/1").contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(1))
        .andExpect(jsonPath("$.name").value("Widget"))
        .andExpect(jsonPath("$.price").value(9.99));
  }

  @Test
  @DisplayName("returns 404 when product does not exist")
  @WithMockUser
  void getById_whenProductNotFound_returns404() throws Exception {
    given(productService.getById(99L)).willThrow(new ResourceNotFoundException("Product", 99L));

    mockMvc
        .perform(get("/api/v1/products/99"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"));
  }

  @Test
  @DisplayName("returns 422 when request body is invalid")
  @WithMockUser(roles = "ADMIN")
  void create_withInvalidBody_returns422() throws Exception {
    String body =
        """
        { "name": "", "description": "desc", "price": -1 }
        """;

    mockMvc
        .perform(
            post("/api/v1/products").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
  }

  @Test
  @DisplayName("returns 201 when product is created successfully")
  @WithMockUser(roles = "ADMIN")
  void create_withValidBody_returns201() throws Exception {
    ProductResponse response =
        new ProductResponse(1L, "Widget", "A fine widget", new BigDecimal("9.99"), true, null, null);
    given(productService.create(any())).willReturn(response);

    String body =
        """
        { "name": "Widget", "description": "A fine widget", "price": "9.99" }
        """;

    mockMvc
        .perform(
            post("/api/v1/products").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").value(1))
        .andExpect(header().exists("Location"));
  }

  @Test
  @DisplayName("returns 403 when user lacks ADMIN role")
  @WithMockUser(roles = "USER")
  void create_withoutAdminRole_returns403() throws Exception {
    String body =
        """
        { "name": "Widget", "description": "A fine widget", "price": "9.99" }
        """;

    mockMvc
        .perform(
            post("/api/v1/products").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isForbidden());
  }
}
