#!/bin/bash
hash git 2> /dev/null || {
  echo "You must have git installed to bootstrap"
  exit -1
}

git submodule update --init
