FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q dependency:go-offline
COPY src src
RUN ./mvnw -q -DskipTests package && cp target/karaoke-api-*.jar app.jar

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system karaoke
COPY --from=build /app/app.jar app.jar
USER karaoke
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
