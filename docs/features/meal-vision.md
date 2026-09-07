# Feature: meal vision (photo analysis)

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-06

## What it is and where it lives

Point the camera at a plate and get back the foods on it, each with an estimated
portion in grams and its macros. The person then edits what is wrong and logs it.

The feature is deliberately **stateless**: it analyses and answers, and stores
nothing. Logging is a separate call to `POST /api/v1/nutrition/logs`, so a bad
estimate costs a correction rather than a wrong row.

|                   |                                                         |
| ----------------- | ------------------------------------------------------- |
| Frontend route    | `/nutrition`, the photo tab                             |
| Who can access it | authenticated user                                      |
| Backend package   | `com.aps.vitalpair.mealvision` (27 classes, 620 lines)  |
| Feature flag      | none, but returns 503 when `ANTHROPIC_API_KEY` is blank |

## Architecture

| Layer                | Files                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Controller           | `mealvision/infrastructure/web/NutritionPhotoController.java`                                         |
| Request and response | `PhotoAnalysisRequest`, `PhotoAnalysisResponse`                                                       |
| Use case port        | `AnalyzeMealPhotoUseCase`                                                                             |
| Service              | `mealvision/application/service/MealVisionService.java`, a delegate                                   |
| Output port          | `MealPhotoAnalyzerPort`                                                                               |
| External client      | `AnthropicClient` (Feign), `AnthropicClientConfig`, `AnthropicMealPhotoAnalyzer`, `AnthropicMessages` |
| Exceptions           | `AiNotConfiguredException`, `MealPhotoAnalysisException`, `MealPhotoContentException`                 |
| Persistence          | **none**                                                                                              |
| Frontend             | the photo tab inside `NutritionPage.tsx`                                                              |
| i18n namespace       | `nutrition`                                                                                           |

### Endpoints

| Method | Path                      | Action                                   | Rate limit       |
| ------ | ------------------------- | ---------------------------------------- | ---------------- |
| POST   | `/api/v1/nutrition/photo` | Analyse an image, return the foods found | 20/hour per user |

It sits under the `nutrition` URL prefix although it lives in its own package,
because from the client's point of view it is part of logging a meal.

### The call to Anthropic

A separate Feign client from the plan one, with a shorter read timeout: 5s connect,
**30s read**, against 60s for a plan. `max_tokens` is 1024.

The image goes as an `image` content block with `source.type = "base64"`, followed
by the text prompt. Both prompts are static constants with **no interpolation at
all**: the only caller-supplied content is the image itself. A `json_schema` output
config forces the shape, with `additionalProperties: false` at both levels.

Parsing is forgiving where forgiveness is right and strict where it is not: an
absent or empty `items` array is an empty result rather than an error (a plate with
no food is a valid answer), a non-numeric macro becomes zero, but unparseable JSON
or a refusal is a failure.

### Data

None. The feature owns no table and no migration.

## Business rules

| #   | Rule                                                                     | Why                                                                                                       |
| --- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| R-1 | Nothing is persisted                                                     | The estimate is a suggestion. Storing it would create rows the person never confirmed                     |
| R-2 | `mediaType` must match `image/(jpeg                                      | png                                                                                                       | webp)` | Anything else is rejected by Anthropic anyway, and rejecting locally costs nothing while a rejected paid call costs a request |
| R-3 | The base64 body is capped at 5 MB decoded                                | See M-1. The cap is Anthropic's own limit, so a larger image cannot succeed regardless                    |
| R-4 | A refusal and an outage are different exceptions with different messages | The person can act on "try another photo of the plate"; they cannot act on "the service is down"          |
| R-5 | Neither content failure counts towards the circuit breaker               | Same reasoning as the plan feature: a model that answers unusably says nothing about the partner's health |
| R-6 | An empty result is a 200 with an empty list                              | A photo with no food in it is a correct answer, not a failure                                             |
| R-7 | 20 analyses an hour per user                                             | The concern is one account running up a bill. Twenty is far more than a person photographs in an hour     |

## Security findings

### Fixed

| ID  | Severity | File                   | What happened                                                                                                                                                                                                                               | Measured impact                                                                                                                                                                                                                     | Fix                                                                                                                                                                                                                                                                                                                                                          |
| --- | -------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M-1 | Medium   | `PhotoAnalysisRequest` | `imageBase64` carried `@NotBlank` and no size limit, and there is no `max-http-request-size` anywhere in `application.yaml`. A caller could send an arbitrarily large image, which became input tokens on a paid call, twenty times an hour | Bounded in production by the deploy nginx at `client_max_body_size 12m`, so the real ceiling was 12 MB per call rather than unlimited. The frontend does not resize either, so an ordinary phone photo was already being sent whole | `@Size(max = 5 MB decoded)` with a message the person can act on. `MealPhotoAnalysisIT.anOversizedPhotoIsRejectedWithoutSpendingAnything` asserts a 400 **and** that WireMock received nothing. Proved non-vacuous: removing the annotation turns it red with `expected: 400 but was: 502`, and the 502 is the proof the oversized body was reaching the API |
| M-2 | Medium   | no limit               | The endpoint had no rate limit while calling a paid API                                                                                                                                                                                     | Unbounded paid calls per account                                                                                                                                                                                                    | 20/hour per user in `RateLimitFilter`                                                                                                                                                                                                                                                                                                                        |
| M-3 | Medium   | shared with `ai`       | A model refusal counted as a partner failure and opened the shared breaker                                                                                                                                                                  | Refusals are common on photos of things that are not food                                                                                                                                                                           | `MealPhotoContentException` in `ignore-exceptions`                                                                                                                                                                                                                                                                                                           |

### Open

| ID  | Severity      | File                         | What happens                                                                                   | Measured impact                                                                                                                       | Why it is still open                                                                                                  |
| --- | ------------- | ---------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| M-4 | Low           | `NutritionPhotoController`   | The authenticated principal is injected and never used; the analysis carries no tenant context | Harmless while nothing is stored, and the rate limiter reads the principal from the security context rather than from here            | It becomes a real gap the day anything about the analysis is persisted. Recorded so that day is noticed               |
| M-5 | Low           | frontend `fileToImage`       | The image is read with `FileReader` and sent at full resolution; nothing downsizes it          | A modern phone photo is several megabytes, all of it billed as input tokens, when the model needs far less to identify rice and beans | Resizing on a canvas before upload would cut the bill materially. Worth doing; it is frontend work outside this phase |
| M-6 | Informational | `AnthropicMealPhotoAnalyzer` | Shares the `anthropic` circuit breaker with plan generation, so failures in one stop the other | Deliberate, and defensible: one partner. See A-9 in [ai-plans.md](ai-plans.md)                                                        | Config change if the failure modes ever diverge                                                                       |

### Verified and fine

| Check                                           | How it was verified                                                                                                   | Date       |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------- |
| The prompts contain no user input               | Both are `private static final String` constants; the only caller content is the image block. Read in full            | 2026-09-06 |
| The API key never reaches a log                 | Only `ex.getMessage()` is logged; the request URI passes through `LogSafe.value(...)`                                 | 2026-09-06 |
| A missing key fails before any HTTP call        | `AiNotConfiguredException` is thrown from the config check, giving 503                                                | 2026-09-06 |
| No image is stored anywhere                     | The package has no persistence layer, no entity, no migration, and no filesystem write. Confirmed by the file listing | 2026-09-06 |
| Unsupported types are rejected without spending | `anUnsupportedImageTypeIsRejectedWithoutSpendingAnything` asserts 400 and zero serve events                           | 2026-09-06 |
| The endpoint requires authentication            | `photoAnalysisRequiresAuthentication` asserts 401 and zero serve events                                               | 2026-09-06 |

## Tests

Until phase 13 this endpoint had **no test of any kind**, which mattered more than
the count suggests: it is a paid path, it takes a large body from the client, and it
goes out through a Feign proxy of the same shape that once failed at runtime with an
`IllegalAccessError` no unit test could see.

| Test                                                                   | Type        | Risk it covers                                                                                                              |
| ---------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `MealPhotoAnalysisIT.analysingAPhotoReturnsTheFoodsTheModelIdentified` | integration | The happy path, and that the image goes as an `image` block with the right media type and that the JSON schema is requested |
| `...anOversizedPhotoIsRejectedWithoutSpendingAnything`                 | integration | M-1, including that nothing reaches the paid API                                                                            |
| `...anImageJustUnderTheLimitIsAccepted`                                | integration | That the limit is not off by one                                                                                            |
| `...anUnsupportedImageTypeIsRejectedWithoutSpendingAnything`           | integration | R-2                                                                                                                         |
| `...aRefusalBecomesA502WithItsOwnMessage`                              | integration | R-4                                                                                                                         |
| `...anOverloadedApiBecomesA502NotA500`                                 | integration | A partner 529 is not an application bug                                                                                     |
| `...aPlateWithNoFoodIsAnEmptyListNotAnError`                           | integration | R-6                                                                                                                         |
| `...photoAnalysisRequiresAuthentication`                               | integration | The endpoint is not public                                                                                                  |

```bash
./mvnw verify -Dit.test=MealPhotoAnalysisIT
```

The fixture `src/test/resources/wiremock/__files/anthropic/meal-photo.json` is a
real Anthropic response, captured on 2026-09-06 by sending a picture of a plate to
the live API with the same prompt and schema the adapter sends.

### What is not covered

- **A real photograph.** The tests send a short base64 string and WireMock answers from a
  fixture, so nothing exercises actual image decoding or a real model estimate.
- **The read timeout.** The plan feature has a stalled-upstream test; this one does not.
- **The circuit breaker from this side.** `CircuitBreakerIT` only ever drives the plan path,
  so the shared breaker's effect on photo analysis is reasoned about, not measured.
- **The frontend photo tab.** No browser test drives the camera or the file picker.
- **Malformed base64.** A string that passes `@NotBlank` and `@Size` but is not valid base64
  is rejected by Anthropic, not locally, and no test covers it.

## How to verify in production

```bash
# read only: photo analyses by outcome
curl -s localhost:9090/actuator/prometheus | grep 'vitalpair_ai_requests_total.*meal-photo'

# read only: how long they take
curl -s localhost:9090/actuator/prometheus | grep 'vitalpair_ai_latency.*meal-photo'
```

There is no query for this feature: it stores nothing.

## Known debt

| Item                         | Impact                                              | When it is meant to be addressed                             |
| ---------------------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| M-5, no client-side resize   | Every analysis costs more than it needs to          | Frontend work, worth doing before the feature is charged for |
| No test for the read timeout | The behaviour on a stalled partner is untested here | Copy the plan feature's test                                 |
| Token usage is not recorded  | Spend per analysis is unknown                       | Shared with [ai-plans.md](ai-plans.md)                       |
| M-4, unused principal        | Misleading; a gap the day anything is stored        | Next touch                                                   |

## History

| Date       | Change                                                               | Pull request                                              |
| ---------- | -------------------------------------------------------------------- | --------------------------------------------------------- |
| 2026-09-05 | M-2 (rate limit) and M-3 (breaker) (phases 5 and 8)                  | `fix/security-hardening`, `feat/observability-resilience` |
| 2026-09-06 | M-1 fixed, first tests for the endpoint, document created (phase 13) | `docs/professional-docs`                                  |
