# Feature: legal pages

> Living document. It is updated in the same pull request as the code, never
> afterwards. Written for the person who arrives later and needs to understand
> this feature without reading every file.

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-08

## What it is and where it lives

The privacy policy, the terms of use and the contact page. Three routes anyone
can open without an account, in four languages.

They are not decoration. The privacy policy is a legal declaration under the
LGPD: it names who is responsible for the data, who processes it, on what legal
basis, for how long, and what the person can demand. Every sentence in it is a
promise somebody can be held to.

|                   |                                            |
| ----------------- | ------------------------------------------ |
| Frontend routes   | `/privacidade`, `/termos`, `/contato`      |
| Who can access it | anyone, signed in or not                   |
| Backend package   | none. The pages are content, not endpoints |
| Feature flag      | none                                       |

## Architecture

| Layer          | Files                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Pages          | `features/legal/{PrivacyPage,TermsPage,ContactPage}.tsx`                  |
| Mail client    | `features/legal/mailto.ts`                                                |
| Content        | `locales/legal.ts`, 1,430 lines, four languages side by side              |
| Loading        | `shared/i18n/useLegalNamespace.ts`, `locales/index.ts#loadLegalNamespace` |
| i18n namespace | `legal`, loaded on demand                                                 |

The content is its own chunk, 58.56 kB, fetched when one of the three pages
opens. It is 69 kB of the 202 kB of translations for pages a person visits once
if ever, so keeping it in the main bundle made every visitor download the terms
of service to see the login form.

## The facts the pages assert

Everything in this table is a claim about the real world. It is here so the next
person can check it rather than trust it.

| Claim                   | Value                                                   | Where it comes from                                                                                                   |
| ----------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Data controller         | Alisson Pinheiro Souto, MEI, CNPJ 65.088.337/0001-48    | The owner's company registration. LGPD art. 9 requires the controller to be identified                                |
| Data protection officer | The same person                                         | LGPD art. 41 requires one to be named. The law lets the controller take the role, which is normal for a sole trader   |
| Contact address         | `contato@vitalpair.app`                                 | **Does not exist yet.** See the debt table                                                                            |
| Response time           | Three business days                                     | The owner's choice, stated on both the privacy page and the contact page                                              |
| Hosting                 | Oracle Cloud Infrastructure, São Paulo region           | Accepting Oracle's terms includes their data processing agreement, which is what makes the confidentiality claim true |
| Data residency          | Brazil, except the plate photo                          | Follows from the hosting choice                                                                                       |
| International transfer  | The plate photo goes to Anthropic, in the United States | LGPD art. 33 requires disclosing it. It was missing entirely before                                                   |
| Free tier               | Everything is free today; seasons stay free             | The owner's decision. Seasons are what makes the product work, so charging for them is off the table                  |
| Jurisdiction            | The user's own domicile, per the Consumer Code          | Already correct before this pass. CDC art. 101 I                                                                      |

**The owner's CPF is deliberately absent.** The MEI's business name already
contains their civil name, which is unavoidable and public. The CPF number adds
nothing legally and would only widen the exposure.

## What was wrong before

An audit on 2026-09-08 went through all 1,430 lines. The writing was in better
shape than expected: no em-dashes used as a pause, no emoji, no filler openers,
no exclamation marks. The problem was not the prose, it was that the pages
promised things that did not exist.

| ID  | Severity | What it claimed                                                                         | What was true                                                                                                      |
| --- | -------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| L-1 | High     | The account could be closed in settings, with data removed within 30 days, said 4 times | No endpoint and no control existed. Fixed by building it first, in `account-closure.md`, before touching this text |
| L-2 | High     | "VitalPair is the controller... that is the company we mean", naming no entity          | No entity was named at all. LGPD art. 9 breach                                                                     |
| L-3 | High     | A whole section titled "Falar com o encarregado", with no name                          | LGPD art. 41 requires the officer to be identified                                                                 |
| L-4 | Medium   | Nothing about international transfer                                                    | The plate photo has always gone to Anthropic, outside Brazil. LGPD art. 33 requires the disclosure                 |
| L-5 | Medium   | Hosting held the data "sob contrato e com obrigação de sigilo"                          | No host had been chosen and no agreement signed. True now that it is Oracle                                        |
| L-6 | Medium   | "Response within 1 business day", twice                                                 | A promise nobody had agreed to keep, for a mailbox that does not exist                                             |
| L-7 | Low      | "The first season is free", implying the second is paid                                 | No billing code exists and the owner has since decided seasons stay free                                           |
| L-8 | Low      | "The password is stored encrypted"                                                      | It is hashed. Encryption implies it can be turned back, which is the opposite of the guarantee                     |
| L-9 | Low      | Effective date "June 2026"                                                              | A date nobody chose, and already in the past                                                                       |

Three writing problems were fixed alongside them:

- "a gente leva segurança a sério" is the textbook empty reassurance, sitting
  between two concrete claims and adding nothing.
- "o tráfego trafega em HTTPS" repeats itself, in Portuguese.
- "Sem robô, sem ticket número 4827" is the symmetric "no X, no Y" construction
  that `docs/design/voice-and-tone.md` lists as an AI tell. The joke survives
  without the pattern.

## Business rules

| #   | Rule                                                        | Why                                                                                                                                   |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| R-1 | Every claim in these pages names something that exists      | A policy describing a control nobody built is worse than no policy: it tells people they have a right they cannot exercise            |
| R-2 | The four languages are edited together, never one at a time | `locales.test.ts` fails on a key present in one bundle and missing in another                                                         |
| R-3 | The content loads on demand                                 | 58.56 kB for pages most visitors never open                                                                                           |
| R-4 | The contact form opens the visitor's mail client            | There is no endpoint, and a public one that sends e-mail is a spam relay until it has rate limiting. See `frontend-foundation.md` F-2 |
| R-5 | The effective marker is a version, not a date               | Nothing is published yet. A date would be wrong the moment it shipped                                                                 |

## Tests

| Test                             | Type      | Risk it covers                                                                                |
| -------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `locales.test.ts` (89 cases)     | unit      | A key added to one language and forgotten in the other three                                  |
| `ContactPage.test.tsx` (3 cases) | component | The form discarding the message; empty or invalid fields accepted; the `mailto:` missing data |
| `e2e/navigation.spec.ts`         | browser   | `/termos` opens and renders rather than showing raw translation keys                          |

```bash
npm --prefix frontend test -- src/locales src/features/legal
```

There is no test asserting the CNPJ or the officer's name, and adding one would
be theatre: it would restate the file rather than protect anything. What guards
these pages is the audit recorded above and this document.

### What is not covered

- **Nobody reviews the legal text on a schedule.** Its accuracy depends on
  somebody noticing when the product changes underneath it.
- **The pages are not tested for reading level or screen-reader flow.**
- **No test asserts that the claims match reality.** That is what the table above
  is for.

## How to verify

```bash
# No invented company, no promised day, no wrong crypto word, no em-dash:
grep -cE "dessa empresa|that.s the company|1 dia útil|1 business day" frontend/src/locales/legal.ts   # 0
grep -cE "criptografada|encrypted|cifrada|chiffré" frontend/src/locales/legal.ts                       # 0
grep -c "—" frontend/src/locales/legal.ts                                                              # 0

# The real values, once per language:
grep -c "65.088.337/0001-48" frontend/src/locales/legal.ts                                             # 4
grep -cE "Fora do Brasil|Outside Brazil|Fuera de Brasil|Hors du Brésil" frontend/src/locales/legal.ts  # 4

# And never the owner's CPF:
grep -c "048.585" frontend/src/locales/legal.ts                                                        # 0
```

## Known debt

| Item                                         | Impact                                                                   | When it is meant to be addressed                     |
| -------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------- |
| `contato@vitalpair.app` does not exist yet   | Every address on these pages bounces, including the officer's contact    | The owner creates the mailbox                        |
| The domain `vitalpair.app` is not registered | Today the app answers on `vitalpair.duckdns.org`                         | When the product goes public                         |
| No data export before closing an account     | LGPD art. 18 II gives a right to portability, and the policy mentions it | A separate feature; recorded in `account-closure.md` |
| The pages are not versioned in the database  | If the text changes, nobody can tell which version a person accepted     | Only matters once there are users                    |
| Backend error messages are still Portuguese  | An English-speaking user gets Portuguese error text from the API         | The error-code work, backlogged across every feature |

## History

| Date       | Change                                                                                                                                                                                                                                                                                                             | Pull request       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| 2026-09-08 | L-1 to L-9 fixed, 48 edits across the four languages. The controller and the officer are named, the international transfer is disclosed, the hosting claim became true, the response time is three business days, the free tier stops implying a paid second season, and three writing tics went. Document created | `docs/legal-pages` |
