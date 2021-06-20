#!/bin/bash
if [ -z $DEBUG ]; then
    tmux new -s app -d /opt/app/scripts/tmux-prod.sh
else 
    tmux new -s app -d /opt/app/scripts/tmux-dev.sh
fi
sleep infinity