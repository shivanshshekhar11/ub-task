import 'dotenv/config'; // must be first — populates process.env before config reads it
import { app } from './app';
import { config, getConfigErrors } from './config';

// ── Fail-fast config validation ───────────────────────────────────────────────
// N and X are only meaningful for the discount system, but a misconfigured
// value (0, negative, non-integer) causes silent arithmetic bugs. Exit early
// with a clear message rather than serving broken behaviour.
const configErrors = getConfigErrors();
if (configErrors.length > 0) {
  console.error('\n Invalid configuration — server will not start:\n');
  configErrors.forEach((e) => console.error(`   • ${e}`));
  console.error('\nFix the environment variables and restart.\n');
  process.exit(1);
}

app.listen(config.PORT, () => {
  console.log(`Server running at http://localhost:${config.PORT}`);
  console.log(`API docs    at http://localhost:${config.PORT}/api-docs`);
  console.log(`Discount interval: every ${config.DISCOUNT_ORDER_INTERVAL} orders @ ${config.DISCOUNT_PERCENT}% off`);
});
