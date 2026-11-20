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
        stage('정적 검사'){
            parallel{
                stage('백엔드 검사'){
                    steps{
                        sh '''
                            docker run --rm \
                            --user 1000:1000 \
                            --volumes-from jobsight-jenkins \
                            -e GRADLE_USER_HOME="$WORKSPACE/.gradle" \
                            -w "$WORKSPACE/backend" \
                            eclipse-temurin:25-jdk ./gradlew checkstyleMain --no-daemon
                        '''
                    }
                }

                stage('프론트 검사'){
                    steps{
                        sh '''
                            docker run --rm \
                            --user 1000:1000 \
                            --volumes-from jobsight-jenkins \
                            -e npm_config_cache="$WORKSPACE/.npm" \
                            -w "$WORKSPACE/frontend" \
                            node:24-alpine sh -c "npm ci && npm run lint && npx tsc -b"
                        '''
                    }
                }

                stage('인프라 검사'){
                    steps{
                        sh '''
                            docker compose --env-file "$WORKSPACE/.env.example" -f \
                            "$WORKSPACE/docker-compose.yml" config -q
                        '''
                    }
                }
            }
        }

        stage('테스트'){
            parallel{
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

                stage('프론트 테스트'){
                    steps{
                        sh '''
                            docker run --rm \
                            --user 1000:1000 \
                            --volumes-from jobsight-jenkins \
                            -e npm_config_cache="$WORKSPACE/.npm" \
                            -w "$WORKSPACE/frontend" \
                            node:24-alpine npm test
                        '''
                    }
                }

                stage('AI 테스트'){
                    steps{
                        sh '''
                            docker run --rm \
                            --user 1000:1000 \
                            --volumes-from jobsight-jenkins \
                            -e UV_CACHE_DIR="$WORKSPACE/.uv-cache" \
                            -w "$WORKSPACE/ai" \
                            ghcr.io/astral-sh/uv:python3.12-bookworm-slim \
                            sh -c "python -m compileall -q src && uv run --locked --only-group dev pytest -q"
                        '''
                    }
                }
            }
        }

        stage('빌드'){
            steps{
                sh '''
                    cd "$DEPLOY_DIR"
                    git pull
                    docker compose build
                '''
            }
        }

        stage('검색 품질'){
            when{
                anyOf{
                    changeset 'ai/src/jobsight/rag/**'
                    changeset 'ai/eval/**'
                }
            }
            steps{
                sh '''
                    cd "$DEPLOY_DIR"
                    docker compose run --rm -T \
                    -v "$DEPLOY_DIR/ai/eval:/app/ai/eval:ro" \
                    ai python -m jobsight.rag.evaluate --check
                '''
            }
        }

        stage('배포'){
            steps{
                sh '''
                    cd "$DEPLOY_DIR"
                    docker compose up -d
                    docker image prune -f
                '''
            }
        }

        stage('헬스체크'){
            steps{
                timeout(time: 3, unit: 'MINUTES'){
                    waitUntil(initialRecurrencePeriod: 5000){
                        script{
                            return sh(returnStatus: true, script: '''
                                docker exec jobsight-frontend sh -c "
                                    wget -q -O /dev/null http://127.0.0.1/ &&
                                    wget -q -O /dev/null http://127.0.0.1/api/cameras &&
                                    wget -q -O /dev/null http://127.0.0.1/ai/health
                                "
                            ''') == 0
                        }
                    }
                }

                timeout(time: 6, unit: 'MINUTES'){
                    waitUntil(initialRecurrencePeriod: 10000){
                        script{
                            return sh(returnStatus: true, script: '''
                                docker exec jobsight-frontend curl -sf -m 60 -H 'Content-Type: application/json' -d '{"question":"어디에 신고하나요?","kind":"fall"}' http://127.0.0.1/ai/ask | grep -q 119
                            ''') == 0
                        }
                    }
                }
            }
        }
    }
}
