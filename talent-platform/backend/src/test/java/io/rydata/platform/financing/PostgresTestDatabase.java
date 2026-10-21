package io.rydata.platform.financing;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.springframework.test.context.DynamicPropertyRegistry;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

final class PostgresTestDatabase {

    private static final EmbeddedPostgres POSTGRES = start();

    private PostgresTestDatabase() {
    }

    static void register(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> POSTGRES.getJdbcUrl("financing", "financing"));
        registry.add("spring.datasource.username", () -> "financing");
        registry.add("spring.datasource.password", () -> "financing");
    }

    private static EmbeddedPostgres start() {
        try {
            EmbeddedPostgres postgres = EmbeddedPostgres.builder().start();
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                try {
                    postgres.close();
                } catch (IOException ignored) {
                    // The test JVM is already exiting.
                }
            }));
            try (Connection connection = DriverManager.getConnection(postgres.getJdbcUrl("postgres", "postgres"));
                 Statement statement = connection.createStatement()) {
                statement.execute("""
                        create role financing
                            with login password 'financing'
                            nosuperuser nocreatedb nocreaterole
                        """);
                statement.execute("create database financing owner financing");
            }
            try (Connection connection = DriverManager.getConnection(postgres.getJdbcUrl("postgres", "financing"));
                 Statement statement = connection.createStatement()) {
                statement.execute("alter schema public owner to financing");
                statement.execute("revoke all on schema public from public");
                statement.execute("grant usage, create on schema public to financing");
            }
            return postgres;
        } catch (Exception exception) {
            throw new IllegalStateException("Embedded PostgreSQL failed to start", exception);
        }
    }
}
