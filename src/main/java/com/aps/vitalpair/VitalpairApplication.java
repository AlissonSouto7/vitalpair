package com.aps.vitalpair;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
@EnableFeignClients(basePackages = "com.aps.vitalpair.mealvision.infrastructure.ai")
public class VitalpairApplication {

	public static void main(String[] args) {
		SpringApplication.run(VitalpairApplication.class, args);
	}

}
