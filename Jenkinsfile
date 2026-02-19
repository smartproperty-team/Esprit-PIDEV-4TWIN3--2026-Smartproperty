pipeline {
    agent any

    tools {
        nodejs 'node-18'
    }

    environment {
        SONAR_SCANNER_OPTS = "-Xmx512m"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Backend Deps') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Install Frontend Deps') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonarqube-local') {
                    sh 'sonar-scanner'
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }

    post {
        success {
            echo '✅ SonarQube analysis completed successfully'
        }
        failure {
            echo '❌ Pipeline failed'
        }
    }
}
