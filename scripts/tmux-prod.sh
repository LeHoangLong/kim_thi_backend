#!/bin/bash
cd /opt/app
npx migrate
npm run prod
sleep infinity