properties([buildDiscarder(logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '', numToKeepStr: '5'))])

node {

  checkout scm

  stage("Pushing data to S3.") {

    s3Upload acl: 'PublicRead', bucket: 'revcontent-labs', includePathPattern: '*', path: BUILD_ID, workingDir: 'htdocs'

  }

  stage("Updating Cloudfront Path") {

  }

  stage("Clearing CDN") {

  }

}
