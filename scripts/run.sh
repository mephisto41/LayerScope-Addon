#!/bin/bash
if [ ! -d "sdk" ]; then
  echo "Must download the sdk first. See the INSTALLING for more info"
  exit
fi

cd sdk
. ./bin/activate
cd ..

if [ -n "$1" ]; then
  cfx run -b $1
else
  cfx run
fi
