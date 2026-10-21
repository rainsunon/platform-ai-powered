package io.rydata.platform.financing.config;

import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class FinancingGraphqlController {

    @QueryMapping
    public String apiName() {
        return "financing";
    }
}
