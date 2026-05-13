# EH-038 Feature Flags Rollout + Rollback Playbook

Date: 2026-05-09

## Feature flags
- `NEXT_PUBLIC_FF_PIPELINE_BOARD`
- `NEXT_PUBLIC_FF_MESSAGING`
- `NEXT_PUBLIC_FF_NOTIFICATIONS_CENTER`
- `NEXT_PUBLIC_FF_SETTINGS_SECURITY`
- `NEXT_PUBLIC_FF_2FA`
- `FF_2FA`

## Rollout stages
1. Stage 0 (off by default): all flags `0`.
2. Stage 1 (internal validation): enable one module at a time in staging.
3. Stage 2 (limited production exposure): enable low-risk modules first.
4. Stage 3 (full enablement): enable all flags after QA and metrics pass.

## Runtime gating implemented
- Sidebar navigation hides disabled modules.
- Protected routes render `NoAccessState` when module flag is off.

## Rollback procedure
1. Set affected module flag to `0`.
2. Verify sidebar link disappears and route shows no-access state.
3. Confirm related API remains unaffected for existing core flows.
4. Record incident and remediation in release notes.

## Ownership
- Engineering: runtime safety + release toggles.
- QA: staged verification checklists.
- Product: rollout timing and signoff.
