package com.nmn.example.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import com.nmn.example.dto.request.CreateProductRequest;
import com.nmn.example.dto.response.ProductResponse;
import com.nmn.example.exception.ResourceNotFoundException;
import com.nmn.example.exception.ValidationException;
import com.nmn.example.mapper.ProductMapper;
import com.nmn.example.model.Product;
import com.nmn.example.repository.ProductRepository;
import com.nmn.example.service.impl.ProductServiceImpl;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@DisplayName("ProductService")
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

  @Mock private ProductRepository productRepository;
  @Mock private ProductMapper productMapper;

  @InjectMocks private ProductServiceImpl productService;

  @Nested
  @DisplayName("create")
  class Create {

    @Test
    @DisplayName("persists product when name is unique")
    void create_withUniqueName_persistsProduct() {
      CreateProductRequest request =
          new CreateProductRequest("Widget", "A fine widget", new BigDecimal("9.99"));
      Product entity = new Product("Widget", "A fine widget", new BigDecimal("9.99"));
      ProductResponse response =
          new ProductResponse(1L, "Widget", "A fine widget", new BigDecimal("9.99"), true, null, null);

      given(productRepository.existsByNameIgnoreCase("Widget")).willReturn(false);
      given(productMapper.toEntity(request)).willReturn(entity);
      given(productRepository.save(entity)).willReturn(entity);
      given(productMapper.toResponse(entity)).willReturn(response);

      ProductResponse result = productService.create(request);

      assertThat(result.id()).isEqualTo(1L);
      assertThat(result.name()).isEqualTo("Widget");
      then(productRepository).should().save(any(Product.class));
    }

    @Test
    @DisplayName("throws ValidationException when name already exists")
    void create_withDuplicateName_throwsValidationException() {
      CreateProductRequest request =
          new CreateProductRequest("Widget", "A fine widget", new BigDecimal("9.99"));

      given(productRepository.existsByNameIgnoreCase("Widget")).willReturn(true);

      assertThatThrownBy(() -> productService.create(request))
          .isInstanceOf(ValidationException.class)
          .hasMessageContaining("already exists");

      then(productRepository).shouldHaveNoMoreInteractions();
    }
  }

  @Nested
  @DisplayName("getById")
  class GetById {

    @Test
    @DisplayName("returns product when it exists")
    void getById_whenProductExists_returnsResponse() {
      Product product = new Product("Widget", "A fine widget", new BigDecimal("9.99"));
      ProductResponse response =
          new ProductResponse(1L, "Widget", "A fine widget", new BigDecimal("9.99"), true, null, null);

      given(productRepository.findById(1L)).willReturn(Optional.of(product));
      given(productMapper.toResponse(product)).willReturn(response);

      ProductResponse result = productService.getById(1L);

      assertThat(result.name()).isEqualTo("Widget");
    }

    @Test
    @DisplayName("throws ResourceNotFoundException when product does not exist")
    void getById_whenProductNotFound_throwsResourceNotFoundException() {
      given(productRepository.findById(99L)).willReturn(Optional.empty());

      assertThatThrownBy(() -> productService.getById(99L))
          .isInstanceOf(ResourceNotFoundException.class)
          .hasMessageContaining("99");
    }
  }
}
