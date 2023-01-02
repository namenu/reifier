#!/bin/sh

set -e

mkdir -p public

node index.js $1 $2 $3 > public/index.html

yarn wrangler pages publish public --branch="$2-$3" --commit-dirty=true
