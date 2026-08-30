#!/usr/bin/env bash
# Point a Coolify application at a docker image tag and deploy it, waiting for
# the deployment to finish. Exits non-zero if the deployment fails or times out.
# Usage: coolify-deploy.sh <application-uuid> <tag>
set -euo pipefail

uuid="$1"
tag="$2"
max_attempts=60
poll_interval_seconds=10

curl -sf -X PATCH \
  -H "Authorization: Bearer ${COOLIFY_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"docker_registry_image_tag\": \"${tag}\"}" \
  "${COOLIFY_URL}/applications/${uuid}" >/dev/null

deployment_uuid=$(curl -sf -X POST \
  -H "Authorization: Bearer ${COOLIFY_TOKEN}" \
  "${COOLIFY_URL}/deploy?uuid=${uuid}&force=true" | jq -r '.deployments[0].deployment_uuid // empty')

if [ -z "$deployment_uuid" ]; then
  echo "No deployment was queued for application ${uuid} (tag ${tag})" >&2
  exit 1
fi

echo "Deployment ${deployment_uuid} queued for ${uuid} -> ${tag}, waiting for it to finish..." >&2

for _ in $(seq 1 "$max_attempts"); do
  status=$(curl -sf -H "Authorization: Bearer ${COOLIFY_TOKEN}" \
    "${COOLIFY_URL}/deployments/${deployment_uuid}" | jq -r '.status')
  echo "  status: ${status}" >&2

  case "$status" in
    finished)
      exit 0
      ;;
    failed|cancelled-by-user)
      echo "Deployment ${deployment_uuid} for ${uuid} did not succeed (status: ${status})" >&2
      exit 1
      ;;
  esac

  sleep "$poll_interval_seconds"
done

echo "Timed out waiting for deployment ${deployment_uuid} (application ${uuid})" >&2
exit 1
