package com.aps.vitalpair.nutrition.domain.port.in;

import com.aps.vitalpair.nutrition.domain.model.FoodProduct;

public interface FindFoodByBarcodeUseCase {

    FoodProduct findByBarcode(String barcode);
}
