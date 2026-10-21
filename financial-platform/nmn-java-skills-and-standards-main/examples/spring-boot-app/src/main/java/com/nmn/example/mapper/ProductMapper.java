package com.nmn.example.mapper;

import com.nmn.example.dto.request.CreateProductRequest;
import com.nmn.example.dto.request.UpdateProductRequest;
import com.nmn.example.dto.response.ProductResponse;
import com.nmn.example.model.Product;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ProductMapper {

  Product toEntity(CreateProductRequest request);

  ProductResponse toResponse(Product product);

  void updateEntity(UpdateProductRequest request, @MappingTarget Product product);
}
