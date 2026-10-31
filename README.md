# UniDB CLI

The official interactive terminal client for a running UniDB server. The CLI is a client only: it does not start the server, manage database files, or replace the `unidb-node` application library.

## Requirements

- Node.js 18 or newer
- A running UniDB server (default TCP port: `7432`)

## Install

After the package is published to npm:

```bash
npm install -g unidb-cli
unidb
```

For local development from this repository:

```bash
npm install
npm start
```

## Connect

The default connection is local loopback at `127.0.0.1:7432`:

```bash
unidb
```

Override the host and port:

```bash
unidb --host 127.0.0.1 --port 7432
```

The same settings can be provided through `UNIDB_HOST` and `UNIDB_PORT`.

### Remote connections

UniDB requires mutual TLS for non-loopback connections. Supply the CA certificate, client certificate, and client private key:

```bash
unidb --host db.example.com --port 7432 \
  --ca ./certs/ca.pem \
  --cert ./certs/client.pem \
  --key ./certs/client-key.pem
```

Alternatively, set `UNIDB_TLS_CA_FILE`, `UNIDB_TLS_CERT_FILE`, and `UNIDB_TLS_KEY_FILE`. The CLI verifies the server certificate and presents the client certificate. It does not fall back to plaintext for remote hosts.

Keep private keys secure and do not commit certificates or keys to source control.

## Use

Once connected, enter one statement per line:

```sql
CREATE TABLE users (id INT, name TEXT);
INSERT INTO users VALUES (1, 'Soujash');
SELECT * FROM users;
```

The initial CLI supports the UniDB V1 query subset: `CREATE TABLE`, `INSERT`, and `SELECT *`. Results are displayed as readable tables. Query errors are shown without ending the session.

Type `\\q`, `quit`, or `exit`, or press Ctrl+D to disconnect.

## Development

```bash
npm test
npm pack --dry-run
```

The CLI speaks the public UniDB line-delimited JSON connection protocol. Each request is one UTF-8 SQL statement terminated by a newline (maximum 64 KiB); each response is one JSON object terminated by a newline.

## Release

The release workflow runs when a GitHub Release is published. Configure the repository secret `NPM_TOKEN` with an npm automation token that can publish `unidb-cli`, then publish a GitHub Release for the package version. The workflow runs the test suite before publishing.

## Scope

- UniDB Server owns database execution and storage.
- `unidb-cli` is the human-facing terminal client.
- `unidb-node` remains the Node.js application client library.

Homebrew distribution will be documented after its tap and formula are published.
