pipeline {
    agent {
        docker {
            image 'node:20'
            args "--volumes-from jenkins -w ${WORKSPACE}"
        }
    }

    environment {
        IMAGE_NAME = "weather-ui-image"
        CONTAINER_NAME = "weather-ui-container"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Build Angular') {
            steps {
                sh 'npm ci'
                sh 'npm run build -- weather-ui --configuration production --output-path=dist/weather-ui'
            }
        }

        // stage('Docker Build') {
        //     steps {
        //         script {
        //             docker.build("${IMAGE_NAME}", ".")
        //         }
        //     }
        // }

        // stage('Run Container') {
        //     steps {
        //         script {
        //             sh "docker rm -f ${CONTAINER_NAME} || true"
        //             sh "docker run -d -p 8082:80 --name ${CONTAINER_NAME} ${IMAGE_NAME}"
        //         }
        //     }
        // }
    }

    post {
        always {
            echo 'Pipeline finished (success or failure)'
        }
        success {
            echo 'Application built and deployed successfully!'
        }
        failure {
            echo 'Pipeline failed.'
        }
    }
}
