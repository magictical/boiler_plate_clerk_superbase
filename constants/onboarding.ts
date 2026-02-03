/**
 * 온보딩 관련 상수
 * - 안전 동의 쿠키/스토리지 키, 리다이렉트 경로
 */

/** 미들웨어·클라이언트에서 동의 여부 확인용 쿠키 키 */
export const SAFETY_CONSENT_COOKIE_NAME = "griplab_safety_consent";

/** 클라이언트 동의 상태 재확인용 localStorage 키 */
export const SAFETY_CONSENT_STORAGE_KEY = "griplab_safety_consent";

/** 동의 쿠키 유효 기간(초). 1년 */
export const SAFETY_CONSENT_COOKIE_MAX_AGE = 31536000;

/**
 * 안전 동의 완료 후 이동 경로.
 * ON-01 구현으로 홈짐 선택 페이지로 직행.
 */
export const SAFETY_CONSENT_REDIRECT_PATH = "/onboarding/gym-select";

/**
 * 커스텀 암장 등록 시 기본 제공 색상 (대부분의 암장이 사용하는 색상 + 보조 색상)
 * 순서: 빨 주 노 초 파 남 보 → 검정 흰색 회색 갈색 핑크
 */
export const DEFAULT_GYM_COLORS: ReadonlyArray<{ color_hex: string; color_name: string }> = [
  { color_hex: "#E53935", color_name: "빨강" },
  { color_hex: "#FF9800", color_name: "주황" },
  { color_hex: "#FFEB3B", color_name: "노랑" },
  { color_hex: "#4CAF50", color_name: "초록" },
  { color_hex: "#2196F3", color_name: "파랑" },
  { color_hex: "#3949AB", color_name: "남색" },
  { color_hex: "#9C27B0", color_name: "보라" },
  { color_hex: "#000000", color_name: "검정" },
  { color_hex: "#FFFFFF", color_name: "흰색" },
  { color_hex: "#757575", color_name: "회색" },
  { color_hex: "#795548", color_name: "갈색" },
  { color_hex: "#E91E63", color_name: "핑크" },
];
