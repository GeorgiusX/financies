# Financies — standalone product architecture

This supersedes the earlier proposal to integrate the Expensify fork with George · Finance. The product will have its own identity, repository name, users, authentication, backend, storage, deployment configuration, and development/production environments. No existing financial records, credentials, endpoints, or connector integration are to be carried across automatically.

Product name: Financies. The mascots are called financies: little helpers that organize your finances.

Repository: https://github.com/GeorgiusX/financies, forked from Expensify/App. The MIT license and upstream attribution remain.

**Recommended Firebase architecture (not provisioned)**

| Layer | Proposal | Purpose |
|---|---|---|
| Client | Expensify-derived React Native / React Native Web frontend | Retain coherent UI, routing and interaction foundations |
| Identity | Firebase Authentication | Independent user accounts and sessions |
| Core data | Firebase SQL Connect, formerly Data Connect, backed by Cloud SQL for PostgreSQL | Relational transaction/account/category/source records; analytical queries |
| File storage | Cloud Storage for Firebase | Private receipts and attachments |
| Server workflows | Cloud Functions and/or Cloud Run | Imports, reconciliation, OCR jobs and privileged domain operations |
| Web delivery | Evaluate Firebase Hosting for the built web client | Hosting and client-side routing; confirm compatibility with existing build output |
| Development | Local emulators and synthetic data first | Validate the independent product before provisioning production services |

SQL Connect is a recommendation, not an accepted infrastructure decision. Its Cloud SQL instance has a cost model distinct from Firestore; verify region and current pricing before provisioning. Do not enable billing or deploy services as part of this design note.

**Why SQL Connect is the leading database candidate**

Financial records naturally relate accounts, transactions, category allocations, receipt sources, import batches and audit history. A relational model is a strong fit for these relationships and analytical queries. SQL Connect provides managed PostgreSQL, predefined authorized GraphQL operations, and generated client SDKs. This is an engineering fit assessment, not a claim that the upstream app can switch databases without adaptation.

Firestore remains an alternative for a document-centric, realtime-first version. Standard Firestore supports count/sum/average aggregations, but those documented aggregation queries do not run offline or through realtime listeners. Rich reporting needs intentional aggregate/query design. Choose the database on the required workflows, not merely because the upstream app uses Firebase SDKs.

**Frontend/backend boundary**

Retain upstream UI initially. Replace Expensify authentication and API calls behind a backend adapter. Keep one authoritative persistence path; do not independently write the same records through both a Firebase SDK and the old Expensify request queue. Determine which Onyx state remains as a view cache/draft store and how server mutations update it. Reuse interaction and recovery patterns while changing the service contract deliberately.

First independent vertical slice:

1. Authenticate against our own development environment.
2. List synthetic transactions scoped to the authenticated user.
3. Create and edit one transaction, with stable request IDs and server-side validation.
4. Reload and verify persisted data.
5. Display a spending chart and drill down to the same contributing records.
6. Verify a second user cannot read or modify the first user's records.
7. Confirm the slice makes no calls to Expensify production APIs.

**Isolation requirements**

- Replace inherited Firebase app IDs, bundle identifiers, service URLs and product branding before distributing a build.
- Remove or reconfigure upstream telemetry and third-party service destinations before using real data.
- Keep development and production Firebase projects separate.
- Enforce user/workspace ownership in authorized operations and attachment access.
- Use integer minor units with an explicit currency/precision policy; define transfer/refund/split semantics before balance reporting.
- Preserve upstream source notices and record derived files.
- Implement analytics as a standalone feature; no runtime dependency on George · Finance.

**Decisions still needed**

New Firebase project versus a specifically designated existing standalone project; region; database selection; and billing configuration for the selected services. No remote Firebase resources have been created or changed.

**Official references checked, 2 November 2026**

- [SQL Connect overview](https://firebase.google.com/docs/sql-connect)
- [SQL Connect pricing](https://firebase.google.com/docs/sql-connect/pricing)
- [Firestore aggregation behavior](https://firebase.google.com/docs/firestore/query-data/aggregation-queries)
- [Firebase project isolation and shared resources](https://firebase.google.com/docs/projects/learn-more)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
