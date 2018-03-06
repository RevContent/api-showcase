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


node {

  checkout scm

  stage("Pushing data to S3.") {

    commit = sh (
      script: 'git --no-pager show -s --format=medium',
      returnStdout: true
    ).trim()

    slackSend channel: 'test', message: 'Labs ' + BRANCH_NAME + ' ' + BUILD_ID + ': Deploying to S3. ```' + commit + '```\n' + JOB_URL
    s3Upload acl: 'PublicRead', bucket: 'revcontent-labs', excludePathPattern: '**/*.sh', file: 'htdocs/', path: BRANCH_NAME + "/" + BUILD_ID

  }

  stage("Updating Cloudfront Path") {

    slackSend channel: 'test', message: 'Labs ' + BRANCH_NAME + ' ' + BUILD_ID + ': Updating Cloudfront Path.'

    def exec = """
    aws cloudfront get-distribution --id E1GBG7FZ0VP3CL > cloudfront.json
    sed -i 's#\\("OriginPath": "\\).*\\("\\),#\\1/${BRANCH_NAME}/${BUILD_ID}\\2,#g' cloudfront.json
    aws cloudfront update-distribution --id E1GBG7FZ0VP3CL --distribution-config file://./cloudfront.json
    """

    sh exec    
    
  }

  stage("Clearing CDN") {

    slackSend channel: 'test', message: 'Labs ' + BRANCH_NAME + ' ' + BUILD_ID + ': Clearing CDN.'
    sh 'aws cloudfront create-invalidation --id E1GBG7FZ0VP3CL --paths "*"'
    slackSend channel: 'test', message: 'Labs ' + BRANCH_NAME + ' ' + BUILD_ID + ': Deploy Complete.'

  }

  cleanWs()

}
