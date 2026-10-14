# Documentation

Where each kind of writing lives, so a question has one place to be answered and
a document has one place to go.

Code comments explain the line in front of you; these explain the decisions and
the shape around it. The product pitch is in the [README](../README.md).

## Versioned, and part of the review

| Where                              | What it holds                                                                                                                     | Read it when                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [ARCHITECTURE.md](ARCHITECTURE.md) | The shape of the codebase: layers, packages, how a request travels                                                                | You are new, or you are about to add a package                                       |
| [ENGINEERING.md](ENGINEERING.md)   | The rules a change has to satisfy, and the definition of done                                                                     | Before opening a pull request                                                        |
| [features/](features/)             | One living document per feature: rules, security findings (fixed, open, and checked-and-fine), tests, and what is **not** covered | You are changing a feature, or you want to know whether a risk was already looked at |
| [adr/](adr/)                       | One architectural decision each: what was decided, what forced it, what lost, what it costs                                       | You want to change something structural and need to know why it is the way it is     |
| [runbooks/](runbooks/)             | What to do on the server, written to be followed                                                                                  | Something needs doing, possibly at three in the morning                              |
| [design/](design/)                 | The mockups and the colour law; the visual source of truth                                                                        | You are building or changing a screen                                                |

A count, a version or a file name written in any of these is checked before it
is written, and a stale one is a defect, not a detail. `scripts/count-code.sh`
exists so a documented count is a measured one.

## Present on a working copy, deliberately not versioned

These two are listed in `.gitignore`, where the full reason for each is written.
They are named here so their absence from a fresh clone is not a mystery, and so
that nothing anybody writes in them is mistaken for documentation the team can
rely on.

| Where     | What it holds                                                                        | Why it is not versioned                                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `planos/` | Phase plans rendered as PDF for the owner                                            | The editable source lives in `.claude/notes`; a rendered copy is an artefact                                                                                             |
| `qa/`     | Screen sweeps and findings from a working session, with screenshots of real accounts | They hold real account data, and they describe behaviour the fixes have already changed. A finding that survives moves to `features/<name>.md`, where it is kept current |

## Language

English, here as in the code. Measured on 2026-10-13, every versioned document
under `docs/` is in English with one deliberate exception:
`adr/0001-arquitetura-hexagonal.md`, filename included. It predates the policy
and stays as written, because an accepted ADR is not rewritten; its content is
restated in English in [ARCHITECTURE.md](ARCHITECTURE.md). The reason is
recorded in [adr/README.md](adr/README.md) and in
[ENGINEERING.md](ENGINEERING.md), so nobody renames it as housekeeping.

The convention allows team and business documentation in the language the team
thinks in. What explains the code is kept in English anyway, so a reader never
has to switch language between a class and its description.
