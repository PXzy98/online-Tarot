# 07 · 隐私、版权、安全与赞助（全部可替换）

本文件中的每一项都是**可替换模块**，通过 `lib/site/site.config.ts` 这一份配置切换。更换方案时只改配置或增加一个实现，不改业务代码。

```ts
// lib/site/site.config.ts（示意）
export const siteConfig = {
  deckPack: 'rws-1909',                 // §2
  analytics: { provider: 'none' },      // §6：'none' | 'cloudflare' | …
  donation: { providers: [...] },       // §5
  safety: { provider: 'local-keywords' }, // §4
} satisfies SiteConfig;
```

## 1. 隐私

默认情况下：不登录，不收集联系方式，不上传问题和历史，没有广告脚本，没有第三方字体或 CDN 请求，问题不会出现在 URL 中。

- 问题默认只保存在 sessionStorage 中，随标签页关闭而清除；用户勾选“保存问题”后，才会和历史记录一起写入 localStorage。
- 分享和复制默认**不包含问题**，需要用户主动勾选。
- 隐私页如实说明：本地存储了哪些内容、如何清除；托管平台（Cloudflare）会记录标准访问日志（IP、UA 等），这不受本站控制；启用的统计 provider 及其收集范围；赞助链接会跳转到第三方网站，并受其隐私政策约束。
- 隐私页不做无法证实的绝对承诺（例如“100% 不留任何痕迹”）。

## 2. 牌面版权（牌面包机制）

### 默认方案：`rws-1909`

- 来源：Pamela Colman Smith 绘制、1909 年出版的原版 RWS 牌面扫描图，优先使用 Wikimedia Commons 上标注为公共领域的扫描文件。
- 权利状态：1909 年出版的作品在美国属于公共领域；作者于 1951 年去世，按“作者去世后 70 年”规则，在欧盟和英国等地自 2022 年起也进入公共领域。**每个文件仍需逐个核实其页面上的授权标注**。
- 明确不使用：U.S. Games Systems 1971 年以后的重新上色版本，以及任何现代重绘或重新上色的版本。
- 记录：`docs/ASSET_LICENSES.md` 中逐张记录来源 URL、文件页面上的授权声明、获取日期，以及做过的处理（裁剪、调色、压缩）。

### 备用方案：`still-minimal`

- 原创的极简 SVG 牌面（编号、花色符号、几何构图），版权完全归本项目所有。
- 在 `rws-1909` 的素材核实完成之前，开发阶段使用这一套；如果将来发现某张图存在权利问题，也可以随时整体切换。

### 牌面包接口

```ts
type DeckPack = {
  id: string; name: Record<Locale, string>;
  aspectRatio: number;
  back: string;                               // SVG 路径
  face(cardId: CardId, width: 240 | 480 | 960): string;
  license: { summary: Record<Locale, string>; detailsUrl: string };  // 显示在关于页
};
```

更换牌面 = 新增一个牌面包目录和 manifest + 修改 `siteConfig.deckPack`。

## 3. 内容版权

卡牌文字为原创，参考来源只限公共领域文献（见 05 §1）。项目代码和内容的许可证（例如代码用 MIT、内容用 CC BY-NC-SA 或保留所有权利）由你决定，在 P6 之前写进 `LICENSE` 和关于页。**这一项需要你来拍板**。

## 4. 安全提示（问题文本检查）

### 默认方案：`local-keywords`

- 完全在本地运行，不上传问题。
- 词表：`content/safety/{locale}.yaml`，分为 `crisis`（自杀、自伤、想死、kill myself 等）和 `sensitive.{medical|legal|financial}` 两类。
- 命中 `crisis` 时：结果页最先显示求助卡片，内容为当地心理援助热线、紧急电话，以及“你并不孤单，请联系能帮助你的人”这类温和的文字。解读折叠在后面。
- 命中 `sensitive` 时：在解读之前插入一行领域提示。
- 求助资源按语言配置，列出地区、名称、电话或链接、核实日期：

```yaml
# content/safety/zh.yaml
resources:
  - region: CN
    name: …        # 上线前由人工核实号码与可用时间
    contact: …
    verifiedAt: …
```

**热线号码上线前必须人工核实**，不能凭记忆填写。在核实之前，至少显示“请联系当地的紧急服务或心理援助热线”这句通用文字。

### 可替换性

`SafetyProvider` 接口为 `check(text, locale) → { level, domains }`，将来可以替换为更精细的本地分类器。

## 5. 赞助

### 默认方案

```ts
donation: {
  providers: [
    { id: 'alipay',  kind: 'qr',   image: '/donate/alipay.png', label: { zh: '支付宝', en: 'Alipay' } },
    { id: 'patreon', kind: 'link', url: 'https://www.patreon.com/<你的账号>', label: { zh: 'Patreon', en: 'Patreon' } },
  ],
  order: { zh: ['alipay', 'patreon'], en: ['patreon', 'alipay'] },
}
```

- `kind: 'qr'` 显示静态图片（放在本地 `public/donate/`），并配有替代文字和“长按或扫码”的说明；`kind: 'link'` 是普通外链。
- 可以随时加入 Ko-fi、Buy Me a Coffee、GitHub Sponsors、微信赞赏码等，只需在配置中增加一项。
- **没有任何支付 SDK 或嵌入脚本**，所以不需要放宽 CSP。

### 出现位置

- `/support/` 赞助页：说明网站永久免费、运营成本主要是域名、赞助完全自愿且不解锁任何功能。
- 页脚：一条“支持静观”的文字链接。
- 结果页底部：一行低调的文字链接。
- **不出现**：弹窗、占卜流程中的打断、倒计时、“解锁更多”之类的话术。

### 需要你自行确认的事项

- 支付宝收款码的使用条款（个人收款码是否适用于网站公开收款），以及所在地区对个人收取赞助的税务要求。
- Patreon 的创作者条款。
- 收款码图片中可能含有姓名等个人信息，上传前请确认你愿意公开这些信息。

## 6. 统计

- 默认：`none`。
- 可选：`cloudflare`（Cloudflare Web Analytics，不使用 cookie，只提供聚合数据）。启用后，CSP 自动放行对应的脚本和上报域名，隐私页的相应段落也会自动显示。
- 任何 provider 都**不得**接收问题文本、牌面结果或历史记录。只允许页面浏览类的聚合数据。
- 接口为 `AnalyticsProvider { scriptSrc?, connectSrc?, privacyNote: Record<Locale,string> }`。

## 7. 免责声明

- 首页一行，页脚一行：“塔罗解读仅供娱乐参考，不构成医疗、法律、财务或其他专业建议。”
- 不在每次占卜时都弹窗。
