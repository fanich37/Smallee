#!/bin/bash

mkdir app/blocks/$1
touch app/blocks/$1/$1.jade
touch app/blocks/$1/$1.styl

echo -e "include ../mixins/mixins\n\nmixin $1()\n\t+b.$1&attributes(attributes)" >> app/blocks/$1/$1.jade
echo -e ".$1\n\tdisplay block" >> app/blocks/$1/$1.styl
echo "Block $1 is created"