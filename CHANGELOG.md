# Changelog

## [0.5.0](https://github.com/AlissonSouto7/vitalpair/compare/v0.4.0...v0.5.0) (2026-09-12)


### Features

* **entitlement:** put the AI features behind a paid plan the pair shares ([#95](https://github.com/AlissonSouto7/vitalpair/issues/95)) ([686d97d](https://github.com/AlissonSouto7/vitalpair/commit/686d97dced9511d5d211148a7ed6f401feaa0143))
* **frontend:** make every translation key a compile-time fact ([#84](https://github.com/AlissonSouto7/vitalpair/issues/84)) ([37ef462](https://github.com/AlissonSouto7/vitalpair/commit/37ef462ffd43dbbf34808a850cd7120443c0f87c))
* **frontend:** tell people when the server fails, with the request id ([#69](https://github.com/AlissonSouto7/vitalpair/issues/69)) ([9449c3e](https://github.com/AlissonSouto7/vitalpair/commit/9449c3ee433d63907cff277ed888961f48a4af27))
* **infra:** add the Prometheus and Grafana stack phase 8 left out ([#68](https://github.com/AlissonSouto7/vitalpair/issues/68)) ([f3a0836](https://github.com/AlissonSouto7/vitalpair/commit/f3a0836eeeceb4de7b094519882dd5dd279bfeba))
* **infra:** serve one site per environment and make a deploy refuse to build ([#86](https://github.com/AlissonSouto7/vitalpair/issues/86)) ([e044960](https://github.com/AlissonSouto7/vitalpair/commit/e044960edadc13f7f065fddc631a0871a16df088))
* **pair:** let a pair end so both people can start over ([#43](https://github.com/AlissonSouto7/vitalpair/issues/43)) ([5903ff5](https://github.com/AlissonSouto7/vitalpair/commit/5903ff596181561ed6ee7dbd3a7d8cd6c563cd52))
* **user:** let someone close their account and erase what they logged ([#45](https://github.com/AlissonSouto7/vitalpair/issues/45)) ([ffcd556](https://github.com/AlissonSouto7/vitalpair/commit/ffcd5568a5823cc54af1e76aa7a2e10427c4a1c3))
* **user:** put onboarding step 1 on react-hook-form with a message per field ([#85](https://github.com/AlissonSouto7/vitalpair/issues/85)) ([880c689](https://github.com/AlissonSouto7/vitalpair/commit/880c689a6701da5281ea4bbc89847f9b346783df))


### Bug fixes

* **auth:** end every session when the password is reset ([#44](https://github.com/AlissonSouto7/vitalpair/issues/44)) ([091df65](https://github.com/AlissonSouto7/vitalpair/commit/091df6508e318cfc674ef46bf8744ad5efba55bb))
* close the 28 loose ends the audit found, and test the six features that had none ([#97](https://github.com/AlissonSouto7/vitalpair/issues/97)) ([ab2496b](https://github.com/AlissonSouto7/vitalpair/commit/ab2496b6aa27ee12df743c8ebe8a5b17e76160f1))
* **deploy:** mark the deploy scripts executable in git ([#62](https://github.com/AlissonSouto7/vitalpair/issues/62)) ([c908f17](https://github.com/AlissonSouto7/vitalpair/commit/c908f1783d37977258bb96a5d88e9ba8cdc77a78))
* **frontend:** ask the API by path, not by the developer's own machine ([#88](https://github.com/AlissonSouto7/vitalpair/issues/88)) ([1144b76](https://github.com/AlissonSouto7/vitalpair/commit/1144b76eede163b8d0f033914a44c7966acb4bae))
* **frontend:** validate the five forms that sent whatever was typed ([#42](https://github.com/AlissonSouto7/vitalpair/issues/42)) ([32a3c5a](https://github.com/AlissonSouto7/vitalpair/commit/32a3c5ab0330c0a05a79b5a4a9a67e44d01619fd))
* **infra:** bake the Google client id into the frontend image ([#89](https://github.com/AlissonSouto7/vitalpair/issues/89)) ([a31b903](https://github.com/AlissonSouto7/vitalpair/commit/a31b9039bc7b908063b56ccac9ac99cad8843199))
* **infra:** build on ARM and let the edge start before its certificate exists ([#87](https://github.com/AlissonSouto7/vitalpair/issues/87)) ([529812a](https://github.com/AlissonSouto7/vitalpair/commit/529812a87c30928647aeaf179956eca69fe96e53))
* **infra:** let the deployed page load its fonts, its theme script and Google's styles ([#91](https://github.com/AlissonSouto7/vitalpair/issues/91)) ([85fa3ff](https://github.com/AlissonSouto7/vitalpair/commit/85fa3fffe60de5c7f7585b06a2c750c4cef98d34))
* **infra:** say why a deploy stopped on a checkout somebody edited ([#100](https://github.com/AlissonSouto7/vitalpair/issues/100)) ([5b21269](https://github.com/AlissonSouto7/vitalpair/commit/5b212698e85fa009da21edcc4652ef6cbfb11742))
* **nutrition:** name the food search field, and walk a tab a free account can see ([#99](https://github.com/AlissonSouto7/vitalpair/issues/99)) ([f835150](https://github.com/AlissonSouto7/vitalpair/commit/f83515005a06c7486305d40ca3f8c1743fecaf1f))
* **season:** run the JVM in the product's home zone so the season agrees with the day ([#92](https://github.com/AlissonSouto7/vitalpair/issues/92)) ([2db68d3](https://github.com/AlissonSouto7/vitalpair/commit/2db68d3c693264eb42e15a8f3ceb1380a6c35c83))
* **user:** make the birth date fillable and name its group ([#66](https://github.com/AlissonSouto7/vitalpair/issues/66)) ([4732f90](https://github.com/AlissonSouto7/vitalpair/commit/4732f903e641853df4b78815e88b87b5c4eb0394))
* **user:** measure the day in the user's time zone, not the server's ([#75](https://github.com/AlissonSouto7/vitalpair/issues/75)) ([0c96a66](https://github.com/AlissonSouto7/vitalpair/commit/0c96a66d17eefe252f1932328f0e7c34246281a8))


### Refactoring

* **frontend:** move the last nine screens onto TanStack Query ([#74](https://github.com/AlissonSouto7/vitalpair/issues/74)) ([3ceeb66](https://github.com/AlissonSouto7/vitalpair/commit/3ceeb66557c8c69ebd1c010f9e47e3443c3ed9d8))
* **frontend:** move the screens onto the data client and take lint to zero ([#47](https://github.com/AlissonSouto7/vitalpair/issues/47)) ([ef2adc8](https://github.com/AlissonSouto7/vitalpair/commit/ef2adc82d98507a00242e5e43f572a1cf6e22443))
* **frontend:** split the last five screens with a clear seam ([#81](https://github.com/AlissonSouto7/vitalpair/issues/81)) ([2745c68](https://github.com/AlissonSouto7/vitalpair/commit/2745c6889f7abf51cb819bf40675907250d70559))
* **frontend:** split the missions, landing and contact screens ([#80](https://github.com/AlissonSouto7/vitalpair/issues/80)) ([0e27fdd](https://github.com/AlissonSouto7/vitalpair/commit/0e27fdd6f63bd539e9d7031ac1b85671be232fb5))
* **frontend:** split the profile and activity screens ([#77](https://github.com/AlissonSouto7/vitalpair/issues/77)) ([d22c5dc](https://github.com/AlissonSouto7/vitalpair/commit/d22c5dca0a79d70f8a77380488ee188ace77cb44))
* **frontend:** split the season and dashboard screens ([#79](https://github.com/AlissonSouto7/vitalpair/issues/79)) ([9baa282](https://github.com/AlissonSouto7/vitalpair/commit/9baa282cd2c8aabf4c9bf1efd541690ff240a433))
* **nutrition:** split the screen and drop five duplicated icons ([#76](https://github.com/AlissonSouto7/vitalpair/issues/76)) ([6c278c1](https://github.com/AlissonSouto7/vitalpair/commit/6c278c15a13d7f853ebf832ae6fd86d934950ef1))
* **pair:** split the screen along the seam it already had ([#78](https://github.com/AlissonSouto7/vitalpair/issues/78)) ([82f261d](https://github.com/AlissonSouto7/vitalpair/commit/82f261d71f400a22d711126b8ff8541a49f8fa62))
* **user:** split the onboarding page into its five steps ([#71](https://github.com/AlissonSouto7/vitalpair/issues/71)) ([c9f4a9f](https://github.com/AlissonSouto7/vitalpair/commit/c9f4a9fd2a8a19f8ec17d952086784326145cfae))


### Build and dependencies

* **deps:** bump the frontend-minor-and-patch group across 1 directory with 17 updates ([#54](https://github.com/AlissonSouto7/vitalpair/issues/54)) ([9738c7f](https://github.com/AlissonSouto7/vitalpair/commit/9738c7fda31a87f7ad738be7a237a3c21ebe0795))
* **deps:** take the six backend bumps that work and pin resilience4j ([#55](https://github.com/AlissonSouto7/vitalpair/issues/55)) ([d969387](https://github.com/AlissonSouto7/vitalpair/commit/d969387db037f955a1a86c855bda974db40a6ca5))
* finish the quality gates phases 3 and 4 left open ([#63](https://github.com/AlissonSouto7/vitalpair/issues/63)) ([22f2b7b](https://github.com/AlissonSouto7/vitalpair/commit/22f2b7b052ee0046913212ee9aa17a83ad610fae))
* **frontend:** make max-lines an error, at a ceiling every file meets ([#83](https://github.com/AlissonSouto7/vitalpair/issues/83)) ([3fd403c](https://github.com/AlissonSouto7/vitalpair/commit/3fd403cf0e98723fcda808bba0df0f2722735bf5))


### Continuous integration

* build the container images, and stop the robot proposing Java upgrades ([#49](https://github.com/AlissonSouto7/vitalpair/issues/49)) ([77f06e1](https://github.com/AlissonSouto7/vitalpair/commit/77f06e190a3279257cdbcb01caaf5791c6048605))
* bump the actions group across 1 directory with 6 updates ([#48](https://github.com/AlissonSouto7/vitalpair/issues/48)) ([c7a321e](https://github.com/AlissonSouto7/vitalpair/commit/c7a321e517e172322995d6531e9ec34db978023c))
* **infra:** deploy from the pipeline instead of from somebody's terminal ([#96](https://github.com/AlissonSouto7/vitalpair/issues/96)) ([9294ea2](https://github.com/AlissonSouto7/vitalpair/commit/9294ea287ee77cacc52f1291535fa2c20882a75a))
* **infra:** tell a silent registry apart from a missing arm64 build ([#90](https://github.com/AlissonSouto7/vitalpair/issues/90)) ([2b573ae](https://github.com/AlissonSouto7/vitalpair/commit/2b573aeac3d78fb3e62517277853c696f9b297ac))


### Documentation

* close the three items phase 13 left open ([#101](https://github.com/AlissonSouto7/vitalpair/issues/101)) ([543f424](https://github.com/AlissonSouto7/vitalpair/commit/543f42455e2c6a6a8daf99966a5fa2962cc18b32))
* correct the test counts in the README ([#70](https://github.com/AlissonSouto7/vitalpair/issues/70)) ([8406bce](https://github.com/AlissonSouto7/vitalpair/commit/8406bceb8957e695e2fc7875cda6d364561a99c3))
* **frontend:** replace the Vite template README with the real one ([#93](https://github.com/AlissonSouto7/vitalpair/issues/93)) ([e75b9ee](https://github.com/AlissonSouto7/vitalpair/commit/e75b9ee13e8f4e0505763034868f4aa3d0befa13))
* **legal:** replace the invented claims with the real ones ([#46](https://github.com/AlissonSouto7/vitalpair/issues/46)) ([cb30f42](https://github.com/AlissonSouto7/vitalpair/commit/cb30f429325f20f428584a5421797baf94e276a6))
* record the approval step release pull requests need ([#39](https://github.com/AlissonSouto7/vitalpair/issues/39)) ([a783fb8](https://github.com/AlissonSouto7/vitalpair/commit/a783fb8c5987d76a6b9e9ffc92147d52c1cedea1))
* record where phase 10 landed, with the numbers measured ([#82](https://github.com/AlissonSouto7/vitalpair/issues/82)) ([4539fc4](https://github.com/AlissonSouto7/vitalpair/commit/4539fc4b8850743fdc452f000e044c10b3249440))
* remove the merge-commit duplicates from the 0.4.0 changelog ([#37](https://github.com/AlissonSouto7/vitalpair/issues/37)) ([10c419d](https://github.com/AlissonSouto7/vitalpair/commit/10c419d6827e28e683af229953635e131852dc2f))

## [0.4.0](https://github.com/AlissonSouto7/vitalpair/compare/v0.3.0...v0.4.0) (2026-09-07)

### Features

- **ai:** weekly meal and workout plans generated with Anthropic ([f899d8d](https://github.com/AlissonSouto7/vitalpair/commit/f899d8d27ce39c44a2d075709956dc614da335e3))
- **auth:** move refresh token to an HttpOnly cookie, detect theft, add roles ([b7f7501](https://github.com/AlissonSouto7/vitalpair/commit/b7f7501999906f8c9111407e62189de1c11c2fea))
- **season:** expose stake on season history rows ([457966c](https://github.com/AlissonSouto7/vitalpair/commit/457966cb0291f94c3866116177b97436bc7bf491))
- **shared:** add request correlation, metrics and resilience ([85ad47b](https://github.com/AlissonSouto7/vitalpair/commit/85ad47b1c3ad0446fa275c626237ffc59a14e3ea))

### Bug fixes

- **ai:** make Anthropic message DTOs public so Feign can call them ([febf6ef](https://github.com/AlissonSouto7/vitalpair/commit/febf6efce23da4f1b0ea317163582b7d1a529839))
- **auth:** stop logging password reset and verification links ([9591a66](https://github.com/AlissonSouto7/vitalpair/commit/9591a665ca97c8c4a1677a9be8867dfa587c5aec))
- **ci:** make mvnw executable so the build can run on Linux ([eebf614](https://github.com/AlissonSouto7/vitalpair/commit/eebf614418d562c2f401225e1ebc99ec2d17c5f5))
- **frontend:** give every form control an accessible name ([9faf7cf](https://github.com/AlissonSouto7/vitalpair/commit/9faf7cfb2b193bcda21a86f3b2fc8ce0687a8154))
- **security:** answer 400 for unreadable bodies, split CORS origins, proxy the API in dev ([1ca0ef7](https://github.com/AlissonSouto7/vitalpair/commit/1ca0ef7dfdef74bbae61d38716c4b61c2e7dce47))
- **security:** rate limit auth and AI endpoints, harden secrets and timeouts ([b89ed58](https://github.com/AlissonSouto7/vitalpair/commit/b89ed589dc29fe12b85fe53dfacb7e2791d6e333))

### Refactoring

- **frontend:** split code per route and centralise data and errors ([dce3294](https://github.com/AlissonSouto7/vitalpair/commit/dce329412599969d88380121d2b203ecf152f718))

### Build and dependencies

- add Checkstyle for the defects a formatter cannot see ([0f83ef4](https://github.com/AlissonSouto7/vitalpair/commit/0f83ef41ea5c84f9ee28121006cc2e0f6d07eb50))
- add coverage measurement and architecture tests ([306f8db](https://github.com/AlissonSouto7/vitalpair/commit/306f8db42f3efc953adf0644bd6bf20e4775c46c))
- add the frontend reformatting commit to .git-blame-ignore-revs ([83576a2](https://github.com/AlissonSouto7/vitalpair/commit/83576a277fd2c66fad3d1cb7734cc87265e7af02))
- enforce Java formatting with Spotless and palantir-java-format ([544e502](https://github.com/AlissonSouto7/vitalpair/commit/544e502790b62c12244f6692ffd025d204b2cd00))
- **frontend:** add formatting, git hooks, tests and a CI job ([29e1ebe](https://github.com/AlissonSouto7/vitalpair/commit/29e1ebe2c091abaa8b4e44cd7664a1e11d120837))
- **infra:** build the deployment stack, replacing the inherited one ([49f6443](https://github.com/AlissonSouto7/vitalpair/commit/49f64430092884ec3d23f9887f514942ac452433))
- tell git blame to skip the reformatting commit ([a44a89d](https://github.com/AlissonSouto7/vitalpair/commit/a44a89d54091ade3bf550fd2a59b9aa51e363c14))

### Continuous integration

- add CodeQL scanning and Dependabot updates ([be70884](https://github.com/AlissonSouto7/vitalpair/commit/be70884d5d4e03a5e8f7a3af1954b094ad2a7262))
- point the browser job at the repository's .nvmrc ([4198711](https://github.com/AlissonSouto7/vitalpair/commit/419871182c7b822f1dc0d51fd56c2526d9df45b8))
- stop release-please from proposing SNAPSHOT bumps ([d8d74f6](https://github.com/AlissonSouto7/vitalpair/commit/d8d74f6fcd348f9a52dc6479d30a2679af08a7e9))

### Documentation

- document every feature and the API, fixing six bugs the reading found ([fd657ce](https://github.com/AlissonSouto7/vitalpair/commit/fd657ce1dcffa773ae55ac3c421160b22db65f9a))
- **readme:** fix references to files Phase 1 removed ([3a6ea27](https://github.com/AlissonSouto7/vitalpair/commit/3a6ea276c7ec7c642e0c98adf5ab775716bb6726))
- rewrite the README, add ADRs 0002 to 0010, describe every endpoint, translate the comments ([d4dca3c](https://github.com/AlissonSouto7/vitalpair/commit/d4dca3cc6ead8f1a9b737fb41c2d290091390253))
- **security:** explain why CSRF is disabled, and drop a dead parameter ([7da3c50](https://github.com/AlissonSouto7/vitalpair/commit/7da3c504a916d71034539e2934341a3637047eed))
