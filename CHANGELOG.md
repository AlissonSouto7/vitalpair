# Changelog

## [0.4.0](https://github.com/AlissonSouto7/vitalpair/compare/v0.3.0...v0.4.0) (2026-09-07)


### Features

* **ai:** weekly meal and workout plans generated with Anthropic ([f899d8d](https://github.com/AlissonSouto7/vitalpair/commit/f899d8d27ce39c44a2d075709956dc614da335e3))
* **auth:** move refresh token to an HttpOnly cookie, detect theft, a… ([e4fed06](https://github.com/AlissonSouto7/vitalpair/commit/e4fed064ed48dbc28022874ee176f91eadf39fdd))
* **auth:** move refresh token to an HttpOnly cookie, detect theft, add roles ([b7f7501](https://github.com/AlissonSouto7/vitalpair/commit/b7f7501999906f8c9111407e62189de1c11c2fea))
* **season:** expose stake on season history rows ([457966c](https://github.com/AlissonSouto7/vitalpair/commit/457966cb0291f94c3866116177b97436bc7bf491))
* **shared:** add request correlation, metrics and resilience ([6082266](https://github.com/AlissonSouto7/vitalpair/commit/6082266806cdb8a508212363f8090d4fc95a1880))
* **shared:** add request correlation, metrics and resilience ([85ad47b](https://github.com/AlissonSouto7/vitalpair/commit/85ad47b1c3ad0446fa275c626237ffc59a14e3ea))


### Bug fixes

* **ai:** make Anthropic message DTOs public so Feign can call them ([febf6ef](https://github.com/AlissonSouto7/vitalpair/commit/febf6efce23da4f1b0ea317163582b7d1a529839))
* **auth:** stop logging password reset and verification links ([9591a66](https://github.com/AlissonSouto7/vitalpair/commit/9591a665ca97c8c4a1677a9be8867dfa587c5aec))
* **ci:** make mvnw executable so the build can run on Linux ([a254c32](https://github.com/AlissonSouto7/vitalpair/commit/a254c326f851e97887168fff8e04a39cb314298f))
* **ci:** make mvnw executable so the build can run on Linux ([eebf614](https://github.com/AlissonSouto7/vitalpair/commit/eebf614418d562c2f401225e1ebc99ec2d17c5f5))
* **frontend:** give every form control an accessible name ([9faf7cf](https://github.com/AlissonSouto7/vitalpair/commit/9faf7cfb2b193bcda21a86f3b2fc8ce0687a8154))
* **security:** answer 400 for unreadable bodies, split CORS origins, … ([b9f29a3](https://github.com/AlissonSouto7/vitalpair/commit/b9f29a32ca8b74b6fb658523b234365bd2767065))
* **security:** answer 400 for unreadable bodies, split CORS origins, proxy the API in dev ([1ca0ef7](https://github.com/AlissonSouto7/vitalpair/commit/1ca0ef7dfdef74bbae61d38716c4b61c2e7dce47))
* **security:** rate limit auth and AI endpoints, harden secrets and t… ([b5830be](https://github.com/AlissonSouto7/vitalpair/commit/b5830be25c5d12e08754bf74a10c1e94469181fb))
* **security:** rate limit auth and AI endpoints, harden secrets and timeouts ([b89ed58](https://github.com/AlissonSouto7/vitalpair/commit/b89ed589dc29fe12b85fe53dfacb7e2791d6e333))


### Refactoring

* **frontend:** split code per route and centralise data and errors ([019939c](https://github.com/AlissonSouto7/vitalpair/commit/019939cbb929a81fa27b7aa148494729f766af28))
* **frontend:** split code per route and centralise data and errors ([dce3294](https://github.com/AlissonSouto7/vitalpair/commit/dce329412599969d88380121d2b203ecf152f718))


### Build and dependencies

* add Checkstyle for the defects a formatter cannot see ([0f83ef4](https://github.com/AlissonSouto7/vitalpair/commit/0f83ef41ea5c84f9ee28121006cc2e0f6d07eb50))
* add coverage measurement and architecture tests ([306f8db](https://github.com/AlissonSouto7/vitalpair/commit/306f8db42f3efc953adf0644bd6bf20e4775c46c))
* add the frontend reformatting commit to .git-blame-ignore-revs ([83576a2](https://github.com/AlissonSouto7/vitalpair/commit/83576a277fd2c66fad3d1cb7734cc87265e7af02))
* enforce Java formatting with Spotless and palantir-java-format ([544e502](https://github.com/AlissonSouto7/vitalpair/commit/544e502790b62c12244f6692ffd025d204b2cd00))
* **frontend:** add formatting, git hooks, tests and a CI job ([29e1ebe](https://github.com/AlissonSouto7/vitalpair/commit/29e1ebe2c091abaa8b4e44cd7664a1e11d120837))
* **infra:** build the deployment stack, replacing the inherited one ([3c0c556](https://github.com/AlissonSouto7/vitalpair/commit/3c0c55660bcd84053bdc6994af472742a10e386f))
* **infra:** build the deployment stack, replacing the inherited one ([49f6443](https://github.com/AlissonSouto7/vitalpair/commit/49f64430092884ec3d23f9887f514942ac452433))
* tell git blame to skip the reformatting commit ([a44a89d](https://github.com/AlissonSouto7/vitalpair/commit/a44a89d54091ade3bf550fd2a59b9aa51e363c14))


### Continuous integration

* add CodeQL scanning and Dependabot updates ([be70884](https://github.com/AlissonSouto7/vitalpair/commit/be70884d5d4e03a5e8f7a3af1954b094ad2a7262))
* point the browser job at the repository's .nvmrc ([4198711](https://github.com/AlissonSouto7/vitalpair/commit/419871182c7b822f1dc0d51fd56c2526d9df45b8))
* stop release-please from proposing SNAPSHOT bumps ([6ffd01f](https://github.com/AlissonSouto7/vitalpair/commit/6ffd01f14d15dc5abf960522ad2f27c4342945d0))
* stop release-please from proposing SNAPSHOT bumps ([d8d74f6](https://github.com/AlissonSouto7/vitalpair/commit/d8d74f6fcd348f9a52dc6479d30a2679af08a7e9))


### Documentation

* document every feature and the API, fixing six bugs the reading found ([0141382](https://github.com/AlissonSouto7/vitalpair/commit/0141382eaa2dd13a22c27fdcdb7113169fb9fa9f))
* document every feature and the API, fixing six bugs the reading found ([fd657ce](https://github.com/AlissonSouto7/vitalpair/commit/fd657ce1dcffa773ae55ac3c421160b22db65f9a))
* **readme:** fix references to files Phase 1 removed ([32310aa](https://github.com/AlissonSouto7/vitalpair/commit/32310aa63d91646709736d5261908c5ab679eb01))
* **readme:** fix references to files Phase 1 removed ([3a6ea27](https://github.com/AlissonSouto7/vitalpair/commit/3a6ea276c7ec7c642e0c98adf5ab775716bb6726))
* rewrite the README, add ADRs 0002 to 0010, describe every endpoint, translate the comments ([8673054](https://github.com/AlissonSouto7/vitalpair/commit/867305405196281bf2ed5606aa404e8e330397aa))
* rewrite the README, add ADRs 0002 to 0010, describe every endpoint, translate the comments ([d4dca3c](https://github.com/AlissonSouto7/vitalpair/commit/d4dca3cc6ead8f1a9b737fb41c2d290091390253))
* **security:** explain why CSRF is disabled, and drop a dead parameter ([7da3c50](https://github.com/AlissonSouto7/vitalpair/commit/7da3c504a916d71034539e2934341a3637047eed))
