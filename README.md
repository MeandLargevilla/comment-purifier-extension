# Comment Purifier (评论净化器) 🛡️

A lightweight, privacy-focused Chrome Extension designed to filter out malicious comments, toxic content, spoilers, and spam on any website.

> **Note:** This extension operates 100% locally. No user data is collected or transmitted.

## ✨ Features

* **💥 Super Strong Mode**: Completely hides the entire comment block or post containing malicious keywords (Optimized for YouTube, X/Twitter, Bilibili, Weibo, etc.).
* **🔥 Strong Mode (Smart Spacing)**: Replaces toxic words with blank spaces to maintain layout.
* **🌫️ Blur Mode**: Blurs sensitive content (Anti-spoiler).
* **👀 Highlight Mode**: Marks suspicious keywords with a red box for review.
* **🌍 Universal Support**: Works on almost all modern websites with comment sections.

## 🚀 Installation

1.  Download the latest release or clone this repository.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Toggle **Developer mode** in the top right corner.
4.  Click **Load unpacked** and select the folder containing this extension.

## 🛠️ Tech Stack

* **Manifest V3**: Compliant with the latest Chrome extension standards.
* **MutationObserver API**: For real-time filtering on dynamic (SPA) websites.
* **Shadow DOM Handling**: Optimized for complex social media structures.
* **i18n**: Full English and Chinese (Simplified) support.

## 🔒 Privacy

This project is built with privacy in mind.
* No external analytics.
* No remote code execution.
* All data storage (`chrome.storage`) is local to your browser.

---
*Created by [Your Name]*
