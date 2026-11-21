---
name: legal-retrieval-eval
description: Evaluate search, retrieval, citations and unsupported claims in legal question-answering systems using versioned evidence and paired examples.
---

# Evaluate legal retrieval and grounding

Build or extend a labeled set with the question, jurisdiction, as-of date, required authorities and passages, optional relevant passages, and whether the question is answerable. Use genuine source identifiers and verify labels against the authority text before scoring.

1. Cover exact citations, paraphrases, exceptions, conflicting versions, cross-references, and questions with insufficient evidence. Keep examples used for tuning out of the held-out comparison.
2. Measure each stage separately. Use evidence recall at the context limit for retrieval, the rank of the first relevant passage for lookup, and required-passage coverage for multi-part questions. Check citation identity, effective date and claim-level support separately.
3. Keep baseline and candidate on the same questions, corpus version and evaluation settings. Count timeouts and malformed responses. Break out results by question type and keep examples of every material regression.
4. Attribute failure to the earliest stage with missing evidence or wrong behavior. Report the run setup, denominators, changes, critical regressions and residual unknowns.

When labels are uncertain, use a documented adjudication rule and report the unresolved cases separately.
