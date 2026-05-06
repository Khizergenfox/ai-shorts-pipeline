// Quick auth diagnostic. Run after dropping the service-account JSON in
// place to confirm the credentials are valid and the project is reachable.
//
//   node scripts/test-vertex-auth.mjs
import { ping } from "./lib/vertex.mjs";

try {
  const info = await ping();
  console.log("✅  Vertex auth OK");
  console.log(`   Project:    ${info.projectId}`);
  console.log(`   Location:   ${info.location}`);
  console.log(`   SA file:    ${info.saKeyPath}`);
  console.log(`   Token:      ${info.tokenPrefix}`);
} catch (err) {
  console.error("❌  Vertex auth failed:", err.message);
  process.exit(1);
}
