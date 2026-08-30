#!/usr/bin/env bash
# Print the docker_registry_image_tag currently configured on a Coolify application.
# Usage: coolify-current-tag.sh <application-uuid>
set -euo pipefail

uuid="$1"

curl -sf -H "Authorization: Bearer ${COOLIFY_TOKEN}" \
  "${COOLIFY_URL}/applications/${uuid}" | jq -r '.docker_registry_image_tag'
