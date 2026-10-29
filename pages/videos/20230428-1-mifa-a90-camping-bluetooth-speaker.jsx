import VideoPageLayout from '@/components/VideoPageLayout';
import { getVideoStaticProps } from '@/lib/pageMeta';

const VIDEO_ID = "20230428-1-mifa-a90-camping-bluetooth-speaker";
const VIDEO_HTML = "<h2>🏕️ 캠핑장의 밤을 뒤흔드는 압도적 중저음, 미파(MiFA) A90 스피커</h2>\n<p>야외 차박, 오토캠핑, 페스티벌 등 아웃도어 액티비티를 즐기시는 분들에게 가성비 끝판왕으로 널리 알려진 대용량 포터블 스피커 <strong>미파 A90 (MiFA A90)</strong>의 상세 음질 테스트 및 실사용 리뷰입니다.</p>\n<p>미파 A90은 5~6만 원대의 믿기지 않는 가격에 <strong>60W 고출력 스테레오 사운드, IPX8 최고 등급 방수, 화려한 360도 RGB 라이팅</strong>을 모두 담아내어 캠퍼들의 필수 아이템으로 자리 잡았습니다.</p>\n<hr>\n<h3>🔊 1. 미파(MiFA) A90의 강력한 하드웨어 스펙</h3>\n<table>\n<thead>\n<tr>\n<th align=\"left\">주요 기능</th>\n<th align=\"left\">세부 사양 및 특징</th>\n</tr>\n</thead>\n<tbody><tr>\n<td align=\"left\"><strong>출력 파워</strong></td>\n<td align=\"left\"><strong>60W 정격 RMS</strong> (듀얼 풀레인지 드라이버 + 듀얼 패시브 라디에이터)</td>\n</tr>\n<tr>\n<td align=\"left\"><strong>블루투스 규격</strong></td>\n<td align=\"left\">Bluetooth 5.0 (최대 15m 무선 끊김 없는 안정적 연결)</td>\n</tr>\n<tr>\n<td align=\"left\"><strong>방수 등급</strong></td>\n<td align=\"left\"><strong>IPX8 방수</strong> (폭우나 물웅덩이에 빠져도 완벽 방어)</td>\n</tr>\n<tr>\n<td align=\"left\"><strong>배터리 용량</strong></td>\n<td align=\"left\">대용량 6,600mAh (최대 30시간 연속 음악 재생 지원)</td>\n</tr>\n<tr>\n<td align=\"left\"><strong>확장성</strong></td>\n<td align=\"left\">MicroSD 카드 슬롯, AUX 유선 입력, USB-C 충전</td>\n</tr>\n</tbody></table>\n<hr>\n<h3>🎶 2. 야외 필드 음질 테스트 평가</h3>\n<ol>\n<li><strong>양옆 패시브 라디에이터의 묵직한 베이스:</strong> 베이스가 강한 힙합이나 EDM 음원을 재생하면 양쪽 측면 진동판이 눈에 보일 정도로 강렬하게 요동치며 묵직한 타격감을 전달합니다.</li>\n<li><strong>야외 공간을 가득 채우는 음압:</strong> 볼륨을 60~70%만 올려도 탁 트인 노지 캠핑장 전체에 왜곡 없는 시원한 사운드가 전달됩니다.</li>\n<li><strong>TWS(True Wireless Stereo) 2대 무선 연동:</strong> 미파 A90 두 대를 무선으로 페어링하면 좌우 120W 출력의 완벽한 스테레오 공간 음향을 구현할 수 있습니다.</li>\n</ol>\n<hr>\n<h3>💡 3. 캠퍼들을 위한 실전 활용 팁</h3>\n<p>스피커 본체에 탈부착 가능한 <strong>어깨 스트랩 고리</strong>가 기본 포함되어 있어 타프 폴대나 텐트 비너에 걸어두기 매우 편리하며, 6,600mAh 배터리는 비상시 스마트폰을 충전하는 보조배터리 역할까지 수행합니다.</p>\n<hr>\n<div class=\"coupang-box\">\n  <a href=\"https://link.coupang.com/a/eJs8Q1fdu0\" target=\"_blank\" rel=\"nofollow sponsored noopener noreferrer\">\n    MiFA A90 60W 고출력 방수 캠핑용 블루투스 스피커 찾아보기\n  </a>\n  <p>이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>\n</div>\n\n<hr>\n<h3>📺 쇼츠 영상으로 60W 중저음 파워 확인하기</h3>\n<p>스피커 측면 진동판이 쿵쿵 울리는 실제 야외 음질 테스트 영상은 아래 쇼츠에서 확인하실 수 있습니다!</p>\n";

export async function getStaticProps() {
  return getVideoStaticProps(VIDEO_ID);
}

export default function VideoPage(props) {
  return <VideoPageLayout {...props} contentHtml={VIDEO_HTML} />;
}
