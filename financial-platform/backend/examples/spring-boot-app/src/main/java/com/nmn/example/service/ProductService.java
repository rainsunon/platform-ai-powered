package com.nmn.example.service;

import com.nmn.example.dto.request.CreateProductRequest;
import com.nmn.example.dto.request.UpdateProductRequest;
import com.nmn.example.dto.response.ProductResponse;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** Manages product catalogue operations. */
public interface ProductService {

  /**
   * Creates a new product.
   *
   * @param request validated creation payload
   * @return the persisted product
   * @throws com.nmn.example.exception.ValidationException if name already exists
   */
  ProductResponse create(CreateProductRequest request);

  /**
   * Retrieves a product by its ID.
   *
   * @param id product identifier
   * @return the matching product
   * @throws com.nmn.example.exception.ResourceNotFoundException if not found
   */
  ProductResponse getById(Long id);

  /**
   * Searches active products with optional filtering.
   *
   * @param name optional name substring filter (case-insensitive)
   * @param maxPrice optional maximum price filter
   * @param pageable pagination and sorting parameters
   * @return page of matching products
   */
  Page<ProductResponse> search(String name, BigDecimal maxPrice, Pageable pageable);

  /**
   * Updates an existing product.
   *
   * @param id product identifier
   * @param request validated update payload
   * @return the updated product
   * @throws com.nmn.example.exception.ResourceNotFoundException if not found
   */
  ProductResponse update(Long id, UpdateProductRequest request);

  /**
   * Deletes a product by ID (soft delete — sets active = false).
   *
   * @param id product identifier
   * @throws com.nmn.example.exception.ResourceNotFoundException if not found
   */
  void delete(Long id);
}
