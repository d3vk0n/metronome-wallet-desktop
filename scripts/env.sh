#!/bin/bash

cat > .env << EOF
DEBUG=$DEBUG
ENABLED_CHAINS=$ENABLED_CHAINS
SENTRY_DSN=$SENTRY_DSN
TRACKING_ID=$TRACKING_ID
EOF
