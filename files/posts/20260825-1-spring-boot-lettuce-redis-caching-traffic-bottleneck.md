---
category: "Tech & Dev"
title: "[트러블슈팅] 트래픽 급증 시 DB 병목 해결기: Spring Boot + Lettuce Redis 캐싱"
date: "2026-08-25"
image: "/images/lettuce_redis_caching_db_bottleneck_thumbnail.png"
tags: ["Spring Boot", "Redis", "Lettuce", "Troubleshooting", "PostgreSQL", "Database", "Performance Tuning", "Backend Architecture"]
---

## 💥 1. 발단: 마케팅 광고, 그리고 갑작스러운 DB 장애

서비스 활성화를 위해 마케팅 프로모션과 광고를 시작했습니다. 광고가 시작되자 평소보다 <strong>더 많은 유입 트래픽</strong>이 메인 홈 화면으로 집중되었습니다.

하지만 유입 트래픽이 늘어나자 백엔드 모니터링 대시보드에 경고등이 켜지며 <strong>데이터베이스(PostgreSQL)가 버티지 못하고 뻗어버리는 심각한 장애</strong>가 발생했습니다.

### 📱 메인 화면의 다중 조회 API 호출 구조
메인 홈 화면은 사용자에게 다양한 정보를 한 번에 보여주기 위해 화면 1개가 로딩될 때 다음과 같이 여러 개의 조회 API를 동시에 호출하고 있었습니다:

1. <strong>상단 배너 및 공지사항 조회 API</strong> (`/api/v1/main/banners`)
2. <strong>실시간 인기 상품 TOP 10 조회 API</strong> (`/api/v1/main/popular-products`)
3. <strong>추천 카테고리 및 기획전 목록 조회 API</strong> (`/api/v1/main/promotions`)

사용자 1명이 메인 화면에 접속할 때마다 최소 <strong>3\~4개의 조회 API</strong>가 동시에 데이터베이스로 요청을 보냈고, 동시 접속자가 몰리자 다음과 같은 연쇄 병목이 일어났습니다.

```text
[ 트래픽 증가 시 발생한 연쇄 장애 메커니즘 ]
1. 유저 동시 유입 ➔ 초당 수만 건의 다중 조회 요청 발생
2. Spring Boot ➔ PostgreSQL 간 HikariCP Connection Pool (기본 10개) 0.1초 만에 완전 고갈
3. 스레드들이 커넥션을 얻지 못해 무한 대기 (ConnectionTimeoutException 발생)
4. 복잡한 다중 연산 및 집계 쿼리로 DB CPU 점유율 100% 도달
5. 메인 화면뿐만 아니라 동일 DB를 공유하는 '결제/주문/로그인' 기능까지 전면 마비! 🚨
```

---

## 🔍 2. 원인 분석: DB 쿼리와 서비스 레이어의 병목 지점

장애 원인을 정밀 프로파일링(APM)해 본 결과, 데이터베이스 자체의 부하뿐만 아니라 <strong>"DB 쿼리 시간은 짧지만 서비스 레이어에서 시간을 과도하게 잡아먹는 구조적 문제"</strong>가 함께 발견되었습니다.

### ⚠️ 병목 1: 불필요한 반복 쿼리 (준 정적 데이터)
* 상단 배너, 공지사항, 기획전 카테고리는 모든 사용자에게 99.9% 동일하게 보이는 <strong>준(準) 정적 데이터</strong>입니다.
* 데이터가 거의 바뀌지 않음에도 불구하고, 매 요청마다 디스크 I/O를 일으키며 PostgreSQL로 직접 쿼리를 날리고 있었습니다.

### ⚠️ 병목 2: DB 쿼리는 짧은데, 서비스 로직에서 시간을 잡아먹는 현상
실무에서 자주 발생하는 대표적인 서비스 레이어 병목 패턴들입니다:

1. <strong>대용량 엔티티 순회 및 복잡한 DTO 가공 비용 (CPU 부하)</strong>:
   - DB에서 원시 데이터를 읽어오는 SELECT 쿼리 자체는 인덱스를 타고 5\~10ms 만에 끝나지만, 서비스 레이어에서 수십\~수백 개의 연관 엔티티(`List<ProductDetail>`, 옵션, 태그)를 루프를 돌며 Java DTO로 변환·조합하고 할인율 및 회원 등급별 혜택을 계산하느라 애플리케이션 CPU를 과도하게 소모했습니다.
2. <strong>외부 서드파티 API 동기(Sync) 호출 지연 (스레드 블로킹)</strong>:
   - 상품 기본 정보는 DB에서 빠르게 가져왔지만, 상품별 실시간 배송비 조회나 외부 물류/쿠폰 연동 API를 동기적으로 호출하면서 응답 대기 시간 동안 톰캣(Tomcat) 스레드가 커넥션을 물고 놓아주지 않는 현상이 발생했습니다.
3. <strong>대량 객체 생성에 따른 GC(Garbage Collection) 지연</strong>:
   - 매 요청마다 무거운 복합 DTO 객체를 대량으로 생성하고 JSON으로 직렬화하는 과정에서 힙 메모리 압박이 심해져 Stop-The-World(STW) 지연이 누적되었습니다.

### 📐 아키텍처 개선 방향: Look-Aside 캐싱 도입
데이터베이스 앞단에 초고속 인메모리 저장소인 <strong>Redis</strong>를 배치하고, <strong>Look-Aside (Cache-Aside)</strong> 패턴을 적용하여 DB 도달 트래픽을 차단함과 동시에 <strong>무거운 서비스 레이어 가공 연산 자체를 건너뛰기로</strong> 결정했습니다.

```mermaid
graph LR
    Client([클라이언트 유입]) --> App[Spring Boot Application]
    App -->|1. 캐시 조회| Redis[(Redis 인메모리 캐시)]
    Redis -.->|2-A. Cache Hit 98.4%| App
    App -.->|2-B. Cache Miss 시에만 접근| DB[(PostgreSQL Database)]
    DB -.->|3. 캐시 저장| Redis
```

---

## 🛠️ 3. 해결 과정: Lettuce 기반 Redis 캐시 도입과 실무 코드

### 1) 왜 Jedis 대신 Lettuce인가?
Spring Boot의 Redis 클라이언트로는 과거에 널리 쓰이던 `Jedis`와 현재 기본 표준인 `Lettuce`가 있습니다. 대용량 동시성 환경에서는 <strong>Lettuce가 압도적으로 유리</strong>합니다.

| 비교 항목 | Jedis | Lettuce (선택 ✅) |
| :--- | :--- | :--- |
| <strong>동작 방식</strong> | 동기식 / 블로킹 I/O | <strong>비동기 / 논블로킹 I/O (Netty 기반)</strong> |
| <strong>커넥션 관리</strong> | 스레드마다 커넥션 1:1 필요 (`JedisPool` 관리 비용 큼) | <strong>다중 스레드가 단일 커넥션 채널을 공유 (Multiplexing)</strong> |
| <strong>동시성 처리</strong> | 동시 요청 증가 시 커넥션 풀 고갈 위험 | <strong>적은 리소스로 수많은 동시 요청 가볍게 처리</strong> |
| <strong>스레드 안정성</strong> | Thread-Safe 하지 않음 | <strong>완벽한 Thread-Safe 지원</strong> |

---

### 2) Redis & CacheManager 설정 (`RedisConfig.java`)
데이터의 비즈니스 성격에 따라 만료 시간(TTL)을 세밀하게 분기하고, 객체 직렬화 포맷을 지정했습니다.

```java
package com.example.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public RedisConnectionFactory redisConnectionFactory(
            @Value("${spring.data.redis.host:localhost}") String host,
            @Value("${spring.data.redis.port:6379}") int port) {
        return new LettuceConnectionFactory(host, port);
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // 1. 기본 캐시 정책: JSON 직렬화 적용 및 null 값 캐싱 방지
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));

        // 2. 데이터 성격별 TTL 커스텀 설정
        Map<String, RedisCacheConfiguration> customConfigs = new HashMap<>();
        
        // 배너/기획전: 수정이 드문 데이터이므로 1시간 캐싱 (DB 부하 0)
        customConfigs.put("mainBanners", defaultConfig.entryTtl(Duration.ofHours(1)));
        customConfigs.put("mainPromotions", defaultConfig.entryTtl(Duration.ofHours(1)));
        
        // 실시간 인기 랭킹: 정합성을 고려하여 1분 주기로 갱신
        customConfigs.put("popularProducts", defaultConfig.entryTtl(Duration.ofMinutes(1)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(customConfigs)
                .build();
    }
}
```

---

### 3) 서비스 계층에 `@Cacheable` 적용 (`MainDisplayService.java`)
Spring의 캐시 추상화 어노테이션을 활용하여, <strong>DB 조회뿐만 아니라 무거운 DTO 변환 및 서비스 가공 로직 전체를 캐싱 결과로 즉시 대체</strong>했습니다.

```java
package com.example.service;

import com.example.dto.BannerDto;
import com.example.dto.ProductSummaryDto;
import com.example.repository.BannerRepository;
import com.example.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MainDisplayService {

    private final BannerRepository bannerRepository;
    private final ProductRepository productRepository;

    // 배너 조회: 1시간 동안 Redis 인메모리에서 즉각 반환 (DB I/O 및 DTO 변환 연산 발생 안 함)
    @Cacheable(value = "mainBanners", key = "'active'", unless = "#result == null || #result.isEmpty()")
    public List<BannerDto> getActiveBanners() {
        return bannerRepository.findAllActiveBanners()
                .stream()
                .map(BannerDto::from)
                .toList();
    }

    // 인기 상품 TOP 10: 1분간 캐싱되어 서비스 계층의 복잡한 혜택 계산 및 랭킹 정렬 로직 완전 스킵
    @Cacheable(value = "popularProducts", key = "'top10'", unless = "#result == null || #result.isEmpty()")
    public List<ProductSummaryDto> getPopularProducts() {
        return productRepository.findTop10BySales()
                .stream()
                .map(ProductSummaryDto::from)
                .toList();
    }
}
```

---

### 4) 실무 운영을 위한 필수 Lettuce 타임아웃 튜닝
실무 환경에서는 Redis 자체가 일시적인 네트워크 지연이나 장애를 겪을 때, <strong>백엔드 애플리케이션 스레드가 응답을 기다리며 줄줄이 블로킹되는 2차 대형 사고</strong>를 반드시 방지해야 합니다. 이를 위해 커넥션 및 커맨드 타임아웃을 명시적으로 제한했습니다.

```java
package com.example.config;

import io.lettuce.core.ClientOptions;
import io.lettuce.core.SocketOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;

import java.time.Duration;

@Configuration
public class LettuceTuningConfig {

    @Bean
    public LettuceConnectionFactory tunedLettuceConnectionFactory() {
        // 1. 소켓 연결 타임아웃 (0.5초)
        SocketOptions socketOptions = SocketOptions.builder()
                .connectTimeout(Duration.ofMillis(500))
                .build();

        ClientOptions clientOptions = ClientOptions.builder()
                .socketOptions(socketOptions)
                .autoReconnect(true)
                .build();

        // 2. 명령어 실행 타임아웃 (1초 초과 시 빠른 Fail-Fast 처리)
        LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
                .clientOptions(clientOptions)
                .commandTimeout(Duration.ofMillis(1000))
                .build();

        RedisStandaloneConfiguration serverConfig = new RedisStandaloneConfiguration("10.0.1.50", 6379);
        return new LettuceConnectionFactory(serverConfig, clientConfig);
    }
}
```

---

## 📊 4. 개선 결과 및 효과

캐싱 아키텍처 적용 후 부하 테스트 및 실제 마케팅 라이브 트래픽 유입 시 측정한 지표 비교입니다:

| 지표 항목 | 캐싱 적용 전 (장애 상황) | 캐싱 적용 후 (안정화) | 개선 효과 |
| :--- | :--- | :--- | :--- |
| <strong>DB CPU 사용률</strong> | <strong>95%\~100% (포화 다운)</strong> | <strong>15%\~20% (극도로 안정)</strong> | <strong>부하 약 80% 감소</strong> |
| <strong>HikariCP 커넥션 대기</strong> | `ConnectionTimeout` 빈번 발생 | <strong>대기 스레드 0건</strong> | <strong>병목 완벽 해소</strong> |
| <strong>API 평균 응답 속도</strong> | <strong>850ms \~ 3,000ms+</strong> | <strong>12ms \~ 25ms</strong> | <strong>응답 속도 97% 단축</strong> |
| <strong>Cache Hit Ratio</strong> | 0% (매번 DB/서비스 직격) | <strong>98.4%</strong> | <strong>대부분 인메모리 처리</strong> |

광고로 인해 많은 사용자가 유입되었음에도, 메인 홈 화면 조회의 <strong>98% 이상이 Redis 인메모리에서 0.01초 만에 응답</strong>되면서 PostgreSQL 데이터베이스는 결제나 회원 가입 같은 실제 쓰기(Write) 트랜잭션 처리에만 온전히 리소스를 집중할 수 있게 되었습니다.

---

## 💡 5. 12세 청소년도 쉽게 이해하는 비유 (ELI12)

> <strong>"손님이 올 때마다 주방장(서비스 로직)이 복잡한 요리(DTO 가공)를 처음부터 다시 만들던 것을, 완성된 도시락(Redis 캐시)으로 해결한 것입니다!"</strong>
>
> - 예전에는 손님이 많이 오면 재료 창고(PostgreSQL)도 붐비고 주방장도 요리하느라 쓰러졌습니다.
> - 이제는 똑똑한 조수(Lettuce)가 미리 완성된 인기 도시락을 <strong>선반(Redis)</strong>에 올려두고 손님에게 바로 건네주니, 주방장도 창고도 여유롭고 손님도 기다리지 않게 되었습니다!

---

## 🎯 6. 마치며: 배운 점과 다음 스텝

### 💡 실무 교훈
1. <strong>캐싱은 DB뿐만 아니라 서비스 계층의 연산 비용도 줄여준다</strong>:
   - 캐싱은 단순히 SQL 쿼리 수를 줄이는 것에 그치지 않고, 매 요청마다 반복되던 <strong>무거운 DTO 변환, 객체 할당(GC 압박), 비즈니스 가공 연산 전체를 건너뛰게 해주는 강력한 최적화 수단</strong>입니다.
2. <strong>Lettuce의 비동기 커넥션 공유 특성</strong>:
   - 커넥션 풀을 무작정 늘리지 않고도 단일 커넥션의 Netty 이벤트 루프를 통해 많은 동시 요청을 가볍게 소화할 수 있었습니다.

### 🚀 추가 고도화 고민 (Next Step)
* <strong>Cache Stampede (캐시 스탬피드) 방어</strong>:
   - 인기 상품 캐시(TTL 1분)가 만료되는 순간 많은 요청이 일시에 DB로 쏟아지는 현상을 방지하기 위해, 만료 시간에 <strong>랜덤 지터(Random Jitter)</strong>를 부여하거나 <strong>Redisson 분산 락</strong>을 활용한 단일 스레드 갱신 구조를 추가 적용할 예정입니다.
* <strong>Redis 장애 시 Circuit Breaker</strong>:
   - 캐시 서버가 다운되더라도 메인 애플리케이션이 멈추지 않고 안전하게 Fallback 정적 데이터를 반환할 수 있도록 Resilience4j 기반의 서킷 브레이커 연동을 준비하고 있습니다.
