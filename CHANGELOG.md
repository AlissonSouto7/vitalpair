# Changelog

## [0.5.0](https://github.com/AlissonSouto7/vitalpair/compare/v0.4.0...v0.5.0) (2026-09-12)


### Features

* **entitlement:** put the AI features behind a paid plan the pair shares ([#95](https://github.com/AlissonSouto7/vitalpair/issues/95)) ([ef96253](https://github.com/AlissonSouto7/vitalpair/commit/ef962532495376443550d70c15a698196423803f))
* **frontend:** make every translation key a compile-time fact ([#84](https://github.com/AlissonSouto7/vitalpair/issues/84)) ([3169887](https://github.com/AlissonSouto7/vitalpair/commit/3169887ef96c39d0043098cd9bcd5a5186217f7d))
* **frontend:** tell people when the server fails, with the request id ([#69](https://github.com/AlissonSouto7/vitalpair/issues/69)) ([6957618](https://github.com/AlissonSouto7/vitalpair/commit/6957618b07d00114a96dc2eca0830deb9b62909a))
* **infra:** add the Prometheus and Grafana stack ([#68](https://github.com/AlissonSouto7/vitalpair/issues/68)) ([4057f89](https://github.com/AlissonSouto7/vitalpair/commit/4057f890cac990e410b4fd6aa8267a85c3b480ce))
* **infra:** serve one site per environment and make a deploy refuse to build ([#86](https://github.com/AlissonSouto7/vitalpair/issues/86)) ([f5fd071](https://github.com/AlissonSouto7/vitalpair/commit/f5fd0711fdefd600cd7242abac066fadf5b00968))
* **pair:** let a pair end so both people can start over ([#43](https://github.com/AlissonSouto7/vitalpair/issues/43)) ([8265190](https://github.com/AlissonSouto7/vitalpair/commit/826519082c7cb26dc273196f44af577d7479732e))
* **user:** let someone close their account and erase what they logged ([#45](https://github.com/AlissonSouto7/vitalpair/issues/45)) ([3a4ae6f](https://github.com/AlissonSouto7/vitalpair/commit/3a4ae6f305b8d6dba145c684d4481890a0e88876))
* **user:** put onboarding step 1 on react-hook-form with a message per field ([#85](https://github.com/AlissonSouto7/vitalpair/issues/85)) ([ef7ac99](https://github.com/AlissonSouto7/vitalpair/commit/ef7ac99bfdde2e3de9ee835a43d61a9ffc5a5084))


### Bug fixes

* **auth:** end every session when the password is reset ([#44](https://github.com/AlissonSouto7/vitalpair/issues/44)) ([7bc0903](https://github.com/AlissonSouto7/vitalpair/commit/7bc09035d564177d54403739dd6739c715577dae))
* **auth:** mask the address on the sent-mail log line too ([4814953](https://github.com/AlissonSouto7/vitalpair/commit/48149533bfba29ba1c2fe73dc583c5758c364c9d))
* close the 28 loose ends the audit found, and test the six features that had none ([#97](https://github.com/AlissonSouto7/vitalpair/issues/97)) ([8b235ef](https://github.com/AlissonSouto7/vitalpair/commit/8b235ef24cc757e719694f02c4c8e8856859fdd3))
* **deploy:** mark the deploy scripts executable in git ([#62](https://github.com/AlissonSouto7/vitalpair/issues/62)) ([264af97](https://github.com/AlissonSouto7/vitalpair/commit/264af97e8cc19a8a878a519971c81dc650920bbc))
* **frontend:** ask the API by path, not by the developer's own machine ([#88](https://github.com/AlissonSouto7/vitalpair/issues/88)) ([beb4981](https://github.com/AlissonSouto7/vitalpair/commit/beb498180f6a479acf101beca26b436d60ca1df7))
* **frontend:** validate the five forms that sent whatever was typed ([#42](https://github.com/AlissonSouto7/vitalpair/issues/42)) ([077856f](https://github.com/AlissonSouto7/vitalpair/commit/077856fb3be86aa4f6fc4126d56db02daf3ab345))
* **gamification:** refuse future-dated logs that fabricate a streak and score ([2f73562](https://github.com/AlissonSouto7/vitalpair/commit/2f7356282b5fae381d1fd43ba6c7291b37f93d26))
* **infra:** bake the Google client id into the frontend image ([#89](https://github.com/AlissonSouto7/vitalpair/issues/89)) ([ae90a5b](https://github.com/AlissonSouto7/vitalpair/commit/ae90a5b6c4dfe9ab651421b3133ed07bb4051423))
* **infra:** build on ARM and let the edge start before its certificate exists ([#87](https://github.com/AlissonSouto7/vitalpair/issues/87)) ([89d5415](https://github.com/AlissonSouto7/vitalpair/commit/89d54151e328ad14ce2b520d0c18f2cdfde4c1f8))
* **infra:** let the deployed page load its fonts, its theme script and Google's styles ([#91](https://github.com/AlissonSouto7/vitalpair/issues/91)) ([4647c05](https://github.com/AlissonSouto7/vitalpair/commit/4647c053c6d8d4e004c33c769dfa4b98f678bf6f))
* **infra:** say why a deploy stopped on a checkout somebody edited ([#100](https://github.com/AlissonSouto7/vitalpair/issues/100)) ([1906f20](https://github.com/AlissonSouto7/vitalpair/commit/1906f20da6c09f6b96f5f32615103d02f3173245))
* **nutrition:** name the food search field, and walk a tab a free account can see ([#99](https://github.com/AlissonSouto7/vitalpair/issues/99)) ([7cde3fd](https://github.com/AlissonSouto7/vitalpair/commit/7cde3fd4a1642a3b605a353cee5e5ea96e52c9e5))
* **nutrition:** validate the food search query server-side ([50d1a90](https://github.com/AlissonSouto7/vitalpair/commit/50d1a906050421b5835a7685e6fc03d14d022dfd))
* **pair:** name the partner in copy instead of one hardcoded person ([c142880](https://github.com/AlissonSouto7/vitalpair/commit/c142880edd1a8343f1004dda3dc214d815e51af0))
* **ratelimit:** cap food lookups and match on a normalised path ([0e1c8e6](https://github.com/AlissonSouto7/vitalpair/commit/0e1c8e60ac0e1a2e43eeea760bd511fb8d6d3635))
* **season:** run the JVM in the product's home zone so the season agrees with the day ([#92](https://github.com/AlissonSouto7/vitalpair/issues/92)) ([d45bd58](https://github.com/AlissonSouto7/vitalpair/commit/d45bd58bad73c469e9460740a9170331422c1c1f))
* **user:** make the birth date fillable and name its group ([#66](https://github.com/AlissonSouto7/vitalpair/issues/66)) ([3e8e90a](https://github.com/AlissonSouto7/vitalpair/commit/3e8e90acbdd4944e817be5e80920f1acf3247f4d))
* **user:** measure the day in the user's time zone, not the server's ([#75](https://github.com/AlissonSouto7/vitalpair/issues/75)) ([852840d](https://github.com/AlissonSouto7/vitalpair/commit/852840dea231bef528b7cdc3d277ef695599a9cc))


### Refactoring

* **frontend:** move the last nine screens onto TanStack Query ([#74](https://github.com/AlissonSouto7/vitalpair/issues/74)) ([4dcd997](https://github.com/AlissonSouto7/vitalpair/commit/4dcd997199814e77cbe269993de71a353ba8e008))
* **frontend:** move the screens onto the data client and take lint to zero ([#47](https://github.com/AlissonSouto7/vitalpair/issues/47)) ([5df4914](https://github.com/AlissonSouto7/vitalpair/commit/5df49148ad20040ab2eec765889dad65970e6bff))
* **frontend:** split the last five screens with a clear seam ([#81](https://github.com/AlissonSouto7/vitalpair/issues/81)) ([668ccf5](https://github.com/AlissonSouto7/vitalpair/commit/668ccf5ac91b92976aaae2e36e22df8f697397a6))
* **frontend:** split the missions, landing and contact screens ([#80](https://github.com/AlissonSouto7/vitalpair/issues/80)) ([4ac66f8](https://github.com/AlissonSouto7/vitalpair/commit/4ac66f8c2d1ab04db0cd2ba19c2dd588937e4363))
* **frontend:** split the profile and activity screens ([#77](https://github.com/AlissonSouto7/vitalpair/issues/77)) ([ad308e4](https://github.com/AlissonSouto7/vitalpair/commit/ad308e42b002e8f614796a50558b3881b25de8ba))
* **frontend:** split the season and dashboard screens ([#79](https://github.com/AlissonSouto7/vitalpair/issues/79)) ([4a62af7](https://github.com/AlissonSouto7/vitalpair/commit/4a62af79a95897c0f73b5b1a4ea55c4d836ed6bc))
* **nutrition:** split the screen and drop five duplicated icons ([#76](https://github.com/AlissonSouto7/vitalpair/issues/76)) ([7829528](https://github.com/AlissonSouto7/vitalpair/commit/782952847220c45fe7fad8df754d10a3dbcdc489))
* **pair:** split the screen along the seam it already had ([#78](https://github.com/AlissonSouto7/vitalpair/issues/78)) ([e54b5db](https://github.com/AlissonSouto7/vitalpair/commit/e54b5db51879e129db92ead141858421dd0d46dc))
* **user:** split the onboarding page into its five steps ([#71](https://github.com/AlissonSouto7/vitalpair/issues/71)) ([d0d21ac](https://github.com/AlissonSouto7/vitalpair/commit/d0d21ac601bc035ef475365b83bfa16ec203586b))


### Build and dependencies

* **deps:** bump the frontend-minor-and-patch group across 1 directory with 17 updates ([#54](https://github.com/AlissonSouto7/vitalpair/issues/54)) ([ace49e1](https://github.com/AlissonSouto7/vitalpair/commit/ace49e12c70081ac7df132688e6ac50113c096aa))
* **deps:** move to Spring Boot 3.5.16, the last release of the 3.5 line ([8ddd70a](https://github.com/AlissonSouto7/vitalpair/commit/8ddd70a9c2ee12d8824ddac918f1d4e65a8317e4))
* **deps:** take the six backend bumps that work and pin resilience4j ([#55](https://github.com/AlissonSouto7/vitalpair/issues/55)) ([ce15297](https://github.com/AlissonSouto7/vitalpair/commit/ce15297d85a591cd7121fa44329af28ddf61bb4b))
* finish the quality gates phases 3 and 4 left open ([#63](https://github.com/AlissonSouto7/vitalpair/issues/63)) ([0efe0e4](https://github.com/AlissonSouto7/vitalpair/commit/0efe0e4d6b4be826a5f631f817c6321a97d514bf))
* **frontend:** make max-lines an error, at a ceiling every file meets ([#83](https://github.com/AlissonSouto7/vitalpair/issues/83)) ([aff9c25](https://github.com/AlissonSouto7/vitalpair/commit/aff9c25f518507f62ec3a92b047ec3040648b5eb))


### Continuous integration

* build the container images, and stop the robot proposing Java upgrades ([#49](https://github.com/AlissonSouto7/vitalpair/issues/49)) ([9c1e2e8](https://github.com/AlissonSouto7/vitalpair/commit/9c1e2e816ff3febad15b382da9964a498dc77c40))
* bump the actions group across 1 directory with 6 updates ([#48](https://github.com/AlissonSouto7/vitalpair/issues/48)) ([3a3322f](https://github.com/AlissonSouto7/vitalpair/commit/3a3322f7f3757b6ccc1a911c071a2e9d8917ac25))
* **infra:** deploy from the pipeline instead of from somebody's terminal ([#96](https://github.com/AlissonSouto7/vitalpair/issues/96)) ([4ac79c5](https://github.com/AlissonSouto7/vitalpair/commit/4ac79c571777e34f3f1f1a53f480ceb039ba6c98))
* **infra:** pin every action, scope the token, and drop the Docker socket ([fa4625b](https://github.com/AlissonSouto7/vitalpair/commit/fa4625bc2efb4be7377ced44b5c5e9e68d0af09c))
* **infra:** tell a silent registry apart from a missing arm64 build ([#90](https://github.com/AlissonSouto7/vitalpair/issues/90)) ([42e06a1](https://github.com/AlissonSouto7/vitalpair/commit/42e06a163e4f20f330dc8f1b73f8c2beb2f5b5e8))


### Documentation

* close the three items the documentation pass left open ([#101](https://github.com/AlissonSouto7/vitalpair/issues/101)) ([983357a](https://github.com/AlissonSouto7/vitalpair/commit/983357a6ddc8d12b2f531fd1312fc0f6f51addb7))
* correct the test counts in the README ([#70](https://github.com/AlissonSouto7/vitalpair/issues/70)) ([5e0668a](https://github.com/AlissonSouto7/vitalpair/commit/5e0668ad2774c220e8a8faeeb0f3c2c16e1b30e3))
* **frontend:** replace the Vite template README with the real one ([#93](https://github.com/AlissonSouto7/vitalpair/issues/93)) ([d23f1e4](https://github.com/AlissonSouto7/vitalpair/commit/d23f1e4f95322cd9a9fed343ff9f01192c178f79))
* **legal:** replace the invented claims with the real ones ([#46](https://github.com/AlissonSouto7/vitalpair/issues/46)) ([6d7d90e](https://github.com/AlissonSouto7/vitalpair/commit/6d7d90e0ef67fa4edc2abb0b75998eb7f0c748b5))
* record the approval step release pull requests need ([#39](https://github.com/AlissonSouto7/vitalpair/issues/39)) ([508edc6](https://github.com/AlissonSouto7/vitalpair/commit/508edc6424e0b6d6908fd5ef1133009c74a010d5))
* record where the frontend foundation landed, with the numbers measured ([#82](https://github.com/AlissonSouto7/vitalpair/issues/82)) ([c154c7d](https://github.com/AlissonSouto7/vitalpair/commit/c154c7d81fa4e0d856b8a697ea05ebc69b0bdefc))
* remove the merge-commit duplicates from the 0.4.0 changelog ([#37](https://github.com/AlissonSouto7/vitalpair/issues/37)) ([34c18ac](https://github.com/AlissonSouto7/vitalpair/commit/34c18ac325606fa711613a950b9c2789defcb762))
* **security:** correct the known-issues list to the current state ([eedfc22](https://github.com/AlissonSouto7/vitalpair/commit/eedfc223349875d192e30d3ffda3230296801f9e))
* write the documentation for a reader outside the project ([a4931a2](https://github.com/AlissonSouto7/vitalpair/commit/a4931a22717ecc737bed71a2ce28dd0c9f490a36))

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
