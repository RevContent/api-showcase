properties([buildDiscarder(logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '', numToKeepStr: '5'))])

node {

  checkout scm

  stage("Pushing data to S3.") {

    commit = sh (
      script: 'git --no-pager show -s --format=medium',
      returnStdout: true
    ).trim()

    slackSend channel: 'test', message: 'Labs ' + BUILD_ID + ': Deploying to S3. ```' + commit + '```\n' + JOB_URL
    s3Upload acl: 'PublicRead', bucket: 'revcontent-labs', excludePathPattern: '**/*.sh', file: 'htdocs/', path: BUILD_ID

  }

  stage("Updating Cloudfront Path") {

    slackSend channel: 'test', message: 'Labs ' + BUILD_ID + ': Updating Cloudfront Path.'

  }

  stage("Clearing CDN") {

    slackSend channel: 'test', message: 'Labs ' + BUILD_ID + ': Clearing CDN.'
    slackSend channel: 'test', message: 'Labs ' + BUILD_ID + ': Deploy Complete.'

  }

}
