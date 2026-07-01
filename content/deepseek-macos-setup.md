---
layout: layouts/article.njk
title: "DeepSeek macOS 设置记录：从下载到固定到 Dock"
description: "按 2026.06 的 macOS Sonoma 与 Sequoia 使用环境，整理 DeepSeek 打开、权限和快捷方式处理。"
date: 2026-06-26
featured: true
category: "安装教程"
tags:
  - deepseek
  - macos-setup
  - install-guide
coverImage: "/static/posts/deepseek-ollama-cover.svg"
permalink: /jiqiao/deepseek-macos-setup/index.html
---

## 先说测试环境

这篇是我在 2026 年 6 月 26 日用 macOS Sonoma 14.5 和 macOS Sequoia 15.x 试出来的记录。Windows 安装流程见 [Windows 安装教程](/jiqiao/deepseek-windows-install/)；若要本地跑模型，可结合 [Ollama 文档](https://ollama.com) 与站内 [API 第一次请求](/jiqiao/deepseek-api-first-request/) 做后续接入。

macOS 上安装 DeepSeek 不难，真正容易让人犹豫的是权限提示和 Dock 固定。

![DeepSeek macOS 设置界面](/static/images/photo-1557683316-973673baf926.jpg)

## 操作步骤

### 1. 下载并移动到应用程序

下载完成后，如果拿到的是 dmg 文件，双击打开，把 DeepSeek 拖到“应用程序”。不要直接在下载目录里长期运行，后面找起来会很乱。

### 2. 处理首次打开提示

第一次打开时，macOS 可能会提示“来自互联网下载”。确认来源无误后继续打开。如果系统设置里拦住了，进入“隐私与安全性”，在底部找到刚才的提示并允许。

### 3. 固定到 Dock

打开成功后，在 Dock 上右键图标，选择“选项”，再点“在 Dock 中保留”。我测试时发现，这一步比每次从启动台搜索要省很多时间。

### 4. 做一次短任务

登录后先让 DeepSeek 改写一段 100 字以内的文字，或者总结一小段资料。用短任务确认输入、输出和复制都正常，再拿它处理长内容。

## 我遇到的两个小卡点

### 首次打开被系统拦住

先从系统设置的“隐私与安全性”里看有没有允许按钮。如果没有，重新下载一次，避免文件损坏。

### 拖到应用程序后还找不到

打开访达，进入“应用程序”，按名称排序再找。也可以用 Spotlight 搜索 DeepSeek。

## 我现在的用法

我自己的做法是日常短问用桌面端，查资料或复制长文本时用浏览器端，两个场景分开会更清楚。要是只是临时问一句，其实不用纠结装不装，浏览器也够用。

## 小结

macOS 上最值得注意的是首次打开权限和 Dock 固定。处理好这两点后，DeepSeek 基本就能像普通工具一样使用。
