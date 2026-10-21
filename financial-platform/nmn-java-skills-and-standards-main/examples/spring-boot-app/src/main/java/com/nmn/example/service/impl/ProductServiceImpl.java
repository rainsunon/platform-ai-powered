package com.nmn.example.service.impl;

import com.nmn.example.dto.request.CreateProductRequest;
import com.nmn.example.dto.request.UpdateProductRequest;
import com.nmn.example.dto.response.ProductResponse;
import com.nmn.example.exception.ResourceNotFoundException;
import com.nmn.example.exception.ValidationException;
import com.nmn.example.mapper.ProductMapper;
import com.nmn.example.model.Product;
import com.nmn.example.repository.ProductRepository;
import com.nmn.example.service.ProductService;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

  private final ProductRepository productRepository;
  private final ProductMapper productMapper;

  @Override
  @Transactional
  public ProductResponse create(CreateProductRequest request) {
    if (productRepository.existsByNameIgnoreCase(request.name())) {
      throw new ValidationException("name", "A product with this name already exists");
    }
    Product product = productMapper.toEntity(request);
    Product saved = productRepository.save(product);
    log.info("Created product id={} name={}", saved.getId(), saved.getName());
    return productMapper.toResponse(saved);
  }

  @Override
  @Transactional(readOnly = true)
  public ProductResponse getById(Long id) {
    return productRepository
        .findById(id)
        .map(productMapper::toResponse)
        .orElseThrow(() -> new ResourceNotFoundException("Product", id));
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ProductResponse> search(String name, BigDecimal maxPrice, Pageable pageable) {
    return productRepository.search(name, maxPrice, pageable).map(productMapper::toResponse);
  }

  @Override
  @Transactional
  public ProductResponse update(Long id, UpdateProductRequest request) {
    Product product =
        productRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    productMapper.updateEntity(request, product);
    log.info("Updated product id={}", id);
    return productMapper.toResponse(product);
  }

  @Override
  @Transactional
  public void delete(Long id) {
    Product product =
        productRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    product.setActive(false);
    log.info("Soft-deleted product id={}", id);
  }
}
