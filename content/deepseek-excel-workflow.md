---
layout: layouts/article.njk
title: "DeepSeek 处理 Excel 文本：别整表硬塞，先拆字段"
description: "用 DeepSeek 处理表格文本、备注、分类和说明时的实操方法，适合运营、客服和行政场景。"
date: 2026-06-23
featured: true
category: "办公场景"
tags:
  - deepseek
  - excel-workflow
  - office
coverImage: "/static/posts/deepseek-prompt-step.svg"
permalink: /jiqiao/deepseek-excel-workflow/index.html
---

## 我踩过的坑

2026 年 6 月，我帮同事整理一批客户备注时，一开始直接把整张表复制给 DeepSeek，结果它看得很吃力。后来我改成只给字段说明和 10 行样例，再让它生成处理规则，效率高很多。输入组织方式可参考 [提示词怎么写](/jiqiao/deepseek-prompt-writing/)；若要把结果接进脚本，再看 [API 第一次请求](/jiqiao/deepseek-api-first-request/)。

![DeepSeek Excel 文本处理](/static/images/photo-1504384308090-c894fdcc538d.jpg)

## 操作步骤

### 1. 先说明字段

例如：A 列是客户问题，B 列是处理状态，C 列是备注。字段越清楚，DeepSeek 越容易按你的业务逻辑理解。

### 2. 给少量样例

不要一次贴几百行。先贴 5 到 10 行，让它判断分类方式是否合理。确认后再分批处理。

### 3. 明确输出格式

如果你要粘回 Excel，就要求它输出“分类、建议回复、备注说明”三列。这样复制回表格时不会乱。

### 4. 人工抽查

批量文本一定要抽查。我一般每 30 行看 3 行，发现口径不对就停下来改提示。

## 处理前后对比

### 直接整表复制

看起来省事，但字段含义、空值和备注混在一起，DeepSeek 容易按自己的理解补细节。一次处理完才发现方向错了，返工会很烦。

### 先拆字段再分批

字段说明、少量样例、输出格式三件事先讲清楚，再分批处理，结果会更像能直接粘回表格的内容。

### 发出前留一轮抽查

至少抽查语气、事实和金额相关内容。我自己一般先看边界案例，比如投诉、退款、延期这些行。

## 一句经验

DeepSeek 更适合帮你整理规则和草稿，最后的业务判断还是要自己确认。尤其是金额、承诺、售后边界这类内容，别偷懒。
