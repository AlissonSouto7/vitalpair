package com.aps.vitalpair.nutrition.domain.port.in;

import com.aps.vitalpair.nutrition.domain.model.FoodProduct;
import java.util.List;

public interface SearchFoodUseCase {

    List<FoodProduct> search(String query);
}
