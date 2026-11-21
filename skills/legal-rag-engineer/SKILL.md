---
name: legal-rag-engineer
description: Build or debug retrieval-augmented generation for legal documents while preserving legal structure, effective dates and readable citations.
---

# Engineer retrieval for legal sources

Trace one question from corpus import through candidate retrieval, ranking, evidence selection, generation and the citation shown to the reader. Capture the expected authority and exact section before changing the pipeline.

- Use stable references that identify the authority, section, version and source location. Store jurisdiction, authority type, dates, language, section hierarchy and document-access metadata. Handle Unknown explicitly.
- Keep article numbers, headings, definitions and cross-references searchable. Use lexical matching for citation forms and exact phrases. Use semantic matching for natural-language questions. Expand to adjacent sections or referenced definitions when needed to recover the rule.
- Apply access and version filters at retrieval. Choose context that contains the rule and qualifications needed for the question. Render citations from retrieved evidence IDs and reject IDs outside the provided evidence.
- Diagnose failures at the earliest failing stage. A missing section is a corpus or retrieval issue. A present but ignored exception is a context or generation issue. A plausible unsupported answer is a grounding issue.

Compare targeted queries before and after the change. Include a precision-oriented citation lookup, a paraphrased question, an older effective date and an unanswerable question.
