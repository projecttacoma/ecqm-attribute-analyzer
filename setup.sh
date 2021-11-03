#!/bin/bash

IG_URL="https://build.fhir.org/ig/HL7/fhir-qi-core/definitions.json.zip"

if [ ! -d "connectathon" ]; then
  echo '> Cloning connectathon repo'
  git clone https://github.com/dbcg/connectathon.git
fi

if [ ! -d "ig" ]; then
  echo '> Fetching IG'
  curl $IG_URL -o ig.zip

  unzip ig.zip -d ig

  rm ig.zip
fi

echo '> Parsing structure definitions'
npm run parse

echo 'DONE'
