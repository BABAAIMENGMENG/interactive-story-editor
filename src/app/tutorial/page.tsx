import { Metadata } from 'next';
import { BookOpen, Play, Layers, Image, Video, MousePointer, Settings, Save, Share2, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: '软件教程 | CS 互动短剧',
  description: '学习如何使用 CS 互动短剧编辑器创建沉浸式互动体验',
};

const tutorials = [
  {
    id: 'getting-started',
    title: '快速入门',
    icon: Play,
    description: '了解编辑器的基本界面和操作',
    sections: [
      {
        title: '创建项目',
        content: '点击"新建项目"按钮，输入项目名称即可创建一个新的互动短剧项目。支持横屏（16:9）、竖屏（9:16）和正方形（1:1）等多种画布比例。',
      },
      {
        title: '界面布局',
        content: '编辑器分为左右两个区域：左侧是组件库和图层列表，右侧是画布和属性面板。画布用于编辑和预览，属性面板用于调整选中元素的属性。',
      },
      {
        title: '2D/3D 模式',
        content: '2D模式用于编辑UI元素（按钮、文字、图片等），不显示全景背景。3D模式用于编辑全景场景和热点，可添加/编辑3D空间中的交互点。',
      },
    ],
  },
  {
    id: 'scenes',
    title: '场景管理',
    icon: Layers,
    description: '创建和管理互动短剧的场景',
    sections: [
      {
        title: '创建场景',
        content: '点击场景面板的"+"按钮创建新场景。每个场景可以设置全景背景图或视频，支持360度全景格式。',
      },
      {
        title: '场景转场',
        content: '支持8种转场效果：淡入淡出、叠化、滑动、缩放、擦除、翻转、模糊等。在场景属性中选择转场效果和持续时间。',
      },
      {
        title: '场景跳转',
        content: '通过事件系统实现场景跳转。在按钮或其他元素上添加点击事件，选择"跳转场景"动作即可。',
      },
    ],
  },
  {
    id: 'elements',
    title: '添加元素',
    icon: Image,
    description: '在场景中添加各种交互元素',
    sections: [
      {
        title: '基础组件',
        content: '包括图片、视频、音频、按钮、文字、面板等。从左侧组件列表拖拽到画布即可添加。支持PNG透明图片和WebM透明视频。',
      },
      {
        title: '热点控件',
        content: '热点是3D空间中的交互点，只在3D模式下显示和编辑。支持设置3D空间位置（yaw/pitch），预览时与2D UI叠加显示。',
      },
      {
        title: '元素层级',
        content: '图层列表底部 = 画布最上层。通过上下移动按钮调整元素层级。支持父子关系，子元素跟随父元素移动。',
      },
    ],
  },
  {
    id: 'media',
    title: '媒体资源',
    icon: Video,
    description: '管理项目中的图片、视频和音频资源',
    sections: [
      {
        title: '上传资源',
        content: '支持上传图片（PNG/JPG/WebP/GIF）、视频（MP4/WebM）和音频（MP3/WAV）文件。文件大小限制100MB。',
      },
      {
        title: '全景背景',
        content: '支持360度全景图片和视频作为场景背景。在场景属性中设置全景背景，视频默认静音自动播放。',
      },
      {
        title: '透明媒体',
        content: '支持PNG透明图片和WebM透明视频，容器背景强制透明，可以叠加显示在其他元素上方。',
      },
    ],
  },
  {
    id: 'events',
    title: '事件系统',
    icon: MousePointer,
    description: '创建互动逻辑和剧情分支',
    sections: [
      {
        title: '触发方式',
        content: '支持点击、悬停、长按等触发方式。可以为每个元素设置多种事件类型。',
      },
      {
        title: '动作类型',
        content: '支持18种动作：场景控制（跳转、重置）、元素显示（显示/隐藏）、媒体控制（播放/暂停）、属性控制（透明度/音量）、动画效果、流程控制等。',
      },
      {
        title: '视频时间触发',
        content: '视频元素支持时间触发器，在播放到指定时间时自动触发动作（如显示/隐藏元素）。触发前元素自动隐藏。',
      },
    ],
  },
  {
    id: 'saving',
    title: '保存与同步',
    icon: Save,
    description: '项目数据的存储和备份',
    sections: [
      {
        title: '本地存储',
        content: '未登录用户使用浏览器本地存储，容量可达几百MB-几GB。项目自动保存，无需手动操作。',
      },
      {
        title: '云端同步',
        content: '登录后每次保存自动同步到云端，支持跨设备访问。Dashboard显示同步状态和最后同步时间。',
      },
      {
        title: '手动同步',
        content: '点击Dashboard上的"手动同步"按钮，可将所有本地项目同步到云端。',
      },
    ],
  },
  {
    id: 'publishing',
    title: '发布分享',
    icon: Share2,
    description: '发布作品并与他人分享',
    sections: [
      {
        title: '生成分享码',
        content: '保存项目后自动生成唯一的分享码，他人可通过分享码访问你的作品。',
      },
      {
        title: '公开作品',
        content: '将作品设为公开后，会显示在首页作品列表中，支持分类筛选和排序。',
      },
      {
        title: '分享渠道',
        content: '支持微信分享（生成二维码）、QQ分享和复制链接。',
      },
    ],
  },
];

const faqs = [
  {
    question: '视频无法自动播放？',
    answer: '浏览器限制：非静音视频不能自动播放。请在视频属性中启用"静音"选项。',
  },
  {
    question: '全景背景显示不正确？',
    answer: '请确保使用等距圆柱投影（Equirectangular）格式的360度全景图片或视频。',
  },
  {
    question: '热点位置不对？',
    answer: '切换到3D模式，拖拽热点到正确位置。热点使用yaw（水平角度）和pitch（垂直角度）定位。',
  },
  {
    question: '项目数据丢失？',
    answer: '建议登录账号启用云端同步，防止数据丢失。本地存储清除浏览器数据可能导致项目丢失。',
  },
  {
    question: '如何添加背景音乐？',
    answer: '添加音频组件，设置自动播放和循环。注意：浏览器可能限制自动播放音频，建议在用户首次点击后播放。',
  },
];

export default function TutorialPage() {
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
            <a
              href="/"
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              返回首页
            </a>
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
            学习如何使用 CS 互动短剧编辑器，创建沉浸式全景交互体验
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {tutorials.map((tutorial) => (
            <a
              key={tutorial.id}
              href={`#${tutorial.id}`}
              className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:border-purple-500/50 transition-colors text-center"
            >
              <tutorial.icon className="w-6 h-6 mx-auto mb-2 text-purple-400" />
              <h3 className="text-xs font-medium text-white">{tutorial.title}</h3>
            </a>
          ))}
        </div>

        {/* Tutorials */}
        <div className="space-y-8">
          {tutorials.map((tutorial) => (
            <section
              key={tutorial.id}
              id={tutorial.id}
              className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <tutorial.icon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{tutorial.title}</h3>
                  <p className="text-xs text-zinc-400">{tutorial.description}</p>
                </div>
              </div>
              <div className="space-y-4">
                {tutorial.sections.map((section, index) => (
                  <div
                    key={index}
                    className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700/50"
                  >
                    <h4 className="text-sm font-medium text-white mb-2">{section.title}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">{section.content}</p>
                  </div>
                ))}
              </div>
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
          <div className="grid md:grid-cols-2 gap-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700/50"
              >
                <h4 className="text-sm font-medium text-purple-300 mb-2">{faq.question}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{faq.answer}</p>
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
            CS 互动短剧 © {new Date().getFullYear()} - 沉浸式全景交互平台
          </p>
        </div>
      </footer>
    </div>
  );
}
