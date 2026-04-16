#!/bin/bash

# --- 🧠 뇌사료 서버 관리 스크립트 ---

APP_NAME="brain.py"
PID_FILE="server.pid"
LOG_FILE="logs/console.log"

# 로그 디렉토리 생성 확인
mkdir -p logs

start() {
    if [ -f $PID_FILE ]; then
        PID=$(cat $PID_FILE)
        if ps -p $PID > /dev/null; then
            echo "⚠️  서버가 이미 실행 중입니다. (PID: $PID)"
            return
        fi
    fi

    echo "🚀 서버를 백그라운드에서 시작합니다... (Port: 5093)"
    # nohup으로 실행하여 세션 종료 후에도 유지
    nohup python3 $APP_NAME > $LOG_FILE 2>&1 &
    
    # PID 저장
    echo $! > $PID_FILE
    echo "✅ 서버 기동 완료! (PID: $!)"
    echo "📝 콘솔 로그: $LOG_FILE"
}

stop() {
    if [ -f $PID_FILE ]; then
        PID=$(cat $PID_FILE)
        echo "🛑 서버를 중지하는 중... (PID: $PID)"
        kill $PID
        rm $PID_FILE
        echo "✅ 서버가 중지되었습니다."
    else
        echo "⚠️  실행 중인 서버의 PID 파일을 찾을 수 없습니다."
    fi
}

status() {
    if [ -f $PID_FILE ]; then
        PID=$(cat $PID_FILE)
        if ps -p $PID > /dev/null; then
            echo "🟢 서버가 현재 실행 중입니다. (PID: $PID)"
        else
            echo "🔴 PID 파일은 있으나 프로세스가 존재하지 않습니다."
        fi
    else
        echo "⚪ 서버가 중지 상태입니다."
    fi
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        sleep 2
        start
        ;;
    status)
        status
        ;;
    *)
        echo "사용법: $0 {start|stop|restart|status}"
        exit 1
esac

exit 0
