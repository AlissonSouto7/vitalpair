package com.aps.vitalpair.nutrition.domain.port.in;

import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.nutrition.domain.model.FavoriteFood;

public interface GetFavoriteFoodsUseCase {

    List<FavoriteFood> getFavorites(UUID userId);
}
