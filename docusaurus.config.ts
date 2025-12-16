import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Langfuse 사용 가이드',
  tagline: 'LLM 애플리케이션을 위한 오픈소스 관측성 플랫폼',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://mypalesong.github.io',
  baseUrl: '/langfuse/',

  organizationName: 'mypalesong',
  projectName: 'langfuse',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  i18n: {
    defaultLocale: 'ko',
    locales: ['ko'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/langfuse-social-card.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
    navbar: {
      title: 'Langfuse 가이드',
      logo: {
        alt: 'Langfuse Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: '문서',
        },
        {
          href: 'https://langfuse.com',
          label: 'Langfuse 공식',
          position: 'right',
        },
        {
          href: 'https://github.com/langfuse/langfuse',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '문서',
          items: [
            {
              label: '시작하기',
              to: '/',
            },
            {
              label: '설치 가이드',
              to: '/installation',
            },
          ],
        },
        {
          title: '커뮤니티',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/langfuse/langfuse',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/7NXusRtqYU',
            },
          ],
        },
        {
          title: '리소스',
          items: [
            {
              label: 'Langfuse 공식 문서',
              href: 'https://langfuse.com/docs',
            },
            {
              label: 'API Reference',
              href: 'https://api.reference.langfuse.com',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Langfuse 사용 가이드. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['python', 'bash', 'json', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
