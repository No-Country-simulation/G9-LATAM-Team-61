package com.g9_latam_team_61.backend;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;

@Testcontainers
class PostgresMigrationIntegrationTest {

    @Container
    private static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("test_migrations_db")
            .withUsername("postgres")
            .withPassword("postgres");

    @BeforeAll
    static void checkDocker() {
        Assumptions.assumeTrue(
                DockerClientFactory.instance().isDockerAvailable(),
                "Docker no está disponible en el entorno local, se omite el test de contenedor PostgreSQL"
        );
    }

    private DataSource createDataSource(String jdbcUrl) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(postgres.getUsername());
        config.setPassword(postgres.getPassword());
        config.setDriverClassName("org.postgresql.Driver");
        return new HikariDataSource(config);
    }

    @Test
    void test1_debeAplicarMigracionesEnUnaBaseNueva() throws Exception {
        // 1. Crear base de datos limpia para la prueba de base nueva
        try (Connection rootConn = postgres.createConnection("");
             Statement stmt = rootConn.createStatement()) {
            stmt.execute("CREATE DATABASE db_nueva;");
        }

        String jdbcUrl = postgres.getJdbcUrl().replace("/test_migrations_db", "/db_nueva");
        DataSource dataSource = createDataSource(jdbcUrl);

        // 2. Ejecutar todas las migraciones de Flyway (V1 y V2) desde cero
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .load();

        MigrateResult result = flyway.migrate();
        assertTrue(result.success);
        assertEquals(2, result.migrationsExecuted);

        // 3. Validar existencia de tablas y nuevas columnas
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            ResultSet rsNotas = stmt.executeQuery("SELECT column_name FROM information_schema.columns WHERE table_name = 'notas';");
            java.util.Set<String> columnasNotas = new java.util.HashSet<>();
            while (rsNotas.next()) {
                columnasNotas.add(rsNotas.getString("column_name").toLowerCase());
            }
            assertTrue(columnasNotas.contains("id"));
            assertTrue(columnasNotas.contains("contenido_original"));
            assertTrue(columnasNotas.contains("categoria"));
            assertTrue(columnasNotas.contains("probabilidad"));
            assertTrue(columnasNotas.contains("fecha_analisis"));
            assertTrue(columnasNotas.contains("tiempo_procesamiento_ms"));
            assertTrue(columnasNotas.contains("cluster_id"));
            assertTrue(columnasNotas.contains("version_modelo"));
            assertTrue(columnasNotas.contains("feedback_usuario"));

            ResultSet rsClusters = stmt.executeQuery("SELECT column_name FROM information_schema.columns WHERE table_name = 'clusters';");
            assertTrue(rsClusters.next());
        }

        // 4. Validar con Hibernate ddl-auto=validate
        validarConHibernate(dataSource);
    }

    @Test
    void test2_debeEvolucionarBaseExistenteYPreservarDatos_conValidacionFinal() throws Exception {
        // 1. Crear base de datos para evolución
        try (Connection rootConn = postgres.createConnection("");
             Statement stmt = rootConn.createStatement()) {
            stmt.execute("CREATE DATABASE db_existente;");
        }

        String jdbcUrl = postgres.getJdbcUrl().replace("/test_migrations_db", "/db_existente");
        DataSource dataSource = createDataSource(jdbcUrl);

        // 2. Aplicar únicamente la versión 1 (simula la base de datos existente)
        Flyway flywayV1 = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .target(MigrationVersion.fromVersion("1"))
                .load();

        MigrateResult resultV1 = flywayV1.migrate();
        assertTrue(resultV1.success);
        assertEquals(1, resultV1.migrationsExecuted);

        // 3. Insertar datos existentes bajo el esquema V1
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("INSERT INTO notas (contenido_original, categoria, probabilidad) VALUES ('Nota previa de prueba', 'DevOps', 0.95);");
        }

        // 4. Ejecutar migración evolutiva a la versión final (V2)
        Flyway flywayFinal = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .load();

        MigrateResult resultFinal = flywayFinal.migrate();
        assertTrue(resultFinal.success);
        assertEquals(1, resultFinal.migrationsExecuted);

        // 5. Comprobar que los datos existentes se preservaron intactos
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            ResultSet rs = stmt.executeQuery("SELECT contenido_original, categoria, probabilidad, tiempo_procesamiento_ms, cluster_id FROM notas;");
            assertTrue(rs.next());
            assertEquals("Nota previa de prueba", rs.getString("contenido_original"));
            assertEquals("DevOps", rs.getString("categoria"));
            assertEquals(0.95, rs.getDouble("probabilidad"), 0.001);
            assertNull(rs.getObject("tiempo_procesamiento_ms"));
            assertNull(rs.getObject("cluster_id"));
        }

        // 6. Validación final con ddl-auto=validate
        validarConHibernate(dataSource);
    }

    private void validarConHibernate(DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean emf = new LocalContainerEntityManagerFactoryBean();
        emf.setDataSource(dataSource);
        emf.setPackagesToScan("com.g9_latam_team_61.backend.model");
        emf.setJpaVendorAdapter(new HibernateJpaVendorAdapter());

        Properties jpaProperties = new Properties();
        jpaProperties.put("hibernate.hbm2ddl.auto", "validate");
        jpaProperties.put("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
        emf.setJpaProperties(jpaProperties);

        emf.afterPropertiesSet();
        assertNotNull(emf.getObject());
        emf.destroy();
    }
}