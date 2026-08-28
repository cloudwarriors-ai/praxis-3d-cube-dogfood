// Purpose: pin the repository-owned automation and branch-authority contract.
// Boundary: read-only validation of committed policy/workflow files; no remote or runtime mutation.
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const policy = JSON.parse(readFileSync('battlestation.json', 'utf8'))
const workflow = readFileSync('.github/workflows/verify.yml', 'utf8')

assert.equal(policy.version, 2)
assert.equal(policy.governanceProfile, 'advisory-v1')
assert.equal(policy.integrationBranch, 'dev')
assert.equal(policy.productionBranch, 'main')
assert.deepEqual(policy.requiredChecks, ['verify'])
assert.equal(policy.deployment, null)
assert.equal(policy.rollback, null)
assert.equal(policy.autonomy.autoMergeToIntegration, true)
assert.equal(policy.autonomy.productionMerge, 'human-only')
assert.equal(policy.autonomy.localModelWriteAccess, false)

assert.match(workflow, /pull_request:\n\s+branches: \[dev, main\]/)
assert.match(workflow, /push:\n\s+branches: \[dev\]/)
for (const check of policy.requiredChecks) {
  assert.match(workflow, new RegExp(`\\n  ${check}:\\n`))
}

for (const retired of [
  '.github/workflows/autopilot-intake.yml',
  '.github/workflows/autopilot-runner.yml',
  '.github/workflows/preview-teardown.yml',
]) {
  assert.equal(existsSync(retired), false, `${retired} must remain retired`)
}

console.log('repository automation contract verified')
