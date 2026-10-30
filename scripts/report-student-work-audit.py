"""Generate reviewable Markdown from the sanitized course resource audit."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name):
    return json.loads((ROOT / 'src/student-works' / name).read_text(encoding='utf-8'))


def cell(value):
    return str(value).replace('|', '\\|').replace('\n', ' ')


def main():
    works, audit, reviews = load('source.json'), load('media-audit.json'), load('location-review.json')
    names = {'tongguan':'铜官窑附近','juzizhou':'橘子洲','ezhou':'鹅洲','baxi':'巴溪洲',
             'yanghu':'洋湖湿地','site-011':'渔人码头','site-031':'潮宗街',
             'student-beichen':'北辰三角洲','student-oil1936':'油脂厂1936',
             'student-juzizhou-bridge':'橘子洲大桥','student-houzishi-west':'猴子石大桥西岸',
             'student-yuxiang':'裕湘纱厂（入口参考）','site-025':'大王山（片区导航）'}
    lines = ['# 学生作品—地理地点与媒体核对表 V4', '',
             '任务：[Issue #3](https://github.com/Hoooocola/xiangjiang-2035/issues/3)。核对日期：2026-10-30。', '',
             '以用户提供的 Excel `作业名单!A5:G28` 为原始字段依据。文件 SHA-256：`' + works[0]['source']['sha256'] + '`。逐件读取 24 个实际 Pinwall 项目页，另以课程列表官方 profileImage 核对封面；没有用 PDF 内页代替封面。', '',
             '24 个 ID、标题、完整成员组、主题、原选址和原地点类型与 Excel 一致；24 件实际页标题/成员和官方方形封面均匹配。无遗漏、无重复。课程公开列表另有 2 件不在本 Excel 内的作品，未擅自加入。四主题仍为 5 / 9 / 7 / 3 件。', '',
             '## 地点修复与待确认', '',
             '- 以用户后补的修订表为准，修订仅两处原选址：第18组 大王山→巴溪洲；第19组 渔人码头到裕湘…→渔人码头和裕湘纱厂。修订来源与旧值保存在 source-revisions-v4.json。既有正式地图坐标不变。补查地图后，最终为 20 件已有地图关联、4 件未绑定地点、13 个导航地点；仅近似导航，不代表完整作品研究边界。[地图来源与精度](student-work-locations-v4.md)。',
             '- 修复 66171 的单地点表达限制：作者实际介绍明确列出铜官窑、橘子洲、鹅洲岛三类枢纽，保留主选址铜官窑，增加橘子洲和鹅洲两个关联。地点列表现分别有 3、4 件作品；24 件作品没有被重复计入总数。',
             '- 修复跨地点选择上下文：从橘子洲/鹅洲目录进入该作品时，使用点击地点，不再跳回主选址铜官窑；列表、标记和筛选使用同一关系函数。',
             '- 未绑定的4件：文津码头的流岸·2035、记忆·川上转、江边共话站；城南街区的 Reconnect江脉重连。保留原选址及原因，不猜坐标；仍可打开作品媒体。',
             '- 66185 已按修订表关联既有巴溪洲，旧表冲突已解决。66187 已关联渔人码头与裕湘纱厂入口参考；不将两点连线或任何单点冒充完整研究走廊。当前分类以修订表单元格为准，表尾沿用的旧备注不再推翻当前值。',
             '- WEAVE WAVE 提到渔人码头与“橘子洲上部未开发洲岛”，第二处的精确地点仍有歧义，未强行追加一个岛屿坐标。', '',
             '## 逐件作品与地点', '',
             '| 组/行 | ID / 标题 | 完整成员 | 主题 | Excel 原选址 / 类型 | 地图关联（主选址优先） | 状态与待确认 |',
             '|---|---|---|---|---|---|---|']
    for work in works:
        ids = reviews.get(work['id'], {}).get('placeIds') or ([work['placeId']] if work['placeId'] else [])
        mapped = '；'.join(names.get(i,i) + ' `' + i + '`' for i in ids) or '无 placeId'
        status = ('部分关联；另待定位 '+ '、'.join(work['pendingLocationNames']) if work.get('pendingLocationNames') and ids else '已补充多地点关系' if len(ids)>1 else '名称匹配；既有近似导航' if ids else '待确认 / 暂不定位')
        notes = '；'.join(work['reviewNotes']) or work['locationNote']
        values = [f"{work['sequence']} / {work['source']['row']}", f"[{work['id']}]({work['projectUrl']}) · {work['title']}",
                  '、'.join(work['members']),work['theme'],work['originalSite']+' / '+work['originalSiteType'],mapped,status+'；'+notes]
        lines.append('| ' + ' | '.join(map(cell,values)) + ' |')
    lines += ['', '## 封面、PDF 与视频清单', '',
              '附件使用 GET 签名，HEAD 的 403 不能证明资源不可访问。本次只发出 GET Range bytes=0-0：25 份 PDF 与 3 个视频均返回 206，并分别确认 application/pdf 和 video/mp4；未下载完整报告或视频。该结果是检查时的访问快照，不保证未来第三方资源始终可用。', '',
              '| 作品 ID | Excel / 实际页标题 / 完整成员 | 方形封面 / 本地 hash | PDF 原附件路径 | 视频数 / 状态 |',
              '|---|---|---|---|---|']
    for work in works:
        result = audit[work['id']]
        identity = '全部一致' if all(result[k] for k in ('excelMatch','titleMatch','membersMatch')) else '待核对'
        covers = '官方封面匹配 / hash 一致' if result['coverMatch'] and result['coverSha256Match'] else '待核对'
        pdfs = '；'.join('`'+x['resourcePath']+'` '+x['accessProbe']['status'] for x in result['pdfs'])
        videos = str(len(result['videos'])) + (' / 已核验访问，外链' if result['videos'] else ' / 未发现独立视频附件')
        lines.append('| ' + ' | '.join(map(cell,[work['id'],identity,covers,pdfs,videos])) + ' |')
    lines += ['', '## 视频来源与嵌入分类', '',
              '| 作品 | 视频 ID / 原附件路径 | 来源页面 | 来源平台 | 无登录访问 | 嵌入状态 / 交互 |',
              '|---|---|---|---|---|---|']
    for work in works:
        for video in audit[work['id']]['videos']:
            lines.append('| ' + ' | '.join(map(cell,[work['title'],f"`{video['id']}` / `{video['resourcePath']}`",
                         video['sourceUrl'],video['provider'],video['accessStatus']+'（单字节请求）',
                         '未核验嵌入许可；仅新标签页播放，失败提供原作品链接']))+' |')
    lines += ['', '只有 66171、66192、66184 三件有独立视频附件；其余 21 件本次公开作品页未发现独立视频附件。不能据此推断 PDF 内部、需要登录的区域或作者其他网站绝对没有视频。当前可嵌入视频为 0，外链视频为 3；不把“未核验嵌入”误标为“禁止嵌入”。', '',
              '## 数据契约、加载与失败处理', '',
              '- StudentWork 增加可选 placeIds 与 media，保留 placeId、pdfUrl、coverImage 等兼容字段。PDF、视频始终绑定作品，多个作品不混合媒体来源。',
              '- 视频记录区分 sourceUrl、provider、accessStatus、embedStatus、loginRequired、checkedAt 和证据。未验证的 embedUrl 不生成；不拼接 iframe 地址。',
              '- 列表仅呈现小封面与文本操作；多个视频或 PDF 使用轻量 details 索引。没有视频则没有视频入口。',
              '- 默认“观看视频”直接在新标签页打开 Pinwall 原作品页，选择其中的视频附件观看；现场优先可靠外链，不依赖本项目服务器访问第三方的速度。本机实际测试中直链解析偶发超时，因此没有将它用作默认入口。',
              '- 另保留受限的直接附件解析路由供明确选择时使用：获取新签名、单字节检查、302 到原附件。不代理视频正文、不缓存签名 URL、不存储视频。该路径不是列表默认入口。',
              '- 页面超时、附件消失、资源不可访问或登录响应时，显示可读的失败说明及 Pinwall 原页链接。不存在的作品或视频 ID 返回 404。',
              '- 地图页没有 video / iframe / source 播放器，不自动播放、不预下载视频，也没有隐藏播放器实例。外部标签页的关闭与播放由浏览器管理；地图内同时播放数始终为 0。',
              '- 未改地图引擎、相机、AOI、材质、光照、正式地点注册和数据库。本轮只通过现有 focus API 请求既有地点聚焦。', '',
              '## 可复现检查', '',
              '使用仓库脚本 `scripts/audit-student-work-media.py --excel <老师原表绝对路径> --refresh`；需要 bundled Python / openpyxl 与 curl。原始页面仅保存到 gitignore 的 .audit/pinwall-v4；提交的 media-audit.json 只含核验字段、正文 hash、规范资源路径和访问结果，无完整页面、签名 URL、成绩或个人头像。', '',
              '`scripts/report-student-work-audit.py` 从核验数据生成本文。演示前重新核验第三方资源；PDF 与视频均保留原作品页作为回退。', '',
              '## 授权与待补资料', '',
              '沿用用户对课程作品 GitHub 共享的授权；作品版权归原作者，未新增“可任意嵌入或重新托管”的许可声明，不下载或重新托管视频。待补：4 件未绑定地点作品的导航信息、WEAVE WAVE 第二处试点的精确地点。修订表已解决的66185/66187原选址冲突不再列为待确认。', '']
    target = ROOT / 'docs/student-work-media-audit-v4.md'
    target.write_text('\n'.join(lines), encoding='utf-8')
    print(target)


if __name__ == '__main__':
    main()
