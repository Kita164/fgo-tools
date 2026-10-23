# FGO 工具

给国服（Bilibili）玩家用的 Fate/Grand Order 静态小站。第一个工具是 **羁绊加成礼装组合查询**：选出几张带从者条件的羁绊礼装，看哪些从者能同时吃到，未满破和满破的合计是多少。

从者收到日服最新。国服已有的用国服名字，还没实装的保留日文名，并标成「日服未实装」。

线上地址（启用 Pages 之后）：<https://kita164.github.io/fgo-tools/>

## 启用 GitHub Pages

工作流没法替你打开 Pages 开关。合并到 `main` 之后，到仓库 **Settings → Pages → Build and deployment → Source**，选 **GitHub Actions**。

`main` 上的推送会跑 [`.github/workflows/pages.yml`](.github/workflows/pages.yml)，构建 `dist/` 并发布。如果站点 404，多半是 Source 还没改成 GitHub Actions。

每日更新要能把新数据推回 `main`，还需要 **Settings → Actions → General → Workflow permissions** 选 **Read and write permissions**。

## 本地开发

```bash
npm ci
npm test
npm run dev
```

开发地址是 <http://localhost:5173/fgo-tools/>（和 Pages 一样带子路径）。

```bash
npm run build
npm run preview
```

## 更新从者与礼装数据

数据来自 [Atlas Academy](https://api.atlasacademy.io) 的日服、国服 `nice_servant` / `nice_equip`。

```bash
python3 scripts/build-data.py            # 用 scripts/.cache，没有就下载
python3 scripts/build-data.py --refresh  # 强制重新下载
```

生成 `src/data/bond.json`。除掉「更新时间」之外没有变化时，不会改这个文件。

每天 02:00 UTC，[`.github/workflows/update-data.yml`](.github/workflows/update-data.yml) 会重新拉取。有变化才提交并重新部署。也可以在 Actions 页手动运行 **Update game data**。

日服有、国服导出里还没有的礼装描述，可以补在 [`scripts/translations_cn.json`](scripts/translations_cn.json)，键是礼装 id。

## 羁绊礼装怎么判定

- 只收技能里带 `servantFriendshipUp`（通关羁绊提升）、并且写了从者条件的礼装。
- 全体都能吃到的（迦勒底午茶 / 午餐 / 晚餐时光等）以及没有从者条件的活动自用礼装不收。
- `RateCount` 是千分比，40 就是 4%。满破取同一技能的最高强化档。
- `functvals` 里多个特性是「或」；`overWriteTvalsList` 组内是「且」、组间是「或」。特性 id 等于某从者 id 时，只表示该从者本人。
- 灵基和灵衣分开算。只在部分形态下满足的从者，页面上变淡并标 `*`。组合查询还要求同一个灵基同时满足已选的全部条件。
- 多张礼装、同一张的多份，按效果直接相加估算。这是推定，不是逐条实测。

## 页面

- `/` 首页
- `/bond` 组合查询
- `/bond/groups` 按礼装看对应从者
- `/bond/servants` 按从者反查适用礼装和合计
- `/updates` 国服更新追踪（占位，还没做）
