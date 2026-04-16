import re
from ..constants import GROUP_DEFAULT

def parse_metadata(text, default_group=GROUP_DEFAULT):
    """
    텍스트에서 $그룹명 과 #태그 추출 유틸리티.
    그룹은 첫 번째 매칭된 것만 반환합니다.
    """
    group_name = default_group
    tags = []
    
    if not text:
        return group_name, tags
        
    # $그룹명 추출 (단어 경계 고려, 첫 번째 매칭만)
    group_match = re.search(r'\$(\w+)', text)
    if group_match:
        group_name = group_match.group(1)
        
    # #태그 추출 (마크다운 헤더 방지: 최소 한 개의 공백이나 시작 지점 뒤에 오는 #)
    tag_matches = re.finditer(r'(?<!#)#(\w+)', text)
    for match in tag_matches:
        tags.append(match.group(1))
        
    return group_name, list(set(tags))

def parse_and_clean_metadata(content, ui_group=GROUP_DEFAULT, ui_tags=None):
    """
    본문에서 메타데이터($ , #)를 추출하고 삭제한 뒤, UI 입력값과 합쳐 최하단에 재배치합니다.
    """
    if ui_tags is None: ui_tags = []
    if not content:
        return content, ui_group, ui_tags

    # 1. 기존에 생성된 푸터 블록(수평선 + 메타데이터)을 모두 제거
    # 전후 공백을 제거한 후, 하단의 수평선(---, ***, ___)과 메타데이터 블록을 반복적으로 탐색하여 제거합니다.
    content = content.strip()
    # 패턴: (공백+수평선+공백 + (메타데이터 또는 공백))이 문자열 끝에 1회 이상 반복
    content = re.sub(r'(?:\s*[\*\-\_]{3,}\s*(?:[\$\#][\s\S]*?)?\s*)+$', '', content).strip()

    # 2. 본문에서 기호 정보 추출
    content_group, content_tags = parse_metadata(content)
    
    # 3. 본문에서 기호 패턴 삭제
    # $그룹 삭제
    content = re.sub(r'\$\w+', '', content)
    # #태그 삭제 (헤더 제외)
    content = re.sub(r'(?<!#)#\w+', '', content)
    content = content.strip()

    # 4. 데이터 통합
    # 본문에 적힌 그룹이 있다면 UI 선택값보다 우선함
    final_group = content_group if content_group != GROUP_DEFAULT else ui_group
    # 태그는 모두 합침
    final_tags = list(set(ui_tags + content_tags))

    # 5. 푸터 재생성
    footer_parts = []
    if final_group and final_group != GROUP_DEFAULT:
        footer_parts.append(f"${final_group}")
    if final_tags:
        footer_tags = " ".join([f"#{t}" for t in sorted(final_tags)])
        footer_parts.append(footer_tags)

    final_content = content
    if footer_parts:
        final_content += "\n\n---\n" + "\n".join(footer_parts)

    return final_content, final_group, final_tags

def generate_auto_title(content):
    """
    본문에서 제목을 추출합니다. (첫 줄 기준, 영문 20자/한글 10자 내외)
    """
    if not content:
        return ""
        
    # 푸터 제외하고 순수 본문만 추출하여 제목 생성
    main_content = re.split(r'\n+---\n', content)[0].strip()
    if not main_content: return ""

    lines = main_content.split('\n')
    first_line = lines[0].strip()
    # 마크다운 헤더 기호(#) 제거
    first_line = re.sub(r'^#+\s+', '', first_line).strip()
    
    return first_line[:20]

def extract_links(text):
    """
    텍스트에서 [[#ID]] 형태의 내부 링크를 찾아 ID 목록(정수)을 반환합니다.
    """
    if not text:
        return []
    
    # [[#123]] 패턴 매칭
    links = re.findall(r'\[\[#(\d+)\]\]', text)
    return list(set([int(link_id) for link_id in links]))
