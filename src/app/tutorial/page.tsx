'use client';

import { useState } from 'react';
import {
  BookOpen,
  Play,
  Layers,
  Image,
  Video,
  MousePointer,
  Palette,
  Save,
  Share2,
  Coins,
  Gift,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Monitor,
  Sparkles,
  Clock,
  Move,
  Volume2,
  Settings,
  Users,
  CreditCard,
  Crown,
} from 'lucide-react';

const tutorials = [
  {
    id: 'getting-started',
    title: '快速入门',
    icon: Play,
    color: 'purple',
    description: '了解编辑器的基本界面和操作方式',
    sections: [
      {
        title: '创建项目',
        content: '点击"新建项目"按钮，输入项目名称即可创建。支持多种画布比例：横屏（16:9）、竖屏（9:16）、正方形（1:1）以及自定义尺寸。',
        tips: '选择画布比例时，请考虑目标播放平台（如手机竖屏、电脑横屏）。',
      },
      {
        title: '界面布局',
        content: '编辑器分为左右两个区域：左侧是组件库和图层列表，右侧是画布和属性面板。画布用于编辑和预览，属性面板用于调整选中元素的属性。',
        tips: '图层列表在左侧底部，可以拖拽调整高度或折叠。',
      },
      {
        title: '2D/3D 模式切换',
        content: '2D模式专注于UI编辑（按钮、文字、图片等），不显示全景背景。3D模式专注于全景场景和热点编辑，可添加/编辑3D空间中的交互点。',
        tips: '热点只在3D模式下显示，预览时会与2D UI叠加显示。',
      },
      {
        title: '锚点定位',
        content: '选中元素后，可使用顶部工具栏的锚点下拉框快速移动到画布对应位置（左上、居中、右下等），支持"铺满全屏"选项。',
        tips: '锚点功能可快速对齐元素位置，提高编辑效率。',
      },
    ],
  },
  {
    id: 'scenes',
    title: '场景管理',
    icon: Layers,
    color: 'blue',
    description: '创建和管理互动短剧的场景',
    sections: [
      {
        title: '创建场景',
        content: '点击场景面板的"+"按钮创建新场景。每个场景可以设置全景背景图或视频，支持360度全景格式（等距圆柱投影）。',
        tips: '推荐使用 2:1 比例的全景图片（如 4096×2048）以获得最佳效果。',
      },
      {
        title: '场景转场效果',
        content: '支持8种转场效果：淡入淡出、叠化、滑动、缩放、擦除、翻转、模糊、无。在场景属性中选择转场效果和持续时间（0.5-2秒）。',
        tips: '转场时间不宜过长，建议0.5-1秒，避免影响用户体验。',
      },
      {
        title: '场景跳转',
        content: '通过事件系统实现场景跳转。在按钮或其他元素上添加点击事件，选择"跳转场景"动作，指定目标场景即可。',
        tips: '结合转场效果可以让场景切换更加流畅自然。',
      },
    ],
  },
  {
    id: 'elements',
    title: '元素编辑',
    icon: Image,
    color: 'green',
    description: '在场景中添加和编辑各种交互元素',
    sections: [
      {
        title: '基础组件',
        content: '包括图片、视频、音频、按钮、文字、面板等。从左侧组件列表拖拽到画布即可添加。支持PNG透明图片和WebM透明视频。',
        tips: '组件列表点击仅预览属性，拖拽才会添加到画布。',
      },
      {
        title: '热点控件',
        content: '热点是3D空间中的交互点，只在3D模式下显示和编辑。支持设置3D空间位置（yaw水平角度/pitch垂直角度），预览时与2D UI叠加显示。热点支持完整的样式属性（旋转、缩放、圆角、字体大小、图标等）。',
        tips: '在3D模式下拖拽热点到场景中的目标位置，系统会自动计算yaw/pitch值。',
      },
      {
        title: '元素层级管理',
        content: '图层列表底部 = 画布最上层（z-index = 10 + index）。通过上下移动按钮调整元素层级。支持父子关系，子元素跟随父元素移动和删除。',
        tips: '建立父子关系：在属性面板中选择父元素，或拖拽元素到父元素上。',
      },
      {
        title: '元素属性',
        content: '选中元素后，右侧属性面板可调整：位置、尺寸、旋转、透明度、样式、事件等。支持动画效果预览。',
        tips: '使用百分比定位可以让元素在不同尺寸屏幕上保持相对位置。',
      },
    ],
  },
  {
    id: 'media',
    title: '媒体资源',
    icon: Video,
    color: 'orange',
    description: '管理项目中的图片、视频和音频资源',
    sections: [
      {
        title: '上传资源',
        content: '支持上传图片（PNG/JPG/WebP/GIF）、视频（MP4/WebM）和音频（MP3/WAV）文件。文件大小限制100MB，资源存储在云端对象存储中。',
        tips: '推荐使用压缩后的媒体文件，减少加载时间。',
      },
      {
        title: '全景背景',
        content: '支持360度全景图片和视频作为场景背景。在场景属性中设置全景背景，视频默认静音自动播放（浏览器限制：非静音视频不能自动播放）。',
        tips: '全景视频推荐使用H.264编码，确保浏览器兼容性。',
      },
      {
        title: '透明媒体',
        content: '支持PNG透明图片和WebM透明视频，容器背景强制透明，可以叠加显示在其他元素上方。',
        tips: 'WebM透明视频需要VP8/VP9编码，可在大多数现代浏览器中播放。',
      },
      {
        title: '点击音效',
        content: '按钮和面板组件支持点击音效。在属性面板中设置音效URL或上传音频文件，预览时点击元素自动播放。',
        tips: '音效文件建议小于100KB，使用MP3格式确保兼容性。',
      },
    ],
  },
  {
    id: 'events',
    title: '事件系统',
    icon: MousePointer,
    color: 'pink',
    description: '创建互动逻辑和剧情分支',
    sections: [
      {
        title: '触发方式',
        content: '支持多种触发方式：点击、悬停、长按。可以为每个元素设置多种事件类型，满足不同的交互需求。',
        tips: '悬停触发适合提示信息，点击触发适合主要操作，长按触发适合隐藏功能。',
      },
      {
        title: '动作类型',
        content: '支持18种动作类型：\n• 场景控制：跳转场景、重置场景\n• 元素显示：显示/隐藏元素、切换显示\n• 媒体控制：播放/暂停/停止、设置音量\n• 属性控制：设置透明度、移动位置、缩放\n• 动画效果：淡入/淡出、滑动、缩放、旋转\n• 流程控制：延迟执行、条件判断',
        tips: '一个触发事件可以执行多个动作，按顺序依次执行。',
      },
      {
        title: '视频时间触发器',
        content: '视频元素支持时间触发器，在播放到指定时间时自动触发动作（如显示/隐藏元素、跳转场景）。触发前目标元素自动隐藏。在视频元素的事件标签页中配置。',
        tips: '可以设置多个时间触发器，实现剧情分支效果。',
      },
      {
        title: '动画预览',
        content: '在属性面板中点击"预览动画"按钮，可实时预览12种动画效果和9种插值类型，包括滚动、弹跳、弹性、回弹等。',
        tips: '选择合适的插值类型可以让动画更加自然流畅。',
      },
    ],
  },
  {
    id: 'style',
    title: '样式与动画',
    icon: Palette,
    color: 'indigo',
    description: '美化元素外观和添加动态效果',
    sections: [
      {
        title: '外观设置',
        content: '边框支持多种样式（实线、虚线、点线、双线），可设置颜色和宽度。阴影支持多种预设（小/中/大/超大阴影、发光效果），可调整模糊和偏移。',
        tips: '发光效果适合按钮和重要元素的强调。',
      },
      {
        title: '背景透明度',
        content: '文本、按钮、面板元素支持背景透明度调节（0%-100%）。通过 hexToRgba 函数实现，可创建半透明效果。',
        tips: '半透明背景可以增加层次感，同时不遮挡全景场景。',
      },
      {
        title: '字体选择',
        content: '支持中文字体（微软雅黑、黑体、宋体、楷体等）和英文字体（Arial、Times New Roman、Courier New等）。文本元素默认无边框、透明背景、无阴影。',
        tips: '选择清晰的字体，确保在不同设备上可读性良好。',
      },
      {
        title: '过渡动画',
        content: '新增多种过渡类型：左滑、右滑、上滑、下滑、弹跳、脉冲、抖动等。支持动画插值类型：线性、缓入、缓出、缓入缓出、滚动、弹跳、弹性、回弹。',
        tips: '动画时长建议在0.3-0.8秒之间，过短看不清，过长影响体验。',
      },
    ],
  },
  {
    id: 'save',
    title: '保存与发布',
    icon: Save,
    color: 'teal',
    description: '项目数据的存储、同步和发布',
    sections: [
      {
        title: '本地存储',
        content: '未登录用户使用浏览器本地存储（IndexedDB），容量可达几百MB-几GB。项目自动保存，类似剪映体验，无需手动操作。',
        tips: '清除浏览器数据可能导致本地项目丢失，建议定期登录同步。',
      },
      {
        title: '云端同步',
        content: '登录后每次保存自动同步到云端（Supabase Storage），支持跨设备访问。Dashboard显示同步状态和最后同步时间。点击"手动同步"按钮可强制同步所有本地项目。',
        tips: '云端同步确保数据安全，防止因设备故障导致项目丢失。',
      },
      {
        title: '发布作品',
        content: '保存项目后自动生成唯一的分享码，他人可通过分享码访问你的作品。可将作品设为公开，公开后会显示在首页作品列表中，支持分类筛选和排序。',
        tips: '公开作品需要通过审核，审核通过后可获得快乐豆奖励。',
      },
      {
        title: '分享功能',
        content: '支持微信分享（生成二维码）、QQ分享和复制链接。分享链接指向邀请页面，好友扫码注册后双方各得50快乐豆奖励。',
        tips: '使用"微信赚豆"按钮分享，可获得邀请奖励。',
      },
    ],
  },
  {
    id: 'coins',
    title: '积分与收入',
    icon: Coins,
    color: 'yellow',
    description: '快乐豆系统、作品定价和收入提现',
    sections: [
      {
        title: '快乐豆系统',
        content: '快乐豆是平台虚拟货币，用于购买付费作品和充值订阅。新用户注册赠送100豆，可购买低价作品体验。',
        tips: '快乐豆不可转让，仅限在本平台使用。',
      },
      {
        title: '作品定价',
        content: '创作者可以为作品设置观看价格（0=免费）。观众购买付费作品消耗快乐豆，创作者获得收入。平台抽成10%（10豆以下不抽成），创作者获得90%。',
        tips: '合理定价可吸引更多观众，建议新手作品免费或低价。',
      },
      {
        title: '充值方法',
        content: '支持扫码充值（微信/支付宝）：选择套餐 → 显示收款二维码 → 扫码付款 → 上传凭证 → 管理员审核 → 自动到账。\n充值套餐：100豆/10元、500豆/45元、1000豆/80元、5000豆/350元。',
        tips: '大额套餐更优惠，5000豆套餐相当于7折。',
      },
      {
        title: '收入提现',
        content: '创作者收入累计后可申请提现。在个人中心查看收入统计和交易记录，支持微信/支付宝提现。',
        tips: '提现需达到最低金额要求，具体规则以平台公告为准。',
      },
    ],
  },
  {
    id: 'invite',
    title: '邀请奖励',
    icon: Gift,
    color: 'rose',
    description: '分享邀请链接，双方获得奖励',
    sections: [
      {
        title: '邀请机制',
        content: '每个用户拥有专属邀请码。分享邀请链接给好友，好友注册成功后，双方各得50快乐豆奖励。奖励自动到账，无需人工审核。',
        tips: '邀请越多，奖励越多，上不封顶。',
      },
      {
        title: '分享方式',
        content: '在作品播放页面点击"分享"按钮，选择"微信赚豆"，生成包含邀请链接的二维码。好友扫码后可看到邀请奖励说明，注册即可领取。',
        tips: '分享到朋友圈或群聊，邀请效率更高。',
      },
      {
        title: '奖励查询',
        content: '在个人中心可查看邀请记录和获得的奖励。显示已邀请人数和累计获得的快乐豆数量。',
        tips: '邀请记录实时更新，好友注册后立即显示。',
      },
    ],
  },
  {
    id: 'subscription',
    title: '订阅会员',
    icon: Crown,
    color: 'amber',
    description: '包月会员权益和付费方式',
    sections: [
      {
        title: '会员权益',
        content: '订阅会员可享受：无限制创建项目、更大存储空间、优先审核、专属客服支持等权益。',
        tips: '会员到期后项目数据保留，可续费继续使用。',
      },
      {
        title: '订阅方式',
        content: '支持扫码包月付费，选择套餐后显示收款二维码，扫码付款上传凭证，管理员审核后自动开通会员。',
        tips: '订阅期间可随时使用所有功能。',
      },
      {
        title: '到期提醒',
        content: '会员到期前系统会发送提醒，到期后自动停止会员权益。可在个人中心查看会员状态和到期时间。',
        tips: '建议提前续费，避免服务中断。',
      },
    ],
  },
];

const faqs = [
  {
    question: '视频无法自动播放？',
    answer: '浏览器限制：非静音视频不能自动播放。请在视频属性中启用"静音"选项，或添加"用户首次点击后播放"的事件。',
    category: '媒体',
  },
  {
    question: '全景背景显示不正确？',
    answer: '请确保使用等距圆柱投影（Equirectangular）格式的360度全景图片或视频。推荐使用 2:1 比例（如 4096×2048）的图片。',
    category: '场景',
  },
  {
    question: '热点位置不对？',
    answer: '切换到3D模式，拖拽热点到正确位置。热点使用yaw（水平角度）和pitch（垂直角度）定位，可在属性面板精确调整数值。',
    category: '元素',
  },
  {
    question: '项目数据丢失？',
    answer: '建议登录账号启用云端同步，防止数据丢失。本地存储清除浏览器数据可能导致项目丢失，云端同步可跨设备访问。',
    category: '保存',
  },
  {
    question: '如何添加背景音乐？',
    answer: '添加音频组件，设置自动播放和循环。注意：浏览器可能限制自动播放音频，建议在用户首次点击后播放，或使用视频代替。',
    category: '媒体',
  },
  {
    question: '图片/视频点击不响应？',
    answer: '视频和图片元素只有在添加事件时才响应点击，否则点击穿透到下层元素。请在事件面板中添加点击事件。',
    category: '事件',
  },
  {
    question: '如何让元素跟随场景旋转？',
    answer: '将元素设为热点的子元素，热点在3D空间定位后，子元素会跟随热点显示。或者使用2D UI叠加模式，元素固定在屏幕位置。',
    category: '元素',
  },
  {
    question: '充值后快乐豆未到账？',
    answer: '请确认已上传付款凭证并等待管理员审核。审核通过后自动到账，可在交易记录中查看状态。如有问题请联系客服。',
    category: '积分',
  },
  {
    question: '邀请好友后没收到奖励？',
    answer: '好友需通过您的邀请链接注册成功后，双方才能获得奖励。请确认好友使用了正确的邀请链接，注册后奖励自动发放。',
    category: '邀请',
  },
  {
    question: '作品审核需要多久？',
    answer: '作品先经AI初审，再人工复核。通常1-3个工作日内完成。审核通过后作品自动公开，并获得快乐豆奖励。',
    category: '发布',
  },
];

export default function TutorialPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="bg-zinc-800/80 backdrop-blur border-b border-zinc-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">CS 互动短剧</h1>
                <p className="text-[10px] text-gray-400">软件教程</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/dashboard"
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                返回仪表盘
              </a>
              <a
                href="/"
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                返回首页
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              软件使用教程
            </span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-2xl mx-auto">
            从入门到精通，学习如何使用 CS 互动短剧编辑器创建沉浸式全景交互体验
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-12">
          {tutorials.map((tutorial) => (
            <a
              key={tutorial.id}
              href={`#${tutorial.id}`}
              className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 hover:border-purple-500/50 transition-colors text-center group"
            >
              <tutorial.icon className={`w-5 h-5 mx-auto mb-1.5 text-${tutorial.color}-400 group-hover:scale-110 transition-transform`} />
              <h3 className="text-[10px] font-medium text-white">{tutorial.title}</h3>
            </a>
          ))}
        </div>

        {/* Tutorials */}
        <div className="space-y-6">
          {tutorials.map((tutorial) => (
            <section
              key={tutorial.id}
              id={tutorial.id}
              className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(tutorial.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-700/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-${tutorial.color}-500/20 rounded-lg flex items-center justify-center`}>
                    <tutorial.icon className={`w-5 h-5 text-${tutorial.color}-400`} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white">{tutorial.title}</h3>
                    <p className="text-[10px] text-zinc-400">{tutorial.description}</p>
                  </div>
                </div>
                {expandedSection === tutorial.id ? (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                )}
              </button>

              {/* Section Content */}
              {expandedSection === tutorial.id && (
                <div className="px-4 pb-4 space-y-3">
                  {tutorial.sections.map((section, index) => (
                    <div
                      key={index}
                      className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700/50"
                    >
                      <h4 className="text-xs font-medium text-white mb-2 flex items-center gap-2">
                        <span className={`w-5 h-5 bg-${tutorial.color}-500/30 rounded flex items-center justify-center text-[10px] text-${tutorial.color}-300`}>
                          {index + 1}
                        </span>
                        {section.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-line mb-2">
                        {section.content}
                      </p>
                      {section.tips && (
                        <div className="flex items-start gap-2 bg-purple-500/10 rounded p-2 mt-2">
                          <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
                          <p className="text-[10px] text-purple-300">{section.tips}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* FAQ */}
        <section className="mt-12 bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">常见问题</h3>
              <p className="text-xs text-zinc-400">解答使用过程中的常见疑问</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-700/50"
              >
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-[9px] px-1.5 py-0.5 bg-zinc-700 rounded text-zinc-300 flex-shrink-0">
                    {faq.category}
                  </span>
                  <h4 className="text-[11px] font-medium text-purple-300">{faq.question}</h4>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section className="mt-12 bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Monitor className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">快捷键</h3>
              <p className="text-xs text-zinc-400">提高编辑效率的键盘快捷方式</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { key: 'Ctrl + S', action: '保存项目' },
              { key: 'Ctrl + Z', action: '撤销操作' },
              { key: 'Ctrl + Y', action: '重做操作' },
              { key: 'Delete', action: '删除选中元素' },
              { key: 'Ctrl + C', action: '复制元素' },
              { key: 'Ctrl + V', action: '粘贴元素' },
              { key: 'Ctrl + D', action: '复制并粘贴元素' },
              { key: 'Escape', action: '取消选择' },
            ].map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-zinc-900/50 rounded-lg p-3 border border-zinc-700/50"
              >
                <span className="text-[11px] text-zinc-300">{shortcut.action}</span>
                <kbd className="text-[10px] bg-zinc-700 px-2 py-1 rounded text-zinc-300 font-mono">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-zinc-400 text-sm mb-4">准备好了吗？开始创作你的第一个互动短剧</p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-6 py-2.5 rounded-lg transition-all"
          >
            <Play className="w-4 h-4" />
            开始创作
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-zinc-500">
            © 2024 CS 互动短剧 · 让每个人都能创作沉浸式互动体验
          </p>
        </div>
      </footer>
    </div>
  );
}
