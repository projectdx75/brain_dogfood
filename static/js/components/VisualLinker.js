/**
 * 메모 간 시각적 연결(Node-to-Node Linking) 관리 모듈
 */
import { API } from '../api.js';
import { I18nManager } from '../utils/I18nManager.js';
import { AppService } from '../AppService.js';

export const VisualLinker = {
    state: {
        isActive: false,
        sourceId: null,
        sourceElement: null,
        startX: 0,
        startY: 0
    },
    DOM: {
        svg: null,
        line: null
    },

    init() {
        if (this.DOM.svg) return;

        // SVG 오버레이 생성
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'visual-linker-overlay';
        svg.style.position = 'fixed';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100vw';
        svg.style.height = '100vh';
        svg.style.pointerEvents = 'none'; // 평소에는 클릭 방해 안 함
        svg.style.zIndex = '9999';
        svg.style.display = 'none';

        // 💡 화살표 촉(Marker) 정의
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '8'); // 선 끝에서 약간 안쪽
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');

        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        polygon.setAttribute('fill', 'var(--accent)');

        marker.appendChild(polygon);
        defs.appendChild(marker);
        svg.appendChild(defs);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('stroke', 'var(--accent)');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '5,5'); // 점선 효과
        line.setAttribute('marker-end', 'url(#arrowhead)'); // 화살표 연결
        line.style.transition = 'stroke-dashoffset 0.1s linear';
        
        svg.appendChild(line);
        document.body.appendChild(svg);

        this.DOM.svg = svg;
        this.DOM.line = line;

        // 스크롤 시 시작점 보정
        window.addEventListener('scroll', () => {
            if (this.state.isActive) this.syncCoordinates();
        }, { passive: true });
    },

    /**
     * 연결 모드 시작
     */
    start(sourceId, element) {
        if (!sourceId || !element) return;
        this.init();

        this.state.isActive = true;
        this.state.sourceId = sourceId;
        this.state.sourceElement = element;
        
        this.DOM.svg.style.display = 'block';
        document.body.classList.add('linker-active'); // 시각적 피드백용 클래스

        this.syncCoordinates();
        
        // 전역 마우스 이동 이벤트 등록
        this.onMouseMove = (e) => this.handleMouseMove(e);
        window.addEventListener('mousemove', this.onMouseMove);
    },

    /**
     * 화면상의 좌표를 소스 요소의 현재 위치로 동기화
     */
    syncCoordinates() {
        if (!this.state.sourceElement) return;
        const rect = this.state.sourceElement.getBoundingClientRect();
        this.state.startX = rect.left + rect.width / 2;
        this.state.startY = rect.top + rect.height / 2;

        this.DOM.line.setAttribute('x1', this.state.startX);
        this.DOM.line.setAttribute('y1', this.state.startY);
    },

    handleMouseMove(e) {
        if (!this.state.isActive) return;
        this.DOM.line.setAttribute('x2', e.clientX);
        this.DOM.line.setAttribute('y2', e.clientY);
    },

    /**
     * 연결 완료 (대상 선택)
     */
    async finish(targetId) {
        if (!this.state.isActive || !this.state.sourceId || this.state.sourceId === targetId) {
            this.cancel();
            return;
        }

        const sourceId = this.state.sourceId;
        this.cancel(); // UI 먼저 닫기

        try {
            // 1. 소스 메모 데이터 가져오기 (본문 필요)
            const memo = await API.fetchMemo(sourceId);
            if (!memo) return;

            // 💡 암호화된 메모리 처리 방어
            if (memo.is_encrypted) {
                alert(I18nManager.t('msg_permission_denied') || 'Encrypted memo linking is not supported in visual mode.');
                return;
            }

            // 2. 본문 끝에 링크 추가
            let content = memo.content || '';
            const linkTag = `[[#${targetId}]]`;
            
            // 중복 방지 체크
            const cleanContent = content.trim();
            if (cleanContent.includes(linkTag)) return;

            const updatedContent = cleanContent + `\n\n${linkTag}`;

            // 3. 업데이트 저장
            await API.saveMemo({
                title: memo.title,
                content: updatedContent,
                group_name: memo.group_name || '기본', 
                category: memo.category,
                status: memo.status || 'active',
                color: memo.color,
                is_pinned: memo.is_pinned,
                tags: (memo.tags || []).map(t => typeof t === 'object' ? t.name : t) 
            }, sourceId);

            // 4. 데이터 갱신 (별도 팝업 없이 진행)
            if (AppService.refreshData) {
                await AppService.refreshData(); 
            }
        } catch (err) {
            console.error('[VisualLinker] Link error:', err);
            alert(`${I18nManager.t('msg_network_error') || 'Failed to link memos'}: ${err.message}`);
        }
    },

    /**
     * 연결 취소 및 초기화
     */
    cancel() {
        if (!this.state.isActive) return;

        this.state.isActive = false;
        this.state.sourceId = null;
        this.state.sourceElement = null;

        if (this.DOM.svg) this.DOM.svg.style.display = 'none';
        document.body.classList.remove('linker-active');

        window.removeEventListener('mousemove', this.onMouseMove);
    }
};
