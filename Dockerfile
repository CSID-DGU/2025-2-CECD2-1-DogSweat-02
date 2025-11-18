# --- 1. Builder Stage (빌드 과정) ---
# JDK 17이 포함된 Gradle 이미지를 기반으로 빌드를 수행합니다.
FROM gradle:8.5-jdk17 AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 캐싱을 위해 build.gradle과 settings.gradle을 먼저 복사
COPY build.gradle settings.gradle ./

# 소스 코드 복사
COPY src ./src

# Gradle 빌드 실행 (테스트는 배포 시 제외하는 경우가 많으나, 필요하면 -x test 제거)
# bootJar 태스크를 실행하여 실행 가능한 jar 파일을 생성합니다.
RUN gradle bootJar -x test --no-daemon

# --- 2. Runtime Stage (실행 과정) ---
# 실행을 위한 가벼운 JRE 17 이미지를 사용합니다.
FROM eclipse-temurin:17-jre-alpine

# 작업 디렉토리 설정
WORKDIR /app

# Builder 스테이지에서 생성된 jar 파일만 복사해옵니다.
# build/libs/*.jar 경로의 파일을 app.jar라는 이름으로 복사합니다.
COPY --from=builder /app/build/libs/*.jar app.jar

# 공유 스토리지 마운트 포인트를 미리 생성해둡니다 (권한 문제 방지)
RUN mkdir -p /app/media

# 환경 변수 설정을 통해 'prod' 프로필을 기본값으로 사용하도록 설정할 수 있습니다.
# (docker-compose에서 덮어쓸 수 있음)
ENV SPRING_PROFILES_ACTIVE=prod

# 8080 포트 노출
EXPOSE 8080

# 애플리케이션 실행 명령어
ENTRYPOINT ["java", "-jar", "app.jar"]