# End-to-end smoke run

`smoke.cjs` drives Chromium through the real application: admin sign-in and product
registration with an image upload, the public catalogue (filters, search, sorting, view
counter), the login gate, the wishlist, a purchase request created from the wishlist and
paid from the wallet, notices, hiding a product, header search and logout. 34 checks.

Run everything (backend on an in-memory H2 database, Vite dev server, the scenario):

```bash
./script/e2e-smoke.sh
```

Screenshots land in `front/e2e/shots/`. The seed accounts (`admin@ruxpress.com` /
`admin1234`, `test1@test.com` / `test1`) come from the backend's `local` profile, so never
point the script at a real database.
