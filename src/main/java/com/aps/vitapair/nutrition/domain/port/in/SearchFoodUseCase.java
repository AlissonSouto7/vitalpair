package com.aps.vitapair.nutrition.domain.port.in;

import com.aps.vitapair.nutrition.domain.model.FoodProduct;
import java.util.List;

public interface SearchFoodUseCase {

    List<FoodProduct> search(String query);
}
