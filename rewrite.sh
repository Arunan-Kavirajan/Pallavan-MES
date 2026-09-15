#!/bin/bash
git filter-branch -f --env-filter '
if [ "$GIT_AUTHOR_EMAIL" = "antigravity@google.com" ] || [ "$GIT_COMMITTER_EMAIL" = "antigravity@google.com" ]; then
    export GIT_AUTHOR_NAME="Arunan Kavirajan"
    export GIT_AUTHOR_EMAIL="arunan.kavirajan@gmail.com"
    export GIT_COMMITTER_NAME="Arunan Kavirajan"
    export GIT_COMMITTER_EMAIL="arunan.kavirajan@gmail.com"
fi
' -- --all
