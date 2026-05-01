FROM openjdk:17-jdk-slim

WORKDIR /app

COPY . .

RUN chmod +x mvnw
RUN ./mvnw clean package

CMD ["sh", "-c", "java -jar target/*.jar"]