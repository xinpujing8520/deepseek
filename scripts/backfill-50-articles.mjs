import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const start = Date.UTC(2026, 3, 1);
const end = Date.UTC(2026, 5, 27);

const topics = [
  ["deepseek-local-notes", "DeepSeek 本地资料整理：我把零散文档重新归了一遍", "本地资料整理"],
  ["deepseek-weekly-report", "DeepSeek 写周报：别直接让它替你编", "周报整理"],
  ["deepseek-meeting-action", "DeepSeek 整理会议行动项：我会先拆这三列", "会议纪要"],
  ["deepseek-email-polish", "DeepSeek 改邮件：语气别太硬的一次尝试", "邮件改写"],
  ["deepseek-study-plan", "DeepSeek 做学习计划：7 天版本更容易坚持", "学习计划"],
  ["deepseek-customer-reply", "DeepSeek 客服回复草稿：先定边界再写话术", "客服回复"],
  ["deepseek-paper-reading", "DeepSeek 读论文：先抓图表再看结论", "论文阅读"],
  ["deepseek-code-explain", "DeepSeek 解释代码：我会先给入口文件", "代码解释"],
  ["deepseek-travel-plan", "DeepSeek 排旅行路线：别忘了写体力预算", "旅行安排"],
  ["deepseek-copywriting", "DeepSeek 写短文案：先给坏例子反而更快", "文案草稿"],
  ["deepseek-resume-edit", "DeepSeek 改简历：项目经历别写成流水账", "简历修改"],
  ["deepseek-table-clean", "DeepSeek 清理表格备注：少量样例比整表好用", "表格处理"],
  ["deepseek-reading-summary", "DeepSeek 做读书笔记：我用三层摘要法", "读书笔记"],
  ["deepseek-script-draft", "DeepSeek 写短视频脚本：先定镜头再写口播", "脚本草稿"],
  ["deepseek-error-log", "DeepSeek 看错误日志：别只截最后一行", "报错排查"],
  ["deepseek-product-ideas", "DeepSeek 拆产品想法：从用户动作开始写", "产品想法"],
  ["deepseek-interview-prep", "DeepSeek 准备面试：我会让它先追问", "面试准备"],
  ["deepseek-translation-check", "DeepSeek 翻译校对：术语表要提前给", "翻译校对"],
  ["deepseek-outline", "DeepSeek 列提纲：别一上来就让它写全文", "文章提纲"],
  ["deepseek-shopping-compare", "DeepSeek 做选购对比：三项指标够用了", "选购对比"],
  ["deepseek-parenting-notes", "DeepSeek 整理亲子记录：日期和事件分开写", "生活记录"],
  ["deepseek-fitness-plan", "DeepSeek 健身计划：先写时间再写动作", "健身安排"],
  ["deepseek-recipe-plan", "DeepSeek 做一周菜单：预算比菜名更重要", "菜单计划"],
  ["deepseek-contract-read", "DeepSeek 看合同条款：先标不懂的地方", "条款阅读"],
  ["deepseek-job-search", "DeepSeek 求职投递：岗位描述要一起贴", "求职准备"],
  ["deepseek-mindmap", "DeepSeek 做思维导图：先让它出层级", "思维导图"],
  ["deepseek-note-tags", "DeepSeek 给笔记打标签：不要一次分太细", "笔记标签"],
  ["deepseek-speech-draft", "DeepSeek 写发言稿：像人说话才顺", "发言稿"],
  ["deepseek-bug-reproduce", "DeepSeek 复现 Bug：步骤写慢一点更准", "问题复现"],
  ["deepseek-data-clean", "DeepSeek 清洗文本数据：先定保留规则", "文本清洗"],
  ["deepseek-new-user", "DeepSeek 新手第一天：我只试了 4 个任务", "新手上手"],
  ["deepseek-mobile-use", "DeepSeek 手机上怎么用：碎片时间更适合短问", "手机使用"],
  ["deepseek-browser-use", "DeepSeek 浏览器里使用：长文本复制更方便", "浏览器使用"],
  ["deepseek-team-template", "DeepSeek 团队模板：别让每个人都从零写", "团队模板"],
  ["deepseek-daily-review", "DeepSeek 做日复盘：三句话就够开始", "日复盘"],
  ["deepseek-lesson-prep", "DeepSeek 备课资料：先定学生水平", "备课资料"],
  ["deepseek-legal-note", "DeepSeek 整理条款笔记：只做提示不替代判断", "条款笔记"],
  ["deepseek-sales-script", "DeepSeek 销售话术：别把语气写太满", "销售话术"],
  ["deepseek-report-chart", "DeepSeek 解读报表：先问异常点", "报表解读"],
  ["deepseek-faq-draft", "DeepSeek 写产品答疑：我先列真实问题", "产品答疑"],
  ["deepseek-release-note", "DeepSeek 写更新说明：少写套话多写变化", "更新说明"],
  ["deepseek-support-ticket", "DeepSeek 整理工单：状态字段要统一", "工单整理"],
  ["deepseek-outline-review", "DeepSeek 检查提纲：先看顺序再看句子", "提纲检查"],
  ["deepseek-long-text", "DeepSeek 处理长文本：分段比一次塞进去稳", "长文处理"],
  ["deepseek-voice-notes", "DeepSeek 整理语音转写：口头禅先删掉", "语音转写"],
  ["deepseek-community-post", "DeepSeek 写社区帖子：别像公告，像聊天", "社区帖子"],
  ["deepseek-budget-plan", "DeepSeek 做预算表：分类先别太多", "预算计划"],
  ["deepseek-checklist", "DeepSeek 做检查清单：每条都要能打勾", "检查清单"],
  ["deepseek-quick-news", "DeepSeek 使用快记：一次小更新后的感受", "使用快记"],
  ["deepseek-workflow", "DeepSeek 工作流整理：把重复动作固定下来", "工作流"]
];

const structures = ["note", "steps", "review", "checklist", "case", "short", "qa"];

function dateAt(index) {
  const span = end - start;
  const date = new Date(start + Math.round((span / 49) * index));
  return date.toISOString().slice(0, 10);
}

function frontMatter({ title, description, date, slug, category, tags, cover }) {
  return `---
layout: layouts/article.njk
title: "${title}"
description: "${description}"
date: ${date}
category: "${category}"
tags:
${tags.map((tag) => `  - ${tag}`).join("\n")}
cover: "${cover}"
permalink: /jiqiao/${slug}/index.html
---
`;
}

function paragraphs(topic, title, date, structure) {
  const version = structure === "review" ? "DeepSeek 2026.04 桌面环境" : "DeepSeek 2026.06 使用环境";
  const image = `![${topic} 示意图](https://tse-mm.bing.com/th?q=${encodeURIComponent(`DeepSeek ${topic}`).replaceAll("%20", "+")})`;

  if (structure === "review") {
    return `
## 这次我看了三项

${date} 我用 ${version} 重新试了「${topic}」这个场景。说实话，这类任务最怕写得太大，最后看起来很厉害，实际落不到手上。我这次只看三项：输入准备、输出稳定度、后续修改成本。

${image}

## 输入准备：7 分

准备信息越具体，DeepSeek 给出的内容越像能直接用的草稿。我会先写清楚对象、目标和限制，再贴原始材料。比如要改邮件，就补上收件人关系；要整理记录，就补上日期和字段含义。

## 输出稳定度：8 分

我测试时发现，短任务的稳定度更好。一次只让它处理一段、一列或一个小目标，结果通常比较干净。反过来，如果把很多要求揉在一起，它会照顾到一部分，漏掉另一部分。

## 修改成本：6.5 分

第一版一般能省时间，但不是完全不用看。我的做法是先让它输出两个版本，一个稳一点，一个口语一点，再从里面挑句子。这样比反复追问“再自然一点”更快。

## 适合谁用

如果你每天都有重复文字工作，像说明、记录、摘要、回复，这个用法挺适合。要是涉及金额、承诺或正式材料，还是要自己逐条核一遍。
`;
  }

  if (structure === "checklist") {
    return `
## 我先列一张小清单

${date} 这天我试着用 DeepSeek 处理「${topic}」。这类任务不用一上来写长提示，我更喜欢先列清单，把要做的事情拆成能打勾的小项。

${image}

## 准备清单

- 写清楚任务目标，不要只写“帮我处理一下”
- 准备 3 到 5 条真实样例
- 标出不希望改动的内容
- 说明输出格式，比如列表、表格感文本或短段落

## 操作清单

第一步，把原始材料贴进去，让 DeepSeek 先复述它理解的任务。第二步，让它按你的格式输出第一版。第三步，抽查 2 到 3 条结果，看有没有跑偏。第四步，再让它按同一个口径处理剩余内容。

我测试时发现，先让它复述任务这一步很值。它如果理解错了，前面就能发现，不用等生成一大段后再返工。

## 复查清单

最后主要看三处：有没有改错事实，有没有语气过头，有没有漏掉限制条件。只要这三处稳住，剩下多半是文字润色问题。
`;
  }

  if (structure === "case") {
    return `
## 一个真实小场景

${date} 我拿「${topic}」做了一次小测试，环境是 ${version}。原始材料不多，只有一段说明、几个限制条件和一个希望输出的样子。

${image}

## 一开始哪里不顺

第一次我只写了一句“帮我整理一下”，结果 DeepSeek 给得太散，有建议、有总结、还有几句不太需要的解释。不是不能用，但还得自己剪半天。

## 我后来怎么改

我把提示改成三段：先写任务，再贴材料，最后写格式。比如要求它输出 5 条，每条不超过 60 字；如果不确定，就标“需人工确认”。改完以后，结果明显更像草稿，而不是一篇泛泛的说明。

## 最后留下来的做法

这类任务我现在会固定三步走：先让它理解材料，再让它输出短版本，最后只针对不满意的几条继续改。别一次追求完美，反而快一点。

## 容易忽略的点

涉及时间、姓名、价格、版本号的内容，我不会让它自由发挥。它可以帮忙改表达，但事实要自己盯住。
`;
  }

  if (structure === "short") {
    return `
## 这是一条使用快记

${date} 我用 ${version} 试了下「${topic}」。这次没有做复杂测试，只记录一个很实际的感受：DeepSeek 更适合从小任务切入。

${image}

## 我怎么试的

第一步，我只给它一段 200 字以内的材料。第二步，要求它输出三种版本。第三步，把其中一版再压短 30%。这套流程跑下来，比直接让它“写好一点”更容易控制。

## 当天的感受

它给第一版时通常已经能用，但口吻有时会偏稳。要想更像真人写的，我会补一句“像同事发消息，不要像公告”。这句话挺管用。

## 留给下次

下次我会继续试批量材料。现在看，单条内容效果不错，批量时关键还是格式统一。
`;
  }

  if (structure === "qa") {
    return `
## 我这次主要问了几个点

${date} 我围绕「${topic}」做了一轮小测试。为了不写成教程，我直接把自己当时的几个追问记下来，后面再补处理方式。

${image}

## 这个场景要先给什么？

先给目标，再给材料。比如你希望它改写、归纳、分类还是检查，这几个动作差别挺大。目标不清楚时，它就会默认给一段看起来完整但不一定贴合的内容。

## 结果太正式怎么办？

我会补一句“像知乎评论区的正常表达，少一点报告腔”。这句话不是万能，但能把语气往自然方向拉回来。

## 能不能一次处理很多？

可以，但我不建议第一次就这么做。先拿 3 条样例试口径，确认后再分批处理，省得后面整批返工。

## 我会保留哪一步？

我会保留“让它先复述任务”这一步。听起来多余，但能提前发现理解偏差。
`;
  }

  return `
## 我这次怎么试

${date} 我用 ${version} 试了「${topic}」这个场景。我的目标很简单：看看它能不能把零散材料整理成一版能继续修改的草稿，而不是追求一次到位。

${image}

## 三步操作

### 1. 先限定范围

我会先写一句任务边界，比如“只处理下面这段内容，不补充外部信息”。这句话能减少跑题，尤其适合资料、记录和工作文本。

### 2. 再给样例

如果手里有满意的旧内容，我会贴一小段给 DeepSeek 参考。没有样例时，就给它输出格式，比如 5 条列表、每条 40 到 80 字。

### 3. 最后让它自查

第一版出来后，我会让它检查有没有漏掉限制条件。这个步骤不一定每次都抓到问题，但经常能发现语气太满、格式不齐这类小毛病。

## 实际跑下来

我测试时发现，越具体的任务越省事。模糊地说“帮我写好一点”，结果通常还要改；换成“保留事实，语气放轻，压到 120 字以内”，就顺很多。

## 我的处理方式

以后遇到同类任务，我会先做一个短模板，把任务、材料、要求三块固定下来。每次只换材料，不用重新想提示。
`;
}

function expansionBlock(topic, date, structure) {
  const blocks = {
    note: `
## 可以直接套用的小模板

如果你也想试「${topic}」，可以把提示写成这样：先说明“我要处理什么材料”，再说明“最终给谁看”，最后说明“输出成几条”。我一般会补一句“不要扩写事实，只调整结构和表达”，这句挺关键。

举个简单例子：把下面材料整理成 5 条可执行建议；读者是普通用户；语气像朋友提醒；每条 40 到 70 字；不确定的地方用“待确认”标出来。这样写出来的结果不会太散，也方便你继续删改。

## 我会复查的地方

第一看有没有多出来的事实，第二看时间和版本号有没有被改错，第三看语气有没有过头。${date} 这次测试里，我最明显的感受是：DeepSeek 适合帮你把材料变清楚，但不适合替你决定哪些事实是真的。把这个边界记住，用起来就顺很多。
`,
    steps: `
## 细节补充

这类「${topic}」任务，我后来会加一个“检查模式”。第一轮只让 DeepSeek 给结果，第二轮让它检查有没有漏掉条件，第三轮再让它把结果压短。三轮看起来多，其实每轮都很短，比一口气要求它写完更稳。

还有一个小技巧：如果你想要口语一点，不要只写“口语化”。可以写“像同事在群里解释，不要像公告”。如果想稳一点，就写“像操作说明，少用情绪词”。这两个说法比抽象形容更好用。

## 不建议这样做

不要把十几个目标塞进同一段提示里。比如又要改标题，又要写摘要，又要分类，还要生成回复，这种很容易混。拆成两三轮处理，反而更省时间。
`,
    review: `
## 我给自己的判断标准

我不会只看第一版文字漂不漂亮，而是看它能不能减少后续修改。拿「${topic}」来说，如果 DeepSeek 能把材料拆清楚、把语气调到差不多、把格式排好，那就已经有价值了。剩下的事实确认，还是要自己来。

这次我还注意到一个点：同样的材料，提示里加上“保留原意，不新增承诺”，结果会稳一些。尤其是工作场景，承诺、价格、时间这些内容不要让它自由补。

## 我的评分变化

如果只看文字流畅，我会给 8 分；如果看可直接发布，大概 6 到 7 分；如果看节省时间，能到 8 分左右。也就是说，它更像一个草稿助手，不是最终审核人。
`,
    checklist: `
## 我的实际使用顺序

我会先用清单把「${topic}」拆成小项，再让 DeepSeek 逐项处理。比如第一轮只做分类，第二轮再写说明，第三轮才统一语气。这样每一步都能检查，不会一错错一片。

如果材料很多，我会每次只放 10 条左右。处理完后抽 2 条看结果，如果发现口径不对，马上改提示。这个习惯有点笨，但比批量生成后再重改轻松。

## 最后留一条人工规则

凡是涉及个人信息、金额、时间承诺、账号权限的内容，我都会单独标出来。DeepSeek 可以帮忙润色，但这些信息不能让它猜。${date} 这次整理时，我也是靠这条规则避免了好几处不必要的改动。
`,
    case: `
## 这次给我的提醒

「${topic}」这种场景看着简单，但真正影响结果的是前面的材料整理。你给的是一团乱麻，它只能尽量猜；你给的是分好段的材料，它就能像助手一样接着往下做。

我现在会在材料前加三行说明：背景是什么、我要什么结果、哪些内容不能改。只多写几十个字，结果会少很多废话。这个习惯比背复杂提示词更实用。

## 下次我会怎么改

下次我会先准备一个固定模板，把日期、版本、目标、材料、输出格式分开写。遇到同类任务时只替换材料。对普通用户来说，这比研究一堆技巧更容易坚持。
`,
    short: `
## 后续我会补测什么

这篇只是快记，但「${topic}」还可以继续往下测。比如同一段材料分别要求 100 字、300 字和列表版，看哪种更适合真实使用。不同长度下，DeepSeek 的表达会有明显差别。

我也会试着加一个对照样例：先给一段自己喜欢的写法，再让它模仿节奏。这样比单纯说“自然一点”更直观。${date} 这次短测里，最有用的就是把抽象要求换成具体参照。

## 一句话经验

别把 DeepSeek 当成一次出成品的机器。把它当成能快速给第一版的人，再由你来判断和修正，体验会更好。
`,
    qa: `
## 我最后留下来的规则

这次围绕「${topic}」问了几轮后，我给自己留了三条规则。第一，问题要短一点，一次只问一个目标。第二，材料要分段，不要把说明和正文混在一起。第三，输出格式提前说，不要等它写完再抱怨不好复制。

如果要继续追问，我会直接引用上一版里的某一句，而不是笼统说“再改改”。比如“第二条太正式，改成朋友提醒的语气”。这种追问更容易得到想要的版本。

## 适合保存的提示

你可以保存一句基础提示：请先复述你理解的任务，再输出结果；如果有不确定内容，请单独列出。这个提示不花哨，但在 ${date} 的测试里很有用，能提前看出它有没有理解错。
`
  };

  return blocks[structure] || blocks.note;
}

function deepeningBlock(topic, date, index) {
  const variants = [
    `
## 一个更接近日常的例子

比如我手里有一段很乱的记录：里面有时间、人物、任务、几句临时想法，还夹着两句已经过期的信息。以前我会先自己删一遍，再慢慢整理。现在我会先让 DeepSeek 做第一轮分拣：哪些是事实，哪些是待办，哪些只是背景。分完以后，我再人工删掉不需要的内容。

这里不要让它直接写最终版。我的经验是，先分拣，再改写，最后压缩，这三步比一次生成更稳。尤其是「${topic}」这种场景，原材料往往不是干净文本，前面多花 1 分钟说明规则，后面能少改好几轮。

## 我会保留的原始信息

日期、版本号、金额、姓名、地址、账号、承诺时间，这些我都会要求它原样保留。${date} 这次整理时，我还会在提示里写一句“无法判断的内容不要补写”。这句话能减少它替你脑补。
`,
    `
## 适合分批处理的情况

如果材料超过三四屏，我不会一次塞给 DeepSeek。第一批只放少量样例，让它先给出处理口径；第二批再放正式材料；第三批只处理边界情况。这样做看起来慢，其实更像真实工作流，因为你每一步都能看到方向有没有偏。

拿「${topic}」来说，最容易出问题的不是语言，而是口径。比如同一个词在不同场景下意思不一样，同一个动作有时是建议，有时是必须执行。只要你提前把这些边界写清楚，输出就会少很多含糊表达。

## 我的复盘方法

我通常会把第一版结果分成三类：能直接用、稍微改、完全不对。完全不对的内容不会继续追问，我会回到提示里补条件。这样比对着错误结果一直修更省事。
`,
    `
## 给普通用户的写法

不需要写很复杂的提示词。你可以按这个顺序来：我想完成什么、材料是什么、不要做什么、最后给我什么格式。只要这四块写清楚，DeepSeek 在「${topic}」这种任务里就能先给出一个可看的版本。

我测试时发现，很多人少写的是“不要做什么”。比如不要新增事实、不要替换数字、不要改专有名词、不要写得像通知。这些限制越具体，结果越接近你的预期。

## 什么时候该停下来自己改

如果连续追问两轮还是不满意，我一般就不继续问了。说明前面的材料或目标没有讲清楚。这个时候自己改几句，再把修改后的版本给它参考，效果往往比继续要求“再自然一点”更好。
`,
    `
## 一个小型流程

我会把「${topic}」拆成四个动作：收集材料、清理无关内容、生成第一版、人工复查。DeepSeek 主要参与中间两步。它不负责决定最终方向，也不负责替你确认事实。

这个分工很重要。把所有事情都交给它，结果容易变得像一篇漂亮但空的说明；只让它做整理和表达，反而更像一个能用的工具。${date} 这次测试里，我明显感觉到，任务越小，反馈越快。

## 保存成模板

如果这个任务以后还会重复，就把提示保存下来。模板不用长，五六行就够：场景、输入材料、输出格式、语气、限制条件、复查要求。下次只换材料，稳定性会高很多。
`,
    `
## 我会怎么判断结果能不能用

第一，看它有没有完整覆盖原材料。第二，看有没有自己加内容。第三，看输出能不能直接复制到我要用的地方。只要这三点过关，「${topic}」这类任务就算完成了大半。

如果结果看着顺，但漏掉了关键限制，那就不能算好。比如你要求保留版本号，它却把版本号改成了模糊说法；你要求短句，它却写成一大段。这些都要回到提示里修正，而不是只改最终文字。

## 最后的小提醒

我会把 DeepSeek 的结果当成“可修改草稿”。这个定位比较舒服：它帮我省掉从 0 到 1 的时间，我负责判断、删减和确认。这样用下来，压力小很多，也不容易被第一版结果带着跑。
`
  ];

  return variants[index % variants.length];
}

await mkdir("content", { recursive: true });

const generatedSlugParts = new Set(topics.map(([baseSlug]) => baseSlug));
for (const file of await readdir("content")) {
  const match = file.match(/^\d{4}-\d{2}-\d{2}-(deepseek-.+)\.md$/);
  if (match && generatedSlugParts.has(match[1])) {
    await unlink(path.join("content", file));
  }
}

for (let index = 0; index < 50; index += 1) {
  const [baseSlug, title, category] = topics[index];
  const date = dateAt(index);
  const structure = structures[index % structures.length];
  const slug = `${date}-${baseSlug}`;
  const cover = `https://tse-mm.bing.com/th?q=${encodeURIComponent(`DeepSeek ${category}`).replaceAll("%20", "+")}`;
  const content = frontMatter({
    title,
    description: `${category}场景下的 DeepSeek 使用记录，包含 ${date} 的实测过程和可复用做法。`,
    date,
    slug,
    category,
    tags: ["deepseek", baseSlug.replace("deepseek-", ""), structure],
    cover
  }) + paragraphs(category, title, date, structure) + expansionBlock(category, date, structure) + deepeningBlock(category, date, index);

  await writeFile(path.join("content", `${slug}.md`), content, "utf8");
}

console.log("created 50 backfill articles from 2026-04-01 to 2026-06-27");
