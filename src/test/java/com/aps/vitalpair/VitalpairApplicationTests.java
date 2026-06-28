package com.aps.vitalpair;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class VitalpairApplicationTests {

	@Test
	void contextLoads() {
	}

}
