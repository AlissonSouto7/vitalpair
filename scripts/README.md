# scripts

Repository-wide tooling, run by hand from the repository root. Scripts that belong
to a single concern live with it instead: deployment is in [`deploy/scripts/`](../deploy/scripts/),
and anything a developer runs every day is an npm script or a Maven goal.

| Script          | What it does                                                                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `count-code.sh` | Counts classes, lines, migrations, mapped tables and frontend modules. `--sentence` prints the line `docs/ARCHITECTURE.md` carries, so a documented count is always a measured one. |

A script earns a place here when it is run more than once and by more than one person.
A one-off stays out of the tree.
