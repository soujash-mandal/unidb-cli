const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 7432;

function parsePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Port must be an integer between 1 and 65535");
  return port;
}

export function parseArgs(argv, env = process.env) {
  const config = {
    host: env.UNIDB_HOST || DEFAULT_HOST,
    port: parsePort(env.UNIDB_PORT || String(DEFAULT_PORT)),
    ca: env.UNIDB_TLS_CA_FILE,
    cert: env.UNIDB_TLS_CERT_FILE,
    key: env.UNIDB_TLS_KEY_FILE,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") { config.help = true; continue; }
    if (!["--host", "--port", "--ca", "--cert", "--key"].includes(arg)) throw new Error("Unknown option: " + arg);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) throw new Error("Missing value for " + arg);
    i += 1;
    if (arg === "--port") config.port = parsePort(value);
    if (arg === "--host") config.host = value;
    if (arg === "--ca") config.ca = value;
    if (arg === "--cert") config.cert = value;
    if (arg === "--key") config.key = value;
  }
  if (!config.host.trim()) throw new Error("Host must not be empty");
  const loopback = config.host === "localhost" || config.host === "::1" || config.host === "127.0.0.1" || config.host.startsWith("127.");
  const tlsCount = [config.ca, config.cert, config.key].filter(Boolean).length;
  if (!loopback && tlsCount !== 3) throw new Error("Remote connections require mutual TLS. Provide --ca, --cert, and --key or the matching UNIDB_TLS_*_FILE environment variables.");
  if (loopback && tlsCount !== 0 && tlsCount !== 3) throw new Error("Provide all three TLS files: --ca, --cert, and --key.");
  config.useTls = tlsCount === 3;
  return config;
}

export const HELP = "UniDB CLI\n\nUsage: unidb [options]\n\nOptions:\n  --host <host>  Server host (default: 127.0.0.1)\n  --port <port>  Server port (default: 7432)\n  --ca <file>    Trusted CA certificate for mutual TLS\n  --cert <file>  Client certificate for mutual TLS\n  --key <file>   Client private key for mutual TLS\n  -h, --help     Show this help\n\nEnvironment: UNIDB_HOST, UNIDB_PORT, UNIDB_TLS_CA_FILE, UNIDB_TLS_CERT_FILE, UNIDB_TLS_KEY_FILE\n\nEnter one statement per line. Type \\q or press Ctrl+D to exit.\n";
