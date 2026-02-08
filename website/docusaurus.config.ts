import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Spec Graph',
  tagline: 'The minimal specification framework for deterministic system manifestation',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://oco-adam.github.io',
  baseUrl: '/specgraph/',

  organizationName: 'oco-adam',
  projectName: 'specgraph',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/oco-adam/specgraph/tree/main/website/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Spec Graph',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/schemas',
          label: 'Schemas',
          position: 'left',
        },
        {
          href: 'https://github.com/oco-adam/specgraph',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Introduction',
              to: '/docs/introduction',
            },
            {
              label: 'Getting Started',
              to: '/docs/guides/getting-started',
            },
          ],
        },
        {
          title: 'Reference',
          items: [
            {
              label: 'JSON Schemas',
              to: '/docs/reference/json-schemas',
            },
            {
              label: 'Examples',
              to: '/docs/reference/examples',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/oco-adam/specgraph',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Spec Graph Project. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['json', 'bash', 'turtle'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
