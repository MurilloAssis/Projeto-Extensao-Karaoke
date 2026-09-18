//package org.karaoke;
//
//import net.sf.log4jdbc.sql.jdbcapi.DataSourceSpy;
//import org.springframework.beans.factory.annotation.Autowired;
//// Import atualizado para o pacote correto no Spring Boot 2+
//import org.springframework.boot.jdbc.DataSourceBuilder;
//import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
//import org.springframework.boot.context.properties.ConfigurationProperties;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.context.annotation.Primary;
//
//import javax.sql.DataSource;
//
//@Configuration
//public class AppConfig {
//
//    @Autowired
//    DataSourceProperties dataSourceProperties;
//
//    @Bean
//    // Uso direto da string em vez da variável legada
//    @ConfigurationProperties(prefix = "spring.datasource")
//    DataSource realDataSource() {
//        return DataSourceBuilder
//                .create(this.dataSourceProperties.getClassLoader())
//                .url(this.dataSourceProperties.getUrl())
//                .username(this.dataSourceProperties.getUsername())
//                .password(this.dataSourceProperties.getPassword())
//                .build();
//    }
//
//    @Bean
//    @Primary
//    DataSource dataSource() {
//        return new DataSourceSpy(realDataSource());
//    }
//}