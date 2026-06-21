package com.aps.vitapair.nutrition.domain.port.in;

import com.aps.vitapair.nutrition.domain.model.FoodProduct;

public interface FindFoodByBarcodeUseCase {

    FoodProduct findByBarcode(String barcode);
}
