#!/usr/bin/env bash

# flagium data sanity cron
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR/.." || exit 1

source venv/bin/activate
export PYTHONPATH=.

# Run and log the output 
python3 scripts/daily_sanity.py >> logs/sanity.log 2>&1
