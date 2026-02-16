# NOVA operation fees (NEAR)

NOVA operations require small NEAR token deposits. Approximate costs:

| Operation | Approx. cost |
|-----------|--------------|
| **register_group** / Register group | ~0.1 NEAR |
| **add_group_member** / Add member | ~0.0005 NEAR |
| **revoke_group_member** / Revoke member (includes key rotation) | ~0.0005 NEAR |
| Retrieve file | ~0.001 NEAR |
| Upload file | ~0.01 NEAR |
| **claim_token** (internal) | ~0.001 NEAR |
| **record_transaction** / record_near_transaction | ~0.002 NEAR |

Use `sdk.estimateFee('register_group')` (and similar) for exact amounts; on-chain storage can make actual costs higher than docs.
