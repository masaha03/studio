# **App Name**: Jichi Kai App

## Core Features:

- Meeting Minutes Generator: Transcribe meeting recordings using ElevenLabs Scribe API to generate meeting minutes. Use an AI tool to decide which pieces of the transcription to include in the meeting minutes. Allow users to view, search, and use these minutes for RAG.
- Annual Schedule Manager: Manage the annual schedule of the Jichi Kai, including events like fee collection periods and general meetings.
- Workflow Visualizer: Visualize and manage workflows such as fee collection using Mermaid.js diagrams. Allow users to attach related files to each workflow.

## Style Guidelines:

- Primary color: Use a calming blue (#3498db) to establish trust and reliability.
- Secondary color: Implement a light gray (#f4f4f4) for backgrounds to ensure content legibility.
- Accent: Use a shade of green (#2ecc71) to highlight key actions and completed tasks.
- Maintain a clean and readable typography.
- Employ simple, consistent icons for easy navigation.
- Adopt a clean, card-based layout to organize information effectively.
- Incorporate subtle transitions and animations to enhance user experience.

## Original User Request:
自治会役員会のワークスペースアプリ。全ページでfirebaseのメールリンク認証が必要。signinページのみ用意し、アプリ内からのsignupは許可せず、firebaseの管理画面からユーザーを追加する。以下のサブアプリを持つ。
- 会議の録音からの文字起こしと議事録作成・管理アプリ。文字起こしにはelevenlabs scribe v1 apiを使う。議事録作成にもAIを使う。作成した議事録を後から見返したり、検索したり、RAGに使用したりできる。
- 年間スケジュール管理アプリ。会費集金時期や総会時期などを管理する。
- ワークフロー管理アプリ。集金等のワークフローをmermaid.jsで可視化して管理できるようにする。関連するファイルも管理できるようにする。
  