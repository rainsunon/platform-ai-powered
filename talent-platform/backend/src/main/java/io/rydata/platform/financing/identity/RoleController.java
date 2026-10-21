package io.rydata.platform.financing.identity;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roles")
public class RoleController {

    private final RoleCatalog roleCatalog;

    public RoleController(RoleCatalog roleCatalog) {
        this.roleCatalog = roleCatalog;
    }

    @GetMapping
    public List<RoleResponse> list() {
        return roleCatalog.all();
    }

    @GetMapping("/{key}")
    public RoleResponse get(@PathVariable String key) {
        return roleCatalog.get(key);
    }
}
