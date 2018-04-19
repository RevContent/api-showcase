properties([
  authorizationMatrix([
    'hudson.model.Item.Build:stash-qa',
    'hudson.model.Item.Discover:authenticated',
    'hudson.model.Item.Discover:stash-qa',
    'hudson.model.Item.Read:authenticated',
    'hudson.model.Item.Read:stash-qa'
  ]),
  buildDiscarder(logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '', numToKeepStr: '5'))
])

// Setup branching information
switch(BRANCH_NAME){
  case "master":
    CFID = "E1GBG7FZ0VP3CL"
    SLACK = "push-p0"
    break
  case "s1":
    CFID = "E1YWO6UN834KFG"
    SLACK = "push-s1"
    break
  case "s2":
    CFID = "EFV6RO7XMRMO2"
    SLACK = "push-s2"
    break
  case "s4":
    CFID = "E1SPDXUNVS9CY1"
    SLACK = "push-s4"
    break
  case "develop":
    CFID = "E6LFF4BBCLHCL"
    SLACK = "push-s0"
    break;
  default:
    echo "Branch is unknown to build file. Exiting."
    return false
}

node {

  checkout scm

  stage("Pushing data to S3.") {

    commit = sh (
      script: 'git --no-pager show -s --format=medium',
      returnStdout: true
    ).trim()

    slackSend channel: SLACK, message: 'Labs ' + BRANCH_NAME + ' ' + BUILD_ID + ': Deploying to S3. ```' + commit + '```\n' + JOB_URL
    s3Upload acl: 'PublicRead', bucket: 'revcontent-labs', excludePathPattern: '**/*.sh', file: 'htdocs/', path: BRANCH_NAME + "/" + BUILD_ID

  }

  stage("Updating Cloudfront Path") {

    slackSend channel: SLACK, message: 'Labs ' + BRANCH_NAME + ' ' + BUILD_ID + ': Updating Cloudfront Path.'

    /* Ok, we need to talk about some stupid here Amazon. Make me download a format that never translates well to bash
       (JSON) break out of the encapsulating object (Distribution), only to modify a single nested paramater that
       I can't be the only one modifying. Why the fuck isn't this part of your CLI API via a shortcut and I had to
       write Python for a trivial task? And seriously, what's with the ETAG shit? All this to update a path? */

    sh 'aws cloudfront get-distribution --id ' + CFID + ' > cloudfront.json'

    def cf   = readJSON file:'cloudfront.json'
    def etag = cf.ETag

    sh """#!/usr/bin/env python

import json

with open('./cloudfront.json') as cf_file:
  cf = json.load(cf_file)['Distribution']['DistributionConfig']
  cf['Origins']['Items'][0]['OriginPath'] = '/${BRANCH_NAME}/${BUILD_ID}'

with open('./cloudfront.json', 'w') as cf_file:
  json.dump(cf, cf_file)

"""
    sh 'aws cloudfront update-distribution --id ' + CFID + ' --distribution-config file://./cloudfront.json --if-match ' + etag
    sleep 15
  }

  stage("Clearing CDN") {

    slackSend channel: SLACK, message: 'Labs ' + BRANCH_NAME + ' ' + BUILD_ID + ': Clearing CDN.'
    sh 'aws cloudfront create-invalidation --distribution-id ' + CFID + ' --paths "/*"'
    slackSend channel: SLACK, message: 'Labs ' + BRANCH_NAME + ' ' + BUILD_ID + ': Deploy Complete.'

  }

  cleanWs()

}
