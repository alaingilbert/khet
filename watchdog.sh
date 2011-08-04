#!/bin/bash
# */1 * * * * bash /var/www/khet/watchdog.sh

PROC=`ps -A | grep node`;

if [ ${#PROC} -eq 0 ]; then
   echo "DOWN $(date)" >> /var/log/test.log;
   `nohup /usr/local/bin/node /var/www/khet/backend.js > /var/www/khet/khet.log 2>&1 &`;
else
   echo "Up $(date)" >> /var/log/test.log;
fi

exit 0;
