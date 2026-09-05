package com.aps.vitalpair.nutrition.domain.port.out;

import java.util.List;
import java.util.Optional;

import com.aps.vitalpair.nutrition.domain.model.FoodProduct;

public interface OpenFoodFactsPort {

    List<FoodProduct> searchByName(String query);

    Optional<FoodProduct> findByBarcode(String barcode);
}
