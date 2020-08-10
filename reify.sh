#!/bin/sh

set -e
set -x

# checkout target branch to build
BRANCH=${1-master}

echo "Switching to $BRANCH"

git switch "$BRANCH"
git pull

REIFIER_BUILD="${REIFIER_BUILD-yarn && yarn build}"

echo "Now reifying..."
eval "$REIFIER_BUILD"

## checkout or switch to orphan branch
ORPHAN=reified

## does remote has an orphan branch already?
if git ls-remote --exit-code . "origin/$ORPHAN"; then
    git switch -f $ORPHAN
    git pull
else
    git switch -f --orphan $ORPHAN
fi


## working directory may track some files due to build script
git rm -r --cached --ignore-unmatch .

REIFIER_PATTERN="${REIFIER_PATTERN-*\.bs\.js}"
ARTIFACTS='_artifacts'
SRC="."
DST="${ARTIFACTS}/${BRANCH}"

## clear DST
rm -rf "$DST" && mkdir -p "$DST"

echo "Copying artifacts..."
echo "Pattern: $REIFIER_PATTERN"

## TODO: rsync -> cp ?
find "$SRC" -regex "$REIFIER_PATTERN" ! -path "./${ARTIFACTS}/*" |
    rsync -a --delete --files-from=- . "$DST"

## commit new artifacts

git add --force $ARTIFACTS
git commit -m "Update $BRANCH"

if [ -z "$REIFIER_NOPUSH" ]; then
    git push -u origin $ORPHAN
fi
