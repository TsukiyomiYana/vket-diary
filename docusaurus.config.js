import { themes as prismThemes } from 'prism-react-renderer';

const siteTitle = 'Vket 2026 Summer 參展日記';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: siteTitle,
  tagline: '第一次參加 Vket 的小小心得與分享',
  favicon: '/vket-diary/img/icon_Anu_250.webp',

  future: {
    v4: true,
  },

  url: 'https://TsukiyomiYana.github.io',
  baseUrl: '/vket-diary/',
  organizationName: 'TsukiyomiYana',
  projectName: 'vket-diary',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themes: ['docusaurus-plugin-image-zoom'],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        defaultMode: 'dark',
        respectPrefersColorScheme: false,
      },
      zoom: {
        selector: '.markdown img:not([data-nozoom])',
        config: {
          margin: 80,
        },
        background: {
          light: 'rgba(255, 255, 255, 0.9)',
          dark: 'rgba(0, 0, 0, 0.9)',
        },
      },
      navbar: {
        title: siteTitle,
        logo: {
          alt: 'AnuICON',
          src: 'img/icon_Anu_250.webp',
        },
        items: [
          {
            href: 'https://github.com/TsukiyomiYana',
            position: 'right',
            className: 'header-github-link',
            'aria-label': 'GitHub',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `Copyright © ${new Date().getFullYear()} Tsukiyomi Yana / Marns Lin. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
