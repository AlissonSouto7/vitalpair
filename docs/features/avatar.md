# Feature: avatar

- **Status**: shipped
- **Owner**: @AlissonSouto7
- **Last updated**: 2026-09-15

## What it is and where it lives

The profile photo. One person's face is shown to the other, beside their name,
on the pair screen, the feed and the sidebar.

The column, the API fields and the `Avatar` component's image slot already
existed; what was missing was a way to put a picture in and somewhere to keep
it. The whole design starts from one fact: an image arriving from a stranger is
hostile input, and the file that arrives is never the file that is stored.

|                   |                                                                      |
| ----------------- | -------------------------------------------------------------------- |
| Frontend route    | `/profile` (the upload), every screen showing a face (the image)     |
| Who can access it | authenticated to change; **public to read**, see R-4                 |
| Backend packages  | `com.aps.vitalpair.shared.image`, `com.aps.vitalpair.user.*.avatar*` |
| Feature flag      | none                                                                 |

## Architecture

| Layer            | Files                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| Controller       | `user/infrastructure/web/AvatarController.java`                                 |
| Request/response | `AvatarUploadRequest.java`, `AvatarResponse.java`                               |
| Service          | `user/application/service/AvatarService.java`                                   |
| Sanitizer        | `shared/image/ImageSanitizer.java`, `InvalidImageException.java`                |
| Input ports      | `SetAvatarUseCase`, `ReadAvatarUseCase`                                         |
| Output port      | `user/domain/port/out/AvatarStoragePort.java`                                   |
| Adapter          | `user/infrastructure/storage/FilesystemAvatarStorageAdapter.java`               |
| Frontend         | `features/profile/AvatarUpload.tsx`, `shared/api/avatarUrl.ts`, `ui/Avatar.tsx` |
| i18n namespace   | `profile` (the `avatar*` keys)                                                  |

### Endpoints

| Method | Path                                 | Action                                                                  |
| ------ | ------------------------------------ | ----------------------------------------------------------------------- |
| PUT    | `/api/v1/users/me/avatar`            | Base64 in a JSON body. Answers the object name. 10 an hour per user     |
| DELETE | `/api/v1/users/me/avatar`            | Clears the profile and deletes the file. Doing it twice is not an error |
| GET    | `/api/v1/users/avatars/{objectName}` | The JPEG. **Public**, see R-4                                           |

Base64 rather than multipart: it is the convention this API already uses for
the meal photo, it keeps every answer in the standard envelope, and it avoids
introducing a multipart parser for one endpoint. The cost is a third more bytes
on the wire, which the proxy's 12 MB body limit already accommodates.

### Data

| Where                           | What                                                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `users.avatar_url`              | The object name, not a URL. Column exists since `V1`; what changed is what may go in it                        |
| Docker volume `<stack>_avatars` | The files, mounted at `/var/lib/vitalpair/avatars` (`AVATAR_DIRECTORY`). Declared in `deploy/compose.app.yaml` |

The image sets `AVATAR_DIRECTORY=/var/lib/vitalpair/avatars` and creates the directory owned
by `app`, so it starts with no configuration at all. The application's own default is
`target/avatars`, which suits development and not a container: inside the image it resolves
to `/app/target`, which the unprivileged user cannot create, and the adapter refuses to start
rather than failing on the first upload. Found by the CI smoke test on 16/09/2026, which runs
the image with the minimum environment; production was never affected, because the compose
file has always set the variable.

The volume is the only durable state outside Postgres, which is why
`backup.sh` archives it beside the dump and `restore.sh` puts it back. A
database restore on its own brings back profiles pointing at files that are not
there.

## Business rules

| #    | Rule                                                                              | Why                                                                                                                                                                                                      |
| ---- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1  | The stored file is always re-encoded by us: decoded, cropped square, 512px, JPEG  | This is the security model. Everything that was not a pixel is gone by construction rather than by inspection, which is what holds against variants instead of against known samples                     |
| R-2  | The declared content type is never trusted                                        | It comes from the client, and a client that is attacking says whatever gets it through. The format is established from the bytes                                                                         |
| R-3  | The object name is generated by the server: 32 hex characters from `SecureRandom` | It cannot express a path, so traversal has nothing to work with; it is unguessable, which is what lets the read endpoint be public; and it is new on every upload, so a replaced photo is a new URL      |
| R-4  | Reading is public                                                                 | An `<img>` tag cannot send an Authorization header, and fetching every avatar with the token costs browser caching on every screen with a face. The unguessable name is what stands in for authorization |
| R-5  | The response is `image/jpeg` with `nosniff` and an inline disposition             | The sanitizer guarantees the type, and nothing should be able to talk a browser into treating it as anything else                                                                                        |
| R-6  | A year-long immutable cache                                                       | Safe only because of R-3: a new photo is a new URL, so there is nothing to invalidate                                                                                                                    |
| R-7  | Validate, store the new file, point the profile at it, delete the old file        | Any other order leaves a window where the profile names a file that is not there                                                                                                                         |
| R-8  | A refused image leaves the existing photo untouched                               | Sending a bad file must not cost somebody the picture they already had                                                                                                                                   |
| R-9  | Closing an account deletes the file, not just the column                          | Clearing a pointer is not erasure while the image is still on the volume answering the same public URL                                                                                                   |
| R-10 | Uploads are capped at 10 an hour per user                                         | Decoding and re-encoding an image is the most CPU a single request in this application spends                                                                                                            |

## Security findings

### Fixed

| ID  | Severity | File                             | What it defends against                                                                                                                                                     | Evidence                                                                                                                               |
| --- | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| A-1 | **High** | `ImageSanitizer`                 | **Appended payloads.** A JPEG stays valid with a webshell, a ZIP or another file glued after its end marker; decoders ignore the tail, web servers and archive tools do not | Sent a JPEG with `<?php system($_GET['cmd']); ?>` appended to a running server: accepted, and the stored file does not contain it      |
| A-2 | **High** | `ImageSanitizer`                 | **Polyglots.** A file valid as both an image and a script passes any "is this an image?" check, honestly                                                                    | A GIF/JavaScript polyglot answers 422. Disabling the magic-byte check makes that test fail                                             |
| A-3 | Medium   | `ImageSanitizer`                 | **Metadata.** Phone photos carry EXIF, and EXIF routinely carries GPS. The avatar is shown to the partner, so the original would hand over where the photo was taken        | Sent a JPEG with an APP1 segment holding GPS coordinates: accepted, and neither `Exif` nor `GPSLatitude` is in the stored file         |
| A-4 | Medium   | `ImageSanitizer`                 | **Decompression bombs.** A few kilobytes can declare 50000x50000 pixels, which asks for about 10 GB on decode                                                               | Refused in 15ms, from the header, before any raster is allocated. Removing the pixel check makes the test fail                         |
| A-5 | Medium   | `ImageSanitizer`                 | **SVG**, which is a document that can carry script and so is stored XSS with an image extension                                                                             | Answers 422: not in the accepted set, and it does not survive a raster decode even if the declared type lies                           |
| A-6 | **High** | `FilesystemAvatarStorageAdapter` | **Path traversal and overwriting somebody else's file.** A client-supplied filename is how both happen                                                                      | The name is server-generated and matched against an anchored hex pattern; the adapter re-checks containment. Probes answer 400/401/404 |

Disabling the re-encode alone makes **six** tests fail, including the webshell
and the GPS surviving. Each defence was disabled separately to prove none is
redundant.

### Open

| ID  | Severity      | What                                                                                                                 | Why it is still open                                                                                       |
| --- | ------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| A-7 | Low           | The files live on the VM's disk, so they die with the VM unless a backup was taken                                   | Accepted for the beta. Object storage is one new adapter behind `AvatarStoragePort`, which exists for this |
| A-8 | Low           | Nothing reclaims a file whose row vanished by some path other than the two that delete it                            | No such path exists today. Worth a sweep job if one ever does                                              |
| A-9 | Informational | The meal photo endpoint still trusts the client's `mediaType` without checking the bytes, and has no dimension limit | Out of scope here. `ImageSanitizer` is the piece that would close it                                       |

### Verified and fine

| Check                                                     | How it was verified                                                                                             | Date       |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------- |
| Uploading without a session is refused, and costs nothing | `AvatarControllerTest.anuploadWithoutAsessionIsRefused` asserts 401 **and** that the use case was never reached | 2026-09-15 |
| The name carries nothing about who uploaded it            | `FilesystemAvatarStorageAdapterTest.thenameCarriesNothingAboutTheUserWhoUploadedIt`                             | 2026-09-15 |
| Two uploads never share a name                            | `twouploadsNeverShareAname`                                                                                     | 2026-09-15 |
| Replacing a photo removes the old file                    | Verified on a running server: ten uploads, nine refused, one file left on disk                                  | 2026-09-15 |
| A PNG with transparency does not come back black          | `ImageSanitizerTest.apngWithTransparencyDoesNotComeBackWithAblackBackground`                                    | 2026-09-15 |
| A malformed file is a 4xx and never a 500                 | `atruncatedJpegIsAclientErrorAndNotAcrash`, plus the JDK's decoders throwing unchecked types being caught       | 2026-09-15 |

## Tests

| Test                                      | Type  | Risk it covers                                                                              |
| ----------------------------------------- | ----- | ------------------------------------------------------------------------------------------- |
| `ImageSanitizerTest` (18 cases)           | unit  | A-1 to A-5, plus size, dimensions, transparency and malformed input                         |
| `FilesystemAvatarStorageAdapterTest` (27) | unit  | A-6, name generation, idempotent delete, no temp files left, the directory created at start |
| `AvatarServiceTest` (10 cases)            | unit  | R-7, R-8, and that the stored bytes are the sanitized ones and never the upload             |
| `AvatarControllerTest` (12 cases)         | slice | R-4, R-5, R-6, authentication on write, and the 422/400 split                               |
| `AccountClosureServiceTest` (8 cases)     | unit  | R-9                                                                                         |
| `AvatarUpload.test.tsx` (6 cases)         | unit  | The local guards, and that they refuse before spending an upload                            |

```bash
./mvnw test -Dtest='ImageSanitizerTest,FilesystemAvatarStorageAdapterTest,AvatarServiceTest,AvatarControllerTest'
npm --prefix frontend exec -- vitest run src/features/profile/AvatarUpload.test.tsx
```

### What is not covered

- **No integration test** over the real HTTP stack with a real file on a real
  volume. The hostile files were sent to a running server by hand and the
  results recorded above, which is evidence but not a regression guard.
- **Concurrency**: two uploads from the same account at the same moment. The
  last write wins on the column and the other file is orphaned, which is A-8.
- **The browser-side downscale** is stubbed in jsdom, so what the canvas
  actually produces is not asserted anywhere. It is a courtesy, not a defence:
  the server re-encodes regardless.
- **The volume being full or read-only** at upload time.

## How to verify in production

```sql
-- read only: every stored value should be an object name, never a URL
SELECT count(*) FROM users WHERE avatar_url IS NOT NULL AND avatar_url !~ '^[0-9a-f]{32}\.jpg$';

-- read only: a closed account must not still name a photo
SELECT count(*) FROM users WHERE deleted_at IS NOT NULL AND avatar_url IS NOT NULL;
```

```bash
# read only: files on the volume against rows that name one. A large gap means orphans (A-8).
docker run --rm -v vitalpair-production_avatars:/data:ro alpine:3.20 sh -c 'ls -1 /data | wc -l'
```

## Known debt

| Item                                    | Impact                                                    | When it is meant to be addressed            |
| --------------------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| A-7, files live and die with the VM     | A lost VM without a backup loses every photo              | When object storage is worth the credential |
| A-8, no orphan sweep                    | Disk creeps if a delete path is ever missed               | If a third delete path appears              |
| No integration test over the real stack | The hand-run evidence does not protect against regression | Next change here                            |
| A-9, the meal photo endpoint            | Documented in [meal-vision.md](meal-vision.md)            | Its own change                              |

## History

| Date       | Change                                                                                                                                                          | Pull request       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| 2026-09-15 | Feature created: upload, storage, sanitizer, the public read endpoint, the volume, and backup/restore coverage. Hostile files sent to a running server as proof | `fix/screen-sweep` |
