# GitHub 安全协作版本（2026-10-29）

按负责人授权，仅在独立副本重写历史。原始项目、所有提交与标签未修改；本地完整 bundle 和 66 项资产归档验证通过。

## 排除范围与差异

精确清单见 github-excluded-assets.json：55 个历史路径，48 个独立 blob，包括 Masar 对标截图、来源未登记的原设计图片、原地点分类 PDF；已按内容哈希检查其他路径别名。其余 164 幅历史图像逐张缩略核对为本项目地图/研究现场截图，保留；没有批量删除文档图片。

Masar 只作参考：https://www.masardestination.com.sa/ ；https://immersive-g.com/projects/masar-destination/ 。

原型 prototype-html 的静态示意底图、方案封面和附件预览改为自制 SVG 占位，明确注明不属于研究证据。旧 public/assets 图片不提供。正式 /experience、地图渲染、相机、AOI、GIS、地点和研究/方案数据不改。归档版本保留代码，但其旧图片引用可能缺图；不宣称旧归档图片完整。

## 历史关系

32 个历史提交保留顺序和父子关系，仅过滤指定素材，提交 SHA 改变。逐提交映射见 github-commit-map.txt。协作 version1 指向 27e30f9c523ab44ffd7b4c311c85c3087be05e25；原 version1 仍指向 cdcd8dd1f8c67944be5b6b89a2813fa0518a54e2。名称相同不代表 hash 相同。

## 后续同步

团队从 GitHub main 克隆，在 codex/ui-*、codex/data-*、codex/map-* 分支开发并提出 PR。不要把原始仓库的历史 merge/push 到协作仓库，也不要推送原始标签。原始项目后续成果仅以经过审核的源码差异移植到新功能分支，排除图片、PDF、环境、数据库与备份后重跑检查，再 PR；不要盲目复制整个目录。原始项目继续作为完整毕业设计档案保存。

## 验证与远端

本次新验证与远端上传结果待补充；此前原始仓库测试结果不能代替本次验证。主分支保护待 API 检查，文档不等同于已启用。
