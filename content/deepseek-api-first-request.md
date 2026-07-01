---
layout: layouts/article.njk
title: "DeepSeek API 第一次请求：用 20 分钟跑通一个小例子"
description: "面向轻量开发者的 DeepSeek API 入门记录，包含准备、请求、返回结果检查和失败处理。"
date: 2026-06-24
featured: true
category: "接口接入"
tags:
  - deepseek
  - api-start
  - developer
coverImage: "/static/posts/deepseek-api-key-cover.svg"
permalink: /jiqiao/deepseek-api-first-request/index.html
---

## 适合谁看

这篇写给想把 DeepSeek 接到脚本、小工具或内部页面里的朋友。接入前可先看 [提示词怎么写](/jiqiao/deepseek-prompt-writing/)；若遇到报错排查，可参考 [用 DeepSeek 读代码](/jiqiao/deepseek-code-review/)。Key 请在 [DeepSeek 开放平台](https://platform.deepseek.com) 申请。

我用 2026.06 的 Node.js 20 环境跑了一次，目标不是做复杂项目，只是先确认能请求、能拿到结果、能处理错误。

![DeepSeek API 请求示意](/static/images/photo-1552664730-d307ca884978.jpg)

## 操作步骤

### 1. 准备运行环境

先确认本机已经安装 Node.js 20 或更新版本。新建一个文件夹，执行初始化命令，再准备一个环境变量保存访问凭证。不要把凭证直接写进公开文件。

### 2. 发送最小请求

第一次请求只问一句简单问题，比如“用一句话解释什么是向量”。这样返回内容短，方便你检查状态码、响应体和耗时。

### 3. 打印关键字段

不要一开始就把完整对象塞进页面。先打印文本结果、错误信息和请求编号。遇到问题时，这三个字段最有用。

### 4. 加上失败处理

网络中断、凭证错误、请求过快都可能出现。我的做法是先给出清楚提示，再把原始错误写到本地日志，避免用户只看到空白页面。

## 第一次跑通后我会检查这三项

### 凭证有没有真的读到

通常是凭证没读到或写错了。先打印环境变量是否为空，不要把真实内容输出到日志里。

### 慢请求是不是文本太长

先用短问题测试，再看网络和请求体大小。长文本任务本来就会更久，不要一上来就拿几千字压测。

### 调用位置放在哪里

不建议。访问凭证放在浏览器里很容易泄露。更稳的做法是前端请求自己的后端，再由后端调用 DeepSeek。

## 我的小建议

先把“最小请求”跑通，再考虑流式输出、历史消息和多轮上下文。一步一步来，排查会轻很多。
