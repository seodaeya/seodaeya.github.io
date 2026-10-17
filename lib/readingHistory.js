import { useState, useEffect } from 'react';
import categoriesData from '@/files/categories.json';
import { readBookmarks } from '@/components/BookmarkButton';

export const READ_STORAGE_KEY = 'nard-read-posts';
export const MAX_READ_HISTORY = 100;
export const READ_UPDATED_EVENT = 'nard-read-updated';
export const BOOKMARK_UPDATED_EVENT = 'nard-bookmarks-updated';

let cachedPool = null;

const STOP_WORDS = new Set([
  '가이드', '완전', '분석', '정복', '정리', '방법', '활용', '설치', '실전', '비교',
  '무엇인가', '어떻게', '리뷰', '후기', '추천', '총정리', '패치', '구축', '시대',
  '초보', '기초', '부터', '까지', '위한', '하는', '만들기', '사용법', '특징',
]);

function extractKeywords(title = '', tags = []) {
  const tokens = new Set();
  tags.forEach((t) => {
    if (t && typeof t === 'string') tokens.add(t.trim().toLowerCase());
  });
  const words = title
    .replace(/[^\w가-힣\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));

  words.forEach((w) => tokens.add(w));
  return Array.from(tokens);
}

function shortenTitle(title = '', maxLen = 22) {
  if (!title) return '';
  const clean = title.split(':')[0].trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen)}…`;
}

/**
 * 빌드 타임 생성된 categories.json을 평탄화하여 전체 콘텐츠 풀(태그·키워드 포함) 반환
 */
export function getAllContentPool() {
  if (cachedPool) return cachedPool;
  const pool = [];
  if (categoriesData && typeof categoriesData === 'object') {
    Object.entries(categoriesData).forEach(([category, items]) => {
      if (!Array.isArray(items)) return;
      items.forEach((item) => {
        if (!item?.file) return;
        const cleanKey = item.file.replace(/\.md$/i, '').replace(/^\/+|\/+$/g, '');
        const isVideo = cleanKey.startsWith('videos/');
        const id = cleanKey.replace(/^(posts|videos)\//, '');
        const tags = Array.isArray(item.tags) ? item.tags : [];
        pool.push({
          id,
          key: cleanKey,
          url: `/${cleanKey}`,
          title: item.title || id,
          category,
          tags,
          keywords: extractKeywords(item.title || '', tags),
          type: isVideo ? 'videos' : 'posts',
        });
      });
    });
  }
  cachedPool = pool;
  return pool;
}

/**
 * URL, 파일 경로, 또는 슬러그 ID를 표준 키('posts/...' 또는 'videos/...')로 정규화
 */
export function normalizeContentKey(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const cleaned = raw
    .split('?')[0]
    .split('#')[0]
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/\.md$/i, '')
    .replace(/^\/+|\/+$/g, '');

  if (!cleaned) return '';
  if (cleaned.startsWith('posts/') || cleaned.startsWith('videos/')) {
    return cleaned;
  }

  const pool = getAllContentPool();
  const matched = pool.find((item) => item.id === cleaned || item.id.startsWith(`${cleaned}-`));
  return matched ? matched.key : `posts/${cleaned}`;
}

/**
 * localStorage에서 읽은 글 키 배열 조회 (최대 100개 Ring Buffer)
 */
export function getReadPosts() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function getReadPostSet() {
  return new Set(getReadPosts());
}

export function isContentRead(rawKeyOrFile, readSet) {
  if (!readSet || readSet.size === 0) return false;
  const key = normalizeContentKey(rawKeyOrFile);
  return key ? readSet.has(key) : false;
}

/**
 * 현재 글을 '읽음'으로 기록 (FIFO Ring Buffer로 최대 100개만 유지하여 브라우저 용량 ~4KB 고정)
 */
export function markPostAsRead(rawKeyOrFile) {
  if (typeof window === 'undefined' || !rawKeyOrFile) return;
  try {
    const key = normalizeContentKey(rawKeyOrFile);
    if (!key) return;
    const current = getReadPosts();
    if (current[0] === key) return;

    const filtered = current.filter((item) => item !== key);
    const updated = [key, ...filtered].slice(0, MAX_READ_HISTORY);
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(READ_UPDATED_EVENT));
  } catch (e) {}
}

/**
 * 특정 글 1개(예: 방금 북마크에 추가한 글)와 가장 연관도가 높은 추천 글 반환
 */
export function getRelatedToPost(rawKeyOrId, limit = 2) {
  const allPool = getAllContentPool();
  const targetKey = normalizeContentKey(rawKeyOrId);
  const sourceItem = allPool.find((item) => item.key === targetKey || item.id === rawKeyOrId);
  if (!sourceItem) return [];

  const readSet = typeof window !== 'undefined' ? getReadPostSet() : new Set();
  const bookmarks = typeof window !== 'undefined' ? readBookmarks() : [];
  const bookmarkedIds = new Set(bookmarks.map((b) => b.id));

  const sourceTagLower = new Map(
    (sourceItem.tags || []).map((t) => [t.toLowerCase(), t])
  );
  const sourceKeywords = new Set(sourceItem.keywords || []);

  const scored = allPool
    .filter((item) => item.key !== sourceItem.key && !bookmarkedIds.has(item.id))
    .map((candidate) => {
      let score = 0;
      const matchedTags = [];

      (candidate.tags || []).forEach((t) => {
        const lower = t.toLowerCase();
        if (sourceTagLower.has(lower)) {
          score += 4;
          matchedTags.push(t);
        }
      });

      (candidate.keywords || []).forEach((kw) => {
        if (sourceKeywords.has(kw) && !sourceTagLower.has(kw)) {
          score += 1.5;
        }
      });

      if (candidate.category === sourceItem.category) {
        score += 2;
      }

      const isUnread = !readSet.has(candidate.key);
      if (isUnread) {
        score += 1.5;
      }

      const reason =
        matchedTags.length > 0
          ? `#${matchedTags.slice(0, 2).join(' #')} 태그 연관`
          : `${candidate.category} 같은 분야 추천`;

      return {
        ...candidate,
        score,
        matchedTags,
        isUnread,
        reason,
      };
    })
    .filter((item) => item.score > 1.5)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

/**
 * 사용자의 북마크 목록(nard-bookmarks) 전체를 분석하여
 * 1) 주요 관심 태그(topTags) & 카테고리(topCategories)
 * 2) 각 북마크 글과의 태그·키워드·카테고리 유사도 기반 맞춤 추천 목록 반환
 */
export function getBookmarkBasedRecommendations(currentPathOrKey = '', excludeKeys = [], limit = 6) {
  const allPool = getAllContentPool();
  const bookmarks = typeof window !== 'undefined' ? readBookmarks() : [];
  const readSet = typeof window !== 'undefined' ? getReadPostSet() : new Set();
  const currentKey = normalizeContentKey(currentPathOrKey);
  const excludedSet = new Set(
    [currentKey, ...excludeKeys.map(normalizeContentKey)].filter(Boolean)
  );

  // 북마크된 실제 아이템 매핑
  const bookmarkedItems = bookmarks
    .map((bm) => allPool.find((p) => p.id === bm.id || p.key === normalizeContentKey(bm.id)))
    .filter(Boolean);

  const bookmarkedKeySet = new Set(bookmarkedItems.map((b) => b.key));

  // 관심 태그 및 카테고리 빈도 집계
  const tagCounts = new Map();
  const tagDisplayNames = new Map();
  const categoryCounts = new Map();

  bookmarkedItems.forEach((item) => {
    if (item.category) {
      categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
    }
    (item.tags || []).forEach((tag) => {
      const lower = tag.toLowerCase();
      tagCounts.set(lower, (tagCounts.get(lower) || 0) + 1);
      if (!tagDisplayNames.has(lower)) tagDisplayNames.set(lower, tag);
    });
  });

  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lower, count]) => ({ tag: tagDisplayNames.get(lower) || lower, count }));

  const topCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, count }));

  if (bookmarkedItems.length === 0) {
    return {
      recommendations: [],
      topTags: [],
      topCategories: [],
      bookmarkCount: 0,
    };
  }

  // 후보군 점수 계산 (이미 북마크한 글 및 현재 글 제외)
  const candidates = allPool.filter(
    (item) => !bookmarkedKeySet.has(item.key) && !excludedSet.has(item.key)
  );

  const scored = candidates.map((candidate) => {
    let bestBookmarkMatch = null;
    let bestPairScore = -1;
    let bestPairTags = [];
    let totalTagScore = 0;

    // 전체 북마크 태그 풀과의 매칭 점수
    const candidateMatchedTags = [];
    (candidate.tags || []).forEach((t) => {
      const lower = t.toLowerCase();
      if (tagCounts.has(lower)) {
        totalTagScore += 3.5 * (tagCounts.get(lower) || 1);
        candidateMatchedTags.push(t);
      }
    });

    // 가장 강하게 연결된 대표 북마크 글 찾기 (추천 사유 표시용)
    bookmarkedItems.forEach((bmItem) => {
      let pairScore = 0;
      const sharedTags = [];
      const bmTagLower = new Set((bmItem.tags || []).map((t) => t.toLowerCase()));
      const bmKeywords = new Set(bmItem.keywords || []);

      (candidate.tags || []).forEach((t) => {
        if (bmTagLower.has(t.toLowerCase())) {
          pairScore += 4;
          sharedTags.push(t);
        }
      });

      (candidate.keywords || []).forEach((kw) => {
        if (bmKeywords.has(kw) && !bmTagLower.has(kw)) {
          pairScore += 1.5;
        }
      });

      if (candidate.category === bmItem.category) {
        pairScore += 2;
      }

      if (pairScore > bestPairScore) {
        bestPairScore = pairScore;
        bestBookmarkMatch = bmItem;
        bestPairTags = sharedTags;
      }
    });

    const catBonus = categoryCounts.has(candidate.category)
      ? 2 * (categoryCounts.get(candidate.category) || 1)
      : 0;
    const isUnread = !readSet.has(candidate.key);
    const unreadBonus = isUnread ? 3 : 0;

    const totalScore = totalTagScore + bestPairScore + catBonus + unreadBonus;

    const shortBmTitle = shortenTitle(bestBookmarkMatch?.title || '', 20);
    const displayTags = bestPairTags.length > 0 ? bestPairTags : candidateMatchedTags;

    let reason = '🔖 내 북마크 취향 맞춤 추천';
    if (shortBmTitle && displayTags.length > 0) {
      reason = `🔖 북마크 「${shortBmTitle}」 글과 #${displayTags.slice(0, 2).join(' #')} 일치`;
    } else if (shortBmTitle && candidate.category === bestBookmarkMatch?.category) {
      reason = `🔖 북마크 「${shortBmTitle}」 글과 같은 ${candidate.category} 분야`;
    }

    return {
      ...candidate,
      score: totalScore,
      matchedTags: displayTags.slice(0, 3),
      sourceBookmarkTitle: bestBookmarkMatch?.title || '',
      isUnread,
      reason,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return {
    recommendations: scored.slice(0, limit),
    topTags,
    topCategories,
    bookmarkCount: bookmarkedItems.length,
  };
}

/**
 * 북마크 맞춤 추천 풀에서 상위 연관 글을 뽑아 반환 (북마크 전용 뽑기 모드)
 */
export function pickBookmarkMatchedPost(currentPathOrKey = '', excludeKeys = []) {
  const allPool = getAllContentPool();
  const readSet = getReadPostSet();
  const totalCount = allPool.length;
  const validReadCount = allPool.filter((item) => readSet.has(item.key)).length;

  const { recommendations, bookmarkCount } = getBookmarkBasedRecommendations(
    currentPathOrKey,
    excludeKeys,
    8
  );

  if (recommendations.length > 0) {
    // 상위 연관도 그룹(Top 5) 중에서 뽑아 매번 새로운 연관 글이 나오도록 구성
    const topSlice = recommendations.slice(0, Math.min(5, recommendations.length));
    const picked = topSlice[Math.floor(Math.random() * topSlice.length)];
    return {
      ...picked,
      mode: 'bookmark',
      bookmarkCount,
      readCount: validReadCount,
      unreadCount: Math.max(0, totalCount - validReadCount),
      totalCount,
    };
  }

  // 북마크가 아직 0개일 때는 현재 보고 있는 글과 가장 연관된 글을 대신 추천
  const related = getRelatedToPost(currentPathOrKey, 4);
  if (related.length > 0) {
    const picked = related[Math.floor(Math.random() * related.length)];
    return {
      ...picked,
      mode: 'related-fallback',
      bookmarkCount: 0,
      reason: `💡 아직 북마크한 글이 없어 현재 글과 연관된 추천(${picked.reason})을 뽑았습니다`,
      readCount: validReadCount,
      unreadCount: Math.max(0, totalCount - validReadCount),
      totalCount,
    };
  }

  return pickSmartRandomPost(currentPathOrKey, excludeKeys);
}

/**
 * 안 읽은 글 우선 스마트 랜덤 뽑기
 */
export function pickSmartRandomPost(currentPathOrKey = '', excludeKeys = []) {
  const allPool = getAllContentPool();
  if (allPool.length === 0) return null;

  const readList = getReadPosts();
  const readSet = new Set(readList);
  const currentKey = normalizeContentKey(currentPathOrKey);
  const excludedSet = new Set(
    [currentKey, ...excludeKeys.map(normalizeContentKey)].filter(Boolean)
  );

  const bookmarks = typeof window !== 'undefined' ? readBookmarks() : [];
  const bookmarkedIds = new Set(bookmarks.map((b) => b.id).filter(Boolean));
  const preferredCategories = new Set();

  allPool.forEach((item) => {
    if (bookmarkedIds.has(item.id) && item.category) {
      preferredCategories.add(item.category);
    }
  });

  if (preferredCategories.size === 0 && readList.length > 0) {
    readList.slice(0, 3).forEach((rKey) => {
      const found = allPool.find((item) => item.key === rKey);
      if (found?.category) preferredCategories.add(found.category);
    });
  }

  const unreadCandidates = allPool.filter(
    (item) => !excludedSet.has(item.key) && !readSet.has(item.key)
  );

  let activePool = unreadCandidates;
  let allReadReset = false;

  if (activePool.length === 0) {
    const unreadExcludingCurrentOnly = allPool.filter(
      (item) => item.key !== currentKey && !readSet.has(item.key)
    );
    if (unreadExcludingCurrentOnly.length > 0) {
      activePool = unreadExcludingCurrentOnly;
    } else {
      activePool = allPool.filter((item) => item.key !== currentKey);
      allReadReset = true;
    }
  }

  if (activePool.length === 0) {
    activePool = allPool;
  }

  const weightedPool = [];
  activePool.forEach((item) => {
    weightedPool.push(item);
    if (item.category && preferredCategories.has(item.category)) {
      weightedPool.push(item);
    }
  });

  const picked = weightedPool[Math.floor(Math.random() * weightedPool.length)];
  const isPreferredCategory = Boolean(picked?.category && preferredCategories.has(picked.category));
  const hasBookmarks = bookmarkedIds.size > 0;

  let reason = '🎲 아직 읽지 않은 새로운 글 무작위 발견';
  if (allReadReset) {
    reason = '🏆 전체 글 정주행 완료! 다시 읽는 추천 콘텐츠';
  } else if (isPreferredCategory && hasBookmarks) {
    reason = `🎲 미열람 랜덤 추출 (북마크 선호 분야: ${picked.category})`;
  }

  const totalCount = allPool.length;
  const validReadCount = allPool.filter((item) => readSet.has(item.key)).length;

  return {
    ...picked,
    mode: 'random',
    reason,
    allReadReset,
    readCount: validReadCount,
    unreadCount: Math.max(0, totalCount - validReadCount),
    totalCount,
  };
}

/**
 * 포스트/영상 상세 페이지에서 '진짜 읽은 글'(5초 이상 체류 OR 스크롤 30% 이상)만 기록하는 훅
 */
export function useTrackReading(contentKey) {
  useEffect(() => {
    if (typeof window === 'undefined' || !contentKey) return;
    let committed = false;

    const commitRead = () => {
      if (committed) return;
      committed = true;
      markPostAsRead(contentKey);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };

    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (scrollHeight > 100 && scrollTop / scrollHeight >= 0.3) {
        commitRead();
      }
    };

    const timer = setTimeout(commitRead, 5000);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [contentKey]);
}

/**
 * 클라이언트 마운트 이후 읽은 글 Set을 구독하는 훅
 */
export function useReadPostsSet() {
  const [readSet, setReadSet] = useState(() => new Set());

  useEffect(() => {
    const sync = () => setReadSet(getReadPostSet());
    sync();
    window.addEventListener(READ_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(READ_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return readSet;
}

/**
 * 클라이언트 마운트 이후 북마크 목록 변경을 실시간 구독하는 훅
 */
export function useBookmarksList() {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    const sync = () => setBookmarks(readBookmarks());
    sync();
    window.addEventListener(BOOKMARK_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(BOOKMARK_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return bookmarks;
}
