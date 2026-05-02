FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY . .

RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

CMD ["sh", "-c", "java -Dspring.data.mongodb.uri=${SPRING_DATA_MONGODB_URI} -Dspring.mongodb.uri=${SPRING_DATA_MONGODB_URI} -Dserver.port=${PORT} -jar target/*.jar"]