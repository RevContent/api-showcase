#!/usr/bin/env python

import json

with open("./cloudfront.json") as cf_file:
  cf = json.load(cf_file)["Distribution"]
  cf["DistributionConfig"]["Origins"]["Items"][0]["OriginPath"] = "taco"

with open("./cloudfront.json") as cf_file:
  json.dump(cf, cf_file)
