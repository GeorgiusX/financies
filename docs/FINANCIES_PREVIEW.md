# Financies interface preview

This preview runs the upstream application interface with fictional expenses. It is a browsing environment while the independent Firebase backend is being designed.

- No sign-in is needed: the build initializes a synthetic explorer session.
- Home, Spend, Inbox, Workspaces, Account, and the expense forms can be explored.
- Sample searches return fixture snapshots. Full filtering and analytics aggregation are not implemented by the sample adapter.
- Saving, payments, banking connections, and other unsupported mutations return an explicit preview error.
- Sample data is reinitialized on startup. Do not enter real financial or account information.
- The local and Vercel static servers restrict outgoing API, image, and frame connections. The preview build disables upstream third-party HTML scripts, crash reporting, and Pusher credentials.

Use the Node/npm/Bun versions declared in package.json, install with `STANDALONE_NEW_DOT=true npm ci`, then:

```sh
npm run build:preview
npm run preview:local
```

Local URL: http://localhost:8082

To package the same built files for Vercel:

```sh
npm run preview:package
```

The resulting `.vercel/output` is a static Build Output API artifact. Deploy it with the Vercel CLI's prebuilt option after confirming the linked Financies project. No Firebase services are required or provisioned by this preview.
