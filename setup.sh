#!/bin/bash

QI_CORE_IG_URL="https://build.fhir.org/ig/HL7/fhir-qi-core/definitions.json.zip"
US_CORE_IG_URL="https://www.hl7.org/fhir/us/core/full-ig.zip"

if [ ! -d "connectathon" ]; then
  echo '> Cloning connectathon repo'
  git clone https://github.com/dbcg/connectathon.git
fi

if [ ! -d "qicore-ig" ]; then
  echo '> Fetching QI-Core IG'
  curl $QI_CORE_IG_URL -o qicore.zip

  unzip qicore.zip -d qicore-ig

  rm qicore.zip
fi

if [ ! -d "uscore-ig" ]; then
  echo '> Fetching US-Core IG'
  curl $US_CORE_IG_URL -o uscore.zip

  unzip uscore.zip -d uscore-ig

  rm uscore.zip
fi

echo '> Parsing structure definitions'
npm run parse

echo 'DONE'
