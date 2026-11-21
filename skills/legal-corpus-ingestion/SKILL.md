---
name: legal-corpus-ingestion
description: Import, parse and index legal source documents while preserving article structure, versions, dates, and traceable source locations.
---

# Ingest a legal corpus

1. Record source authority, jurisdiction, language, title, official identifier, retrieval date, effective dates and content hash. Keep the source artifact so normalized text can be checked against it. Map amendments and translated equivalents as explicit relationships.
2. Detect document boundaries, article and section headings, numbered paragraphs, footnotes and annexes before splitting text. Preserve the original wording alongside any normalized search text. Keep page or line locations for citations.
3. Assign stable identifiers to logical sections and a separate identifier to each version. Associate parent headings and useful cross-references. Keep competing or unclear versions distinguishable with an explicit status.
4. Validate before updating the searchable index. Compare article counts and numbering, spot-check OCR and bilingual alignment, and verify that a citation opens the intended passage. Quarantine parse failures and report them with source IDs.
5. Make re-importing the same version idempotent. Build and verify a new revision before switching live search, then retain enough source and revision metadata to explain or revert the change.

Use a representative sample spanning plain text, scans, amendments and unusual section structures before attempting a full ingestion.
