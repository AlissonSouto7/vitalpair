package com.aps.vitalpair.nutrition.domain.port.in;

import java.util.List;

import com.aps.vitalpair.nutrition.domain.model.FoodProduct;

public interface SearchFoodUseCase {

    List<FoodProduct> search(String query);
}
