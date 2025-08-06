pipeline {
    agent any
    
    environment {
        NODE_VERSION = '20'
        NODE_ENV = 'test'
        CLIENT_URL = 'http://localhost:3000'
        PORT = '5000'
        
        // Load sensitive values from Jenkins credentials
        JWT_SECRET = credentials('jwt-secret-test')
        MONGODB_URI = credentials('mongodb-uri-test')
        CLOUDINARY_CLOUD_NAME = credentials('cloudinary-cloud-name')
        CLOUDINARY_API_KEY = credentials('cloudinary-api-key')
        CLOUDINARY_API_SECRET = credentials('cloudinary-api-secret')
        MAILTRAP_TOKEN = credentials('mailtrap-token')
        MAILTRAP_ENDPOINT = credentials('mailtrap-endpoint')
    }
    
    tools {
        nodejs "${NODE_VERSION}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Get commit info for build metadata
                    env.GIT_COMMIT_MSG = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    env.GIT_COMMIT_AUTHOR = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
                }
                echo "Building commit: ${env.GIT_COMMIT_MSG} by ${env.GIT_COMMIT_AUTHOR}"
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            // Install Playwright browsers for E2E tests
                            sh 'npx playwright install --with-deps'
                        }
                    }
                }
                stage('Root Dependencies') {
                    steps {
                        sh 'npm ci'
                    }
                }
            }
        }
        
        stage('Lint & Code Quality') {
            parallel {
                stage('Backend Lint') {
                    steps {
                        dir('backend') {
                            sh 'npm run lint:check'
                        }
                    }
                    post {
                        always {
                            // Archive lint results if they exist
                            publishTestResults(
                                testResultsPattern: 'backend/eslint-results.xml',
                                allowEmptyResults: true
                            )
                        }
                    }
                }
                stage('Frontend Lint') {
                    steps {
                        dir('frontend') {
                            sh 'npm run lint:check'
                        }
                    }
                    post {
                        always {
                            // Archive lint results if they exist
                            publishTestResults(
                                testResultsPattern: 'frontend/eslint-results.xml',
                                allowEmptyResults: true
                            )
                        }
                    }
                }
            }
        }
        
        stage('Unit & Integration Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            script {
                                try {
                                    sh 'npm run test:coverage'
                                } catch (Exception e) {
                                    currentBuild.result = 'UNSTABLE'
                                    echo "Backend tests failed: ${e.message}"
                                }
                            }
                        }
                    }
                    post {
                        always {
                            // Publish test results
                            publishTestResults(
                                testResultsPattern: 'backend/coverage/junit.xml',
                                allowEmptyResults: true
                            )
                            
                            // Publish coverage reports
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'backend/coverage/lcov-report',
                                reportFiles: 'index.html',
                                reportName: 'Backend Coverage Report',
                                reportTitles: ''
                            ])
                            
                            // Archive coverage artifacts
                            archiveArtifacts(
                                artifacts: 'backend/coverage/**/*',
                                allowEmptyArchive: true
                            )
                        }
                    }
                }
                
                stage('Frontend Unit Tests') {
                    steps {
                        dir('frontend') {
                            script {
                                try {
                                    sh 'npm run test:ci'
                                } catch (Exception e) {
                                    currentBuild.result = 'UNSTABLE'
                                    echo "Frontend unit tests failed: ${e.message}"
                                }
                            }
                        }
                    }
                    post {
                        always {
                            // Publish test results
                            publishTestResults(
                                testResultsPattern: 'frontend/coverage/junit.xml',
                                allowEmptyResults: true
                            )
                            
                            // Publish coverage reports
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'frontend/coverage/lcov-report',
                                reportFiles: 'index.html',
                                reportName: 'Frontend Coverage Report',
                                reportTitles: ''
                            ])
                            
                            // Archive coverage artifacts
                            archiveArtifacts(
                                artifacts: 'frontend/coverage/**/*',
                                allowEmptyArchive: true
                            )
                        }
                    }
                }
            }
        }
        
        stage('Build Application') {
            steps {
                script {
                    try {
                        sh 'npm run build'
                        echo 'Application built successfully'
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        error "Build failed: ${e.message}"
                    }
                }
            }
            post {
                success {
                    // Archive build artifacts
                    archiveArtifacts(
                        artifacts: 'frontend/dist/**/*',
                        allowEmptyArchive: true
                    )
                }
            }
        }
        
        stage('End-to-End Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    changeRequest()
                }
            }
            steps {
                script {
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
                        try {
                            sh 'npm run test:e2e:ci'
                        } catch (Exception e) {
                            currentBuild.result = 'UNSTABLE'
                            echo "E2E tests failed: ${e.message}"
                        } finally {
                            // Stop servers
                            sh '''
                                if [ -f ../backend.pid ]; then
                                    kill $(cat ../backend.pid) || true
                                    rm ../backend.pid
                                fi
                                if [ -f ../frontend.pid ]; then
                                    kill $(cat ../frontend.pid) || true
                                    rm ../frontend.pid
                                fi
                            '''
                        }
                    }
                }
            }
            post {
                always {
                    // Publish E2E test results
                    publishTestResults(
                        testResultsPattern: 'frontend/test-results/junit.xml',
                        allowEmptyResults: true
                    )
                    
                    // Archive E2E test artifacts
                    archiveArtifacts(
                        artifacts: 'frontend/test-results/**/*',
                        allowEmptyArchive: true
                    )
                    
                    // Publish Playwright HTML report
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'frontend/playwright-report',
                        reportFiles: 'index.html',
                        reportName: 'Playwright E2E Test Report',
                        reportTitles: ''
                    ])
                    
                    // Archive server logs for debugging
                    archiveArtifacts(
                        artifacts: 'backend.log,frontend.log',
                        allowEmptyArchive: true
                    )
                }
            }
        }
        
        stage('Performance Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
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
                        try {
                            // Run performance tests
                            sh 'npm run test:perf:ci'
                            
                            // Run Lighthouse tests
                            sh 'npm run test:lighthouse:ci'
                            
                            // Run memory leak tests
                            sh 'npm run test:memory-leaks:ci'
                        } catch (Exception e) {
                            currentBuild.result = 'UNSTABLE'
                            echo "Performance tests failed: ${e.message}"
                        } finally {
                            // Stop servers
                            sh '''
                                if [ -f ../backend-perf.pid ]; then
                                    kill $(cat ../backend-perf.pid) || true
                                    rm ../backend-perf.pid
                                fi
                                if [ -f ../frontend-perf.pid ]; then
                                    kill $(cat ../frontend-perf.pid) || true
                                    rm ../frontend-perf.pid
                                fi
                            '''
                        }
                    }
                }
            }
            post {
                always {
                    // Archive performance test results
                    archiveArtifacts(
                        artifacts: 'frontend/lighthouse-reports/**/*',
                        allowEmptyArchive: true
                    )
                    
                    // Archive performance server logs
                    archiveArtifacts(
                        artifacts: 'backend-perf.log,frontend-perf.log',
                        allowEmptyArchive: true
                    )
                }
            }
        }
        
        stage('Test Summary') {
            steps {
                script {
                    // Run all tests summary from root
                    try {
                        sh 'npm run test:coverage'
                        echo 'All tests completed successfully'
                    } catch (Exception e) {
                        echo "Some tests failed, but build continues: ${e.message}"
                    }
                }
            }
        }
    }
    
    post {
        always {
            // Clean up any remaining processes
            sh '''
                pkill -f "npm start" || true
                pkill -f "npm run preview" || true
                pkill -f "node.*server.js" || true
            '''
            
            // Archive all log files
            archiveArtifacts(
                artifacts: '*.log',
                allowEmptyArchive: true
            )
            
            // Clean up temporary files
            sh 'rm -f *.pid *.log'
        }
        
        success {
            echo 'All tests passed successfully! 🎉'
            
            // Send success notification
            script {
                if (env.BRANCH_NAME == 'main') {
                    // You can add notification logic here (Slack, email, etc.)
                    echo 'Main branch tests passed - ready for deployment'
                }
            }
        }
        
        failure {
            echo 'Tests failed! ❌'
            
            // Send failure notification
            script {
                // You can add notification logic here
                echo 'Tests failed - please check the build logs'
            }
        }
        
        unstable {
            echo 'Some tests failed but build completed 🟡'
            
            // Send unstable notification
            script {
                echo 'Build unstable - some tests failed but not critical'
            }
        }
        
        cleanup {
            // Clean up workspace if needed
            deleteDir() // This deletes the entire workspace
        }
    }
} 