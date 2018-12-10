#!/usr/bin/env sh

export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

nvm install node
npm config set user 0
npm config set unsafe-perm true
npm install -g npm
npm install -g npx