package com.aps.vitalpair.nutrition.domain.port.out;

import com.aps.vitalpair.nutrition.domain.model.FoodProduct;
import java.util.List;
import java.util.Optional;

public interface OpenFoodFactsPort {

    List<FoodProduct> searchByName(String query);

    Optional<FoodProduct> findByBarcode(String barcode);
}
