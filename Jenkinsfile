#!groovy
import groovy.json.JsonOutput

// Build parameters
properties([
  disableConcurrentBuilds(),
  parameters([
    booleanParam(name: 'SkipLinting', defaultValue: false, description: 'Skip Linting'),
    booleanParam(name: 'SkipUnitTests', defaultValue: false, description: 'Skip Unit Tests'),
    booleanParam(name: 'SkipE2ETests', defaultValue: false, description: 'Skip End-to-End Tests'),
    booleanParam(name: 'SkipPerformanceTests', defaultValue: false, description: 'Skip Performance Tests'),
    booleanParam(name: 'SkipBuild', defaultValue: false, description: 'Skip Application Build')
  ])
])

def startTime = 0
results = [:]
currStage = ''
message = ''
unitTestsSuccess = false
e2eTestsSuccess = false
buildSuccess = false

node('any') {

  wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {
    
    stage('Checkout') {
      currStage = env.STAGE_NAME
      startTime = sh(script: 'echo `date`', returnStdout: true).trim()
      checkout scm
      
      // Get commit info for build metadata
      env.GIT_COMMIT_MSG = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
      env.GIT_COMMIT_AUTHOR = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
      env.GIT_COMMIT_HASH = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
      
      echo "Building commit: ${env.GIT_COMMIT_MSG} by ${env.GIT_COMMIT_AUTHOR}"
      addSlackMessage(env.STAGE_NAME, true, '')
    }

    try {

      stage('Load Credentials') {
        currStage = env.STAGE_NAME
        
        // Load credentials from the auro text file
        withCredentials([file(credentialsId: 'auro', variable: 'AURO_CREDS_FILE')]) {
          def props = readProperties file: env.AURO_CREDS_FILE
          
          // Set environment variables from the credentials file
          env.JWT_SECRET = props.JWT_SECRET
          env.MONGODB_URI = props.MONGODB_URI
          env.CLOUDINARY_CLOUD_NAME = props.CLOUDINARY_CLOUD_NAME
          env.CLOUDINARY_API_KEY = props.CLOUDINARY_API_KEY
          env.CLOUDINARY_API_SECRET = props.CLOUDINARY_API_SECRET
          env.MAILTRAP_TOKEN = props.MAILTRAP_TOKEN
          env.MAILTRAP_ENDPOINT = props.MAILTRAP_ENDPOINT
          env.SLACK_WEBHOOK_URL = props.SLACK_WEBHOOK_URL
          
          echo 'Credentials loaded successfully from auro file'
        }
        
        addSlackMessage(env.STAGE_NAME, true, '')
      }

      //NodeJS 20 Docker Image
      def docker_image_name = 'node:20-alpine'
      
      stage('Install Dependencies') {
        currStage = env.STAGE_NAME
        
        parallel(
          'Backend Dependencies': {
            dir('backend') {
              sh 'npm ci'
            }
          },
          'Frontend Dependencies': {
            dir('frontend') {
              sh 'npm ci'
              sh 'npx playwright install --with-deps'
            }
          },
          'Root Dependencies': {
            sh 'npm ci'
          }
        )
        
        addSlackMessage(env.STAGE_NAME, true, '')
      }

      stage("Parallel: Lint & Code Quality")
      {
        if (!params.SkipLinting) {
          parallel(
            failFast: false,

            "backend-lint": {
              stage('Backend Lint') {
                currStage = env.STAGE_NAME
                dir('backend') {
                  try {
                    sh 'npm run lint:check'
                  } catch (Exception e) {
                    addSlackMessage(env.STAGE_NAME, false, e.toString())
                    throw e
                  }
                }
                addSlackMessage(env.STAGE_NAME, true, '')
              }
            },

            "frontend-lint": {
              stage('Frontend Lint') {
                currStage = env.STAGE_NAME
                dir('frontend') {
                  try {
                    sh 'npm run lint:check'
                  } catch (Exception e) {
                    addSlackMessage(env.STAGE_NAME, false, e.toString())
                    throw e
                  }
                }
                addSlackMessage(env.STAGE_NAME, true, '')
              }
            }
          )
        } else {
          echo 'Skipping Linting.'
        }
      }

      stage("Parallel: Unit & Integration Tests")
      {
        if (!params.SkipUnitTests) {
          parallel(
            failFast: false,

            "backend-tests": {
              stage('Backend Tests') {
                currStage = env.STAGE_NAME
                dir('backend') {
                  try {
                    sh 'npm run test:coverage'
                    unitTestsSuccess = true
                  } catch (Exception e) {
                    addSlackMessage(env.STAGE_NAME, false, e.toString())
                    throw e
                  } finally {
                    // Archive test results and coverage
                    archiveArtifacts artifacts: 'coverage/**/*', allowEmptyArchive: true
                  }
                }
                addSlackMessage(env.STAGE_NAME, true, '')
              }
            },

            "frontend-tests": {
              stage('Frontend Unit Tests') {
                currStage = env.STAGE_NAME
                dir('frontend') {
                  try {
                    sh 'npm run test:ci'
                  } catch (Exception e) {
                    addSlackMessage(env.STAGE_NAME, false, e.toString())
                    throw e
                  } finally {
                    // Archive test results and coverage
                    archiveArtifacts artifacts: 'coverage/**/*', allowEmptyArchive: true
                  }
                }
                addSlackMessage(env.STAGE_NAME, true, '')
              }
            }
          )
        } else {
          echo 'Skipping Unit Tests.'
        }
      }

      stage('Build Application') {
        if (!params.SkipBuild) {
          currStage = env.STAGE_NAME
          try {
            sh 'npm run build'
            buildSuccess = true
            echo 'Application built successfully'
            
            // Archive build artifacts
            archiveArtifacts artifacts: 'frontend/dist/**/*', allowEmptyArchive: true
          } catch (Exception e) {
            addSlackMessage(env.STAGE_NAME, false, e.toString())
            throw e
          }
          addSlackMessage(env.STAGE_NAME, true, '')
        } else {
          echo 'Skipping Application Build.'
        }
      }

      stage('End-to-End Tests') {
        if (!params.SkipE2ETests && (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'develop' || env.CHANGE_ID)) {
          currStage = env.STAGE_NAME
          try {
            // Start the backend server in background
            dir('backend') {
              sh 'nohup npm start > ../backend.log 2>&1 & echo $! > ../backend.pid'
            }
            
            // Start the frontend server in background  
            dir('frontend') {
              sh 'nohup npm run preview > ../frontend.log 2>&1 & echo $! > ../frontend.pid'
            }
            
            // Wait for servers to start
            sleep 10
            
            // Run E2E tests
            dir('frontend') {
              sh 'npm run test:e2e:ci'
              e2eTestsSuccess = true
            }
          } catch (Exception e) {
            addSlackMessage(env.STAGE_NAME, false, e.toString())
            message = 'Check E2E Report: <' + env.BUILD_URL + 'artifact/frontend/playwright-report/index.html| E2E Report>'
            throw e
          } finally {
            // Stop servers
            sh '''
              if [ -f backend.pid ]; then
                kill $(cat backend.pid) || true
                rm backend.pid
              fi
              if [ -f frontend.pid ]; then
                kill $(cat frontend.pid) || true
                rm frontend.pid
              fi
            '''
            
            // Archive E2E test artifacts
            archiveArtifacts artifacts: 'frontend/test-results/**/*', allowEmptyArchive: true
            archiveArtifacts artifacts: 'frontend/playwright-report/**/*', allowEmptyArchive: true
            archiveArtifacts artifacts: 'backend.log,frontend.log', allowEmptyArchive: true
          }
          addSlackMessage(env.STAGE_NAME, true, '')
        } else {
          echo 'Skipping End-to-End Tests.'
        }
      }

      stage('Performance Tests') {
        if (!params.SkipPerformanceTests && (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'develop')) {
          currStage = env.STAGE_NAME
          try {
            // Start servers for performance testing
            dir('backend') {
              sh 'nohup npm start > ../backend-perf.log 2>&1 & echo $! > ../backend-perf.pid'
            }
            
            dir('frontend') {
              sh 'nohup npm run preview > ../frontend-perf.log 2>&1 & echo $! > ../frontend-perf.pid'
            }
            
            // Wait for servers to start
            sleep 15
            
            dir('frontend') {
              // Run performance tests
              sh 'npm run test:perf:ci'
              sh 'npm run test:lighthouse:ci'
              sh 'npm run test:memory-leaks:ci'
            }
          } catch (Exception e) {
            addSlackMessage(env.STAGE_NAME, false, e.toString())
            throw e
          } finally {
            // Stop servers
            sh '''
              if [ -f backend-perf.pid ]; then
                kill $(cat backend-perf.pid) || true
                rm backend-perf.pid
              fi
              if [ -f frontend-perf.pid ]; then
                kill $(cat frontend-perf.pid) || true
                rm frontend-perf.pid
              fi
            '''
            
            // Archive performance test results
            archiveArtifacts artifacts: 'frontend/lighthouse-reports/**/*', allowEmptyArchive: true
            archiveArtifacts artifacts: 'backend-perf.log,frontend-perf.log', allowEmptyArchive: true
          }
          addSlackMessage(env.STAGE_NAME, true, '')
        } else {
          echo 'Skipping Performance Tests.'
        }
      }

      stage('Test Summary') {
        currStage = env.STAGE_NAME
        try {
          // Run all tests summary from root
          sh 'npm run test:coverage'
          echo 'All tests completed successfully'
        } catch (Exception e) {
          echo "Some tests failed, but build continues: ${e.message}"
        }
        addSlackMessage(env.STAGE_NAME, true, '')
      }
    }

    catch(Exception e) {
      addSlackMessage(currStage, false, message != '' ? message : e.toString())
      throw e
    }

    finally {
      // Clean up any remaining processes
      sh '''
        pkill -f "npm start" || true
        pkill -f "npm run preview" || true
        pkill -f "node.*server.js" || true
      '''
      
      // Clean up temporary files
      sh 'rm -f *.pid *.log'

      stage('Notify Slack') {
        def jobUrl = env.BUILD_URL
        def testResultMessage = '*Auro Connect Pipeline Results*\n'
        testResultMessage += 'Branch: ' + env.BRANCH_NAME + '\n'
        testResultMessage += 'Commit: ' + env.GIT_COMMIT_MSG + '\n'
        testResultMessage += 'Author: ' + env.GIT_COMMIT_AUTHOR + '\n'
        testResultMessage += 'Build: ' + "<${jobUrl}|${env.BUILD_NUMBER}>" + '\n'
        testResultMessage += 'Time Triggered: ' + startTime + '\n'
        testResultMessage += 'Duration: ' + currentBuild.durationString + '\n'
        
        def sidebarColor = '#50C878'  // Green for success
        def hasFailures = false

        results.each { key, res ->
          def testEmoji = ':white_check_mark:'
          if (res['Success']) {
            testResultMessage += "\n${testEmoji} ${key}"
          }
          else {
            hasFailures = true
            sidebarColor = '#D2042D'  // Red for failure
            testEmoji = ':x:'
            testResultMessage += "\n${testEmoji} ${key}"
            if (res['message'] && res['message'] != '') {
              testResultMessage += "\n  ${res['message']}"
            }
          }
        }

        // Set overall build status color
        if (hasFailures) {
          sidebarColor = '#D2042D'
        } else if (currentBuild.result == 'UNSTABLE') {
          sidebarColor = '#FFA500'  // Orange for unstable
        }

        print(testResultMessage)
        
        // Send Slack notification using webhook
        def slackPayload = [
          channel: "#auro-connect",
          text: testResultMessage,
          color: sidebarColor
        ]
        
        def payload = JsonOutput.toJson(slackPayload)
        
        sh """
          curl -X POST -H 'Content-type: application/json' \\
          --data '${payload}' \\
          ${env.SLACK_WEBHOOK_URL}
        """
      }
    }
  }
}

def addSlackMessage(stage, status, message) {
  results[stage] = [:]
  results[stage] = ['Success': status]
  results[stage]['message'] = message
} 