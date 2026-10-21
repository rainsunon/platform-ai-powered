package io.rydata.platform.financing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class FinancingApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinancingApplication.class, args);
    }
}
