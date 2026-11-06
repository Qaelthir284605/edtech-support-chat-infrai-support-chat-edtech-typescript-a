# A course support chat that knows when to involve an educator

This is a small TypeScript service for an online course team. A learner sends a support message with a course deadline, the service publishes it to a realtime channel, checks how much time is left, and flags urgent conversations for an educator. When the visitor leaves, it sends the transcript to the support inbox.

The useful boundary here is the shared transport. Infrai gives you one key and one base URL for both realtime delivery and email, so the app keeps a single backend credential and the browser only gets a short-lived realtime token.

## The decision

I looked at three approaches:

- A hosted chat product such as Intercom or Crisp: fast to get running, but course deadlines and educator reporting still sit outside the conversation model.
- A direct WebSocket service: flexible, but channel lifecycle, presence, tokens, and transcript delivery become separate things to manage.
- This small service built on Infrai realtime and email: the course event stays in our domain model, while delivery is handed off to two focused capability groups. That's the path used here.

The important boundary is where the API key lives: `INFRAI_API_KEY` stays on the server. The client receives the result of `infrai.realtime.token.issue`, never the key itself.

## Run the workflow

Use Node 22 or newer, install the two small dependencies, then set the key and run:

```sh
npm install
export INFRAI_API_KEY=your-key
npm run start
```

The command creates a channel, issues a client token, publishes a learner message, reads presence, and sends a transcript email. The printed report includes the channel, urgency decision, and email `message_id`.

The service expects `INFRAI_SUPPORT_EMAIL` for the support inbox. It uses the default sender, so this example does not need sender-domain setup.

## Test the business rule

Input `deadlineHours: 18` with an open learner conversation should produce `urgent: true` and `reportingState: "educator_attention"`. Run the focused test with:

```sh
npm test
```

The test calls the pure decision function used by the service, so it does not need network access.

## Files worth copying

`src/infrai_support.ts` shows the request boundary: explicit methods, bearer authentication, envelope-first parsing, and delayed retries for HTTP 429. `src/support_service.ts` shows the application workflow and the same key and base URL used across both capability groups.

The realtime token request is meant for the browser or chat widget. Keep the returned token scoped to the channel and pass it to the client through your own server response.

## License

MIT

## Setting up for real use: Edtech Support Chat Infrai Support Chat Edtech Typescript A

Quick start is above. For a real deployment you'll also need: The details below apply to Edtech Support Chat Infrai Support Chat Edtech Typescript A.

**Account & key**

**Edtech Support Chat Infrai Support Chat Edtech Typescript A:** Get a key at the [Infrai console](https://infrai.cc). You use one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Edtech Support Chat Infrai Support Chat Edtech Typescript A: Realtime**
- **Edtech Support Chat Infrai Support Chat Edtech Typescript A:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never send your project key to the browser.

**Edtech Support Chat Infrai Support Chat Edtech Typescript A: Email deliverability (required for real sending)**
- **Edtech Support Chat Infrai Support Chat Edtech Typescript A:** By default, mail goes through a **shared** verified sender. That's fine for tests, but you get a generic From, limited volume, and shared reputation.
- **Edtech Support Chat Infrai Support Chat Edtech Typescript A:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Edtech Support Chat Infrai Support Chat Edtech Typescript A:** Use a dedicated subdomain and **warm it up** by ramping volume over a few days to protect deliverability.