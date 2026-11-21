---
name: legal-security-review
description: Review the code and configuration of legal document assistants for authorization, document isolation, upload safety and confidential-data handling.
---

# Review legal document handling

Map sensitive material as it moves from upload and storage to parsing, indexing, retrieval, model calls, exports and deletion. For each boundary record the acting identity, allowed access, original data and derived copies. Use code and configuration inspection plus local tests with synthetic data.

Check that:

- Tenant, matter and document permissions are enforced server-side across downloads, search results, quotations, generated answers and exports.
- Background work inherits only the data access it needs. Cached answers, embeddings and snippets respect classification, access revocation and deletion.
- Uploads are bounded by format, size and processing limits. Extracted text, metadata and retrieved passages remain untrusted inputs. External model calls follow configured data-sharing restrictions.
- Logs contain the evidence needed to diagnose issues, with confidential content and credentials removed. Verify retention and deletion in stores, queues, indexes and other applicable derived systems.

Report each finding with code or configuration evidence, affected data and control, severity, and a concrete fix. Verify the agreed fixes with isolated tests and record any controls requiring deployment evidence.
