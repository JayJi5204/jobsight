pipeline{
    agent any

    options{
        timestamps()
        disableConcurrentBuilds()
    }

    triggers{
        pollSCM('H/5 * * * *')
    }

    stages{
        stage('백엔드 테스트'){
            steps{
                sh '''
                    docker run --rm \
                    --user 1000:1000 --group-add 112 \
                    --volumes-from jobsight-jenkins \
                    -v /var/run/docker.sock:/var/run/docker.sock \
                    --network host \
                    -e GRADLE_USER_HOME="$WORKSPACE/.gradle" \
                    -w "$WORKSPACE/backend" \
                    eclipse-temurin:25-jdk ./gradlew test --no-daemon
                '''
            }
        }

        stage('프론트 빌드'){
            steps{
                sh '''
                    docker run --rm \
                    --user 1000:1000 \
                    --volumes-from jobsight-jenkins \
                    -e npm_config_cache="$WORKSPACE/.npm" \
                    -w "$WORKSPACE/frontend" \
                    node:24-alpine sh -c "npm ci && npm run build"
                '''
            }
        }

        stage('배포'){
            steps{
                sh '''
                    cd "$DEPLOY_DIR"
                    git pull
                    docker compose up -d --build
                '''
            }
        }
    }
}