# Runbooks

What to do when something needs doing on the server, written to be followed
rather than admired. The audience is one person, possibly at three in the
morning, possibly the one who wrote it and has forgotten.

| Runbook                                | Read it when                                                 |
| -------------------------------------- | ------------------------------------------------------------ |
| [deploy.md](deploy.md)                 | A deploy is running, failed, or needs watching               |
| [rollback.md](rollback.md)             | The live version is wrong and the answer is the previous one |
| [backup-restore.md](backup-restore.md) | You need a dump, need to trust one, or need to put one back  |
| [incident.md](incident.md)             | The site is broken and you do not yet know why               |

## What makes one of these worth having

Every command in them has been run against the real server, not composed from
memory. A runbook whose first command has a typo costs more than no runbook,
because it is read under pressure by somebody who trusts it.

They say what is **not** covered too. There is no Alertmanager, so no alert
reaches an inbox; the dumps sit on the disk they protect; production has never
been started. Knowing the shape of the gap is most of the value.

The tables of "common shapes and what they actually were" are built from
incidents that happened, with the pull request that fixed each one. That is why
they are specific: the 502 with a healthy backend, the certificate for the wrong
name, the bundle asking for `localhost`. None of those were guessed.
