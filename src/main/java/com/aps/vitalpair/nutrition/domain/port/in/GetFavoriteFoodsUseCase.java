package com.aps.vitalpair.nutrition.domain.port.in;

import com.aps.vitalpair.nutrition.domain.model.FavoriteFood;
import java.util.List;
import java.util.UUID;

public interface GetFavoriteFoodsUseCase {

    List<FavoriteFood> getFavorites(UUID userId);
}
