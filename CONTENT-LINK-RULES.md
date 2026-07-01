# go-deepseek.com 正文链接规则

手工写文章与 `scripts/generate-articles.mjs` 自动生成时均遵守本规则。

## 数量

| 类型 | 每篇建议 |
|------|----------|
| 站内内链 | **2～5 条** |
| 外链（官方） | **0～2 条** |
| 同一关键词精确匹配链接 | **最多 1 次** |

## 锚文本

- 用自然描述：`API 第一次请求`、`提示词怎么写`
- 不要每段都把「DeepSeek」链到首页
- 不要全文 exact match 堆砌

## 可链站内 pillar（优先）

| 主题 | 路径 |
|------|------|
| API 第一次请求 | `/jiqiao/deepseek-api-first-request/` |
| 提示词写作 | `/jiqiao/deepseek-prompt-writing/` |
| Windows 安装 | `/jiqiao/deepseek-windows-install/` |
| macOS 配置 | `/jiqiao/deepseek-macos-setup/` |
| 代码阅读 | `/jiqiao/deepseek-code-review/` |
| Excel 工作流 | `/jiqiao/deepseek-excel-workflow/` |
| 网页版 | `/jiqiao/deepseek-web-chat/` |
| 下载安装 | `/jiqiao/deepseek-download-guide/` |
| 怎么用（新手） | `/jiqiao/deepseek-how-to-start/` |
| 注册登录 | `/jiqiao/deepseek-register-login/` |
| 免费与价格 | `/jiqiao/deepseek-free-pricing/` |
| 站点首页 | `/` |

## 可链官方外链（同一域名每篇最多 1 次）

- https://platform.deepseek.com
- https://chat.deepseek.com
- https://ollama.com

## 禁止

- 每个「DeepSeek」都加链接
- 链到其它 `deepseek-*.com` 站群（友链区除外）
- 为 SEO 硬塞无关内链

## 索引策略

- `featured: true` → 可索引（6 篇 pillar）
- `generated: true` → noindex（自动发文）
- 文件名 `YYYY-MM-DD-*.md` → 默认 noindex

## 写法示例

```markdown
接入前建议先看 [DeepSeek API 第一次请求](/jiqiao/deepseek-api-first-request/)。
若提示词输出不稳定，可参考 [提示词怎么写](/jiqiao/deepseek-prompt-writing/)。
请前往 [DeepSeek 开放平台](https://platform.deepseek.com) 申请 Key。
```
