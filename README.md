# Minesweeper 2.0

一个老游戏，一点新模样。用米白、蓝色和一块小棋盘，重新打开当年的扫雷作业。

**[直接游玩 →](https://shipiyouniao.github.io/Minesweeper-2.0/)**

- 简约界面和原创素材，支持桌面与手机。
- 中文、English、日本語；初级 9×9 / 10 雷、中级 16×16 / 40 雷、高级 30×16 / 99 雷，以及自定义练习棋盘。
- 首次点击及周围八格始终安全；空白区域自动展开；支持插旗与数字连开。
- 暂停、离开页面自动暂停、按难度恢复进度、浏览器本地前 10 名纪录。
- 纯静态网页，不需要登录、服务器或 NW.js。

## 本地运行

Node.js 22.12+（22 系列）或 24+。

```sh
npm ci
npm run dev
```

打开 `http://127.0.0.1:5173/Minesweeper-2.0/`。开发命令先运行原生 TypeScript 编译器，再同时启动原生编译 watch 和 Vite。修改 TypeScript 后，浏览器消费的是 TS7 实际生成的 JavaScript。

```sh
npm run typecheck          # 严格检查应用、测试、Vite 配置
npm test                   # TS7 编译测试，再由 Node 原生 test runner 执行
npm run build              # TS7 生成 JS / .d.ts，再交给 Vite 打包
npm run preview            # 预览生产构建
npm run check              # typecheck + test + build
node scripts/verify-build.mjs
npm audit
npm run bench:types        # 真实项目 + 合成类型负载 + 错误诊断探针
npm run bench:types -- --files 2000
```

## 操作

| 操作 | 桌面 | 手机 / 键盘 |
| --- | --- | --- |
| 翻开 | 左键 | 轻点；空格或 Enter |
| 插旗 / 取消 | 右键 | 长按；插旗模式；F |
| 连开相邻格 | 再点已翻开的数字 | 同左 |
| 移动焦点 | — | 方向键，Home / End |
| 暂停 | 暂停按钮 | P |
| 新一局 | 新一局按钮 | N |

连开要求周围旗帜数与数字相同，插错旗仍会踩雷。大棋盘在手机上可横向滚动。自定义棋盘用于练习，不参与预设难度的纪录排名。

进度和纪录仅保存在当前浏览器的当前网站来源下，不会跨设备同步。浏览器禁止存储时仍能游玩。旧版 `MinesweeperRank` 排行榜在同一来源下可自动迁移；旧版未完成棋盘不迁移。`game.html` / `menu.html` 旧链接及语言、难度参数仍可跳转到新版本。

## 布雷算法

在首次翻开时，排除该格及其邻格，构造其余位置列表；使用带种子的 Fisher–Yates 洗牌，取前 M 个不同位置布雷，再计算邻格数字。随机索引使用拒绝采样，避免取模偏差。每局种子来自浏览器 `crypto.getRandomValues`。

这解决了旧版逐格概率扫描、重复放置及递归重试的问题。布雷复杂度为 O(格子数)，空白展开使用迭代队列。相同种子和首击位置可重现同一布局，便于测试和存档。首击安全不代表整局保证无猜解。

## TypeScript 7 实验

固定使用 **`typescript@7.0.2`**。它是 Go 原生编译器的正式发布包，命令名称为 `tsc`；`tsgo` 是原预览包的命令。没有把旧版编译器当成兜底。

```text
src/*.ts → TypeScript 7 native → .native/app/*.js + *.d.ts → Vite → dist/
tests/*.ts → TypeScript 7 native → .native/tests/ → node --test
```

开启 `strict`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`、`erasableSyntaxOnly`、未使用项检查和完整库类型检查。游戏逻辑不依赖 DOM、时钟或存储，界面和存储分别调用纯状态转换。

压测程序可调整模块数量，保存三次独立进程测量、原生 `--extendedDiagnostics` 和负向类型错误校验结果到 `.bench/results.json`。它还对比相同模块在有 / 无跨模块巨型联合类型时的负载。详见 [实验记录](docs/typescript7.md)。

参考：[原生编译器官方说明](https://github.com/microsoft/typescript-go)。

## CI 与 GitHub Pages

`.github/workflows/pages.yml` 在 PR 和 main 推送时执行干净安装、依赖审计、类型检查、测试、构建和静态路径校验。只有 main 的检查通过后，才上传 `dist/` 并发布到 GitHub Pages。

仓库 Pages 的来源应设置为 **GitHub Actions**。站点位于 `/Minesweeper-2.0/`，Vite 的 `base` 已匹配此路径。Fork 或改名后，需同步调整 `vite.config.ts` 的 base 和 `scripts/verify-build.mjs` 的校验路径。

## 素材与原版

原创插画、SVG 图标和完整生成提示词记录在 [素材说明](docs/artwork.md)。旧版本的源码与图片仍保存在 Git 历史中。

原项目由 SPYN 制作，作为工程实践作业。延续原版说明：仅供学习参考，非商业用途。
