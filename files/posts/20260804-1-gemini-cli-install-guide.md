---
category: "AI & Intelligence"
title: "Gemini CLI 설치 가이드: macOS 및 Windows 환경별 설정법"
date: "2026-08-04"
image: "/images/gemini_cli_install_guide_thumbnail.jpg"
tags: ["Gemini CLI", "Terminal", "Developer Tools", "Google Cloud", "Automation"]
excerpt: "터미널에서 직접 Google Gemini API를 호출하여 텍스트 요약, 코드 리뷰, 파일 분석을 자동화하는 Gemini CLI 설치 및 활용법입니다."
---
## 💻 브라우저를 벗어나 터미널에서 구글 Gemini를 다루는 방법

개발자나 시스템 관리자가 복잡한 코드를 분석하거나 텍스트 데이터를 처리할 때, 웹 브라우저를 열고 카피 앤 페이스트(Copy & Paste)를 반복하는 과정은 작업 흐름을 끊는 커다란 요소입니다. 구글(Google)이 제공하는 공식 <strong>Gemini CLI(Command Line Interface)</strong>를 활용하면, 브라우저를 켜지 않고도 <strong>내 커맨드라인 터미널 환경에서 곧바로 인공지능과 대화하고 코드를 요약·리팩토링</strong>할 수 있습니다.

특히 쉘 스크립트(Shell Script) 파이프라인과 연동하여 파일 내용이나 로그를 직접 인풋으로 밀어 넣을 수 있다는 점이 Gemini CLI의 가장 강력한 장점입니다. 

본 아티클에서는 구글 공식 가이드(geminicli.com) 기준에 맞추어 <strong>Google API 키 발급부터 macOS 및 Windows OS별 설치·환경변수 설정, 그리고 실전 개발 팁 및 에러 해결(Troubleshooting)까지</strong> 전 과정을 단 하나의 글에 완벽하게 정리해 드립니다.

---

## 🔑 1. 사전 준비: Google AI Studio API 키 발급

Gemini CLI를 커맨드라인에서 정상 작동시키려면 먼저 구글의 <strong>Gemini API Key</strong>가 필요합니다.

1. <strong>Google AI Studio 접속:</strong> 웹 브라우저로 <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;">Google AI Studio (aistudio.google.com)</a>에 접속하여 구글 계정으로 로그인합니다.
2. <strong>Get API Key 클릭:</strong> 좌측 상단 메뉴의 <strong>'Get API key'</strong> 버튼을 클릭합니다.
3. <strong>신규 키 생성:</strong> <strong>'Create API key in new project'</strong>를 눌러 새로운 API 키를 생성합니다.
4. <strong>키 복사 및 보관:</strong> 발급된 복잡한 문자열(예: `AIzaSy...`)을 복사하여 안전한 곳에 보관합니다. 이 키는 절대로 외부나 공개 저장소(GitHub 등)에 올리지 않도록 주의해야 합니다.

---

## 🍏 2. macOS 환경에서의 Gemini CLI 설치 및 설정

macOS(MacBook, Mac mini 등) 환경에서는 <strong>Node.js 패키지 매니저(npm)</strong>를 이용해 손쉽게 전역(Global) 설치를 진행할 수 있습니다.

### 1단계: Node.js 및 npm 설치 확인
터미널(Terminal) 앱을 열고 아래 명령어를 입력하여 Node.js가 설치되어 있는지 확인합니다. (Gemini CLI는 Node.js v18 이상 버전을 권장합니다.)

```bash
node -v
npm -v
```

만약 Node.js가 설치되어 있지 않다면, Homebrew를 통해 아래 명령어로 설치합니다:

```bash
brew install node
```

### 2단계: Gemini CLI 전역 설치
Node.js 준비가 완료되었다면 npm을 이용해 Gemini CLI 패키지를 시스템 전역에 설치합니다.

```bash
npm install -g @google/gemini-cli
```

### 3단계: macOS 환경변수(GEMINI_API_KEY) 등록
터미널을 닫았다 켜도 API 키가 계속 유지되도록 사용 중인 쉘 환경 설정 파일(`\~/.zshrc` 또는 `\~/.bash_profile`)에 환경변수를 추가합니다.

```bash
# zsh 사용 시 (최신 macOS 기본값)
echo 'export GEMINI_API_KEY="여기에_발급받은_API키_입력"' >> ~/.zshrc
source ~/.zshrc
```

### 4단계: 설치 동작 검증
아래 명령어를 실행하여 Gemini CLI가 제대로 응답하는지 테스트합니다.

```bash
gemini "안녕하세요! macOS 터미널에서 Gemini CLI 연동 테스트입니다."
```

---

## 🪟 3. Windows 환경에서의 Gemini CLI 설치 및 설정

Windows 환경(PowerShell 또는 명령 프롬프트 CMD)에서도 동일하게 npm을 통해 설치하며, 환경변수 등록 방식에서 차이가 있습니다.

### 1단계: Windows용 Node.js 설치
PowerShell을 열고 Node.js 존재 여부를 확인합니다.

```powershell
node -v
npm -v
```

Node.js가 없다면 패키지 관리자 Winget을 이용해 설치하거나 [Node.js 공식 홈페이지](https://nodejs.org)에서 Windows MSI 설치 프로그램을 다운로드합니다.

```powershell
winget install OpenJS.NodeJS.LTS
```

*(설치 후 PowerShell 창을 닫고 다시 열어야 npm 명령어가 인식됩니다.)*

### 2단계: Gemini CLI 전역 설치
PowerShell 창을 열고 npm으로 패키지를 전역 설치합니다. (권한 에러 발생 시 PowerShell을 '관리자 권한으로 실행'하세요.)

```powershell
npm install -g @google/gemini-cli
```

### 3단계: Windows 시스템 환경변수 등록

#### 방법 A: PowerShell 영구 환경변수 등록 (권장)
현재 사용자 계정에 `GEMINI_API_KEY`를 영구 등록합니다.

```powershell
[System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', '여기에_발급받은_API키_입력', 'User')
```

#### 방법 B: 명령 프롬프트(CMD) 영구 등록
CMD 창을 주로 사용하신다면 `setx` 명령어를 사용합니다.

```cmd
setx GEMINI_API_KEY "여기에_발급받은_API키_입력"
```

*(환경변수 적용 후 반드시 기존 터미널 창을 모두 닫고 새로 열어야 변수가 적용됩니다.)*

### 4단계: Windows 동작 검증
PowerShell이나 CMD에서 아래 명령을 입력하여 정상 동작을 확인합니다.

```powershell
gemini "Hello from Windows PowerShell!"
```

---

## 🛠️ 4. 실전 개발 활용법: 생산성을 높이는 터미널 파이프라인

Gemini CLI가 설치되었다면 터미널의 <strong>파이프(|) 연산자</strong>와 결합하여 강력한 개발 조수로 활용할 수 있습니다.

### 1) 파일 내용 분석 및 코드 설명 요청
프로젝트 내 특정 소스 코드나 설정 파일의 내용을 읽어서 즉시 AI에게 분석을 맡길 수 있습니다.

* <strong>macOS / Linux:</strong>
  ```bash
  cat package.json | gemini "이 프로젝트의 주요 의존성과 프로젝트 목적을 한 줄로 요약해줘"
  ```
* <strong>Windows PowerShell:</strong>
  ```powershell
  Get-Content package.json | gemini "이 프로젝트의 주요 의존성과 프로젝트 목적을 한 줄로 요약해줘"
  ```

### 2) 로그 파일 에러 디버깅
서버 실행 로그나 빌드 에러 메시지를 전달하여 원인을 빠르게 파악합니다.

```bash
cat error.log | gemini "이 스택 트레이스의 원인과 해결 방법을 한국어로 설명해줘"
```

---

## ❓ 5. 자주 발생하는 오류 및 해결 방법 (Troubleshooting)

### Q1. `command not found: gemini` 오류가 떠요.
* <strong>원인:</strong> npm의 global bin 경로가 시스템 `PATH` 환경변수에 포함되어 있지 않은 경우입니다.
* <strong>해결책:</strong> macOS의 경우 `npm config get prefix` 경로를 확인하여 `\~/.zshrc`의 PATH에 추가해주고, Windows의 경우 npm 전역 폴더(`C:\Users\사용자명\AppData\Roaming\npm`)를 시스템 환경변수 PATH에 추가합니다.

### Q2. `401 Unauthorized` 또는 API Key 에러가 발생해요.
* <strong>원인:</strong> `GEMINI_API_KEY` 환경변수가 제대로 설정되지 않았거나 오타가 있는 경우입니다.
* <strong>해결책:</strong> macOS에서는 `echo $GEMINI_API_KEY`, Windows에서는 `$env:GEMINI_API_KEY`를 실행하여 키가 정상 출력되는지 확인합니다. 빈 값이 나온다면 쉘 구성 파일 재로드(`source \~/.zshrc`)나 터미널 재시작을 진행합니다.

### Q3. Windows PowerShell에서 스크립트 실행 권한 에러가 납니다.
* <strong>원인:</strong> Windows의 기본 PowerShell ExecutionPolicy 보안 설정 때문입니다.
* <strong>해결책:</strong> 관리자 권한 PowerShell에서 `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` 명령어를 실행하여 실행 권한을 부여합니다.

---

## 📌 6. 총평 및 정리

구글의 <strong>Gemini CLI</strong>는 터미널을 떠나지 않고도 인공지능의 강력한 성능을 내 작업 흐름 속에 자연스럽게 녹여낼 수 있는 뛰어난 도구입니다.

macOS와 Windows 모두 <strong>Node.js 설치 ➔ npm 전역 패키지 설치 ➔ API 키 환경변수 등록</strong>의 3단계로 간단히 구축할 수 있습니다. 오늘 안내해 드린 가이드를 바탕으로 터미널 생산성을 극대화해 보세요! 

추가적인 개발 팁이나 기술 질문은 댓글로 남겨주시면 친절히 답변해 드리겠습니다.
