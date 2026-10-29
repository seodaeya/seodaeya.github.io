import VideoPageLayout from '@/components/VideoPageLayout';
import { getVideoStaticProps } from '@/lib/pageMeta';

const VIDEO_ID = "20230310-1-divoom-ditoo-retro-pixel-speaker";
const VIDEO_HTML = "<h2>⌨️ 레트로 PC를 닮은 감성 테크 토이, 디붐 디투(Divoom Ditoo)</h2>\n<p>방 인테리어 효과를 극대화하고 눈과 귀를 동시에 사로잡는 레트로 픽셀 아트 블루투스 스피커 <strong>디붐 디투(Divoom Ditoo)</strong> 솔직 사용 후기입니다. </p>\n<p>디붐 디투는 1980년대 클래식 데스크톱 매킨토시 컴퓨터의 외형을 손바닥만 한 미니어처 크기로 재현하고, 기계식 키보드의 청축 스위치를 탑재해 조작할 때마다 <strong>경쾌하고 찰진 타건감의 손맛</strong>을 제공하는 유니크한 감성 스피커입니다.</p>\n<hr>\n<h3>🌟 1. 디붐 디투(Ditoo)의 4대 핵심 매력 포인트</h3>\n<ol>\n<li><strong>선명한 16x16 RGB 픽셀 디스플레이:</strong> 전면 스크린을 통해 전 세계 크리에이터들이 만든 수천 가지 움직이는 도트 그래픽(GIF 픽셀 아트)을 실시간으로 감상할 수 있습니다.</li>\n<li><strong>진짜 기계식 청축 키보드 &amp; 조이스틱:</strong> 음악 재생, 볼륨 조절, 메뉴 이동을 아케이드 오락실 조이스틱과 6개의 딸깍거리는 청축 키캡으로 직관적으로 제어합니다.</li>\n<li><strong>크기 대비 놀라운 음질:</strong> 상단 10W 풀레인지 드라이버와 후면 베이스 리플렉스 포트를 장착하여 작은 덩치에서 기대 이상의 단단한 저음과 맑은 보컬 사운드를 뽑아냅니다.</li>\n<li><strong>스마트 라이프 기능:</strong> 탁상시계, 모닝 알람, 날씨 예보, SNS 알림 픽셀 아이콘 표시, 테트리스 및 벽돌깨기 미니게임 지원.</li>\n</ol>\n<hr>\n<h3>🎨 2. 디붐 전용 앱(Divoom App) 연동 및 활용 팁</h3>\n<ul>\n<li><strong>나만의 픽셀 아트 드로잉:</strong> 스마트폰 전용 앱을 켜고 손가락으로 픽셀을 콕콕 찍어 나만의 닉네임, 애니메이션, 캐릭터를 직접 제작해 스피커에 띄울 수 있습니다.</li>\n<li><strong>수면 유도 모드:</strong> 취침 전 알파파 뇌파 음악과 파도 소리, 빗소리 등 내장 백색소음(White Noise)을 타이머와 함께 재생하여 쾌적한 숙면을 유도합니다.</li>\n</ul>\n<p>책상 위 분위기를 화사하게 살려주는 데스크테리어 소품이자 센스 있는 선물용 테크 기기로 적극 추천합니다!</p>\n<hr>\n<div class=\"coupang-box\">\n  <a href=\"https://link.coupang.com/a/eLEIe76yOq\" target=\"_blank\" rel=\"nofollow sponsored noopener noreferrer\">\n    디붐 디투 프로 픽셀아트 미니 블루투스 스피커 보러가기\n  </a>\n  <p>이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>\n</div>\n\n<hr>\n<h3>📺 쇼츠 영상으로 레트로 감성 감상하기</h3>\n<p>기계식 키보드를 딸깍거리며 픽셀 아트를 바꾸는 힐링 사운드는 아래 쇼츠 영상에서 직접 감상해 보세요!</p>\n";

export async function getStaticProps() {
  return getVideoStaticProps(VIDEO_ID);
}

export default function VideoPage(props) {
  return <VideoPageLayout {...props} contentHtml={VIDEO_HTML} />;
}
